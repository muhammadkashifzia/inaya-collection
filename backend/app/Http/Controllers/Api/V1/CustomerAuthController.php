<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

/**
 * Customer-only authentication (Sanctum SPA session).
 *
 * - Register always creates a customer account.
 * - Login rejects non-customer accounts.
 * - Clients must first call GET /sanctum/csrf-cookie.
 */
class CustomerAuthController extends Controller
{
    public function __construct(private CartService $carts) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        $data = $request->validated();

        $user = User::query()->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'password' => $data['password'],
        ]);
        // Role is set via forceFill — never via mass-assignment.
        $user->forceFill(['role' => UserRole::Customer, 'is_active' => true])->save();

        Auth::guard('web')->login($user);
        $request->session()->regenerate();

        $this->carts->resolve($user, $data['cart_token'] ?? null, create: false);

        return response()->json(['data' => new UserResource($user->refresh())], 201);
    }

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

        // Reject non-customer accounts from the customer login flow.
        if ($user->role !== UserRole::Customer) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            throw ValidationException::withMessages(['email' => 'These credentials do not match our records.']);
        }

        $request->session()->regenerate();
        $user->forceFill(['last_login_at' => now()])->save();

        $this->carts->resolve($user, $data['cart_token'] ?? null, create: false);

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
