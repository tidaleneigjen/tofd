import CarouselItem from "./CarouselItem";

const images = [
  "/labyrinth.jpg",
  "/window-tofd.jpg",
  "/red-tent.jpg",
  "/temple-ritual.jpg",
];

export default function Carousel() {
  return (
    <div className="flex overflow-x-auto space-x-4 p-2">
      {images.map((src, index) => (
        <CarouselItem key={index} imageSrc={src} />
      ))}
    </div>
  );
}
