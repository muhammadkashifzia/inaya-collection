<?php

namespace App\Http\Controllers\Api\V1\Account;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    public function update(Request $request): UserResource
    {
        $user = $request->user();
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'email' => ['sometimes', 'required', 'email:rfc', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30', 'regex:/^[0-9+\-\s()]{7,30}$/'],
        ]);

        if (isset($validated['email'])) {
            $validated['email'] = strtolower($validated['email']);
        }

        $user->update($validated);

        return new UserResource($user->refresh());
    }

    /**
     * Change the sign-in email. Requires the current password so a hijacked
     * session cannot take over the account.
     */
    public function updateEmail(Request $request): UserResource
    {
        $user = $request->user();
        $validated = $request->validate([
            'email' => ['required', 'email:rfc', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'current_password' => ['required', 'string'],
        ]);

        if (! Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages(['current_password' => 'Your current password is incorrect.']);
        }

        $email = strtolower($validated['email']);
        if ($email === strtolower($user->email)) {
            throw ValidationException::withMessages(['email' => 'This is already your email address.']);
        }

        $previousEmail = $user->email;
        $user->forceFill(['email' => $email, 'email_verified_at' => null])->save();

        if ($user->isStaffMember()) {
            Log::info('Staff email changed', ['user_id' => $user->id, 'from' => $previousEmail, 'to' => $email]);
        }

        return new UserResource($user->refresh());
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers(), 'different:current_password'],
        ]);

        if (! Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages(['current_password' => 'Your current password is incorrect.']);
        }

        $user->forceFill(['password' => $validated['password'], 'remember_token' => Str::random(60)])->save();

        if ($user->isStaffMember()) {
            Log::info('Staff password changed', ['user_id' => $user->id]);
        }

        // Sign out other devices; keep this session.
        Auth::guard('web')->logoutOtherDevices($validated['password']);
        $request->session()->regenerate();

        return response()->json(['message' => 'Password updated.']);
    }
}
