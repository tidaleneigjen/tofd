import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Carousel from "./Carousel";

afterEach(cleanup);

const SLIDES = [
  { imageUrl: "/images/a.jpg", title: "First", text: "One" },
  { imageUrl: "/images/b.jpg", title: "Second" },
  { imageUrl: "/images/c.jpg", text: "Three" },
];

function activeIndex(container) {
  return [...container.querySelectorAll(".slide")].findIndex((el) =>
    el.classList.contains("slide--active"),
  );
}

describe("Carousel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // jsdom has no matchMedia — default to no preference.
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders all slides with only the first active", () => {
    const { container } = render(<Carousel slides={SLIDES} />);
    expect(container.querySelectorAll(".slide")).toHaveLength(3);
    expect(activeIndex(container)).toBe(0);
    expect(container.querySelectorAll(".slide")[1].getAttribute("aria-hidden")).toBe("true");
  });

  it("shows dots and arrows for multiple slides", () => {
    render(<Carousel slides={SLIDES} />);
    expect(screen.getByRole("button", { name: "Go to slide 1" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Go to slide 3" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Previous slide" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Next slide" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Pause slideshow" })).toBeTruthy();
  });

  it("navigates with dots and arrows", () => {
    const { container } = render(<Carousel slides={SLIDES} />);
    fireEvent.click(screen.getByRole("button", { name: "Go to slide 3" }));
    expect(activeIndex(container)).toBe(2);
    fireEvent.click(screen.getByRole("button", { name: "Next slide" }));
    expect(activeIndex(container)).toBe(0); // wraps
    fireEvent.click(screen.getByRole("button", { name: "Previous slide" }));
    expect(activeIndex(container)).toBe(2);
  });

  it("auto-advances every 6 seconds", () => {
    const { container } = render(<Carousel slides={SLIDES} />);
    act(() => vi.advanceTimersByTime(6000));
    expect(activeIndex(container)).toBe(1);
    act(() => vi.advanceTimersByTime(6000));
    expect(activeIndex(container)).toBe(2);
  });

  it("pause button stops auto-advance", () => {
    const { container } = render(<Carousel slides={SLIDES} />);
    fireEvent.click(screen.getByRole("button", { name: "Pause slideshow" }));
    act(() => vi.advanceTimersByTime(12000));
    expect(activeIndex(container)).toBe(0);
  });

  it("does not auto-advance under prefers-reduced-motion", () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    const { container } = render(<Carousel slides={SLIDES} />);
    act(() => vi.advanceTimersByTime(12000));
    expect(activeIndex(container)).toBe(0);
  });

  it("renders a single slide without controls", () => {
    render(<Carousel slides={[SLIDES[0]]} />);
    expect(screen.queryByRole("button", { name: "Next slide" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Go to slide/ })).toBeNull();
  });
});
