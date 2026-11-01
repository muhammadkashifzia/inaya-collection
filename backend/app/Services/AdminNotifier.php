<?php

namespace App\Services;

use App\Models\AdminNotification;
use App\Models\ContactMessage;
use App\Models\Order;
use App\Models\PushSubscription;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;

/**
 * Creates admin notifications when events occur (new order, new message)
 * and sends Web Push notifications to all subscribed admin devices.
 */
class AdminNotifier
{
    public function orderPlaced(Order $order): AdminNotification
    {
        $notification = AdminNotification::query()->create([
            'type' => 'new_order',
            'title' => 'New order received',
            'body' => "Order {$order->number} — Rs. ".number_format($order->grand_total)." from {$order->customer_name}",
            'link' => "/orders/{$order->number}",
            'reference_id' => $order->id,
        ]);

        Log::info('Admin notification: new order', ['order' => $order->number, 'notification_id' => $notification->id]);

        $this->sendPush($notification);

        return $notification;
    }

    public function messageReceived(ContactMessage $message): AdminNotification
    {
        $notification = AdminNotification::query()->create([
            'type' => 'new_message',
            'title' => 'New message',
            'body' => "{$message->name}: {$message->subject}",
            'link' => "/messages/{$message->id}",
            'reference_id' => $message->id,
        ]);

        Log::info('Admin notification: new message', ['message_id' => $message->id, 'notification_id' => $notification->id]);

        $this->sendPush($notification);

        return $notification;
    }

    /**
     * Send Web Push to all subscribed admin devices.
     */
    private function sendPush(AdminNotification $notification): void
    {
        $vapidPublic = config('services.webpush.vapid_public_key');
        $vapidPrivate = config('services.webpush.vapid_private_key');

        if (! $vapidPublic || ! $vapidPrivate) {
            Log::warning('Push skipped: VAPID keys not configured.');

            return;
        }

        $subscriptions = PushSubscription::all();

        if ($subscriptions->isEmpty()) {
            return;
        }

        try {
            $adminUrl = rtrim((string) config('app.frontend_url', config('app.url')), '/');

            $webPush = new WebPush([
                'VAPID' => [
                    'subject' => $adminUrl ?: 'mailto:admin@anayacollection.com',
                    'publicKey' => $vapidPublic,
                    'privateKey' => $vapidPrivate,
                ],
            ]);

            $unreadCount = AdminNotification::query()->whereNull('read_at')->count();

            $payload = json_encode([
                'title' => $notification->title,
                'body' => $notification->body,
                'url' => $notification->link,
                'tag' => $notification->type.'-'.$notification->id,
                'badge_count' => $unreadCount,
            ], JSON_THROW_ON_ERROR);

            foreach ($subscriptions as $sub) {
                $webPush->queueNotification(
                    Subscription::create([
                        'endpoint' => $sub->endpoint,
                        'publicKey' => $sub->p256dh,
                        'authToken' => $sub->auth,
                    ]),
                    $payload,
                );
            }

            $staleIds = [];
            foreach ($webPush->flush() as $report) {
                if ($report->isSubscriptionExpired()) {
                    $endpoint = $report->getRequest()->getUri()->__toString();
                    $staleSub = PushSubscription::query()->where('endpoint', $endpoint)->first();
                    if ($staleSub) {
                        $staleIds[] = $staleSub->id;
                    }
                }
            }

            // Clean up expired subscriptions
            if ($staleIds !== []) {
                PushSubscription::query()->whereIn('id', $staleIds)->delete();
                Log::info('Removed expired push subscriptions', ['count' => count($staleIds)]);
            }
        } catch (\Throwable $e) {
            Log::error('Push notification failed', ['error' => $e->getMessage()]);
        }
    }
}
