# Phase 1 Prompt: MVP Homepage CMS

**You are a coding agent implementing Phase 1 of the TOFD website rebuild.** This document is your complete task brief.

## Prerequisites — Verify Before Starting

- Phase 0 is complete and confirmed working by the human: `main` has the clean repo structure, the Terraform pipeline deploys on merge, and `GET /api/health` returns successfully through CloudFront.
- If any of that isn't true, **stop and say so** — do not attempt to redo or second-guess Phase 0's infrastructure from scratch.
- Read `planning/2026-11-10-architecture-pivot-and-master-plan.md` for architecture context and `planning/2026-10-25-content-types-and-cms-mapping.md` Section 2 ("Static Content") for what the Home page currently contains/should contain.

## Goal of This Phase

Prove the **entire content pipeline** end-to-end on the smallest possible scope: a non-technical admin can log in, edit the homepage's content, save it, and see the change reflected on the live public site — all through infrastructure that already exists from Phase 0, extended just enough to support this.

**Scope is deliberately narrow: only the homepage.** Do not build editing for any other page in this phase, even though the data model you build should be reusable for them later (see Section 2 below) — that reuse happens in Phase 2, not now.

**Out of scope for this phase:** any page other than Home, Events, News/Posts, rich media galleries, social embeds, or anything from the old Wix site's "Shop"/"Library"/membership content. Keep the homepage content itself simple: a hero section (image + heading + short mission statement) and a single plain-text body area (paragraphs separated by blank lines — no rich text yet) — do not try to replicate every pixel of the old Wix homepage.

---

## Step 1: Data Model — the `tofd-pages` Table

Even though this phase only exposes editing for the homepage, design the table generically from the start so Phase 2 doesn't require a schema migration:

1. In `infra/live/`, replace the Phase 0 placeholder DynamoDB table with a new table `tofd-pages`:
   - Hash key: `slug` (String) — e.g. `"home"`.
   - `PAY_PER_REQUEST` billing.
   - Attributes (not all required to be in the key schema, just the item shape your application code will read/write): `slug`, `title` (optional), `heroImageUrl` (optional — stored by the API, not editable in the Phase 1 UI), `heroHeading` (required), `missionStatement` (required), `body` (required, **plain text** — paragraphs separated by blank lines, never rendered as HTML; always stored with `bodyFormat: "text"` so Phase 2 can add other formats), `updatedAt`, `updatedBy`.
   - API-enforced limits: `heroHeading` ≤ 200 chars, `missionStatement` ≤ 2000, `body` ≤ 20000, `title` ≤ 200. Unknown fields, wrong types, and missing required fields are rejected with 400 plus a human-readable error list.
   - The slug allow-list is exactly `{"home"}` in Phase 1 (a constant in the Lambda, widened in Phase 2); GET/PUT for any other slug return 404.
2. Remove the Phase 0 `tofd-placeholder` table and its references once the new table is in place and working — don't leave unused infrastructure behind.

## Step 2: Backend API

Extend the existing single Lambda function (Powertools resolver) from Phase 0 with these routes:

| Method | Path | Auth | Behavior |
|---|---|---|---|
| `GET` | `/api/pages/{slug}` | None (public) | Fetch a single page item from `tofd-pages` by `slug`. Return 404 if not found. |
| `PUT` | `/api/pages/{slug}` | **Cognito JWT required** | Upsert the page item. Validate the request body has the expected fields (reject unknown/missing required fields with a 400, don't silently accept garbage — client-supplied `updatedAt`/`updatedBy`/`bodyFormat` are rejected as unknown fields). Set `updatedAt` server-side in ISO UTC (don't trust a client-supplied timestamp) and `updatedBy` from the JWT `email` claim, falling back to `sub`. |

1. Configure the API Gateway HTTP API's JWT authorizer against the Cognito User Pool created in Phase 0 (issuer `https://cognito-idp.<region>.amazonaws.com/<pool_id>`, audience = the app client ID), and attach it specifically to the `PUT` route (not the `GET` route — the public site needs unauthenticated reads). Defense in depth: the Lambda itself returns 401 if a PUT arrives without `requestContext.authorizer.jwt.claims`.
2. CORS: the HTTP API allows only the admin origin (`https://<admin_hostname>`; methods `GET,PUT,OPTIONS`; headers `authorization,content-type`; `max_age` 3600). The admin app calls the API Gateway invoke URL directly (new `api_base_url` Terraform output, no stage prefix — the `$default` stage is used). The public site keeps calling same-origin `/api/*` through CloudFront and never hits CORS.
2. Add unit tests in `backend/tests/` covering: successful GET of an existing page, 404 for a missing page, successful PUT with a valid JWT, 401/403 for PUT without a valid JWT, and 400 for a malformed PUT body.
3. Update the Lambda's IAM execution role (via Terraform) to grant read/write on `tofd-pages` and remove the now-unused placeholder table permissions.

## Step 3: Cognito — Create One Real Admin User

1. Create admin users **in Terraform**: a root variable `admin_emails` (list(string), default `[]`, set in committed `infra/live/terraform.tfvars`) is wired into the Cognito module, which creates one `aws_cognito_user` per email (attributes `email` + `email_verified=true`, `desired_delivery_mediums = ["EMAIL"]`, and **no `password` argument** — Cognito generates a temporary password and emails it; nothing secret is stored in state or git).
2. Document in `infra/live/README.md`: the temporary password arrives by email (check spam), expires in 7 days (`temporary_password_validity_days` on the pool); to resend it, taint/recreate the user or use the console "resend invitation"; adding future admins = append to `admin_emails`.

## Step 4: Admin App — Minimal Homepage Editor

In `frontend/admin/`:

1. Add Cognito authentication using AWS Amplify's Auth library or `amazon-cognito-identity-js` (pick one, Amplify is more batteries-included and reduces hand-rolled token-refresh code — prefer it unless there's a strong reason not to). Configure it with the Cognito User Pool ID and App Client ID from Terraform outputs (passed into the frontend build as environment variables — do not hardcode them, but note these are not secrets, they're public client identifiers safe to bundle into a static build).
2. Build a login page (email + password form, using the Cognito flow — handle the "force change password" state for the first login from Step 3 since that user starts with a temporary password).
3. After login, show a single form: "Edit Homepage" with fields for hero heading, mission statement, and body (a plain `<textarea>` is acceptable for this phase — do not integrate a rich text editor library yet, that's a reasonable Phase 2 upgrade once there's more than one page to justify the dependency). `heroImageUrl` is stored by the API but deliberately not editable in this UI.
4. On load, `GET ${VITE_API_BASE_URL}/pages/home`: if it 404s, prefill the form with the default-copy module (the live Wix homepage text, flagged "confirm with the Temple") — do **not** save until the user presses Save. Configure Amplify Auth (`signIn`, `confirmSignIn` for the forced new-password step, `fetchAuthSession` for the ID token, `signOut`) from `VITE_COGNITO_USER_POOL_ID`, `VITE_COGNITO_APP_CLIENT_ID`, `VITE_API_BASE_URL` (public identifiers, not secrets — see `.env.example`).
5. On save, `PUT ${VITE_API_BASE_URL}/pages/home` with the form data and the user's Cognito **ID token** as `Authorization: Bearer <idToken>` (success banner: "Saved — your changes are live on the site"). Show a clear success/error message — this is for a non-technical editor, so error states need to be human-readable, not raw stack traces or HTTP status codes.
6. Add a logout button.

## Step 5: Public Site — Render the Homepage from the CMS

In `frontend/public-site/`:

1. Replace the Phase 0 placeholder page with a real homepage component that calls `GET /api/pages/home` (same-origin via CloudFront's `/api/*` behavior from Phase 0 — no CORS configuration needed here) and renders: hero image + heading, mission statement, and the body content.
2. Handle the loading and "not yet created" states gracefully (e.g., if nobody has saved homepage content yet, show a simple fallback rather than a blank page or an error).
3. Keep styling minimal and clean — this is not the final design pass, just enough to look like a real, presentable page for the feedback checkpoint below. Don't invest heavily in visual design yet; that's better done once the Temple has given input in the checkpoint meeting.
4. Hero image: `planning/assets/legacy-images/temple-ritual.jpg` is copied to `frontend/public-site/public/` and used as the default when the page item has no `heroImageUrl`. Render `body` as plain-text paragraphs split on blank lines — text nodes only, never `dangerouslySetInnerHTML`. Set `<title>` to "Temple of the Feminine Divine".

## Step 6: Seed Real Content (If Available)

The agreed homepage copy is not yet confirmed by the Temple. Both apps carry the same default-copy module containing the live Wix homepage text, flagged in code comments as "confirm with the Temple". When the Temple confirms wording, update the defaults module and/or save corrected content through the admin app. No placeholder-labeled copy is used.

---

## Acceptance Criteria

1. A human can navigate to the admin app URL, log in with the Cognito user from Step 3, see the homepage edit form (pre-filled if content already exists), change the text, save, and get a clear success message.
2. Refreshing the public site shows the updated content within the time it takes CloudFront's cache to reflect it (acceptable for this phase: the `/api/*` behavior should have caching disabled per Phase 0's setup, so changes should appear on refresh with no manual invalidation needed).
3. An unauthenticated request to `PUT /api/pages/home` is rejected (401/403), proving the auth boundary works.
4. All new backend code has test coverage per Step 2.
5. No hardcoded credentials exist anywhere in the repository.

**STOP after this phase and present the working homepage to the Temple for feedback** (per the master plan's ground rules). Capture their feedback in `planning/` (a new dated note is fine) before starting Phase 2 — their input may change what Phase 2 prioritizes.
