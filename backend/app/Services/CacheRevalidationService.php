<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Sends on-demand revalidation requests to the Next.js storefront so admin
 * mutations (products, banners, settings, etc.) appear instantly without a
 * hard refresh. Also flushes the Laravel-side API response cache.
 */
class CacheRevalidationService
{
    /**
     * Revalidate the given cache tags on the Next.js frontend and flush
     * corresponding Laravel API cache entries.
     *
     * @param  list<string>  $tags  Cache tags to revalidate (e.g. "home", "products", "settings").
     */
    public function revalidate(array $tags): void
    {
        if ($tags === []) {
            return;
        }

        $this->flushLaravelApiCache();
        $this->sendToNextJs($tags);
    }

    /**
     * Flush all Laravel-side API response cache entries (the CachePublicApiResponse middleware).
     * Uses pattern/tag clearing where possible; falls back to a prefix scan.
     */
    private function flushLaravelApiCache(): void
    {
        try {
            // The CachePublicApiResponse middleware stores with key prefix "api_cache:".
            // Database/file drivers don't support tag-based flushing, so we clear
            // all matching keys. This is acceptable because the cache rebuilds quickly.
            $store = Cache::getStore();

            if (method_exists($store, 'flush')) {
                // For simple stores (file, array), flush everything — the API cache
                // is the primary user of the default cache store.
                Cache::flush();
            }
        } catch (\Throwable $e) {
            Log::warning('Failed to flush Laravel API cache', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Send a POST request to the Next.js revalidation endpoint.
     *
     * @param  list<string>  $tags
     */
    private function sendToNextJs(array $tags): void
    {
        $url = config('services.nextjs.revalidation_url');
        $secret = config('services.nextjs.revalidation_secret');

        if (! $url || ! $secret) {
            return;
        }

        try {
            Http::timeout(5)
                ->retry(2, 100)
                ->post($url, [
                    'secret' => $secret,
                    'tags' => $tags,
                ]);
        } catch (\Throwable $e) {
            // Non-critical — log and move on. The cache will expire naturally.
            Log::warning('Next.js revalidation failed', [
                'url' => $url,
                'tags' => $tags,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
