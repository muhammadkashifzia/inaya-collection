<?php

namespace App\Console\Commands;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

/**
 * Provisions a super-admin account from the CLI.
 *
 * Usage:
 *   php artisan admin:create admin@example.com "Full Name"
 *   php artisan admin:create admin@example.com "Full Name" --password=secret123
 */
class CreateSuperAdmin extends Command
{
    protected $signature = 'admin:create
                            {email : Email address for the admin account}
                            {name : Full name for the admin account}
                            {--password= : Password (generated if omitted)}';

    protected $description = 'Create a new super-admin account (admin role)';

    public function handle(): int
    {
        $email = strtolower(trim((string) $this->argument('email')));
        $name = trim((string) $this->argument('name'));

        if (User::query()->where('email', $email)->exists()) {
            $this->error("A user with email {$email} already exists.");

            return self::FAILURE;
        }

        $password = (string) $this->option('password');
        $generated = $password === '';
        if ($generated) {
            $password = Str::password(16, symbols: false);
        }

        $admin = User::query()->create([
            'name' => $name,
            'email' => $email,
            'password' => $password,
        ]);
        $admin->forceFill([
            'role' => UserRole::Admin,
            'is_active' => true,
            'email_verified_at' => now(),
        ])->save();

        $this->info("Super admin created: {$email}");
        if ($generated) {
            $this->warn("Generated password (shown once): {$password}");
        }

        return self::SUCCESS;
    }
}
