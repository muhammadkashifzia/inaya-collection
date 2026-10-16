<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\BannerPlacement;
use App\Enums\HomeSectionType;
use App\Http\Controllers\Controller;
use App\Http\Resources\BannerResource;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\ProductResource;
use App\Models\Banner;
use App\Models\Category;
use App\Models\HomeSection;
use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;

/**
 * GET /api/v1/home — every homepage block, in the order configured by admins.
 */
class HomeController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $sections = HomeSection::query()->where('is_active', true)->with('category')->orderBy('sort_order')->get();
        $topCategories = $this->topCategories();

        return response()->json([
            'data' => [
                'banners' => BannerResource::collection(Banner::query()->live()->where('placement', BannerPlacement::Hero)->get()),
                'promos' => BannerResource::collection(Banner::query()->live()->where('placement', BannerPlacement::Promo)->get()),
                'sections' => $sections->map(fn (HomeSection $section): array => [
                    'id' => $section->id,
                    'type' => $section->type,
                    'title' => $section->title,
                    ...$this->sectionPayload($section, $topCategories),
                ])->values(),
            ],
        ]);
    }

    /**
     * @param  Collection<int, Category>  $topCategories
     * @return array<string, mixed>
     */
    private function sectionPayload(HomeSection $section, Collection $topCategories): array
    {
        $limit = $section->product_limit;

        return match ($section->type) {
            HomeSectionType::CategoryGrid => ['categories' => CategoryResource::collection($topCategories)],
            HomeSectionType::CategoryTabs => [
                'tabs' => $topCategories->map(fn (Category $category): array => [
                    'category' => new CategoryResource($category),
                    'total' => $category->products_count,
                    'products' => ProductResource::collection(
                        $this->cards()->where('category_id', $category->id)->orderByDesc('published_at')->limit($limit)->get(),
                    ),
                ])->values(),
            ],
            HomeSectionType::Featured => ['products' => ProductResource::collection($this->cards()->where('is_featured', true)->latest('published_at')->limit($limit)->get())],
            HomeSectionType::BestSellers => ['products' => ProductResource::collection($this->cards()->orderByDesc('sales_count')->limit($limit)->get())],
            HomeSectionType::Latest => ['products' => ProductResource::collection($this->cards()->latest('published_at')->limit($limit)->get())],
            HomeSectionType::Discounted => ['products' => ProductResource::collection(
                $this->cards()->whereNotNull('sale_price')->whereColumn('sale_price', '<', 'price')->latest('published_at')->limit($limit)->get(),
            )],
            HomeSectionType::Category => [
                'category' => $section->category ? new CategoryResource($section->category) : null,
                'products' => ProductResource::collection($section->category
                    ? $this->cards()->whereIn('category_id', $section->category->selfAndDescendantIds())->latest('published_at')->limit($limit)->get()
                    : collect()),
            ],
            HomeSectionType::Reviews => [],
        };
    }

    /**
     * @return Builder<Product>
     */
    private function cards(): Builder
    {
        return Product::query()->select('products.*')->visible()->withCardData();
    }

    /**
     * @return Collection<int, Category>
     */
    private function topCategories(): Collection
    {
        return Category::query()
            ->active()
            ->whereNull('parent_id')
            ->withCount(['products' => fn ($q) => $q->visible()])
            ->orderBy('sort_order')
            ->get();
    }
}
