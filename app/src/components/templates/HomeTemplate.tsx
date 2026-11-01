import { BannerSection, CollectionTabs, HeroBanner, ImageBanners, ProductRail, ShopByCollection, ShopTheLook, WinterCollections } from "@/components/organisms";
import type { HomeData, HomeSection } from "@/types";

/**
 * Homepage, rendered entirely from GET /api/v1/home. Section order, titles,
 * subtitles and visibility are all managed in the admin dashboard (Home sections).
 */
export function HomeTemplate({ home }: { home: HomeData }) {
  return (
    <>
      {home.banners.length > 0 && <HeroBanner banners={home.banners} />}
      {home.sections.map((section) => {
        if (section.type === "category_grid") {
          return (
            <div key={section.id}>
              <Section section={section} />
              <WinterCollections banners={home.collectionStrip} />
            </div>
          );
        }
        return <Section key={section.id} section={section} />;
      })}
    </>
  );
}

function Section({ section }: { section: HomeSection }) {
  switch (section.type) {
    case "category_grid":
      return section.categories.length ? <ShopByCollection title={section.title} subtitle={section.subtitle} collections={section.categories} /> : null;
    case "category_tabs":
      return <CollectionTabs title={section.title} subtitle={section.subtitle} tabs={section.tabs.filter((t) => t.products.length > 0)} />;
    case "category":
      return (
        <ProductRail
          title={section.title}
          subtitle={section.subtitle}
          products={section.products}
          href={section.category ? `/collections/${section.category.slug}` : undefined}
          category={section.category?.shortTitle || section.category?.title}
        />
      );
    case "featured":
    case "best_sellers":
    case "latest":
    case "discounted":
      return (
        <ProductRail
          title={section.title}
          subtitle={section.subtitle}
          products={section.products}
          href={`/collections/all?sort=${section.type === "best_sellers" ? "popularity" : section.type === "latest" ? "latest" : "featured"}${section.type === "discounted" ? "&on_sale=1" : ""}`}
        />
      );
    case "banner_image":
      return <BannerSection title={section.title} subtitle={section.subtitle} slides={section.slides} />;
    case "shop_the_look":
      return <ShopTheLook title={section.title} subtitle={section.subtitle} looks={section.looks} />;
    case "image_banners":
      return <ImageBanners title={section.title} subtitle={section.subtitle} items={section.items} />;
    case "reviews":
      return null;
  }
}
