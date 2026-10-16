<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<ProductVariant>
 */
class ProductVariantFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'sku' => 'GWV-'.strtoupper(Str::random(10)),
            'name' => 'Default',
            'options' => null,
            'price' => null,
            'sale_price' => null,
            'is_active' => true,
            'sort_order' => 0,
        ];
    }

    /**
     * Stock is not fillable, so it is set after creation for tests/seeding.
     */
    public function withStock(int $stock): static
    {
        return $this->afterCreating(fn (ProductVariant $variant) => $variant->forceFill(['stock' => $stock])->save());
    }
}
