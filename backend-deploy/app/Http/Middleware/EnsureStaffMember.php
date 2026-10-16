<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Blocks customers (and deactivated staff) from every admin endpoint.
 * Fine-grained abilities are enforced per route with `can:` gates.
 */
class EnsureStaffMember
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null || ! $user->is_active || ! $user->isStaffMember()) {
            abort(403, 'You do not have access to the admin area.');
        }

        return $next($request);
    }
}
