<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * In-app notification shown in the admin header bell icon.
 *
 * @property int    $id
 * @property string $type          new_order | new_message
 * @property string $title
 * @property string $body
 * @property string $link
 * @property ?int   $reference_id
 * @property ?\Illuminate\Support\Carbon $read_at
 * @property \Illuminate\Support\Carbon  $created_at
 * @property \Illuminate\Support\Carbon  $updated_at
 */
#[Fillable(['type', 'title', 'body', 'link', 'reference_id', 'read_at'])]
class AdminNotification extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
        ];
    }

    public function isRead(): bool
    {
        return $this->read_at !== null;
    }

    /**
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeUnread(Builder $query): Builder
    {
        return $query->whereNull('read_at');
    }
}
