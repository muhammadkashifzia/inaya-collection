<?php

namespace App\Services;

use App\Enums\InventoryReason;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\CouponUsage;
use App\Models\Order;
use App\Models\ProductVariant;
use App\Models\User;
use App\Payments\PaymentManager;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

/**
 * Applies permitted order status transitions and their side effects
 * (inventory restoration, payment state, coupon release, shipment dates).
 */
class OrderStatusService
{
    public function __construct(
        private InventoryService $inventory,
        private PaymentManager $payments,
    ) {}

    /**
     * @throws ValidationException when the transition is not permitted
     */
    public function transition(Order $order, OrderStatus $to, ?User $actor, ?string $note = null): Order
    {
        return DB::transaction(function () use ($order, $to, $actor, $note): Order {
            /** @var Order $locked */
            $locked = Order::query()->whereKey($order->getKey())->lockForUpdate()->firstOrFail();
            $from = $locked->status;

            if (! $from->canTransitionTo($to)) {
                throw ValidationException::withMessages([
                    'status' => "Cannot change order from {$from->value} to {$to->value}.",
                ]);
            }

            if ($to->restoresStock()) {
                $this->restoreStock($locked, $actor, $to === OrderStatus::Refunded ? InventoryReason::Return : InventoryReason::OrderCancelled);
            }

            $this->applyPaymentEffects($locked, $to);
            $this->applyShipmentEffects($locked, $to);

            if ($to === OrderStatus::Cancelled) {
                $this->releaseCoupon($locked);
            }

            $locked->forceFill([
                'status' => $to,
                'cancelled_at' => $to === OrderStatus::Cancelled ? now() : $locked->cancelled_at,
            ])->save();

            $locked->statusHistory()->create([
                'user_id' => $actor?->id,
                'from_status' => $from,
                'to_status' => $to,
                'note' => $note,
            ]);

            if ($actor?->isStaffMember()) {
                Log::info('Order status changed', [
                    'order' => $locked->number, 'from' => $from->value, 'to' => $to->value, 'admin_id' => $actor->id,
                ]);
            }

            return $locked->refresh();
        });
    }

    private function restoreStock(Order $order, ?User $actor, InventoryReason $reason): void
    {
        foreach ($order->items()->orderBy('product_variant_id')->get() as $item) {
            if ($item->product_variant_id === null) {
                continue;
            }

            $variant = ProductVariant::withTrashed()->find($item->product_variant_id);
            if ($variant === null) {
                continue;
            }

            $this->inventory->adjust($variant, $item->quantity, $reason, $actor, $order->id, "Order {$order->number} {$reason->value}");
            $variant->product()->where('sales_count', '>=', $item->quantity)->decrement('sales_count', $item->quantity);
        }
    }

    private function applyPaymentEffects(Order $order, OrderStatus $to): void
    {
        $gateway = $this->payments->for($order->payment_method);
        $payment = $order->payments()->latest('id')->first();
        if ($payment === null) {
            return;
        }

        match ($to) {
            OrderStatus::Delivered => $gateway->markPaid($payment),
            OrderStatus::Cancelled => $gateway->cancel($payment),
            OrderStatus::Refunded => $gateway->refund($payment),
            default => null,
        };

        $payment->refresh();
        $order->payment_status = match ($payment->status) {
            PaymentStatus::Paid => PaymentStatus::Paid,
            PaymentStatus::Refunded => PaymentStatus::Refunded,
            PaymentStatus::Cancelled => PaymentStatus::Cancelled,
            default => $order->payment_status,
        };
    }

    private function applyShipmentEffects(Order $order, OrderStatus $to): void
    {
        if ($to === OrderStatus::Shipped) {
            $order->shipment()->updateOrCreate([], ['shipped_at' => now()]);
        }
        if ($to === OrderStatus::Delivered) {
            $order->shipment()->updateOrCreate([], ['delivered_at' => now()]);
        }
    }

    private function releaseCoupon(Order $order): void
    {
        $usage = CouponUsage::query()->where('order_id', $order->id)->first();
        if ($usage === null) {
            return;
        }

        $usage->coupon()->where('used_count', '>', 0)->decrement('used_count');
        $usage->delete();
    }
}
