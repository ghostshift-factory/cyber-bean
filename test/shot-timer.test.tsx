// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ShotTimer } from "@/components/ShotTimer";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function readout() {
  return screen.getByRole("timer").textContent;
}

describe("ShotTimer", () => {
  it("renders 0 while idle with a Start control", () => {
    render(<ShotTimer onStop={vi.fn()} />);

    expect(readout()).toBe("00");
    expect(screen.getByRole("button", { name: /start/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /stop/i })).toBeNull();
  });

  it("counts up from zero after Start and stays visible while running", () => {
    render(<ShotTimer onStop={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /start/i }));
    expect(readout()).toBe("00");

    act(() => vi.advanceTimersByTime(1_000));
    expect(readout()).toBe("01");

    act(() => vi.advanceTimersByTime(27_500));
    expect(readout()).toBe("28");
  });

  it("passes the elapsed whole seconds to onStop when stopped", () => {
    const onStop = vi.fn();
    render(<ShotTimer onStop={onStop} />);

    fireEvent.click(screen.getByRole("button", { name: /start/i }));
    act(() => vi.advanceTimersByTime(31_400));
    fireEvent.click(screen.getByRole("button", { name: /stop/i }));

    expect(onStop).toHaveBeenCalledExactlyOnceWith(31);
    // The readout freezes on the reported value and the control flips back.
    expect(readout()).toBe("31");
    expect(screen.getByRole("button", { name: /start/i })).toBeTruthy();
  });

  it("does not fire onStop or advance the readout after being stopped", () => {
    const onStop = vi.fn();
    render(<ShotTimer onStop={onStop} />);

    fireEvent.click(screen.getByRole("button", { name: /start/i }));
    act(() => vi.advanceTimersByTime(5_000));
    fireEvent.click(screen.getByRole("button", { name: /stop/i }));

    act(() => vi.advanceTimersByTime(10_000));
    expect(readout()).toBe("05");
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it("resets to zero and times a fresh run when started again after a stop", () => {
    const onStop = vi.fn();
    render(<ShotTimer onStop={onStop} />);

    fireEvent.click(screen.getByRole("button", { name: /start/i }));
    act(() => vi.advanceTimersByTime(24_000));
    fireEvent.click(screen.getByRole("button", { name: /stop/i }));
    expect(onStop).toHaveBeenLastCalledWith(24);

    // Second pull: the previous run's 24 s must not leak into the new one.
    fireEvent.click(screen.getByRole("button", { name: /start/i }));
    expect(readout()).toBe("00");

    act(() => vi.advanceTimersByTime(12_700));
    expect(readout()).toBe("12");
    fireEvent.click(screen.getByRole("button", { name: /stop/i }));

    expect(onStop).toHaveBeenCalledTimes(2);
    expect(onStop).toHaveBeenLastCalledWith(12);
  });

  it("cleans up its interval on unmount while running", () => {
    const { unmount } = render(<ShotTimer onStop={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /start/i }));
    unmount();

    // Any orphaned interval would throw on state updates after unmount.
    expect(() => vi.advanceTimersByTime(5_000)).not.toThrow();
  });
});
