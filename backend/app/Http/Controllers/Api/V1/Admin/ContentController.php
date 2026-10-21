<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\BannerPlacement;
use App\Enums\HomeSectionType;
use App\Http\Controllers\Controller;
use App\Http\Resources\BannerResource;
use App\Http\Resources\CmsPageResource;
use App\Http\Resources\HomeSectionResource;
use App\Models\Banner;
use App\Models\CmsPage;
use App\Models\HomeSection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

/**
 * Banners, homepage sections and CMS pages.
 */
class ContentController extends Controller
{
    // ----- Banners -----

    public function banners(): AnonymousResourceCollection
    {
        return BannerResource::collection(Banner::query()->orderBy('placement')->orderBy('sort_order')->get());
    }

    public function storeBanner(Request $request): JsonResponse
    {
        $banner = Banner::query()->create($this->bannerData($request));

        return (new BannerResource($banner))->response()->setStatusCode(201);
    }

    public function updateBanner(Request $request, Banner $banner): BannerResource
    {
        $banner->update($this->bannerData($request));

        return new BannerResource($banner->refresh());
    }

    public function destroyBanner(Banner $banner): JsonResponse
    {
        $banner->delete();

        return response()->json(null, 204);
    }

    public function uploadBannerImage(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'image' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:8192'],
        ]);
        $path = $validated['image']->store('banners', 'public');

        return response()->json(['path' => $path, 'url' => Storage::disk('public')->url($path)], 201);
    }

    /**
     * @return array<string, mixed>
     */
    private function bannerData(Request $request): array
    {
        $data = $request->validate([
            'placement' => ['required', Rule::enum(BannerPlacement::class)],
            'title' => ['required', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:500'],
            'image' => ['required', 'string', 'max:255', 'regex:#^(banners|seed)/[A-Za-z0-9/_\-.]+$#'],
            'mobile_image' => ['nullable', 'string', 'max:255', 'regex:#^(banners|seed)/[A-Za-z0-9/_\-.]+$#'],
            'buttons' => ['nullable', 'array', 'max:6'],
            'buttons.*.label' => ['required', 'string', 'max:40'],
            'buttons.*.href' => ['required', 'string', 'max:255', 'regex:#^(/[^\s]*|https://[^\s]+)$#'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after:starts_at'],
        ]);
        $data['is_active'] = $request->boolean('is_active', true);
        $data['sort_order'] ??= 0;

        return $data;
    }

    // ----- Home sections -----

    public function sections(): AnonymousResourceCollection
    {
        return HomeSectionResource::collection(HomeSection::query()->with('category')->orderBy('sort_order')->get());
    }

    public function storeSection(Request $request): JsonResponse
    {
        $section = HomeSection::query()->create($this->sectionData($request));

        return (new HomeSectionResource($section->load('category')))->response()->setStatusCode(201);
    }

    public function updateSection(Request $request, HomeSection $section): HomeSectionResource
    {
        $section->update($this->sectionData($request));

        return new HomeSectionResource($section->refresh()->load('category'));
    }

    public function destroySection(HomeSection $section): JsonResponse
    {
        $section->delete();

        return response()->json(null, 204);
    }

    /**
     * @return array<string, mixed>
     */
    private function sectionData(Request $request): array
    {
        $isBanner = $request->input('type') === HomeSectionType::BannerImage->value;

        $data = $request->validate([
            'type' => ['required', Rule::enum(HomeSectionType::class)],
            'title' => ['required', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:500'],
            'button_text' => ['nullable', 'string', 'max:100'],
            'button_link' => ['nullable', 'string', 'max:255'],
            'image' => ['nullable', 'string', 'max:255'],
            'slides' => [Rule::requiredIf($isBanner), 'nullable', 'array', 'min:1', 'max:20'],
            'slides.*.image' => ['required', 'string', 'max:255'],
            'slides.*.text' => ['nullable', 'string', 'max:255'],
            'slides.*.link' => ['nullable', 'string', 'max:255'],
            'category_id' => [Rule::requiredIf($request->input('type') === HomeSectionType::Category->value), 'nullable', 'integer', 'exists:categories,id'],
            'product_limit' => ['nullable', 'integer', 'min:1', 'max:24'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);
        $data['is_active'] = $request->boolean('is_active', true);
        $data['product_limit'] ??= 8;
        $data['sort_order'] ??= 0;

        // Null out banner-specific fields for non-banner types.
        if (! $isBanner) {
            $data['subtitle'] = null;
            $data['button_text'] = null;
            $data['button_link'] = null;
            $data['image'] = null;
            $data['slides'] = null;
        }

        return $data;
    }

    // ----- CMS pages -----

    public function pages(): AnonymousResourceCollection
    {
        return CmsPageResource::collection(CmsPage::query()->orderBy('title')->get());
    }

    public function showPage(CmsPage $page): CmsPageResource
    {
        return new CmsPageResource($page);
    }

    public function storePage(Request $request): JsonResponse
    {
        $page = CmsPage::query()->create($this->pageData($request, null));

        return (new CmsPageResource($page))->response()->setStatusCode(201);
    }

    public function updatePage(Request $request, CmsPage $page): CmsPageResource
    {
        $page->update($this->pageData($request, $page));

        return new CmsPageResource($page->refresh());
    }

    public function destroyPage(CmsPage $page): JsonResponse
    {
        $page->delete();

        return response()->json(null, 204);
    }

    /**
     * @return array<string, mixed>
     */
    private function pageData(Request $request, ?CmsPage $page): array
    {
        $data = $request->validate([
            'slug' => ['required', 'string', 'max:120', 'alpha_dash', Rule::unique('cms_pages', 'slug')->ignore($page?->id)],
            'title' => ['required', 'string', 'max:255'],
            'sections' => ['required', 'array', 'min:1', 'max:50'],
            'sections.*.heading' => ['nullable', 'string', 'max:255'],
            'sections.*.body' => ['required', 'string', 'max:10000'],
            'is_published' => ['nullable', 'boolean'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
        ]);
        $data['is_published'] = $request->boolean('is_published', true);
        $data['sections'] = array_map(fn (array $s): array => [
            'heading' => $s['heading'] ?? null,
            'body' => $s['body'],
        ], $data['sections']);

        return $data;
    }
}
