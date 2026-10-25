import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useModal } from "@/hooks/useModal";

describe("useModal", () => {
  it("defaults to closed", () => {
    const { result } = renderHook(() => useModal());
    expect(result.current.isOpen).toBe(false);
  });

  it("accepts initial state", () => {
    const { result } = renderHook(() => useModal(true));
    expect(result.current.isOpen).toBe(true);
  });

  it("opens modal", () => {
    const { result } = renderHook(() => useModal());
    act(() => result.current.openModal());
    expect(result.current.isOpen).toBe(true);
  });

  it("closes modal", () => {
    const { result } = renderHook(() => useModal(true));
    act(() => result.current.closeModal());
    expect(result.current.isOpen).toBe(false);
  });

  it("toggles modal", () => {
    const { result } = renderHook(() => useModal());
    act(() => result.current.toggleModal());
    expect(result.current.isOpen).toBe(true);
    act(() => result.current.toggleModal());
    expect(result.current.isOpen).toBe(false);
  });
});
