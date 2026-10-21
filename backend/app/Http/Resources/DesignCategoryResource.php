<?php

namespace App\Http\Resources;

use App\Models\DesignCategory;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/** @mixin DesignCategory */
class DesignCategoryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'parent_id' => $this->parent_id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'display_type' => $this->display_type,
            'image' => $this->image ? Storage::disk('public')->url($this->image) : null,
            'image_path' => $this->when($request->user()?->isStaffMember() ?? false, $this->image),
            'sort_order' => $this->sort_order,
            'is_active' => $this->is_active,
            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,
            'parent' => new DesignCategoryResource($this->whenLoaded('parent')),
            'children' => DesignCategoryResource::collection($this->whenLoaded('children')),
        ];
    }
}
