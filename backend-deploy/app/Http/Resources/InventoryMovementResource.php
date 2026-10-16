<?php

namespace App\Http\Resources;

use App\Models\InventoryMovement;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin InventoryMovement */
class InventoryMovementResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'variant_id' => $this->product_variant_id,
            'sku' => $this->whenLoaded('variant', fn () => $this->variant->sku),
            'product_name' => $this->whenLoaded('variant', fn () => $this->variant->relationLoaded('product') ? $this->variant->product->name : null),
            'quantity_change' => $this->quantity_change,
            'stock_after' => $this->stock_after,
            'reason' => $this->reason,
            'note' => $this->note,
            'order_id' => $this->order_id,
            'by' => $this->whenLoaded('user', fn () => $this->user?->name),
            'created_at' => $this->created_at,
        ];
    }
}
