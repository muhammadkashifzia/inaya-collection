<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

/**
 * Cache GET responses for public (unauthenticated) API endpoints.
 *
 * Usage: ->middleware('cache.api:300')   // cache for 5 minutes
 *        ->middleware('cache.api:3600')  // cache for 1 hour
 */
class CachePublicApiResponse
{
    public function handle(Request $request, Closure $next, int $ttl = 300): Response
    {
        // Only cache GET requests from unauthenticated users.
        if (! $request->isMethod('GET') || $request->user()) {
            return $next($request);
        }

        $cacheKey = 'api_cache:'.sha1($request->fullUrl());

        $cached = Cache::get($cacheKey);

        if ($cached !== null) {
            return response()->json($cached['body'], $cached['status'])
                ->header('X-Cache', 'HIT')
                ->header('Cache-Control', 'no-store');
        }

        /** @var Response $response */
        $response = $next($request);

        if ($response instanceof JsonResponse && $response->isSuccessful()) {
            Cache::put($cacheKey, [
                'body' => $response->getData(true),
                'status' => $response->getStatusCode(),
            ], $ttl);

            $response->header('X-Cache', 'MISS');
            $response->header('Cache-Control', 'no-store');
        }

        return $response;
    }
}
