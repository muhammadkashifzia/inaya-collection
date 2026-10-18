<?php

namespace Database\Factories;

use App\Models\ContactMessage;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ContactMessage>
 */
class ContactMessageFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'phone' => fake()->optional()->numerify('03#########'),
            'subject' => fake()->optional()->sentence(4),
            'message' => fake()->paragraph(),
            'read_at' => null,
            'ip_address' => fake()->ipv4(),
        ];
    }

    public function read(): static
    {
        return $this->state(fn (): array => ['read_at' => now()]);
    }
}
