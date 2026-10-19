<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Services\SettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Store settings. Money values (fees, thresholds) are minor units here,
 * matching the stored format; the admin UI converts for display.
 */
class SettingsController extends Controller
{
    public function show(SettingsService $settings): JsonResponse
    {
        return response()->json(['data' => $settings->all()]);
    }

    public function update(Request $request, SettingsService $settings): JsonResponse
    {
        $validated = $request->validate([
            'store' => ['sometimes', 'array'],
            'store.name' => ['required_with:store', 'string', 'max:120'],
            'store.tagline' => ['nullable', 'string', 'max:255'],
            'store.about' => ['nullable', 'string', 'max:1000'],
            'store.email' => ['nullable', 'email', 'max:255'],
            'store.phone' => ['nullable', 'string', 'max:30'],
            'store.whatsapp' => ['nullable', 'string', 'max:30'],
            'store.address' => ['nullable', 'string', 'max:500'],
            'store.hours' => ['nullable', 'string', 'max:120'],
            'store.logo' => ['nullable', 'string', 'max:255', 'regex:#^logos/[A-Za-z0-9._-]+$#'],
            'store.logo_type' => ['sometimes', 'in:text,image'],

            'localization' => ['sometimes', 'array'],
            'localization.currency' => ['required_with:localization', 'string', 'size:3'],
            'localization.currency_symbol' => ['required_with:localization', 'string', 'max:5'],
            'localization.timezone' => ['required_with:localization', 'timezone:all'],

            'shipping' => ['sometimes', 'array'],
            'shipping.free_shipping_threshold' => ['nullable', 'integer', 'min:0'],
            'shipping.methods' => ['required_with:shipping', 'array', 'min:1', 'max:10'],
            'shipping.methods.*.code' => ['required', 'string', 'max:50', 'alpha_dash', 'distinct'],
            'shipping.methods.*.name' => ['required', 'string', 'max:120'],
            'shipping.methods.*.fee' => ['required', 'integer', 'min:0'],
            'shipping.methods.*.is_active' => ['required', 'boolean'],

            'tax' => ['sometimes', 'array'],
            'tax.rate_percent' => ['required_with:tax', 'numeric', 'min:0', 'max:100'],
            'tax.prices_include_tax' => ['required_with:tax', 'boolean'],

            'payments' => ['sometimes', 'array'],
            'payments.cod_enabled' => ['required_with:payments', 'boolean'],
            'payments.cod_max_order_amount' => ['nullable', 'integer', 'min:0'],

            'checkout' => ['sometimes', 'array'],
            'checkout.allow_guest_checkout' => ['required_with:checkout', 'boolean'],
            'checkout.max_quantity_per_item' => ['required_with:checkout', 'integer', 'min:1', 'max:100'],

            'social' => ['sometimes', 'array', 'max:10'],
            'social.*.label' => ['required', 'string', 'max:40'],
            'social.*.href' => ['required', 'url:https', 'max:255'],

            'seo' => ['sometimes', 'array'],
            'seo.default_title' => ['nullable', 'string', 'max:255'],
            'seo.default_description' => ['nullable', 'string', 'max:500'],
            'seo.og_image' => ['nullable', 'string', 'max:255'],

            'announcements' => ['sometimes', 'array', 'max:10'],
            'announcements.*' => ['string', 'max:160'],

            'navigation' => ['sometimes', 'array', 'max:20'],
            'navigation.*.label' => ['required', 'string', 'max:40'],
            'navigation.*.href' => ['required', 'string', 'max:255', 'regex:#^(/[^\s]*|https://[^\s]+)$#'],

            'trust' => ['sometimes', 'array', 'max:6'],
            'trust.*.icon' => ['required', 'in:truck,shield,map,lock,user'],
            'trust.*.title' => ['required', 'string', 'max:60'],
            'trust.*.text' => ['required', 'string', 'max:120'],

            'footer' => ['sometimes', 'array'],
            'footer.copyright' => ['nullable', 'string', 'max:160'],
            'footer.logo' => ['nullable', 'string', 'max:255', 'regex:#^logos/[A-Za-z0-9._-]+$#'],
            'footer.columns' => ['nullable', 'array', 'max:5'],
            'footer.columns.*.heading' => ['required', 'string', 'max:60'],
            'footer.columns.*.links' => ['required', 'array', 'max:10'],
            'footer.columns.*.links.*.label' => ['required', 'string', 'max:60'],
            'footer.columns.*.links.*.href' => ['required', 'string', 'max:255', 'regex:#^(/[^\s]*|https://[^\s]+)$#'],

            'inventory' => ['sometimes', 'array'],
            'inventory.default_low_stock_threshold' => ['required_with:inventory', 'integer', 'min:0'],
        ]);

        $settings->update($validated);
        Log::info('Store settings updated', ['keys' => array_keys($validated), 'admin_id' => $request->user()->id]);

        return response()->json(['data' => $settings->all()]);
    }

    /**
     * Store a logo file. The returned path is saved later via update() as store.logo.
     * SVG is rejected: it can carry scripts and would be served from the API origin.
     */
    public function uploadLogo(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'image' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $path = $validated['image']->store('logos', 'public');

        return response()->json(['path' => $path, 'url' => Storage::disk('public')->url($path)], 201);
    }
}
