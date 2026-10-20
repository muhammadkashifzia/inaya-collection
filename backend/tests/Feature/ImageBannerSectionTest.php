<?php

namespace Tests\Feature;

use App\Models\HomeSection;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ImageBannerSectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_image_banner_section_and_homepage_shows_it(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/home-sections', [
                'type' => 'image_banners',
                'title' => null,
                'items' => [
                    ['image' => 'banners/silk.jpg', 'title' => 'Silk', 'subtitle' => null, 'href' => '/collections/silk', 'align' => 'left'],
                    ['image' => 'banners/fabric.jpg', 'title' => 'Fabric', 'subtitle' => 'Cambric', 'href' => null],
                ],
                'is_active' => true,
            ])
            ->assertCreated()
            ->assertJsonPath('type', 'image_banners')
            ->assertJsonPath('items.0.image_path', 'banners/silk.jpg')
            ->assertJsonPath('items.1.subtitle', 'Cambric');

        $this->getJson('/api/v1/home')
            ->assertOk()
            ->assertJsonPath('data.sections.0.type', 'image_banners')
            ->assertJsonPath('data.sections.0.title', '')
            ->assertJsonPath('data.sections.0.items.0.title', 'Silk')
            ->assertJsonPath('data.sections.0.items.0.image', Storage::disk('public')->url('banners/silk.jpg'))
            ->assertJsonPath('data.sections.0.items.0.href', '/collections/silk')
            ->assertJsonPath('data.sections.0.items.0.align', 'left')
            ->assertJsonPath('data.sections.0.items.1.align', 'center')
            ->assertJsonPath('data.sections.0.items.1.subtitle', 'Cambric');
    }

    public function test_image_banner_section_needs_cards_and_safe_paths(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/home-sections', ['type' => 'image_banners', 'title' => 'Fabrics'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('items');

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/home-sections', [
                'type' => 'image_banners',
                'items' => [['image' => '../.env', 'href' => 'javascript:alert(1)', 'align' => 'top']],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['items.0.image', 'items.0.href', 'items.0.align']);
    }

    public function test_other_section_types_still_require_a_heading_and_drop_items(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/home-sections', ['type' => 'featured'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('title');

        $section = HomeSection::factory()->imageBanners()->create();

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/v1/admin/home-sections/{$section->id}", ['type' => 'featured', 'title' => 'Featured', 'items' => [['image' => 'banners/x.jpg']]])
            ->assertOk()
            ->assertJsonPath('items', []);

        $this->assertNull($section->refresh()->items);
    }
}
