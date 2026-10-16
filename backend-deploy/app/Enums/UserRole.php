<?php

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Staff = 'staff';
    case Customer = 'customer';

    /**
     * Permissions granted to each role. Admin implicitly has every permission.
     *
     * @return list<Permission>
     */
    public function permissions(): array
    {
        return match ($this) {
            self::Admin => Permission::cases(),
            self::Staff => [
                Permission::ViewDashboard,
                Permission::ManageProducts,
                Permission::ManageCategories,
                Permission::ManageOrders,
                Permission::ManageInventory,
                Permission::ViewCustomers,
            ],
            self::Customer => [],
        };
    }

    public function isStaffMember(): bool
    {
        return $this !== self::Customer;
    }
}
