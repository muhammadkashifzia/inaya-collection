<?php

namespace App\Services;

use App\Enums\InventoryReason;
use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Cart;
use App\Models\CouponUsage;
use App\Models\Order;
use App\Models\ProductVariant;
use App\Models\User;
use App\Payments\PaymentManager;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Turns a cart into an order. Prices, discounts, shipping and totals are
 * recomputed from the database inside a single transaction with row locks
 * on the variants and coupon, so concurrent checkouts cannot oversell.
 */
class CheckoutService
{
    public function __construct(
        private CartService $carts,
        private CouponService $coupons,
        private ShippingService $shipping,
        private InventoryService $inventory,
        private PaymentManager $payments,
        private SettingsService $settings,
        private OrderMailer $mailer,
    ) {}

    /**
     * @param  array{customer_name: string, email: string, phone: string, shipping_address: array<string, mixed>, billing_address: array<string, mixed>, shipping_method: string, payment_method: string, customer_note?: ?string}  $data
     *
     * @throws ValidationException
     */
    public function placeOrder(Cart $cart, ?User $user, array $data, string $idempotencyKey): Order
    {
        $existing = $this->findExisting($idempotencyKey, $user, $data['email']);
        if ($existing !== null) {
            return $existing;
        }

        $paymentMethod = PaymentMethod::from($data['payment_method']);
        $this->assertPaymentMethodEnabled($paymentMethod);

        try {
            return DB::transaction(fn (): Order => $this->createOrder($cart, $user, $data, $idempotencyKey, $paymentMethod));
        } catch (UniqueConstraintViolationException $e) {
            // A concurrent request with the same idempotency key won the race.
            return $this->findExisting($idempotencyKey, $user, $data['email']) ?? throw $e;
        }
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function createOrder(Cart $cart, ?User $user, array $data, string $idempotencyKey, PaymentMethod $paymentMethod): Order
    {
        $items = $cart->items()->get();
        if ($items->isEmpty()) {
            throw ValidationException::withMessages(['cart' => 'Your cart is empty.']);
        }

        // Lock variants in a stable order to avoid deadlocks.
        $variants = ProductVariant::withTrashed()
            ->with(['product' => fn ($q) => $q->withTrashed()->with('primaryImage')])
            ->whereIn('id', $items->pluck('product_variant_id')->sort()->values())
            ->orderBy('id')
            ->lockForUpdate()
            ->get()
            ->keyBy('id');

        $lines = [];
        $errors = [];
        foreach ($items as $item) {
            $variant = $variants->get($item->product_variant_id);
            $name = $variant?->product->name ?? 'An item';

            if ($variant === null || ! $variant->isPurchasable()) {
                $errors[] = "{$name} is no longer available.";

                continue;
            }
            if ($variant->stock < $item->quantity) {
                $errors[] = $variant->stock > 0 ? "Only {$variant->stock} left of {$name}." : "{$name} is out of stock.";

                continue;
            }

            $unitPrice = $variant->unitPrice();
            $lines[] = [
                'variant' => $variant,
                'quantity' => $item->quantity,
                'unit_price' => $unitPrice,
                'line_total' => $unitPrice * $item->quantity,
            ];
        }

        if ($errors !== []) {
            throw ValidationException::withMessages(['cart' => $errors]);
        }

        $subtotal = array_sum(array_column($lines, 'line_total'));

        $coupon = null;
        $discount = 0;
        if ($cart->coupon_code !== null) {
            $coupon = $this->coupons->findByCode($cart->coupon_code, lockForUpdate: true);
            if ($coupon === null) {
                throw ValidationException::withMessages(['coupon_code' => 'This coupon code is invalid.']);
            }
            $discount = $this->coupons->discountFor($coupon, $lines, $subtotal, $user, $data['email']);
        }

        $shippingTotal = $this->shipping->quote($data['shipping_method'], $subtotal - $discount);
        $taxTotal = $this->carts->tax($subtotal - $discount);
        $grandTotal = $subtotal - $discount + $shippingTotal + $taxTotal;

        $codLimit = $this->settings->get('payments.cod_max_order_amount');
        if ($paymentMethod === PaymentMethod::CashOnDelivery && $codLimit !== null && $grandTotal > (int) $codLimit) {
            throw ValidationException::withMessages(['payment_method' => 'Cash on Delivery is not available for this order amount.']);
        }

        $order = Order::query()->create([
            'number' => $this->generateNumber(),
            'user_id' => $user?->id,
            'customer_name' => $data['customer_name'],
            'email' => strtolower($data['email']),
            'phone' => $data['phone'],
            'status' => OrderStatus::Pending,
            'payment_status' => PaymentStatus::Pending,
            'payment_method' => $paymentMethod,
            'shipping_method' => $data['shipping_method'],
            'subtotal' => $subtotal,
            'discount_total' => $discount,
            'shipping_total' => $shippingTotal,
            'tax_total' => $taxTotal,
            'grand_total' => $grandTotal,
            'currency' => (string) $this->settings->get('localization.currency', 'PKR'),
            'coupon_id' => $coupon?->id,
            'coupon_code' => $coupon?->code,
            'shipping_address' => $data['shipping_address'],
            'billing_address' => $data['billing_address'],
            'customer_note' => $data['customer_note'] ?? null,
            'idempotency_key' => $idempotencyKey,
            'placed_at' => now(),
        ]);

        foreach ($lines as $line) {
            /** @var ProductVariant $variant */
            $variant = $line['variant'];
            $order->items()->create([
                'product_id' => $variant->product_id,
                'product_variant_id' => $variant->id,
                'product_name' => $variant->product->name,
                'variant_name' => $variant->displayName(),
                'sku' => $variant->sku,
                'image' => $variant->product->primaryImage?->path,
                'unit_price' => $line['unit_price'],
                'quantity' => $line['quantity'],
                'line_total' => $line['line_total'],
            ]);

            $this->inventory->adjust($variant, -$line['quantity'], InventoryReason::Sale, null, $order->id, "Order {$order->number}");
            $variant->product->increment('sales_count', $line['quantity']);
        }

        if ($coupon !== null) {
            CouponUsage::query()->create([
                'coupon_id' => $coupon->id,
                'user_id' => $user?->id,
                'email' => strtolower($data['email']),
                'order_id' => $order->id,
                'discount_amount' => $discount,
            ]);
            $coupon->increment('used_count');
        }

        $this->payments->for($paymentMethod)->initiate($order);

        $order->statusHistory()->create([
            'user_id' => $user?->id,
            'from_status' => null,
            'to_status' => OrderStatus::Pending,
            'note' => 'Order placed',
        ]);

        $cart->items()->delete();
        $cart->forceFill(['coupon_code' => null])->save();

        $this->mailer->sendForStatus($order, OrderStatus::Pending);

        return $order->load(['items', 'payments', 'statusHistory']);
    }

    /**
     * Same idempotency key from the same customer returns the original order.
     */
    private function findExisting(string $idempotencyKey, ?User $user, string $email): ?Order
    {
        $order = Order::query()->where('idempotency_key', $idempotencyKey)->first();
        if ($order === null) {
            return null;
        }

        $sameCustomer = $user !== null ? $order->user_id === $user->id : strcasecmp($order->email, $email) === 0;
        if (! $sameCustomer) {
            throw ValidationException::withMessages(['idempotency_key' => 'This checkout request has already been used.']);
        }

        return $order->load(['items', 'payments', 'statusHistory']);
    }

    private function assertPaymentMethodEnabled(PaymentMethod $method): void
    {
        $enabled = match ($method) {
            PaymentMethod::CashOnDelivery => (bool) $this->settings->get('payments.cod_enabled', true),
        };

        if (! $enabled) {
            throw ValidationException::withMessages(['payment_method' => 'This payment method is not available.']);
        }
    }

    private function generateNumber(): string
    {
        do {
            $number = 'GW-'.now()->format('ymd').'-'.strtoupper(Str::random(5));
        } while (Order::query()->where('number', $number)->exists());

        return $number;
    }
}
