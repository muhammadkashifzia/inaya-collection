<?php

namespace App\Services;

use Illuminate\Validation\ValidationException;

class ShippingService
{
    public function __construct(private SettingsService $settings) {}

    /**
     * @return list<array{code: string, name: string, fee: int, is_active: bool}>
     */
    public function activeMethods(): array
    {
        return array_values(array_filter(
            (array) $this->settings->get('shipping.methods', []),
            fn (array $method): bool => (bool) ($method['is_active'] ?? false),
        ));
    }

    /**
     * Shipping fee in minor units for the given method and discounted subtotal.
     *
     * @throws ValidationException when the method is unknown or inactive
     */
    public function quote(?string $methodCode, int $discountedSubtotal): int
    {
        $methods = $this->activeMethods();
        $method = $methodCode === null
            ? ($methods[0] ?? null)
            : collect($methods)->firstWhere('code', $methodCode);

        if ($method === null) {
            throw ValidationException::withMessages(['shipping_method' => 'Please choose a valid shipping method.']);
        }

        $threshold = $this->settings->get('shipping.free_shipping_threshold');
        if ($method['code'] === 'standard' && $threshold !== null && $discountedSubtotal >= (int) $threshold) {
            return 0;
        }

        return (int) $method['fee'];
    }
}
