<?php

namespace App\Services;

use App\Enums\InventoryReason;
use App\Models\InventoryMovement;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * The only place stock changes. Every change writes an InventoryMovement.
 */
class InventoryService
{
    /**
     * Apply a stock change to a variant. Must run inside a transaction; the
     * variant row is locked so concurrent changes cannot oversell.
     *
     * @throws ValidationException when the change would make stock negative
     */
    public function adjust(
        ProductVariant $variant,
        int $quantityChange,
        InventoryReason $reason,
        ?User $actor = null,
        ?int $orderId = null,
        ?string $note = null,
    ): InventoryMovement {
        if (DB::transactionLevel() === 0) {
            return DB::transaction(fn (): InventoryMovement => $this->adjust($variant, $quantityChange, $reason, $actor, $orderId, $note));
        }

        /** @var ProductVariant $locked */
        $locked = ProductVariant::withTrashed()->whereKey($variant->getKey())->lockForUpdate()->firstOrFail();
        $newStock = $locked->stock + $quantityChange;

        if ($newStock < 0) {
            throw ValidationException::withMessages([
                'quantity' => "Insufficient stock for {$locked->sku}. Available: {$locked->stock}.",
            ]);
        }

        $locked->forceFill(['stock' => $newStock])->save();
        $variant->setRawAttributes($locked->getAttributes(), true);

        return InventoryMovement::query()->create([
            'product_variant_id' => $locked->id,
            'user_id' => $actor?->id,
            'order_id' => $orderId,
            'quantity_change' => $quantityChange,
            'stock_after' => $newStock,
            'reason' => $reason,
            'note' => $note,
        ]);
    }

    /**
     * Set an absolute stock level (records the difference as a movement).
     */
    public function setStock(ProductVariant $variant, int $stock, InventoryReason $reason, ?User $actor = null, ?string $note = null): ?InventoryMovement
    {
        $difference = $stock - $variant->stock;

        return $difference === 0 ? null : $this->adjust($variant, $difference, $reason, $actor, null, $note);
    }
}
