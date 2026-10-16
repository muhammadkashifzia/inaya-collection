<?php

namespace App\Services;

use App\Enums\InventoryReason;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\User;
use App\Support\Money;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Creates/updates products together with their variants and images.
 */
class ProductWriter
{
    public function __construct(private InventoryService $inventory) {}

    /**
     * @param  array<string, mixed>  $data  validated ProductRequest data
     */
    public function save(?Product $product, array $data, User $actor): Product
    {
        return DB::transaction(function () use ($product, $data, $actor): Product {
            $attributes = Arr::except($data, ['variants']);
            $attributes['slug'] = $this->uniqueSlug($data['slug'] ?? null ?: $data['name'], $product?->id);
            $attributes['price'] = Money::toMinor($data['price']);
            $attributes['sale_price'] = Money::toMinor($data['sale_price'] ?? null);
            $attributes['is_featured'] = (bool) ($data['is_featured'] ?? false);
            $attributes['low_stock_threshold'] = $data['low_stock_threshold'] ?? 5;
            $attributes['details'] = array_values($data['details'] ?? []);

            if ($product === null) {
                $attributes['published_at'] ??= now();
                $product = Product::query()->create($attributes);
            } else {
                $product->update($attributes);
            }

            $this->syncVariants($product, $data['variants'], $actor);

            return $product->refresh()->load(['images', 'primaryImage', 'category', 'variants']);
        });
    }

    /**
     * @param  list<array<string, mixed>>  $variants
     */
    private function syncVariants(Product $product, array $variants, User $actor): void
    {
        $keptIds = [];

        foreach (array_values($variants) as $index => $input) {
            $attributes = [
                'sku' => $input['sku'],
                'name' => $input['name'],
                'options' => $input['options'] ?? null,
                'price' => Money::toMinor($input['price'] ?? null),
                'sale_price' => Money::toMinor($input['sale_price'] ?? null),
                'is_active' => (bool) ($input['is_active'] ?? true),
                'sort_order' => $index,
            ];

            if (! empty($input['id'])) {
                $variant = $product->variants()->findOrFail($input['id']);
                $variant->update($attributes);
            } else {
                $variant = $product->variants()->create($attributes);
                $initialStock = (int) ($input['stock'] ?? 0);
                if ($initialStock > 0) {
                    $this->inventory->adjust($variant, $initialStock, InventoryReason::InitialStock, $actor);
                }
            }

            $keptIds[] = $variant->id;
        }

        // Removed variants are soft-deleted so historic orders keep their references.
        $product->variants()->whereNotIn('id', $keptIds)->get()->each->delete();
    }

    public function addImage(Product $product, UploadedFile $file, ?string $alt): ProductImage
    {
        $path = $file->store("products/{$product->id}", 'public');
        $nextOrder = (int) $product->images()->max('sort_order') + 1;

        return $product->images()->create([
            'path' => $path,
            'alt' => $alt,
            'sort_order' => $product->images()->exists() ? $nextOrder : 0,
        ]);
    }

    /**
     * @param  list<int>  $orderedIds
     */
    public function reorderImages(Product $product, array $orderedIds): void
    {
        DB::transaction(function () use ($product, $orderedIds): void {
            foreach ($orderedIds as $position => $id) {
                $product->images()->whereKey($id)->update(['sort_order' => $position]);
            }
        });
    }

    public function deleteImage(ProductImage $image): void
    {
        $path = $image->path;
        $image->delete();

        // Keep the file if any order item still references it.
        if (! OrderItem::query()->where('image', $path)->exists()) {
            Storage::disk('public')->delete($path);
        }
    }

    private function uniqueSlug(string $source, ?int $ignoreId): string
    {
        $base = Str::slug($source) ?: Str::lower(Str::random(8));
        $slug = $base;
        $i = 2;

        while (Product::withTrashed()->where('slug', $slug)->when($ignoreId, fn ($q) => $q->whereKeyNot($ignoreId))->exists()) {
            $slug = "{$base}-{$i}";
            $i++;
        }

        return $slug;
    }
}
