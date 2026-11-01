<?php

namespace Tests\Feature;

use App\Models\Cart;
use App\Models\Coupon;
use App\Models\User;
use App\Services\CartService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class CartMergeTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Create a guest cart with a single item via the API (no auth state).
     */
    private function guestCartWithItem(int $variantId, int $quantity): Cart
    {
        $response = $this->postJson('/api/v1/cart/items', [
            'variant_id' => $variantId,
            'quantity' => $quantity,
        ]);
        $token = $response->json('token');

        return Cart::query()->where('token', $token)->sole();
    }

    /**
     * Create a user cart with a single item directly in the DB.
     */
    private function userCartWithItem(User $user, int $variantId, int $quantity): Cart
    {
        $cart = Cart::query()->create(['token' => (string) Str::uuid(), 'user_id' => $user->id]);
        $cart->items()->create(['product_variant_id' => $variantId, 'quantity' => $quantity]);

        return $cart;
    }

    public function test_guest_cart_is_adopted_when_user_has_no_cart(): void
    {
        $user = User::factory()->create();
        $variant = $this->variantWithStock(10);
        $guestCart = $this->guestCartWithItem($variant->id, 3);

        $merged = app(CartService::class)->merge($guestCart, $user, null);

        $this->assertSame($guestCart->id, $merged->id);
        $this->assertSame($user->id, $merged->refresh()->user_id);
        $this->assertSame(3, $merged->items()->sole()->quantity);
    }

    public function test_guest_items_merge_into_existing_user_cart_with_quantity_sum(): void
    {
        $user = User::factory()->create();
        $variant = $this->variantWithStock(10);

        $userCart = $this->userCartWithItem($user, $variant->id, 2);
        $guestCart = $this->guestCartWithItem($variant->id, 3);

        $merged = app(CartService::class)->merge($guestCart, $user, $userCart);

        $this->assertSame($userCart->id, $merged->id);
        $this->assertSame(5, $merged->items()->sole()->quantity);
        $this->assertDatabaseMissing('carts', ['id' => $guestCart->id]);
    }

    public function test_merged_quantity_is_capped_by_stock(): void
    {
        $user = User::factory()->create();
        $variant = $this->variantWithStock(4);

        $userCart = $this->userCartWithItem($user, $variant->id, 3);
        $guestCart = $this->guestCartWithItem($variant->id, 3);

        $merged = app(CartService::class)->merge($guestCart, $user, $userCart);

        // 3 + 3 = 6, but stock is 4, so capped at 4.
        $this->assertSame(4, $merged->items()->sole()->quantity);
    }

    public function test_merge_combines_different_variants(): void
    {
        $user = User::factory()->create();
        $variantA = $this->variantWithStock(10);
        $variantB = $this->variantWithStock(10);

        $userCart = $this->userCartWithItem($user, $variantA->id, 1);
        $guestCart = $this->guestCartWithItem($variantB->id, 2);

        $merged = app(CartService::class)->merge($guestCart, $user, $userCart);

        $this->assertSame(2, $merged->items()->count());
        $this->assertSame(1, $merged->items()->where('product_variant_id', $variantA->id)->sole()->quantity);
        $this->assertSame(2, $merged->items()->where('product_variant_id', $variantB->id)->sole()->quantity);
    }

    public function test_guest_coupon_is_transferred_when_user_cart_has_none(): void
    {
        $user = User::factory()->create();
        $variant = $this->variantWithStock(10, price: 400000);
        Coupon::factory()->create(['code' => 'WELCOME']);

        // Build guest cart with coupon via HTTP.
        $guestToken = $this->postJson('/api/v1/cart/items', ['variant_id' => $variant->id, 'quantity' => 1])->json('token');
        $this->withHeaders(['X-Cart-Token' => $guestToken])->postJson('/api/v1/cart/coupon', ['code' => 'WELCOME'])->assertOk();
        $guestCart = Cart::query()->where('token', $guestToken)->sole();

        // User cart has no coupon.
        $userCart = $this->userCartWithItem($user, $variant->id, 1);

        $merged = app(CartService::class)->merge($guestCart, $user, $userCart);

        $this->assertSame('WELCOME', $merged->refresh()->coupon_code);
    }

    public function test_guest_coupon_does_not_overwrite_existing_user_coupon(): void
    {
        $user = User::factory()->create();
        $variant = $this->variantWithStock(10, price: 400000);
        Coupon::factory()->create(['code' => 'USER10']);
        Coupon::factory()->create(['code' => 'GUEST20']);

        // User cart with coupon.
        $userCart = $this->userCartWithItem($user, $variant->id, 1);
        $userCart->forceFill(['coupon_code' => 'USER10'])->save();

        // Guest cart with a different coupon.
        $guestToken = $this->postJson('/api/v1/cart/items', ['variant_id' => $variant->id, 'quantity' => 1])->json('token');
        $this->withHeaders(['X-Cart-Token' => $guestToken])->postJson('/api/v1/cart/coupon', ['code' => 'GUEST20'])->assertOk();
        $guestCart = Cart::query()->where('token', $guestToken)->sole();

        $merged = app(CartService::class)->merge($guestCart, $user, $userCart);

        // User's coupon is preserved.
        $this->assertSame('USER10', $merged->refresh()->coupon_code);
    }

    public function test_guest_cart_is_deleted_after_merge(): void
    {
        $user = User::factory()->create();
        $variant = $this->variantWithStock(10);

        $userCart = $this->userCartWithItem($user, $variant->id, 1);
        $guestCart = $this->guestCartWithItem($variant->id, 1);
        $guestCartId = $guestCart->id;

        app(CartService::class)->merge($guestCart, $user, $userCart);

        $this->assertDatabaseMissing('carts', ['id' => $guestCartId]);
    }
}
