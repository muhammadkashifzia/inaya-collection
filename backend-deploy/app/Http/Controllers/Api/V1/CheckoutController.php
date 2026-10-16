<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\CheckoutRequest;
use App\Http\Resources\OrderResource;
use App\Models\Address;
use App\Services\CartService;
use App\Services\CheckoutService;
use App\Services\SettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Arr;
use Illuminate\Validation\ValidationException;

/**
 * POST /api/v1/checkout — place an order from the current cart.
 * Requires an Idempotency-Key header; retries return the same order.
 */
class CheckoutController extends Controller
{
    public function __invoke(CheckoutRequest $request, CartService $carts, CheckoutService $checkout, SettingsService $settings): JsonResponse
    {
        $user = $request->user('sanctum');

        if ($user === null && ! (bool) $settings->get('checkout.allow_guest_checkout', true)) {
            throw ValidationException::withMessages(['email' => 'Please sign in to place an order.']);
        }

        $cart = $carts->resolve($user, $request->header('X-Cart-Token'), create: false);
        if ($cart === null) {
            throw ValidationException::withMessages(['cart' => 'Your cart is empty.']);
        }

        $data = $request->validated();
        $shipping = $this->address($data, 'shipping_address', $user?->id);
        $billing = $request->boolean('billing_same_as_shipping') ? $shipping : $this->address($data, 'billing_address', null);

        $order = $checkout->placeOrder($cart, $user, [
            'customer_name' => $data['customer_name'],
            'email' => $data['email'],
            'phone' => $data['phone'],
            'shipping_address' => $shipping,
            'billing_address' => $billing,
            'shipping_method' => $data['shipping_method'],
            'payment_method' => $data['payment_method'],
            'customer_note' => $data['customer_note'] ?? null,
        ], $request->idempotencyKey());

        if ($user !== null && $request->boolean('save_address') && empty($data['shipping_address_id'])) {
            $user->addresses()->firstOrCreate(
                Arr::only($shipping, ['line1', 'city', 'phone']),
                [...$shipping, 'is_default_shipping' => ! $user->addresses()->exists()],
            );
        }

        return (new OrderResource($order->load(['items', 'statusHistory', 'shipment'])))
            ->response()
            ->setStatusCode($order->wasRecentlyCreated ? 201 : 200);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function address(array $data, string $key, ?int $userId): array
    {
        if ($key === 'shipping_address' && ! empty($data['shipping_address_id']) && $userId !== null) {
            return Address::query()->where('user_id', $userId)->findOrFail($data['shipping_address_id'])->toSnapshot();
        }

        $address = Arr::only($data[$key] ?? [], ['full_name', 'phone', 'line1', 'line2', 'city', 'province', 'postal_code', 'country']);
        $address['country'] = strtoupper($address['country'] ?? 'PK');

        return [
            'full_name' => $address['full_name'],
            'phone' => $address['phone'],
            'line1' => $address['line1'],
            'line2' => $address['line2'] ?? null,
            'city' => $address['city'],
            'province' => $address['province'] ?? null,
            'postal_code' => $address['postal_code'] ?? null,
            'country' => $address['country'],
        ];
    }
}
