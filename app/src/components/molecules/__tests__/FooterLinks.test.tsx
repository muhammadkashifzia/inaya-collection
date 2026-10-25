import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { FooterLinks } from "../FooterLinks";

describe("FooterLinks", () => {
  const column = {
    heading: "Information",
    links: [
      { label: "About Us", href: "/pages/about" },
      { label: "Contact", href: "/pages/contact" },
    ],
  };

  it("renders the heading", () => {
    render(<FooterLinks column={column} />);
    expect(screen.getByRole("heading", { name: "Information" })).toBeInTheDocument();
  });

  it("renders all links", () => {
    render(<FooterLinks column={column} />);
    expect(screen.getByRole("link", { name: "About Us" })).toHaveAttribute("href", "/pages/about");
    expect(screen.getByRole("link", { name: "Contact" })).toHaveAttribute("href", "/pages/contact");
  });

  it("has accessible nav label", () => {
    render(<FooterLinks column={column} />);
    expect(screen.getByRole("navigation", { name: "Information" })).toBeInTheDocument();
  });
});
