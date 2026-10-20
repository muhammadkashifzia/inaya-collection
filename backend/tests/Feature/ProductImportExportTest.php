<?php

namespace Tests\Feature;

use App\Enums\InventoryReason;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class ProductImportExportTest extends TestCase
{
    use RefreshDatabase;

    private function csvFile(string $contents): UploadedFile
    {
        return UploadedFile::fake()->createWithContent('products.csv', $contents);
    }

    public function test_import_creates_products_with_variants_tags_and_stock(): void
    {
        $admin = User::factory()->admin()->create();
        Category::factory()->create(['slug' => 'lawn', 'name' => 'Lawn']);

        $csv = implode("\n", [
            'Handle,Title,Product SKU,Category,Status,Price,Sale Price,Tags,Details,Variant SKU,Option1 Name,Option1 Value,Variant Stock',
            'noor-lawn,Noor Lawn,NOOR-01,lawn,active,3999,3299,"New Arrival, Summer",Printed | Lawn,NOOR-01-S,Size,S,4',
            'noor-lawn,,,,,,,,,NOOR-01-M,Size,M,0',
        ]);

        $this->actingAs($admin, 'sanctum')
            ->post('/api/v1/admin/products/import', ['file' => $this->csvFile($csv)], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJson(['created' => 1, 'updated' => 0, 'skipped' => 0, 'errors' => []]);

        $product = Product::query()->with(['variants', 'tags'])->sole();
        $this->assertSame('noor-lawn', $product->slug);
        $this->assertSame(399900, $product->price);
        $this->assertSame(['Printed', 'Lawn'], $product->details);
        $this->assertSame(['New Arrival', 'Summer'], $product->tags->pluck('name')->sort()->values()->all());
        $this->assertSame(['NOOR-01-S', 'NOOR-01-M'], $product->variants->pluck('sku')->all());
        $this->assertSame(['size' => 'S'], $product->variants[0]->options);
        $this->assertSame('S', $product->variants[0]->name);
        $this->assertSame(4, $product->variants[0]->stock);
        $this->assertDatabaseHas('inventory_movements', ['quantity_change' => 4, 'reason' => InventoryReason::InitialStock->value]);
    }

    public function test_existing_products_are_skipped_unless_overwrite_is_set(): void
    {
        $admin = User::factory()->admin()->create();
        $product = Product::factory()->withStock(10)->create(['sku' => 'GW-1', 'name' => 'Old name']);
        $csv = "Product SKU,Title,Variant SKU,Variant Stock\nGW-1,New name,GW-1-D,3\n";

        $this->actingAs($admin, 'sanctum')
            ->post('/api/v1/admin/products/import', ['file' => $this->csvFile($csv)], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJson(['created' => 0, 'updated' => 0, 'skipped' => 1]);
        $this->assertSame('Old name', $product->fresh()->name);

        $this->actingAs($admin, 'sanctum')
            ->post('/api/v1/admin/products/import', ['file' => $this->csvFile($csv), 'overwrite' => '1'], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJson(['updated' => 1, 'errors' => []]);

        $product->refresh()->load('variants');
        $this->assertSame('New name', $product->name);
        $this->assertSame(329900, $product->price, 'Columns missing from the file keep their values.');
        $this->assertSame(3, $product->variants->sole()->stock);
        $this->assertDatabaseHas('inventory_movements', ['quantity_change' => -7, 'reason' => InventoryReason::Correction->value, 'note' => 'CSV import']);
    }

    public function test_invalid_rows_are_reported_with_line_numbers(): void
    {
        $admin = User::factory()->admin()->create();
        Category::factory()->create(['slug' => 'lawn']);
        $csv = implode("\n", [
            'Handle,Title,Product SKU,Category,Status,Price,Variant SKU',
            'ok,Good,OK-1,lawn,active,100,OK-1-D',
            'bad,Bad,BAD-1,missing,active,100,BAD-1-D',
            'dup,Dup,DUP-1,lawn,active,100,OK-1-D',
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->post('/api/v1/admin/products/import', ['file' => $this->csvFile($csv)], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('created', 1)
            ->assertJsonCount(2, 'errors');

        $this->assertSame([3, 4], array_column($response->json('errors'), 'row'));
        $this->assertSame(1, Product::query()->count());
    }

    public function test_export_round_trips_through_import(): void
    {
        $admin = User::factory()->admin()->create();
        Product::factory()->withStock(5)->create(['sku' => 'GW-EXP', 'name' => '=HYPERLINK("x")']);

        $response = $this->actingAs($admin, 'sanctum')->get('/api/v1/admin/products/export')->assertOk();
        $csv = $response->streamedContent();

        $this->assertStringContainsString('Handle,Title,"Product SKU"', $csv);
        $this->assertStringContainsString("'=HYPERLINK", $csv, 'Formula cells are escaped.');
        $this->assertStringContainsString('GW-EXP-D', $csv);

        $this->actingAs($admin, 'sanctum')
            ->post('/api/v1/admin/products/import', ['file' => $this->csvFile($csv), 'overwrite' => '1'], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJson(['updated' => 1, 'errors' => []]);
        $this->assertSame('=HYPERLINK("x")', Product::query()->sole()->name);
    }

    public function test_import_and_export_require_product_permission(): void
    {
        $customer = User::factory()->create();

        $this->actingAs($customer, 'sanctum')->getJson('/api/v1/admin/products/export')->assertForbidden();
        $this->actingAs($customer, 'sanctum')
            ->post('/api/v1/admin/products/import', ['file' => $this->csvFile("Handle\n")], ['Accept' => 'application/json'])
            ->assertForbidden();
    }

    public function test_import_rejects_file_without_required_columns(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin, 'sanctum')
            ->post('/api/v1/admin/products/import', ['file' => $this->csvFile("Foo,Bar\n1,2\n")], ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('file');
    }
}
