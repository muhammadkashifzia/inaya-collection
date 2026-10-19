<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'parent_id', 'name', 'slug', 'description', 'display_type', 'image',
    'sort_order', 'is_active', 'meta_title', 'meta_description',
])]
class DesignCategory extends Model
{
    use SoftDeletes;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /** @return BelongsTo<DesignCategory, $this> */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(DesignCategory::class, 'parent_id');
    }

    /** @return HasMany<DesignCategory, $this> */
    public function children(): HasMany
    {
        return $this->hasMany(DesignCategory::class, 'parent_id')->orderBy('sort_order');
    }

    /** @param Builder<DesignCategory> $query */
    #[Scope]
    protected function active(Builder $query): void
    {
        $query->where('is_active', true);
    }

    /**
     * IDs of this design category and all descendants (for filtering a parent category).
     *
     * @return list<int>
     */
    public function selfAndDescendantIds(): array
    {
        $ids = [$this->id];
        $frontier = [$this->id];

        while ($frontier !== []) {
            $frontier = DesignCategory::query()->whereIn('parent_id', $frontier)->pluck('id')->all();
            $ids = [...$ids, ...$frontier];
        }

        return $ids;
    }
}
