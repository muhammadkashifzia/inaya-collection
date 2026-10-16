<?php

namespace Database\Seeders;

use App\Enums\InventoryReason;
use App\Enums\ProductStatus;
use App\Models\Category;
use App\Models\Product;
use App\Services\InventoryService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

/**
 * Imports the sample catalogue (database/seeders/data/*.json) and its dummy
 * SVG images so the storefront looks the same after switching to the API.
 * Replace with real products from the admin dashboard.
 */
class CatalogSeeder extends Seeder
{
    public function run(InventoryService $inventory): void
    {
        $dataDir = database_path('seeders/data');
        if (! File::exists("{$dataDir}/products.json")) {
            $this->command?->warn('Sample data not found; skipping catalogue seed.');

            return;
        }

        $collections = json_decode(File::get("{$dataDir}/collections.json"), true);
        $products = json_decode(File::get("{$dataDir}/products.json"), true);

        DB::transaction(function () use ($collections, $products, $inventory): void {
            $categoryIds = [];
            foreach ($collections as $collection) {
                $category = Category::query()->updateOrCreate(['slug' => $collection['slug']], [
                    'name' => $collection['title'],
                    'short_name' => $collection['shortTitle'],
                    'description' => $collection['description'],
                    'image' => $this->copyImage($collection['image']),
                    'sort_order' => $collection['rank'],
                    'is_active' => true,
                ]);
                $categoryIds[$collection['slug']] = $category->id;
            }

            foreach ($products as $index => $row) {
                $product = Product::query()->updateOrCreate(['slug' => $row['slug']], [
                    'category_id' => $categoryIds[$row['collection']],
                    'name' => $row['title'],
                    'sku' => 'GW-'.$row['id'],
                    'brand' => 'Galaxy Wear',
                    'short_description' => $row['description'],
                    'description' => $row['description'],
                    'details' => $row['details'],
                    'fabric' => $row['fabric'],
                    'pieces' => $row['pieces'],
                    'price' => (int) round(($row['compareAtPrice'] ?? $row['price']) * 100),
                    'sale_price' => $row['compareAtPrice'] ? (int) round($row['price'] * 100) : null,
                    'status' => ProductStatus::Active,
                    'is_featured' => $index % 5 === 0,
                    'low_stock_threshold' => 5,
                    'published_at' => $row['createdAt'],
                ]);

                $product->images()->delete();
                foreach ($row['images'] as $position => $image) {
                    $product->images()->create([
                        'path' => $this->copyImage($image),
                        'alt' => $row['title'],
                        'sort_order' => $position,
                    ]);
                }

                $variant = $product->variants()->firstOrCreate(['sku' => 'GW-'.$row['id'].'-D'], [
                    'name' => 'Default',
                    'options' => ['color' => ucwords($row['color'])],
                    'is_active' => true,
                ]);

                $targetStock = $row['inStock'] ? 25 : 0;
                if ($variant->stock !== $targetStock) {
                    $inventory->setStock($variant, $targetStock, InventoryReason::InitialStock, null, 'Seeded sample stock');
                }
            }
        });

        $this->command?->info(count($products).' products and '.count($collections).' categories seeded.');
    }

    /**
     * Copies /images/... from seeders/data to storage/app/public/seed/.
     */
    private function copyImage(string $publicPath): string
    {
        $target = 'seed'.str_replace('/images', '', $publicPath);
        $source = database_path('seeders/data'.$publicPath);

        if (File::exists($source) && ! Storage::disk('public')->exists($target)) {
            Storage::disk('public')->put($target, File::get($source));
        }

        return $target;
    }
}
