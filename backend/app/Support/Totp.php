<?php

namespace App\Support;

/**
 * Pure-PHP TOTP (RFC 6238) implementation — no third-party packages required.
 *
 * Generates 6-digit codes that rotate every 30 seconds, compatible with
 * Google Authenticator, Authy, 1Password, and similar apps.
 */
final class Totp
{
    private const DIGITS = 6;

    private const PERIOD = 30;

    private const WINDOW = 1;  // ± 1 step tolerance (30 s each side)

    /**
     * Generate a random Base32-encoded secret (160-bit, 32 chars).
     */
    public static function generateSecret(int $length = 32): string
    {
        $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $secret = '';
        for ($i = 0; $i < $length; $i++) {
            $secret .= $chars[random_int(0, 31)];
        }

        return $secret;
    }

    /**
     * Build the `otpauth://` URI that authenticator apps understand.
     */
    public static function uri(string $secret, string $email, ?string $issuer = null): string
    {
        $issuer ??= (string) config('app.name', 'Laravel');
        $label = rawurlencode($issuer).':'.rawurlencode($email);

        return 'otpauth://totp/'.$label.'?'.http_build_query([
            'secret' => $secret,
            'issuer' => $issuer,
            'algorithm' => 'SHA1',
            'digits' => self::DIGITS,
            'period' => self::PERIOD,
        ]);
    }

    /**
     * Verify a user-supplied code against a secret.
     */
    public static function verify(string $secret, string $code): bool
    {
        if (! preg_match('/^\d{'.self::DIGITS.'}$/', $code)) {
            return false;
        }

        $decoded = self::base32Decode($secret);
        $timestamp = (int) floor(time() / self::PERIOD);

        for ($i = -self::WINDOW; $i <= self::WINDOW; $i++) {
            if (hash_equals(self::generate($decoded, $timestamp + $i), $code)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Compute a single TOTP code for a given counter.
     */
    private static function generate(string $decodedSecret, int $counter): string
    {
        $time = pack('N*', 0, $counter);
        $hash = hash_hmac('sha1', $time, $decodedSecret, true);

        $offset = ord($hash[19]) & 0x0F;
        $binary = ((ord($hash[$offset]) & 0x7F) << 24)
            | ((ord($hash[$offset + 1]) & 0xFF) << 16)
            | ((ord($hash[$offset + 2]) & 0xFF) << 8)
            | (ord($hash[$offset + 3]) & 0xFF);

        return str_pad((string) ($binary % (10 ** self::DIGITS)), self::DIGITS, '0', STR_PAD_LEFT);
    }

    /**
     * Decode a Base32-encoded string into raw bytes.
     */
    private static function base32Decode(string $input): string
    {
        $map = array_flip(str_split('ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'));
        $input = strtoupper(rtrim($input, '='));
        $buffer = 0;
        $bitsLeft = 0;
        $output = '';

        foreach (str_split($input) as $char) {
            if (! isset($map[$char])) {
                continue;
            }
            $buffer = ($buffer << 5) | $map[$char];
            $bitsLeft += 5;
            if ($bitsLeft >= 8) {
                $bitsLeft -= 8;
                $output .= chr(($buffer >> $bitsLeft) & 0xFF);
            }
        }

        return $output;
    }
}
