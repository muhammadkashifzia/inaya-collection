<?php

namespace App\Http\Middleware;

use App\Services\CacheRevalidationService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * After a successful admin mutation (POST/PUT/PATCH/DELETE), automatically
 * revalidate the relevant Next.js cache tags so changes appear on the
 * storefront instantly. Runs *after* the response is prepared so the admin
 * user isn't waiting on the revalidation HTTP call.
 *
 * Tag mapping is based on the route name prefix:
 *   admin.products.*  → ["products", "home"]
 *   admin.banners.*   → ["home"]
 *   admin.sections.*  → ["home"]
 *   admin.categories.* → ["categories", "home"]
 *   admin.settings.*  → ["settings"]
 *   admin.pages.*     → ["pages"]
 *   …etc.
 */
class RevalidateStorefrontCache
{
    /** @var array<string, list<string>> Route-name prefix → cache tags */
    private const TAG_MAP = [
        'admin.products' => ['products', 'home'],
        'admin.banners' => ['home'],
        'admin.sections' => ['home'],
        'admin.categories' => ['categories', 'home'],
        'admin.design-categories' => ['categories'],
        'admin.settings' => ['settings'],
        'admin.pages' => ['pages'],
        'admin.tags' => ['products'],
        'admin.attributes' => ['products'],
        'admin.reviews' => ['products'],
        'admin.inventory' => ['products'],
        'admin.coupons' => ['products'],
    ];

    public function __construct(private CacheRevalidationService $revalidation) {}

    public function handle(Request $request, Closure $next): Response
    {
        /** @var Response $response */
        $response = $next($request);

        // Only revalidate on successful mutations.
        if (! $this->isMutation($request) || ! $this->isSuccessful($response)) {
            return $response;
        }

        $tags = $this->resolveTags($request);

        if ($tags !== []) {
            $this->revalidation->revalidate($tags);
        }

        return $response;
    }

    private function isMutation(Request $request): bool
    {
        return in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'], true);
    }

    private function isSuccessful(Response $response): bool
    {
        return $response->getStatusCode() >= 200 && $response->getStatusCode() < 300;
    }

    /**
     * @return list<string>
     */
    private function resolveTags(Request $request): array
    {
        $routeName = $request->route()?->getName() ?? '';

        foreach (self::TAG_MAP as $prefix => $tags) {
            if (str_starts_with($routeName, $prefix)) {
                return $tags;
            }
        }

        return [];
    }
}
