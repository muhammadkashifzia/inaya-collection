<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\OrderStatus;
use App\Enums\Permission;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;

class CustomerController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'is_active' => ['nullable', 'boolean'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $customers = $this->customers()
            ->when($filters['q'] ?? null, function ($query, string $q): void {
                $term = '%'.str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $q).'%';
                $query->where(fn ($w) => $w->where('name', 'like', $term)->orWhere('email', 'like', $term)->orWhere('phone', 'like', $term));
            })
            ->when($request->has('is_active'), fn ($q) => $q->where('is_active', $request->boolean('is_active')))
            ->latest()
            ->paginate($filters['per_page'] ?? 20)
            ->withQueryString();

        return UserResource::collection($customers);
    }

    public function show(int $customer): JsonResponse
    {
        $user = $this->customers()->with('addresses')->findOrFail($customer);

        return response()->json([
            'data' => new UserResource($user),
            'recent_orders' => OrderResource::collection($user->orders()->withCount('items')->latest('placed_at')->limit(10)->get()),
        ]);
    }

    public function updateStatus(Request $request, int $customer): UserResource
    {
        Gate::authorize(Permission::ManageCustomers->value);
        $validated = $request->validate(['is_active' => ['required', 'boolean']]);

        $user = User::query()->where('role', UserRole::Customer)->findOrFail($customer);
        $user->forceFill(['is_active' => $validated['is_active']])->save();

        if (! $user->is_active) {
            DB::table('sessions')->where('user_id', $user->id)->delete();
            $user->tokens()->delete();
        }

        Log::info('Customer status changed', ['customer_id' => $user->id, 'is_active' => $user->is_active, 'admin_id' => $request->user()->id]);

        return new UserResource($user->loadCount('orders'));
    }

    /**
     * @return Builder<User>
     */
    private function customers(): Builder
    {
        $revenue = array_map(fn (OrderStatus $s): string => $s->value, OrderStatus::revenueStatuses());

        return User::query()
            ->where('role', UserRole::Customer)
            ->withCount('orders')
            ->withSum(['orders as orders_total' => fn ($q) => $q->whereIn('status', $revenue)], 'grand_total');
    }
}
