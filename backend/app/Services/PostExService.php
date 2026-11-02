<?php

namespace App\Services;

use App\Models\Order;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * PostEx courier API client.
 *
 * @see https://api.postex.pk — Merchant Order Integration API
 */
class PostExService
{
    private string $baseUrl;

    private string $apiKey;

    private ?string $pickupAddressCode;

    public function __construct()
    {
        $this->baseUrl = rtrim((string) config('services.postex.base_url'), '/');
        $this->apiKey = (string) config('services.postex.api_key');
        $this->pickupAddressCode = config('services.postex.pickup_address_code');
    }

    /**
     * Book a COD shipment with PostEx.
     *
     * @return array{orderId: string, trackingNumber: string}
     *
     * @throws RuntimeException on API or network failure
     */
    public function createOrder(Order $order): array
    {
        $this->ensureConfigured();

        $address = $order->shipping_address ?? [];
        $city = $address['city'] ?? '';
        $addressLine = collect([
            $address['address'] ?? $address['address_line_1'] ?? '',
            $address['address_line_2'] ?? '',
            $address['area'] ?? '',
        ])->filter()->implode(', ');

        $items = $order->items()->get();
        $itemCount = $items->sum('quantity');
        $orderDetail = $items
            ->map(fn ($item): string => "{$item->name} (x{$item->quantity})")
            ->implode(', ');

        // grand_total is stored in minor units (paisa); PostEx expects major units (rupees).
        $codAmount = $order->grand_total / 100;

        $payload = [
            'cityName' => $city,
            'customerName' => $order->customer_name,
            'customerPhone' => $order->phone,
            'deliveryAddress' => $addressLine ?: $city,
            'invoiceDivision' => 0,
            'invoicePayment' => (string) $codAmount,
            'items' => (string) $itemCount,
            'orderDetail' => mb_substr($orderDetail, 0, 500),
            'orderRefNumber' => $order->number,
            'orderType' => 'Normal',
            'pickupAddressCode' => $this->pickupAddressCode ?? '',
            'transactionNotes' => $order->customer_note ?? '',
        ];

        try {
            $response = Http::timeout(30)
                ->withHeaders(['token' => $this->apiKey])
                ->post("{$this->baseUrl}/v3/create-order", $payload);

            $body = $response->json();

            if (! $response->successful() || ($body['statusCode'] ?? null) !== '200') {
                $message = $body['statusMessage'] ?? $body['message'] ?? 'Unknown PostEx error';
                Log::error('PostEx create-order failed', ['order' => $order->number, 'response' => $body]);

                throw new RuntimeException("PostEx: {$message}");
            }

            $dist = $body['dist'] ?? [];
            $trackingNumber = $dist['trackingNumber'] ?? $dist['tracking_number'] ?? '';
            $orderId = (string) ($dist['postExOrderId'] ?? $dist['orderId'] ?? '');

            Log::info('PostEx order created', [
                'order' => $order->number,
                'postex_order_id' => $orderId,
                'tracking_number' => $trackingNumber,
            ]);

            return [
                'orderId' => $orderId,
                'trackingNumber' => $trackingNumber,
            ];
        } catch (ConnectionException $e) {
            Log::error('PostEx connection failed', ['order' => $order->number, 'error' => $e->getMessage()]);

            throw new RuntimeException('Could not reach PostEx. Please try again.');
        } catch (RequestException $e) {
            Log::error('PostEx request failed', ['order' => $order->number, 'error' => $e->getMessage()]);

            throw new RuntimeException('PostEx request failed. Please try again.');
        }
    }

    /**
     * Track a shipment by its PostEx tracking number.
     *
     * @return array<string, mixed>
     */
    public function trackOrder(string $trackingNumber): array
    {
        $this->ensureConfigured();

        $response = Http::timeout(15)
            ->withHeaders(['token' => $this->apiKey])
            ->get("{$this->baseUrl}/v1/track-order/{$trackingNumber}");

        return $response->json() ?? [];
    }

    /**
     * Fetch the list of operational cities PostEx delivers to.
     *
     * @return list<array{operationalCityName: string}>
     */
    public function getOperationalCities(): array
    {
        $this->ensureConfigured();

        $response = Http::timeout(15)
            ->withHeaders(['token' => $this->apiKey])
            ->get("{$this->baseUrl}/../../../v2/get-operational-city");

        $body = $response->json();

        return $body['dist'] ?? [];
    }

    /**
     * Fetch the merchant's registered pickup addresses.
     *
     * @return list<array<string, mixed>>
     */
    public function getPickupAddresses(): array
    {
        $this->ensureConfigured();

        $response = Http::timeout(15)
            ->withHeaders(['token' => $this->apiKey])
            ->get("{$this->baseUrl}/../../../v1/get-merchant-address");

        $body = $response->json();

        return $body['dist'] ?? [];
    }

    /**
     * Cancel a booked PostEx order.
     */
    public function cancelOrder(string $trackingNumber): bool
    {
        $this->ensureConfigured();

        try {
            $response = Http::timeout(15)
                ->withHeaders(['token' => $this->apiKey])
                ->post("{$this->baseUrl}/v1/cancel-order/{$trackingNumber}");

            $body = $response->json();

            return ($body['statusCode'] ?? null) === '200';
        } catch (ConnectionException) {
            return false;
        }
    }

    private function ensureConfigured(): void
    {
        if (blank($this->apiKey)) {
            throw new RuntimeException('PostEx API key is not configured. Set POSTEX_API_KEY in your .env file.');
        }
    }
}
