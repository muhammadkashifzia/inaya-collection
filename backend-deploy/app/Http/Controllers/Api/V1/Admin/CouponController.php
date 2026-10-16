<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\CouponType;
use App\Http\Controllers\Controller;
use App\Http\Resources\CouponResource;
use App\Models\Coupon;
use App\Support\Money;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class CouponController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:50'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        return CouponResource::collection(
            Coupon::query()
                ->with(['products:id', 'categories:id'])
                ->when($filters['q'] ?? null, fn ($q, $term) => $q->where('code', 'like', '%'.strtoupper($term).'%'))
                ->latest()
                ->paginate($filters['per_page'] ?? 20)
                ->withQueryString(),
        );
    }

    public function show(Coupon $coupon): CouponResource
    {
        return new CouponResource($coupon->load(['products:id', 'categories:id']));
    }

    public function store(Request $request): JsonResponse
    {
        $coupon = $this->save(new Coupon, $request);

        return (new CouponResource($coupon))->response()->setStatusCode(201);
    }

    public function update(Request $request, Coupon $coupon): CouponResource
    {
        return new CouponResource($this->save($coupon, $request));
    }

    public function destroy(Coupon $coupon): JsonResponse
    {
        $coupon->delete();

        return response()->json(null, 204);
    }

    private function save(Coupon $coupon, Request $request): Coupon
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:50', 'alpha_dash', Rule::unique('coupons', 'code')->ignore($coupon->id)],
            'description' => ['nullable', 'string', 'max:255'],
            'type' => ['required', Rule::enum(CouponType::class)],
            'value' => ['required', 'numeric', 'gt:0', Rule::when($request->input('type') === CouponType::Percentage->value, ['max:100'])],
            'min_order_amount' => ['nullable', 'numeric', 'min:0'],
            'max_discount_amount' => ['nullable', 'numeric', 'gt:0'],
            'starts_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after:starts_at'],
            'usage_limit' => ['nullable', 'integer', 'min:1'],
            'per_customer_limit' => ['nullable', 'integer', 'min:1'],
            'is_active' => ['nullable', 'boolean'],
            'product_ids' => ['nullable', 'array'],
            'product_ids.*' => ['integer', 'exists:products,id'],
            'category_ids' => ['nullable', 'array'],
            'category_ids.*' => ['integer', 'exists:categories,id'],
        ]);

        return DB::transaction(function () use ($coupon, $data, $request): Coupon {
            $coupon->fill([
                ...Arr::except($data, ['product_ids', 'category_ids', 'value', 'min_order_amount', 'max_discount_amount']),
                'value' => $data['type'] === CouponType::Percentage->value ? (int) $data['value'] : Money::toMinor($data['value']),
                'min_order_amount' => Money::toMinor($data['min_order_amount'] ?? 0),
                'max_discount_amount' => Money::toMinor($data['max_discount_amount'] ?? null),
                'is_active' => $request->boolean('is_active', true),
            ])->save();

            $coupon->products()->sync($data['product_ids'] ?? []);
            $coupon->categories()->sync($data['category_ids'] ?? []);

            return $coupon->load(['products:id', 'categories:id']);
        });
    }
}
