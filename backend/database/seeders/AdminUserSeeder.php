<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Creates the first administrator from ADMIN_EMAIL / ADMIN_PASSWORD.
 * If no password is configured, a random one is generated and printed once.
 */
class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $email = strtolower((string) env('ADMIN_EMAIL', 'admin@inayacollection.local'));

        if (User::query()->where('email', $email)->exists()) {
            $this->command?->info("Admin {$email} already exists; skipping.");

            return;
        }

        $password = (string) env('ADMIN_PASSWORD', '');
        $generated = $password === '';
        if ($generated) {
            $password = Str::password(16, symbols: false);
        }

        $admin = User::query()->create([
            'name' => 'Store Admin',
            'email' => $email,
            'password' => $password,
        ]);
        $admin->forceFill(['role' => UserRole::Admin, 'is_active' => true, 'email_verified_at' => now()])->save();

        $this->command?->info("Admin user: {$email}");
        if ($generated) {
            $this->command?->warn("Generated admin password (shown once): {$password}");
        }
    }
}
