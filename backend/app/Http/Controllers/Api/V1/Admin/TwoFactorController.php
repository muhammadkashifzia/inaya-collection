<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Support\Totp;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * Enable / confirm / disable TOTP two-factor auth for the signed-in staff member.
 */
class TwoFactorController extends Controller
{
    /**
     * Generate a new secret and return the provisioning URI.
     * The secret is stored but NOT yet confirmed (the user must verify first).
     */
    public function enable(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
        ]);

        $user = $request->user();

        if (! Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages(['current_password' => 'The password is incorrect.']);
        }

        $secret = Totp::generateSecret();

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
     * Confirm the secret by verifying a code from the authenticator app.
     */
    public function confirm(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'size:6'],
        ]);

        $user = $request->user();

        if (! $user->two_factor_secret || $user->two_factor_confirmed_at) {
            throw ValidationException::withMessages(['code' => 'Two-factor setup is not pending.']);
        }

        if (! Totp::verify($user->two_factor_secret, $data['code'])) {
            throw ValidationException::withMessages(['code' => 'Invalid code. Please try again.']);
        }

        $user->forceFill(['two_factor_confirmed_at' => now()])->save();

        return response()->json(['message' => 'Two-factor authentication is now active.']);
    }

    /**
     * Disable 2FA entirely (requires current password).
     */
    public function disable(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
        ]);

        $user = $request->user();

        if (! Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages(['current_password' => 'The password is incorrect.']);
        }

        $user->forceFill([
            'two_factor_secret' => null,
            'two_factor_confirmed_at' => null,
        ])->save();

        return response()->json(['message' => 'Two-factor authentication has been disabled.']);
    }
}
