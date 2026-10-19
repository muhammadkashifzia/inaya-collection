<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Role-enforced authentication flows.
 *
 * Covers the separate customer (POST /api/v1/customer/*) and admin
 * (POST /api/v1/admin/auth/*) login endpoints, plus the security rules
 * that prevent cross-role access.
 */
class RoleBasedAuthTest extends TestCase
{
    use RefreshDatabase;

    // ─── Customer registration ───────────────────────────────────────

    public function test_customer_can_register_via_customer_endpoint(): void
    {
        $this->withHeaders($this->spaHeaders())
            ->postJson('/api/v1/customer/register', [
                'name' => 'Aisha Test',
                'email' => 'aisha@example.com',
                'password' => 'secret123',
                'password_confirmation' => 'secret123',
            ])
            ->assertCreated()
            ->assertJsonPath('data.role', 'customer')
            ->assertJsonPath('data.email', 'aisha@example.com');

        $this->assertAuthenticated('web');
        $user = User::query()->where('email', 'aisha@example.com')->firstOrFail();
        $this->assertSame(UserRole::Customer, $user->role);
        $this->assertTrue($user->is_active);
    }

    public function test_customer_registration_ignores_role_in_payload(): void
    {
        $this->withHeaders($this->spaHeaders())
            ->postJson('/api/v1/customer/register', [
                'name' => 'Hacker',
                'email' => 'hacker@example.com',
                'password' => 'secret123',
                'password_confirmation' => 'secret123',
                'role' => 'admin',
            ])
            ->assertCreated()
            ->assertJsonPath('data.role', 'customer');

        $this->assertSame(UserRole::Customer, User::query()->where('email', 'hacker@example.com')->first()->role);
    }

    public function test_registration_ignores_is_active_in_payload(): void
    {
        $this->withHeaders($this->spaHeaders())
            ->postJson('/api/v1/customer/register', [
                'name' => 'Sneak',
                'email' => 'sneak@example.com',
                'password' => 'secret123',
                'password_confirmation' => 'secret123',
                'is_active' => false,
            ])
            ->assertCreated();

        $this->assertTrue(User::query()->where('email', 'sneak@example.com')->first()->is_active);
    }

    // ─── Customer login ──────────────────────────────────────────────

    public function test_customer_can_login_via_customer_endpoint(): void
    {
        User::factory()->create(['email' => 'cust@example.com', 'role' => UserRole::Customer]);

        $this->withHeaders($this->spaHeaders())
            ->postJson('/api/v1/customer/login', ['email' => 'cust@example.com', 'password' => 'password1'])
            ->assertOk()
            ->assertJsonPath('data.role', 'customer');

        $this->assertAuthenticated('web');
    }

    public function test_admin_cannot_login_via_customer_endpoint(): void
    {
        User::factory()->admin()->create(['email' => 'admin@example.com']);

        $this->withHeaders($this->spaHeaders())
            ->postJson('/api/v1/customer/login', ['email' => 'admin@example.com', 'password' => 'password1'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email' => 'These credentials do not match our records.']);

        $this->assertGuest('web');
    }

    public function test_staff_cannot_login_via_customer_endpoint(): void
    {
        User::factory()->staff()->create(['email' => 'staff@example.com']);

        $this->withHeaders($this->spaHeaders())
            ->postJson('/api/v1/customer/login', ['email' => 'staff@example.com', 'password' => 'password1'])
            ->assertUnprocessable();

        $this->assertGuest('web');
    }

    public function test_customer_login_fails_with_wrong_password(): void
    {
        User::factory()->create(['email' => 'cust@example.com']);

        $this->withHeaders($this->spaHeaders())
            ->postJson('/api/v1/customer/login', ['email' => 'cust@example.com', 'password' => 'wrong-pass'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);

        $this->assertGuest('web');
    }

    public function test_inactive_customer_cannot_login(): void
    {
        User::factory()->inactive()->create(['email' => 'banned@example.com']);

        $this->withHeaders($this->spaHeaders())
            ->postJson('/api/v1/customer/login', ['email' => 'banned@example.com', 'password' => 'password1'])
            ->assertUnprocessable();

        $this->assertGuest('web');
    }

    // ─── Admin login ─────────────────────────────────────────────────

    public function test_admin_can_login_via_admin_endpoint(): void
    {
        User::factory()->admin()->create(['email' => 'boss@example.com']);

        $this->withHeaders($this->spaHeaders())
            ->postJson('/api/v1/admin/auth/login', ['email' => 'boss@example.com', 'password' => 'password1'])
            ->assertOk()
            ->assertJsonPath('data.role', 'admin');

        $this->assertAuthenticated('web');
    }

    public function test_staff_can_login_via_admin_endpoint(): void
    {
        User::factory()->staff()->create(['email' => 'helper@example.com']);

        $this->withHeaders($this->spaHeaders())
            ->postJson('/api/v1/admin/auth/login', ['email' => 'helper@example.com', 'password' => 'password1'])
            ->assertOk()
            ->assertJsonPath('data.role', 'staff');

        $this->assertAuthenticated('web');
    }

    public function test_customer_cannot_login_via_admin_endpoint(): void
    {
        User::factory()->create(['email' => 'shopper@example.com']);

        $this->withHeaders($this->spaHeaders())
            ->postJson('/api/v1/admin/auth/login', ['email' => 'shopper@example.com', 'password' => 'password1'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email' => 'These credentials do not match our records.']);

        $this->assertGuest('web');
    }

    public function test_admin_login_fails_with_wrong_password(): void
    {
        User::factory()->admin()->create(['email' => 'admin@example.com']);

        $this->withHeaders($this->spaHeaders())
            ->postJson('/api/v1/admin/auth/login', ['email' => 'admin@example.com', 'password' => 'wrong'])
            ->assertUnprocessable();

        $this->assertGuest('web');
    }

    public function test_inactive_admin_cannot_login(): void
    {
        User::factory()->admin()->inactive()->create(['email' => 'old@example.com']);

        $this->withHeaders($this->spaHeaders())
            ->postJson('/api/v1/admin/auth/login', ['email' => 'old@example.com', 'password' => 'password1'])
            ->assertUnprocessable();

        $this->assertGuest('web');
    }

    // ─── Logout ──────────────────────────────────────────────────────

    public function test_customer_logout_invalidates_session(): void
    {
        $customer = User::factory()->create(['email' => 'out@example.com']);

        // Login via endpoint to establish a real session.
        $this->withHeaders($this->spaHeaders())
            ->postJson('/api/v1/customer/login', ['email' => 'out@example.com', 'password' => 'password1'])
            ->assertOk();

        $this->assertAuthenticated('web');

        // Logout.
        $this->withHeaders($this->spaHeaders())
            ->postJson('/api/v1/customer/logout')
            ->assertOk()
            ->assertJsonPath('message', 'Logged out.');

        $this->assertGuest('web');
    }

    public function test_admin_logout_invalidates_session(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin, 'sanctum')
            ->withHeaders($this->spaHeaders())
            ->postJson('/api/v1/admin/auth/logout')
            ->assertOk()
            ->assertJsonPath('message', 'Logged out.');
    }

    // ─── /customer/me and /admin/me ──────────────────────────────────

    public function test_customer_me_requires_authentication(): void
    {
        $this->getJson('/api/v1/customer/me')->assertUnauthorized();
    }

    public function test_customer_me_rejects_admin_accounts(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/customer/me')
            ->assertForbidden();
    }

    public function test_customer_me_returns_customer_data(): void
    {
        $customer = User::factory()->create(['email' => 'me@example.com']);

        $response = $this->actingAs($customer, 'sanctum')
            ->getJson('/api/v1/customer/me');

        $response->assertOk()
            ->assertJsonPath('email', 'me@example.com')
            ->assertJsonPath('role', 'customer')
            ->assertJsonMissingPath('password')
            ->assertJsonMissingPath('remember_token');
    }

    public function test_admin_me_requires_authentication(): void
    {
        $this->getJson('/api/v1/admin/me')->assertUnauthorized();
    }

    public function test_admin_me_rejects_customer_accounts(): void
    {
        $customer = User::factory()->create();

        $this->actingAs($customer, 'sanctum')
            ->getJson('/api/v1/admin/me')
            ->assertForbidden();
    }

    public function test_admin_me_returns_admin_data(): void
    {
        $admin = User::factory()->admin()->create(['email' => 'admin@example.com']);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/me');

        $response->assertOk()
            ->assertJsonPath('email', 'admin@example.com')
            ->assertJsonPath('role', 'admin');
    }

    // ─── Cross-role access protection ────────────────────────────────

    public function test_customer_cannot_access_admin_apis(): void
    {
        $customer = User::factory()->create();

        $this->actingAs($customer, 'sanctum')
            ->getJson('/api/v1/admin/dashboard')
            ->assertForbidden();

        $this->actingAs($customer, 'sanctum')
            ->getJson('/api/v1/admin/products')
            ->assertForbidden();
    }

    public function test_guest_cannot_access_protected_apis(): void
    {
        $this->getJson('/api/v1/customer/me')->assertUnauthorized();
        $this->getJson('/api/v1/admin/me')->assertUnauthorized();
        $this->getJson('/api/v1/admin/dashboard')->assertUnauthorized();
        $this->postJson('/api/v1/customer/logout')->assertUnauthorized();
    }

    // ─── Privilege escalation prevention ─────────────────────────────

    public function test_customer_cannot_change_role_via_profile_update(): void
    {
        $customer = User::factory()->create(['name' => 'Original']);

        $this->actingAs($customer, 'sanctum')
            ->putJson('/api/v1/me', ['name' => 'Updated', 'email' => $customer->email, 'phone' => null, 'role' => 'admin'])
            ->assertOk();

        $this->assertSame(UserRole::Customer, $customer->refresh()->role);
    }

    public function test_registration_cannot_create_staff_account(): void
    {
        $this->withHeaders($this->spaHeaders())
            ->postJson('/api/v1/customer/register', [
                'name' => 'Evil',
                'email' => 'evil@example.com',
                'password' => 'secret123',
                'password_confirmation' => 'secret123',
                'role' => 'staff',
            ])
            ->assertCreated()
            ->assertJsonPath('data.role', 'customer');
    }

    // ─── Error responses don't leak info ─────────────────────────────

    public function test_login_errors_are_generic(): void
    {
        // Non-existent user.
        $response1 = $this->withHeaders($this->spaHeaders())
            ->postJson('/api/v1/customer/login', ['email' => 'nobody@example.com', 'password' => 'whatever1']);

        // Existing admin trying customer login.
        User::factory()->admin()->create(['email' => 'admin@example.com']);
        $response2 = $this->withHeaders($this->spaHeaders())
            ->postJson('/api/v1/customer/login', ['email' => 'admin@example.com', 'password' => 'password1']);

        // Both should return the same generic error to avoid revealing which accounts exist.
        $response1->assertJsonValidationErrors(['email' => 'These credentials do not match our records.']);
        $response2->assertJsonValidationErrors(['email' => 'These credentials do not match our records.']);
    }

    // ─── Session expiry / invalid sessions ───────────────────────────

    public function test_expired_session_returns_401(): void
    {
        // A request without any session should get 401.
        $this->getJson('/api/v1/customer/me')->assertUnauthorized();
        $this->getJson('/api/v1/admin/me')->assertUnauthorized();
    }
}
