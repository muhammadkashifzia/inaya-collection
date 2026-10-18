<?php

namespace App\Mail;

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;

/**
 * Customer email for an order lifecycle step. One template renders every
 * step; the copy, badges and blocks shown depend on the status.
 */
class OrderStatusMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Header logo (white artwork for the navy header), served from public/.
     */
    public const EMAIL_LOGO_PATH = 'images/email/anaya-collection-logo.png';

    /**
     * @param  array<string, mixed>  $settings  Store settings from SettingsService::all()
     */
    public function __construct(
        public Order $order,
        public OrderStatus $status,
        public array $settings,
    ) {}

    public function envelope(): Envelope
    {
        $storeEmail = Arr::get($this->settings, 'store.email');

        return new Envelope(
            subject: $this->subjectLine(),
            replyTo: filled($storeEmail) && filter_var($storeEmail, FILTER_VALIDATE_EMAIL)
                ? [new Address($storeEmail, $this->storeName())]
                : [],
            tags: ['order', 'order-'.$this->status->value],
            metadata: ['order_number' => $this->order->number],
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.orders.status',
            text: 'emails.orders.status-text',
            with: $this->viewData(),
        );
    }

    /**
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        return [];
    }

    public function subjectLine(): string
    {
        $number = $this->order->number;

        return match ($this->status) {
            OrderStatus::Pending, OrderStatus::Confirmed => $this->isCashOnDelivery()
                ? "Your Cash on Delivery Order is Confirmed (#{$number})"
                : "Your Order is Confirmed (#{$number})",
            OrderStatus::Processing => "We're Preparing Your Order #{$number}",
            OrderStatus::Shipped => "Your Order #{$number} Has Been Shipped",
            OrderStatus::OutForDelivery => "Your Order #{$number} is Out for Delivery Today",
            OrderStatus::Delivered => "Your Order #{$number} Has Been Delivered",
            default => "Update on Your Order #{$number}",
        };
    }

    /**
     * Status specific copy for the template.
     *
     * @return array{badge: string, heading: string, intro: string, localMessage: string, accent: string}
     */
    private function copy(): array
    {
        $name = $this->firstName();
        $total = $this->money($this->order->grand_total);

        return match ($this->status) {
            OrderStatus::Pending, OrderStatus::Confirmed => [
                'badge' => 'Order Confirmed',
                'heading' => "Thank you for your order, {$name}!",
                'intro' => $this->isCashOnDelivery()
                    ? "We've received your Cash on Delivery order. Please keep {$total} ready to pay the rider when your parcel arrives."
                    : "We've received your order and will start preparing it shortly.",
                'localMessage' => 'Aap ka order confirm ho gaya hai. Shukriya!',
                'accent' => '#16a34a',
            ],
            OrderStatus::Processing => [
                'badge' => 'Processing',
                'heading' => "We're preparing your order, {$name}",
                'intro' => "Your order is being carefully packed. We'll email you again as soon as it ships.",
                'localMessage' => 'Hum aap ka order prepare kar rahe hain.',
                'accent' => '#2563eb',
            ],
            OrderStatus::Shipped => [
                'badge' => 'Shipped',
                'heading' => 'Your order is on its way!',
                'intro' => $this->trackingNumber() !== null
                    ? 'Your parcel has been handed to our courier partner. Use the tracking number below to follow its journey.'
                    : "Your parcel has been handed to our courier partner. We'll share tracking details shortly.",
                'localMessage' => 'Aap ka order ship kar diya gaya hai.',
                'accent' => '#7c3aed',
            ],
            OrderStatus::OutForDelivery => [
                'badge' => 'Out for Delivery',
                'heading' => 'Your order arrives today!',
                'intro' => $this->amountDue() > 0
                    ? "Our rider is on the way. Please keep {$this->money($this->amountDue())} in cash ready and keep your phone ({$this->order->phone}) reachable."
                    : "Our rider is on the way. Please keep your phone ({$this->order->phone}) reachable.",
                'localMessage' => $this->amountDue() > 0
                    ? 'Aaj delivery hogi aur payment delivery par deni hai.'
                    : 'Aaj aap ka order deliver hoga.',
                'accent' => '#ea580c',
            ],
            OrderStatus::Delivered => [
                'badge' => 'Delivered',
                'heading' => "Your order has been delivered, {$name}",
                'intro' => "We hope you love your purchase. If anything isn't right, just reply to this email and our team will help.",
                'localMessage' => 'Aap ka order deliver ho gaya. Shukriya!',
                'accent' => '#16a34a',
            ],
            default => [
                'badge' => $this->status->label(),
                'heading' => 'Your order has been updated',
                'intro' => "Your order status is now {$this->status->label()}.",
                'localMessage' => '',
                'accent' => '#6b7280',
            ],
        };
    }

    /**
     * @return array<string, mixed>
     */
    private function viewData(): array
    {
        $order = $this->order;
        $store = Arr::get($this->settings, 'store', []);
        $frontend = rtrim((string) config('app.frontend_url'), '/');

        $steps = [OrderStatus::Pending, OrderStatus::Processing, OrderStatus::Shipped, OrderStatus::OutForDelivery, OrderStatus::Delivered];
        $currentStep = match ($this->status) {
            OrderStatus::Pending, OrderStatus::Confirmed => 0,
            OrderStatus::Processing => 1,
            OrderStatus::Shipped => 2,
            OrderStatus::OutForDelivery => 3,
            OrderStatus::Delivered => 4,
            default => -1,
        };

        $shippingMethod = collect(Arr::get($this->settings, 'shipping.methods', []))
            ->firstWhere('code', $order->shipping_method);

        return [
            ...$this->copy(),
            'status' => $this->status,
            'order' => $order,
            'number' => $order->number,
            'customerName' => $order->customer_name,
            'placedAt' => $order->placed_at?->timezone($this->timezone())->format('d M Y, h:i A'),
            'paymentMethod' => $order->payment_method->label(),
            'isCashOnDelivery' => $this->isCashOnDelivery(),
            'isPaid' => $order->payment_status === PaymentStatus::Paid,
            'amountDue' => $this->amountDue() > 0 ? $this->money($this->amountDue()) : null,
            'shippingMethod' => $shippingMethod['name'] ?? $order->shipping_method,
            'items' => $order->items->map(fn ($item): array => [
                'name' => $item->product_name,
                'variant' => $item->variant_name,
                'sku' => $item->sku,
                'quantity' => $item->quantity,
                'unitPrice' => $this->money($item->unit_price),
                'lineTotal' => $this->money($item->line_total),
                'image' => $item->image ? $this->absoluteUrl(Storage::disk('public')->url($item->image)) : null,
            ])->all(),
            'totals' => array_values(array_filter([
                ['label' => 'Subtotal', 'value' => $this->money($order->subtotal)],
                $order->discount_total > 0
                    ? ['label' => 'Discount'.($order->coupon_code ? " ({$order->coupon_code})" : ''), 'value' => '−'.$this->money($order->discount_total)]
                    : null,
                ['label' => 'Shipping', 'value' => $order->shipping_total > 0 ? $this->money($order->shipping_total) : 'Free'],
                $order->tax_total > 0 ? ['label' => 'Tax', 'value' => $this->money($order->tax_total)] : null,
            ])),
            'grandTotal' => $this->money($order->grand_total),
            'address' => $this->addressLines($order->shipping_address ?? []),
            'showTracking' => in_array($this->status, [OrderStatus::Shipped, OrderStatus::OutForDelivery], true),
            'carrier' => $order->shipment?->carrier,
            'trackingNumber' => $this->trackingNumber(),
            'trackingUrl' => $order->shipment?->tracking_url,
            'steps' => array_map(fn (OrderStatus $s): string => $s === OrderStatus::Pending ? 'Confirmed' : $s->label(), $steps),
            'currentStep' => $currentStep,
            'orderUrl' => $order->user_id !== null
                ? $frontend.'/account/orders/'.rawurlencode($order->number)
                : $frontend.'/pages/track-your-order',
            'orderUrlLabel' => $order->user_id !== null ? 'View your order' : 'Track your order',
            'shopUrl' => $frontend,
            'storeName' => $this->storeName(),
            'storeLogo' => $this->absoluteUrl(self::EMAIL_LOGO_PATH),
            'storeEmail' => $store['email'] ?? null,
            'storePhone' => $store['phone'] ?? null,
            'storeWhatsapp' => $store['whatsapp'] ?? null,
            'storeAddress' => $store['address'] ?? null,
            'storeHours' => $store['hours'] ?? null,
            'social' => array_values(array_filter(
                Arr::get($this->settings, 'social', []),
                fn ($link): bool => is_array($link) && filled($link['href'] ?? null) && filled($link['label'] ?? null),
            )),
            'copyright' => Arr::get($this->settings, 'footer.copyright', $this->storeName()),
            'year' => now()->year,
        ];
    }

    private function isCashOnDelivery(): bool
    {
        return $this->order->payment_method === PaymentMethod::CashOnDelivery;
    }

    /**
     * Cash still to be collected at the door, in minor units.
     */
    private function amountDue(): int
    {
        if (! $this->isCashOnDelivery() || $this->order->payment_status === PaymentStatus::Paid) {
            return 0;
        }

        return $this->order->grand_total;
    }

    private function trackingNumber(): ?string
    {
        $number = $this->order->shipment?->tracking_number;

        return filled($number) ? $number : null;
    }

    private function firstName(): string
    {
        $name = trim((string) $this->order->customer_name);

        return $name === '' ? 'there' : strtok($name, ' ');
    }

    private function storeName(): string
    {
        return (string) Arr::get($this->settings, 'store.name', config('app.name'));
    }

    private function timezone(): string
    {
        return (string) Arr::get($this->settings, 'localization.timezone', config('app.timezone'));
    }

    /**
     * Format minor units (paisa) as a display amount, e.g. "Rs. 12,500".
     */
    private function money(int $minor): string
    {
        $symbol = (string) Arr::get($this->settings, 'localization.currency_symbol', 'Rs.');
        $major = $minor / 100;
        $decimals = fmod($major, 1.0) === 0.0 ? 0 : 2;

        return trim($symbol.' '.number_format($major, $decimals));
    }

    /**
     * @param  array<string, mixed>  $address
     * @return list<string>
     */
    private function addressLines(array $address): array
    {
        $cityLine = implode(', ', array_filter([$address['city'] ?? null, $address['province'] ?? null, $address['postal_code'] ?? null]));

        return array_values(array_filter([
            $address['full_name'] ?? null,
            $address['line1'] ?? null,
            $address['line2'] ?? null,
            $cityLine,
            $address['phone'] ?? null,
        ], fn ($line): bool => filled($line)));
    }

    private function absoluteUrl(string $url): string
    {
        return str_starts_with($url, 'http') ? $url : rtrim((string) config('app.url'), '/').'/'.ltrim($url, '/');
    }
}
