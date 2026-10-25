/**
 * Integration test: RecentOrders, BestSellers, LowStock components
 * compose Card + DataTable + StatusBadge together.
 */
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import "../helpers";
import { fakeDashboardData } from "../helpers";
import { RecentOrders, BestSellers, LowStock } from "@/components/dashboard/DashboardLists";

const data = fakeDashboardData();

describe("RecentOrders integration", () => {
  it("renders order numbers as links", () => {
    render(<RecentOrders orders={data.recent_orders} />);
    const links = screen.getAllByRole("link", { name: /ORD-/ });
    expect(links.length).toBeGreaterThanOrEqual(1);
    expect(links[0]).toHaveAttribute("href", "/orders/ORD-001");
  });

  it("renders customer names", () => {
    render(<RecentOrders orders={data.recent_orders} />);
    expect(screen.getByText("Sara Ahmed")).toBeInTheDocument();
  });

  it("renders order status badges", () => {
    render(<RecentOrders orders={data.recent_orders} />);
    expect(screen.getAllByText("Confirmed").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Pending").length).toBeGreaterThanOrEqual(1);
  });

  it("renders payment status badges", () => {
    render(<RecentOrders orders={data.recent_orders} />);
    expect(screen.getAllByText("Paid").length).toBeGreaterThanOrEqual(1);
  });

  it("renders formatted totals", () => {
    render(<RecentOrders orders={data.recent_orders} />);
    expect(screen.getAllByText("Rs. 5,500").length).toBeGreaterThanOrEqual(1);
  });

  it("shows 'View all' link to orders page", () => {
    render(<RecentOrders orders={data.recent_orders} />);
    expect(screen.getByRole("link", { name: "View all" })).toHaveAttribute("href", "/orders");
  });

  it("shows empty message when no orders", () => {
    render(<RecentOrders orders={[]} />);
    expect(screen.getByText("No orders yet.")).toBeInTheDocument();
  });

  it("renders card title", () => {
    render(<RecentOrders orders={data.recent_orders} />);
    expect(screen.getByRole("heading", { name: "Recent orders" })).toBeInTheDocument();
  });
});

describe("BestSellers integration", () => {
  it("renders product names as links", () => {
    render(<BestSellers items={data.best_sellers} />);
    const links = screen.getAllByRole("link");
    expect(links.some((l) => l.textContent?.includes("Black Khaddar Suit"))).toBe(true);
  });

  it("displays units sold and revenue", () => {
    render(<BestSellers items={data.best_sellers} />);
    expect(screen.getByText(/45 sold/)).toBeInTheDocument();
    expect(screen.getByText(/Rs. 157,500/)).toBeInTheDocument();
  });

  it("shows ranked numbers", () => {
    render(<BestSellers items={data.best_sellers} />);
    expect(screen.getByText("1.")).toBeInTheDocument();
    expect(screen.getByText("2.")).toBeInTheDocument();
  });

  it("shows empty message when no items", () => {
    render(<BestSellers items={[]} />);
    expect(screen.getByText("No sales yet.")).toBeInTheDocument();
  });

  it("renders card title and description", () => {
    render(<BestSellers items={data.best_sellers} />);
    expect(screen.getByRole("heading", { name: "Best sellers" })).toBeInTheDocument();
    expect(screen.getByText(/By units sold/)).toBeInTheDocument();
  });
});

describe("LowStock integration", () => {
  it("renders product names as links", () => {
    render(<LowStock items={data.low_stock} />);
    expect(screen.getByRole("link", { name: "Black Khaddar" })).toHaveAttribute("href", "/products/1");
  });

  it("renders SKU info", () => {
    render(<LowStock items={data.low_stock} />);
    expect(screen.getByText(/BK-001-M/)).toBeInTheDocument();
  });

  it("shows stock count badge", () => {
    render(<LowStock items={data.low_stock} />);
    expect(screen.getByText("2 left")).toBeInTheDocument();
  });

  it("shows 'Out of stock' for zero stock", () => {
    const items = [{ ...data.low_stock[0], stock: 0 }];
    render(<LowStock items={items} />);
    expect(screen.getByText("Out of stock")).toBeInTheDocument();
  });

  it("shows empty message when all stocked", () => {
    render(<LowStock items={[]} />);
    expect(screen.getByText("All products are well stocked.")).toBeInTheDocument();
  });

  it("shows 'Manage' link", () => {
    render(<LowStock items={data.low_stock} />);
    expect(screen.getByRole("link", { name: "Manage" })).toHaveAttribute("href", "/inventory?low_stock=1");
  });
});
