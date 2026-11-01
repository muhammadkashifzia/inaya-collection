<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminNotificationController extends Controller
{
    /**
     * Recent notifications for the header dropdown.
     */
    public function index(Request $request): JsonResponse
    {
        $notifications = AdminNotification::query()
            ->latest()
            ->limit(20)
            ->get();

        return response()->json([
            'data' => $notifications,
            'counts' => $this->counts(),
        ]);
    }

    /**
     * Unread counts for the bell badge and sidebar dots.
     */
    public function counts(): array
    {
        return [
            'total_unread' => AdminNotification::unread()->count(),
            'unread_orders' => AdminNotification::unread()->where('type', 'new_order')->count(),
            'unread_messages' => AdminNotification::unread()->where('type', 'new_message')->count(),
        ];
    }

    public function countsEndpoint(): JsonResponse
    {
        return response()->json($this->counts());
    }

    /**
     * Mark a single notification as read.
     */
    public function markRead(AdminNotification $adminNotification): JsonResponse
    {
        if (! $adminNotification->isRead()) {
            $adminNotification->forceFill(['read_at' => now()])->save();
        }

        return response()->json(['success' => true]);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllRead(): JsonResponse
    {
        AdminNotification::unread()->update(['read_at' => now()]);

        return response()->json(['success' => true]);
    }

    /**
     * Mark all notifications of a specific type as read.
     */
    public function markTypeRead(Request $request): JsonResponse
    {
        $validated = $request->validate(['type' => ['required', 'string', 'in:new_order,new_message']]);

        AdminNotification::unread()->where('type', $validated['type'])->update(['read_at' => now()]);

        return response()->json(['success' => true]);
    }
}
