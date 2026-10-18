<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('product_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name', 120);
            $table->string('email')->nullable();
            $table->unsignedTinyInteger('rating');
            $table->string('title', 150)->nullable();
            $table->text('body');
            $table->string('status', 20)->default('pending');
            $table->boolean('is_verified_buyer')->default(false);
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();
            $table->index(['product_id', 'status']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_reviews');
    }
};
