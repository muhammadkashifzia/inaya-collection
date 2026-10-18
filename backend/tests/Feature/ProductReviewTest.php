<?php

namespace Tests\Feature;

use App\Enums\ReviewStatus;
use App\Models\Product;
use App\Models\ProductReview;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductReviewTest extends TestCase
{
    use RefreshDatabase;

    public function test_visitor_review_is_pending_until_approved(): void
    {
        $product = Product::factory()->create();

        $this->postJson("/api/v1/products/{$product->slug}/reviews", [
            'name' => 'Sana', 'email' => 'sana@example.com', 'rating' => 5, 'title' => 'Lovely', 'body' => 'Soft fabric and great colour.',
        ])->assertCreated();

        $this->assertDatabaseHas('product_reviews', ['product_id' => $product->id, 'status' => 'pending', 'rating' => 5]);
        $this->getJson("/api/v1/products/{$product->slug}/reviews")
            ->assertOk()
            ->assertJsonCount(0, 'data')
            ->assertJsonPath('summary.count', 0);
    }

    public function test_review_submission_is_validated(): void
    {
        $product = Product::factory()->create();

        $this->postJson("/api/v1/products/{$product->slug}/reviews", ['name' => '', 'rating' => 7, 'body' => 'short'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'email', 'rating', 'body']);

        $this->postJson("/api/v1/products/{$product->slug}/reviews", [
            'name' => 'Bot', 'email' => 'bot@example.com', 'rating' => 5, 'body' => 'Buy cheap stuff here now', 'website' => 'spam',
        ])->assertUnprocessable();

        $this->assertDatabaseCount('product_reviews', 0);
    }

    public function test_public_list_shows_only_approved_reviews_with_summary(): void
    {
        $product = Product::factory()->create();
        ProductReview::factory()->for($product)->approved()->create(['rating' => 5]);
        ProductReview::factory()->for($product)->approved()->create(['rating' => 4]);
        ProductReview::factory()->for($product)->create(['rating' => 1]);
        ProductReview::factory()->for($product)->rejected()->create(['rating' => 1]);

        $this->getJson("/api/v1/products/{$product->slug}/reviews")
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonMissingPath('data.0.email')
            ->assertJsonPath('summary.count', 2)
            ->assertJsonPath('summary.average', 4.5)
            ->assertJsonPath('summary.distribution.5', 1)
            ->assertJsonPath('summary.distribution.1', 0);
    }

    public function test_admin_can_moderate_add_and_delete_reviews(): void
    {
        $admin = User::factory()->admin()->create();
        $product = Product::factory()->create();
        $pending = ProductReview::factory()->for($product)->create();
        ProductReview::factory()->for($product)->approved()->create();

        $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/reviews?status=pending')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.email', $pending->email)
            ->assertJsonPath('data.0.product.id', $product->id)
            ->assertJsonPath('counts.pending', 1)
            ->assertJsonPath('counts.approved', 1);

        $this->actingAs($admin, 'sanctum')->putJson("/api/v1/admin/reviews/{$pending->id}", ['status' => 'approved'])
            ->assertOk()
            ->assertJsonPath('status', 'approved');
        $this->assertSame(ReviewStatus::Approved, $pending->fresh()->status);

        $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/reviews', [
            'product_id' => $product->id, 'name' => 'Walk-in customer', 'rating' => 4, 'body' => 'Bought from the shop.',
        ])->assertCreated()->assertJsonPath('status', 'approved');

        $this->actingAs($admin, 'sanctum')->deleteJson("/api/v1/admin/reviews/{$pending->id}")->assertNoContent();
        $this->assertModelMissing($pending);
    }

    public function test_customers_cannot_access_admin_reviews(): void
    {
        $this->actingAs(User::factory()->create(), 'sanctum')->getJson('/api/v1/admin/reviews')->assertForbidden();
    }
}
