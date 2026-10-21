<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('home_sections', function (Blueprint $table) {
            $table->string('subtitle', 500)->nullable()->after('title');
            $table->string('button_text', 100)->nullable()->after('subtitle');
            $table->string('button_link', 255)->nullable()->after('button_text');
            $table->string('image', 255)->nullable()->after('button_link');
        });
    }

    public function down(): void
    {
        Schema::table('home_sections', function (Blueprint $table) {
            $table->dropColumn(['subtitle', 'button_text', 'button_link', 'image']);
        });
    }
};
