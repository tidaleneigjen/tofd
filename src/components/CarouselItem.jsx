export default function CarouselItem({ imageSrc }) {
  return (
    <div className="min-w-[300px] h-[200px] flex-shrink-0 rounded-lg overflow-hidden shadow-lg">
      <img
        src={imageSrc}
        alt="Carousel"
        className="w-full h-full object-cover"
      />
    </div>
  );
}
