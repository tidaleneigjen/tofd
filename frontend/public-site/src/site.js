// Site-wide chrome constants shared by every page.
export const SITE_NAME = "Temple of the Feminine Divine";

export const FOOTER = {
  address: "PO Box 218, Brooks, Maine. 04921",
  email: "webgoddess@templeofthefemininedivine.org",
};

// Flat nav, in display order. `to` is the public route; `end` is set for the
// homepage so it doesn't stay "active" on every other page.
export const NAV_ITEMS = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About Us" },
  { to: "/vision-mission", label: "Vision & Mission" },
  { to: "/history", label: "History" },
  { to: "/honoring-kay", label: "Honoring Kay" },
  { to: "/iseum-musicum", label: "Iseum Musicum" },
  { to: "/donate", label: "Donate" },
  { to: "/contact", label: "Contact" },
];

// Informational page slugs -> nav label. `home` is not here: it has its own
// slides+sidebar schema and layout (see phase-1.1 spec).
export const INFO_PAGES = Object.fromEntries(
  NAV_ITEMS.filter((item) => item.to !== "/").map((item) => [
    item.to.slice(1),
    item.label,
  ]),
);
