import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Button, ButtonLink } from "../Button";

describe("Button", () => {
  it("renders children text", () => {
    render(<Button>Add to Cart</Button>);
    expect(screen.getByText("Add to Cart")).toBeInTheDocument();
  });

  it("defaults to type='button'", () => {
    render(<Button>Click</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("allows type override to submit", () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });

  it("calls onClick handler", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    await user.click(screen.getByText("Click Me"));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("applies primary variant by default", () => {
    render(<Button>Primary</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("bg-brand");
    expect(btn.className).toContain("text-white");
  });

  it("applies secondary variant", () => {
    render(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole("button").className).toContain("bg-ink");
  });

  it("applies outline variant", () => {
    render(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole("button").className).toContain("border-ink");
  });

  it("applies ghost variant", () => {
    render(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole("button").className).toContain("text-ink");
  });

  it("applies size classes", () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole("button").className).toContain("h-9");

    rerender(<Button size="md">Medium</Button>);
    expect(screen.getByRole("button").className).toContain("h-11");

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole("button").className).toContain("h-12");
  });

  it("applies fullWidth class", () => {
    render(<Button fullWidth>Full</Button>);
    expect(screen.getByRole("button").className).toContain("w-full");
  });

  it("supports disabled state", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("merges custom className", () => {
    render(<Button className="mt-4">Custom</Button>);
    expect(screen.getByRole("button").className).toContain("mt-4");
  });
});

describe("ButtonLink", () => {
  it("renders as a link with href", () => {
    render(<ButtonLink href="/shop">Shop Now</ButtonLink>);
    const link = screen.getByRole("link", { name: "Shop Now" });
    expect(link).toHaveAttribute("href", "/shop");
  });

  it("applies variant styling", () => {
    render(<ButtonLink href="/" variant="outline">Outline Link</ButtonLink>);
    const link = screen.getByRole("link");
    expect(link.className).toContain("border-ink");
  });

  it("applies fullWidth", () => {
    render(<ButtonLink href="/" fullWidth>Full Link</ButtonLink>);
    expect(screen.getByRole("link").className).toContain("w-full");
  });
});
