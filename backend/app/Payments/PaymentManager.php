<?php

namespace App\Payments;

use App\Contracts\PaymentGateway;
use App\Enums\PaymentMethod;
use Illuminate\Contracts\Container\Container;

/**
 * Resolves the gateway implementation for a payment method.
 * Add new online gateways here once credentials are configured and tested.
 */
class PaymentManager
{
    public function __construct(private Container $container) {}

    public function for(PaymentMethod $method): PaymentGateway
    {
        return match ($method) {
            PaymentMethod::CashOnDelivery => $this->container->make(CashOnDeliveryGateway::class),
        };
    }
}
