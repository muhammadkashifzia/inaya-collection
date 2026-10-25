/**
 * Integration test: Error and NotFound pages render correctly
 * with atoms composing into functional error states.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

import ErrorPage from "@/app/error";
import NotFound from "@/app/not-found";

describe("ErrorPage integration", () => {
  it("renders error heading and message", () => {
    const error = new Error("API failure");
    render(<ErrorPage error={error} reset={vi.fn()} />);
    expect(screen.getByRole("heading", { name: /Something went wrong/i })).toBeInTheDocument();
    expect(screen.getByText(/couldn.*t load this page/i)).toBeInTheDocument();
  });

  it("renders Try again button that calls reset", async () => {
    const user = userEvent.setup();
    const reset = vi.fn();
    render(<ErrorPage error={new Error("test")} reset={reset} />);
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledOnce();
  });

  it("renders Back to home link", () => {
    render(<ErrorPage error={new Error("test")} reset={vi.fn()} />);
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/");
  });
});

describe("NotFound page integration", () => {
  it("renders 404 heading", () => {
    render(<NotFound />);
    expect(screen.getByRole("heading", { name: /Page not found/i })).toBeInTheDocument();
  });

  it("renders message text", () => {
    render(<NotFound />);
    expect(screen.getByText(/doesn.*t exist or has moved/i)).toBeInTheDocument();
  });

  it("renders link back to home", () => {
    render(<NotFound />);
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/");
  });
});
