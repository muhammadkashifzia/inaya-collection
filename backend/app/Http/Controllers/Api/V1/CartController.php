<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\CartResource;
use App\Models\Cart;
use App\Models\ProductVariant;
use App\Services\CartService;
use Illuminate\Http\Request;

/**
 * Cart endpoints work for guests (X-Cart-Token header) and signed-in customers.
 * The response always includes server-computed totals.
 */
class CartController extends Controller
{
    public function __construct(private CartService $carts) {}

    public function show(Request $request): CartResource
    {
        $validated = $request->validate(['shipping_method' => ['nullable', 'string', 'max:50']]);

        return $this->respond($request, $this->cart($request), $validated['shipping_method'] ?? null);
    }

    public function addItem(Request $request): CartResource
    {
        $validated = $request->validate([
            'variant_id' => ['required', 'integer'],
            'quantity' => ['required', 'integer', 'min:1', 'max:100'],
        ]);

        $cart = $this->cart($request);
        $variant = ProductVariant::query()->with('product')->findOrFail($validated['variant_id']);
        $this->carts->addItem($cart, $variant, $validated['quantity']);

        return $this->respond($request, $cart);
    }

    public function updateItem(Request $request, int $itemId): CartResource
    {
        $validated = $request->validate(['quantity' => ['required', 'integer', 'min:0', 'max:100']]);

        $cart = $this->cart($request);
        $item = $cart->items()->whereKey($itemId)->with('cart')->firstOrFail();
        $this->carts->updateItem($item, $validated['quantity']);

        return $this->respond($request, $cart);
    }

    public function removeItem(Request $request, int $itemId): CartResource
    {
        $cart = $this->cart($request);
        $cart->items()->whereKey($itemId)->delete();

        return $this->respond($request, $cart);
    }

    public function applyCoupon(Request $request): CartResource
    {
        $validated = $request->validate(['code' => ['required', 'string', 'max:50']]);

        $cart = $this->cart($request);
        $this->carts->applyCoupon($cart, $validated['code'], $request->user('sanctum'));

        return $this->respond($request, $cart);
    }

    public function removeCoupon(Request $request): CartResource
    {
        $cart = $this->cart($request);
        $this->carts->removeCoupon($cart);

        return $this->respond($request, $cart);
    }

    private function cart(Request $request): Cart
    {
        return $this->carts->resolve($request->user('sanctum'), $request->header('X-Cart-Token'));
    }

    private function respond(Request $request, Cart $cart, ?string $shippingMethod = null): CartResource
    {
        $cart->unsetRelation('items');

        return new CartResource($cart, $this->carts->summary($cart, $request->user('sanctum'), $shippingMethod));
    }
}
