/**
 * Integration test: DataState wrapper handles loading, error, empty,
 * and success states for API-driven screens.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import DataState from "@/components/admin/DataState";
import { ApiError } from "@/lib/api";

describe("DataState integration", () => {
  it("shows loading skeleton when loading without data", () => {
    render(<DataState loading={true} error={null}><p>Content</p></DataState>);
    expect(screen.getByLabelText("Loading")).toBeInTheDocument();
    expect(screen.queryByText("Content")).not.toBeInTheDocument();
  });

  it("shows error message when error without data", () => {
    const error = new ApiError("Network error", 0) as ApiError;
    render(<DataState loading={false} error={error}><p>Content</p></DataState>);
    expect(screen.getByRole("alert")).toHaveTextContent("Network error");
    expect(screen.queryByText("Content")).not.toBeInTheDocument();
  });

  it("shows retry button on error", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const error = new ApiError("Failed", 500) as ApiError;
    render(<DataState loading={false} error={error} onRetry={onRetry}><p>Content</p></DataState>);
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("shows empty state when empty is true", () => {
    render(<DataState loading={false} error={null} empty={true}><p>Content</p></DataState>);
    expect(screen.getByText("Nothing here yet.")).toBeInTheDocument();
    expect(screen.queryByText("Content")).not.toBeInTheDocument();
  });

  it("shows custom empty title", () => {
    render(<DataState loading={false} error={null} empty={true} emptyTitle="No products found."><p>Content</p></DataState>);
    expect(screen.getByText("No products found.")).toBeInTheDocument();
  });

  it("shows empty action when provided", () => {
    render(<DataState loading={false} error={null} empty={true} emptyAction={<button>Add first</button>}><p>Content</p></DataState>);
    expect(screen.getByRole("button", { name: "Add first" })).toBeInTheDocument();
  });

  it("renders children on success", () => {
    render(<DataState loading={false} error={null}><p>Dashboard content</p></DataState>);
    expect(screen.getByText("Dashboard content")).toBeInTheDocument();
  });

  it("keeps stale children visible while reloading (hasData=true)", () => {
    render(<DataState loading={true} error={null} hasData={true}><p>Stale content</p></DataState>);
    expect(screen.getByText("Stale content")).toBeInTheDocument();
  });

  it("keeps stale children on error when hasData", () => {
    const error = new ApiError("Refresh failed", 500) as ApiError;
    render(<DataState loading={false} error={error} hasData={true}><p>Old content</p></DataState>);
    expect(screen.getByText("Old content")).toBeInTheDocument();
  });
});
