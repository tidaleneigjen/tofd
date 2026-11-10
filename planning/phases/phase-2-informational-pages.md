# Phase 2 Prompt: Informational Pages Expansion

**You are a coding agent implementing Phase 2 of the TOFD website rebuild.** This document is your complete task brief.

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
