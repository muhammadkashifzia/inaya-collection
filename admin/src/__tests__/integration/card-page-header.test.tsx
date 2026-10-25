/**
 * Integration test: Card and PageHeader compose together in admin pages.
 */
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Card from "@/components/admin/Card";
import PageHeader from "@/components/admin/PageHeader";

describe("Card integration", () => {
  it("renders title and children", () => {
    render(<Card title="Recent Orders"><p>Order list here</p></Card>);
    expect(screen.getByRole("heading", { name: "Recent Orders" })).toBeInTheDocument();
    expect(screen.getByText("Order list here")).toBeInTheDocument();
  });

  it("renders description", () => {
    render(<Card title="Stats" description="Last 30 days"><div /></Card>);
    expect(screen.getByText("Last 30 days")).toBeInTheDocument();
  });

  it("renders actions in header", () => {
    render(<Card title="Orders" actions={<button>Export</button>}><div /></Card>);
    expect(screen.getByRole("button", { name: "Export" })).toBeInTheDocument();
  });

  it("renders without header when no title", () => {
    const { container } = render(<Card><p>Content only</p></Card>);
    expect(container.querySelector("header")).not.toBeInTheDocument();
    expect(screen.getByText("Content only")).toBeInTheDocument();
  });
});

describe("PageHeader integration", () => {
  it("renders title as h1", () => {
    render(<PageHeader title="Products" />);
    expect(screen.getByRole("heading", { level: 1, name: "Products" })).toBeInTheDocument();
  });

  it("renders description", () => {
    render(<PageHeader title="Dashboard" description="Store overview" />);
    expect(screen.getByText("Store overview")).toBeInTheDocument();
  });

  it("renders action buttons", () => {
    render(<PageHeader title="Products" actions={<button>Add Product</button>} />);
    expect(screen.getByRole("button", { name: "Add Product" })).toBeInTheDocument();
  });

  it("renders back link when provided", () => {
    render(<PageHeader title="Order #123" back={{ to: "/orders", label: "Back to orders" }} />);
    expect(screen.getByRole("link", { name: /Back to orders/ })).toHaveAttribute("href", "/orders");
  });

  it("does not render back link when not provided", () => {
    render(<PageHeader title="Dashboard" />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
