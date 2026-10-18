<?php

namespace Database\Factories;

use App\Enums\ReviewStatus;
use App\Models\Product;
use App\Models\ProductReview;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProductReview>
 */
class ProductReviewFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'name' => fake()->name(),
            'email' => fake()->safeEmail(),
            'rating' => fake()->numberBetween(1, 5),
            'title' => fake()->optional()->sentence(4),
            'body' => fake()->paragraph(),
            'status' => ReviewStatus::Pending,
            'is_verified_buyer' => false,
        ];
    }

    public function approved(): static
    {
        return $this->state(fn (): array => ['status' => ReviewStatus::Approved]);
    }

    public function rejected(): static
    {
        return $this->state(fn (): array => ['status' => ReviewStatus::Rejected]);
    }
}
