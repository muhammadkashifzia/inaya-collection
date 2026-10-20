<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ProductStatus;
use App\Http\Controllers\Controller;
use App\Services\ProductCatalog;
use App\Services\ProductCsv;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Shopify-style CSV export and import of products and their variants.
 */
class ProductTransferController extends Controller
{
    public function __construct(private ProductCsv $csv) {}

    public function export(Request $request, ProductCatalog $catalog): StreamedResponse
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'max:120'],
            'status' => ['nullable', Rule::enum(ProductStatus::class)],
            'trashed' => ['nullable', Rule::in(['with', 'only'])],
            'low_stock' => ['nullable', 'boolean'],
            'ids' => ['nullable', 'array', 'max:500'],
            'ids.*' => ['integer'],
        ]);
        if ($request->has('low_stock')) {
            $filters['low_stock'] = $request->boolean('low_stock');
        }

        $query = $catalog->admin($filters)->when($filters['ids'] ?? null, fn ($q, array $ids) => $q->whereKey($ids));
        Log::info('Products exported', ['admin_id' => $request->user()->id]);

        return response()->streamDownload(function () use ($query): void {
            $out = fopen('php://output', 'w');
            $this->csv->export($query, $out);
            fclose($out);
        }, 'products_export_'.now()->format('Y-m-d').'.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Cache-Control' => 'no-store',
        ]);
    }

    public function import(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:5120'],
            'overwrite' => ['nullable', 'boolean'],
        ]);

        $handle = fopen($validated['file']->getRealPath(), 'r');
        try {
            $result = $this->csv->import($handle, $request->boolean('overwrite'), $request->user());
        } finally {
            fclose($handle);
        }

        Log::info('Products imported', [
            'admin_id' => $request->user()->id,
            'created' => $result['created'],
            'updated' => $result['updated'],
            'skipped' => $result['skipped'],
            'errors' => count($result['errors']),
        ]);

        return response()->json($result);
    }
}
