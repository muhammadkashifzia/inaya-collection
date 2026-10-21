<?php

namespace App\Enums;

enum HomeSectionType: string
{
    case Featured = 'featured';
    case BestSellers = 'best_sellers';
    case Latest = 'latest';
    case Discounted = 'discounted';
    case Category = 'category';
    case CategoryTabs = 'category_tabs';
    case CategoryGrid = 'category_grid';
    case BannerImage = 'banner_image';
    case Reviews = 'reviews';
}
