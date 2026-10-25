import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AnnouncementBar } from "../AnnouncementBar";

describe("AnnouncementBar", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("returns null when messages is empty", () => {
    const { container } = render(<AnnouncementBar messages={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders a single message", () => {
    render(<AnnouncementBar messages={["Free Shipping!"]} />);
    expect(screen.getByText("Free Shipping!")).toBeInTheDocument();
  });

  it("has aria-live polite for accessibility", () => {
    render(<AnnouncementBar messages={["Sale"]} />);
    expect(screen.getByText("Sale").closest("[aria-live]")).toHaveAttribute("aria-live", "polite");
  });

  it("rotates messages every 4 seconds", () => {
    render(<AnnouncementBar messages={["Message 1", "Message 2", "Message 3"]} />);
    expect(screen.getByText("Message 1")).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(4000); });
    expect(screen.getByText("Message 2")).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(4000); });
    expect(screen.getByText("Message 3")).toBeInTheDocument();
  });

  it("loops back to first message after last", () => {
    render(<AnnouncementBar messages={["A", "B"]} />);
    act(() => { vi.advanceTimersByTime(4000); }); // B
    act(() => { vi.advanceTimersByTime(4000); }); // back to A
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("does not rotate when only one message", () => {
    render(<AnnouncementBar messages={["Only"]} />);
    act(() => { vi.advanceTimersByTime(12000); });
    expect(screen.getByText("Only")).toBeInTheDocument();
  });
});
