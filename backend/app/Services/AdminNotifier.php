<?php

namespace App\Services;

use App\Models\AdminNotification;
use App\Models\ContactMessage;
use App\Models\Order;
use Illuminate\Support\Facades\Log;

/**
 * Creates admin notifications when events occur (new order, new message).
 */
class AdminNotifier
{
    public function orderPlaced(Order $order): AdminNotification
    {
        $notification = AdminNotification::query()->create([
            'type' => 'new_order',
            'title' => 'New order received',
            'body' => "Order {$order->number} — Rs. " . number_format($order->grand_total / 100) . " from {$order->customer_name}",
            'link' => "/orders/{$order->number}",
            'reference_id' => $order->id,
        ]);

        Log::info('Admin notification: new order', ['order' => $order->number, 'notification_id' => $notification->id]);

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

        return $notification;
    }
}
