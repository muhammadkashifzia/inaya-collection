<?php

namespace App\Models;

use Database\Factories\ProductVariantFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * `stock` is not fillable; it only changes through InventoryService so
 * every change is recorded as an InventoryMovement.
 */
#[Fillable(['product_id', 'sku', 'name', 'options', 'price', 'sale_price', 'is_active', 'sort_order'])]
class ProductVariant extends Model
{
    /** @use HasFactory<ProductVariantFactory> */
    use HasFactory, SoftDeletes;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'options' => 'array',
            'price' => 'integer',
            'sale_price' => 'integer',
            'stock' => 'integer',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /** @return BelongsTo<Product, $this> */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class)->withTrashed();
    }

    /** @return HasMany<InventoryMovement, $this> */
    public function inventoryMovements(): HasMany
    {
        return $this->hasMany(InventoryMovement::class);
    }

    /**
     * Regular price: the variant override, else the product price.
     */
    public function regularPrice(): int
    {
        return $this->price ?? $this->product->price;
    }

    /**
     * Price the customer pays for one unit.
     */
    public function unitPrice(): int
    {
        $regular = $this->regularPrice();
        $sale = $this->price !== null ? $this->sale_price : $this->product->sale_price;

        return $sale !== null && $sale < $regular ? $sale : $regular;
    }

    public function isPurchasable(): bool
    {
        return $this->is_active && ! $this->trashed() && $this->product->isPurchasable();
    }

    public function displayName(): ?string
    {
        return $this->name === 'Default' ? null : $this->name;
    }
}
