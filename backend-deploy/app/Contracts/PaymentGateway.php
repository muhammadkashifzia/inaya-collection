<?php

namespace App\Contracts;

use App\Models\Order;
use App\Models\Payment;

/**
 * Boundary for payment providers. Online gateways must confirm payment via
 * server-side verification or signed webhooks, never via browser redirects.
 */
interface PaymentGateway
{
    /**
     * Create the payment record for a newly placed order (inside the checkout transaction).
     */
    public function initiate(Order $order): Payment;

    /**
     * Mark the payment as collected/captured.
     */
    public function markPaid(Payment $payment): void;

    /**
     * Refund (or record a manual refund for) the payment.
     */
    public function refund(Payment $payment): void;

    /**
     * Cancel a payment that was never collected.
     */
    public function cancel(Payment $payment): void;
}
