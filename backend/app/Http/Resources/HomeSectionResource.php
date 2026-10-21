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
            'subtitle' => $this->subtitle,
            'button_text' => $this->button_text,
            'button_link' => $this->button_link,
            'image' => $this->image,
            'image_url' => $this->image ? Storage::disk('public')->url($this->image) : null,
            'slides' => $this->resolveSlides(),
            'category_id' => $this->category_id,
            'category' => new CategoryResource($this->whenLoaded('category')),
            'product_limit' => $this->product_limit,
            'sort_order' => $this->sort_order,
            'is_active' => $this->is_active,
        ];
    }

    /**
     * Resolve slide image paths to full URLs.
     *
     * @return list<array{image: string, image_url: string|null, text: string|null, link: string|null}>|null
     */
    private function resolveSlides(): ?array
    {
        $slides = $this->slides;

        if (! is_array($slides) || $slides === []) {
            return null;
        }

        $resolved = [];

        foreach ($slides as $slide) {
            if (! is_array($slide)) {
                continue;
            }

            $resolved[] = [
                'image' => $slide['image'] ?? '',
                'image_url' => ! empty($slide['image']) ? Storage::disk('public')->url($slide['image']) : null,
                'text' => $slide['text'] ?? null,
                'link' => $slide['link'] ?? null,
            ];
        }

        return $resolved === [] ? null : $resolved;
    }
}
