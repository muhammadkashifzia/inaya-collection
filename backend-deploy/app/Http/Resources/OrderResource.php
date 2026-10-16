<?php

namespace App\Http\Resources;

use App\Models\Order;
use App\Support\Money;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/** @mixin Order */
class OrderResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $isStaff = $request->user()?->isStaffMember() ?? false;

        return [
            'id' => $this->when($isStaff, $this->id),
            'number' => $this->number,
            'status' => $this->status,
            'payment_status' => $this->payment_status,
            'payment_method' => $this->payment_method,
            'payment_method_label' => $this->payment_method->label(),
            'shipping_method' => $this->shipping_method,
            'customer_name' => $this->customer_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'shipping_address' => $this->shipping_address,
            'billing_address' => $this->billing_address,
            'customer_note' => $this->customer_note,
            'coupon_code' => $this->coupon_code,
            'currency' => $this->currency,
            'subtotal' => Money::toMajor($this->subtotal),
            'discount_total' => Money::toMajor($this->discount_total),
            'shipping_total' => Money::toMajor($this->shipping_total),
            'tax_total' => Money::toMajor($this->tax_total),
            'grand_total' => Money::toMajor($this->grand_total),
            'items_count' => $this->whenCounted('items'),
            'items' => $this->whenLoaded('items', fn () => $this->items->map(fn ($item): array => [
                'id' => $item->id,
                'product_id' => $item->product_id,
                'variant_id' => $item->product_variant_id,
                'name' => $item->product_name,
                'variant_name' => $item->variant_name,
                'sku' => $item->sku,
                'image' => $item->image ? Storage::disk('public')->url($item->image) : null,
                'unit_price' => Money::toMajor($item->unit_price),
                'quantity' => $item->quantity,
                'line_total' => Money::toMajor($item->line_total),
            ])),
            'status_history' => $this->whenLoaded('statusHistory', fn () => $this->statusHistory->map(fn ($h): array => [
                'from' => $h->from_status,
                'to' => $h->to_status,
                'note' => $h->note,
                'by' => $isStaff && $h->relationLoaded('user') ? $h->user?->name : null,
                'at' => $h->created_at,
            ])),
            'shipment' => $this->whenLoaded('shipment', fn () => $this->shipment ? [
                'carrier' => $this->shipment->carrier,
                'tracking_number' => $this->shipment->tracking_number,
                'tracking_url' => $this->shipment->tracking_url,
                'shipped_at' => $this->shipment->shipped_at,
                'delivered_at' => $this->shipment->delivered_at,
            ] : null),
            'payments' => $this->when($isStaff && $this->relationLoaded('payments'), fn () => $this->payments->map(fn ($p): array => [
                'id' => $p->id,
                'method' => $p->method,
                'status' => $p->status,
                'amount' => Money::toMajor($p->amount),
                'provider_reference' => $p->provider_reference,
                'paid_at' => $p->paid_at,
                'refunded_at' => $p->refunded_at,
            ])),
            'allowed_transitions' => $this->when($isStaff, fn () => $this->status->allowedTransitions()),
            'can_cancel' => $this->status->isCancellableByCustomer(),
            'user' => $this->when($isStaff, fn () => $this->relationLoaded('user') && $this->user ? [
                'id' => $this->user->id, 'name' => $this->user->name, 'email' => $this->user->email,
            ] : null),
            'placed_at' => $this->placed_at,
            'cancelled_at' => $this->cancelled_at,
        ];
    }
}
