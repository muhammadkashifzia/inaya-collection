<?php

namespace App\Http\Resources;

use App\Models\Cart;
use App\Support\Money;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Wraps CartService::summary(). All amounts are server-computed.
 */
class CartResource extends JsonResource
{
    /**
     * @param  array<string, mixed>  $summary
     */
    public function __construct(private Cart $cart, private array $summary)
    {
        parent::__construct($cart);
    }

    /**
     * Always 200: creating a cart on first add is an implementation detail.
     */
    public function withResponse(Request $request, JsonResponse $response): void
    {
        $response->setStatusCode(200);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $s = $this->summary;

        return [
            'token' => $this->cart->user_id === null ? $this->cart->token : null,
            'items' => array_map(fn (array $line): array => [
                'id' => $line['item']->id,
                'variant_id' => $line['variant']->id,
                'product_id' => $line['variant']->product->id,
                'slug' => $line['variant']->product->slug,
                'name' => $line['variant']->product->name,
                'variant_name' => $line['variant']->displayName(),
                'sku' => $line['variant']->sku,
                'image' => $line['variant']->product->primaryImage?->url(),
                'unit_price' => Money::toMajor($line['unit_price']),
                'regular_price' => Money::toMajor($line['variant']->regularPrice()),
                'quantity' => $line['quantity'],
                'max_quantity' => max(0, min($line['variant']->stock, $s['max_quantity'])),
                'line_total' => Money::toMajor($line['line_total']),
                'in_stock' => $line['variant']->stock >= $line['quantity'],
            ], $s['lines']),
            'issues' => $s['issues'],
            'coupon_code' => $s['coupon_code'],
            'coupon_error' => $s['coupon_error'],
            'item_count' => $s['item_count'],
            'subtotal' => Money::toMajor($s['subtotal']),
            'discount_total' => Money::toMajor($s['discount_total']),
            'shipping_total' => Money::toMajor($s['shipping_total']),
            'tax_total' => Money::toMajor($s['tax_total']),
            'grand_total' => Money::toMajor($s['grand_total']),
        ];
    }
}
