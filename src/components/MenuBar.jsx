import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBahai, faShoppingCart } from '@fortawesome/free-solid-svg-icons';

export default function MenuBar() {
  return (
    <nav className="bg-transparent border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between py-4 w-full">
        {/* Logo or Swirly Icon */}
        <div className="text-2xl text-blue-700">
          <FontAwesomeIcon icon={faBahai} className="text-2xl" />
        </div>

        {/* Menu Items */}
        <ul className="flex items-center gap-6 font-serif text-md text-gray-700">
          <li><a href="#" className="hover:text-blue-600">Home</a></li>
          <li><a href="#" className="hover:text-blue-600">About</a></li>
          <li><a href="#" className="hover:text-blue-600">Iseum Musicum</a></li>
          <li><a href="#" className="hover:text-blue-600">TOFD News</a></li>
          <li><a href="#" className="hover:text-blue-600">Events</a></li>
          <li><a href="#" className="hover:text-blue-600">Library</a></li>
          <li><a href="#" className="hover:text-blue-600">Donate</a></li>
          <li><a href="#" className="hover:text-blue-600">Shop</a></li>
          <li>
            <a href="#" className="hover:text-blue-600">
              <FontAwesomeIcon icon={faShoppingCart} className="text-lg" />
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
}
