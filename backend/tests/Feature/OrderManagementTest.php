<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class OrderManagementTest extends TestCase
{
    use RefreshDatabase;

    private function placeOrder(?User $user = null, int $quantity = 2, int $stock = 5): Order
    {
        $variant = $this->variantWithStock($stock);
        $request = $user ? $this->actingAs($user, 'sanctum') : $this;
        $token = $request->postJson('/api/v1/cart/items', ['variant_id' => $variant->id, 'quantity' => $quantity])->json('token');

        $request->withHeaders(['X-Cart-Token' => (string) $token, 'Idempotency-Key' => (string) Str::uuid()])
            ->postJson('/api/v1/checkout', $this->checkoutPayload(['email' => $user->email ?? 'guest@example.com']))
            ->assertCreated();

        return Order::query()->latest('id')->firstOrFail();
    }

    public function test_admin_moves_order_through_permitted_statuses_and_cod_is_paid_on_delivery(): void
    {
        $admin = User::factory()->admin()->create();
        $order = $this->placeOrder();

        foreach (['confirmed', 'processing', 'shipped', 'delivered'] as $status) {
            $this->actingAs($admin, 'sanctum')->patchJson("/api/v1/admin/orders/{$order->number}/status", ['status' => $status])
                ->assertOk()->assertJsonPath('status', $status);
        }

        $order->refresh();
        $this->assertSame(PaymentStatus::Paid, $order->payment_status);
        $this->assertNotNull($order->shipment->delivered_at);
        $this->assertCount(5, $order->statusHistory);
    }

    public function test_invalid_transition_is_rejected(): void
    {
        $admin = User::factory()->admin()->create();
        $order = $this->placeOrder();

        $this->actingAs($admin, 'sanctum')->patchJson("/api/v1/admin/orders/{$order->number}/status", ['status' => 'delivered'])
            ->assertUnprocessable()->assertJsonValidationErrors(['status' => 'Cannot change order from pending to delivered.']);
    }

    public function test_cancelling_restores_stock_and_releases_coupon(): void
    {
        $admin = User::factory()->admin()->create();
        $variant = $this->variantWithStock(5, price: 400000);
        $coupon = Coupon::factory()->create(['code' => 'TEN']);
        $token = $this->postJson('/api/v1/cart/items', ['variant_id' => $variant->id, 'quantity' => 2])->json('token');
        $this->withHeaders(['X-Cart-Token' => $token])->postJson('/api/v1/cart/coupon', ['code' => 'TEN']);
        $this->withHeaders(['X-Cart-Token' => $token, 'Idempotency-Key' => (string) Str::uuid()])
            ->postJson('/api/v1/checkout', $this->checkoutPayload())->assertCreated();
        $order = Order::query()->sole();
        $this->assertSame(3, $variant->refresh()->stock);

        $this->actingAs($admin, 'sanctum')->patchJson("/api/v1/admin/orders/{$order->number}/status", ['status' => 'cancelled', 'note' => 'Customer request'])
            ->assertOk();

        $this->assertSame(5, $variant->refresh()->stock);
        $this->assertSame(0, $coupon->refresh()->used_count);
        $this->assertSame(PaymentStatus::Cancelled, $order->refresh()->payment_status);
        $this->assertSame(OrderStatus::Cancelled, $order->status);
    }

    public function test_staff_cannot_refund_but_admin_can(): void
    {
        $admin = User::factory()->admin()->create();
        $staff = User::factory()->staff()->create();
        $order = $this->placeOrder();
        foreach (['confirmed', 'processing', 'shipped', 'delivered'] as $status) {
            $this->actingAs($admin, 'sanctum')->patchJson("/api/v1/admin/orders/{$order->number}/status", ['status' => $status]);
        }

        $this->actingAs($staff, 'sanctum')->patchJson("/api/v1/admin/orders/{$order->number}/status", ['status' => 'refunded'])->assertForbidden();
        $this->actingAs($admin, 'sanctum')->patchJson("/api/v1/admin/orders/{$order->number}/status", ['status' => 'refunded'])->assertOk();
        $this->assertSame(PaymentStatus::Refunded, $order->refresh()->payment_status);
    }

    public function test_customer_sees_only_their_own_orders(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();
        $aliceOrder = $this->placeOrder($alice);

        $this->actingAs($alice, 'sanctum')->getJson('/api/v1/me/orders')->assertOk()->assertJsonPath('meta.total', 1);
        $this->actingAs($alice, 'sanctum')->getJson("/api/v1/me/orders/{$aliceOrder->number}")->assertOk();
        $this->actingAs($bob, 'sanctum')->getJson("/api/v1/me/orders/{$aliceOrder->number}")->assertForbidden();
        $this->actingAs($bob, 'sanctum')->postJson("/api/v1/me/orders/{$aliceOrder->number}/cancel")->assertForbidden();
    }

    public function test_customer_can_cancel_only_pending_orders(): void
    {
        $alice = User::factory()->create();
        $admin = User::factory()->admin()->create();
        $order = $this->placeOrder($alice);

        $this->actingAs($admin, 'sanctum')->patchJson("/api/v1/admin/orders/{$order->number}/status", ['status' => 'confirmed']);
        $this->actingAs($alice, 'sanctum')->postJson("/api/v1/me/orders/{$order->number}/cancel")->assertUnprocessable();

        $pending = $this->placeOrder($alice);
        $this->actingAs($alice, 'sanctum')->postJson("/api/v1/me/orders/{$pending->number}/cancel")->assertOk()->assertJsonPath('status', 'cancelled');
    }

    public function test_guest_tracking_requires_matching_contact(): void
    {
        $order = $this->placeOrder();

        $this->postJson('/api/v1/orders/track', ['number' => $order->number, 'contact' => 'wrong@example.com'])->assertNotFound();
        $this->postJson('/api/v1/orders/track', ['number' => strtolower($order->number), 'contact' => 'GUEST@example.com'])
            ->assertOk()->assertJsonPath('number', $order->number)->assertJsonMissingPath('payments');
        $this->postJson('/api/v1/orders/track', ['number' => $order->number, 'contact' => '+92 300 1234567'])->assertOk();
    }
}
