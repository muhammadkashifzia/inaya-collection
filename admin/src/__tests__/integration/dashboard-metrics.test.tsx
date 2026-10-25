/**
 * Integration test: MetricCards + StatusStrip compose together
 * to display all dashboard headline numbers.
 */
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import "../helpers";
import { fakeDashboardData } from "../helpers";
import MetricCards, { StatusStrip } from "@/components/dashboard/MetricCards";

const data = fakeDashboardData();

describe("MetricCards integration", () => {
  it("renders all 4 metric cards", () => {
    render(<MetricCards totals={data.totals} revenueDefinition={data.revenue_definition} />);
    expect(screen.getByText("Revenue")).toBeInTheDocument();
    expect(screen.getByText("Orders")).toBeInTheDocument();
    expect(screen.getByText("Customers")).toBeInTheDocument();
    expect(screen.getByText("Products")).toBeInTheDocument();
  });

  it("displays formatted revenue", () => {
    render(<MetricCards totals={data.totals} revenueDefinition={data.revenue_definition} />);
    expect(screen.getByText("Rs. 1,250,000")).toBeInTheDocument();
  });

  it("displays order count", () => {
    render(<MetricCards totals={data.totals} revenueDefinition={data.revenue_definition} />);
    expect(screen.getByText("342")).toBeInTheDocument();
  });

  it("displays customer count", () => {
    render(<MetricCards totals={data.totals} revenueDefinition={data.revenue_definition} />);
    expect(screen.getByText("189")).toBeInTheDocument();
  });

  it("displays product count", () => {
    render(<MetricCards totals={data.totals} revenueDefinition={data.revenue_definition} />);
    expect(screen.getByText("45")).toBeInTheDocument();
  });

  it("renders metric cards as links", () => {
    render(<MetricCards totals={data.totals} revenueDefinition={data.revenue_definition} />);
    const links = screen.getAllByRole("link");
    expect(links.length).toBe(4);
    expect(links.some((l) => l.getAttribute("href") === "/orders")).toBe(true);
    expect(links.some((l) => l.getAttribute("href") === "/products")).toBe(true);
    expect(links.some((l) => l.getAttribute("href") === "/customers")).toBe(true);
  });

  it("shows revenue definition as title tooltip", () => {
    render(<MetricCards totals={data.totals} revenueDefinition="Revenue from delivered orders" />);
    const revenueLink = screen.getByText("Revenue").closest("a");
    expect(revenueLink).toHaveAttribute("title", "Revenue from delivered orders");
  });
});

describe("StatusStrip integration", () => {
  it("renders all 4 status counters", () => {
    render(<StatusStrip totals={data.totals} />);
    expect(screen.getByText("Pending orders")).toBeInTheDocument();
    expect(screen.getByText("Delivered")).toBeInTheDocument();
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
    expect(screen.getByText("Low-stock variants")).toBeInTheDocument();
  });

  it("displays correct pending count", () => {
    render(<StatusStrip totals={data.totals} />);
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("displays correct delivered count", () => {
    render(<StatusStrip totals={data.totals} />);
    expect(screen.getByText("280")).toBeInTheDocument();
  });

  it("renders status items as links", () => {
    render(<StatusStrip totals={data.totals} />);
    const links = screen.getAllByRole("link");
    expect(links.some((l) => l.getAttribute("href")?.includes("pending"))).toBe(true);
    expect(links.some((l) => l.getAttribute("href")?.includes("delivered"))).toBe(true);
  });
});
