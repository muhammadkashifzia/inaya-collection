<?php

namespace App\Http\Resources;

use App\Models\ProductAttribute;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ProductAttribute */
class ProductAttributeResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'sort_order' => $this->sort_order,
            'values' => $this->whenLoaded('values', fn () => $this->values->map(fn ($value): array => [
                'id' => $value->id,
                'value' => $value->value,
                'sort_order' => $value->sort_order,
            ])->all()),
        ];
    }
}
