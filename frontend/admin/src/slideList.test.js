import { describe, expect, it } from "vitest";
import {
  MAX_SLIDES,
  addSlide,
  moveSlide,
  newSlide,
  removeSlide,
  slideForSave,
  updateSlide,
} from "./slideList";

const SLIDES = [
  { imageUrl: "/images/a.jpg", title: "A", text: "" },
  { imageUrl: "/images/b.jpg", title: "", text: "B" },
];

describe("slide list helpers", () => {
  it("adds a slide up to the max", () => {
    let slides = [SLIDES[0]];
    slides = addSlide(slides);
    expect(slides).toHaveLength(2);
    expect(slides[1].imageUrl).toMatch(/^\/images\//);

    slides = Array.from({ length: MAX_SLIDES }, () => newSlide());
    expect(addSlide(slides)).toHaveLength(MAX_SLIDES);
  });

  it("removes a slide but never below one", () => {
    expect(removeSlide(SLIDES, 0)).toHaveLength(1);
    expect(removeSlide([SLIDES[0]], 0)).toHaveLength(1);
    expect(removeSlide(SLIDES, 5)).toHaveLength(2); // out of range: unchanged
  });

  it("moves slides and refuses out-of-range moves", () => {
    const moved = moveSlide(SLIDES, 0, 1);
    expect(moved[0].title).toBe("");
    expect(moved[1].title).toBe("A");
    expect(moveSlide(SLIDES, 0, -1)).toEqual(SLIDES); // can't move above 0
    expect(moveSlide(SLIDES, 1, 1)).toEqual(SLIDES); // can't move below end
    expect(moveSlide(SLIDES, 9, 1)).toEqual(SLIDES);
  });

  it("updates a single field immutably", () => {
    const next = updateSlide(SLIDES, 1, "title", "New");
    expect(next[1].title).toBe("New");
    expect(SLIDES[1].title).toBe(""); // original untouched
  });

  it("omits empty optional fields for save", () => {
    expect(slideForSave({ imageUrl: "/images/a.jpg", title: "", text: "" })).toEqual({
      imageUrl: "/images/a.jpg",
    });
    expect(slideForSave({ imageUrl: "/images/a.jpg", title: "T", text: "X" })).toEqual({
      imageUrl: "/images/a.jpg",
      title: "T",
      text: "X",
    });
  });
});
