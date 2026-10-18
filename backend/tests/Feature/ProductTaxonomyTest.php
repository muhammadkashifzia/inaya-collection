<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductAttribute;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductTaxonomyTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_manage_tags(): void
    {
        $admin = User::factory()->admin()->create();

        $id = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/tags', ['name' => 'New Arrival'])
            ->assertCreated()
            ->assertJsonPath('slug', 'new-arrival')
            ->json('id');

        $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/tags', ['name' => 'new arrival'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('slug');

        $this->actingAs($admin, 'sanctum')->putJson("/api/v1/admin/tags/{$id}", ['name' => 'Winter 2026'])
            ->assertOk()
            ->assertJsonPath('slug', 'winter-2026');

        $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/tags')->assertOk()->assertJsonCount(1)->assertJsonPath('0.products_count', 0);

        $this->actingAs($admin, 'sanctum')->deleteJson("/api/v1/admin/tags/{$id}")->assertNoContent();
        $this->assertDatabaseCount('tags', 0);
    }

    public function test_product_save_syncs_tags_and_storefront_filters_by_tag(): void
    {
        $admin = User::factory()->admin()->create();
        $category = Category::factory()->create();
        [$winter, $sale] = Tag::factory()->count(2)->create();

        $payload = [
            'category_id' => $category->id, 'name' => 'Tagged Suit', 'sku' => 'TAG-1', 'price' => 3000, 'status' => 'active',
            'tag_ids' => [$winter->id, $sale->id],
            'variants' => [['sku' => 'TAG-1-D', 'name' => 'Default', 'stock' => 5]],
        ];

        $productId = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/products', $payload)
            ->assertCreated()
            ->assertJsonCount(2, 'tags')
            ->json('id');
        Product::factory()->create();

        $this->getJson("/api/v1/products?tag={$winter->slug}")->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $productId);

        $variantId = Product::query()->findOrFail($productId)->variants()->value('id');
        $this->actingAs($admin, 'sanctum')->putJson("/api/v1/admin/products/{$productId}", [
            ...$payload,
            'tag_ids' => [$sale->id],
            'variants' => [['id' => $variantId, 'sku' => 'TAG-1-D', 'name' => 'Default']],
        ])->assertOk()->assertJsonCount(1, 'tags')->assertJsonPath('tags.0.id', $sale->id);
    }

    public function test_admin_can_manage_attributes_and_values(): void
    {
        $admin = User::factory()->admin()->create();

        $id = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/attributes', ['name' => 'Color', 'values' => ['Maroon', 'Black']])
            ->assertCreated()
            ->assertJsonPath('slug', 'color')
            ->assertJsonCount(2, 'values')
            ->json('id');

        $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/attributes', ['name' => 'Size', 'values' => ['M', 'm']])
            ->assertUnprocessable();

        $this->actingAs($admin, 'sanctum')->putJson("/api/v1/admin/attributes/{$id}", ['name' => 'Color', 'values' => ['Black', 'Navy']])
            ->assertOk()
            ->assertJsonPath('values.0.value', 'Black')
            ->assertJsonPath('values.1.value', 'Navy')
            ->assertJsonCount(2, 'values');

        $this->actingAs($admin, 'sanctum')->deleteJson("/api/v1/admin/attributes/{$id}")->assertNoContent();
        $this->assertSame(0, ProductAttribute::query()->count());
        $this->assertDatabaseCount('product_attribute_values', 0);
    }

    public function test_customers_cannot_manage_tags_or_attributes(): void
    {
        $customer = User::factory()->create();

        $this->actingAs($customer, 'sanctum')->getJson('/api/v1/admin/tags')->assertForbidden();
        $this->actingAs($customer, 'sanctum')->postJson('/api/v1/admin/attributes', ['name' => 'Color'])->assertForbidden();
    }
}
