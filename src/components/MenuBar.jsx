import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart } from '@fortawesome/free-solid-svg-icons';

export default function MenuBar() {
  return (
    <nav className="border-t border-b border-gray-400 my-3">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo Image */}
        <img
          src="/tofd.jpg"
          alt="Temple Logo"
          className="h-12 w-12 object-cover rounded-full"
        />

        {/* Menu Items */}
        <ul className="flex-1 flex justify-evenly items-center font-serif text-md text-gray-300 ml-8">
          <li><a href="#" className="hover:text-red-300">Home</a></li>
          <li><a href="#" className="hover:text-red-300">About</a></li>
          <li><a href="#" className="hover:text-red-300">Iseum Musicum</a></li>
          <li><a href="#" className="hover:text-red-300">TOFD News</a></li>
          <li><a href="#" className="hover:text-red-300">Events</a></li>
          <li><a href="#" className="hover:text-red-300">Library</a></li>
          <li><a href="#" className="hover:text-red-300">Donate</a></li>
          <li><a href="#" className="hover:text-red-300">Shop</a></li>
          <li>
            <a href="#" className="hover:text-red-300">
              <FontAwesomeIcon icon={faShoppingCart} className="text-lg" />
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
}
