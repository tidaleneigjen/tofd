# Phase 2 Prompt: Informational Pages Expansion

**You are a coding agent implementing Phase 2 of the TOFD website rebuild.** This document is your complete task brief.

> **Note (added after Phase 1.1):** the homepage is a special-layout page with its own schema (`slides` + `sidebar`, see `planning/phases/phase-1.1-homepage-structure.md`) — it is NOT edited with the generic page form built in this phase. The "reuse the Phase 1 form" language below applies to the generic title + body page form for the informational pages; the header/footer built in Phase 1.1 become the shared layout, and the menu bar goes in that header here.

## Prerequisites — Verify Before Starting

- Phase 1 is complete and confirmed working: the homepage can be edited through the admin app and renders on the public site via the `tofd-pages` table and API.
- The human has reviewed Phase 1 with the Temple and given feedback — read any new planning notes added since Phase 1 before starting, in case priorities changed.
- Read `planning/2026-10-25-content-inventory-sitemap.md` for what each target page currently contains (mostly empty/placeholder) and `planning/2026-10-25-content-types-and-cms-mapping.md` Section 2 for the static-page list.

## Goal of This Phase

Extend the **same `tofd-pages` data model, API, and admin editing pattern** from Phase 1 to cover the Temple's remaining static informational pages. This phase should feel like "more of the same, generalized" rather than new architecture — if you find yourself needing fundamentally different infrastructure to make a page work, stop and reconsider whether that page actually belongs in a later phase (e.g., Iseum Musicum's PDF application/payment links overlap with Phase 3/4 concerns — see note below).

**Pages in scope for this phase** (from the content inventory — all currently empty or placeholder on the live Wix site, so this is largely original content-writing work done in collaboration with the Temple, not content migration):
- About Us
- Vision & Mission
- History
- Honoring Kay
- Iseum Musicum (text/description content only — see note below for what's out of scope)
- Donate (text/description content only — see note below)
- Contact

**Out of scope for this phase:**
- Iseum Musicum's application PDF and class-payment flow — these are either simple static file links (if Donate/Iseum Musicum just need to link to a PDF, that's trivial and in scope — see Step 3) or a payment mechanism, which per `planning/2026-10-25-content-types-and-cms-mapping.md` Section 5 should be simple payment-link buttons, not a new collection or checkout flow. If the Temple wants this to be more dynamic than a static link, flag it for Phase 3/4 rather than building it ad hoc here.
- Events and News/Posts — those are genuinely different content shapes (repeating collections with dates/categories), handled in Phase 3.
- Social media embeds — Phase 4.
- Any navigation/site-wide layout polish beyond what's needed to actually reach these new pages (a basic nav is in scope, see Step 4; a fully "modern" redesign is not required yet).

---

## Step 1: Extend the Admin App to Support Multiple Pages

1. In `frontend/admin/`, replace the Phase 1 single-page "Edit Homepage" screen with a **page list view**: fetch all items from `GET /api/pages` (see Step 2 — this is a new endpoint, Phase 1 only had single-page `GET`), show each page's slug/title, and let the admin click into an edit form per page (reusing the same form component built in Phase 1, generalized to take a `slug` parameter instead of being hardcoded to `"home"`).
2. Add a simple way to create a **new** page entry for any slug that doesn't exist yet in `tofd-pages` (the list of valid slugs for this phase is fixed — see Step 3 — so this can be as simple as showing all expected slugs including ones with no content yet, with an "Add content" call-to-action, rather than a free-form "create arbitrary page" feature; a fully generic page-creation UI is more than this phase needs).
3. **Upgrade the body field from a plain `<textarea>` (Phase 1) to a basic rich text editor** (e.g., TipTap or a similarly lightweight React rich-text library) — now that there are multiple pages with real prose content, a non-technical editor needs basic formatting (headings, bold, links, paragraphs) without writing HTML by hand. Keep it simple — bold/italic/headings/links/lists is enough, don't build a full page-builder.

## Step 2: Backend — List Endpoint and Validation

1. Add `GET /api/pages` (public, no auth) — returns all items in `tofd-pages` (this table will only ever have a handful of items, so a full table scan is fine; do not over-engineer pagination for a single-digit item count).
2. Review the `PUT /api/pages/{slug}` validation from Phase 1 — make sure it still makes sense now that `slug` is no longer always `"home"`. Reject slugs that aren't in the known/expected set for this phase (see Step 3) to avoid typos creating orphaned junk pages — a simple allow-list constant in the backend code is sufficient.
3. Add/update tests for the new list endpoint and the slug validation.

## Step 3: Known Slugs for This Phase

Use these exact slugs (so Step 4's routing lines up predictably):

```
home            (already exists from Phase 1)
about
vision-mission
history
honoring-kay
iseum-musicum
donate
contact
```

Note: the old Wix site's inconsistent slugs (`/membership` for "About Us", `/services` for "Honoring Kay") are **intentionally not carried over** — these new slugs are clean and descriptive, per the earlier open decision in the main migration plan to fix this rather than preserve Wix's accidental slugs. If the human has indicated otherwise (e.g., for SEO/backlink reasons), follow their updated guidance instead.

## Step 4: Public Site — Routing and Navigation

1. Add client-side routing (React Router, if not already added) to `frontend/public-site/` with one route per slug from Step 3, all rendering a shared "Page" component (same component built for Home in Phase 1, generalized to accept a `slug` prop/param and fetch accordingly) — don't build 7 near-duplicate page components.
2. Add a basic site-wide navigation header/footer (this did not exist in Phase 1's single-page scope) linking to all pages in scope. This does not need to be visually polished, just functional and consistent across pages — visual design is not blocked on this phase, but navigation existing at all is a prerequisite the original migration plan flagged as currently missing even in the old Wix site's weaker moments.
3. Handle the "page has no content yet" state clearly and honestly on the public site too (not just the admin) — if the Temple hasn't filled in a page yet, show something like "Content coming soon" rather than a broken-looking blank page, consistent with how the current Wix site (badly) does this today with its "COMING SOON!" placeholders — the new version should look intentional, not broken, when that happens.

## Step 5: Content Entry

This phase's real bottleneck is **content**, not code — most of these pages are empty today. Coordinate with the human: either they provide copy for each page ahead of time, or you enter clearly-labeled placeholder copy (`[PLACEHOLDER — confirm with the Temple]`) for each page so the feedback checkpoint has something concrete to react to, consistent with how Phase 1 handled the homepage. Do not fabricate specific factual claims about the Temple's history, leadership, or "Honoring Kay" — leave those explicitly marked as placeholders rather than guessing at real content for a real organization.

---

## Acceptance Criteria

1. All 7 pages in Step 3 (plus Home) are listed in the admin app, editable with the upgraded rich-text form, and save/load correctly.
2. All 7 pages render on the public site at their respective routes, reachable via site navigation.
3. Pages with no content yet show a clear, intentional "coming soon" state rather than breaking or looking unfinished.
4. The slug allow-list prevents creation of unexpected/typo'd pages.
5. Existing Phase 1 tests still pass; new tests cover the list endpoint and multi-slug validation.

**STOP after this phase and present the expanded site to the Temple for feedback**, specifically on the actual page content (not just functionality) since most of it is newly written. Capture feedback before starting Phase 3.

---

## Lead decisions (2026-11-10) — these OVERRIDE anything above

**Scope/pages & routes:** slugs `about`, `vision-mission`, `history`, `honoring-kay`, `iseum-musicum`, `donate`, `contact` (plus existing `home`, which keeps its own slides+sidebar schema and editor). Public routes are `/<slug>` for each (React Router `BrowserRouter`; the CloudFront function already rewrites extensionless paths to index.html). Unknown path → a friendly "Page not found" page. Nav labels: Home, About Us, Vision & Mission, History, Honoring Kay, Iseum Musicum, Donate, Contact. No News/Events/Library links yet (later phases).

**Header/nav (user choices):** FLAT list of links (no dropdown). Header = top row with a small circular logo (existing bundled `/images/tofd-logo.jpg`, ~56px circle, links to `/`, accessible name "Temple of the Feminine Divine — home") + the nav links, with the existing crimson title band below (like the old site's layout). On narrow screens the links collapse behind a "Menu" disclosure button (`aria-expanded`, `aria-controls`, closes on navigation/Escape). Active link gets `aria-current="page"` and a visible style. Do NOT redesign the red band (the user dislikes it being 100% wide but parked it in planning/parking-lot.md — leave as is). Footer unchanged.

**Generic page schema (backend):** add to `PAGE_SCHEMAS` for each non-home slug: `title` (required, <=200), `body` (required key, string <=50000, MAY be empty string), server sets `bodyFormat: "html"`, `updatedAt`, `updatedBy`. Reject unknown/client-supplied server fields. `body` is HTML and MUST be sanitized server-side on PUT with `nh3` using an allowlist: tags `p br h2 h3 h4 strong em u ul ol li blockquote a hr`; attributes only `a[href]`; href schemes only `https`, `http`, `mailto`; force `rel="noopener noreferrer"`; strip everything else (script/style/img/iframe/event handlers/javascript: URLs/data:). Store the sanitized value. Add `GET /api/pages` (public) returning a list of `{slug, title, updatedAt}` for saved pages only (home included with title "Home" if present). KEEP the home schema untouched. **Terraform:** the API Gateway routes are explicit per route, so add `GET /api/pages` to infra/live/modules/lambda-api (public, no authorizer) — do not forget this. Lambda packaging: `nh3` is a compiled wheel, so update `backend/build.sh` to install deps for the Lambda platform: `pip install --platform manylinux2014_x86_64 --implementation cp --python-version 3.12 --only-binary=:all: --target ... -r requirements.txt` (verify the Lambda `architectures` in the module is x86_64/default; if arm64 use manylinux2014_aarch64 instead). Keep local dev/test deps (nh3 included) in requirements-dev.txt as needed.

**Public render:** a single `RichText` component renders the page body via `dangerouslySetInnerHTML` ONLY after sanitizing with DOMPurify (same allowlist, `a` links get rel noopener noreferrer). Generic page layout = the shared Layout (header+nav+footer) with the title as `<h2>`-level heading inside a content card (light card, same palette as the sidebar) and the body. Set `document.title` per page ("<Page title> — Temple of the Feminine Divine"). Empty/absent content (404 or empty body) and no default => intentional, styled "Content coming soon." message (not an error look). Fetch errors other than 404 => friendly "Couldn't load this page right now" with a retry button.

**Defaults for unsaved pages (real Wix text; comment "from live Wix site 2026-11-10; confirm with the Temple"; one defaults module per app):**
- `iseum-musicum` title "Iseum Musicum": `<p>The Iseum Musicum, the School of the Muse, is the education wing of the Temple of the Feminine Divine. It offers a three-year course that prepares individuals to become Pagan clergy. The course is intended to support students as they explore and develop their individual spiritual paths, and learn how to serve their communities as clergy.</p>` plus a `<p>` with two links: "More information (PDF)" -> `https://www.templeofthefemininedivine.org/_files/ugd/e09ea1_e663d4a02f914d5caa90307007a7d017.pdf` and "Application (PDF)" -> `https://www.templeofthefemininedivine.org/_files/ugd/e09ea1_84139cbe175d4205be22f1ee2a52c14b.pdf`. These Wix-hosted PDFs vanish at cutover: ALSO download both into `planning/assets/wix-files/` (with a README) for re-hosting later; if a download fails, report it.
- `donate` title "Donate": `<p><strong>Donations made simple.</strong> Donating through PayPal is easy. You select the amount and you can choose a one time or recurring donation.</p><p><a href="https://www.paypal.com/donate?hosted_button_id=5FUNE4XCFTBAS">Donate with PayPal</a></p><p><strong>Become a member.</strong> Purchase an annual membership to help sustain the Temple of the Feminine Divine. Individual membership $40, family membership $75. Online membership sign-up is coming soon.</p>`
- `contact` title "Contact": `<p>Temple of the Feminine Divine<br>PO Box 218<br>Brooks, ME 04921</p><p><a href="mailto:webgoddess@templeofthefemininedivine.org">webgoddess@templeofthefemininedivine.org</a></p>`
- `about`, `vision-mission`, `history`, `honoring-kay`: NO defaults (coming-soon state). Do NOT invent factual content about the Temple.

**Admin:** add `react-router-dom`. After login: `/` = Pages list (all 8 slugs: label, last updated or "Not yet written", Edit link); `/pages/home` = existing homepage editor (unchanged behavior); `/pages/:slug` = generic editor: title input + rich-text editor (TipTap: `@tiptap/react`, `@tiptap/starter-kit` restricted to the allowlist features — headings 2–3, bold, italic, underline optional, bullet/ordered lists, blockquote, horizontal rule, links — plus a toolbar with labeled buttons; link button uses a small inline form that only accepts https/http/mailto), Save -> PUT with the ID token, same success/error banners and plain-language error mapping, unsaved-changes warning on navigation is optional. On 404 prefill defaults (if any) without saving. Shared top bar with "Pages" link and Sign out. Remember the editor should also handle a legacy/other-format item gracefully. Pin all new npm deps to versions published >= 7 days ago (check `npm view <pkg> time`).

**Tests:** backend pytest — generic schema validation (valid/missing/unknown/too long/empty body OK), sanitization (script tag, onerror attr, javascript: href, data: href, img/iframe/style stripped, allowed tags and https/mailto links preserved, rel forced), `GET /api/pages` list shape, slug allow-list now 8, home schema unchanged, 401 without claims, existing tests still green. Public site — each route renders, coming-soon state, defaults pages, RichText XSS payloads neutralized, nav active state + mobile menu toggle (aria-expanded, Escape closes), 404 route. Admin — pages list rendering, generic editor load/save payload, 404 prefill, link validation helper.

**Visual check:** Playwright screenshots (throwaway script outside the repo, same approach as Phase 1.1, intercepting `/api/pages/*`) into `/tmp/phase2/`: home, a defaults page (iseum-musicum), a coming-soon page (history), nav open on mobile, at 1280 and 390 widths, plus an overlap/overflow DOM audit. The lead will review the images (you can't see them), so name files clearly and report the list.

**Boundaries:** commit locally only (Devin trailer, no amends), do NOT push, no AWS credentials, no terraform apply/plan against AWS (`terraform fmt` + `validate` only for the one route addition). Pause when done; no Phase 3 work.
