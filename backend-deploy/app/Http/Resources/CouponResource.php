<?php

namespace App\Http\Resources;

use App\Enums\CouponType;
use App\Models\Coupon;
use App\Support\Money;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Coupon */
class CouponResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'description' => $this->description,
            'type' => $this->type,
            'value' => $this->type === CouponType::Percentage ? $this->value : Money::toMajor($this->value),
            'min_order_amount' => Money::toMajor($this->min_order_amount),
            'max_discount_amount' => Money::toMajor($this->max_discount_amount),
            'starts_at' => $this->starts_at,
            'expires_at' => $this->expires_at,
            'usage_limit' => $this->usage_limit,
            'per_customer_limit' => $this->per_customer_limit,
            'used_count' => $this->used_count,
            'is_active' => $this->is_active,
            'product_ids' => $this->whenLoaded('products', fn () => $this->products->pluck('id')),
            'category_ids' => $this->whenLoaded('categories', fn () => $this->categories->pluck('id')),
            'created_at' => $this->created_at,
        ];
    }
}
