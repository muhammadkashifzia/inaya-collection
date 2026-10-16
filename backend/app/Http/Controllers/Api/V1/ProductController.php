<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProductIndexRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Services\ProductCatalog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductController extends Controller
{
    /**
     * GET /api/v1/products — filter, search, sort, paginate.
     */
    public function index(ProductIndexRequest $request, ProductCatalog $catalog): AnonymousResourceCollection
    {
        $filters = $request->filters();

        return ProductResource::collection(
            $catalog->storefront($filters)->paginate((int) ($filters['per_page'] ?? 24))->withQueryString(),
        );
    }

    /**
     * GET /api/v1/products/{slug} — detail with variants, images and related products.
     */
    public function show(string $slug): JsonResponse
    {
        $product = Product::query()
            ->visible()
            ->where('slug', $slug)
            ->with(['images', 'primaryImage', 'category.parent', 'variants' => fn ($q) => $q->where('is_active', true)])
            ->firstOrFail();

        $product->variants->each->setRelation('product', $product);

        $related = Product::query()
            ->visible()
            ->where('category_id', $product->category_id)
            ->whereKeyNot($product->id)
            ->select('products.*')
            ->withCardData()
            ->orderByDesc('sales_count')
            ->limit(4)
            ->get();

        return response()->json([
            'data' => new ProductResource($product),
            'related' => ProductResource::collection($related),
        ]);
    }

    /**
     * GET /api/v1/products/filters — available facet values for the filter UI.
     */
    public function facets(ProductCatalog $catalog): JsonResponse
    {
        $visible = Product::query()->visible();
        $price = $catalog->effectivePriceExpression();

        return response()->json(['data' => [
            'brands' => (clone $visible)->whereNotNull('brand')->distinct()->orderBy('brand')->pluck('brand'),
            'fabrics' => (clone $visible)->whereNotNull('fabric')->distinct()->orderBy('fabric')->pluck('fabric'),
            'pieces' => (clone $visible)->whereNotNull('pieces')->distinct()->orderBy('pieces')->pluck('pieces'),
            'price' => [
                'min' => (int) ((clone $visible)->min($price) ?? 0) / 100,
                'max' => (int) ((clone $visible)->max($price) ?? 0) / 100,
            ],
            'sorts' => ProductCatalog::SORTS,
        ]]);
    }
}
