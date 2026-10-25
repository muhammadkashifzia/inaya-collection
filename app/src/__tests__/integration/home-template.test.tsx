/**
 * Integration test: HomeTemplate renders the correct organisms based on HomeData sections.
 * Tests the full composition: HomeTemplate → Section switch → organism components.
 */
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import "../helpers";
import { fakeProduct, fakeCollection, fakeBanner } from "../helpers";
import { HomeTemplate } from "@/components/templates/HomeTemplate";
import type { HomeData } from "@/types";

function fakeHome(overrides: Partial<HomeData> = {}): HomeData {
  return { banners: [], promos: [], collectionStrip: [], sections: [], ...overrides };
}

describe("HomeTemplate integration", () => {
  it("renders HeroBanner when banners exist", () => {
    const home = fakeHome({ banners: [fakeBanner({ title: "Summer Sale" })] });
    render(<HomeTemplate home={home} />);
    expect(screen.getByText("Summer Sale")).toBeInTheDocument();
  });

  it("does not render HeroBanner when banners are empty", () => {
    render(<HomeTemplate home={fakeHome()} />);
    expect(screen.queryByText("Previous banner")).not.toBeInTheDocument();
  });

  it("renders ProductRail for 'latest' section type", () => {
    const home = fakeHome({
      sections: [{ id: 1, type: "latest", title: "New Arrivals", subtitle: null, products: [fakeProduct({ id: 1, slug: "p1", title: "Silk Dress" })] }],
    });
    render(<HomeTemplate home={home} />);
    expect(screen.getByRole("heading", { name: /New Arrivals/i })).toBeInTheDocument();
    expect(screen.getByText("Silk Dress")).toBeInTheDocument();
  });

  it("renders ProductRail for 'featured' section type with View all link", () => {
    const home = fakeHome({
      sections: [{ id: 2, type: "featured", title: "Featured", subtitle: null, products: [fakeProduct()] }],
    });
    render(<HomeTemplate home={home} />);
    expect(screen.getByRole("heading", { name: /Featured/i })).toBeInTheDocument();
    const viewAll = screen.getByRole("link", { name: /View all/i });
    expect(viewAll).toHaveAttribute("href", expect.stringContaining("/collections/all"));
  });

  it("renders ShopByCollection for 'category_grid' section", () => {
    const home = fakeHome({
      sections: [{
        id: 3, type: "category_grid", title: "Shop by Category", subtitle: null,
        categories: [fakeCollection({ id: 1, slug: "winter", title: "Winter", shortTitle: "Winter" })],
      }],
    });
    render(<HomeTemplate home={home} />);
    expect(screen.getByRole("heading", { name: /Shop by Category/i })).toBeInTheDocument();
  });

  it("renders CollectionTabs for 'category_tabs' section", () => {
    const home = fakeHome({
      sections: [{
        id: 4, type: "category_tabs", title: "Browse Collections", subtitle: null,
        tabs: [{ category: fakeCollection({ slug: "khaddar", shortTitle: "Khaddar" }), total: 10, products: [fakeProduct()] }],
      }],
    });
    render(<HomeTemplate home={home} />);
    expect(screen.getByRole("heading", { name: /Browse Collections/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Khaddar" })).toBeInTheDocument();
  });

  it("renders CollectionTabs with subtitle from admin", () => {
    const home = fakeHome({
      sections: [{
        id: 6, type: "category_tabs", title: "Tabs", subtitle: "Handpicked for you",
        tabs: [{ category: fakeCollection({ slug: "lawn", shortTitle: "Lawn" }), total: 5, products: [fakeProduct()] }],
      }],
    });
    render(<HomeTemplate home={home} />);
    expect(screen.getByText("Handpicked for you")).toBeInTheDocument();
  });

  it("renders ShopTheLook for 'shop_the_look' section", () => {
    const home = fakeHome({
      sections: [{
        id: 5, type: "shop_the_look", title: "Shop The Look", subtitle: null,
        looks: [{ image: "look.jpg", products: [fakeProduct({ title: "Look Product" })] }],
      }],
    });
    render(<HomeTemplate home={home} />);
    expect(screen.getByRole("heading", { name: /Shop The Look/i })).toBeInTheDocument();
    expect(screen.getByText("Look Product")).toBeInTheDocument();
  });

  it("renders nothing for 'reviews' section type", () => {
    const home = fakeHome({
      sections: [{ id: 7, type: "reviews", title: "Customer Reviews", subtitle: null }],
    });
    const { container } = render(<HomeTemplate home={home} />);
    expect(screen.queryByText("Customer Reviews")).not.toBeInTheDocument();
  });

  it("renders multiple sections in order", () => {
    const home = fakeHome({
      banners: [fakeBanner({ title: "Hero" })],
      sections: [
        { id: 1, type: "latest", title: "Latest", subtitle: null, products: [fakeProduct({ id: 1, slug: "a" })] },
        { id: 2, type: "featured", title: "Featured", subtitle: null, products: [fakeProduct({ id: 2, slug: "b" })] },
      ],
    });
    render(<HomeTemplate home={home} />);
    expect(screen.getByText("Hero")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Latest" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Featured" })).toBeInTheDocument();
  });
});
