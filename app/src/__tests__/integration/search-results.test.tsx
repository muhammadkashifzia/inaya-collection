/**
 * Integration test: SearchResults component with API mocking.
 */
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "../helpers";
import { fakeProduct } from "../helpers";
import { SearchResults } from "@/app/search/SearchResults";

// Need to override the next/navigation mock specifically for search
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("q=silk"),
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/search",
}));

describe("SearchResults integration", () => {
  it("shows search form with input", () => {
    render(<SearchResults />);
    expect(screen.getByRole("search")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search/i)).toBeInTheDocument();
  });

  it("shows Search button", () => {
    render(<SearchResults />);
    expect(screen.getByRole("button", { name: /Search/i })).toBeInTheDocument();
  });

  it("has accessible label for search input", () => {
    render(<SearchResults />);
    expect(screen.getByLabelText(/Search products/i)).toBeInTheDocument();
  });

  it("pre-fills input with query from URL params", () => {
    render(<SearchResults />);
    expect(screen.getByDisplayValue("silk")).toBeInTheDocument();
  });
});
