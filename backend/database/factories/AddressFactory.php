<?php

namespace Database\Factories;

use App\Models\Address;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Address>
 */
class AddressFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'label' => 'Home',
            'full_name' => fake()->name(),
            'phone' => '03'.fake()->numerify('#########'),
            'line1' => fake()->streetAddress(),
            'line2' => null,
            'city' => 'Lahore',
            'province' => 'Punjab',
            'postal_code' => '54000',
            'country' => 'PK',
            'is_default_shipping' => true,
            'is_default_billing' => true,
        ];
    }
}
