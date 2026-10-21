<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ProductStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ProductRequest;
use App\Http\Resources\ProductImageResource;
use App\Http\Resources\ProductResource;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Services\ProductCatalog;
use App\Services\ProductWriter;
use App\Support\Money;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ProductController extends Controller
{
    public function __construct(private ProductWriter $writer) {}

    public function index(Request $request, ProductCatalog $catalog): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'max:120'],
            'status' => ['nullable', Rule::enum(ProductStatus::class)],
            'trashed' => ['nullable', Rule::in(['with', 'only'])],
            'low_stock' => ['nullable', 'boolean'],
            'featured' => ['nullable', 'boolean'],
            'sort' => ['nullable', Rule::in(ProductCatalog::SORTS)],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);
        foreach (['low_stock', 'featured'] as $flag) {
            if ($request->has($flag)) {
                $filters[$flag] = $request->boolean($flag);
            }
        }

        return ProductResource::collection($catalog->admin($filters)->paginate($filters['per_page'] ?? 20)->withQueryString());
    }

    public function store(ProductRequest $request): JsonResponse
    {
        $product = $this->writer->save(null, $request->validated(), $request->user());
        Log::info('Product created', ['product_id' => $product->id, 'admin_id' => $request->user()->id]);

        return (new ProductResource($product))->response()->setStatusCode(201);
    }

    public function show(int $product): ProductResource
    {
        $model = Product::withTrashed()->with(['images', 'primaryImage', 'category', 'categories', 'variants', 'tags'])->findOrFail($product);
        $model->variants->each->setRelation('product', $model);

        return new ProductResource($model);
    }

    public function update(ProductRequest $request, Product $product): ProductResource
    {
        $product = $this->writer->save($product, $request->validated(), $request->user());
        Log::info('Product updated', ['product_id' => $product->id, 'admin_id' => $request->user()->id]);

        return new ProductResource($product);
    }

    /**
     * Soft delete (archive). Order history keeps its snapshot.
     */
    public function destroy(Request $request, Product $product): JsonResponse
    {
        $product->update(['status' => ProductStatus::Archived]);
        $product->delete();
        Log::info('Product deleted', ['product_id' => $product->id, 'admin_id' => $request->user()->id]);

        return response()->json(null, 204);
    }

    public function restore(int $product): ProductResource
    {
        $model = Product::onlyTrashed()->findOrFail($product);
        $model->restore();
        $model->update(['status' => ProductStatus::Draft]);

        return new ProductResource($model->load(['images', 'primaryImage', 'category', 'categories', 'variants', 'tags']));
    }

    public function uploadImage(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'image' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120', 'dimensions:min_width=300,min_height=300,max_width=6000,max_height=6000'],
            'alt' => ['nullable', 'string', 'max:255'],
        ]);

        $image = $this->writer->addImage($product, $validated['image'], $validated['alt'] ?? $product->name);

        return (new ProductImageResource($image))->response()->setStatusCode(201);
    }

    public function reorderImages(Request $request, Product $product): AnonymousResourceCollection
    {
        $validated = $request->validate([
            'image_ids' => ['required', 'array', 'min:1'],
            'image_ids.*' => ['integer', 'distinct', Rule::exists('product_images', 'id')->where('product_id', $product->id)],
        ]);

        $this->writer->reorderImages($product, $validated['image_ids']);

        return ProductImageResource::collection($product->images()->get());
    }

    public function destroyImage(Product $product, ProductImage $image): JsonResponse
    {
        abort_unless($image->product_id === $product->id, 404);
        $this->writer->deleteImage($image);

        return response()->json(null, 204);
    }

    /**
     * Export products as CSV.
     */
    public function export(Request $request, ProductCatalog $catalog): StreamedResponse
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'max:120'],
            'status' => ['nullable', Rule::enum(ProductStatus::class)],
        ]);

        $query = $catalog->admin($filters);

        $headers = [
            'Handle', 'Title', 'SKU', 'Category', 'Brand', 'Status',
            'Price', 'Sale Price', 'Fabric', 'Pieces', 'Featured',
            'Short Description', 'Description', 'Meta Title', 'Meta Description',
            'Published At', 'Total Stock', 'Sold', 'Image URL',
        ];

        $filename = 'products-'.now()->format('Y-m-d').'.csv';

        return response()->streamDownload(function () use ($query, $headers): void {
            $out = fopen('php://output', 'w');
            fputcsv($out, $headers);

            $query->with(['category', 'variants', 'primaryImage'])->chunk(200, function ($products) use ($out): void {
                foreach ($products as $product) {
                    fputcsv($out, [
                        $product->slug,
                        $product->name,
                        $product->sku,
                        $product->category?->name,
                        $product->brand,
                        $product->status->value,
                        Money::toMajor($product->price),
                        Money::toMajor($product->sale_price),
                        $product->fabric,
                        $product->pieces,
                        $product->is_featured ? 'Yes' : 'No',
                        $product->short_description,
                        strip_tags((string) $product->description),
                        $product->meta_title,
                        $product->meta_description,
                        $product->published_at?->toIso8601String(),
                        $product->variants->sum('stock'),
                        $product->sales_count,
                        $product->primaryImage?->url(),
                    ]);
                }
            });

            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }

    /**
     * Import products from a CSV file. Creates new products or updates
     * existing ones matched by Handle (slug) or SKU.
     */
    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:10240'],
        ]);

        $path = $request->file('file')->getRealPath();
        $handle = fopen($path, 'r');

        if ($handle === false) {
            return response()->json(['message' => 'Could not read the uploaded file.'], 422);
        }

        $headerRow = fgetcsv($handle);

        if ($headerRow === false || count($headerRow) < 2) {
            fclose($handle);

            return response()->json(['message' => 'The CSV file is empty or has no header row.'], 422);
        }

        // Normalise header names to lowercase trimmed keys.
        $headerRow = array_map(fn (string $h): string => strtolower(trim($h)), $headerRow);

        // Map CSV column names → internal keys.
        $columnMap = [
            'handle' => 'slug',
            'title' => 'name',
            'sku' => 'sku',
            'category' => 'category_name',
            'brand' => 'brand',
            'status' => 'status',
            'price' => 'price',
            'sale price' => 'sale_price',
            'fabric' => 'fabric',
            'pieces' => 'pieces',
            'featured' => 'is_featured',
            'short description' => 'short_description',
            'description' => 'description',
            'meta title' => 'meta_title',
            'meta description' => 'meta_description',
            'published at' => 'published_at',
            'image url' => 'image_url',
        ];

        $created = 0;
        $updated = 0;
        $skipped = 0;
        $errors = [];
        $rowNum = 1;

        // Pre-load categories for matching.
        $categories = Category::query()->active()->pluck('id', 'name')->mapWithKeys(
            fn ($id, $name) => [strtolower($name) => $id]
        );

        DB::beginTransaction();

        try {
            while (($row = fgetcsv($handle)) !== false) {
                $rowNum++;

                if (count($row) !== count($headerRow)) {
                    $errors[] = "Row {$rowNum}: column count mismatch, skipped.";
                    $skipped++;

                    continue;
                }

                $data = [];
                foreach ($headerRow as $i => $colName) {
                    $key = $columnMap[$colName] ?? null;
                    if ($key !== null) {
                        $data[$key] = trim($row[$i]);
                    }
                }

                // Need at least a name.
                if (empty($data['name'])) {
                    $errors[] = "Row {$rowNum}: missing Title, skipped.";
                    $skipped++;

                    continue;
                }

                // Try to find an existing product by slug or SKU.
                $existing = null;
                if (! empty($data['slug'])) {
                    $existing = Product::withTrashed()->where('slug', $data['slug'])->first();
                }
                if (! $existing && ! empty($data['sku'])) {
                    $existing = Product::withTrashed()->where('sku', $data['sku'])->first();
                }

                // Resolve category.
                $categoryId = null;
                if (! empty($data['category_name'])) {
                    $categoryId = $categories[strtolower($data['category_name'])] ?? null;
                }

                $attrs = array_filter([
                    'name' => $data['name'],
                    'slug' => ! empty($data['slug']) ? $data['slug'] : Str::slug($data['name']),
                    'sku' => $data['sku'] ?? null,
                    'brand' => $data['brand'] ?? null,
                    'fabric' => $data['fabric'] ?? null,
                    'pieces' => ! empty($data['pieces']) ? (int) $data['pieces'] : null,
                    'short_description' => $data['short_description'] ?? null,
                    'description' => $data['description'] ?? null,
                    'meta_title' => $data['meta_title'] ?? null,
                    'meta_description' => $data['meta_description'] ?? null,
                    'published_at' => ! empty($data['published_at']) ? $data['published_at'] : null,
                ], fn ($v): bool => $v !== null && $v !== '');

                if (! empty($data['price'])) {
                    $attrs['price'] = Money::toMinor($data['price']);
                }
                if (! empty($data['sale_price'])) {
                    $attrs['sale_price'] = Money::toMinor($data['sale_price']);
                }
                if (! empty($data['status'])) {
                    $validStatuses = array_column(ProductStatus::cases(), 'value');
                    if (in_array($data['status'], $validStatuses, true)) {
                        $attrs['status'] = $data['status'];
                    }
                }
                if (isset($data['is_featured'])) {
                    $attrs['is_featured'] = in_array(strtolower($data['is_featured']), ['yes', '1', 'true'], true);
                }
                if ($categoryId !== null) {
                    $attrs['category_id'] = $categoryId;
                }

                if ($existing) {
                    $existing->update($attrs);
                    $this->importImage($existing, $data['image_url'] ?? '', $errors, $rowNum);
                    $updated++;
                } else {
                    // New product — ensure required fields have defaults.
                    $attrs['status'] ??= ProductStatus::Draft->value;
                    $attrs['price'] ??= 0;
                    $product = Product::create($attrs);
                    $this->importImage($product, $data['image_url'] ?? '', $errors, $rowNum);
                    $created++;
                }
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            fclose($handle);
            Log::error('Product import failed', ['error' => $e->getMessage()]);

            return response()->json(['message' => 'Import failed: '.$e->getMessage()], 500);
        }

        fclose($handle);

        Log::info('Product import completed', [
            'admin_id' => $request->user()->id,
            'created' => $created,
            'updated' => $updated,
            'skipped' => $skipped,
        ]);

        return response()->json([
            'message' => "Import complete: {$created} created, {$updated} updated, {$skipped} skipped.",
            'created' => $created,
            'updated' => $updated,
            'skipped' => $skipped,
            'errors' => array_slice($errors, 0, 20),
        ]);
    }

    /**
     * Download an image from a URL and attach it to a product (only if it has no images yet).
     *
     * @param  list<string>  $errors
     */
    private function importImage(Product $product, string $imageUrl, array &$errors, int $rowNum): void
    {
        if ($imageUrl === '' || $product->images()->exists()) {
            return;
        }

        try {
            $contents = @file_get_contents($imageUrl, false, stream_context_create([
                'http' => ['timeout' => 15, 'ignore_errors' => true],
                'ssl' => ['verify_peer' => false],
            ]));

            if ($contents === false || strlen($contents) < 100) {
                $errors[] = "Row {$rowNum}: could not download image from URL.";

                return;
            }

            // Detect extension from content type or URL.
            $ext = 'jpg';
            if (str_contains($imageUrl, '.png') || str_starts_with($contents, "\x89PNG")) {
                $ext = 'png';
            } elseif (str_contains($imageUrl, '.webp') || str_starts_with($contents, 'RIFF')) {
                $ext = 'webp';
            }

            $filename = Str::random(40).'.'.$ext;
            $path = "products/{$product->id}/{$filename}";
            Storage::disk('public')->put($path, $contents);

            $product->images()->create([
                'path' => $path,
                'alt' => $product->name,
                'sort_order' => 0,
            ]);
        } catch (\Throwable $e) {
            $errors[] = "Row {$rowNum}: image download failed — {$e->getMessage()}";
        }
    }
}
