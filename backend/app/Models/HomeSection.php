<?php

namespace App\Models;

use App\Enums\HomeSectionType;
use Database\Factories\HomeSectionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['type', 'title', 'category_id', 'product_limit', 'items', 'sort_order', 'is_active'])]
class HomeSection extends Model
{
    /** @use HasFactory<HomeSectionFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => HomeSectionType::class,
            'product_limit' => 'integer',
            'items' => 'array',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /** @return BelongsTo<Category, $this> */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}
