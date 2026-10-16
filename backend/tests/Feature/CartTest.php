<?php

namespace Tests\Feature;

use App\Models\Coupon;
use App\Models\User;
use App\Services\SettingsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CartTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_add_items_and_totals_come_from_the_server(): void
    {
        $variant = $this->variantWithStock(10, price: 399900, salePrice: 329900);

        $response = $this->postJson('/api/v1/cart/items', ['variant_id' => $variant->id, 'quantity' => 2, 'price' => 1]);

        $response->assertOk()
            ->assertJsonPath('item_count', 2)
            ->assertJsonPath('items.0.unit_price', 3299)
            ->assertJsonPath('subtotal', 6598)
            ->assertJsonPath('shipping_total', 0)
            ->assertJsonPath('grand_total', 6598);
        $this->assertNotNull($response->json('token'));
    }

    public function test_shipping_is_charged_below_the_free_shipping_threshold(): void
    {
        $variant = $this->variantWithStock(10, price: 200000);

        $this->postJson('/api/v1/cart/items', ['variant_id' => $variant->id, 'quantity' => 1])
            ->assertJsonPath('subtotal', 2000)
            ->assertJsonPath('shipping_total', 250)
            ->assertJsonPath('grand_total', 2250);
    }

    public function test_cannot_add_more_than_stock_or_unavailable_products(): void
    {
        $variant = $this->variantWithStock(3);
        $this->postJson('/api/v1/cart/items', ['variant_id' => $variant->id, 'quantity' => 4])
            ->assertUnprocessable()->assertJsonValidationErrors(['quantity' => 'Only 3 in stock.']);

        $variant->product->update(['status' => 'draft']);
        $this->postJson('/api/v1/cart/items', ['variant_id' => $variant->id, 'quantity' => 1])
            ->assertUnprocessable()->assertJsonValidationErrors(['variant_id']);
    }

    public function test_update_and_remove_items_using_cart_token(): void
    {
        $variant = $this->variantWithStock(10);
        $cart = $this->postJson('/api/v1/cart/items', ['variant_id' => $variant->id, 'quantity' => 1])->json();
        $headers = ['X-Cart-Token' => $cart['token']];
        $itemId = $cart['items'][0]['id'];

        $this->withHeaders($headers)->patchJson("/api/v1/cart/items/{$itemId}", ['quantity' => 4])->assertJsonPath('items.0.quantity', 4);
        $this->withHeaders($headers)->deleteJson("/api/v1/cart/items/{$itemId}")->assertJsonPath('item_count', 0);
    }

    public function test_cannot_modify_another_carts_items(): void
    {
        $variant = $this->variantWithStock(10);
        $cartA = $this->postJson('/api/v1/cart/items', ['variant_id' => $variant->id, 'quantity' => 1])->json();
        $cartB = $this->postJson('/api/v1/cart/items', ['variant_id' => $variant->id, 'quantity' => 1])->json();

        $this->withHeaders(['X-Cart-Token' => $cartB['token']])
            ->patchJson("/api/v1/cart/items/{$cartA['items'][0]['id']}", ['quantity' => 5])
            ->assertNotFound();
    }

    public function test_coupon_is_validated_and_applied(): void
    {
        $variant = $this->variantWithStock(10, price: 400000);
        Coupon::factory()->create(['code' => 'WINTER10', 'value' => 10]);
        Coupon::factory()->create(['code' => 'OLD', 'expires_at' => now()->subDay()]);
        $token = $this->postJson('/api/v1/cart/items', ['variant_id' => $variant->id, 'quantity' => 1])->json('token');

        $this->withHeaders(['X-Cart-Token' => $token])->postJson('/api/v1/cart/coupon', ['code' => 'old'])
            ->assertUnprocessable()->assertJsonValidationErrors(['coupon_code' => 'This coupon has expired.']);
        $this->withHeaders(['X-Cart-Token' => $token])->postJson('/api/v1/cart/coupon', ['code' => 'nope'])
            ->assertUnprocessable()->assertJsonValidationErrors(['coupon_code' => 'This coupon code is invalid.']);

        $this->withHeaders(['X-Cart-Token' => $token])->postJson('/api/v1/cart/coupon', ['code' => 'winter10'])
            ->assertOk()
            ->assertJsonPath('coupon_code', 'WINTER10')
            ->assertJsonPath('discount_total', 400)
            ->assertJsonPath('shipping_total', 0)
            ->assertJsonPath('grand_total', 3600);
    }

    public function test_coupon_minimum_order_and_restrictions(): void
    {
        $variant = $this->variantWithStock(10, price: 100000);
        $other = $this->variantWithStock(10);
        Coupon::factory()->create(['code' => 'BIG', 'min_order_amount' => 500000]);
        $restricted = Coupon::factory()->create(['code' => 'ONLYOTHER']);
        $restricted->products()->attach($other->product_id);
        $token = $this->postJson('/api/v1/cart/items', ['variant_id' => $variant->id, 'quantity' => 1])->json('token');

        $this->withHeaders(['X-Cart-Token' => $token])->postJson('/api/v1/cart/coupon', ['code' => 'BIG'])
            ->assertJsonValidationErrors(['coupon_code' => 'Minimum order of Rs. 5,000 required for this coupon.']);
        $this->withHeaders(['X-Cart-Token' => $token])->postJson('/api/v1/cart/coupon', ['code' => 'ONLYOTHER'])
            ->assertJsonValidationErrors(['coupon_code' => 'This coupon does not apply to the items in your cart.']);
    }

    public function test_fixed_coupon_with_tax_exclusive_settings(): void
    {
        app(SettingsService::class)->update(['tax' => ['rate_percent' => 10, 'prices_include_tax' => false]]);
        $variant = $this->variantWithStock(10, price: 400000);
        Coupon::factory()->fixed(50000)->create(['code' => 'FLAT500']);
        $token = $this->postJson('/api/v1/cart/items', ['variant_id' => $variant->id, 'quantity' => 1])->json('token');

        $this->withHeaders(['X-Cart-Token' => $token])->postJson('/api/v1/cart/coupon', ['code' => 'FLAT500'])
            ->assertJsonPath('discount_total', 500)
            ->assertJsonPath('tax_total', 350)
            ->assertJsonPath('shipping_total', 0)
            ->assertJsonPath('grand_total', 3850);
    }

    public function test_signed_in_customer_cart_is_tied_to_the_account(): void
    {
        $user = User::factory()->create();
        $variant = $this->variantWithStock(10);

        $this->actingAs($user, 'sanctum')->postJson('/api/v1/cart/items', ['variant_id' => $variant->id, 'quantity' => 1])
            ->assertOk()->assertJsonPath('token', null);

        $this->assertSame(1, $user->cart()->first()->items()->count());
    }
}
