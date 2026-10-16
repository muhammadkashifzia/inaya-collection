<?php

namespace Database\Factories;

use App\Enums\ProductStatus;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Prices are minor units (paisa).
 *
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = ucwords(fake()->unique()->words(3, true));

        return [
            'category_id' => Category::factory(),
            'name' => $name,
            'slug' => Str::slug($name).'-'.fake()->unique()->numberBetween(1, 999999),
            'sku' => 'GW-'.strtoupper(Str::random(8)),
            'fabric' => 'Khaddar',
            'pieces' => 3,
            'price' => 329900,
            'sale_price' => null,
            'status' => ProductStatus::Active,
            'is_featured' => false,
            'low_stock_threshold' => 5,
            'published_at' => now()->subDay(),
        ];
    }

    public function onSale(int $salePrice = 299900): static
    {
        return $this->state(fn (): array => ['sale_price' => $salePrice]);
    }

    public function draft(): static
    {
        return $this->state(fn (): array => ['status' => ProductStatus::Draft]);
    }

    /**
     * Adds a default variant with the given stock.
     */
    public function withStock(int $stock = 10): static
    {
        return $this->afterCreating(function (Product $product) use ($stock): void {
            ProductVariant::factory()->for($product)->withStock($stock)->create(['sku' => $product->sku.'-D']);
        });
    }
}
