<?php

namespace App\Models;

use App\Enums\ReviewStatus;
use Database\Factories\ProductReviewFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Customer review. New storefront reviews start as pending and only appear
 * on the store after an admin approves them.
 */
#[Fillable(['product_id', 'user_id', 'name', 'email', 'rating', 'title', 'body', 'status', 'is_verified_buyer', 'ip_address'])]
class ProductReview extends Model
{
    /** @use HasFactory<ProductReviewFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'rating' => 'integer',
            'status' => ReviewStatus::class,
            'is_verified_buyer' => 'boolean',
        ];
    }

    /** @return BelongsTo<Product, $this> */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class)->withTrashed();
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @param  Builder<ProductReview>  $query
     */
    #[Scope]
    protected function approved(Builder $query): void
    {
        $query->where('status', ReviewStatus::Approved);
    }
}
