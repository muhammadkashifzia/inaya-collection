<?php

namespace App\Console\Commands;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

/**
 * Creates (or with --reset, re-enables and re-keys) an administrator account.
 *
 * Password source, in order: --password option, interactive secret prompt,
 * otherwise a random password that is printed once.
 */
class CreateAdminCommand extends Command
{
    protected $signature = 'app:create-admin
        {email : Admin email address}
        {--name=Store Admin : Display name for a new account}
        {--password= : Password (omit to be prompted, or to generate one when non-interactive)}
        {--reset : Reset the password and admin role if the account already exists}';

    protected $description = 'Create an administrator account, or reset an existing one with --reset';

    public function handle(): int
    {
        $email = strtolower(trim((string) $this->argument('email')));
        $password = (string) ($this->option('password') ?? '');
        $isGeneratedPassword = false;

        if ($password === '' && $this->input->isInteractive()) {
            $password = (string) $this->secret('Password (leave empty to generate one)');
        }

        if ($password === '') {
            $password = Str::password(16, symbols: false);
            $isGeneratedPassword = true;
        }

        $validator = Validator::make(
            ['email' => $email, 'password' => $password],
            [
                'email' => ['required', 'email', 'max:255'],
                'password' => ['required', 'string', 'max:255', Password::min(8)->letters()->numbers()],
            ],
        );

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $message) {
                $this->error($message);
            }

            return self::FAILURE;
        }

        $admin = User::query()->where('email', $email)->first();

        if ($admin !== null && ! $this->option('reset')) {
            $this->error("User {$email} already exists. Re-run with --reset to set a new password.");

            return self::FAILURE;
        }

        $admin ??= new User(['name' => (string) $this->option('name'), 'email' => $email]);
        $admin->password = $password;
        $admin->forceFill([
            'role' => UserRole::Admin,
            'is_active' => true,
            'email_verified_at' => $admin->email_verified_at ?? now(),
            'remember_token' => Str::random(60),
        ])->save();

        $this->info(($admin->wasRecentlyCreated ? 'Created' : 'Reset').' admin user: '.$email);

        if ($isGeneratedPassword) {
            $this->warn("Generated password (shown once): {$password}");
        }

        return self::SUCCESS;
    }
}
