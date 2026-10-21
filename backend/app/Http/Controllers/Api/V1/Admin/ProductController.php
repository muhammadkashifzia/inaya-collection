<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ProductStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ProductRequest;
use App\Http\Resources\ProductImageResource;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Models\ProductImage;
use App\Services\ProductCatalog;
use App\Services\ProductWriter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

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
}
