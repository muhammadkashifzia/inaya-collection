<?php

namespace App\Http\Controllers\Api\V1\Account;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\OrderStatusService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

/**
 * The signed-in customer's own orders. Other customers' orders return 403.
 */
class OrderController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $validated = $request->validate(['per_page' => ['nullable', 'integer', 'min:1', 'max:50']]);

        return OrderResource::collection(
            $request->user()->orders()->withCount('items')->latest('placed_at')->paginate($validated['per_page'] ?? 10),
        );
    }

    public function show(Order $order): OrderResource
    {
        Gate::authorize('view-order', $order);

        return new OrderResource($order->load(['items', 'statusHistory', 'shipment']));
    }

    public function cancel(Request $request, Order $order, OrderStatusService $statuses): OrderResource
    {
        Gate::authorize('view-order', $order);

        if (! $order->status->isCancellableByCustomer()) {
            throw ValidationException::withMessages(['status' => 'This order can no longer be cancelled. Please contact support.']);
        }

        $statuses->transition($order, OrderStatus::Cancelled, $request->user(), 'Cancelled by customer');

        return new OrderResource($order->refresh()->load(['items', 'statusHistory', 'shipment']));
    }
}
