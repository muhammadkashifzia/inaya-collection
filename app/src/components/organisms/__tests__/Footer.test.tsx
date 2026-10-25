import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import "@//__tests__/helpers";
import { fakeSiteConfig } from "@//__tests__/helpers";
import { Footer } from "../Footer";

describe("Footer", () => {
  it("renders the store name when no logo", () => {
    render(<Footer site={fakeSiteConfig({ footer: { columns: [], copyright: "2024", logoUrl: null } })} />);
    expect(screen.getByText("Inaya Collection")).toBeInTheDocument();
  });

  it("renders about text", () => {
    render(<Footer site={fakeSiteConfig({ about: "We sell fashion" })} />);
    expect(screen.getByText("We sell fashion")).toBeInTheDocument();
  });

  it("renders phone and email contact", () => {
    render(<Footer site={fakeSiteConfig({ phone: "0300-111", email: "info@test.com" })} />);
    expect(screen.getByText("0300-111")).toBeInTheDocument();
    expect(screen.getByText("info@test.com")).toBeInTheDocument();
  });

  it("renders footer columns", () => {
    render(<Footer site={fakeSiteConfig()} />);
    expect(screen.getByText("Info")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "About" })).toBeInTheDocument();
  });

  it("renders copyright", () => {
    render(<Footer site={fakeSiteConfig({ footer: { columns: [], copyright: "2024 Inaya Collection", logoUrl: null } })} />);
    expect(screen.getByText(/2024 Inaya Collection/)).toBeInTheDocument();
  });

  it("renders social links", () => {
    render(<Footer site={fakeSiteConfig({ social: [{ label: "Instagram", href: "https://instagram.com/inaya" }] })} />);
    expect(screen.getByRole("link", { name: "Instagram" })).toHaveAttribute("href", "https://instagram.com/inaya");
  });

  it("renders newsletter form", () => {
    render(<Footer site={fakeSiteConfig()} />);
    expect(screen.getByLabelText(/newsletter/i)).toBeInTheDocument();
  });
});
