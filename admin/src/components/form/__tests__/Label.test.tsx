import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Label from "@/components/form/Label";

describe("Label", () => {
  it("renders children text", () => {
    render(<Label>Email</Label>);
    expect(screen.getByText("Email")).toBeInTheDocument();
  });

  it("renders as label element", () => {
    render(<Label>Name</Label>);
    expect(screen.getByText("Name").tagName).toBe("LABEL");
  });

  it("sets htmlFor attribute", () => {
    render(<Label htmlFor="email-input">Email</Label>);
    expect(screen.getByText("Email")).toHaveAttribute("for", "email-input");
  });

  it("merges custom className", () => {
    render(<Label className="text-red-500">Error Label</Label>);
    expect(screen.getByText("Error Label").className).toContain("text-red-500");
  });
});
