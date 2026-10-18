<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ContactMessageResource;
use App\Models\ContactMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Log;

/**
 * Admin inbox for storefront contact form submissions.
 */
class ContactMessageController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'in:read,unread'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $messages = ContactMessage::query()
            ->when($filters['q'] ?? null, function ($query, string $q): void {
                $term = '%'.str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $q).'%';
                $query->where(fn ($w) => $w->where('name', 'like', $term)
                    ->orWhere('email', 'like', $term)
                    ->orWhere('phone', 'like', $term)
                    ->orWhere('subject', 'like', $term)
                    ->orWhere('message', 'like', $term));
            })
            ->when(($filters['status'] ?? null) === 'read', fn ($q) => $q->whereNotNull('read_at'))
            ->when(($filters['status'] ?? null) === 'unread', fn ($q) => $q->whereNull('read_at'))
            ->latest()
            ->latest('id')
            ->paginate($filters['per_page'] ?? 20)
            ->withQueryString();

        return ContactMessageResource::collection($messages)->additional([
            'unread_count' => ContactMessage::query()->whereNull('read_at')->count(),
        ]);
    }

    /**
     * Opening a message marks it as read.
     */
    public function show(ContactMessage $contactMessage): ContactMessageResource
    {
        if (! $contactMessage->isRead()) {
            $contactMessage->forceFill(['read_at' => now()])->save();
        }

        return new ContactMessageResource($contactMessage);
    }

    public function updateStatus(Request $request, ContactMessage $contactMessage): ContactMessageResource
    {
        $validated = $request->validate(['is_read' => ['required', 'boolean']]);

        $contactMessage->forceFill(['read_at' => $validated['is_read'] ? ($contactMessage->read_at ?? now()) : null])->save();

        return new ContactMessageResource($contactMessage);
    }

    public function destroy(Request $request, ContactMessage $contactMessage): JsonResponse
    {
        $contactMessage->delete();

        Log::info('Contact message deleted', ['contact_message_id' => $contactMessage->id, 'admin_id' => $request->user()->id]);

        return response()->json(null, 204);
    }
}
