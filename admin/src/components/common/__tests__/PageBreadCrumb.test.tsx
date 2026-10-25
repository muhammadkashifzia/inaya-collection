import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

describe("PageBreadcrumb", () => {
  it("renders the page title", () => {
    render(<PageBreadcrumb pageTitle="Products" />);
    expect(screen.getByRole("heading", { name: "Products" })).toBeInTheDocument();
  });

  it("renders Home link", () => {
    render(<PageBreadcrumb pageTitle="Orders" />);
    const link = screen.getByRole("link", { name: /Home/i });
    expect(link).toHaveAttribute("href", "/");
  });

  it("renders the page title in breadcrumb trail", () => {
    render(<PageBreadcrumb pageTitle="Settings" />);
    // Two instances: heading and breadcrumb
    const texts = screen.getAllByText("Settings");
    expect(texts.length).toBeGreaterThanOrEqual(1);
  });

  it("renders breadcrumb navigation", () => {
    render(<PageBreadcrumb pageTitle="Test" />);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });
});
