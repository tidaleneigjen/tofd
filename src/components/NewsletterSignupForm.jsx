export default function NewsletterSignupForm() {
  return (
    <form className="w-full flex flex-col gap-4 px-4 py-6 bg-transparent rounded-lg">
      {/* Header Text */}
      <span className="text-gray-300 font-serif text-lg">
        Sign Up for News, Events and Much More!
      </span>

      {/* Input Group */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full">
        <div className="flex items-center gap-4 w-full">
          <img
            src="/pride heart.jpg"
            alt="Pride Heart"
            className="h-10 w-10 object-contain shrink-0"
          />
          <input
            type="email"
            placeholder="Your email"
            className="flex-grow px-4 py-2 rounded-md border border-gray-400 text-gray-900 focus:outline-none focus:ring focus:ring-purple-300 w-full"
          />
        </div>

        <button
          type="submit"
          className="bg-purple-700 text-white px-4 py-2 rounded-md hover:bg-purple-800 transition whitespace-nowrap"
        >
          Subscribe Now
        </button>
      </div>
    </form>
  );
}
