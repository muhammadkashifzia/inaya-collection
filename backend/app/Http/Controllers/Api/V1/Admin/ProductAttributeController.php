<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductAttributeResource;
use App\Models\ProductAttribute;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Variant attributes (Color, Size…) with their allowed values. The product
 * form uses them as suggestions for variant options.
 */
class ProductAttributeController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return ProductAttributeResource::collection(
            ProductAttribute::query()->with('values')->orderBy('sort_order')->orderBy('name')->get(),
        );
    }

    public function store(Request $request): JsonResponse
    {
        $attribute = $this->save($request, null);
        Log::info('Product attribute created', ['attribute_id' => $attribute->id, 'admin_id' => $request->user()->id]);

        return (new ProductAttributeResource($attribute))->response()->setStatusCode(201);
    }

    public function update(Request $request, ProductAttribute $attribute): ProductAttributeResource
    {
        return new ProductAttributeResource($this->save($request, $attribute));
    }

    /**
     * Existing variant options keep their stored values; only the suggestion list is removed.
     */
    public function destroy(Request $request, ProductAttribute $attribute): JsonResponse
    {
        $attribute->delete();
        Log::info('Product attribute deleted', ['attribute_id' => $attribute->id, 'admin_id' => $request->user()->id]);

        return response()->json(null, 204);
    }

    private function save(Request $request, ?ProductAttribute $attribute): ProductAttribute
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:60'],
            'slug' => ['nullable', 'string', 'max:60'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:10000'],
            'values' => ['nullable', 'array', 'max:200'],
            'values.*' => ['required', 'string', 'max:60', 'distinct:ignore_case'],
        ], [
            'values.*.distinct' => 'Each value can only be added once.',
            'values.*.required' => 'Values cannot be empty.',
        ]);

        // Option keys are stored lowercase with underscores (e.g. "color", "dupatta_fabric").
        $slug = Str::slug(($validated['slug'] ?? null) ?: $validated['name'], '_');
        if ($slug === '') {
            throw ValidationException::withMessages(['name' => 'Use letters or numbers in the attribute name.']);
        }
        $request->merge(['slug' => $slug])->validate([
            'slug' => [Rule::unique('product_attributes', 'slug')->ignore($attribute?->id)],
        ], ['slug.unique' => 'An attribute with this name already exists.']);

        return DB::transaction(function () use ($attribute, $validated, $slug): ProductAttribute {
            $fields = ['name' => trim($validated['name']), 'slug' => $slug, 'sort_order' => $validated['sort_order'] ?? 0];
            $attribute === null ? $attribute = ProductAttribute::query()->create($fields) : $attribute->update($fields);

            $values = array_values(array_map('trim', $validated['values'] ?? []));
            $attribute->values()->whereNotIn('value', $values)->delete();
            foreach ($values as $position => $value) {
                $attribute->values()->updateOrCreate(['value' => $value], ['sort_order' => $position]);
            }

            return $attribute->load('values');
        });
    }
}
