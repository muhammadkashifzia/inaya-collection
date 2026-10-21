<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\CartService;
use App\Support\Totp;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Session-based (Sanctum SPA) authentication for the storefront and admin.
 * Clients must first call GET /sanctum/csrf-cookie.
 */
class AuthController extends Controller
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

        // Staff members must always go through 2FA.
        if ($user->isStaffMember()) {
            $request->session()->put('two_factor:user_id', $user->id);
            $request->session()->put('two_factor:remember', (bool) ($data['remember'] ?? false));

            Auth::guard('web')->logout();
            $request->session()->regenerate();

            // Not yet configured → force setup; already configured → ask for code.
            return response()->json([
                'two_factor' => true,
                'two_factor_setup' => ! $user->hasTwoFactorEnabled(),
            ]);
        }

        $request->session()->regenerate();
        $user->forceFill(['last_login_at' => now()])->save();
        $this->carts->resolve($user, $data['cart_token'] ?? null, create: false);

        return response()->json(['data' => new UserResource($user)]);
    }

    /**
     * Generate a TOTP secret during the login flow (2FA not yet configured).
     * The user must be in a pending two-factor session.
     */
    public function twoFactorSetup(Request $request): JsonResponse
    {
        $userId = $request->session()->get('two_factor:user_id');

        if (! $userId) {
            throw ValidationException::withMessages(['code' => 'No two-factor setup in progress. Please sign in again.']);
        }

        /** @var User|null $user */
        $user = User::query()->where('is_active', true)->find($userId);

        if (! $user || $user->hasTwoFactorEnabled()) {
            throw ValidationException::withMessages(['code' => 'Two-factor setup is not available.']);
        }

        $secret = Totp::generateSecret();

        // Store the pending secret (unconfirmed).
        $user->forceFill([
            'two_factor_secret' => $secret,
            'two_factor_confirmed_at' => null,
        ])->save();

        return response()->json([
            'secret' => $secret,
            'uri' => Totp::uri($secret, $user->email),
        ]);
    }

    /**
     * Confirm setup + complete login (first-time 2FA enrollment).
     */
    public function twoFactorSetupConfirm(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'size:6'],
        ]);

        $userId = $request->session()->get('two_factor:user_id');
        $remember = (bool) $request->session()->get('two_factor:remember', false);

        if (! $userId) {
            throw ValidationException::withMessages(['code' => 'No two-factor setup in progress. Please sign in again.']);
        }

        /** @var User|null $user */
        $user = User::query()->where('is_active', true)->find($userId);

        if (! $user || ! $user->two_factor_secret || $user->two_factor_confirmed_at) {
            throw ValidationException::withMessages(['code' => 'Two-factor setup is not pending.']);
        }

        if (! Totp::verify($user->two_factor_secret, $data['code'])) {
            throw ValidationException::withMessages(['code' => 'Invalid code. Please try again.']);
        }

        // Activate 2FA and complete login.
        $user->forceFill(['two_factor_confirmed_at' => now(), 'last_login_at' => now()])->save();

        $request->session()->forget(['two_factor:user_id', 'two_factor:remember']);
        Auth::guard('web')->login($user, $remember);
        $request->session()->regenerate();

        Log::info('Staff login (2FA setup)', ['user_id' => $user->id, 'ip' => $request->ip()]);

        return response()->json(['data' => new UserResource($user)]);
    }

    /**
     * Verify a 2FA code after credentials have been accepted (already enrolled).
     */
    public function twoFactorChallenge(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'size:6'],
        ]);

        $userId = $request->session()->pull('two_factor:user_id');
        $remember = (bool) $request->session()->pull('two_factor:remember', false);

        if (! $userId) {
            throw ValidationException::withMessages(['code' => 'No two-factor challenge in progress. Please sign in again.']);
        }

        /** @var User|null $user */
        $user = User::query()->where('is_active', true)->find($userId);

        if (! $user || ! $user->hasTwoFactorEnabled()) {
            throw ValidationException::withMessages(['code' => 'Two-factor authentication is not configured for this account.']);
        }

        if (! Totp::verify($user->two_factor_secret, $data['code'])) {
            // Put the challenge back so the user can retry.
            $request->session()->put('two_factor:user_id', $userId);
            $request->session()->put('two_factor:remember', $remember);

            throw ValidationException::withMessages(['code' => 'Invalid code. Please try again.']);
        }

        Auth::guard('web')->login($user, $remember);
        $request->session()->regenerate();

        $user->forceFill(['last_login_at' => now()])->save();

        Log::info('Staff login (2FA)', ['user_id' => $user->id, 'ip' => $request->ip()]);

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

    /**
     * Always responds the same way so account existence is not revealed.
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $validated = $request->validate(['email' => ['required', 'email', 'max:255']]);

        Password::sendResetLink(['email' => strtolower($validated['email'])]);

        return response()->json(['message' => 'If an account exists for that email, a reset link has been sent.']);
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $status = Password::reset(
            [...$request->validated(), 'email' => strtolower($request->validated('email'))],
            function (User $user, string $password): void {
                $user->forceFill(['password' => $password, 'remember_token' => Str::random(60)])->save();
                event(new PasswordReset($user));
            },
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages(['email' => __($status)]);
        }

        return response()->json(['message' => 'Your password has been reset. You can now sign in.']);
    }
}
