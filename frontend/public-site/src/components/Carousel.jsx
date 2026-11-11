import { useCallback, useEffect, useState } from "react";

const AUTOPLAY_MS = 6000;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true,
  );
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}

function paragraphs(text) {
  return String(text ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export default function Carousel({ slides }) {
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focusedWithin, setFocusedWithin] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  const autoPaused = paused || hovered || focusedWithin || reducedMotion || count <= 1;

  useEffect(() => {
    if (autoPaused) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [autoPaused, count]);

  const goTo = useCallback((i) => setIndex(((i % count) + count) % count), [count]);

  return (
    <section
      className="carousel"
      aria-label="Featured"
      aria-roledescription="carousel"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocusedWithin(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocusedWithin(false);
      }}
    >
      <div className="carousel-slides">
        {slides.map((slide, i) => {
          const active = i === index;
          return (
            <div
              key={i}
              className={`slide${active ? " slide--active" : ""}`}
              aria-hidden={!active}
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
            >
              <img className="slide-image" src={slide.imageUrl} alt="" />
              {(slide.title || slide.text) && (
                <div className="slide-overlay">
                  {slide.title && <h3 className="slide-title">{slide.title}</h3>}
                  {slide.text &&
                    paragraphs(slide.text).map((para, j) => <p key={j}>{para}</p>)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            className="carousel-arrow carousel-arrow--prev"
            aria-label="Previous slide"
            onClick={() => goTo(index - 1)}
          >
            ‹
          </button>
          <button
            type="button"
            className="carousel-arrow carousel-arrow--next"
            aria-label="Next slide"
            onClick={() => goTo(index + 1)}
          >
            ›
          </button>
          <div className="carousel-dots" role="group" aria-label="Choose slide">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`carousel-dot${i === index ? " carousel-dot--active" : ""}`}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
          <button
            type="button"
            className="carousel-pause"
            aria-pressed={paused}
            aria-label={paused ? "Play slideshow" : "Pause slideshow"}
            onClick={() => setPaused((p) => !p)}
          >
            {paused ? "▶" : "❚❚"}
          </button>
        </>
      )}
    </section>
  );
}
