<?php

use App\Models\StoreSetting;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Cache;

/**
 * Update trust badges and free shipping threshold to match the new design.
 */
return new class extends Migration
{
    public function up(): void
    {
        StoreSetting::query()->updateOrCreate(['key' => 'trust'], [
            'value' => [
                ['icon' => 'truck', 'title' => 'Free Shipping', 'text' => 'Free shipping on all orders above PKR 12,000'],
                ['icon' => 'shield', 'title' => '2 Days Exchange Policy', 'text' => 'Easy exchange within 2 days'],
                ['icon' => 'lock', 'title' => 'Cash on Delivery', 'text' => 'Order from anywhere and pay at your doorstep'],
                ['icon' => 'user', 'title' => 'Customer Centric Support', 'text' => 'Customer care with satisfaction on priority'],
            ],
        ]);

        // Update free shipping threshold to PKR 12,000 (stored in paisa)
        $shipping = StoreSetting::query()->where('key', 'shipping')->first();
        if ($shipping) {
            $value = $shipping->value;
            $value['free_shipping_threshold'] = 1200000;
            $shipping->value = $value;
            $shipping->save();
        }

        Cache::forget('store_settings.all');
    }

    public function down(): void
    {
        StoreSetting::query()->updateOrCreate(['key' => 'trust'], [
            'value' => [
                ['icon' => 'truck', 'title' => 'Free Shipping', 'text' => 'On all orders above 3500'],
                ['icon' => 'shield', 'title' => '30 Days Warranty', 'text' => '30 days returns & warranty'],
                ['icon' => 'map', 'title' => 'Nationwide Delivery', 'text' => 'Support Pakistani brands'],
                ['icon' => 'lock', 'title' => '100% Secure', 'text' => '100% secure checkout'],
            ],
        ]);

        $shipping = StoreSetting::query()->where('key', 'shipping')->first();
        if ($shipping) {
            $value = $shipping->value;
            $value['free_shipping_threshold'] = 350000;
            $shipping->value = $value;
            $shipping->save();
        }

        Cache::forget('store_settings.all');
    }
};
