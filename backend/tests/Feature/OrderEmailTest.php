<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Mail\OrderStatusMail;
use App\Models\Order;
use App\Models\User;
use App\Services\SettingsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Tests\TestCase;

class OrderEmailTest extends TestCase
{
    use RefreshDatabase;

    private function placeOrder(): Order
    {
        $variant = $this->variantWithStock(5);
        $token = $this->postJson('/api/v1/cart/items', ['variant_id' => $variant->id, 'quantity' => 2])->json('token');

        $this->withHeaders(['X-Cart-Token' => (string) $token, 'Idempotency-Key' => (string) Str::uuid()])
            ->postJson('/api/v1/checkout', $this->checkoutPayload(['email' => 'guest@example.com']))
            ->assertCreated();

        return Order::query()->latest('id')->firstOrFail();
    }

    private function moveTo(Order $order, string $status): void
    {
        $admin = User::factory()->admin()->create();
        $this->actingAs($admin, 'sanctum')->patchJson("/api/v1/admin/orders/{$order->number}/status", ['status' => $status])->assertOk();
    }

    public function test_cod_confirmation_email_is_sent_when_order_is_placed(): void
    {
        Mail::fake();

        $order = $this->placeOrder();

        Mail::assertSent(OrderStatusMail::class, function (OrderStatusMail $mail) use ($order): bool {
            return $mail->hasTo('guest@example.com')
                && $mail->status === OrderStatus::Pending
                && str_starts_with($mail->subjectLine(), 'Your Cash on Delivery Order is Confirmed')
                && str_contains($mail->subjectLine(), $order->number);
        });
        Mail::assertSentCount(1);
    }

    public function test_each_lifecycle_status_sends_one_email(): void
    {
        $order = $this->placeOrder();
        Mail::fake();

        foreach (['confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'] as $status) {
            $this->moveTo($order, $status);
        }

        foreach ([OrderStatus::Processing, OrderStatus::Shipped, OrderStatus::OutForDelivery, OrderStatus::Delivered] as $status) {
            Mail::assertSent(OrderStatusMail::class, fn (OrderStatusMail $mail): bool => $mail->status === $status);
        }
        Mail::assertSentCount(4);
        $this->assertSame(OrderStatus::Delivered, $order->refresh()->status);
    }

    public function test_adding_tracking_after_shipping_resends_shipped_email_with_tracking(): void
    {
        $order = $this->placeOrder();
        foreach (['confirmed', 'processing', 'shipped'] as $status) {
            $this->moveTo($order, $status);
        }
        Mail::fake();

        $admin = User::factory()->admin()->create();
        $this->actingAs($admin, 'sanctum')->putJson("/api/v1/admin/orders/{$order->number}/shipment", [
            'carrier' => 'TCS', 'tracking_number' => 'TCS123456', 'tracking_url' => 'https://tcs.example/track/TCS123456',
        ])->assertOk();

        Mail::assertSent(OrderStatusMail::class, fn (OrderStatusMail $mail): bool => $mail->status === OrderStatus::Shipped
            && $mail->order->shipment->tracking_number === 'TCS123456');
        Mail::assertSentCount(1);
    }

    public function test_templates_render_dynamic_order_details(): void
    {
        $order = $this->placeOrder();
        $order->shipment()->updateOrCreate([], ['carrier' => 'Leopards', 'tracking_number' => 'LP-998877']);
        $order->load(['items', 'shipment']);
        $settings = app(SettingsService::class)->all();

        $shipped = (new OrderStatusMail($order, OrderStatus::Shipped, $settings))->render();
        $this->assertStringContainsString('LP-998877', $shipped);
        $this->assertStringContainsString('Leopards', $shipped);
        $this->assertStringContainsString($order->number, $shipped);
        $this->assertStringContainsString($order->items->first()->product_name, $shipped);
        $this->assertStringContainsString(rtrim((string) config('app.url'), '/').'/'.OrderStatusMail::EMAIL_LOGO_PATH, $shipped);
        $this->assertFileExists(public_path(OrderStatusMail::EMAIL_LOGO_PATH));

        $outForDelivery = (new OrderStatusMail($order, OrderStatus::OutForDelivery, $settings))->render();
        $this->assertStringContainsString('Aaj delivery hogi aur payment delivery par deni hai.', $outForDelivery);
        $this->assertStringContainsString('Amount to pay on delivery', $outForDelivery);

        $processing = (new OrderStatusMail($order, OrderStatus::Processing, $settings))->render();
        $this->assertStringContainsString('Hum aap ka order prepare kar rahe hain.', $processing);

        $delivered = (new OrderStatusMail($order, OrderStatus::Delivered, $settings))->render();
        $this->assertStringContainsString('Order deliver ho gaya', str_replace('Aap ka order', 'Order', $delivered));
    }

    public function test_out_for_delivery_is_only_reachable_from_shipped(): void
    {
        $order = $this->placeOrder();
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin, 'sanctum')->patchJson("/api/v1/admin/orders/{$order->number}/status", ['status' => 'out_for_delivery'])
            ->assertUnprocessable();
    }
}
