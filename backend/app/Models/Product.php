<?php

namespace App\Models;

use App\Enums\ProductStatus;
use Database\Factories\ProductFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Money attributes (price, sale_price) are integer minor units (paisa).
 */
#[Fillable([
    'category_id', 'name', 'slug', 'sku', 'brand', 'short_description', 'description',
    'details', 'fabric', 'pieces', 'price', 'sale_price', 'status', 'is_featured',
    'low_stock_threshold', 'meta_title', 'meta_description', 'published_at',
])]
class Product extends Model
{
    /** @use HasFactory<ProductFactory> */
    use HasFactory, SoftDeletes;

    /** Images sent with each product card for the hover slideshow. */
    public const CARD_IMAGE_LIMIT = 4;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'details' => 'array',
            'price' => 'integer',
            'sale_price' => 'integer',
            'pieces' => 'integer',
            'status' => ProductStatus::class,
            'is_featured' => 'boolean',
            'low_stock_threshold' => 'integer',
            'sales_count' => 'integer',
            'published_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Category, $this> */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class)->withTrashed();
    }

    /** @return HasMany<ProductImage, $this> */
    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    /** @return HasOne<ProductImage, $this> */
    public function primaryImage(): HasOne
    {
        return $this->hasOne(ProductImage::class)->ofMany(['sort_order' => 'min', 'id' => 'min']);
    }

    /** @return HasMany<ProductVariant, $this> */
    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class)->orderBy('sort_order');
    }

    /**
     * Products visible on the storefront.
     *
     * @param  Builder<Product>  $query
     */
    #[Scope]
    protected function visible(Builder $query): void
    {
        $query->where('status', ProductStatus::Active)
            ->where(fn (Builder $q) => $q->whereNull('published_at')->orWhere('published_at', '<=', now()));
    }

    /**
     * Everything a product card needs without loading all variants:
     * primary image, the first few images for the hover slideshow, category,
     * stock flag, active variant count and the default variant id.
     *
     * @param  Builder<Product>  $query
     */
    #[Scope]
    protected function withCardData(Builder $query): void
    {
        $active = fn (Builder $q) => $q->where('is_active', true);

        $query->with([
            'primaryImage',
            'images' => fn (HasMany $q) => $q->orderBy('id')->limit(self::CARD_IMAGE_LIMIT),
            'category',
        ])
            ->withExists(['variants as in_stock' => fn (Builder $q) => $active($q)->where('stock', '>', 0)])
            ->withCount(['variants as variants_count' => $active])
            ->addSelect(['default_variant_id' => ProductVariant::query()
                ->select('id')
                ->whereColumn('product_variants.product_id', 'products.id')
                ->where('is_active', true)
                ->whereNull('deleted_at')
                ->orderByDesc('stock')
                ->orderBy('sort_order')
                ->orderBy('id')
                ->limit(1)]);
    }

    /**
     * Price the customer pays (sale price when lower than regular).
     */
    public function effectivePrice(): int
    {
        return $this->sale_price !== null && $this->sale_price < $this->price ? $this->sale_price : $this->price;
    }

    public function isOnSale(): bool
    {
        return $this->effectivePrice() < $this->price;
    }

    public function isPurchasable(): bool
    {
        return $this->status === ProductStatus::Active && ! $this->trashed();
    }
}
