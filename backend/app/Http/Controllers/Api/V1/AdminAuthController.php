<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

/**
 * Admin/staff-only authentication (Sanctum SPA session).
 *
 * - Login rejects customer accounts.
 * - No public registration — admin accounts are created via seeder or CLI.
 * - Clients must first call GET /sanctum/csrf-cookie.
 */
class AdminAuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $data = $request->validated();

        $authenticated = Auth::guard('web')->attempt(
            ['email' => $data['email'], 'password' => $data['password'], 'is_active' => true],
            (bool) ($data['remember'] ?? false),
        );

        if (! $authenticated) {
            throw ValidationException::withMessages(['email' => 'These credentials do not match our records.']);
        }

        /** @var User $user */
        $user = Auth::guard('web')->user();

        // Reject customer accounts from the admin login flow.
        if (! $user->isStaffMember()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            throw ValidationException::withMessages(['email' => 'These credentials do not match our records.']);
        }

        $request->session()->regenerate();
        $user->forceFill(['last_login_at' => now()])->save();

        Log::info('Staff login', ['user_id' => $user->id, 'ip' => $request->ip()]);

        return response()->json(['data' => new UserResource($user)]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Logged out.']);
    }

    public function me(Request $request): UserResource
    {
        return new UserResource($request->user());
    }
}
