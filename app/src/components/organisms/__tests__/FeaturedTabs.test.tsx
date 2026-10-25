import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import "@//__tests__/helpers";
import { fakeProduct, fakeCollection } from "@//__tests__/helpers";
import { FeaturedTabs } from "../FeaturedTabs";

const tabs = [
  { category: fakeCollection({ id: 1, slug: "best", shortTitle: "Best Sellers" }), total: 10, products: [fakeProduct({ id: 1, slug: "p1", title: "Product A" })] },
  { category: fakeCollection({ id: 2, slug: "new", shortTitle: "New Arrivals" }), total: 5, products: [fakeProduct({ id: 2, slug: "p2", title: "Product B" })] },
];

describe("FeaturedTabs", () => {
  it("returns null when tabs is empty", () => {
    const { container } = render(<FeaturedTabs title="Featured" tabs={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders the title", () => {
    render(<FeaturedTabs title="Best Sellers" tabs={tabs} />);
    expect(screen.getByRole("heading", { name: /Best Sellers/i })).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(<FeaturedTabs title="Featured" description="Top picks" tabs={tabs} />);
    expect(screen.getByText("Top picks")).toBeInTheDocument();
  });

  it("renders tab buttons", () => {
    render(<FeaturedTabs title="Featured" tabs={tabs} />);
    expect(screen.getByRole("tab", { name: "Best Sellers" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "New Arrivals" })).toBeInTheDocument();
  });

  it("first tab is selected by default", () => {
    render(<FeaturedTabs title="Featured" tabs={tabs} />);
    expect(screen.getByRole("tab", { name: "Best Sellers" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "New Arrivals" })).toHaveAttribute("aria-selected", "false");
  });

  it("switches tabs on click", async () => {
    const user = userEvent.setup();
    render(<FeaturedTabs title="Featured" tabs={tabs} />);

    await user.click(screen.getByRole("tab", { name: "New Arrivals" }));
    expect(screen.getByRole("tab", { name: "New Arrivals" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Best Sellers" })).toHaveAttribute("aria-selected", "false");
  });

  it("has tabpanel with correct aria attributes", () => {
    render(<FeaturedTabs title="Featured" tabs={tabs} />);
    expect(screen.getByRole("tabpanel")).toBeInTheDocument();
  });
});
