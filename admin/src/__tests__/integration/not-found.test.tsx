/**
 * Integration test: NotFound page renders correctly.
 */
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import NotFound from "@/pages/OtherPage/NotFound";

// Mock GridShape since it's decorative
vi.mock("@/components/common/GridShape", () => ({
  default: () => null,
}));

describe("NotFound page integration", () => {
  it("renders ERROR heading", () => {
    render(<NotFound />);
    expect(screen.getByRole("heading", { name: "ERROR" })).toBeInTheDocument();
  });

  it("renders message text", () => {
    render(<NotFound />);
    expect(screen.getByText(/find the page/i)).toBeInTheDocument();
  });

  it("renders back to home link", () => {
    render(<NotFound />);
    expect(screen.getByRole("link", { name: /Back to Home/i })).toHaveAttribute("href", "/");
  });

  it("renders 404 images", () => {
    render(<NotFound />);
    const images = screen.getAllByAltText("404");
    expect(images.length).toBeGreaterThanOrEqual(1);
  });

  it("renders copyright footer", () => {
    render(<NotFound />);
    expect(screen.getByText(/TailAdmin/)).toBeInTheDocument();
  });
});
