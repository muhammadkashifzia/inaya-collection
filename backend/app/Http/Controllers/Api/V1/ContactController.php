<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Mail\ContactMessageMail;
use App\Models\ContactMessage;
use App\Services\SettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Throwable;

/**
 * Storefront "Contact Us" form. Stores the message for the admin inbox and
 * notifies the store email. A mail failure never fails the submission.
 */
class ContactController extends Controller
{
    public function __invoke(Request $request, SettingsService $settings): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'email' => ['required', 'email:rfc', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30', 'regex:/^[0-9+\-\s()]{7,30}$/'],
            'subject' => ['nullable', 'string', 'max:200'],
            'message' => ['required', 'string', 'min:10', 'max:5000'],
            // Honeypot: real visitors never see or fill this field.
            'website' => ['nullable', 'string', 'max:0'],
        ], [
            'phone.regex' => 'Please enter a valid phone number.',
            'website.max' => 'Your message could not be sent.',
        ]);

        $contactMessage = ContactMessage::query()->create([
            'user_id' => $request->user('sanctum')?->id,
            'name' => trim($validated['name']),
            'email' => strtolower(trim($validated['email'])),
            'phone' => filled($validated['phone'] ?? null) ? trim($validated['phone']) : null,
            'subject' => filled($validated['subject'] ?? null) ? trim($validated['subject']) : null,
            'message' => trim($validated['message']),
            'ip_address' => $request->ip(),
            'user_agent' => Str::limit((string) $request->userAgent(), 490, ''),
        ]);

        $storeEmail = $settings->get('store.email');
        if (filled($storeEmail) && filter_var($storeEmail, FILTER_VALIDATE_EMAIL)) {
            try {
                Mail::to($storeEmail)->send(new ContactMessageMail($contactMessage, (string) $settings->get('store.name', config('app.name'))));
            } catch (Throwable $e) {
                report($e);
            }
        }

        return response()->json(['message' => 'Thanks for reaching out. We will get back to you soon.'], 201);
    }
}
