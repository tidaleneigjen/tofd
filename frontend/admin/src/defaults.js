// Default homepage content, prefilled in the editor when the API has no
// `home` page yet (saved only when the user presses Save). From the live Wix
// homepage, 2026-11-10; stale in parts (COVID-era news, 2022/2023 dates);
// confirm with the Temple.
export const DEFAULT_PAGE = {
  slides: [
    {
      imageUrl: "/images/tofd-logo.jpg",
      title: "Temple News",
      text: "Dear Temple friends,\n\nThe world has changed! Watch us grow with it. Although there are no in-person events planned, we continue to have you in mind, and will be hosting events and rituals soon. See us on Facebook for the next online ritual schedule.\n\nStay tuned, and please email us!\n\nWe are excited to continue to be blessed by the Goddess! May harmony and the Divine bestow on you. Holding you in hand and heart.\n\nSincerely,\nThe Temple of the Feminine Divine.",
    },
    {
      imageUrl: "/images/window.jpg",
      title: "Monthly Business Meeting",
      text: "Zoom online meetings for Temple Business are happening! See our facebook page for the link!",
    },
    {
      imageUrl: "/images/red-tent.jpg",
      title: "Red Tent: Virtual Edition",
      text: "Stay tuned for updates on Red Tent.",
    },
    {
      imageUrl: "/images/ritual-room.jpg",
      title: "The Temple has moved!",
      text: "The Temple is no longer at 31 Central St in Bangor, ME. Please see our blog post for more information.",
    },
    {
      imageUrl: "/images/labyrinth.jpg",
      text: "Our ordained ministers are working hard to bring ideas and dreams to fruition for us all. Exciting things are happening.",
    },
    {
      imageUrl: "/images/iseum.jpg",
      text: "We are accepting applications for our upcoming Iseum Musicum class, that will start in 2023. Please email webgoddess@templeofthefemininedivine.org for more information! thank you.",
    },
  ],
  sidebar: {
    title: "About Us",
    text: "Under the guardianship of ordained clergy, the Temple of the Feminine Divine is a spiritual community that supports one another on our paths of Earth Based Spirituality. We honor Mother Nature and encourage balance and harmony among all beings. We welcome all genders, sexual orientations, and faiths.\n\nWe are committed to reclaiming, experiencing, and celebrating the feminine aspect of the Divine.",
  },
};

// The six slide images bundled with the public site. `value` is what gets
// stored in the CMS item; `label`/`preview` are for the editor dropdown.
export const SLIDE_IMAGES = [
  { value: "/images/tofd-logo.jpg", label: "Goddess / moon phases", preview: "/images/tofd-logo.jpg" },
  { value: "/images/window.jpg", label: "Isis stained glass window", preview: "/images/window.jpg" },
  { value: "/images/red-tent.jpg", label: "Red tent", preview: "/images/red-tent.jpg" },
  { value: "/images/ritual-room.jpg", label: "Ritual room", preview: "/images/ritual-room.jpg" },
  { value: "/images/labyrinth.jpg", label: "Labyrinth", preview: "/images/labyrinth.jpg" },
  { value: "/images/iseum.jpg", label: "Iseum", preview: "/images/iseum.jpg" },
];

// Default bodies for informational pages, prefilled in the generic editor
// when the page has never been saved (saved only when the user presses Save).
// From the live Wix site, 2026-11-10; confirm with the Temple. Pages without
// an entry start empty — their Wix pages were placeholders, and no factual
// content should be invented for a real organization.
export const PAGE_DEFAULTS = {
  "iseum-musicum": {
    title: "Iseum Musicum",
    body: '<p>The Iseum Musicum, the School of the Muse, is the education wing of the Temple of the Feminine Divine. It offers a three-year course that prepares individuals to become Pagan clergy. The course is intended to support students as they explore and develop their individual spiritual paths, and learn how to serve their communities as clergy.</p><p><a href="https://www.templeofthefemininedivine.org/_files/ugd/e09ea1_e663d4a02f914d5caa90307007a7d017.pdf">More information (PDF)</a> · <a href="https://www.templeofthefemininedivine.org/_files/ugd/e09ea1_84139cbe175d4205be22f1ee2a52c14b.pdf">Application (PDF)</a></p>',
  },
  donate: {
    title: "Donate",
    body: '<p><strong>Donations made simple.</strong> Donating through PayPal is easy. You select the amount and you can choose a one time or recurring donation.</p><p><a href="https://www.paypal.com/donate?hosted_button_id=5FUNE4XCFTBAS">Donate with PayPal</a></p><p><strong>Become a member.</strong> Purchase an annual membership to help sustain the Temple of the Feminine Divine. Individual membership $40, family membership $75. Online membership sign-up is coming soon.</p>',
  },
  contact: {
    title: "Contact",
    body: '<p>Temple of the Feminine Divine<br>PO Box 218<br>Brooks, ME 04921</p><p><a href="mailto:webgoddess@templeofthefemininedivine.org">webgoddess@templeofthefemininedivine.org</a></p>',
  },
};
