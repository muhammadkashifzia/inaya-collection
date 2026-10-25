import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { BannerSection } from "../BannerSection";

describe("BannerSection", () => {
  it("returns null when no valid slides", () => {
    const { container } = render(<BannerSection title="Promo" slides={[{ image: null, text: null, link: null }]} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders title when provided", () => {
    render(<BannerSection title="Featured" slides={[{ image: "img.jpg", text: null, link: null }]} />);
    expect(screen.getByRole("heading", { name: /Featured/i })).toBeInTheDocument();
  });

  it("renders slide as link when link is present", () => {
    render(<BannerSection title="" slides={[{ image: "img.jpg", text: "Sale", link: "/sale" }]} />);
    // MobileSlider duplicates: mobile + desktop. Just check one exists
    const links = screen.getAllByRole("link");
    expect(links.some((l) => l.getAttribute("href") === "/sale")).toBe(true);
  });

  it("renders slide text overlay", () => {
    render(<BannerSection title="" slides={[{ image: "img.jpg", text: "Big Sale", link: null }]} />);
    expect(screen.getAllByText("Big Sale").length).toBeGreaterThanOrEqual(1);
  });

  it("filters out slides without images", () => {
    const slides = [
      { image: null, text: "No Image", link: null },
      { image: "valid.jpg", text: "Has Image", link: null },
    ];
    render(<BannerSection title="T" slides={slides} />);
    expect(screen.queryByText("No Image")).not.toBeInTheDocument();
    expect(screen.getAllByText("Has Image").length).toBeGreaterThanOrEqual(1);
  });
});
