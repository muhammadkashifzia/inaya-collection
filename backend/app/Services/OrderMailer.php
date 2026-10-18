<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Mail\OrderStatusMail;
use App\Models\Order;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * Sends customer order lifecycle emails (placed, processing, shipped,
 * out for delivery, delivered). Delivery is deferred until the surrounding
 * transaction commits and a mail failure never breaks the order flow.
 */
class OrderMailer
{
    public function __construct(private SettingsService $settings) {}

    public function sendForStatus(Order $order, OrderStatus $status): void
    {
        $orderId = $order->getKey();

        DB::afterCommit(function () use ($orderId, $status): void {
            $order = Order::query()->with(['items', 'shipment'])->find($orderId);
            if ($order === null || blank($order->email)) {
                return;
            }

            try {
                Mail::to($order->email, $order->customer_name)->send(new OrderStatusMail($order, $status, $this->settings->all()));
            } catch (Throwable $e) {
                report($e);
            }
        });
    }
}
