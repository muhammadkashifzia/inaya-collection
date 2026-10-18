<?php

namespace App\Http\Requests;

use App\Services\ProductCatalog;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProductIndexRequest extends FormRequest
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
        return [
            'category' => ['nullable', 'string', 'max:120'],
            'q' => ['nullable', 'string', 'max:100'],
            'brand' => ['nullable', 'array', 'max:20'],
            'brand.*' => ['string', 'max:100'],
            'fabric' => ['nullable', 'array', 'max:20'],
            'fabric.*' => ['string', 'max:60'],
            'pieces' => ['nullable', 'integer', 'min:1', 'max:10'],
            'tag' => ['nullable', 'string', 'max:100'],
            'min_price' => ['nullable', 'numeric', 'min:0'],
            'max_price' => ['nullable', 'numeric', 'min:0', Rule::when($this->filled('min_price'), ['gte:min_price'])],
            'availability' => ['nullable', Rule::in(['in_stock', 'out_of_stock'])],
            'on_sale' => ['nullable', 'boolean'],
            'featured' => ['nullable', 'boolean'],
            'sort' => ['nullable', Rule::in(ProductCatalog::SORTS)],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:48'],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function filters(): array
    {
        $data = $this->validated();
        foreach (['on_sale', 'featured'] as $flag) {
            if (array_key_exists($flag, $data)) {
                $data[$flag] = $this->boolean($flag);
            }
        }

        return $data;
    }
}
