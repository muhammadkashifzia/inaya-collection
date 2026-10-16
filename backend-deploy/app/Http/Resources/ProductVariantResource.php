<?php

namespace App\Http\Resources;

use App\Models\ProductVariant;
use App\Support\Money;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Exact stock numbers are only shown to staff; customers see availability.
 *
 * @mixin ProductVariant
 */
class ProductVariantResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $isStaff = $request->user()?->isStaffMember() ?? false;
        $hasProduct = $this->relationLoaded('product');

        return [
            'id' => $this->id,
            'sku' => $this->sku,
            'name' => $this->name,
            'options' => $this->options ?? (object) [],
            'price' => $hasProduct ? Money::toMajor($this->regularPrice()) : Money::toMajor($this->price),
            'sale_price' => $hasProduct
                ? ($this->unitPrice() < $this->regularPrice() ? Money::toMajor($this->unitPrice()) : null)
                : Money::toMajor($this->sale_price),
            'price_override' => $this->when($isStaff, fn () => Money::toMajor($this->price)),
            'sale_price_override' => $this->when($isStaff, fn () => Money::toMajor($this->sale_price)),
            'in_stock' => $this->stock > 0 && $this->is_active,
            'stock' => $this->when($isStaff, $this->stock),
            'low_stock' => $this->stock > 0 && $hasProduct && $this->stock <= $this->product->low_stock_threshold,
            'is_active' => $this->is_active,
            'sort_order' => $this->sort_order,
        ];
    }
}
