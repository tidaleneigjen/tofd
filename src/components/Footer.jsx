import NewsletterSignupForm from "./NewsLetterSignupForm";

export default function Footer() {
  return (
    <footer className='w-full mt-12 text-gray-300 bg-transparent'>
      {/* Newsletter Sign-Up Form */}
      <NewsletterSignupForm />

      {/* Contact Info Row */}
      <div className='text-sm text-center md:text-left px-4 pb-6 flex flex-col md:flex-row justify-center items-center gap-4 md:gap-8 flex-wrap'>
        <span>© 2025 Temple of the Feminine Divine 501c3</span>
        <span>PO BOX 218</span>
        <span>Brooks, ME 04921</span>
        <span>webgoddess@templeofthefemininedivine.org</span>
      </div>
    </footer>
  );
}
