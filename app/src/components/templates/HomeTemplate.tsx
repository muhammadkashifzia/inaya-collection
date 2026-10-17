import { CollectionTabs, HeroBanner, ProductRail, ShopByCollection, TrustBar } from "@/components/organisms";
import type { HomeData, HomeSection, SiteConfig } from "@/types";

/**
 * Homepage, rendered entirely from GET /api/v1/home. Section order, titles
 * and visibility are managed in the admin dashboard (Home sections).
 */
export function HomeTemplate({ site, home }: { site: SiteConfig; home: HomeData }) {
  const hero = home.banners[0];

  return (
    <>
      {hero && <HeroBanner banner={hero} />}
      {site.trust.length > 0 && <TrustBar items={site.trust} />}
      {home.sections.map((section) => (
        <Section key={section.id} section={section} />
      ))}
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
  }
}
