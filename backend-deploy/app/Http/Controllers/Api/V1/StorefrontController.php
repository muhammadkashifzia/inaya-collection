<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\BannerPlacement;
use App\Http\Controllers\Controller;
use App\Http\Resources\BannerResource;
use App\Http\Resources\CmsPageResource;
use App\Models\Banner;
use App\Models\CmsPage;
use App\Models\NewsletterSubscription;
use App\Services\SettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

/**
 * Small public endpoints: settings, banners, CMS pages, newsletter.
 */
class StorefrontController extends Controller
{
    /**
     * GET /api/v1/settings — public store configuration (no secrets).
     */
    public function settings(SettingsService $settings): JsonResponse
    {
        return response()->json(['data' => $settings->publicSettings()]);
    }

    /**
     * GET /api/v1/banners?placement=hero
     */
    public function banners(Request $request): AnonymousResourceCollection
    {
        $validated = $request->validate(['placement' => ['nullable', Rule::enum(BannerPlacement::class)]]);

        return BannerResource::collection(
            Banner::query()->live()
                ->when($validated['placement'] ?? null, fn ($q, $placement) => $q->where('placement', $placement))
                ->get(),
        );
    }

    /**
     * GET /api/v1/pages — published CMS pages (slug + title only).
     */
    public function pages(): JsonResponse
    {
        return response()->json([
            'data' => CmsPage::query()->where('is_published', true)->orderBy('title')->get(['slug', 'title', 'updated_at']),
        ]);
    }

    /**
     * GET /api/v1/pages/{slug}
     */
    public function page(string $slug): CmsPageResource
    {
        return new CmsPageResource(CmsPage::query()->where('is_published', true)->where('slug', $slug)->firstOrFail());
    }

    /**
     * POST /api/v1/newsletter
     */
    public function subscribe(Request $request): JsonResponse
    {
        $validated = $request->validate(['email' => ['required', 'email:rfc', 'max:255']]);

        NewsletterSubscription::query()->updateOrCreate(
            ['email' => strtolower($validated['email'])],
            ['is_subscribed' => true, 'unsubscribed_at' => null],
        );

        return response()->json(['message' => 'Thanks for subscribing.'], 201);
    }
}
