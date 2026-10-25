import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Icon, type IconName } from "../Icon";

describe("Icon", () => {
  it("renders an svg element", () => {
    const { container } = render(<Icon name="heart" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("sets aria-hidden to true", () => {
    const { container } = render(<Icon name="search" />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("sets focusable to false", () => {
    const { container } = render(<Icon name="bag" />);
    expect(container.querySelector("svg")).toHaveAttribute("focusable", "false");
  });

  it("uses default size of 22", () => {
    const { container } = render(<Icon name="home" />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("width")).toBe("22");
    expect(svg.getAttribute("height")).toBe("22");
  });

  it("accepts custom size", () => {
    const { container } = render(<Icon name="close" size={32} />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("width")).toBe("32");
  });

  it("renders unfilled by default (stroke only)", () => {
    const { container } = render(<Icon name="heart" />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("fill")).toBe("none");
  });

  it("renders filled when filled prop is true", () => {
    const { container } = render(<Icon name="heart" filled />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("fill")).toBe("currentColor");
  });

  it("renders all icon names without error", () => {
    const icons: IconName[] = [
      "menu", "close", "search", "bag", "heart", "bagPlus", "user", "home",
      "grid", "truck", "shield", "map", "lock", "chevronLeft", "chevronRight",
      "plus", "minus", "check", "trash", "phone", "mail", "chat", "clock",
    ];
    icons.forEach((name) => {
      const { container } = render(<Icon name={name} />);
      expect(container.querySelector("svg")).toBeInTheDocument();
    });
  });
});
