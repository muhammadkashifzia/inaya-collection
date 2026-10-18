<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ReviewStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\ProductReviewResource;
use App\Models\ProductReview;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

/**
 * Review moderation: approve / reject, edit, add on behalf of a customer, delete.
 */
class ProductReviewController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::enum(ReviewStatus::class)],
            'rating' => ['nullable', 'integer', 'between:1,5'],
            'product_id' => ['nullable', 'integer'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $reviews = ProductReview::query()
            ->with('product:id,name,slug')
            ->when($filters['q'] ?? null, function ($query, string $q): void {
                $term = '%'.str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $q).'%';
                $query->where(fn ($w) => $w->where('name', 'like', $term)
                    ->orWhere('email', 'like', $term)
                    ->orWhere('title', 'like', $term)
                    ->orWhere('body', 'like', $term)
                    ->orWhereHas('product', fn ($p) => $p->where('name', 'like', $term)));
            })
            ->when($filters['status'] ?? null, fn ($q, string $status) => $q->where('status', $status))
            ->when($filters['rating'] ?? null, fn ($q, int $rating) => $q->where('rating', $rating))
            ->when($filters['product_id'] ?? null, fn ($q, int $productId) => $q->where('product_id', $productId))
            ->latest()
            ->latest('id')
            ->paginate($filters['per_page'] ?? 20)
            ->withQueryString();

        $counts = ProductReview::query()->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status');

        return ProductReviewResource::collection($reviews)->additional([
            'counts' => collect(ReviewStatus::cases())->mapWithKeys(fn (ReviewStatus $s): array => [$s->value => (int) ($counts[$s->value] ?? 0)])->all(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => ['required', 'integer', Rule::exists('products', 'id')->whereNull('deleted_at')],
            ...$this->contentRules(),
        ]);

        $review = ProductReview::query()->create([
            ...$validated,
            'status' => $validated['status'] ?? ReviewStatus::Approved->value,
            'is_verified_buyer' => (bool) ($validated['is_verified_buyer'] ?? false),
        ]);
        Log::info('Review created by admin', ['review_id' => $review->id, 'admin_id' => $request->user()->id]);

        return (new ProductReviewResource($review->load('product:id,name,slug')))->response()->setStatusCode(201);
    }

    public function update(Request $request, ProductReview $review): ProductReviewResource
    {
        $validated = $request->validate(collect($this->contentRules())
            ->map(fn (array $rules): array => array_map(fn ($rule) => $rule === 'required' ? 'sometimes' : $rule, $rules))
            ->all());

        $review->update($validated);
        Log::info('Review updated', ['review_id' => $review->id, 'status' => $review->status->value, 'admin_id' => $request->user()->id]);

        return new ProductReviewResource($review->load('product:id,name,slug'));
    }

    public function destroy(Request $request, ProductReview $review): JsonResponse
    {
        $review->delete();
        Log::info('Review deleted', ['review_id' => $review->id, 'admin_id' => $request->user()->id]);

        return response()->json(null, 204);
    }

    /**
     * @return array<string, list<mixed>>
     */
    private function contentRules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'email' => ['nullable', 'email:rfc', 'max:255'],
            'rating' => ['required', 'integer', 'between:1,5'],
            'title' => ['nullable', 'string', 'max:150'],
            'body' => ['required', 'string', 'max:3000'],
            'status' => ['nullable', Rule::enum(ReviewStatus::class)],
            'is_verified_buyer' => ['nullable', 'boolean'],
        ];
    }
}
