<?php

namespace App\Models;

use Database\Factories\CmsPageFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * `sections` is a list of {heading?: string, body: string}. Bodies are plain
 * text and are rendered escaped on the storefront (no raw HTML).
 */
#[Fillable(['slug', 'title', 'sections', 'is_published', 'meta_title', 'meta_description'])]
class CmsPage extends Model
{
    /** @use HasFactory<CmsPageFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sections' => 'array',
            'is_published' => 'boolean',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
