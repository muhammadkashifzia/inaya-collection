<?php

namespace App\Http\Resources;

use App\Models\HomeSection;
use App\Models\Product;
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
        $looks = null;
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

            $rawLooks = $this->resource->getAttributes()['looks'] ?? null;
            $decodedLooks = is_string($rawLooks) ? json_decode($rawLooks, true) : (is_array($rawLooks) ? $rawLooks : null);

            if (is_array($decodedLooks) && $decodedLooks !== []) {
                $looks = [];
                foreach ($decodedLooks as $look) {
                    if (! is_array($look)) {
                        continue;
                    }
                    $looks[] = [
                        'image' => $look['image'] ?? '',
                        'image_url' => ! empty($look['image']) ? Storage::disk('public')->url($look['image']) : null,
                        'product_ids' => $look['product_ids'] ?? [],
                        'products' => collect($look['product_ids'] ?? [])
                            ->map(fn ($id) => Product::find($id))
                            ->filter()
                            ->map(fn ($p) => ['id' => $p->id, 'name' => $p->name])
                            ->values()
                            ->all(),
                    ];
                }
                if ($looks === []) {
                    $looks = null;
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
            'looks' => $looks,
            'category_id' => $this->category_id,
            'category' => new CategoryResource($this->whenLoaded('category')),
            'product_limit' => $this->product_limit,
            'sort_order' => $this->sort_order,
            'is_active' => $this->is_active,
        ];
    }
}
