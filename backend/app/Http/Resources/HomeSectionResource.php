<?php

namespace App\Http\Resources;

use App\Models\HomeSection;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/** @mixin HomeSection */
class HomeSectionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'title' => $this->title,
            'category_id' => $this->category_id,
            'category' => new CategoryResource($this->whenLoaded('category')),
            'product_limit' => $this->product_limit,
            'items' => $this->imageItems(),
            'sort_order' => $this->sort_order,
            'is_active' => $this->is_active,
        ];
    }

    /**
     * Image banner cards with both the stored path (for re-saving) and the public URL.
     *
     * @return list<array{image_path: string, image: string, title: string|null, subtitle: string|null, href: string|null, align: string}>
     */
    private function imageItems(): array
    {
        $disk = Storage::disk('public');

        return array_values(array_map(fn (array $item): array => [
            'image_path' => $item['image'],
            'image' => $disk->url($item['image']),
            'title' => $item['title'] ?? null,
            'subtitle' => $item['subtitle'] ?? null,
            'href' => $item['href'] ?? null,
            'align' => $item['align'] ?? 'center',
        ], $this->items ?? []));
    }
}
