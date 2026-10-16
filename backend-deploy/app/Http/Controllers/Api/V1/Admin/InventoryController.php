<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\InventoryReason;
use App\Http\Controllers\Controller;
use App\Http\Resources\InventoryMovementResource;
use App\Models\InventoryMovement;
use App\Models\ProductVariant;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class InventoryController extends Controller
{
    /**
     * Variant-level stock list with low-stock filter.
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'low_stock' => ['nullable', 'boolean'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $variants = ProductVariant::query()
            ->join('products', 'products.id', '=', 'product_variants.product_id')
            ->whereNull('products.deleted_at')
            ->when($filters['q'] ?? null, function ($query, string $q): void {
                $term = '%'.str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $q).'%';
                $query->where(fn ($w) => $w->where('product_variants.sku', 'like', $term)->orWhere('products.name', 'like', $term));
            })
            ->when($request->boolean('low_stock'), fn ($q) => $q->whereColumn('product_variants.stock', '<=', 'products.low_stock_threshold'))
            ->orderBy('product_variants.stock')
            ->select([
                'product_variants.id', 'product_variants.sku', 'product_variants.name', 'product_variants.stock',
                'product_variants.is_active', 'products.id as product_id', 'products.name as product_name',
                'products.low_stock_threshold',
            ])
            ->paginate($filters['per_page'] ?? 25)
            ->withQueryString();

        $variants->getCollection()->transform(fn (ProductVariant $v): array => [
            'id' => $v->id,
            'sku' => $v->sku,
            'name' => $v->name,
            'stock' => $v->stock,
            'is_active' => $v->is_active,
            'product_id' => $v->getAttributes()['product_id'],
            'product_name' => $v->getAttributes()['product_name'],
            'low_stock_threshold' => (int) $v->getAttributes()['low_stock_threshold'],
            'is_low_stock' => $v->stock <= (int) $v->getAttributes()['low_stock_threshold'],
        ]);

        return response()->json($variants);
    }

    /**
     * Manual stock adjustment with a recorded reason and administrator.
     */
    public function adjust(Request $request, ProductVariant $variant, InventoryService $inventory): JsonResponse
    {
        $validated = $request->validate([
            'quantity_change' => ['required', 'integer', 'not_in:0', 'min:-1000000', 'max:1000000'],
            'reason' => ['required', Rule::in(array_map(fn ($r) => $r->value, InventoryReason::manual()))],
            'note' => ['nullable', 'string', 'max:500'],
        ]);

        $movement = $inventory->adjust(
            $variant,
            (int) $validated['quantity_change'],
            InventoryReason::from($validated['reason']),
            $request->user(),
            null,
            $validated['note'] ?? null,
        );

        Log::info('Inventory adjusted', ['variant_id' => $variant->id, 'change' => $movement->quantity_change, 'admin_id' => $request->user()->id]);

        return (new InventoryMovementResource($movement->load(['user', 'variant.product'])))->response()->setStatusCode(201);
    }

    public function movements(Request $request): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'variant_id' => ['nullable', 'integer'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        return InventoryMovementResource::collection(
            InventoryMovement::query()
                ->with(['user', 'variant.product'])
                ->when($filters['variant_id'] ?? null, fn ($q, $id) => $q->where('product_variant_id', $id))
                ->latest('id')
                ->paginate($filters['per_page'] ?? 25)
                ->withQueryString(),
        );
    }
}
