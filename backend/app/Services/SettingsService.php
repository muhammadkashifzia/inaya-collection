<?php

namespace App\Services;

use App\Models\StoreSetting;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

/**
 * Key/value store configuration with typed defaults. Only non-secret values
 * belong here; payment credentials stay in environment variables.
 */
class SettingsService
{
    private const CACHE_KEY = 'store_settings.all';

    /**
     * Default values for every supported key. Admin updates are restricted to these keys.
     *
     * @return array<string, mixed>
     */
    public static function defaults(): array
    {
        return [
            'store' => [
                'name' => 'Anaya Collection',
                'tagline' => 'Unstitched Winter Khaddar & Cotton Viscose in Pakistan',
                'about' => 'Anaya Collection brings you affordable, quality unstitched fabrics for every season, delivered across Pakistan.',
                'email' => 'support@example.com',
                'phone' => '+92 300 0000000',
                'whatsapp' => null,
                'address' => null,
                'hours' => 'Mon – Sat, 10am – 7pm',
                'logo' => null,
                'logo_type' => 'image',
            ],
            'localization' => [
                'currency' => 'PKR',
                'currency_symbol' => 'Rs.',
                'timezone' => 'Asia/Karachi',
            ],
            'shipping' => [
                'free_shipping_threshold' => 1200000,
                'methods' => [
                    ['code' => 'standard', 'name' => 'Standard Delivery (3–5 working days)', 'fee' => 25000, 'is_active' => true],
                    ['code' => 'express', 'name' => 'Express Delivery (1–2 working days)', 'fee' => 50000, 'is_active' => true],
                ],
            ],
            'tax' => [
                'rate_percent' => 0,
                'prices_include_tax' => true,
            ],
            'payments' => [
                'cod_enabled' => true,
                'cod_max_order_amount' => null,
            ],
            'checkout' => [
                'allow_guest_checkout' => true,
                'max_quantity_per_item' => 10,
            ],
            'social' => [
                ['label' => 'Facebook', 'href' => 'https://facebook.com'],
                ['label' => 'Instagram', 'href' => 'https://instagram.com'],
                ['label' => 'TikTok', 'href' => 'https://tiktok.com'],
            ],
            'seo' => [
                'default_title' => 'Anaya Collection | Unstitched Winter Khaddar & Cotton Viscose in Pakistan',
                'default_description' => 'Shop unstitched khaddar, karandi and cotton viscose suits with nationwide delivery.',
                'og_image' => null,
            ],
            'announcements' => [
                'Free shipping on all orders above Rs. 12,000',
                'Cash on delivery available nationwide',
            ],
            'navigation' => [
                ['label' => 'Home', 'href' => '/'],
                ['label' => 'Shop All', 'href' => '/collections/all'],
            ],
            'trust' => [
                ['icon' => 'truck', 'title' => 'Free Shipping', 'text' => 'Free shipping on all orders above PKR 12,000'],
                ['icon' => 'shield', 'title' => '2 Days Exchange Policy', 'text' => 'Easy exchange within 2 days'],
                ['icon' => 'lock', 'title' => 'Cash on Delivery', 'text' => 'Order from anywhere and pay at your doorstep'],
                ['icon' => 'user', 'title' => 'Customer Centric Support', 'text' => 'Customer care with satisfaction on priority'],
            ],
            'footer' => [
                'columns' => [],
                'copyright' => 'Anaya Collection. All rights reserved.',
            ],
            'inventory' => [
                'default_low_stock_threshold' => 5,
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function all(): array
    {
        $stored = Cache::rememberForever(self::CACHE_KEY, fn (): array => StoreSetting::query()->pluck('value', 'key')->all());

        $merged = [];
        foreach (self::defaults() as $key => $default) {
            $merged[$key] = array_key_exists($key, $stored) && $stored[$key] !== null ? $stored[$key] : $default;
        }

        // Older stored "store" rows predate these keys; fill them so clients always get the full shape.
        $merged['store'] = [...self::defaults()['store'], ...$merged['store']];
        $logoPath = $merged['store']['logo'];
        $merged['store']['logo_url'] = is_string($logoPath) && $logoPath !== '' ? Storage::disk('public')->url($logoPath) : null;

        return $merged;
    }

    public function get(string $dottedKey, mixed $fallback = null): mixed
    {
        return Arr::get($this->all(), $dottedKey, $fallback);
    }

    /**
     * Persist top-level keys. Unknown keys are ignored.
     *
     * @param  array<string, mixed>  $values
     */
    public function update(array $values): void
    {
        // logo_url is derived from the stored path on read; never persist it.
        Arr::forget($values, 'store.logo_url');

        foreach (Arr::only($values, array_keys(self::defaults())) as $key => $value) {
            StoreSetting::query()->updateOrCreate(['key' => $key], ['value' => $value]);
        }

        Cache::forget(self::CACHE_KEY);
    }

    /**
     * Settings safe to expose to the public storefront.
     *
     * @return array<string, mixed>
     */
    public function publicSettings(): array
    {
        $all = $this->all();

        return [
            ...Arr::only($all, ['store', 'localization', 'social', 'seo', 'announcements', 'navigation', 'trust', 'footer', 'tax']),
            'shipping' => [
                'free_shipping_threshold' => $all['shipping']['free_shipping_threshold'] ?? null,
                'methods' => array_values(array_filter($all['shipping']['methods'] ?? [], fn (array $m): bool => (bool) ($m['is_active'] ?? false))),
            ],
            'payments' => [
                'methods' => ($all['payments']['cod_enabled'] ?? false) ? [['code' => 'cod', 'name' => 'Cash on Delivery']] : [],
            ],
            'checkout' => $all['checkout'],
        ];
    }
}
