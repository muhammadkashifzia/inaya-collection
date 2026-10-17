<?php

namespace App\Console\Commands;

use App\Enums\InventoryReason;
use App\Enums\ProductStatus;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Services\InventoryService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

/**
 * Imports products (with their real photos) from a public Shopify storefront,
 * e.g. https://galaxywear.pk, into the local catalogue.
 *
 * Products are matched by slug (Shopify handle), so re-running updates them
 * instead of creating duplicates. Images are only downloaded for products that
 * have none yet, unless --refresh-images is passed.
 */
#[Signature('catalog:import-shopify
    {store=https://galaxywear.pk : Base URL of the Shopify storefront}
    {--refresh-images : Replace images of products that already have some}
    {--stock=25 : Stock to give in-stock variants when they are first created}')]
#[Description('Import products and images from a Shopify storefront')]
class ImportShopifyCatalog extends Command
{
    public function handle(InventoryService $inventory): int
    {
        $store = rtrim((string) $this->argument('store'), '/');

        $products = $this->fetchProducts($store);
        if ($products === []) {
            $this->error('No products found at '.$store);

            return self::FAILURE;
        }

        $categoryBySlug = Category::query()->pluck('id', 'slug')->all();
        $categoryByHandle = $this->collectionAssignments($store, array_keys($categoryBySlug));
        $fallbackCategoryId = Category::query()->orderBy('sort_order')->value('id');

        $imported = 0;
        $imagesSaved = 0;

        foreach ($products as $row) {
            $categorySlug = $categoryByHandle[$row['handle']] ?? null;
            $categoryId = $categorySlug !== null ? $categoryBySlug[$categorySlug] : $fallbackCategoryId;

            if ($categoryId === null) {
                $this->warn("Skipped {$row['handle']}: no category available.");

                continue;
            }

            try {
                $product = $this->upsertProduct($row, $categoryId, $inventory);
                $imagesSaved += $this->syncImages($product, $row);
                $imported++;
                $this->line("  ✓ {$product->name} ({$product->images()->count()} images)");
            } catch (Throwable $exception) {
                $this->warn("Failed {$row['handle']}: {$exception->getMessage()}");
            }
        }

        $this->info("{$imported} products imported, {$imagesSaved} images downloaded.");

        return self::SUCCESS;
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function fetchProducts(string $store): array
    {
        $products = [];

        for ($page = 1; $page <= 20; $page++) {
            $batch = Http::timeout(30)->retry(2, 500)
                ->get("{$store}/products.json", ['limit' => 250, 'page' => $page])
                ->throw()
                ->json('products', []);

            $products = [...$products, ...$batch];

            if (count($batch) < 250) {
                break;
            }
        }

        return $products;
    }

    /**
     * Maps each product handle to the first local category whose slug matches
     * a Shopify collection containing it.
     *
     * @param  list<string>  $categorySlugs
     * @return array<string, string>
     */
    private function collectionAssignments(string $store, array $categorySlugs): array
    {
        $assignments = [];

        foreach ($categorySlugs as $slug) {
            $response = Http::timeout(30)->retry(2, 500)
                ->get("{$store}/collections/{$slug}/products.json", ['limit' => 250]);

            if (! $response->successful()) {
                continue;
            }

            foreach ($response->json('products', []) as $product) {
                $assignments[$product['handle']] ??= $slug;
            }
        }

        return $assignments;
    }

    /**
     * @param  array<string, mixed>  $row
     */
    private function upsertProduct(array $row, int $categoryId, InventoryService $inventory): Product
    {
        return DB::transaction(function () use ($row, $categoryId, $inventory): Product {
            $variants = $row['variants'] ?? [];
            $firstVariant = $variants[0] ?? [];
            $price = (float) ($firstVariant['price'] ?? 0);
            $compareAt = isset($firstVariant['compare_at_price']) ? (float) $firstVariant['compare_at_price'] : null;
            $isOnSale = $compareAt !== null && $compareAt > $price;
            [$summary, $description, $details] = $this->parseBody((string) ($row['body_html'] ?? ''));

            $product = Product::withTrashed()->firstOrNew(['slug' => $row['handle']]);
            $product->fill([
                'category_id' => $categoryId,
                'name' => $row['title'],
                'sku' => $product->sku ?? $this->uniqueProductSku($row),
                'brand' => 'Anaya Collection',
                'short_description' => Str::limit($summary, 500),
                'description' => $description,
                'details' => $details,
                'fabric' => $this->detectFabric($row),
                'pieces' => preg_match('/(\d)\s*-?\s*piece/i', $row['product_type'].' '.$row['title'], $m) ? (int) $m[1] : null,
                'price' => (int) round(($isOnSale ? $compareAt : $price) * 100),
                'sale_price' => $isOnSale ? (int) round($price * 100) : null,
                'status' => ProductStatus::Active,
                'low_stock_threshold' => $product->low_stock_threshold ?? 5,
                'published_at' => $row['published_at'] ?? now(),
            ]);
            $product->save();

            if ($product->trashed()) {
                $product->restore();
            }

            foreach ($variants as $index => $input) {
                $sku = $this->variantSku($input);
                $variant = ProductVariant::withTrashed()->where('sku', $sku)->first();
                $isNew = $variant === null;

                $variant ??= new ProductVariant(['sku' => $sku]);
                $variant->fill([
                    'product_id' => $product->id,
                    'name' => $input['title'] === 'Default Title' ? 'Default' : Str::limit($input['title'], 120, ''),
                    'options' => $input['title'] === 'Default Title' ? null : ['option' => $input['title']],
                    'is_active' => true,
                    'sort_order' => $index,
                ]);
                $variant->product_id = $product->id;
                $variant->save();

                if ($variant->trashed()) {
                    $variant->restore();
                }

                if ($isNew && ($input['available'] ?? false)) {
                    $inventory->setStock($variant, (int) $this->option('stock'), InventoryReason::InitialStock, null, 'Imported from Shopify');
                }
            }

            return $product;
        });
    }

    /**
     * Downloads the Shopify product images to products/{id}/ on the public disk.
     *
     * @param  array<string, mixed>  $row
     */
    private function syncImages(Product $product, array $row): int
    {
        $images = $row['images'] ?? [];
        if ($images === []) {
            return 0;
        }

        if ($product->images()->exists()) {
            if (! $this->option('refresh-images')) {
                return 0;
            }

            foreach ($product->images as $image) {
                Storage::disk('public')->delete($image->path);
                $image->delete();
            }
        }

        $saved = 0;
        foreach (array_values($images) as $position => $image) {
            $response = Http::timeout(60)->retry(2, 1000)->get($image['src']);
            if (! $response->successful()) {
                $this->warn("    image failed: {$image['src']}");

                continue;
            }

            $extension = strtolower(pathinfo((string) parse_url($image['src'], PHP_URL_PATH), PATHINFO_EXTENSION)) ?: 'jpg';
            $path = "products/{$product->id}/".Str::random(40).'.'.$extension;
            Storage::disk('public')->put($path, $response->body());

            $product->images()->create([
                'path' => $path,
                'alt' => $image['alt'] ?? null ?: $product->name,
                'sort_order' => $position,
            ]);
            $saved++;
        }

        return $saved;
    }

    /**
     * Splits Shopify body HTML into a summary, plain-text description and a
     * list of fabric detail lines.
     *
     * @return array{0: string, 1: string, 2: list<string>}
     */
    private function parseBody(string $html): array
    {
        preg_match_all('/<p[^>]*>(.*?)<\/p>/is', $html, $matches);
        $paragraphs = array_values(array_filter(array_map(
            fn (string $p): string => trim(html_entity_decode(strip_tags($p), ENT_QUOTES | ENT_HTML5)),
            $matches[1] ?: [$html],
        )));

        $details = [];
        foreach ($paragraphs as $paragraph) {
            if (Str::startsWith($paragraph, 'Fabric details:')) {
                $text = trim(Str::after($paragraph, 'Fabric details:'));
                $details = array_values(array_filter(array_map('trim', preg_split('/\.\s+|\s+(?=Trouser:|Dupatta:|Shawl:|Collection:|Design:|Color:|Type:)/', rtrim($text, '.')))));
                $details = array_values(array_filter($details, fn (string $line): bool => ! preg_match('/:\s*$/', $line)));
            }
        }

        return [$paragraphs[0] ?? '', implode("\n\n", $paragraphs), $details];
    }

    /**
     * @param  array<string, mixed>  $row
     */
    private function detectFabric(array $row): string
    {
        $haystack = Str::lower($row['handle'].' '.implode(' ', $row['tags'] ?? []));

        return match (true) {
            str_contains($haystack, 'karandi') => 'Karandi',
            str_contains($haystack, 'cotton-viscose'), str_contains($haystack, 'cotton viscose') => 'Cotton Viscose',
            str_contains($haystack, 'crosshatch') => 'Crosshatch',
            default => 'Khaddar',
        };
    }

    /**
     * @param  array<string, mixed>  $row
     */
    private function uniqueProductSku(array $row): string
    {
        $sku = 'GW-S'.$row['id'];

        return Product::withTrashed()->where('sku', $sku)->exists() ? $sku.'-'.Str::lower(Str::random(4)) : $sku;
    }

    /**
     * Uses the Shopify SKU when present, otherwise one derived from the variant id.
     *
     * @param  array<string, mixed>  $variant
     */
    private function variantSku(array $variant): string
    {
        $sku = trim((string) ($variant['sku'] ?? ''));

        return Str::limit($sku !== '' ? $sku.'-'.$variant['id'] : 'GW-SV'.$variant['id'], 64, '');
    }
}
