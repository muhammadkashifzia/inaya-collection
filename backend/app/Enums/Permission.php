<?php

namespace App\Enums;

/**
 * Admin-panel abilities. Each case is registered as a Gate in AppServiceProvider.
 */
enum Permission: string
{
    case ViewDashboard = 'view-dashboard';
    case ManageProducts = 'manage-products';
    case ManageCategories = 'manage-categories';
    case ManageDesignCategories = 'manage-design-categories';
    case ManageOrders = 'manage-orders';
    case RefundOrders = 'refund-orders';
    case ManageInventory = 'manage-inventory';
    case ViewCustomers = 'view-customers';
    case ManageCustomers = 'manage-customers';
    case ManageCoupons = 'manage-coupons';
    case ManageContent = 'manage-content';
    case ManageMessages = 'manage-messages';
    case ManageSettings = 'manage-settings';
}
