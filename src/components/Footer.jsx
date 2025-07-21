import NewsletterSignupForm from "./NewsLetterSignupForm";

export default function Footer() {
  return (
    <footer className="w-full mt-12 text-gray-300 bg-transparent px-4 py-6 font-serif">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center gap-8 justify-between">
        {/* Newsletter Signup - fills remaining space */}
        <div className="flex-grow w-full md:w-auto">
          <NewsletterSignupForm />
        </div>

        {/* Contact Info - aligned to the right */}
        <div className="flex flex-col items-start md:items-end space-y-0 text-[0.8em] shrink-0 text-right">
          <span>Temple of the Feminine Divine</span>
          <span>PO Box 218, Brooks, Maine. 04921</span>
          <span>
            <a
              href="mailto:webgoddess@templeofthefemininedivine.org"
              className="underline hover:text-gray-100"
            >
              webgoddess@templeofthefemininedivine.org
            </a>
          </span>
          <span>&copy; {new Date().getFullYear()} Temple of the Feminine Divine 501c3</span>
        </div>
      </div>
    </footer>
  );
}
