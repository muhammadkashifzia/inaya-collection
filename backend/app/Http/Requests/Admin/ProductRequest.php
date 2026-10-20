<?php

namespace App\Http\Requests\Admin;

use App\Enums\Permission;
use App\Enums\ProductStatus;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Prices are submitted in major units (rupees) and converted to minor units.
 * Stock is only set for NEW variants (initial stock); existing stock changes
 * go through the inventory adjustment endpoint.
 */
class ProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission(Permission::ManageProducts) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var Product|null $product */
        $product = $this->route('product');

        return self::rulesFor($product);
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(fn (Validator $v) => self::checkVariants($v, $this->all()));
    }

    /**
     * Rules shared by the product form and the CSV import.
     *
     * @return array<string, mixed>
     */
    public static function rulesFor(?Product $product): array
    {
        $variantIds = $product?->variants()->pluck('id')->all() ?? [];

        return [
            'category_id' => ['required', 'integer', Rule::exists('categories', 'id')->whereNull('deleted_at')],
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'alpha_dash', Rule::unique('products', 'slug')->ignore($product?->id)],
            'sku' => ['required', 'string', 'max:64', 'alpha_dash', Rule::unique('products', 'sku')->ignore($product?->id)],
            'brand' => ['nullable', 'string', 'max:100'],
            'short_description' => ['nullable', 'string', 'max:1000'],
            'description' => ['nullable', 'string', 'max:20000'],
            'details' => ['nullable', 'array', 'max:30'],
            'details.*' => ['string', 'max:255'],
            'fabric' => ['nullable', 'string', 'max:60'],
            'pieces' => ['nullable', 'integer', 'min:1', 'max:10'],
            'price' => ['required', 'numeric', 'min:0', 'max:10000000'],
            'sale_price' => ['nullable', 'numeric', 'min:0', 'lt:price'],
            'status' => ['required', Rule::enum(ProductStatus::class)],
            'is_featured' => ['nullable', 'boolean'],
            'low_stock_threshold' => ['nullable', 'integer', 'min:0', 'max:100000'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'published_at' => ['nullable', 'date'],
            'tag_ids' => ['nullable', 'array', 'max:30'],
            'tag_ids.*' => ['integer', 'distinct', Rule::exists('tags', 'id')],

            'variants' => ['required', 'array', 'min:1', 'max:100'],
            'variants.*.id' => ['nullable', 'integer', Rule::in($variantIds)],
            'variants.*.sku' => ['required', 'string', 'max:64', 'alpha_dash', 'distinct'],
            'variants.*.name' => ['required', 'string', 'max:120'],
            'variants.*.options' => ['nullable', 'array', 'max:5'],
            'variants.*.options.*' => ['string', 'max:60'],
            'variants.*.price' => ['nullable', 'numeric', 'min:0', 'max:10000000'],
            'variants.*.sale_price' => ['nullable', 'numeric', 'min:0'],
            'variants.*.stock' => ['nullable', 'integer', 'min:0', 'max:1000000'],
            'variants.*.is_active' => ['nullable', 'boolean'],
        ];
    }

    /**
     * Variant SKU uniqueness (including soft-deleted rows) and sale price checks.
     *
     * @param  array<string, mixed>  $input
     */
    public static function checkVariants(Validator $v, array $input): void
    {
        foreach ((array) ($input['variants'] ?? []) as $i => $variant) {
            $query = ProductVariant::withTrashed()->where('sku', $variant['sku'] ?? '');
            if (! empty($variant['id'])) {
                $query->whereKeyNot($variant['id']);
            }
            if ($query->exists()) {
                $v->errors()->add("variants.{$i}.sku", 'This variant SKU is already in use.');
            }

            $price = $variant['price'] ?? ($input['price'] ?? null);
            if (isset($variant['sale_price']) && $price !== null && (float) $variant['sale_price'] >= (float) $price) {
                $v->errors()->add("variants.{$i}.sale_price", 'Sale price must be lower than the price.');
            }
        }
    }
}
