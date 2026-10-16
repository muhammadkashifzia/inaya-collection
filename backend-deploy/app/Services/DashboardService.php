<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\UserRole;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * Aggregated admin statistics.
 *
 * Revenue = sum of grand_total for orders in confirmed, processing, shipped
 * or delivered status. Pending, cancelled and refunded orders are excluded.
 */
class DashboardService
{
    /**
     * @return array<string, mixed>
     */
    public function overview(int $days = 30): array
    {
        $revenueStatuses = array_map(fn (OrderStatus $s): string => $s->value, OrderStatus::revenueStatuses());

        $statusCounts = Order::query()
            ->select('status', DB::raw('COUNT(*) as aggregate'))
            ->groupBy('status')
            ->pluck('aggregate', 'status')
            ->map(fn ($v): int => (int) $v);

        $since = CarbonImmutable::now()->subDays($days - 1)->startOfDay();

        $salesByDay = Order::query()
            ->whereIn('status', $revenueStatuses)
            ->where('placed_at', '>=', $since)
            ->selectRaw('DATE(placed_at) as day, COUNT(*) as orders, SUM(grand_total) as revenue')
            ->groupBy('day')
            ->orderBy('day')
            ->get()
            ->keyBy('day');

        $series = [];
        for ($date = $since; $date->lte(CarbonImmutable::now()); $date = $date->addDay()) {
            $row = $salesByDay->get($date->toDateString());
            $series[] = [
                'date' => $date->toDateString(),
                'orders' => (int) ($row->orders ?? 0),
                'revenue' => (int) ($row->revenue ?? 0),
            ];
        }

        $bestSellers = OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->whereIn('orders.status', $revenueStatuses)
            ->whereNotNull('order_items.product_id')
            ->groupBy('order_items.product_id', 'order_items.product_name')
            ->selectRaw('order_items.product_id, order_items.product_name, SUM(order_items.quantity) as units, SUM(order_items.line_total) as revenue')
            ->orderByDesc('units')
            ->limit(5)
            ->get()
            ->map(fn ($row): array => [
                'product_id' => (int) $row->product_id,
                'name' => $row->product_name,
                'units' => (int) $row->units,
                'revenue' => (int) $row->revenue,
            ]);

        $lowStock = ProductVariant::query()
            ->join('products', 'products.id', '=', 'product_variants.product_id')
            ->whereNull('products.deleted_at')
            ->where('product_variants.is_active', true)
            ->whereColumn('product_variants.stock', '<=', 'products.low_stock_threshold')
            ->orderBy('product_variants.stock')
            ->limit(10)
            ->get(['product_variants.id', 'product_variants.sku', 'product_variants.name', 'product_variants.stock', 'products.id as product_id', 'products.name as product_name', 'products.low_stock_threshold']);

        return [
            'totals' => [
                'revenue' => (int) Order::query()->whereIn('status', $revenueStatuses)->sum('grand_total'),
                'orders' => $statusCounts->sum(),
                'customers' => User::query()->where('role', UserRole::Customer)->count(),
                'products' => Product::query()->count(),
                'pending_orders' => $statusCounts->get(OrderStatus::Pending->value, 0),
                'completed_orders' => $statusCounts->get(OrderStatus::Delivered->value, 0),
                'cancelled_orders' => $statusCounts->get(OrderStatus::Cancelled->value, 0),
                'low_stock_variants' => ProductVariant::query()
                    ->join('products', 'products.id', '=', 'product_variants.product_id')
                    ->whereNull('products.deleted_at')
                    ->where('product_variants.is_active', true)
                    ->whereColumn('product_variants.stock', '<=', 'products.low_stock_threshold')
                    ->count(),
            ],
            'status_counts' => $statusCounts,
            'sales' => $series,
            'best_sellers' => $bestSellers,
            'low_stock' => $lowStock,
            'recent_orders' => Order::query()->latest('placed_at')->limit(8)
                ->get(['id', 'number', 'customer_name', 'email', 'status', 'payment_status', 'grand_total', 'placed_at']),
            'revenue_definition' => 'Sum of order totals in confirmed, processing, shipped or delivered status. Excludes pending, cancelled and refunded orders.',
        ];
    }
}
