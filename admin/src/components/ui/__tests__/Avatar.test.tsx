import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Avatar from "@/components/ui/avatar/Avatar";

describe("Avatar", () => {
  it("renders an image with src and alt", () => {
    render(<Avatar src="/avatar.jpg" alt="User photo" />);
    const img = screen.getByAltText("User photo");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/avatar.jpg");
  });

  it("uses default alt text", () => {
    render(<Avatar src="/avatar.jpg" />);
    expect(screen.getByAltText("User Avatar")).toBeInTheDocument();
  });

  it("applies medium size by default", () => {
    const { container } = render(<Avatar src="/a.jpg" />);
    expect(container.firstChild).toHaveClass("h-10", "w-10");
  });

  it("applies xsmall size", () => {
    const { container } = render(<Avatar src="/a.jpg" size="xsmall" />);
    expect(container.firstChild).toHaveClass("h-6", "w-6");
  });

  it("applies xlarge size", () => {
    const { container } = render(<Avatar src="/a.jpg" size="xlarge" />);
    expect(container.firstChild).toHaveClass("h-14", "w-14");
  });

  it("does not show status indicator when status is none", () => {
    const { container } = render(<Avatar src="/a.jpg" status="none" />);
    expect(container.querySelectorAll("span")).toHaveLength(0);
  });

  it("shows online status indicator", () => {
    const { container } = render(<Avatar src="/a.jpg" status="online" />);
    const indicator = container.querySelector("span");
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveClass("bg-success-500");
  });

  it("shows offline status indicator", () => {
    const { container } = render(<Avatar src="/a.jpg" status="offline" />);
    const indicator = container.querySelector("span");
    expect(indicator).toHaveClass("bg-error-400");
  });

  it("shows busy status indicator", () => {
    const { container } = render(<Avatar src="/a.jpg" status="busy" />);
    const indicator = container.querySelector("span");
    expect(indicator).toHaveClass("bg-warning-500");
  });

  it("merges custom className", () => {
    const { container } = render(<Avatar src="/a.jpg" className="border-2" />);
    expect(container.firstChild).toHaveClass("border-2");
  });
});
