import { faRainbow } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function NewsletterSignupForm() {
  return (
    <form className="w-full flex flex-col md:flex-row items-center justify-center gap-4 px-4 py-6 bg-transparent rounded-lg">
      <FontAwesomeIcon icon={faRainbow} className="text-2xl text-gray-300" />
      <span className="text-gray-300 font-serif text-lg text-center">
        Sign Up for News, Events and Much More!
      </span>
      <input
        type="email"
        placeholder="Your email"
        className="px-4 py-2 rounded-md border border-gray-400 text-gray-300 focus:outline-none focus:ring focus:ring-purple-300 w-full max-w-xs"
      />
      <button
        type="submit"
        className="bg-purple-700 text-white px-4 py-2 rounded-md hover:bg-purple-800 transition"
      >
        Subscribe Now
      </button>
    </form>
  );
}
