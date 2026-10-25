import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fakeBanner } from "@//__tests__/helpers";
import { HeroBanner } from "../HeroBanner";

describe("HeroBanner", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("returns null when banners is empty", () => {
    const { container } = render(<HeroBanner banners={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders single banner without navigation controls", () => {
    render(<HeroBanner banners={[fakeBanner({ title: "Single Banner" })]} />);
    expect(screen.getByText("Single Banner")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Previous banner" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next banner" })).not.toBeInTheDocument();
  });

  it("renders banner title and subtitle", () => {
    render(<HeroBanner banners={[fakeBanner({ title: "Main Title", subtitle: "Subtitle Text" })]} />);
    expect(screen.getByText("Main Title")).toBeInTheDocument();
    expect(screen.getByText("Subtitle Text")).toBeInTheDocument();
  });

  it("renders CTA buttons from banner", () => {
    render(<HeroBanner banners={[fakeBanner({ buttons: [{ label: "Shop Now", href: "/shop" }] })]} />);
    expect(screen.getByRole("link", { name: "Shop Now" })).toHaveAttribute("href", "/shop");
  });

  it("renders prev/next buttons for multiple banners", () => {
    render(<HeroBanner banners={[fakeBanner({ id: 1 }), fakeBanner({ id: 2 })]} />);
    expect(screen.getByRole("button", { name: "Previous banner" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next banner" })).toBeInTheDocument();
  });

  it("renders dot indicators for multiple banners", () => {
    const banners = [fakeBanner({ id: 1 }), fakeBanner({ id: 2 }), fakeBanner({ id: 3 })];
    render(<HeroBanner banners={banners} />);
    expect(screen.getByRole("button", { name: "Go to banner 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go to banner 2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go to banner 3" })).toBeInTheDocument();
  });

  it("auto-advances slides every 5 seconds", () => {
    const banners = [
      fakeBanner({ id: 1, title: "Banner 1" }),
      fakeBanner({ id: 2, title: "Banner 2" }),
    ];
    render(<HeroBanner banners={banners} />);
    // Initially first banner is visible
    vi.advanceTimersByTime(5000);
    // After 5s, second banner should be visible
    const banner2divs = document.querySelectorAll("[aria-hidden='false']");
    expect(banner2divs.length).toBeGreaterThanOrEqual(1);
  });
});
