<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AddressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Shared address rules (also reused by checkout with a key prefix).
     *
     * @return array<string, mixed>
     */
    public static function addressRules(string $prefix = '', bool $required = true): array
    {
        $req = $required ? 'required' : 'nullable';

        return [
            "{$prefix}full_name" => [$req, 'string', 'max:120'],
            "{$prefix}phone" => [$req, 'string', 'max:30', 'regex:/^[0-9+\-\s()]{7,30}$/'],
            "{$prefix}line1" => [$req, 'string', 'max:255'],
            "{$prefix}line2" => ['nullable', 'string', 'max:255'],
            "{$prefix}city" => [$req, 'string', 'max:100'],
            "{$prefix}province" => ['nullable', 'string', 'max:100'],
            "{$prefix}postal_code" => ['nullable', 'string', 'max:20'],
            "{$prefix}country" => ['nullable', 'string', 'size:2'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $required = $this->isMethod('POST');

        return [
            'label' => ['nullable', 'string', 'max:40'],
            ...self::addressRules('', $required),
            'is_default_shipping' => ['nullable', 'boolean'],
            'is_default_billing' => ['nullable', 'boolean'],
        ];
    }
}
