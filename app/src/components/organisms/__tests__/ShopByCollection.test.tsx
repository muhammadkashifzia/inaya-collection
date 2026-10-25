import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { fakeCollection } from "@//__tests__/helpers";
import { ShopByCollection } from "../ShopByCollection";

describe("ShopByCollection", () => {
  it("renders the title", () => {
    render(<ShopByCollection title="Shop by Category" collections={[fakeCollection()]} />);
    expect(screen.getByRole("heading", { name: /Shop by Category/i })).toBeInTheDocument();
  });

  it("renders correct number of collection tiles", () => {
    const collections = [
      fakeCollection({ id: 1, slug: "winter" }),
      fakeCollection({ id: 2, slug: "summer" }),
      fakeCollection({ id: 3, slug: "casual" }),
    ];
    render(<ShopByCollection title="Collections" collections={collections} />);
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThanOrEqual(3);
  });
});
