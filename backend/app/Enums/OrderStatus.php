<?php

namespace App\Enums;

enum OrderStatus: string
{
    case Pending = 'pending';
    case Confirmed = 'confirmed';
    case Processing = 'processing';
    case Shipped = 'shipped';
    case OutForDelivery = 'out_for_delivery';
    case Delivered = 'delivered';
    case Cancelled = 'cancelled';
    case Refunded = 'refunded';

    /**
     * Statuses this status may move to.
     *
     * @return list<self>
     */
    public function allowedTransitions(): array
    {
        return match ($this) {
            self::Pending => [self::Confirmed, self::Cancelled],
            self::Confirmed => [self::Processing, self::Cancelled],
            self::Processing => [self::Shipped, self::Cancelled],
            self::Shipped => [self::OutForDelivery, self::Delivered],
            self::OutForDelivery => [self::Delivered],
            self::Delivered => [self::Refunded],
            self::Cancelled, self::Refunded => [],
        };
    }

    public function canTransitionTo(self $next): bool
    {
        return in_array($next, $this->allowedTransitions(), true);
    }

    /**
     * Whether stock should be returned to inventory when entering this status.
     */
    public function restoresStock(): bool
    {
        return in_array($this, [self::Cancelled, self::Refunded], true);
    }

    /**
     * Statuses counted as revenue on the dashboard.
     *
     * @return list<self>
     */
    public static function revenueStatuses(): array
    {
        return [self::Confirmed, self::Processing, self::Shipped, self::OutForDelivery, self::Delivered];
    }

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::Confirmed => 'Confirmed',
            self::Processing => 'Processing',
            self::Shipped => 'Shipped',
            self::OutForDelivery => 'Out for Delivery',
            self::Delivered => 'Delivered',
            self::Cancelled => 'Cancelled',
            self::Refunded => 'Refunded',
        };
    }

    /**
     * Whether the customer receives an email when the order enters this status.
     */
    public function notifiesCustomer(): bool
    {
        return in_array($this, [self::Processing, self::Shipped, self::OutForDelivery, self::Delivered], true);
    }

    public function isCancellableByCustomer(): bool
    {
        return $this === self::Pending;
    }
}
