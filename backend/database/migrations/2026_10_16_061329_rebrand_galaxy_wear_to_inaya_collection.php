<?php

use App\Models\StoreSetting;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * One-time rebrand: update every "Galaxy Wear" reference in the database
 * to "Inaya Collection".
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── Store settings (JSON key/value pairs) ──────────────────────
        $replacements = [
            'Galaxy Wear' => 'Inaya Collection',
        ];

        $settings = StoreSetting::all();
        foreach ($settings as $setting) {
            $json = json_encode($setting->value);
            $changed = false;

            foreach ($replacements as $old => $new) {
                if (str_contains($json, $old)) {
                    $json = str_replace($old, $new, $json);
                    $changed = true;
                }
            }

            if ($changed) {
                $setting->value = json_decode($json, true);
                $setting->save();
            }
        }

        // ── Product brand column ───────────────────────────────────────
        DB::table('products')
            ->where('brand', 'Galaxy Wear')
            ->update(['brand' => 'Inaya Collection']);

        // ── CMS pages body text ────────────────────────────────────────
        $pages = DB::table('cms_pages')->get();
        foreach ($pages as $page) {
            $sections = $page->sections;
            if (is_string($sections) && str_contains($sections, 'Galaxy Wear')) {
                DB::table('cms_pages')
                    ->where('id', $page->id)
                    ->update(['sections' => str_replace('Galaxy Wear', 'Inaya Collection', $sections)]);
            }
        }
    }

    public function down(): void
    {
        // Reverse: Inaya Collection -> Galaxy Wear
        $settings = StoreSetting::all();
        foreach ($settings as $setting) {
            $json = json_encode($setting->value);
            if (str_contains($json, 'Inaya Collection')) {
                $setting->value = json_decode(str_replace('Inaya Collection', 'Galaxy Wear', $json), true);
                $setting->save();
            }
        }

        DB::table('products')
            ->where('brand', 'Inaya Collection')
            ->update(['brand' => 'Galaxy Wear']);

        $pages = DB::table('cms_pages')->get();
        foreach ($pages as $page) {
            $sections = $page->sections;
            if (is_string($sections) && str_contains($sections, 'Inaya Collection')) {
                DB::table('cms_pages')
                    ->where('id', $page->id)
                    ->update(['sections' => str_replace('Inaya Collection', 'Galaxy Wear', $sections)]);
            }
        }
    }
};
