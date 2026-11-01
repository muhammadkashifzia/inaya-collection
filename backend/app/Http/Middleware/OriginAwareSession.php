<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Assign a distinct session cookie name per frontend origin.
 *
 * The storefront and admin panel both call the same API, so they share the
 * session cookie.  Without this middleware, logging in on one app invalidates
 * the other's session.  By switching the cookie name based on the `Origin`
 * header (sent automatically by the browser for Sanctum SPA requests), each
 * frontend gets its own independent server-side session.
 *
 * Must run BEFORE Sanctum's `EnsureFrontendRequestsAreStateful` middleware
 * (which starts the session), so it is prepended to the `api` middleware group.
 */
class OriginAwareSession
{
    public function handle(Request $request, Closure $next): Response
    {
        $origin = $request->header('Origin') ?? $request->header('Referer') ?? '';
        $adminUrl = rtrim((string) config('app.admin_url', ''), '/');

        if ($adminUrl !== '' && str_starts_with($origin, $adminUrl)) {
            config(['session.cookie' => config('session.cookie').'-admin']);
        }

        return $next($request);
    }
}
