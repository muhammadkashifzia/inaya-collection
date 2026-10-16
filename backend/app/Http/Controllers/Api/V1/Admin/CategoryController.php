<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class CategoryController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return CategoryResource::collection(
            Category::query()->with('parent')->withCount('products')->orderBy('parent_id')->orderBy('sort_order')->get(),
        );
    }

    public function show(Category $category): CategoryResource
    {
        return new CategoryResource($category->load(['parent', 'children'])->loadCount('products'));
    }

    public function store(Request $request): JsonResponse
    {
        $category = Category::query()->create($this->validated($request, null));

        return (new CategoryResource($category->loadCount('products')))->response()->setStatusCode(201);
    }

    public function update(Request $request, Category $category): CategoryResource
    {
        $category->update($this->validated($request, $category));

        return new CategoryResource($category->refresh()->load('parent')->loadCount('products'));
    }

    /**
     * Refuses to delete categories that still have products or subcategories.
     */
    public function destroy(Category $category): JsonResponse
    {
        if ($category->products()->withTrashed()->exists()) {
            throw ValidationException::withMessages(['category' => 'Move or delete this category\'s products first.']);
        }
        if ($category->children()->exists()) {
            throw ValidationException::withMessages(['category' => 'Delete or move the subcategories first.']);
        }

        $category->delete();

        return response()->json(null, 204);
    }

    public function uploadImage(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'image' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $path = $validated['image']->store('categories', 'public');

        return response()->json(['path' => $path, 'url' => Storage::disk('public')->url($path)], 201);
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?Category $category): array
    {
        $data = $request->validate([
            'parent_id' => [
                'nullable', 'integer', Rule::exists('categories', 'id')->whereNull('deleted_at'),
                Rule::notIn($category ? $category->selfAndDescendantIds() : []),
            ],
            'name' => ['required', 'string', 'max:120'],
            'short_name' => ['nullable', 'string', 'max:60'],
            'slug' => ['nullable', 'string', 'max:255', 'alpha_dash', Rule::unique('categories', 'slug')->ignore($category?->id)],
            'description' => ['nullable', 'string', 'max:2000'],
            'image' => ['nullable', 'string', 'max:255', 'regex:#^(categories|seed)/[A-Za-z0-9/_\-.]+$#'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:100000'],
            'is_active' => ['nullable', 'boolean'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
        ], ['parent_id.not_in' => 'A category cannot be its own parent or descendant.']);

        $data['slug'] = ($data['slug'] ?? null) ?: Str::slug($data['name']);
        $data['sort_order'] ??= 0;
        $data['is_active'] = $request->boolean('is_active', true);

        if (Category::withTrashed()->where('slug', $data['slug'])->when($category, fn ($q) => $q->whereKeyNot($category->id))->exists()) {
            throw ValidationException::withMessages(['slug' => 'This slug is already in use.']);
        }

        return $data;
    }
}
