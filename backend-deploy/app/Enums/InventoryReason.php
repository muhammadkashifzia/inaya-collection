<?php

namespace App\Enums;

enum InventoryReason: string
{
    case InitialStock = 'initial_stock';
    case Restock = 'restock';
    case Correction = 'correction';
    case Damaged = 'damaged';
    case Sale = 'sale';
    case OrderCancelled = 'order_cancelled';
    case Return = 'return';

    /**
     * Reasons an administrator may pick for a manual adjustment.
     *
     * @return list<self>
     */
    public static function manual(): array
    {
        return [self::Restock, self::Correction, self::Damaged, self::Return];
    }
}
