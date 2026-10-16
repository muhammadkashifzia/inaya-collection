<?php

namespace App\Http\Resources;

use App\Models\Product;
use App\Support\Money;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Product card + detail payload. Detail-only fields appear when the
 * corresponding relations are loaded.
 *
 * @mixin Product
 */
class ProductResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $variants = $this->whenLoaded('variants');
        $inStock = $this->relationLoaded('variants')
            ? $this->variants->contains(fn ($v): bool => $v->is_active && $v->stock > 0)
            : (bool) ($this->resource->getAttributes()['in_stock'] ?? false);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'sku' => $this->sku,
            'brand' => $this->brand,
            'short_description' => $this->short_description,
            'description' => $this->description,
            'details' => $this->details ?? [],
            'fabric' => $this->fabric,
            'pieces' => $this->pieces,
            'price' => Money::toMajor($this->price),
            'sale_price' => $this->isOnSale() ? Money::toMajor($this->effectivePrice()) : null,
            'sale_price_raw' => $this->when($request->user()?->isStaffMember() ?? false, fn () => Money::toMajor($this->sale_price)),
            'is_on_sale' => $this->isOnSale(),
            'discount_percent' => $this->isOnSale() ? (int) round(($this->price - $this->effectivePrice()) / $this->price * 100) : 0,
            'status' => $this->status,
            'is_available' => $this->isPurchasable() && $inStock,
            'in_stock' => $inStock,
            'is_featured' => $this->is_featured,
            'low_stock_threshold' => $this->low_stock_threshold,
            'sales_count' => $this->when($request->user()?->isStaffMember() ?? false, $this->sales_count),
            'total_stock' => $this->when(
                ($request->user()?->isStaffMember() ?? false) && $this->relationLoaded('variants'),
                fn () => $this->variants->sum('stock'),
            ),
            'default_variant_id' => $this->relationLoaded('variants')
                ? $this->variants->first(fn ($v): bool => $v->is_active && $v->stock > 0)?->id ?? $this->variants->first()?->id
                : ($this->resource->getAttributes()['default_variant_id'] ?? null),
            'variants_count' => $this->relationLoaded('variants')
                ? $this->variants->where('is_active', true)->count()
                : (int) ($this->resource->getAttributes()['variants_count'] ?? 0),
            'image' => $this->relationLoaded('primaryImage') && $this->primaryImage ? $this->primaryImage->url() : null,
            'images' => ProductImageResource::collection($this->whenLoaded('images')),
            'category' => new CategoryResource($this->whenLoaded('category')),
            'variants' => ProductVariantResource::collection($variants),
            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,
            'published_at' => $this->published_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'deleted_at' => $this->when($request->user()?->isStaffMember() ?? false, $this->deleted_at),
        ];
    }
}
