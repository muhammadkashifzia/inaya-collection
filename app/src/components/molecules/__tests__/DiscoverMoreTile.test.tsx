import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DiscoverMoreTile } from "../DiscoverMoreTile";

describe("DiscoverMoreTile", () => {
  it("shows 'Discover X More' when remaining > 0", () => {
    render(<DiscoverMoreTile href="/collections/winter" image="img.jpg" remaining={15} />);
    expect(screen.getByText("Discover 15 More")).toBeInTheDocument();
  });

  it("shows 'View Collection' when remaining is 0", () => {
    render(<DiscoverMoreTile href="/collections/winter" image="img.jpg" remaining={0} />);
    expect(screen.getByText("View Collection")).toBeInTheDocument();
  });

  it("renders a link with correct href", () => {
    render(<DiscoverMoreTile href="/collections/all" image="img.jpg" remaining={5} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/collections/all");
  });

  it("always shows Explore button", () => {
    render(<DiscoverMoreTile href="/x" image={null} remaining={3} />);
    expect(screen.getByText("Explore")).toBeInTheDocument();
  });
});
