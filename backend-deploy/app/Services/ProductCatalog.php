<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Product;
use App\Support\Money;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Query\Expression;
use Illuminate\Support\Facades\DB;

/**
 * Builds filtered/sorted product queries for the storefront and admin.
 */
class ProductCatalog
{
    public const SORTS = ['latest', 'price_asc', 'price_desc', 'popularity', 'name', 'featured'];

    /**
     * Storefront query: only visible products, with card relations loaded.
     *
     * @param  array<string, mixed>  $filters
     * @return Builder<Product>
     */
    public function storefront(array $filters): Builder
    {
        $query = Product::query()->select('products.*')->visible()->withCardData();

        return $this->applySort($this->applyFilters($query, $filters), $filters['sort'] ?? 'featured');
    }

    /**
     * Admin query: every status, optionally trashed.
     *
     * @param  array<string, mixed>  $filters
     * @return Builder<Product>
     */
    public function admin(array $filters): Builder
    {
        $query = Product::query()->with(['primaryImage', 'category', 'variants']);

        if (($filters['trashed'] ?? null) === 'only') {
            $query->onlyTrashed();
        } elseif (($filters['trashed'] ?? null) === 'with') {
            $query->withTrashed();
        }
        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (($filters['low_stock'] ?? false) === true) {
            $query->whereHas('variants', fn (Builder $q) => $q->whereColumn('product_variants.stock', '<=', 'products.low_stock_threshold'));
        }

        return $this->applySort($this->applyFilters($query, $filters), $filters['sort'] ?? 'latest');
    }

    public function effectivePriceExpression(): Expression
    {
        return DB::raw('(CASE WHEN products.sale_price IS NOT NULL AND products.sale_price < products.price THEN products.sale_price ELSE products.price END)');
    }

    /**
     * @param  Builder<Product>  $query
     * @param  array<string, mixed>  $filters
     * @return Builder<Product>
     */
    private function applyFilters(Builder $query, array $filters): Builder
    {
        if (! empty($filters['category']) && $filters['category'] !== 'all') {
            $category = Category::query()->where('slug', $filters['category'])->first();
            $query->whereIn('category_id', $category?->selfAndDescendantIds() ?? [0]);
        }

        if (! empty($filters['q'])) {
            $term = '%'.str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], (string) $filters['q']).'%';
            $query->where(fn (Builder $q) => $q
                ->where('products.name', 'like', $term)
                ->orWhere('products.sku', 'like', $term)
                ->orWhere('products.fabric', 'like', $term)
                ->orWhereHas('variants', fn (Builder $v) => $v->where('sku', 'like', $term)->orWhere('name', 'like', $term)));
        }

        foreach (['brand', 'fabric'] as $column) {
            if (! empty($filters[$column])) {
                $query->whereIn("products.{$column}", (array) $filters[$column]);
            }
        }
        if (! empty($filters['pieces'])) {
            $query->where('products.pieces', (int) $filters['pieces']);
        }

        $price = $this->effectivePriceExpression();
        if (isset($filters['min_price'])) {
            $query->where($price, '>=', Money::toMinor($filters['min_price']));
        }
        if (isset($filters['max_price'])) {
            $query->where($price, '<=', Money::toMinor($filters['max_price']));
        }

        if (($filters['availability'] ?? null) === 'in_stock') {
            $query->whereHas('variants', fn (Builder $q) => $q->where('is_active', true)->where('stock', '>', 0));
        } elseif (($filters['availability'] ?? null) === 'out_of_stock') {
            $query->whereDoesntHave('variants', fn (Builder $q) => $q->where('is_active', true)->where('stock', '>', 0));
        }

        if (($filters['on_sale'] ?? false) === true) {
            $query->whereNotNull('products.sale_price')->whereColumn('products.sale_price', '<', 'products.price');
        }
        if (($filters['featured'] ?? false) === true) {
            $query->where('products.is_featured', true);
        }

        return $query;
    }

    /**
     * @param  Builder<Product>  $query
     * @return Builder<Product>
     */
    private function applySort(Builder $query, string $sort): Builder
    {
        return match ($sort) {
            'price_asc' => $query->orderBy($this->effectivePriceExpression())->orderBy('products.id'),
            'price_desc' => $query->orderByDesc($this->effectivePriceExpression())->orderBy('products.id'),
            'popularity' => $query->orderByDesc('products.sales_count')->orderByDesc('products.id'),
            'name' => $query->orderBy('products.name'),
            'featured' => $query->orderByDesc('products.is_featured')->orderByDesc('products.published_at')->orderByDesc('products.id'),
            default => $query->orderByDesc('products.published_at')->orderByDesc('products.id'),
        };
    }
}
