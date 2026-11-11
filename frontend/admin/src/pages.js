// All editable pages, in display order. `home` uses the dedicated
// slides+sidebar editor; every other slug uses the generic title+body
// editor. Must match the backend slug allow-list (backend/src/app.py).
export const PAGES = [
  { slug: "home", label: "Home" },
  { slug: "about", label: "About Us" },
  { slug: "vision-mission", label: "Vision & Mission" },
  { slug: "history", label: "History" },
  { slug: "honoring-kay", label: "Honoring Kay" },
  { slug: "iseum-musicum", label: "Iseum Musicum" },
  { slug: "donate", label: "Donate" },
  { slug: "contact", label: "Contact" },
];

export const GENERIC_PAGES = PAGES.filter((page) => page.slug !== "home");
