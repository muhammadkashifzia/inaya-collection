<?php

namespace Tests\Feature;

use App\Enums\InventoryReason;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Address;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\User;
use App\Services\SettingsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class CheckoutTest extends TestCase
{
    use RefreshDatabase;

    private function cartWith(int $variantId, int $quantity): string
    {
        return $this->postJson('/api/v1/cart/items', ['variant_id' => $variantId, 'quantity' => $quantity])->json('token');
    }

    public function test_guest_cod_checkout_creates_order_with_server_totals_and_decrements_stock(): void
    {
        $variant = $this->variantWithStock(5, price: 399900, salePrice: 329900);
        $token = $this->cartWith($variant->id, 2);

        $response = $this->withHeaders(['X-Cart-Token' => $token, 'Idempotency-Key' => (string) Str::uuid()])
            ->postJson('/api/v1/checkout', $this->checkoutPayload(['grand_total' => 1, 'subtotal' => 1]));

        $response->assertCreated()
            ->assertJsonPath('status', 'pending')
            ->assertJsonPath('payment_method', 'cod')
            ->assertJsonPath('subtotal', 6598)
            ->assertJsonPath('grand_total', 6598)
            ->assertJsonPath('items.0.quantity', 2);

        $order = Order::query()->sole();
        $this->assertSame(659800, $order->grand_total);
        $this->assertSame(PaymentStatus::Pending, $order->payments()->sole()->status);
        $this->assertSame(3, $variant->refresh()->stock);
        $this->assertDatabaseHas('inventory_movements', [
            'product_variant_id' => $variant->id, 'quantity_change' => -2, 'reason' => InventoryReason::Sale->value, 'order_id' => $order->id,
        ]);
        $this->assertDatabaseCount('cart_items', 0);
    }

    public function test_repeated_request_with_same_idempotency_key_returns_same_order(): void
    {
        $variant = $this->variantWithStock(5);
        $token = $this->cartWith($variant->id, 1);
        $headers = ['X-Cart-Token' => $token, 'Idempotency-Key' => (string) Str::uuid()];

        $first = $this->withHeaders($headers)->postJson('/api/v1/checkout', $this->checkoutPayload())->assertCreated();
        $second = $this->withHeaders($headers)->postJson('/api/v1/checkout', $this->checkoutPayload())->assertOk();

        $this->assertSame($first->json('number'), $second->json('number'));
        $this->assertDatabaseCount('orders', 1);
        $this->assertSame(4, $variant->refresh()->stock);
    }

    public function test_checkout_requires_idempotency_key_and_valid_fields(): void
    {
        $variant = $this->variantWithStock(5);
        $token = $this->cartWith($variant->id, 1);

        $this->withHeaders(['X-Cart-Token' => $token])->postJson('/api/v1/checkout', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['customer_name', 'email', 'phone', 'shipping_address.line1', 'shipping_method', 'payment_method', 'idempotency_key']);
    }

    public function test_checkout_fails_when_stock_ran_out_after_adding_to_cart(): void
    {
        $variant = $this->variantWithStock(2);
        $token = $this->cartWith($variant->id, 2);
        $variant->forceFill(['stock' => 1])->save();

        $this->withHeaders(['X-Cart-Token' => $token, 'Idempotency-Key' => (string) Str::uuid()])
            ->postJson('/api/v1/checkout', $this->checkoutPayload())
            ->assertUnprocessable()
            ->assertJsonValidationErrors('cart');

        $this->assertDatabaseCount('orders', 0);
        $this->assertSame(1, $variant->refresh()->stock);
    }

    public function test_checkout_uses_current_price_not_price_at_add_to_cart(): void
    {
        $variant = $this->variantWithStock(5, price: 300000);
        $token = $this->cartWith($variant->id, 1);
        $variant->product->update(['price' => 450000]);

        $this->withHeaders(['X-Cart-Token' => $token, 'Idempotency-Key' => (string) Str::uuid()])
            ->postJson('/api/v1/checkout', $this->checkoutPayload())
            ->assertCreated()
            ->assertJsonPath('subtotal', 4500);
    }

    public function test_coupon_usage_is_recorded_and_limits_enforced(): void
    {
        $variant = $this->variantWithStock(10, price: 400000);
        $coupon = Coupon::factory()->create(['code' => 'ONCE', 'value' => 10, 'per_customer_limit' => 1]);

        $token = $this->cartWith($variant->id, 1);
        $this->withHeaders(['X-Cart-Token' => $token])->postJson('/api/v1/cart/coupon', ['code' => 'ONCE'])->assertOk();
        $this->withHeaders(['X-Cart-Token' => $token, 'Idempotency-Key' => (string) Str::uuid()])
            ->postJson('/api/v1/checkout', $this->checkoutPayload())
            ->assertCreated()
            ->assertJsonPath('discount_total', 400);

        $this->assertSame(1, $coupon->refresh()->used_count);

        $token2 = $this->cartWith($variant->id, 1);
        $this->withHeaders(['X-Cart-Token' => $token2])->postJson('/api/v1/cart/coupon', ['code' => 'ONCE'])->assertOk();
        $this->withHeaders(['X-Cart-Token' => $token2, 'Idempotency-Key' => (string) Str::uuid()])
            ->postJson('/api/v1/checkout', $this->checkoutPayload())
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['coupon_code' => 'You have already used this coupon.']);
    }

    public function test_signed_in_customer_can_checkout_with_saved_address_but_not_someone_elses(): void
    {
        $user = User::factory()->create();
        $mine = $user->addresses()->create(Address::factory()->make()->only([
            'full_name', 'phone', 'line1', 'city', 'country',
        ]));
        $theirs = Address::factory()->create();
        $variant = $this->variantWithStock(5);

        $this->actingAs($user, 'sanctum')->postJson('/api/v1/cart/items', ['variant_id' => $variant->id, 'quantity' => 1]);

        $payload = $this->checkoutPayload();
        unset($payload['shipping_address']);

        $this->actingAs($user, 'sanctum')->withHeaders(['Idempotency-Key' => (string) Str::uuid()])
            ->postJson('/api/v1/checkout', [...$payload, 'shipping_address_id' => $theirs->id])
            ->assertUnprocessable()->assertJsonValidationErrors('shipping_address_id');

        $this->actingAs($user, 'sanctum')->withHeaders(['Idempotency-Key' => (string) Str::uuid()])
            ->postJson('/api/v1/checkout', [...$payload, 'shipping_address_id' => $mine->id])
            ->assertCreated()
            ->assertJsonPath('shipping_address.line1', $mine->line1);

        $this->assertSame($user->id, Order::query()->sole()->user_id);
    }

    public function test_cod_disabled_blocks_checkout(): void
    {
        app(SettingsService::class)->update(['payments' => ['cod_enabled' => false, 'cod_max_order_amount' => null]]);
        $variant = $this->variantWithStock(5);
        $token = $this->cartWith($variant->id, 1);

        $this->withHeaders(['X-Cart-Token' => $token, 'Idempotency-Key' => (string) Str::uuid()])
            ->postJson('/api/v1/checkout', $this->checkoutPayload())
            ->assertUnprocessable()->assertJsonValidationErrors('payment_method');

        $this->assertSame(OrderStatus::cases()[0], OrderStatus::Pending);
        $this->assertDatabaseCount('orders', 0);
    }
}
