import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import "@//__tests__/helpers";
import { fakeProduct } from "@//__tests__/helpers";
import { ShopTheLook } from "../ShopTheLook";

describe("ShopTheLook", () => {
  const looks = [
    { image: "https://cdn.com/look1.jpg", products: [fakeProduct({ id: 1, slug: "p1", title: "Product 1" }), fakeProduct({ id: 2, slug: "p2", title: "Product 2" })] },
    { image: "https://cdn.com/look2.jpg", products: [fakeProduct({ id: 3, slug: "p3", title: "Product 3" })] },
  ];

  it("returns null when looks is empty", () => {
    const { container } = render(<ShopTheLook title="Shop The Look" looks={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("returns null when no look has valid products", () => {
    const { container } = render(<ShopTheLook title="Test" looks={[{ image: "", products: [] }]} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders the section title", () => {
    render(<ShopTheLook title="Shop The Look" looks={looks} />);
    expect(screen.getByRole("heading", { name: /Shop The Look/i })).toBeInTheDocument();
  });

  it("renders product title and price", () => {
    render(<ShopTheLook title="STL" looks={looks} />);
    expect(screen.getByText("Product 1")).toBeInTheDocument();
    expect(screen.getByText("Rs.3,500.00")).toBeInTheDocument();
  });

  it("shows View Product links", () => {
    render(<ShopTheLook title="STL" looks={looks} />);
    const links = screen.getAllByText("View Product");
    expect(links.length).toBeGreaterThanOrEqual(1);
  });

  it("shows prev/next arrows when multiple looks", () => {
    render(<ShopTheLook title="STL" looks={looks} />);
    expect(screen.getByRole("button", { name: "Previous look" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next look" })).toBeInTheDocument();
  });

  it("does not show arrows when single look", () => {
    const singleLook = [looks[0]];
    render(<ShopTheLook title="STL" looks={singleLook} />);
    expect(screen.queryByRole("button", { name: "Previous look" })).not.toBeInTheDocument();
  });

  it("shows product dot indicators when look has multiple products", () => {
    render(<ShopTheLook title="STL" looks={looks} />);
    expect(screen.getByRole("tablist", { name: "Products in this look" })).toBeInTheDocument();
  });

  it("cycles to next look on arrow click", async () => {
    const user = userEvent.setup();
    render(<ShopTheLook title="STL" looks={looks} />);

    await user.click(screen.getByRole("button", { name: "Next look" }));
    expect(screen.getByText("Product 3")).toBeInTheDocument();
  });
});
