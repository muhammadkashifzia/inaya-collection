<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CategoryController extends Controller
{
    /**
     * GET /api/v1/categories — active top-level categories with active children.
     */
    public function index(): AnonymousResourceCollection
    {
        $categories = Category::query()
            ->active()
            ->whereNull('parent_id')
            ->with(['children' => fn ($q) => $q->active()])
            ->withCount(['products' => fn ($q) => $q->visible()])
            ->orderBy('sort_order')
            ->get();

        return CategoryResource::collection($categories);
    }

    /**
     * GET /api/v1/categories/{slug}
     */
    public function show(string $slug): CategoryResource
    {
        $category = Category::query()
            ->active()
            ->where('slug', $slug)
            ->with(['parent', 'children' => fn ($q) => $q->active()])
            ->withCount(['products' => fn ($q) => $q->visible()])
            ->firstOrFail();

        return new CategoryResource($category);
    }
}
