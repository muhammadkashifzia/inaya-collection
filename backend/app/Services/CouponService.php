<?php

namespace App\Services;

use App\Enums\CouponType;
use App\Models\Coupon;
use App\Models\CouponUsage;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Validation\ValidationException;

/**
 * Validates coupons and computes discounts. All amounts are minor units.
 */
class CouponService
{
    public function findByCode(string $code, bool $lockForUpdate = false): ?Coupon
    {
        $query = Coupon::query()->with(['products:id', 'categories:id'])->where('code', strtoupper(trim($code)));

        return $lockForUpdate ? $query->lockForUpdate()->first() : $query->first();
    }

    /**
     * Validate the coupon against the given lines and return the discount.
     *
     * @param  list<array{variant: ProductVariant, quantity: int, line_total: int}>  $lines
     *
     * @throws ValidationException
     */
    public function discountFor(Coupon $coupon, array $lines, int $subtotal, ?User $user, ?string $email): int
    {
        $fail = fn (string $message) => throw ValidationException::withMessages(['coupon_code' => $message]);

        if (! $coupon->is_active || $coupon->trashed()) {
            $fail('This coupon is not active.');
        }
        if ($coupon->starts_at !== null && $coupon->starts_at->isFuture()) {
            $fail('This coupon is not active yet.');
        }
        if ($coupon->expires_at !== null && $coupon->expires_at->isPast()) {
            $fail('This coupon has expired.');
        }
        if ($coupon->usage_limit !== null && $coupon->used_count >= $coupon->usage_limit) {
            $fail('This coupon has reached its usage limit.');
        }
        if ($coupon->per_customer_limit !== null && ($user !== null || $email !== null)) {
            $used = CouponUsage::query()
                ->where('coupon_id', $coupon->id)
                ->where(function ($q) use ($user, $email): void {
                    if ($user !== null) {
                        $q->orWhere('user_id', $user->id);
                    }
                    if ($email !== null) {
                        $q->orWhere('email', strtolower($email));
                    }
                })
                ->count();

            if ($used >= $coupon->per_customer_limit) {
                $fail('You have already used this coupon.');
            }
        }
        if ($subtotal < $coupon->min_order_amount) {
            $fail('Minimum order of Rs. '.number_format($coupon->min_order_amount / 100).' required for this coupon.');
        }

        $eligible = $this->eligibleSubtotal($coupon, $lines);
        if ($eligible <= 0) {
            $fail('This coupon does not apply to the items in your cart.');
        }

        $discount = match ($coupon->type) {
            CouponType::Percentage => intdiv($eligible * min($coupon->value, 100), 100),
            CouponType::Fixed => $coupon->value,
        };

        if ($coupon->max_discount_amount !== null) {
            $discount = min($discount, $coupon->max_discount_amount);
        }

        return max(0, min($discount, $eligible));
    }

    /**
     * Subtotal of lines matching the coupon's product/category restrictions.
     *
     * @param  list<array{variant: ProductVariant, quantity: int, line_total: int}>  $lines
     */
    private function eligibleSubtotal(Coupon $coupon, array $lines): int
    {
        $productIds = $coupon->products->pluck('id')->all();
        $categoryIds = $coupon->categories->pluck('id')->all();

        if ($productIds === [] && $categoryIds === []) {
            return array_sum(array_column($lines, 'line_total'));
        }

        $total = 0;
        foreach ($lines as $line) {
            $product = $line['variant']->product;
            if (in_array($product->id, $productIds, true) || in_array($product->category_id, $categoryIds, true)) {
                $total += $line['line_total'];
            }
        }

        return $total;
    }
}
