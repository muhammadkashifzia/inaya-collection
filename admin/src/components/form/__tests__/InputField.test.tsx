import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import Input from "@/components/form/input/InputField";

describe("InputField", () => {
  it("renders an input element", () => {
    render(<Input placeholder="Enter email" />);
    expect(screen.getByPlaceholderText("Enter email")).toBeInTheDocument();
  });

  it("defaults to text type", () => {
    render(<Input id="test" />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("accepts value and onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Input value="" onChange={onChange} placeholder="Type" />);
    await user.type(screen.getByPlaceholderText("Type"), "hello");
    expect(onChange).toHaveBeenCalled();
  });

  it("renders as disabled", () => {
    render(<Input disabled placeholder="Disabled" />);
    expect(screen.getByPlaceholderText("Disabled")).toBeDisabled();
  });

  it("shows hint text", () => {
    render(<Input hint="Enter your email address" />);
    expect(screen.getByText("Enter your email address")).toBeInTheDocument();
  });

  it("applies error styling when error is true", () => {
    render(<Input error placeholder="Error input" />);
    expect(screen.getByPlaceholderText("Error input").className).toContain("border-error-500");
  });

  it("applies success styling when success is true", () => {
    render(<Input success placeholder="Success input" />);
    expect(screen.getByPlaceholderText("Success input").className).toContain("border-success-500");
  });

  it("shows error hint in red", () => {
    render(<Input error hint="Invalid email" />);
    expect(screen.getByText("Invalid email").className).toContain("text-error-500");
  });

  it("shows success hint in green", () => {
    render(<Input success hint="Looks good!" />);
    expect(screen.getByText("Looks good!").className).toContain("text-success-500");
  });

  it("accepts number type with min/max", () => {
    render(<Input type="number" min={0} max={100} placeholder="Amount" />);
    const input = screen.getByPlaceholderText("Amount");
    expect(input).toHaveAttribute("type", "number");
    expect(input).toHaveAttribute("min", "0");
    expect(input).toHaveAttribute("max", "100");
  });
});
