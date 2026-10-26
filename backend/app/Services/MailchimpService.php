<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Lightweight Mailchimp Marketing API client (v3).
 *
 * Uses Laravel's HTTP client directly — no SDK needed.
 *
 * Required config (set in .env):
 *   MAILCHIMP_API_KEY   – API key from Mailchimp account → Extras → API keys
 *   MAILCHIMP_LIST_ID   – Audience / list ID from Audience → Settings → Audience name and defaults
 */
class MailchimpService
{
    private string $apiKey;

    private string $listId;

    private string $baseUrl;

    public function __construct()
    {
        $this->apiKey = config('services.mailchimp.api_key', '');
        $this->listId = config('services.mailchimp.list_id', '');

        // Mailchimp API key ends with `-usXX` where XX is the data center
        $dc = str_contains($this->apiKey, '-')
            ? substr($this->apiKey, strrpos($this->apiKey, '-') + 1)
            : 'us1';

        $this->baseUrl = "https://{$dc}.api.mailchimp.com/3.0";
    }

    /**
     * Returns true when both API key and list ID are configured.
     */
    public function isConfigured(): bool
    {
        return $this->apiKey !== '' && $this->listId !== '';
    }

    /**
     * Add or update a subscriber in the configured audience.
     *
     * Uses PUT with subscriber hash so re-subscribes are idempotent.
     *
     * @param  array<string, string>  $mergeFields  Optional merge fields (FNAME, LNAME, etc.)
     */
    public function subscribe(string $email, array $mergeFields = []): bool
    {
        if (! $this->isConfigured()) {
            Log::warning('Mailchimp: API key or list ID not configured — skipping.');

            return false;
        }

        $subscriberHash = md5(strtolower($email));

        $payload = [
            'email_address' => strtolower($email),
            'status_if_new' => 'subscribed',
            'status' => 'subscribed',
        ];

        if ($mergeFields !== []) {
            $payload['merge_fields'] = $mergeFields;
        }

        try {
            $response = Http::withBasicAuth('anystring', $this->apiKey)
                ->timeout(10)
                ->put("{$this->baseUrl}/lists/{$this->listId}/members/{$subscriberHash}", $payload);

            if ($response->successful()) {
                return true;
            }

            Log::error('Mailchimp: Failed to subscribe', [
                'email' => $email,
                'status' => $response->status(),
                'body' => $response->json(),
            ]);

            return false;
        } catch (ConnectionException $e) {
            Log::error('Mailchimp: Connection error', [
                'email' => $email,
                'message' => $e->getMessage(),
            ]);

            return false;
        }
    }
}
