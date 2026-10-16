<?php

namespace App\Http\Controllers\Api\V1\Account;

use App\Http\Controllers\Controller;
use App\Http\Requests\AddressRequest;
use App\Http\Resources\AddressResource;
use App\Models\Address;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class AddressController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        return AddressResource::collection($request->user()->addresses()->latest()->get());
    }

    public function store(AddressRequest $request): JsonResponse
    {
        $user = $request->user();
        $address = DB::transaction(function () use ($user, $request): Address {
            $isFirst = ! $user->addresses()->exists();
            $address = $user->addresses()->create([
                ...$request->validated(),
                'country' => $request->validated('country') ?? 'PK',
                'is_default_shipping' => $isFirst || $request->boolean('is_default_shipping'),
                'is_default_billing' => $isFirst || $request->boolean('is_default_billing'),
            ]);
            $this->normaliseDefaults($user, $address);

            return $address;
        });

        return (new AddressResource($address))->response()->setStatusCode(201);
    }

    public function update(AddressRequest $request, Address $address): AddressResource
    {
        Gate::authorize('manage-address', $address);

        DB::transaction(function () use ($request, $address): void {
            $address->update($request->validated());
            $this->normaliseDefaults($request->user(), $address);
        });

        return new AddressResource($address->refresh());
    }

    public function destroy(Request $request, Address $address): JsonResponse
    {
        Gate::authorize('manage-address', $address);
        $address->delete();

        return response()->json(null, 204);
    }

    /**
     * Only one default shipping and one default billing address per user.
     */
    private function normaliseDefaults(User $user, Address $address): void
    {
        foreach (['is_default_shipping', 'is_default_billing'] as $flag) {
            if ($address->{$flag}) {
                $user->addresses()->whereKeyNot($address->id)->update([$flag => false]);
            }
        }
    }
}
