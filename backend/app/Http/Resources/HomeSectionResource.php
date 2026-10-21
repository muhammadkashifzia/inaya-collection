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
        $slides = null;
        $imageUrl = null;

        try {
            $rawSlides = $this->resource->getAttributes()['slides'] ?? null;
            $decoded = is_string($rawSlides) ? json_decode($rawSlides, true) : (is_array($rawSlides) ? $rawSlides : null);

            if (is_array($decoded) && $decoded !== []) {
                $slides = [];
                foreach ($decoded as $slide) {
                    if (! is_array($slide)) {
                        continue;
                    }
                    $slides[] = [
                        'image' => $slide['image'] ?? '',
                        'image_url' => ! empty($slide['image']) ? Storage::disk('public')->url($slide['image']) : null,
                        'text' => $slide['text'] ?? null,
                        'link' => $slide['link'] ?? null,
                    ];
                }
                if ($slides === []) {
                    $slides = null;
                }
            }

            $rawImage = $this->resource->getAttributes()['image'] ?? null;
            $imageUrl = $rawImage ? Storage::disk('public')->url($rawImage) : null;
        } catch (\Throwable) {
            // Silently handle any Storage or decode errors.
        }

        return [
            'id' => $this->id,
            'type' => $this->resource->getRawOriginal('type') ?? $this->type,
            'title' => $this->title,
            'subtitle' => $this->resource->getAttributes()['subtitle'] ?? null,
            'button_text' => $this->resource->getAttributes()['button_text'] ?? null,
            'button_link' => $this->resource->getAttributes()['button_link'] ?? null,
            'image' => $this->resource->getAttributes()['image'] ?? null,
            'image_url' => $imageUrl,
            'slides' => $slides,
            'category_id' => $this->category_id,
            'category' => new CategoryResource($this->whenLoaded('category')),
            'product_limit' => $this->product_limit,
            'sort_order' => $this->sort_order,
            'is_active' => $this->is_active,
        ];
    }
}
