export default function Slide({
  title,
  image,
  imageText,
  imageTitle,
  ctaText,
  onCtaClick,
  isActive,
}) {
  return (
    <div
      className={`absolute inset-0 w-full h-full rounded-lg overflow-hidden shadow-lg transition-opacity duration-1000 ${
        isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
      }`}
    >
      <div>
        <img src={image} alt={title} className="w-full h-64 object-cover" />
        
        <div className="bg-slate-900 bg-opacity-90 p-4 text-white">
          <h3 className="text-2xl font-bold">{title}</h3>
          {imageTitle && (
            <h4 className="text-lg font-medium mt-1">{imageTitle}</h4>
          )}
          <p className="mt-2">{imageText}</p>
          <button
            onClick={onCtaClick}
            className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded shadow"
          >
            {ctaText}
          </button>
        </div>
      </div>
    </div>
  );
}
