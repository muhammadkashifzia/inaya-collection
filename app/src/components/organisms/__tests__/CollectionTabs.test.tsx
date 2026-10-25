import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import "@//__tests__/helpers";
import { fakeProduct, fakeCollection } from "@//__tests__/helpers";
import { CollectionTabs } from "../CollectionTabs";

const tabs = [
  { category: fakeCollection({ id: 1, slug: "khaddar", shortTitle: "Khaddar" }), total: 20, products: [fakeProduct({ id: 1, slug: "p1" })] },
  { category: fakeCollection({ id: 2, slug: "lawn", shortTitle: "Lawn" }), total: 15, products: [fakeProduct({ id: 2, slug: "p2" })] },
];

describe("CollectionTabs", () => {
  it("returns null when tabs is empty", () => {
    const { container } = render(<CollectionTabs title="Browse" tabs={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders the title", () => {
    render(<CollectionTabs title="Browse Collections" tabs={tabs} />);
    expect(screen.getByRole("heading", { name: /Browse Collections/i })).toBeInTheDocument();
  });

  it("renders tab buttons for each category", () => {
    render(<CollectionTabs title="Collections" tabs={tabs} />);
    expect(screen.getByRole("tab", { name: "Khaddar" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Lawn" })).toBeInTheDocument();
  });

  it("first tab selected by default", () => {
    render(<CollectionTabs title="Collections" tabs={tabs} />);
    expect(screen.getByRole("tab", { name: "Khaddar" })).toHaveAttribute("aria-selected", "true");
  });

  it("switches tabs on click", async () => {
    const user = userEvent.setup();
    render(<CollectionTabs title="Collections" tabs={tabs} />);

    await user.click(screen.getByRole("tab", { name: "Lawn" }));
    expect(screen.getByRole("tab", { name: "Lawn" })).toHaveAttribute("aria-selected", "true");
  });

  it("shows View More button when total > displayed products", () => {
    render(<CollectionTabs title="Collections" tabs={tabs} />);
    expect(screen.getByRole("button", { name: /View More/i })).toBeInTheDocument();
  });

  it("has tabpanel", () => {
    render(<CollectionTabs title="Collections" tabs={tabs} />);
    expect(screen.getByRole("tabpanel")).toBeInTheDocument();
  });
});
