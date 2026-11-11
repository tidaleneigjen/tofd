# Phase 1.1: Homepage Structure & Minimal Styling

**Status:** Approved by the user 2026-11-10 (feedback round after Phase 1). Based on the **live Wix homepage** (screenshots + DOM inspected 2026-11-10), not the old prototype. Imitate it minimally. No menu bar yet (comes later). Keep everything as simple as possible.

## What the live Wix homepage looks like (reference)
- Page background deep purple `rgb(47,29,70)` = `#2f1d46`; a centered ~950px column.
- Header: crimson band `rgb(216,5,63)` = `#d8053f`; the title "Temple of the Feminine Divine" centered, very bold display serif (Playfair Display), white, with a heavy drop shadow. (Nav bar + goddess logo circle sit above it: not part of this phase.)
- Below the header, two boxes side by side: **carousel on the left (~2/3)** with black slides, white text, arrow buttons and 6 dots; **"about us" sidebar on the right (~1/3)**, light gray `rgb(214,212,212)` = `#d6d4d4`, big letter-spaced display title, centered dark body text (plus Learn More / Donate buttons: not part of this phase).
- Footer: purple band spanning the width: newsletter signup (deferred) + address/email/copyright on the right.
- Fonts on Wix: Playfair Display (title/“about us”), Libre Baskerville (slide titles), Noticia Text (nav/footer), Helvetica-style sans (body).

## Target layout (this phase)
```
┌───────────────────────────────────────────┐
│ HEADER: "Temple of the Feminine Divine"   │  full width of column, crimson band, text-shadow
├─────────────────────────┬─────────────────┤
│ CAROUSEL (fading slides)│ SIDEBAR         │  desktop (>=768px): carousel left (~2/3), sidebar right (~1/3)
│  image + optional title │  title          │
│  + optional text overlay│  text           │
├─────────────────────────┴─────────────────┤
│ FOOTER (spans full width of the column)   │
└───────────────────────────────────────────┘
Mobile (<768px): header → carousel → sidebar → footer, single column.
```

## Decisions
1. **Page/colors** (CSS variables in one place): page bg `#2f1d46`, header band `#d8053f`, sidebar bg `#d6d4d4` with dark text `#1a1a1a`, carousel scrim black, footer text `#e6dff0` on the purple bg. Centered column, max-width ~980px, small gaps. All text/background pairs must meet WCAG AA (header white on `#d8053f` is OK for large bold text; verify the rest).
2. **Header**: real `<header>` with the site name as `<h1>`, above the carousel. Playfair Display 900, white, `text-shadow: 3px 3px 8px rgba(0,0,0,.7)` (user likes the drop shadow). Site name is a frontend constant `SITE_NAME` (shared by every page in Phase 2), not CMS-editable.
3. **Carousel**: dependency-free React component. Slides crossfade (CSS opacity ~1s) and auto-advance every ~6s. Dot buttons (aria-labelled "Go to slide N") + prev/next arrow buttons like the old site + one Pause/Play button (WCAG: moving content must be pausable). Pauses on hover and focus-within. `prefers-reduced-motion`: no auto-advance, no fade animation. Each slide = full-bleed image (`object-fit: cover`) with an optional title and optional text overlaid at the bottom on a dark gradient scrim for legibility (with text-shadow). Slide variants: title only, text only, both, neither. Non-active slides `aria-hidden` and not focusable. **Layout rule:** stack all slides in the same CSS grid cell so the carousel height = the tallest slide; slide min height = 16:9 on mobile, ~420px on desktop; long text (slide 1 below is ~600 chars) must never be clipped at 360px wide, so on narrow screens let the slide grow instead of clipping.
4. **Sidebar**: object with `title` and `text` only. Title styled like the Wix "about us" (Playfair Display 900, letter-spaced, lowercase/uppercase per your judgment, large); text centered or left (your judgment, readable). Text: blank line = new paragraph, rendered as text nodes (never `dangerouslySetInnerHTML`).
5. **Footer**: full-width of the column, not CMS-editable yet (constants): "Temple of the Feminine Divine", "PO Box 218, Brooks, Maine. 04921", mailto `webgoddess@templeofthefemininedivine.org`, "© {current year} Temple of the Feminine Divine 501c3". Newsletter signup deferred to Phase 4 (needs a backend).
6. **Fonts**: self-hosted `@fontsource/playfair-display` (weights 700, 900) only, for header/sidebar title/slide titles (no Google Fonts network calls). Body text uses a system sans stack (`system-ui, "Helvetica Neue", Arial, sans-serif`) like the Wix site's Helvetica. Pick a package version published >= 7 days ago.
7. **Images**: no upload infrastructure until Phase 3. Use the Temple's own images from the live site. Download the originals (curl, `https://static.wixstatic.com/media/<id>`; these URLs are the exact media ids used by the live slides) into `planning/assets/wix-home/` (commit them as the source of truth, with a short README listing id → purpose) and bundle **downscaled copies** (longest edge <= 1600px, JPEG q~80, via `sips`) in the public site under `/images/`:
   | file (bundle name) | Wix media id | used by |
   |---|---|---|
   | `tofd-logo.jpg` | `e09ea1_1ee821c555d146f0baac8fda7075d6fe~mv2.jpg` | slide 1 (goddess/moon-phases drawing) |
   | `window.jpg` | `e09ea1_fc1a77384208477b9caf0ee3c27e04c9~mv2.jpg` | slide 2 (Isis stained glass) |
   | `red-tent.jpg` | `e09ea1_080a1b6b8876498093874bc508b01df2~mv2_d_3158_1327_s_2.jpg` | slide 3 |
   | `ritual-room.jpg` | `e09ea1_3dac82b2a206452e9e9d882fc748f2cf~mv2.jpg` | slide 4 |
   | `labyrinth.jpg` | `e09ea1_d9e9cd9e1dfa4b2f9c7f8c6872d9a287~mv2.jpg` | slide 5 |
   | `iseum.jpg` | `e09ea1_0cb204a29f784dbbb1ea4be11155d74c~mv2.jpg` | slide 6 |
   The admin picks a slide image from a dropdown of these six (label + small preview). Remove the Phase 1 `temple-ritual.jpg` from the public site bundle (the earlier legacy images remain only under `planning/assets/legacy-images/`). If a media id 404s, try appending `/v1/fill/w_1600,h_1600,q_85/x.jpg` to the media URL; if still failing, stop and report.

## Data model (`home` item in `tofd-pages`)
Replaces the Phase 1 fields (`heroHeading`, `missionStatement`, `body`, `title`, `heroImageUrl`, `bodyFormat`) for the `home` slug:
```json
{
  "slug": "home",
  "slides": [ { "imageUrl": "/images/labyrinth.jpg", "title": "optional", "text": "optional" } ],
  "sidebar": { "title": "About Us", "text": "..." },
  "updatedAt": "server-set", "updatedBy": "server-set"
}
```
- `slides`: 1–8 items. `imageUrl` required, string <=500, must start with `/images/` or `https://`. `title` optional <=100. `text` optional <=1000. Unknown keys rejected (nested too).
- `sidebar`: `title` required <=100; `text` required <=3000. Unknown keys rejected.
- Validation is a per-slug schema (dict keyed by slug) so Phase 2 can add other schemas. Server sets `updatedAt`/`updatedBy` and rejects client-supplied ones. PUT replaces the whole item.
- A legacy Phase 1 item (no `slides`/`sidebar`) is tolerated on GET; public site and admin fall back to defaults for any missing part.

## Default content = the six real Wix slides (so we can see real text in the carousel object)
These are copied from the live site purely for layout/text evaluation; several are stale (COVID era, 2022/2023). Mark in code: "from the live Wix homepage, 2026-11-10; stale in parts; confirm with the Temple". Omit the Wix "COVID-19 UPDATE" block and buttons (BLOG/RSVP).
1. image `tofd-logo.jpg`; title "Temple News"; text "Dear Temple friends,\n\nThe world has changed! Watch us grow with it. Although there are no in-person events planned, we continue to have you in mind, and will be hosting events and rituals soon. See us on Facebook for the next online ritual schedule.\n\nStay tuned, and please email us!\n\nWe are excited to continue to be blessed by the Goddess! May harmony and the Divine bestow on you. Holding you in hand and heart.\n\nSincerely,\nThe Temple of the Feminine Divine."
2. image `window.jpg`; title "Monthly Business Meeting"; text "Zoom online meetings for Temple Business are happening! See our facebook page for the link!"
3. image `red-tent.jpg`; title "Red Tent: Virtual Edition"; text "Stay tuned for updates on Red Tent."
4. image `ritual-room.jpg`; title "The Temple has moved!"; text "The Temple is no longer at 31 Central St in Bangor, ME. Please see our blog post for more information."
5. image `labyrinth.jpg`; text only: "Our ordained ministers are working hard to bring ideas and dreams to fruition for us all. Exciting things are happening."
6. image `iseum.jpg`; text only: "We are accepting applications for our upcoming Iseum Musicum class, that will start in 2023. Please email webgoddess@templeofthefemininedivine.org for more information! thank you."

Sidebar default: title "About Us"; text "Under the guardianship of ordained clergy, the Temple of the Feminine Divine is a spiritual community that supports one another on our paths of Earth Based Spirituality. We honor Mother Nature and encourage balance and harmony among all beings. We welcome all genders, sexual orientations, and faiths.\n\nWe are committed to reclaiming, experiencing, and celebrating the feminine aspect of the Divine."

## Admin editor
"Edit Homepage" form with two sections: **Carousel slides** (list; per slide: image dropdown + preview, optional title, optional text, Move up / Move down / Remove; "Add slide" up to 8; at least 1 slide) and **Sidebar** (title, text). Same save/auth/error behavior as Phase 1 (plain-language errors, success banner). If the loaded item lacks slides/sidebar, prefill defaults (not saved until Save).

## Tests / verification
- Backend: pytest for the schema (valid; each slide variant; 0 and 9 slides; bad imageUrl; unknown nested keys; too long; missing sidebar; client-supplied updatedAt rejected; no claims -> 401; legacy item GET still works).
- Public site: add Vitest + Testing Library; test Carousel (renders slides, dots + arrows, auto-advance with fake timers, pause/play, no auto-advance under reduced motion) and defaults fallback.
- Admin: unit tests for pure slide-list helpers (add/remove/move, limits).
- Visual check: render both apps' built output and take Playwright screenshots at 1280px and 390px widths (Playwright is installed at `/Users/jboss/repos/graycandle-repertoire/node_modules/playwright`; Chromium is cached; use it from a throwaway script outside the repo, do not add it as a dependency). Save screenshots under `/tmp` and report the paths; confirm slide 1's long text is not clipped on mobile and the sidebar sits under the carousel on mobile, beside it on desktop.
- `terraform` untouched. `npm run build` both apps; `pytest`; `git status` clean.

## Impact on Phase 2
`home` is a special-layout page with its own schema. Other pages (about, history, ...) get a generic title + body schema in Phase 2; the Phase 2 prompt's "reuse the Phase 1 form" language applies to the generic page form, not to the homepage editor. The header/footer built here become the shared layout in Phase 2, and the menu bar goes in the header then.
