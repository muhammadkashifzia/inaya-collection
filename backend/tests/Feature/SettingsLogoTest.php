<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SettingsLogoTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_upload_logo_and_storefront_receives_its_url(): void
    {
        Storage::fake('public');
        $admin = User::factory()->admin()->create();

        $upload = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/settings/logo', ['image' => UploadedFile::fake()->image('logo.png', 400, 160)])
            ->assertCreated()
            ->assertJsonStructure(['path', 'url']);

        $path = $upload->json('path');
        Storage::disk('public')->assertExists($path);

        $store = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/settings')->json('data.store');
        $store['logo'] = $path;
        $store['logo_type'] = 'image';

        $this->actingAs($admin, 'sanctum')->putJson('/api/v1/admin/settings', ['store' => $store])->assertOk();

        $this->getJson('/api/v1/settings')
            ->assertOk()
            ->assertJsonPath('data.store.logo', $path)
            ->assertJsonPath('data.store.logo_type', 'image')
            ->assertJsonPath('data.store.logo_url', Storage::disk('public')->url($path));
    }

    public function test_text_logo_mode_can_be_saved(): void
    {
        $admin = User::factory()->admin()->create();
        $store = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/settings')->json('data.store');

        $this->assertNull($store['logo_url']);

        $store['logo_type'] = 'text';
        $this->actingAs($admin, 'sanctum')->putJson('/api/v1/admin/settings', ['store' => $store])
            ->assertOk()
            ->assertJsonPath('data.store.logo_type', 'text');
    }

    public function test_logo_upload_rejects_svg_and_staff(): void
    {
        Storage::fake('public');
        $admin = User::factory()->admin()->create();
        $staff = User::factory()->staff()->create();
        $svg = UploadedFile::fake()->createWithContent('logo.svg', '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');

        $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/settings/logo', ['image' => $svg])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('image');

        $this->actingAs($staff, 'sanctum')
            ->postJson('/api/v1/admin/settings/logo', ['image' => UploadedFile::fake()->image('logo.png')])
            ->assertForbidden();
    }

    public function test_logo_path_must_point_inside_the_logos_folder(): void
    {
        $admin = User::factory()->admin()->create();
        $store = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/settings')->json('data.store');
        $store['logo'] = '../.env';

        $this->actingAs($admin, 'sanctum')->putJson('/api/v1/admin/settings', ['store' => $store])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('store.logo');
    }
}
