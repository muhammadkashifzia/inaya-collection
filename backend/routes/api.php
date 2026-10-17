<?php

use App\Enums\Permission;
use App\Http\Controllers\Api\V1\Account\AddressController;
use App\Http\Controllers\Api\V1\Account\OrderController as AccountOrderController;
use App\Http\Controllers\Api\V1\Account\ProfileController;
use App\Http\Controllers\Api\V1\Account\WishlistController;
use App\Http\Controllers\Api\V1\Admin;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CartController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\CheckoutController;
use App\Http\Controllers\Api\V1\HomeController;
use App\Http\Controllers\Api\V1\OrderTrackingController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\StorefrontController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->name('api.v1.')->group(function (): void {

    // ---------------------------------------------------------------- Public
    Route::get('home', HomeController::class)->name('home');
    Route::get('settings', [StorefrontController::class, 'settings'])->name('settings');
    Route::get('banners', [StorefrontController::class, 'banners'])->name('banners');
    Route::get('pages', [StorefrontController::class, 'pages'])->name('pages.index');
    Route::get('pages/{slug}', [StorefrontController::class, 'page'])->name('pages.show');
    Route::post('newsletter', [StorefrontController::class, 'subscribe'])->middleware('throttle:newsletter')->name('newsletter');

    Route::get('categories', [CategoryController::class, 'index'])->name('categories.index');
    Route::get('categories/{slug}', [CategoryController::class, 'show'])->name('categories.show');

    Route::get('products', [ProductController::class, 'index'])->name('products.index');
    Route::get('products/filters', [ProductController::class, 'facets'])->name('products.filters');
    Route::get('products/{slug}', [ProductController::class, 'show'])->name('products.show');

    Route::post('orders/track', OrderTrackingController::class)->middleware('throttle:order-tracking')->name('orders.track');

    // ------------------------------------------------- Cart & checkout (guest or customer)
    Route::prefix('cart')->name('cart.')->group(function (): void {
        Route::get('/', [CartController::class, 'show'])->name('show');
        Route::post('items', [CartController::class, 'addItem'])->name('items.store');
        Route::patch('items/{itemId}', [CartController::class, 'updateItem'])->whereNumber('itemId')->name('items.update');
        Route::delete('items/{itemId}', [CartController::class, 'removeItem'])->whereNumber('itemId')->name('items.destroy');
        Route::post('coupon', [CartController::class, 'applyCoupon'])->name('coupon.store');
        Route::delete('coupon', [CartController::class, 'removeCoupon'])->name('coupon.destroy');
    });
    Route::post('checkout', CheckoutController::class)->middleware('throttle:checkout')->name('checkout');

    // ---------------------------------------------------------------- Auth
    Route::prefix('auth')->name('auth.')->group(function (): void {
        Route::post('register', [AuthController::class, 'register'])->middleware('throttle:login')->name('register');
        Route::post('login', [AuthController::class, 'login'])->middleware('throttle:login')->name('login');
        Route::post('forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:password-reset')->name('password.email');
        Route::post('reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:password-reset')->name('password.update');
        Route::post('logout', [AuthController::class, 'logout'])->middleware('auth:sanctum')->name('logout');
    });

    // ------------------------------------------------------- Customer account
    Route::middleware(['auth:sanctum', 'active'])->group(function (): void {
        Route::get('me', [AuthController::class, 'me'])->name('me');
        Route::put('me', [ProfileController::class, 'update'])->name('me.update');
        Route::put('me/password', [ProfileController::class, 'updatePassword'])->middleware('throttle:login')->name('me.password');

        Route::apiResource('me/addresses', AddressController::class)->except('show')->names('me.addresses');

        Route::get('me/orders', [AccountOrderController::class, 'index'])->name('me.orders.index');
        Route::get('me/orders/{order}', [AccountOrderController::class, 'show'])->name('me.orders.show');
        Route::post('me/orders/{order}/cancel', [AccountOrderController::class, 'cancel'])->name('me.orders.cancel');

        Route::get('me/wishlist', [WishlistController::class, 'index'])->name('me.wishlist.index');
        Route::post('me/wishlist', [WishlistController::class, 'store'])->name('me.wishlist.store');
        Route::delete('me/wishlist/{productId}', [WishlistController::class, 'destroy'])->whereNumber('productId')->name('me.wishlist.destroy');
    });

    // ---------------------------------------------------------------- Admin
    Route::prefix('admin')->name('admin.')->middleware(['auth:sanctum', 'active', 'staff'])->group(function (): void {
        Route::get('dashboard', Admin\DashboardController::class)->middleware('can:'.Permission::ViewDashboard->value)->name('dashboard');

        Route::middleware('can:'.Permission::ManageProducts->value)->group(function (): void {
            Route::get('products', [Admin\ProductController::class, 'index'])->name('products.index');
            Route::post('products', [Admin\ProductController::class, 'store'])->name('products.store');
            Route::get('products/{product}', [Admin\ProductController::class, 'show'])->whereNumber('product')->name('products.show');
            Route::put('products/{product}', [Admin\ProductController::class, 'update'])->name('products.update');
            Route::delete('products/{product}', [Admin\ProductController::class, 'destroy'])->name('products.destroy');
            Route::post('products/{product}/restore', [Admin\ProductController::class, 'restore'])->whereNumber('product')->name('products.restore');
            Route::post('products/{product}/images', [Admin\ProductController::class, 'uploadImage'])->name('products.images.store');
            Route::put('products/{product}/images/order', [Admin\ProductController::class, 'reorderImages'])->name('products.images.reorder');
            Route::delete('products/{product}/images/{image}', [Admin\ProductController::class, 'destroyImage'])->name('products.images.destroy');
        });

        Route::middleware('can:'.Permission::ManageCategories->value)->group(function (): void {
            Route::post('categories/image', [Admin\CategoryController::class, 'uploadImage'])->name('categories.image');
            Route::apiResource('categories', Admin\CategoryController::class);
        });

        Route::middleware('can:'.Permission::ManageOrders->value)->group(function (): void {
            Route::get('orders', [Admin\OrderController::class, 'index'])->name('orders.index');
            Route::get('orders/{order}', [Admin\OrderController::class, 'show'])->name('orders.show');
            Route::patch('orders/{order}/status', [Admin\OrderController::class, 'updateStatus'])->name('orders.status');
            Route::put('orders/{order}/shipment', [Admin\OrderController::class, 'updateShipment'])->name('orders.shipment');
        });

        Route::middleware('can:'.Permission::ViewCustomers->value)->group(function (): void {
            Route::get('customers', [Admin\CustomerController::class, 'index'])->name('customers.index');
            Route::get('customers/{customer}', [Admin\CustomerController::class, 'show'])->whereNumber('customer')->name('customers.show');
            Route::patch('customers/{customer}/status', [Admin\CustomerController::class, 'updateStatus'])->whereNumber('customer')->name('customers.status');
        });

        Route::middleware('can:'.Permission::ManageInventory->value)->group(function (): void {
            Route::get('inventory', [Admin\InventoryController::class, 'index'])->name('inventory.index');
            Route::get('inventory/movements', [Admin\InventoryController::class, 'movements'])->name('inventory.movements');
            Route::post('inventory/{variant}/adjust', [Admin\InventoryController::class, 'adjust'])->name('inventory.adjust');
        });

        Route::middleware('can:'.Permission::ManageCoupons->value)->group(function (): void {
            Route::apiResource('coupons', Admin\CouponController::class);
        });

        Route::middleware('can:'.Permission::ManageContent->value)->group(function (): void {
            Route::get('banners', [Admin\ContentController::class, 'banners'])->name('banners.index');
            Route::post('banners', [Admin\ContentController::class, 'storeBanner'])->name('banners.store');
            Route::post('banners/image', [Admin\ContentController::class, 'uploadBannerImage'])->name('banners.image');
            Route::put('banners/{banner}', [Admin\ContentController::class, 'updateBanner'])->name('banners.update');
            Route::delete('banners/{banner}', [Admin\ContentController::class, 'destroyBanner'])->name('banners.destroy');

            Route::get('home-sections', [Admin\ContentController::class, 'sections'])->name('sections.index');
            Route::post('home-sections', [Admin\ContentController::class, 'storeSection'])->name('sections.store');
            Route::put('home-sections/{section}', [Admin\ContentController::class, 'updateSection'])->name('sections.update');
            Route::delete('home-sections/{section}', [Admin\ContentController::class, 'destroySection'])->name('sections.destroy');

            Route::get('pages', [Admin\ContentController::class, 'pages'])->name('pages.index');
            Route::post('pages', [Admin\ContentController::class, 'storePage'])->name('pages.store');
            Route::get('pages/{page:id}', [Admin\ContentController::class, 'showPage'])->name('pages.show');
            Route::put('pages/{page:id}', [Admin\ContentController::class, 'updatePage'])->name('pages.update');
            Route::delete('pages/{page:id}', [Admin\ContentController::class, 'destroyPage'])->name('pages.destroy');
        });

        Route::middleware('can:'.Permission::ManageSettings->value)->group(function (): void {
            Route::get('settings', [Admin\SettingsController::class, 'show'])->name('settings.show');
            Route::put('settings', [Admin\SettingsController::class, 'update'])->name('settings.update');
            Route::post('settings/logo', [Admin\SettingsController::class, 'uploadLogo'])->name('settings.logo');
        });
    });
});
