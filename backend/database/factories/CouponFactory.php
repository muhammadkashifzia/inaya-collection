<?php

namespace Database\Factories;

use App\Enums\CouponType;
use App\Models\Coupon;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Coupon>
 */
class CouponFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => 'SAVE'.strtoupper(Str::random(6)),
            'type' => CouponType::Percentage,
            'value' => 10,
            'min_order_amount' => 0,
            'max_discount_amount' => null,
            'starts_at' => null,
            'expires_at' => null,
            'usage_limit' => null,
            'per_customer_limit' => null,
            'is_active' => true,
        ];
    }

    public function fixed(int $minorAmount): static
    {
        return $this->state(fn (): array => ['type' => CouponType::Fixed, 'value' => $minorAmount]);
    }
}
