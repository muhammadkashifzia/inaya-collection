<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\TagResource;
use App\Models\Tag;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Product tags. Deleting a tag only removes it from products.
 */
class TagController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->validate(['q' => ['nullable', 'string', 'max:100']]);

        $tags = Tag::query()
            ->withCount('products')
            ->when($filters['q'] ?? null, function ($query, string $q): void {
                $term = '%'.str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $q).'%';
                $query->where(fn ($w) => $w->where('name', 'like', $term)->orWhere('slug', 'like', $term));
            })
            ->orderBy('name')
            ->get();

        return TagResource::collection($tags);
    }

    public function store(Request $request): JsonResponse
    {
        $tag = Tag::query()->create($this->validated($request, null));
        Log::info('Tag created', ['tag_id' => $tag->id, 'admin_id' => $request->user()->id]);

        return (new TagResource($tag->loadCount('products')))->response()->setStatusCode(201);
    }

    public function update(Request $request, Tag $tag): TagResource
    {
        $tag->update($this->validated($request, $tag));

        return new TagResource($tag->loadCount('products'));
    }

    public function destroy(Request $request, Tag $tag): JsonResponse
    {
        $tag->delete();
        Log::info('Tag deleted', ['tag_id' => $tag->id, 'admin_id' => $request->user()->id]);

        return response()->json(null, 204);
    }

    /**
     * @return array{name: string, slug: string}
     */
    private function validated(Request $request, ?Tag $tag): array
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'slug' => ['nullable', 'string', 'max:100', 'alpha_dash'],
        ]);

        $slug = Str::slug(($validated['slug'] ?? null) ?: $validated['name']);
        if ($slug === '') {
            throw ValidationException::withMessages(['name' => 'Use letters or numbers in the tag name.']);
        }

        $request->merge(['slug' => $slug])->validate([
            'slug' => [Rule::unique('tags', 'slug')->ignore($tag?->id)],
        ], ['slug.unique' => 'A tag with this name already exists.']);

        return ['name' => trim($validated['name']), 'slug' => $slug];
    }
}
