<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use App\Support\Money;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __invoke(Request $request, DashboardService $dashboard): JsonResponse
    {
        $validated = $request->validate(['days' => ['nullable', 'integer', 'in:7,30,90,365']]);
        $data = $dashboard->overview((int) ($validated['days'] ?? 30));

        $data['totals']['revenue'] = Money::toMajor($data['totals']['revenue']);
        $data['sales'] = array_map(fn (array $d): array => [...$d, 'revenue' => Money::toMajor($d['revenue'])], $data['sales']);
        $data['best_sellers'] = $data['best_sellers']->map(fn (array $b): array => [...$b, 'revenue' => Money::toMajor($b['revenue'])]);
        $data['recent_orders'] = $data['recent_orders']->map(fn ($o): array => [
            'number' => $o->number,
            'customer_name' => $o->customer_name,
            'email' => $o->email,
            'status' => $o->status,
            'payment_status' => $o->payment_status,
            'grand_total' => Money::toMajor($o->grand_total),
            'placed_at' => $o->placed_at,
        ]);

        return response()->json(['data' => $data]);
    }
}
