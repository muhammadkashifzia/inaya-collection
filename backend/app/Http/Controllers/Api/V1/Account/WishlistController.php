<?php

namespace App\Http\Controllers\Api\V1\Account;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WishlistController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $products = Product::query()
            ->visible()
            ->whereIn('id', $request->user()->wishlistItems()->select('product_id'))
            ->select('products.*')
            ->withCardData()
            ->get();

        return response()->json([
            'data' => ProductResource::collection($products),
            'product_ids' => $products->pluck('id'),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate(['product_id' => ['required', 'integer']]);
        $product = Product::query()->visible()->findOrFail($validated['product_id']);

        $request->user()->wishlistItems()->firstOrCreate(['product_id' => $product->id]);

        return response()->json(['message' => 'Added to wishlist.'], 201);
    }

    public function destroy(Request $request, int $productId): JsonResponse
    {
        $request->user()->wishlistItems()->where('product_id', $productId)->delete();

        return response()->json(null, 204);
    }
}
