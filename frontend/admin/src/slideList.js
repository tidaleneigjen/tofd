import { SLIDE_IMAGES } from "./defaults";

export const MAX_SLIDES = 8;

export function newSlide(imageUrl = SLIDE_IMAGES[0].value) {
  return { imageUrl, title: "", text: "" };
}

export function addSlide(slides) {
  if (slides.length >= MAX_SLIDES) return slides;
  return [...slides, newSlide()];
}

export function removeSlide(slides, index) {
  if (slides.length <= 1 || index < 0 || index >= slides.length) return slides;
  return slides.filter((_, i) => i !== index);
}

export function moveSlide(slides, index, direction) {
  const target = index + direction;
  if (index < 0 || index >= slides.length || target < 0 || target >= slides.length) return slides;
  const next = [...slides];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function updateSlide(slides, index, field, value) {
  return slides.map((s, i) => (i === index ? { ...s, [field]: value } : s));
}

// Shape sent to the API: optional title/text are omitted when empty.
export function slideForSave(slide) {
  const clean = { imageUrl: slide.imageUrl };
  if (slide.title) clean.title = slide.title;
  if (slide.text) clean.text = slide.text;
  return clean;
}
