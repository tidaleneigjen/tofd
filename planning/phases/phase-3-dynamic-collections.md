# Phase 3 Prompt: Dynamic Collections (Events & News)

**You are a coding agent implementing Phase 3 of the TOFD website rebuild.** This document is your complete task brief.

## Prerequisites — Verify Before Starting

- Phases 1 and 2 are complete: the `tofd-pages` pattern (static pages, admin list/edit, public rendering) works end-to-end, and the Temple has given feedback that's been incorporated.
- Read `planning/2026-10-25-content-types-and-cms-mapping.md` Sections 3 and 4 closely — they document the **actual field shapes** found on the live Wix site for blog posts and events, which this phase's data models are based on.

## Goal of This Phase

Unlike Phases 1-2 (one content type, reused), this phase introduces **two genuinely new, differently-shaped content types**: News/Posts and Events. Each gets its own DynamoDB table, its own API routes, its own admin list/create/edit UI, and its own public-facing display — following the same overall pattern established in Phases 1-2 (Cognito-protected writes, public reads, same-origin API via CloudFront) but with real collection behavior (multiple items, sorting, filtering) instead of a fixed small set of slugs.

**Explicitly out of scope for this phase** (per the content-mapping doc's recommendation): a full e-commerce/membership product catalog. The Donate/membership content from Phase 2 should remain simple static content with payment-link buttons — do not build a "Products" collection or shopping cart.

---

## Step 1: Data Model — `tofd-posts`

Based on confirmed fields from real Wix blog posts (see content-mapping doc Section 3):

- Table `tofd-posts`. Hash key: `id` (String, UUID generated server-side on create). Consider a GSI on `publishedAt` (or a sort-friendly attribute) if you need server-side sorting/filtering by date at the database layer — at this traffic/content volume, fetching all posts and sorting client-side or in the Lambda is also perfectly acceptable and simpler; don't add a GSI unless you have a concrete reason to.
- Attributes: `id`, `title`, `body` (rich text, same format convention as `tofd-pages`), `categories` (list of strings — use the existing taxonomy found on the live site as the starting allow-list: `"Temple News"`, `"Sabbats"`, `"Newsletters"`; allow adding new categories later without a code change if reasonable, but don't over-engineer a full taxonomy-management UI for this phase), `publishedAt` (ISO 8601 timestamp), `attachmentUrl` (optional — for PDF newsletters, see Step 3), `imageUrl` (optional), `createdAt`, `updatedAt`, `updatedBy`.
- **Do not migrate the historical Wix blog content automatically.** Per the content-mapping doc, two of the oldest posts are Wix's own default onboarding content and must be excluded; the rest may or may not be worth manually re-entering — that's a content decision for the human/Temple, not something to script a bulk importer for in this phase unless explicitly asked.

## Step 2: Data Model — `tofd-events`

Based on confirmed fields from real Wix event pages (see content-mapping doc Section 4):

- Table `tofd-events`. Hash key: `id` (String, UUID).
- Attributes: `id`, `title`, `description` (rich text), `startAt` (ISO 8601), `endAt` (optional, ISO 8601), `location` (plain string — can hold either a physical address or something like `"Zoom — link in description"`; do not over-model this as a structured virtual/physical type unless asked, the real site didn't either), `eventType` (string — a loose category like `"Sabbat Ritual"`, `"Business Meeting"`, `"Workshop"`, `"Fundraiser"`, based on the recurring categories identified in the content-mapping doc; keep it a free-text or loosely-validated field, not a rigid enum, since this list will evolve), `imageUrl` (optional), `createdAt`, `updatedAt`, `updatedBy`.
- **No ticketing/payment fields.** Per the earlier decision (classes/events are RSVP-only, no payment processing), do not add price/ticket-type fields even though the old Wix site had them for every event (including free ones) — that complexity isn't needed here.
- **RSVP, if wanted this phase:** if the human wants a simple "I'm attending" capture (name + email, no payment — consistent with the Anu Dudley project's class-signup decision), add a lightweight sub-feature: a `tofd-event-rsvps` table (hash key `id`, attributes `eventId`, `name`, `email`, `submittedAt`) and a public (unauthenticated, but see spam-protection note below) `POST /api/events/{id}/rsvp` endpoint. **Confirm with the human whether RSVP is wanted in this phase before building it** — it's called out as optional here because the main architecture doc didn't commit to a specific phase for it. If built, add basic spam protection (e.g. a honeypot field, or rate-limiting via API Gateway usage plans) since this is a public, unauthenticated write endpoint.

## Step 3: Backend API

| Method | Path | Auth | Behavior |
|---|---|---|---|
| `GET` | `/api/posts` | None | List posts, sorted newest-first. Support an optional `?category=` query param to filter. |
| `GET` | `/api/posts/{id}` | None | Fetch one post. 404 if missing. |
| `POST` | `/api/posts` | Cognito JWT | Create a new post. Generate `id` and `createdAt`/`publishedAt` server-side unless the admin explicitly backdates a post (support an optional `publishedAt` override for backdating real historical content if the Temple wants to re-enter old posts with their original dates). |
| `PUT` | `/api/posts/{id}` | Cognito JWT | Update an existing post. |
| `DELETE` | `/api/posts/{id}` | Cognito JWT | Delete a post. |
| `GET` | `/api/events` | None | List events, sorted by `startAt`. Support an optional `?upcoming=true` filter (server-side: compare `startAt` to current time) since the public site will mostly want to show only future events, not the full history. |
| `GET` | `/api/events/{id}` | None | Fetch one event. 404 if missing. |
| `POST` | `/api/events` | Cognito JWT | Create an event. |
| `PUT` | `/api/events/{id}` | Cognito JWT | Update an event. |
| `DELETE` | `/api/events/{id}` | Cognito JWT | Delete an event. |
| `POST` | `/api/events/{id}/rsvp` | None (if built — see Step 2) | Create an RSVP record. |

1. For the "Newsletters" category's PDF attachment (`attachmentUrl`): add a small, separate S3 bucket (or a prefixed path in an existing non-public bucket) for admin-uploaded media, with the admin app uploading directly to S3 via a presigned URL obtained from a new authenticated endpoint (e.g. `POST /api/uploads` returning a presigned PUT URL) — do not route file bytes through the Lambda function itself (API Gateway payload size limits make that fragile for a 6MB+ PDF like the ones seen on the real site). Serve uploaded files back out through CloudFront (a new behavior on the public-site distribution, or the same bucket pattern as the site assets), not directly from S3.
2. Add tests for all new routes: list/filter behavior, create/update/delete with and without valid auth, and the 404 cases.

## Step 4: Admin App

1. Add two new sections to the admin app's navigation: "News" and "Events," each with a list view (reusing a generic list/table pattern rather than writing two bespoke ones from scratch if feasible) and a create/edit form.
2. News form fields: title, category selector (multi-select from the known categories, with a way to type a new one), rich text body (reuse the Phase 2 editor component), optional image upload, optional PDF upload (using the presigned-upload flow from Step 3), publish date (defaulting to "now," editable for backdating).
3. Events form fields: title, start date/time, optional end date/time, location (plain text), event type (free text with autocomplete suggestions from existing values), rich text description, optional image upload.
4. If RSVP was built: add a simple read-only view per event showing its RSVP list (name, email, submitted date) — a CSV export button is a reasonable nice-to-have, not required.

## Step 5: Public Site

1. Add a `/news` route: list of posts (title, date, category tags, short excerpt), each linking to a `/news/{id}` detail view rendering the full body and any attachment as a download link.
2. Add an `/events` route: list of **upcoming** events by default (using the `?upcoming=true` filter), each showing title/date/location, linking to an `/events/{id}` detail view with the full description. Consider a simple toggle or separate view for past events if the human wants that (not required for this phase's acceptance criteria).
3. If RSVP was built: add a simple name/email form on the event detail page, with a clear success message and basic client-side validation (don't rely on server-side validation alone for UX, but do still validate server-side too — never trust the client).
4. Update the site navigation (from Phase 2) to include News and Events.

---

## Acceptance Criteria

1. An admin can create, edit, and delete both posts and events through the admin app, including image/PDF uploads where applicable.
2. The public site lists and displays both posts and events correctly, with events correctly filtering to "upcoming" by default.
3. All write endpoints reject unauthenticated requests; all read endpoints work without authentication.
4. File uploads go through presigned URLs, not through the Lambda function body.
5. If RSVP was built, submissions are stored and viewable by an admin, and basic spam protection is in place.
6. Full test coverage for new backend routes, matching the standard already set in Phases 0-2.

**STOP after this phase and present the News/Events functionality to the Temple for feedback** before starting Phase 4. In particular, confirm whether they want any historical content (old newsletters, past event listings) manually re-entered, since this phase intentionally did not do that automatically.
