<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Server-side cart. Guests are identified by an opaque cart token (UUID),
 * signed-in customers by user_id. All prices are read from the database.
 */
class CartService
{
    public function __construct(
        private CouponService $coupons,
        private ShippingService $shipping,
        private SettingsService $settings,
    ) {}

    /**
     * Find (or create) the cart for this request.
     */
    public function resolve(?User $user, ?string $token, bool $create = true): ?Cart
    {
        $tokenCart = $token !== null && Str::isUuid($token)
            ? Cart::query()->where('token', $token)->first()
            : null;

        if ($user === null) {
            if ($tokenCart !== null && $tokenCart->user_id !== null) {
                return $create ? $this->createCart(null) : null;
            }

            return $tokenCart ?? ($create ? $this->createCart(null) : null);
        }

        $userCart = Cart::query()->where('user_id', $user->id)->first();

        if ($tokenCart !== null && $tokenCart->user_id === null && $tokenCart->id !== $userCart?->id) {
            return $this->merge($tokenCart, $user, $userCart);
        }

        return $userCart ?? ($create ? $this->createCart($user) : null);
    }

    /**
     * Move a guest cart into the user's cart, summing quantities (capped by stock).
     */
    public function merge(Cart $guestCart, User $user, ?Cart $userCart): Cart
    {
        return DB::transaction(function () use ($guestCart, $user, $userCart): Cart {
            if ($userCart === null) {
                $guestCart->forceFill(['user_id' => $user->id])->save();

                return $guestCart;
            }

            $guestCart->load('items.variant');
            foreach ($guestCart->items as $item) {
                $existing = $userCart->items()->where('product_variant_id', $item->product_variant_id)->first();
                $quantity = min(
                    ($existing->quantity ?? 0) + $item->quantity,
                    max(0, $item->variant->stock),
                    $this->maxQuantity(),
                );

                if ($quantity > 0) {
                    $userCart->items()->updateOrCreate(['product_variant_id' => $item->product_variant_id], ['quantity' => $quantity]);
                }
            }

            if ($userCart->coupon_code === null && $guestCart->coupon_code !== null) {
                $userCart->forceFill(['coupon_code' => $guestCart->coupon_code])->save();
            }

            $guestCart->delete();

            return $userCart;
        });
    }

    /**
     * @throws ValidationException
     */
    public function addItem(Cart $cart, ProductVariant $variant, int $quantity): CartItem
    {
        $variant->loadMissing('product');
        $this->assertPurchasable($variant);

        $existing = $cart->items()->where('product_variant_id', $variant->id)->first();
        $newQuantity = ($existing->quantity ?? 0) + $quantity;
        $this->assertQuantity($variant, $newQuantity);

        $item = $cart->items()->updateOrCreate(['product_variant_id' => $variant->id], ['quantity' => $newQuantity]);
        $cart->touch();

        return $item;
    }

    /**
     * @throws ValidationException
     */
    public function updateItem(CartItem $item, int $quantity): ?CartItem
    {
        if ($quantity <= 0) {
            $item->delete();

            return null;
        }

        $item->loadMissing('variant.product');
        $this->assertPurchasable($item->variant);
        $this->assertQuantity($item->variant, $quantity);

        $item->update(['quantity' => $quantity]);
        $item->cart->touch();

        return $item;
    }

    /**
     * Apply a coupon code (validated against current cart contents).
     *
     * @throws ValidationException
     */
    public function applyCoupon(Cart $cart, string $code, ?User $user): void
    {
        $coupon = $this->coupons->findByCode($code);
        if ($coupon === null) {
            throw ValidationException::withMessages(['coupon_code' => 'This coupon code is invalid.']);
        }

        $lines = $this->lines($cart)['lines'];
        $subtotal = array_sum(array_column($lines, 'line_total'));
        $this->coupons->discountFor($coupon, $lines, $subtotal, $user, $user?->email);

        $cart->forceFill(['coupon_code' => $coupon->code])->save();
    }

    public function removeCoupon(Cart $cart): void
    {
        $cart->forceFill(['coupon_code' => null])->save();
    }

    /**
     * Current cart lines with live prices. Unavailable lines are reported in `issues`.
     *
     * @return array{lines: list<array{item: CartItem, variant: ProductVariant, quantity: int, unit_price: int, line_total: int}>, issues: list<array{item_id: int, message: string}>}
     */
    public function lines(Cart $cart): array
    {
        $cart->loadMissing(['items.variant.product.primaryImage']);

        $lines = [];
        $issues = [];
        foreach ($cart->items as $item) {
            $variant = $item->variant;

            if (! $variant->isPurchasable()) {
                $issues[] = ['item_id' => $item->id, 'message' => "{$variant->product->name} is no longer available."];

                continue;
            }
            if ($variant->stock < $item->quantity) {
                $issues[] = ['item_id' => $item->id, 'message' => $variant->stock > 0
                    ? "Only {$variant->stock} left of {$variant->product->name}."
                    : "{$variant->product->name} is out of stock."];
            }

            $unitPrice = $variant->unitPrice();
            $lines[] = [
                'item' => $item,
                'variant' => $variant,
                'quantity' => $item->quantity,
                'unit_price' => $unitPrice,
                'line_total' => $unitPrice * $item->quantity,
            ];
        }

        return ['lines' => $lines, 'issues' => $issues];
    }

    /**
     * Full server-computed summary used by both the cart and checkout screens.
     *
     * @return array{lines: list<array<string, mixed>>, issues: list<array{item_id: int, message: string}>, coupon_code: ?string, coupon_error: ?string, subtotal: int, discount_total: int, shipping_total: int, tax_total: int, grand_total: int, item_count: int, max_quantity: int}
     */
    public function summary(Cart $cart, ?User $user, ?string $shippingMethod = null, ?string $email = null): array
    {
        ['lines' => $lines, 'issues' => $issues] = $this->lines($cart);
        $subtotal = array_sum(array_column($lines, 'line_total'));

        $discount = 0;
        $couponError = null;
        if ($cart->coupon_code !== null) {
            $coupon = $this->coupons->findByCode($cart->coupon_code);
            try {
                $discount = $coupon === null
                    ? throw ValidationException::withMessages(['coupon_code' => 'This coupon code is invalid.'])
                    : $this->coupons->discountFor($coupon, $lines, $subtotal, $user, $email ?? $user?->email);
            } catch (ValidationException $e) {
                $couponError = $e->validator->errors()->first('coupon_code');
            }
        }

        $shippingTotal = $lines === [] ? 0 : $this->shipping->quote($shippingMethod, $subtotal - $discount);
        $taxTotal = $this->tax($subtotal - $discount);

        return [
            'lines' => $lines,
            'issues' => $issues,
            'coupon_code' => $cart->coupon_code,
            'coupon_error' => $couponError,
            'subtotal' => $subtotal,
            'discount_total' => $discount,
            'shipping_total' => $shippingTotal,
            'tax_total' => $taxTotal,
            'grand_total' => $subtotal - $discount + $shippingTotal + $taxTotal,
            'item_count' => array_sum(array_column($lines, 'quantity')),
            'max_quantity' => $this->maxQuantity(),
        ];
    }

    /**
     * Tax added on top of prices (0 when prices already include tax).
     */
    public function tax(int $taxableAmount): int
    {
        if ((bool) $this->settings->get('tax.prices_include_tax', true)) {
            return 0;
        }

        $rate = (float) $this->settings->get('tax.rate_percent', 0);

        return (int) round(max(0, $taxableAmount) * $rate / 100);
    }

    public function maxQuantity(): int
    {
        return (int) $this->settings->get('checkout.max_quantity_per_item', 10);
    }

    private function createCart(?User $user): Cart
    {
        return Cart::query()->create(['token' => (string) Str::uuid(), 'user_id' => $user?->id]);
    }

    /**
     * @throws ValidationException
     */
    private function assertPurchasable(ProductVariant $variant): void
    {
        if (! $variant->isPurchasable()) {
            throw ValidationException::withMessages(['variant_id' => 'This product is not available.']);
        }
    }

    /**
     * @throws ValidationException
     */
    private function assertQuantity(ProductVariant $variant, int $quantity): void
    {
        if ($quantity > $this->maxQuantity()) {
            throw ValidationException::withMessages(['quantity' => "You can order up to {$this->maxQuantity()} of each item."]);
        }
        if ($quantity > $variant->stock) {
            throw ValidationException::withMessages(['quantity' => $variant->stock > 0
                ? "Only {$variant->stock} in stock."
                : 'This item is out of stock.']);
        }
    }
}
