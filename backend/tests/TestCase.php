<?php

namespace Tests;

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * Headers that make Sanctum treat the request as coming from the storefront SPA.
     *
     * @return array<string, string>
     */
    protected function spaHeaders(): array
    {
        return ['Accept' => 'application/json', 'Referer' => 'http://localhost:3000/', 'Origin' => 'http://localhost:3000'];
    }

    /**
     * An active product (Rs. 3,299.00) with one default variant.
     */
    protected function variantWithStock(int $stock = 10, int $price = 329900, ?int $salePrice = null): ProductVariant
    {
        $product = Product::factory()->create(['price' => $price, 'sale_price' => $salePrice]);

        return ProductVariant::factory()->for($product)->withStock($stock)->create()->refresh()->load('product');
    }

    /**
     * Valid checkout payload (prices are intentionally absent).
     *
     * @return array<string, mixed>
     */
    protected function checkoutPayload(array $overrides = []): array
    {
        return array_replace_recursive([
            'customer_name' => 'Ayesha Khan',
            'email' => 'ayesha@example.com',
            'phone' => '03001234567',
            'shipping_address' => [
                'full_name' => 'Ayesha Khan',
                'phone' => '03001234567',
                'line1' => 'House 1, Street 2',
                'city' => 'Lahore',
                'province' => 'Punjab',
                'country' => 'PK',
            ],
            'billing_same_as_shipping' => true,
            'shipping_method' => 'standard',
            'payment_method' => 'cod',
        ], $overrides);
    }
}
