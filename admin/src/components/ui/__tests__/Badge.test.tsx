import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Badge from "@/components/ui/badge/Badge";

describe("Badge", () => {
  it("renders children text", () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders as span", () => {
    render(<Badge>Text</Badge>);
    expect(screen.getByText("Text").tagName).toBe("SPAN");
  });

  it("applies light primary by default", () => {
    render(<Badge>Default</Badge>);
    const el = screen.getByText("Default");
    expect(el.className).toContain("bg-brand-50");
  });

  it("applies solid variant", () => {
    render(<Badge variant="solid" color="success">Paid</Badge>);
    const el = screen.getByText("Paid");
    expect(el.className).toContain("bg-success-500");
  });

  it("applies error color", () => {
    render(<Badge color="error">Failed</Badge>);
    const el = screen.getByText("Failed");
    expect(el.className).toContain("text-error-600");
  });

  it("applies sm size", () => {
    render(<Badge size="sm">Small</Badge>);
    expect(screen.getByText("Small").className).toContain("text-theme-xs");
  });

  it("applies md size by default", () => {
    render(<Badge>Medium</Badge>);
    expect(screen.getByText("Medium").className).toContain("text-sm");
  });

  it("renders start icon", () => {
    render(<Badge startIcon={<span data-testid="icon">★</span>}>With Icon</Badge>);
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("renders end icon", () => {
    render(<Badge endIcon={<span data-testid="end-icon">→</span>}>With End</Badge>);
    expect(screen.getByTestId("end-icon")).toBeInTheDocument();
  });
});
