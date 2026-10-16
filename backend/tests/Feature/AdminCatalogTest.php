<?php

namespace Tests\Feature;

use App\Enums\InventoryReason;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminCatalogTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, mixed>
     */
    private function productPayload(int $categoryId, array $overrides = []): array
    {
        return [
            'category_id' => $categoryId,
            'name' => 'Noor Khaddar 3 Piece',
            'sku' => 'NOOR-01',
            'price' => 3999,
            'sale_price' => 3299,
            'status' => 'active',
            'fabric' => 'Khaddar',
            'pieces' => 3,
            'variants' => [
                ['sku' => 'NOOR-01-RED', 'name' => 'Red', 'options' => ['color' => 'Red'], 'stock' => 12],
                ['sku' => 'NOOR-01-BLU', 'name' => 'Blue', 'options' => ['color' => 'Blue'], 'stock' => 0],
            ],
            ...$overrides,
        ];
    }

    public function test_admin_creates_product_with_variants_and_initial_stock_movements(): void
    {
        $admin = User::factory()->admin()->create();
        $category = Category::factory()->create();

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/products', $this->productPayload($category->id));

        $response->assertCreated()
            ->assertJsonPath('slug', 'noor-khaddar-3-piece')
            ->assertJsonPath('price', 3999)
            ->assertJsonPath('sale_price', 3299)
            ->assertJsonCount(2, 'variants')
            ->assertJsonPath('variants.0.stock', 12);

        $product = Product::query()->sole();
        $this->assertSame(399900, $product->price);
        $this->assertDatabaseHas('inventory_movements', ['quantity_change' => 12, 'reason' => InventoryReason::InitialStock->value, 'user_id' => $admin->id]);
    }

    public function test_product_validation(): void
    {
        $admin = User::factory()->admin()->create();
        $category = Category::factory()->create();
        Product::factory()->create(['sku' => 'TAKEN']);

        $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/products', $this->productPayload($category->id, [
            'sku' => 'TAKEN', 'sale_price' => 5000, 'variants' => [],
        ]))->assertUnprocessable()->assertJsonValidationErrors(['sku', 'sale_price', 'variants']);
    }

    public function test_updating_product_does_not_change_existing_stock(): void
    {
        $admin = User::factory()->admin()->create();
        $category = Category::factory()->create();
        $id = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/products', $this->productPayload($category->id))->json('id');
        $product = Product::query()->with('variants')->find($id);
        $red = $product->variants->firstWhere('sku', 'NOOR-01-RED');

        $this->actingAs($admin, 'sanctum')->putJson("/api/v1/admin/products/{$id}", $this->productPayload($category->id, [
            'name' => 'Noor Renamed',
            'variants' => [['id' => $red->id, 'sku' => 'NOOR-01-RED', 'name' => 'Red', 'stock' => 999]],
        ]))->assertOk()->assertJsonPath('name', 'Noor Renamed')->assertJsonCount(1, 'variants');

        $this->assertSame(12, $red->refresh()->stock);
        $this->assertSoftDeleted('product_variants', ['sku' => 'NOOR-01-BLU']);
    }

    public function test_inventory_adjustment_records_reason_and_admin_and_prevents_negative_stock(): void
    {
        $admin = User::factory()->admin()->create();
        $variant = $this->variantWithStock(3);

        $this->actingAs($admin, 'sanctum')->postJson("/api/v1/admin/inventory/{$variant->id}/adjust", [
            'quantity_change' => -5, 'reason' => 'damaged',
        ])->assertUnprocessable()->assertJsonValidationErrors('quantity');

        $this->actingAs($admin, 'sanctum')->postJson("/api/v1/admin/inventory/{$variant->id}/adjust", [
            'quantity_change' => 10, 'reason' => 'restock', 'note' => 'New shipment',
        ])->assertCreated()->assertJsonPath('stock_after', 13)->assertJsonPath('by', $admin->name);

        $this->actingAs($admin, 'sanctum')->postJson("/api/v1/admin/inventory/{$variant->id}/adjust", [
            'quantity_change' => 1, 'reason' => 'sale',
        ])->assertUnprocessable()->assertJsonValidationErrors('reason');
    }

    public function test_image_upload_accepts_images_and_rejects_svg(): void
    {
        Storage::fake('public');
        $admin = User::factory()->admin()->create();
        $product = Product::factory()->withStock()->create();

        $this->actingAs($admin, 'sanctum')->postJson("/api/v1/admin/products/{$product->id}/images", [
            'image' => UploadedFile::fake()->image('front.jpg', 800, 1067),
        ])->assertCreated();

        $this->actingAs($admin, 'sanctum')->postJson("/api/v1/admin/products/{$product->id}/images", [
            'image' => UploadedFile::fake()->create('evil.svg', 10, 'image/svg+xml'),
        ])->assertUnprocessable()->assertJsonValidationErrors('image');

        $this->assertCount(1, Storage::disk('public')->allFiles("products/{$product->id}"));
    }

    public function test_category_with_products_cannot_be_deleted(): void
    {
        $admin = User::factory()->admin()->create();
        $category = Category::factory()->create();
        Product::factory()->for($category)->create();
        $empty = Category::factory()->create();

        $this->actingAs($admin, 'sanctum')->deleteJson("/api/v1/admin/categories/{$category->id}")->assertUnprocessable();
        $this->actingAs($admin, 'sanctum')->deleteJson("/api/v1/admin/categories/{$empty->id}")->assertNoContent();
    }

    public function test_category_cannot_be_its_own_ancestor(): void
    {
        $admin = User::factory()->admin()->create();
        $parent = Category::factory()->create();
        $child = Category::factory()->create(['parent_id' => $parent->id]);

        $this->actingAs($admin, 'sanctum')->putJson("/api/v1/admin/categories/{$parent->id}", [
            'name' => $parent->name, 'parent_id' => $child->id,
        ])->assertUnprocessable()->assertJsonValidationErrors(['parent_id' => 'A category cannot be its own parent or descendant.']);
    }
}
