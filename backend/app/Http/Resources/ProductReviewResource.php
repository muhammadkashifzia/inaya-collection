<?php

namespace App\Http\Resources;

use App\Models\ProductReview;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Staff see the full review (email, status, product); the storefront only
 * gets the public fields.
 *
 * @mixin ProductReview
 */
class ProductReviewResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $isStaff = $request->user()?->isStaffMember() ?? false;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'rating' => $this->rating,
            'title' => $this->title,
            'body' => $this->body,
            'is_verified_buyer' => $this->is_verified_buyer,
            'created_at' => $this->created_at,
            $this->mergeWhen($isStaff, fn (): array => [
                'email' => $this->email,
                'status' => $this->status,
                'user_id' => $this->user_id,
                'ip_address' => $this->ip_address,
                'updated_at' => $this->updated_at,
                'product' => $this->relationLoaded('product') && $this->product ? [
                    'id' => $this->product->id,
                    'name' => $this->product->name,
                    'slug' => $this->product->slug,
                ] : null,
            ]),
        ];
    }
}
