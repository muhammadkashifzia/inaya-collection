<?php

namespace Tests\Feature;

use App\Enums\Permission;
use App\Enums\UserRole;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class AdminAccessTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, array{string, string}>
     */
    public static function adminEndpoints(): array
    {
        return [
            'dashboard' => ['GET', '/api/v1/admin/dashboard'],
            'products' => ['GET', '/api/v1/admin/products'],
            'orders' => ['GET', '/api/v1/admin/orders'],
            'customers' => ['GET', '/api/v1/admin/customers'],
            'inventory' => ['GET', '/api/v1/admin/inventory'],
            'coupons' => ['GET', '/api/v1/admin/coupons'],
            'settings' => ['GET', '/api/v1/admin/settings'],
            'banners' => ['GET', '/api/v1/admin/banners'],
        ];
    }

    #[DataProvider('adminEndpoints')]
    public function test_guests_get_401_and_customers_get_403(string $method, string $uri): void
    {
        $this->json($method, $uri)->assertUnauthorized();
        $this->actingAs(User::factory()->create(), 'sanctum')->json($method, $uri)->assertForbidden();
    }

    #[DataProvider('adminEndpoints')]
    public function test_admin_can_access_every_admin_endpoint(string $method, string $uri): void
    {
        $this->actingAs(User::factory()->admin()->create(), 'sanctum')->json($method, $uri)->assertOk();
    }

    public function test_deactivated_admin_is_blocked(): void
    {
        $this->actingAs(User::factory()->admin()->inactive()->create(), 'sanctum')
            ->getJson('/api/v1/admin/dashboard')->assertForbidden();
    }

    public function test_staff_cannot_manage_settings_coupons_or_content(): void
    {
        $staff = User::factory()->staff()->create();

        $this->actingAs($staff, 'sanctum')->getJson('/api/v1/admin/products')->assertOk();
        $this->actingAs($staff, 'sanctum')->getJson('/api/v1/admin/settings')->assertForbidden();
        $this->actingAs($staff, 'sanctum')->getJson('/api/v1/admin/coupons')->assertForbidden();
        $this->actingAs($staff, 'sanctum')->getJson('/api/v1/admin/banners')->assertForbidden();
    }

    public function test_permission_matrix(): void
    {
        $admin = User::factory()->admin()->make();
        $staff = User::factory()->staff()->make();
        $customer = User::factory()->make(['role' => UserRole::Customer]);
        $staffAllowed = [
            Permission::ViewDashboard, Permission::ManageProducts, Permission::ManageCategories,
            Permission::ManageOrders, Permission::ManageInventory, Permission::ViewCustomers,
        ];

        foreach (Permission::cases() as $permission) {
            $this->assertTrue(Gate::forUser($admin)->allows($permission->value), "admin: {$permission->value}");
            $this->assertSame(in_array($permission, $staffAllowed, true), Gate::forUser($staff)->allows($permission->value), "staff: {$permission->value}");
            $this->assertFalse(Gate::forUser($customer)->allows($permission->value), "customer: {$permission->value}");
        }
    }

    public function test_dashboard_revenue_excludes_pending_and_cancelled_orders(): void
    {
        $admin = User::factory()->admin()->create();
        $make = fn (string $status, int $total) => Order::query()->create([
            'number' => 'GW-'.uniqid(), 'customer_name' => 'X', 'email' => 'x@example.com', 'phone' => '0300',
            'status' => $status, 'payment_status' => 'pending', 'payment_method' => 'cod', 'shipping_method' => 'standard',
            'subtotal' => $total, 'grand_total' => $total, 'shipping_address' => [], 'billing_address' => [],
            'idempotency_key' => uniqid('k', true), 'placed_at' => now(),
        ]);
        $make('delivered', 100000);
        $make('confirmed', 50000);
        $make('pending', 70000);
        $make('cancelled', 90000);

        $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/dashboard')
            ->assertOk()
            ->assertJsonPath('data.totals.revenue', 1500)
            ->assertJsonPath('data.totals.orders', 4)
            ->assertJsonPath('data.totals.pending_orders', 1)
            ->assertJsonPath('data.totals.cancelled_orders', 1);
    }
}
