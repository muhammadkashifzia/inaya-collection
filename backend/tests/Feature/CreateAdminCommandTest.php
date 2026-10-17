<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CreateAdminCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_creates_an_active_admin(): void
    {
        $this->artisan('app:create-admin', ['email' => 'Owner@Example.com', '--password' => 'secret123', '--no-interaction' => true])
            ->assertSuccessful();

        $admin = User::query()->where('email', 'owner@example.com')->firstOrFail();
        $this->assertSame(UserRole::Admin, $admin->role);
        $this->assertTrue($admin->is_active);
        $this->assertTrue(Hash::check('secret123', $admin->password));
    }

    public function test_it_refuses_to_overwrite_an_existing_user_without_reset(): void
    {
        $user = User::factory()->create(['email' => 'owner@example.com']);

        $this->artisan('app:create-admin', ['email' => 'owner@example.com', '--password' => 'secret123', '--no-interaction' => true])
            ->assertFailed();

        $this->assertSame(UserRole::Customer, $user->fresh()->role);
    }

    public function test_reset_restores_admin_access_with_a_new_password(): void
    {
        $user = User::factory()->create(['email' => 'owner@example.com']);
        $user->forceFill(['is_active' => false])->save();

        $this->artisan('app:create-admin', ['email' => 'owner@example.com', '--password' => 'newpass123', '--reset' => true, '--no-interaction' => true])
            ->assertSuccessful();

        $user->refresh();
        $this->assertSame(UserRole::Admin, $user->role);
        $this->assertTrue($user->is_active);
        $this->assertTrue(Hash::check('newpass123', $user->password));
    }

    public function test_it_rejects_a_weak_password(): void
    {
        $this->artisan('app:create-admin', ['email' => 'owner@example.com', '--password' => 'short', '--no-interaction' => true])
            ->assertFailed();

        $this->assertDatabaseMissing('users', ['email' => 'owner@example.com']);
    }
}
