<?php

namespace Database\Seeders;

use App\Enums\BannerPlacement;
use App\Enums\HomeSectionType;
use App\Models\Banner;
use App\Models\CmsPage;
use App\Models\HomeSection;
use App\Services\SettingsService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

/**
 * Store settings, banners, homepage sections and CMS pages, imported from
 * database/seeders/data when available.
 */
class StoreContentSeeder extends Seeder
{
    public function run(SettingsService $settings): void
    {
        $dataDir = database_path('seeders/data');
        $site = File::exists("{$dataDir}/site.json") ? json_decode(File::get("{$dataDir}/site.json"), true) : null;

        if ($site !== null) {
            $settings->update([
                'store' => [
                    ...SettingsService::defaults()['store'],
                    'name' => $site['name'],
                    'tagline' => $site['tagline'],
                    'about' => $site['footer']['about'],
                    'email' => $site['footer']['contact']['email'],
                    'phone' => $site['footer']['contact']['phone'],
                    'hours' => $site['footer']['contact']['hours'],
                ],
                'announcements' => $site['announcements'],
                'navigation' => $site['navigation'],
                'trust' => $site['trust'],
                'social' => $site['footer']['social'],
                'footer' => [
                    'columns' => $site['footer']['columns'],
                    'copyright' => $site['footer']['copyright'],
                ],
                'shipping' => [
                    'free_shipping_threshold' => (int) $site['freeShippingThreshold'] * 100,
                    'methods' => [
                        ['code' => 'standard', 'name' => 'Standard Delivery (3–5 working days)', 'fee' => (int) $site['shippingFee'] * 100, 'is_active' => true],
                        ['code' => 'express', 'name' => 'Express Delivery (1–2 working days)', 'fee' => 50000, 'is_active' => true],
                    ],
                ],
            ]);

            $hero = $site['hero'];
            Banner::query()->updateOrCreate(
                ['placement' => BannerPlacement::Hero, 'title' => $hero['heading']],
                [
                    'subtitle' => $hero['subheading'],
                    'image' => $this->copySeedImage(source: database_path("seeders/data{$hero['image']}"), target: 'seed/hero/hero-1.svg'),
                    'mobile_image' => $this->copySeedImage(source: database_path("seeders/data{$hero['mobileImage']}"), target: 'seed/hero/hero-2.svg'),
                    'buttons' => $hero['ctas'],
                    'sort_order' => 0,
                    'is_active' => true,
                ],
            );

            $sections = $site['sections'];
            $homeSections = [
                [HomeSectionType::CategoryGrid, $sections['collections'], 4],
                [HomeSectionType::CategoryTabs, $sections['collectionTabs'], 4],
                [HomeSectionType::Reviews, $sections['reviews'], 12],
            ];
            foreach ($homeSections as $order => [$type, $title, $limit]) {
                HomeSection::query()->updateOrCreate(['type' => $type], [
                    'title' => $title, 'product_limit' => $limit, 'sort_order' => $order, 'is_active' => true,
                ]);
            }
        }

        $pagesFile = "{$dataDir}/pages.json";
        if (File::exists($pagesFile)) {
            foreach (json_decode(File::get($pagesFile), true) as $page) {
                CmsPage::query()->updateOrCreate(['slug' => $page['slug']], [
                    'title' => $page['title'],
                    'sections' => $page['sections'],
                    'is_published' => true,
                ]);
            }
        }

        CmsPage::query()->firstOrCreate(['slug' => 'about-us'], [
            'title' => 'About Us',
            'sections' => [
                ['heading' => null, 'body' => 'Anaya Collection offers quality unstitched fabrics for every season, delivered across Pakistan.'],
            ],
            'is_published' => true,
        ]);
    }

    private function copySeedImage(string $source, string $target): string
    {
        if (File::exists($source) && ! Storage::disk('public')->exists($target)) {
            Storage::disk('public')->put($target, File::get($source));
        }

        return $target;
    }
}
