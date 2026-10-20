<?php

namespace Database\Factories;

use App\Enums\HomeSectionType;
use App\Models\HomeSection;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<HomeSection>
 */
class HomeSectionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'type' => HomeSectionType::Featured,
            'title' => fake()->words(2, true),
            'product_limit' => 8,
            'sort_order' => 0,
            'is_active' => true,
        ];
    }

    /**
     * A row of image cards with overlay text.
     *
     * @param  list<array{image: string, title?: string|null, subtitle?: string|null, href?: string|null}>  $items
     */
    public function imageBanners(array $items = [['image' => 'banners/silk.jpg', 'title' => 'Silk', 'subtitle' => null, 'href' => '/collections/silk']]): static
    {
        return $this->state(fn (): array => ['type' => HomeSectionType::ImageBanners, 'title' => '', 'items' => $items]);
    }
}
