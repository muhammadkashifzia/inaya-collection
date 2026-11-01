<?php

namespace App\Console\Commands;

use App\Models\AdminNotification;
use App\Models\PushSubscription;
use Illuminate\Console\Command;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;

/**
 * Sends a test push notification to all subscribed admin devices.
 * Usage: php artisan admin:test-push
 */
class TestPushNotification extends Command
{
    protected $signature = 'admin:test-push';

    protected $description = 'Send a test push notification to all subscribed admin devices';

    public function handle(): int
    {
        $this->info('=== Push Notification Test ===');
        $this->newLine();

        // 1) Check VAPID keys
        $vapidPublic = config('services.webpush.vapid_public_key');
        $vapidPrivate = config('services.webpush.vapid_private_key');

        if (! $vapidPublic || ! $vapidPrivate) {
            $this->error('❌ VAPID keys not configured in .env');
            $this->line('   Add VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY to your .env file.');

            return self::FAILURE;
        }
        $this->info('✅ VAPID keys configured (public: '.strlen($vapidPublic).' chars)');

        // 2) Check push subscriptions
        $subscriptions = PushSubscription::all();
        $this->info("✅ Push subscriptions in DB: {$subscriptions->count()}");

        if ($subscriptions->isEmpty()) {
            $this->warn('⚠️  No push subscriptions found.');
            $this->line('   Open the admin panel in a browser, allow notifications, and reload.');
            $this->line('   The subscription will be registered automatically.');
            $this->newLine();
            $this->line('   To verify, check the browser console for "[Push]" log messages.');

            return self::FAILURE;
        }

        // Show subscription details
        foreach ($subscriptions as $sub) {
            $this->line("   → User #{$sub->user_id} | Endpoint: ".substr($sub->endpoint, 0, 60).'…');
        }

        // 3) Create a test notification
        $notification = AdminNotification::query()->create([
            'type' => 'new_order',
            'title' => '🧪 Test Push Notification',
            'body' => 'If you see this on your device, push notifications are working!',
            'link' => '/orders',
            'reference_id' => null,
        ]);
        $this->info("✅ Test notification created (ID: {$notification->id})");

        // 4) Send push to all subscriptions
        $this->info('📤 Sending push to '.$subscriptions->count().' device(s)…');

        try {
            $webPush = new WebPush([
                'VAPID' => [
                    'subject' => rtrim((string) config('app.url'), '/'),
                    'publicKey' => $vapidPublic,
                    'privateKey' => $vapidPrivate,
                ],
            ]);

            $unreadCount = AdminNotification::query()->whereNull('read_at')->count();

            $payload = json_encode([
                'title' => $notification->title,
                'body' => $notification->body,
                'url' => $notification->link,
                'tag' => 'test-'.$notification->id,
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

            $success = 0;
            $failed = 0;
            $expired = 0;

            foreach ($webPush->flush() as $report) {
                $endpoint = $report->getRequest()->getUri()->__toString();
                $shortEndpoint = substr($endpoint, 0, 60).'…';

                if ($report->isSuccess()) {
                    $this->info("   ✅ Delivered → {$shortEndpoint}");
                    $success++;
                } elseif ($report->isSubscriptionExpired()) {
                    $this->warn("   ⏰ Expired → {$shortEndpoint}");
                    PushSubscription::query()->where('endpoint', $endpoint)->delete();
                    $expired++;
                } else {
                    $reason = $report->getReason();
                    $statusCode = $report->getResponse()?->getStatusCode() ?? 'N/A';
                    $this->error("   ❌ Failed ({$statusCode}) → {$shortEndpoint}");
                    $this->line("      Reason: {$reason}");
                    $failed++;
                }
            }

            $this->newLine();
            $this->info("=== Results: {$success} delivered, {$failed} failed, {$expired} expired ===");

            if ($expired > 0) {
                $this->warn("Cleaned up {$expired} expired subscription(s).");
            }

            return $success > 0 ? self::SUCCESS : self::FAILURE;
        } catch (\Throwable $e) {
            $this->error('❌ Push sending failed: '.$e->getMessage());
            $this->line($e->getTraceAsString());

            return self::FAILURE;
        }
    }
}
