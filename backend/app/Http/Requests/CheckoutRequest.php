<?php

namespace App\Http\Requests;

use App\Enums\PaymentMethod;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Checkout input. Prices, discounts and totals are intentionally NOT accepted;
 * they are recomputed on the server.
 */
class CheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $user = $this->user('sanctum');

        return [
            'customer_name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email:rfc', 'max:255'],
            'phone' => ['required', 'string', 'max:30', 'regex:/^[0-9+\-\s()]{7,30}$/'],
            'shipping_address_id' => ['nullable', 'integer', Rule::exists('addresses', 'id')->where('user_id', $user?->id ?? 0)],
            ...AddressRequest::addressRules('shipping_address.', required: ! $this->filled('shipping_address_id')),
            'billing_same_as_shipping' => ['required', 'boolean'],
            ...AddressRequest::addressRules('billing_address.', required: ! $this->boolean('billing_same_as_shipping')),
            'shipping_method' => ['required', 'string', 'max:50'],
            'payment_method' => ['required', Rule::enum(PaymentMethod::class)],
            'customer_note' => ['nullable', 'string', 'max:1000'],
            'save_address' => ['nullable', 'boolean'],
        ];
    }

    /**
     * Human-friendly field names for validation messages.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        $names = [];
        foreach (['shipping_address' => 'delivery', 'billing_address' => 'billing'] as $prefix => $label) {
            $names += [
                "{$prefix}.full_name" => "{$label} full name",
                "{$prefix}.phone" => "{$label} phone",
                "{$prefix}.line1" => "{$label} address",
                "{$prefix}.line2" => "{$label} apartment / area",
                "{$prefix}.city" => "{$label} city",
                "{$prefix}.province" => "{$label} province",
                "{$prefix}.postal_code" => "{$label} postal code",
                "{$prefix}.country" => "{$label} country",
            ];
        }

        return $names + [
            'customer_name' => 'full name',
            'shipping_address_id' => 'saved address',
            'shipping_method' => 'shipping method',
            'payment_method' => 'payment method',
        ];
    }

    public function idempotencyKey(): string
    {
        return (string) $this->header('Idempotency-Key');
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            $key = $this->idempotencyKey();
            if ($key === '' || strlen($key) > 100 || ! preg_match('/^[A-Za-z0-9\-_]{16,100}$/', $key)) {
                $v->errors()->add('idempotency_key', 'A valid Idempotency-Key header is required.');
            }
        });
    }
}
