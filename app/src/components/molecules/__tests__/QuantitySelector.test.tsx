import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { QuantitySelector } from "../QuantitySelector";

describe("QuantitySelector", () => {
  it("renders current value", () => {
    render(<QuantitySelector value={3} onChange={() => {}} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders increase and decrease buttons", () => {
    render(<QuantitySelector value={2} onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Decrease quantity" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Increase quantity" })).toBeInTheDocument();
  });

  it("calls onChange with decremented value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<QuantitySelector value={3} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Decrease quantity" }));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("calls onChange with incremented value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<QuantitySelector value={3} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Increase quantity" }));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it("disables decrease button at min value", () => {
    render(<QuantitySelector value={1} onChange={() => {}} min={1} />);
    expect(screen.getByRole("button", { name: "Decrease quantity" })).toBeDisabled();
  });

  it("disables increase button at max value", () => {
    render(<QuantitySelector value={10} onChange={() => {}} max={10} />);
    expect(screen.getByRole("button", { name: "Increase quantity" })).toBeDisabled();
  });

  it("disables both buttons when disabled prop is true", () => {
    render(<QuantitySelector value={5} onChange={() => {}} disabled />);
    expect(screen.getByRole("button", { name: "Decrease quantity" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Increase quantity" })).toBeDisabled();
  });

  it("clamps decrease to min", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<QuantitySelector value={2} onChange={onChange} min={1} />);
    await user.click(screen.getByRole("button", { name: "Decrease quantity" }));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it("clamps increase to max", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<QuantitySelector value={9} onChange={onChange} max={10} />);
    await user.click(screen.getByRole("button", { name: "Increase quantity" }));
    expect(onChange).toHaveBeenCalledWith(10);
  });

  it("has accessible group label", () => {
    render(<QuantitySelector value={1} onChange={() => {}} label="Item Quantity" />);
    expect(screen.getByRole("group", { name: "Item Quantity" })).toBeInTheDocument();
  });
});
