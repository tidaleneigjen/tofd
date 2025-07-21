export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-4 mt-auto">
      <div className="max-w-5xl mx-auto px-4 text-center text-sm">
        &copy; {new Date().getFullYear()} TOFD. All rights reserved.
      </div>
    </footer>
  );
}
