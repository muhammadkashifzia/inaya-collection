<?php

namespace App\Services;

use App\Models\StoreSetting;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;

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
                'name' => 'Inaya Collection',
                'tagline' => 'Unstitched Winter Khaddar & Cotton Viscose in Pakistan',
                'about' => 'Inaya Collection brings you affordable, quality unstitched fabrics for every season, delivered across Pakistan.',
                'email' => 'support@example.com',
                'phone' => '+92 300 0000000',
                'whatsapp' => null,
                'address' => null,
                'hours' => 'Mon – Sat, 10am – 7pm',
                'logo' => null,
            ],
            'localization' => [
                'currency' => 'PKR',
                'currency_symbol' => 'Rs.',
                'timezone' => 'Asia/Karachi',
            ],
            'shipping' => [
                'free_shipping_threshold' => 350000,
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
                'default_title' => 'Inaya Collection | Unstitched Winter Khaddar & Cotton Viscose in Pakistan',
                'default_description' => 'Shop unstitched khaddar, karandi and cotton viscose suits with nationwide delivery.',
                'og_image' => null,
            ],
            'announcements' => [
                'Free shipping on all orders above Rs. 3,500',
                'Cash on delivery available nationwide',
            ],
            'navigation' => [
                ['label' => 'Home', 'href' => '/'],
                ['label' => 'Shop All', 'href' => '/collections/all'],
            ],
            'trust' => [
                ['icon' => 'truck', 'title' => 'Free Shipping', 'text' => 'On all orders above 3500'],
                ['icon' => 'shield', 'title' => '30 Days Warranty', 'text' => '30 days returns & warranty'],
                ['icon' => 'map', 'title' => 'Nationwide Delivery', 'text' => 'Support Pakistani brands'],
                ['icon' => 'lock', 'title' => '100% Secure', 'text' => '100% secure checkout'],
            ],
            'footer' => [
                'columns' => [],
                'copyright' => 'Inaya Collection. All rights reserved.',
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
