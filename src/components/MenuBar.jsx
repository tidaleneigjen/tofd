export default function MenuBar() {
  return (
    <nav className="bg-blue-800 text-white px-6 py-4 shadow-md">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div className="text-xl font-bold">TOFD</div>
        <ul className="flex gap-6 text-md">
          <li><a href="#" className="hover:text-blue-300">Home</a></li>
          <li><a href="#" className="hover:text-blue-300">About</a></li>
          <li><a href="#" className="hover:text-blue-300">Contact</a></li>
        </ul>
      </div>
    </nav>
  );
}
