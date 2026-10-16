import { getSite, getHome } from "@/lib/server-api";
import {
  HeroBanner,
  TrustBar,
  CategoryGrid,
  CollectionTabs,
  CategoryRow,
  ReviewsCarousel,
} from "@/components/organisms";

export default async function HomePage() {
  const [site, home] = await Promise.all([getSite(), getHome()]);

  return (
    <>
      {/* Hero banners — show first one */}
      {home.banners.length > 0 && <HeroBanner banner={home.banners[0]} />}

      {/* Trust bar */}
      {site.trust.length > 0 && <TrustBar items={site.trust} />}

      {/* Dynamic home sections */}
      <div className="space-y-12 py-12 md:space-y-16 md:py-16">
        {home.sections.map((section) => {
          switch (section.type) {
            case "category_grid":
              return (
                <CategoryGrid
                  key={section.id}
                  title={section.title}
                  collections={section.categories ?? []}
                />
              );

            case "tabbed_products":
              return (
                <CollectionTabs
                  key={section.id}
                  title={section.title}
                  tabs={section.tabs ?? []}
                />
              );

            case "category_products":
              return (
                <CategoryRow
                  key={section.id}
                  title={section.title}
                  products={section.products ?? []}
                  href={
                    section.category
                      ? `/collections/${section.category.slug}`
                      : undefined
                  }
                />
              );

            default:
              return null;
          }
        })}
      </div>

      {/* Reviews carousel */}
      {home.reviews.length > 0 && (
        <ReviewsCarousel title="Reviews from Our Customers" reviews={home.reviews} />
      )}
    </>
  );
}
