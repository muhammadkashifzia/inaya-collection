/**
 * Integration test: Wishlist page with different auth/data states.
 */
import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import "../helpers";
import { mockStore, fakeProduct } from "../helpers";
import WishlistPage from "@/app/wishlist/page";

describe("WishlistPage integration", () => {
  beforeEach(() => {
    mockStore.user = null;
    mockStore.authReady = true;
    mockStore.wishlist = [];
  });

  it("shows sign-in prompt for unauthenticated user with no saved items", () => {
    render(<WishlistPage />);
    expect(screen.getByText(/haven.*t saved anything yet/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Sign in/i })).toHaveAttribute("href", expect.stringContaining("/account/login"));
  });

  it("shows saved count for guest with local wishlist items", () => {
    mockStore.wishlist = [1, 2, 3];
    render(<WishlistPage />);
    expect(screen.getByText(/saved 3 items/i)).toBeInTheDocument();
  });

  it("renders page heading", () => {
    render(<WishlistPage />);
    expect(screen.getByRole("heading", { name: "Wishlist" })).toBeInTheDocument();
  });
});
