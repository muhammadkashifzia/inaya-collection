<?php

namespace App\Support;

/**
 * Converts between stored minor units (paisa) and API major units (rupees).
 */
final class Money
{
    public static function toMajor(?int $minor): ?float
    {
        return $minor === null ? null : round($minor / 100, 2);
    }

    public static function toMinor(int|float|string|null $major): ?int
    {
        if ($major === null || $major === '') {
            return null;
        }

        return (int) bcmul(number_format((float) $major, 2, '.', ''), '100', 0);
    }
}
