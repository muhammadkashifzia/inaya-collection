import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { IconButton } from "../IconButton";

describe("IconButton", () => {
  it("renders a button with aria-label", () => {
    render(<IconButton icon="heart" label="Add to wishlist" />);
    expect(screen.getByRole("button", { name: "Add to wishlist" })).toBeInTheDocument();
  });

  it("defaults to type='button'", () => {
    render(<IconButton icon="close" label="Close" />);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("renders an svg icon inside", () => {
    const { container } = render(<IconButton icon="search" label="Search" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("shows badge count when badge is provided", () => {
    render(<IconButton icon="bag" label="Cart" badge={3} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("does not show badge when badge is 0", () => {
    render(<IconButton icon="bag" label="Cart" badge={0} />);
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("fires onClick handler", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<IconButton icon="menu" label="Menu" onClick={onClick} />);
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("merges custom className", () => {
    render(<IconButton icon="user" label="Profile" className="ml-2" />);
    expect(screen.getByRole("button").className).toContain("ml-2");
  });
});
