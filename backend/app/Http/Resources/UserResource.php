<?php

namespace App\Http\Resources;

use App\Models\User;
use App\Support\Money;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Never exposes password hashes, remember tokens or API tokens.
 *
 * @mixin User
 */
class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $viewer = $request->user();
        $isStaffViewer = $viewer?->isStaffMember() ?? false;
        $isSelf = $viewer?->id === $this->id;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'role' => $this->role,
            'is_active' => $this->is_active,
            'two_factor_enabled' => $this->when($isSelf && $this->isStaffMember(), fn () => $this->resource->hasTwoFactorEnabled()),
            'permissions' => $this->when($isSelf && $this->isStaffMember(), fn () => array_map(
                fn ($p) => $p->value,
                $this->role->permissions(),
            )),
            'email_verified_at' => $this->email_verified_at,
            'created_at' => $this->created_at,
            'last_login_at' => $this->when($isStaffViewer, fn () => $this->resource->getAttributes()['last_login_at'] ?? null),
            'orders_count' => $this->whenCounted('orders'),
            'orders_total' => $this->when(
                array_key_exists('orders_total', $this->resource->getAttributes()),
                fn () => Money::toMajor((int) $this->resource->getAttributes()['orders_total']),
            ),
            'addresses' => AddressResource::collection($this->whenLoaded('addresses')),
        ];
    }
}
