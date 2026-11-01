<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_notifications', function (Blueprint $table): void {
            $table->id();
            $table->string('type', 50)->index();            // new_order, new_message
            $table->string('title');
            $table->string('body');
            $table->string('link')->default('');             // e.g. /orders/GW-261101-ABCDE
            $table->unsignedBigInteger('reference_id')->nullable(); // order.id or contact_message.id
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['read_at', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_notifications');
    }
};
