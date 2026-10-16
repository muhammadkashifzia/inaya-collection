<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_listing_shows_only_active_products_with_pagination(): void
    {
        Product::factory()->count(3)->withStock(5)->create();
        Product::factory()->draft()->withStock(5)->create();
        Product::factory()->withStock(5)->create()->delete();

        $this->getJson('/api/v1/products?per_page=2')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.total', 3)
            ->assertJsonPath('meta.last_page', 2);
    }

    public function test_filters_by_category_including_subcategories(): void
    {
        $parent = Category::factory()->create(['slug' => 'winter']);
        $child = Category::factory()->create(['parent_id' => $parent->id]);
        Product::factory()->for($parent)->withStock()->create();
        Product::factory()->for($child)->withStock()->create();
        Product::factory()->withStock()->create();

        $this->getJson('/api/v1/products?category=winter')->assertOk()->assertJsonPath('meta.total', 2);
    }

    public function test_filters_by_effective_price_and_sorts_by_price(): void
    {
        Product::factory()->withStock()->create(['name' => 'Cheap', 'price' => 200000]);
        Product::factory()->withStock()->create(['name' => 'Sale', 'price' => 500000, 'sale_price' => 250000]);
        Product::factory()->withStock()->create(['name' => 'Pricey', 'price' => 600000]);

        $this->getJson('/api/v1/products?max_price=3000&sort=price_desc')
            ->assertOk()
            ->assertJsonPath('meta.total', 2)
            ->assertJsonPath('data.0.name', 'Sale')
            ->assertJsonPath('data.0.sale_price', 2500)
            ->assertJsonPath('data.1.name', 'Cheap');
    }

    public function test_availability_filter_and_search(): void
    {
        Product::factory()->withStock(0)->create(['name' => 'Gone Khaddar']);
        Product::factory()->withStock(3)->create(['name' => 'Fresh Karandi', 'fabric' => 'Karandi']);

        $this->getJson('/api/v1/products?availability=in_stock')->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.in_stock', true);
        $this->getJson('/api/v1/products?q=khaddar')->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.in_stock', false);
    }

    public function test_invalid_filters_are_rejected(): void
    {
        $this->getJson('/api/v1/products?sort=random&per_page=500&min_price=10&max_price=5')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['sort', 'per_page', 'max_price']);
    }

    public function test_product_detail_hides_exact_stock_and_returns_related(): void
    {
        $category = Category::factory()->create();
        $product = Product::factory()->for($category)->create(['slug' => 'noor-01']);
        ProductVariant::factory()->for($product)->withStock(7)->create();
        Product::factory()->for($category)->withStock()->count(2)->create();

        $this->getJson('/api/v1/products/noor-01')
            ->assertOk()
            ->assertJsonPath('data.slug', 'noor-01')
            ->assertJsonPath('data.variants.0.in_stock', true)
            ->assertJsonMissingPath('data.variants.0.stock')
            ->assertJsonCount(2, 'related');
    }

    public function test_draft_and_unknown_products_return_404(): void
    {
        Product::factory()->draft()->create(['slug' => 'secret']);

        $this->getJson('/api/v1/products/secret')->assertNotFound();
        $this->getJson('/api/v1/products/nope')->assertNotFound();
    }
}
