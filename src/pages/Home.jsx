import HomeSlideshow from "../components/HomeSlideshow"
import HomeColumn from "../components/HomeColumn"

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
      <div className="md:flex-2 md:basis-2/3">
        <HomeSlideshow />
      </div>
      <div className="md:flex-1 md:basis-1/3">
        <HomeColumn />
      </div>
    </div>
  );
}
