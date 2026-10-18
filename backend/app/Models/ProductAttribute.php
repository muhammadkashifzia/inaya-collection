<?php

namespace App\Models;

use Database\Factories\ProductAttributeFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Variant attribute such as Color or Size. The slug matches the key used in
 * product_variants.options, so existing variant data keeps working.
 */
#[Fillable(['name', 'slug', 'sort_order'])]
class ProductAttribute extends Model
{
    /** @use HasFactory<ProductAttributeFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['sort_order' => 'integer'];
    }

    /** @return HasMany<ProductAttributeValue, $this> */
    public function values(): HasMany
    {
        return $this->hasMany(ProductAttributeValue::class)->orderBy('sort_order')->orderBy('id');
    }
}
