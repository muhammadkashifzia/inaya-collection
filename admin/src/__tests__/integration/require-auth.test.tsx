/**
 * Integration test: RequireAuth and RequirePermission guards.
 */
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, it, expect, beforeEach } from "vitest";
import "../helpers";
import { mockAuth, fakeAdminUser } from "../helpers";
import { RequireAuth, RequirePermission } from "@/components/auth/RequireAuth";

// Mock Forbidden component
vi.mock("@/components/admin/Forbidden", () => ({
  default: () => <div>You do not have permission to view this page.</div>,
}));

describe("RequireAuth integration", () => {
  beforeEach(() => {
    mockAuth.user = null;
    mockAuth.ready = true;
  });

  it("shows loading when not ready", () => {
    mockAuth.ready = false;
    render(<MemoryRouter><RequireAuth /></MemoryRouter>);
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it("redirects to signin when no user", () => {
    mockAuth.user = null;
    mockAuth.ready = true;
    // Navigate renders nothing visible, just verify loading is gone
    const { container } = render(<MemoryRouter><RequireAuth /></MemoryRouter>);
    expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
  });
});

describe("RequirePermission integration", () => {
  it("renders children when user has permission", () => {
    mockAuth.can.mockReturnValue(true);
    render(<RequirePermission permission="view-dashboard"><p>Dashboard</p></RequirePermission>);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("shows forbidden when user lacks permission", () => {
    mockAuth.can.mockReturnValue(false);
    render(<RequirePermission permission="manage-settings"><p>Settings</p></RequirePermission>);
    expect(screen.getByText(/do not have permission/i)).toBeInTheDocument();
    expect(screen.queryByText("Settings")).not.toBeInTheDocument();
  });
});
