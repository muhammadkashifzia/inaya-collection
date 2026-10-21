<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\DesignCategoryResource;
use App\Models\DesignCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class DesignCategoryController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return DesignCategoryResource::collection(
            DesignCategory::query()->with('parent')->orderBy('parent_id')->orderBy('sort_order')->get(),
        );
    }

    public function show(DesignCategory $designCategory): DesignCategoryResource
    {
        return new DesignCategoryResource($designCategory->load(['parent', 'children']));
    }

    public function store(Request $request): JsonResponse
    {
        $designCategory = DesignCategory::query()->create($this->validated($request, null));

        return (new DesignCategoryResource($designCategory))->response()->setStatusCode(201);
    }

    public function update(Request $request, DesignCategory $designCategory): DesignCategoryResource
    {
        $designCategory->update($this->validated($request, $designCategory));

        return new DesignCategoryResource($designCategory->refresh()->load('parent'));
    }

    /**
     * Refuses to delete design categories that still have subcategories.
     */
    public function destroy(DesignCategory $designCategory): JsonResponse
    {
        if ($designCategory->children()->exists()) {
            throw ValidationException::withMessages(['design_category' => 'Delete or move the subcategories first.']);
        }

        $designCategory->delete();

        return response()->json(null, 204);
    }

    public function uploadImage(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'image' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $path = $validated['image']->store('design-categories', 'public');

        return response()->json(['path' => $path, 'url' => Storage::disk('public')->url($path)], 201);
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?DesignCategory $designCategory): array
    {
        $data = $request->validate([
            'parent_id' => [
                'nullable', 'integer', Rule::exists('design_categories', 'id')->whereNull('deleted_at'),
                Rule::notIn($designCategory ? $designCategory->selfAndDescendantIds() : []),
            ],
            'name' => ['required', 'string', 'max:120'],
            'slug' => ['nullable', 'string', 'max:255', 'alpha_dash', Rule::unique('design_categories', 'slug')->ignore($designCategory?->id)],
            'description' => ['nullable', 'string', 'max:2000'],
            'display_type' => ['nullable', 'string', 'in:default,products,subcategories,both'],
            'image' => ['nullable', 'string', 'max:255', 'regex:#^(design-categories|seed)/[A-Za-z0-9/_\-.]+$#'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:100000'],
            'is_active' => ['nullable', 'boolean'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
        ], ['parent_id.not_in' => 'A design category cannot be its own parent or descendant.']);

        $data['slug'] = ($data['slug'] ?? null) ?: Str::slug($data['name']);
        $data['sort_order'] ??= 0;
        $data['display_type'] ??= 'default';
        $data['is_active'] = $request->boolean('is_active', true);

        if (DesignCategory::withTrashed()->where('slug', $data['slug'])->when($designCategory, fn ($q) => $q->whereKeyNot($designCategory->id))->exists()) {
            throw ValidationException::withMessages(['slug' => 'This slug is already in use.']);
        }

        return $data;
    }
}
