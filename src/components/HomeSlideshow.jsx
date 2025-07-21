import { useEffect, useRef, useState } from "react";
import Slide from "./Slide";

const slides = [
  {
    title: "Labyrinth",
    image: "/public/labyrinth.jpg",
    imageTitle: "",
    imageText:
      "Our ordained ministers are working hard to bring ideas and dreams to fruition for us all. Exciting things are happening.",
    ctaText: "Learn More",
  },
  {
    title: "Temple News",
    image: "/public/window-tofd.jpg",
    imageTitle: "Monthly Business Meetings",
    imageText:
      "Zoom online meetings for Temple Business are happening! See our facebook page for the link!",
    ctaText: "RSVP",
  },
  {
    title: "Temple News",
    image: "/public/red-tent.jpg",
    imageTitle: "Red Tent: Virtual Edition",
    imageText: "Stay tuned for updates on Red Tent.",
    ctaText: "RSVP",
  },
  {
    title: "Temple News",
    image: "/public/window-tofd.jpg",
    imageTitle: "The Temple has moved!",
    imageText:
      "The Temple is no longer at 31 Central St in Bangor, ME. Please see our blog post for more information.",
    ctaText: "BLOG",
  },
  {
    title: "Temple News",
    image: "/public/temple-ritual.jpg",
    imageTitle: "Red Tent: Virtual Edition",
    imageText: "Stay tuned for updates on Red Tent.",
    ctaText: "RSVP",
  },
];

export default function HomeSlideshow() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);

  const goPrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const goNext = () => {
    setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const handleCtaClick = () => {
    alert(`CTA clicked on slide: ${slides[currentIndex].title}`);
  };

  useEffect(() => {
    if (!isPaused) {
      intervalRef.current = setInterval(goNext, 3000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPaused, currentIndex]);

  return (
    <div
      // className="relative w-full h-64 rounded-lg overflow-hidden shadow-lg group"
      className='relative w-full h-[500px] rounded-lg overflow-hidden shadow-lg'
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {slides.map((slide, i) => (
        <Slide
          key={i}
          title={slide.title}
          image={slide.image}
          imageText={slide.imageText}
          imageTitle={slide.imageTitle}
          ctaText={slide.ctaText}
          onCtaClick={handleCtaClick}
          isActive={i === currentIndex}
        />
      ))}

      <button
        onClick={goPrev}
        className='absolute top-1/2 left-4 transform -translate-y-1/2 z-30 bg-black bg-opacity-50 text-white text-4xl px-2 py-1 rounded-full shadow-lg hover:bg-opacity-70'
        aria-label='Previous Slide'
      >
        ‹
      </button>
      <button
        onClick={goNext}
        className='absolute top-1/2 right-4 transform -translate-y-1/2 z-30 bg-black bg-opacity-50 text-white text-4xl px-2 py-1 rounded-full shadow-lg hover:bg-opacity-70'
        aria-label='Next Slide'
      >
        ›
      </button>
    </div>
  );
}
