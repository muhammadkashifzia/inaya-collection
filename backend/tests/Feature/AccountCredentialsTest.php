<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AccountCredentialsTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_changes_email_with_current_password(): void
    {
        $admin = User::factory()->admin()->create(['email' => 'old@example.com']);

        $this->actingAs($admin, 'sanctum')->putJson('/api/v1/me/email', ['email' => 'New@Example.com', 'current_password' => 'password1'])
            ->assertOk()
            ->assertJsonPath('email', 'new@example.com');

        $this->assertSame('new@example.com', $admin->refresh()->email);
        $this->assertNull($admin->email_verified_at);
    }

    public function test_email_change_requires_correct_password_and_unique_new_email(): void
    {
        User::factory()->create(['email' => 'taken@example.com']);
        $admin = User::factory()->admin()->create(['email' => 'old@example.com']);

        $this->actingAs($admin, 'sanctum')->putJson('/api/v1/me/email', ['email' => 'new@example.com', 'current_password' => 'wrong-pass1'])
            ->assertUnprocessable()->assertJsonValidationErrors(['current_password']);
        $this->actingAs($admin, 'sanctum')->putJson('/api/v1/me/email', ['email' => 'taken@example.com', 'current_password' => 'password1'])
            ->assertUnprocessable()->assertJsonValidationErrors(['email']);
        $this->actingAs($admin, 'sanctum')->putJson('/api/v1/me/email', ['email' => 'OLD@example.com', 'current_password' => 'password1'])
            ->assertUnprocessable()->assertJsonValidationErrors(['email']);

        $this->assertSame('old@example.com', $admin->refresh()->email);
    }

    public function test_admin_can_sign_in_with_new_email_after_change(): void
    {
        $admin = User::factory()->admin()->create(['email' => 'old@example.com']);
        $this->actingAs($admin, 'sanctum')->putJson('/api/v1/me/email', ['email' => 'new@example.com', 'current_password' => 'password1'])->assertOk();
        $this->app['auth']->forgetGuards();

        $this->withHeaders($this->spaHeaders())->postJson('/api/v1/auth/login', ['email' => 'new@example.com', 'password' => 'password1'])->assertOk();
    }

    public function test_admin_changes_password(): void
    {
        $admin = User::factory()->admin()->create();
        $oldRememberToken = $admin->remember_token;

        $this->actingAs($admin, 'sanctum')->putJson('/api/v1/me/password', [
            'current_password' => 'password1', 'password' => 'newpass123', 'password_confirmation' => 'newpass123',
        ])->assertOk()->assertJsonPath('message', 'Password updated.');

        $admin->refresh();
        $this->assertTrue(Hash::check('newpass123', $admin->password));
        $this->assertNotSame($oldRememberToken, $admin->remember_token);
    }

    public function test_password_change_validates_current_password_strength_and_confirmation(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin, 'sanctum')->putJson('/api/v1/me/password', [
            'current_password' => 'wrong-pass1', 'password' => 'newpass123', 'password_confirmation' => 'newpass123',
        ])->assertUnprocessable()->assertJsonValidationErrors(['current_password']);

        $this->actingAs($admin, 'sanctum')->putJson('/api/v1/me/password', [
            'current_password' => 'password1', 'password' => 'short', 'password_confirmation' => 'different',
        ])->assertUnprocessable()->assertJsonValidationErrors(['password']);

        $this->assertTrue(Hash::check('password1', $admin->refresh()->password));
    }

    public function test_credentials_endpoints_require_authentication(): void
    {
        $this->putJson('/api/v1/me/email', ['email' => 'x@example.com', 'current_password' => 'password1'])->assertUnauthorized();
        $this->putJson('/api/v1/me/password', ['current_password' => 'password1', 'password' => 'newpass123', 'password_confirmation' => 'newpass123'])->assertUnauthorized();
    }
}
