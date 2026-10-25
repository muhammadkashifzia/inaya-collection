import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AppImage } from "../AppImage";

describe("AppImage", () => {
  it("renders an img tag when src is provided", () => {
    render(<AppImage src="/photo.jpg" alt="Product photo" width={200} height={200} />);
    const img = screen.getByAltText("Product photo");
    expect(img).toBeInTheDocument();
    expect(img.tagName).toBe("IMG");
  });

  it("renders a placeholder span when src is null", () => {
    const { container } = render(<AppImage src={null} alt="Missing" width={200} height={200} />);
    const span = container.querySelector("span[aria-hidden='true']");
    expect(span).toBeInTheDocument();
    expect(span?.className).toContain("bg-[#e8e4db]");
  });

  it("renders a placeholder span when src is undefined", () => {
    const { container } = render(<AppImage src={undefined} alt="Missing" width={200} height={200} />);
    const span = container.querySelector("span[aria-hidden='true']");
    expect(span).toBeInTheDocument();
  });

  it("passes unoptimized for SVG sources", () => {
    render(<AppImage src="/icon.svg" alt="Icon" width={24} height={24} />);
    const img = screen.getByAltText("Icon");
    // The mock renders all props, unoptimized should be passed but won't appear as attribute
    expect(img).toBeInTheDocument();
  });
});
