<?php

namespace App\Payments;

use App\Contracts\PaymentGateway;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\Payment;

/**
 * Cash on Delivery: payment stays pending until the order is delivered and
 * cash is collected. Refunds are recorded for manual reconciliation.
 */
class CashOnDeliveryGateway implements PaymentGateway
{
    public function initiate(Order $order): Payment
    {
        return $order->payments()->create([
            'method' => PaymentMethod::CashOnDelivery,
            'status' => PaymentStatus::Pending,
            'amount' => $order->grand_total,
            'currency' => $order->currency,
        ]);
    }

    public function markPaid(Payment $payment): void
    {
        if ($payment->status === PaymentStatus::Paid) {
            return;
        }

        $payment->update(['status' => PaymentStatus::Paid, 'paid_at' => now()]);
    }

    public function refund(Payment $payment): void
    {
        if ($payment->status === PaymentStatus::Refunded) {
            return;
        }

        $payment->update([
            'status' => $payment->status === PaymentStatus::Paid ? PaymentStatus::Refunded : PaymentStatus::Cancelled,
            'refunded_at' => $payment->status === PaymentStatus::Paid ? now() : null,
        ]);
    }

    public function cancel(Payment $payment): void
    {
        if ($payment->status === PaymentStatus::Pending) {
            $payment->update(['status' => PaymentStatus::Cancelled]);
        }
    }
}
