import { BannerSection, CollectionTabs, FeaturedTabs, HeroBanner, ProductRail, ShopByCollection, ShopTheLook, WinterCollections } from "@/components/organisms";
import type { HomeData, HomeSection, SiteConfig } from "@/types";

/**
 * Homepage, rendered entirely from GET /api/v1/home. Section order, titles
 * and visibility are managed in the admin dashboard (Home sections).
 */
export function HomeTemplate({ site, home }: { site: SiteConfig; home: HomeData }) {
  const tabsSection = home.sections.find((s) => s.type === "category_tabs");

  return (
    <>
      {home.banners.length > 0 && <HeroBanner banners={home.banners} />}
      {home.sections
        .filter((s) => s.type !== "category_tabs")
        .map((section) => {
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
      {tabsSection?.type === "category_tabs" && (
        <FeaturedTabs
          title={tabsSection.title}
          description={`With impeccable artistry and authentic designs, ${site.name} has something for everyone.`}
          tabs={tabsSection.tabs.filter((t) => t.products.length > 0)}
        />
      )}
    </>
  );
}

function Section({ section }: { section: HomeSection }) {
  switch (section.type) {
    case "category_grid":
      return section.categories.length ? <ShopByCollection title={section.title} collections={section.categories} /> : null;
    case "category_tabs":
      return <CollectionTabs title={section.title} tabs={section.tabs.filter((t) => t.products.length > 0)} />;
    case "category":
      return (
        <ProductRail
          title={section.title}
          products={section.products}
          href={section.category ? `/collections/${section.category.slug}` : undefined}
        />
      );
    case "featured":
    case "best_sellers":
    case "latest":
    case "discounted":
      return (
        <ProductRail
          title={section.title}
          products={section.products}
          href={`/collections/all?sort=${section.type === "best_sellers" ? "popularity" : section.type === "latest" ? "latest" : "featured"}${section.type === "discounted" ? "&on_sale=1" : ""}`}
        />
      );
    case "reviews":
      // Customer reviews are not stored in the backend yet, so nothing is rendered.
      return null;
    case "banner_image":
      return (
        <BannerSection
          title={section.title}
          slides={section.slides}
        />
      );
    case "shop_the_look":
      return <ShopTheLook title={section.title} looks={section.looks} />;
  }
}
