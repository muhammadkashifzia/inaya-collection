<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shipments', function (Blueprint $table): void {
            $table->string('postex_order_id', 50)->nullable()->after('tracking_url');
            $table->string('postex_tracking_number', 100)->nullable()->after('postex_order_id');
        });
    }

    public function down(): void
    {
        Schema::table('shipments', function (Blueprint $table): void {
            $table->dropColumn(['postex_order_id', 'postex_tracking_number']);
        });
    }
};
