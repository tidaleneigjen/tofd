export default function Slide({ title, image, imageText, imageTitle, ctaText, onCtaClick, isActive }) {
  return (
    <div
      className={`absolute inset-0 w-full h-full rounded-lg overflow-hidden shadow-lg transition-opacity duration-1000 ${
        isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
      }`}
    >
      <img src={image} alt={title} className="w-full h-64 object-cover" />
      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 p-4 text-white">
        <h3 className="text-xl font-semibold">{title}</h3>
        <h4 className="text-m font-semibold">{imageTitle}</h4>
        <p className="mt-1">{imageText}</p>
        <button
          onClick={onCtaClick}
          className="mt-3 bg-purple-700 hover:bg-purple-800 px-4 py-2 rounded"
        >
          {ctaText}
        </button>
      </div>
    </div>
  );
}
