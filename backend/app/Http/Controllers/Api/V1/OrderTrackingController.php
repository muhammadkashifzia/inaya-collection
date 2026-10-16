<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use Illuminate\Http\Request;

/**
 * POST /api/v1/orders/track — guest order lookup by number + email or phone.
 * Both values must match, so order numbers alone reveal nothing.
 */
class OrderTrackingController extends Controller
{
    public function __invoke(Request $request): OrderResource
    {
        $validated = $request->validate([
            'number' => ['required', 'string', 'max:30'],
            'contact' => ['required', 'string', 'max:255'],
        ]);

        $contact = trim($validated['contact']);
        $digits = preg_replace('/\D+/', '', $contact);

        $order = Order::query()
            ->where('number', strtoupper(trim($validated['number'])))
            ->with(['items', 'statusHistory', 'shipment'])
            ->first();

        $matches = $order !== null && (
            strcasecmp($order->email, $contact) === 0
            || ($digits !== '' && strlen($digits) >= 7 && str_ends_with(preg_replace('/\D+/', '', $order->phone), substr($digits, -10)))
        );

        abort_unless($matches, 404, 'No order matches those details.');

        return new OrderResource($order);
    }
}
