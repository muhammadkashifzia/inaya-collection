<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Cards for the "image_banners" section type: [{image, title, subtitle, href}].
     */
    public function up(): void
    {
        Schema::table('home_sections', function (Blueprint $table) {
            $table->json('items')->nullable()->after('product_limit');
        });
    }

    public function down(): void
    {
        Schema::table('home_sections', function (Blueprint $table) {
            $table->dropColumn('items');
        });
    }
};
