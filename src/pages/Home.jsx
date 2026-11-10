import Carousel from "../components/Carousel";
import HomeColumn from "../components/HomeColumn";

export default function Home() {
  return (
    <div className="flex flex-row gap-4 w-full">
      {/* Carousel - 3/4 width */}
      <div className="w-3/4">
        <Carousel />
      </div>

      {/* Text Column - 1/4 width */}
      <div className="w-1/4">
        <HomeColumn />
      </div>
    </div>
  );
}
