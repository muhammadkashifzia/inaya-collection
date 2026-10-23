<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
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
     * Targets only keys with the "api_cache:" prefix to avoid nuking sessions, queues, etc.
     */
    private function flushLaravelApiCache(): void
    {
        try {
            $connection = config('database.default');
            $table = config('cache.stores.database.table', 'cache');

            // Targeted delete: only remove API response cache entries.
            DB::connection($connection)
                ->table($table)
                ->where('key', 'like', '%api_cache:%')
                ->delete();

            Log::debug('Flushed Laravel API cache entries.');
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
            Log::warning('Next.js revalidation skipped — URL or secret not configured.', [
                'url_set' => (bool) $url,
                'secret_set' => (bool) $secret,
            ]);

            return;
        }

        try {
            $response = Http::timeout(5)
                ->retry(2, 100)
                ->post($url, [
                    'secret' => $secret,
                    'tags' => $tags,
                ]);

            if ($response->successful()) {
                Log::info('Next.js cache revalidated', [
                    'tags' => $tags,
                    'response' => $response->json(),
                ]);
            } else {
                Log::warning('Next.js revalidation returned non-success status', [
                    'url' => $url,
                    'tags' => $tags,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
            }
        } catch (\Throwable $e) {
            Log::warning('Next.js revalidation failed', [
                'url' => $url,
                'tags' => $tags,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
