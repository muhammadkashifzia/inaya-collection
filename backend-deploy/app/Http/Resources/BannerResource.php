<?php

namespace App\Http\Resources;

use App\Models\Banner;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/** @mixin Banner */
class BannerResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $isStaff = $request->user()?->isStaffMember() ?? false;
        $disk = Storage::disk('public');

        return [
            'id' => $this->id,
            'placement' => $this->placement,
            'title' => $this->title,
            'subtitle' => $this->subtitle,
            'image' => $disk->url($this->image),
            'mobile_image' => $this->mobile_image ? $disk->url($this->mobile_image) : null,
            'image_path' => $this->when($isStaff, $this->image),
            'mobile_image_path' => $this->when($isStaff, $this->mobile_image),
            'buttons' => $this->buttons ?? [],
            'sort_order' => $this->sort_order,
            'is_active' => $this->when($isStaff, $this->is_active),
            'starts_at' => $this->when($isStaff, $this->starts_at),
            'ends_at' => $this->when($isStaff, $this->ends_at),
        ];
    }
}
