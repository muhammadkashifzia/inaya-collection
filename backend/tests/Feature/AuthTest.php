<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Cart;
use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_register_and_is_signed_in_as_customer(): void
    {
        $response = $this->withHeaders($this->spaHeaders())->postJson('/api/v1/auth/register', [
            'name' => 'Sana T',
            'email' => 'Sana@Example.com',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
            'role' => 'admin',
        ]);

        $response->assertCreated()->assertJsonPath('data.email', 'sana@example.com')->assertJsonPath('data.role', 'customer');
        $this->assertAuthenticated('web');
        $this->assertSame(UserRole::Customer, User::query()->where('email', 'sana@example.com')->first()->role);
    }

    public function test_register_rejects_weak_password_and_duplicate_email(): void
    {
        User::factory()->create(['email' => 'taken@example.com']);

        $this->withHeaders($this->spaHeaders())->postJson('/api/v1/auth/register', [
            'name' => 'X', 'email' => 'taken@example.com', 'password' => 'short', 'password_confirmation' => 'short',
        ])->assertUnprocessable()->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_login_with_valid_credentials_merges_guest_cart(): void
    {
        $user = User::factory()->create(['email' => 'buyer@example.com']);
        $variant = $this->variantWithStock(5);
        $guestCart = Cart::query()->create(['token' => (string) Str::uuid()]);
        $guestCart->items()->create(['product_variant_id' => $variant->id, 'quantity' => 2]);

        $this->withHeaders($this->spaHeaders())->postJson('/api/v1/auth/login', [
            'email' => 'buyer@example.com', 'password' => 'password1', 'cart_token' => $guestCart->token,
        ])->assertOk()->assertJsonPath('data.id', $user->id);

        $this->assertSame($user->id, $guestCart->refresh()->user_id);
        $this->assertSame(2, $user->cart->items()->first()->quantity);
    }

    public function test_login_fails_with_wrong_password_and_for_inactive_accounts(): void
    {
        User::factory()->create(['email' => 'a@example.com']);
        User::factory()->inactive()->create(['email' => 'b@example.com']);

        $this->withHeaders($this->spaHeaders())->postJson('/api/v1/auth/login', ['email' => 'a@example.com', 'password' => 'wrong-pass1'])
            ->assertUnprocessable()->assertJsonValidationErrors(['email' => 'These credentials do not match our records.']);
        $this->withHeaders($this->spaHeaders())->postJson('/api/v1/auth/login', ['email' => 'b@example.com', 'password' => 'password1'])
            ->assertUnprocessable();
        $this->assertGuest('web');
    }

    public function test_login_is_rate_limited(): void
    {
        User::factory()->create(['email' => 'a@example.com']);

        for ($i = 0; $i < 5; $i++) {
            $this->withHeaders($this->spaHeaders())->postJson('/api/v1/auth/login', ['email' => 'a@example.com', 'password' => 'nope']);
        }

        $this->withHeaders($this->spaHeaders())->postJson('/api/v1/auth/login', ['email' => 'a@example.com', 'password' => 'nope'])
            ->assertTooManyRequests();
    }

    public function test_me_requires_authentication_and_never_exposes_password(): void
    {
        $this->getJson('/api/v1/me')->assertUnauthorized();

        $user = User::factory()->create();
        $this->actingAs($user, 'sanctum')->getJson('/api/v1/me')
            ->assertOk()
            ->assertJsonMissingPath('data.password')
            ->assertJsonMissingPath('data.remember_token');
    }

    public function test_forgot_password_sends_link_without_revealing_accounts(): void
    {
        Notification::fake();
        $user = User::factory()->create(['email' => 'reset@example.com']);

        $this->postJson('/api/v1/auth/forgot-password', ['email' => 'reset@example.com'])->assertOk();
        $this->postJson('/api/v1/auth/forgot-password', ['email' => 'nobody@example.com'])->assertOk();

        Notification::assertSentTo($user, ResetPassword::class);
    }

    public function test_password_can_be_reset_with_valid_token(): void
    {
        $user = User::factory()->create(['email' => 'reset@example.com']);
        $token = Password::createToken($user);

        $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token, 'email' => 'reset@example.com', 'password' => 'newpass123', 'password_confirmation' => 'newpass123',
        ])->assertOk();

        $this->withHeaders($this->spaHeaders())->postJson('/api/v1/auth/login', ['email' => 'reset@example.com', 'password' => 'newpass123'])->assertOk();
    }
}
