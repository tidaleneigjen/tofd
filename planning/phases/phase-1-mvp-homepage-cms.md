# Phase 1 Prompt: MVP Homepage CMS

**You are a coding agent implementing Phase 1 of the TOFD website rebuild.** This document is your complete task brief.

## Prerequisites — Verify Before Starting

- Phase 0 is complete and confirmed working by the human: `main` has the clean repo structure, the Terraform pipeline deploys on merge, and `GET /api/health` returns successfully through CloudFront.
- If any of that isn't true, **stop and say so** — do not attempt to redo or second-guess Phase 0's infrastructure from scratch.
- Read `planning/2026-11-10-architecture-pivot-and-master-plan.md` for architecture context and `planning/2026-10-25-content-types-and-cms-mapping.md` Section 2 ("Static Content") for what the Home page currently contains/should contain.

## Goal of This Phase

Prove the **entire content pipeline** end-to-end on the smallest possible scope: a non-technical admin can log in, edit the homepage's content, save it, and see the change reflected on the live public site — all through infrastructure that already exists from Phase 0, extended just enough to support this.

**Scope is deliberately narrow: only the homepage.** Do not build editing for any other page in this phase, even though the data model you build should be reusable for them later (see Section 2 below) — that reuse happens in Phase 2, not now.

**Out of scope for this phase:** any page other than Home, Events, News/Posts, rich media galleries, social embeds, or anything from the old Wix site's "Shop"/"Library"/membership content. Keep the homepage content itself simple: a hero section (image + heading + short mission statement) and a single rich-text body area — do not try to replicate every pixel of the old Wix homepage.

---

## Step 1: Data Model — the `tofd-pages` Table

Even though this phase only exposes editing for the homepage, design the table generically from the start so Phase 2 doesn't require a schema migration:

1. In `infra/live/`, replace the Phase 0 placeholder DynamoDB table with a new table `tofd-pages`:
   - Hash key: `slug` (String) — e.g. `"home"`.
   - `PAY_PER_REQUEST` billing.
   - Attributes (not all required to be in the key schema, just the item shape your application code will read/write): `slug`, `title`, `heroImageUrl`, `heroHeading`, `missionStatement`, `body` (rich text, stored as a string — plain HTML or Markdown, your choice, but be consistent and document which one in `backend/src/README.md`), `updatedAt`, `updatedBy`.
2. Remove the Phase 0 `tofd-placeholder` table and its references once the new table is in place and working — don't leave unused infrastructure behind.

## Step 2: Backend API

Extend the existing single Lambda function (Powertools resolver) from Phase 0 with these routes:

| Method | Path | Auth | Behavior |
|---|---|---|---|
| `GET` | `/api/pages/{slug}` | None (public) | Fetch a single page item from `tofd-pages` by `slug`. Return 404 if not found. |
| `PUT` | `/api/pages/{slug}` | **Cognito JWT required** | Upsert the page item. Validate the request body has the expected fields (reject unknown/missing required fields with a 400, don't silently accept garbage). Set `updatedAt` server-side (don't trust a client-supplied timestamp) and `updatedBy` from the authenticated user's identity (available in the Cognito JWT claims passed through by API Gateway). |

1. Configure the API Gateway HTTP API's JWT authorizer against the Cognito User Pool created in Phase 0, and attach it specifically to the `PUT` route (not the `GET` route — the public site needs unauthenticated reads).
2. Add unit tests in `backend/tests/` covering: successful GET of an existing page, 404 for a missing page, successful PUT with a valid JWT, 401/403 for PUT without a valid JWT, and 400 for a malformed PUT body.
3. Update the Lambda's IAM execution role (via Terraform) to grant read/write on `tofd-pages` and remove the now-unused placeholder table permissions.

## Step 3: Cognito — Create One Real Admin User

1. In `infra/live`'s Cognito module, this phase is where you actually need a logged-in user to test with. **Do not hardcode a password in Terraform or in any committed file.** Instead:
   - Either add a `null_resource`/local-exec step that creates a user via `aws cognito-idp admin-create-user` with a temporary password that must be changed on first login (and document this as a one-time manual step the human runs, similar in spirit to the Phase 0 bootstrap exception), **or**
   - Document clearly in `infra/live/README.md` that after this phase's first deploy, the human needs to run a one-line AWS CLI command to create the first admin user (give the exact command, with the pool ID coming from a Terraform output).
2. Either approach is fine — the point is: no credentials in git, ever, and the process for creating the first admin is documented, not ad-libbed later.

## Step 4: Admin App — Minimal Homepage Editor

In `frontend/admin/`:

1. Add Cognito authentication using AWS Amplify's Auth library or `amazon-cognito-identity-js` (pick one, Amplify is more batteries-included and reduces hand-rolled token-refresh code — prefer it unless there's a strong reason not to). Configure it with the Cognito User Pool ID and App Client ID from Terraform outputs (passed into the frontend build as environment variables — do not hardcode them, but note these are not secrets, they're public client identifiers safe to bundle into a static build).
2. Build a login page (email + password form, using the Cognito flow — handle the "force change password" state for the first login from Step 3 since that user starts with a temporary password).
3. After login, show a single form: "Edit Homepage" with fields for hero heading, mission statement, and body (a plain `<textarea>` is acceptable for this phase — do not integrate a rich text editor library yet, that's a reasonable Phase 2 upgrade once there's more than one page to justify the dependency).
4. On load, `GET /api/pages/home` and populate the form (handle the case where it doesn't exist yet — show an empty form, don't crash).
5. On save, `PUT /api/pages/home` with the form data and the user's Cognito JWT in the `Authorization` header. Show a clear success/error message — this is for a non-technical editor, so error states need to be human-readable, not raw stack traces or HTTP status codes.
6. Add a logout button.

## Step 5: Public Site — Render the Homepage from the CMS

In `frontend/public-site/`:

1. Replace the Phase 0 placeholder page with a real homepage component that calls `GET /api/pages/home` (same-origin via CloudFront's `/api/*` behavior from Phase 0 — no CORS configuration needed here) and renders: hero image + heading, mission statement, and the body content.
2. Handle the loading and "not yet created" states gracefully (e.g., if nobody has saved homepage content yet, show a simple fallback rather than a blank page or an error).
3. Keep styling minimal and clean — this is not the final design pass, just enough to look like a real, presentable page for the feedback checkpoint below. Don't invest heavily in visual design yet; that's better done once the Temple has given input in the checkpoint meeting.
4. Use one of the preserved legacy images from `planning/assets/legacy-images/` as the hero image if it fits, or a simple placeholder if none do — flag this choice for discussion in the feedback checkpoint rather than treating it as final.

## Step 6: Seed Real Content (If Available)

If meeting notes or decisions exist from `planning/2026-10-25-first-meeting-agenda.md` (check whether that meeting has happened and whether notes were added to `planning/2026-09-22-tofd-migration-plan.md`'s content inventory), use the agreed mission statement/homepage copy as the first real content saved through the admin app. If no such notes exist yet, use clearly-labeled placeholder copy (e.g., "[PLACEHOLDER — confirm wording with the Temple]") rather than inventing permanent-sounding copy on your own.

---

## Acceptance Criteria

1. A human can navigate to the admin app URL, log in with the Cognito user from Step 3, see the homepage edit form (pre-filled if content already exists), change the text, save, and get a clear success message.
2. Refreshing the public site shows the updated content within the time it takes CloudFront's cache to reflect it (acceptable for this phase: the `/api/*` behavior should have caching disabled per Phase 0's setup, so changes should appear on refresh with no manual invalidation needed).
3. An unauthenticated request to `PUT /api/pages/home` is rejected (401/403), proving the auth boundary works.
4. All new backend code has test coverage per Step 2.
5. No hardcoded credentials exist anywhere in the repository.

**STOP after this phase and present the working homepage to the Temple for feedback** (per the master plan's ground rules). Capture their feedback in `planning/` (a new dated note is fine) before starting Phase 2 — their input may change what Phase 2 prioritizes.
