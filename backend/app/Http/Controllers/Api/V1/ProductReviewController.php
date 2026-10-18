<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\OrderStatus;
use App\Enums\ReviewStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\ProductReviewResource;
use App\Models\Product;
use App\Models\ProductReview;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Public product reviews. Only approved reviews are listed; new reviews wait
 * for moderation in the admin panel.
 */
class ProductReviewController extends Controller
{
    public function index(Request $request, string $slug): JsonResponse
    {
        $product = Product::query()->visible()->where('slug', $slug)->firstOrFail();
        $perPage = min(max((int) $request->integer('per_page', 10), 1), 50);

        $reviews = $product->reviews()->approved()->latest()->latest('id')->paginate($perPage)->withQueryString();

        $distribution = $product->reviews()->approved()
            ->select('rating', DB::raw('count(*) as total'))
            ->groupBy('rating')
            ->pluck('total', 'rating');
        $count = (int) $distribution->sum();

        return response()->json([
            'data' => ProductReviewResource::collection($reviews->items()),
            'meta' => [
                'current_page' => $reviews->currentPage(),
                'last_page' => $reviews->lastPage(),
                'per_page' => $reviews->perPage(),
                'total' => $reviews->total(),
            ],
            'summary' => [
                'average' => $count > 0 ? round($distribution->reduce(fn (int $carry, $total, $rating): int => $carry + $rating * $total, 0) / $count, 1) : null,
                'count' => $count,
                'distribution' => collect(range(5, 1))->mapWithKeys(fn (int $r): array => [$r => (int) ($distribution[$r] ?? 0)])->all(),
            ],
        ]);
    }

    public function store(Request $request, string $slug): JsonResponse
    {
        $product = Product::query()->visible()->where('slug', $slug)->firstOrFail();

        $validated = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'email' => ['required', 'email:rfc', 'max:255'],
            'rating' => ['required', 'integer', 'between:1,5'],
            'title' => ['nullable', 'string', 'max:150'],
            'body' => ['required', 'string', 'min:10', 'max:3000'],
            // Honeypot: real visitors never see or fill this field.
            'website' => ['nullable', 'string', 'max:0'],
        ], [
            'rating.required' => 'Please choose a star rating.',
            'website.max' => 'Your review could not be submitted.',
        ]);

        $user = $request->user('sanctum');
        $isVerifiedBuyer = $user !== null && $user->orders()
            ->where('status', OrderStatus::Delivered)
            ->whereHas('items', fn ($q) => $q->where('product_id', $product->id))
            ->exists();

        ProductReview::query()->create([
            'product_id' => $product->id,
            'user_id' => $user?->id,
            'name' => trim($validated['name']),
            'email' => strtolower(trim($validated['email'])),
            'rating' => $validated['rating'],
            'title' => filled($validated['title'] ?? null) ? trim($validated['title']) : null,
            'body' => trim($validated['body']),
            'status' => ReviewStatus::Pending,
            'is_verified_buyer' => $isVerifiedBuyer,
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['message' => 'Thank you! Your review will appear once it has been approved.'], 201);
    }
}
