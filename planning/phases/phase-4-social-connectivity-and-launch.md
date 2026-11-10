# Phase 4 Prompt: Social Connectivity & Launch

**You are a coding agent implementing Phase 4 of the TOFD website rebuild.** This document is your complete task brief.

## Prerequisites — Verify Before Starting

- Phases 0-3 are complete and the Temple has given feedback on the functional site (static pages, news, events) that has been incorporated.
- Read `planning/2026-10-25-content-inventory-sitemap.md` Section 5 for the confirmed social media accounts (Facebook `BangorTOFD`, Twitter/X `bangortofd`, Pinterest `BangorTOFD`, Instagram `bangortofd`, YouTube channel, LibraryThing catalog) and `planning/2026-09-22-tofd-migration-plan.md` Section 4 Phase 4/Section 1.3 for the "modern & connected" goal this phase fulfills. **Confirm with the human which of these accounts are actually still active before embedding any of them** — their existence on the old site doesn't guarantee they're maintained.

## Goal of This Phase

This is the **last phase before the real domain goes live**. It covers two distinct things: (1) the "modern and connected" social media integration from the original project goals, and (2) the actual cutover from the live Wix site to the new AWS-hosted site. These are grouped together because launch readiness is naturally the last checkpoint, not because they're technically related — treat them as two sub-phases within this document and complete Part A fully before starting Part B.

---

## Part A: Social Media & Final Content Polish

### Step 1: Social Embeds

1. Add a "Connect with us" section (footer and/or a dedicated area on the Home page) with links to whichever social accounts the human confirms are still active. Simple icon links are the minimum bar — do not build this as a new backend content type; these are a handful of fixed URLs, appropriate as a small config object in the frontend code (or, if the human wants them editable without a code deploy, add them as fields on the existing `home` page item in `tofd-pages` rather than inventing a new table for 5 URLs).
2. If the human wants a **live embedded feed** (e.g., recent Facebook or Instagram posts shown directly on the site, not just a link out) rather than static links, this requires a third-party embed widget or API integration (e.g., Meta's oEmbed/Graph API, which has its own app-registration and token-management requirements). This is a meaningfully bigger task than static links — **confirm with the human whether this is wanted for launch or is a nice-to-have for later** before investing time in it. If deferred, note it clearly as a follow-up item rather than silently dropping it.
3. Add a Library section/link pointing to the LibraryThing catalog (`librarything.com/catalog/TOFD`) confirmed in the content-inventory doc — per that doc's recommendation, this should be a simple outbound link, not a rebuilt library feature, unless the human says otherwise after confirming with the Temple that the catalog is current.

### Step 2: Content & Functional QA Pass

Before touching DNS, do a full side-by-side comparison against the current live Wix site (`https://www.templeofthefemininedivine.org/`) and the content inventory doc:

1. Every page/section identified in `planning/2026-10-25-content-inventory-sitemap.md` Section 2 has either been intentionally recreated, intentionally improved, or intentionally dropped with the human's sign-off (e.g., the "Shop" e-commerce catalog being replaced by simple payment buttons is an intentional, already-decided change — don't flag that as a gap, but do confirm nothing was *accidentally* missed).
2. Mobile responsiveness check on both the public site and admin app — the original Wix site, whatever its flaws, was at least usable on mobile; don't regress that.
3. Basic accessibility pass (alt text on images, sufficient color contrast, form labels) — not a full audit, but don't ship obviously broken accessibility given the Temple is a public-facing community organization.
4. Confirm the "coming soon" pattern from Phase 2 isn't still showing for any page that's supposed to be finished by now.

---

## Part B: Domain Cutover

**This part makes the new site live at the Temple's real domain, replacing Wix. Do not start Part B until the human has explicitly confirmed Part A is approved and they're ready to go live** — this is not a step to proceed through automatically just because the code is ready.

### Step 3: Pre-Cutover Checklist

1. Confirm who controls the domain registrar for `templeofthefemininedivine.org` (flagged as an open question since the original discovery phase — if still unresolved, stop here and get this confirmed by the human before proceeding).
2. Determine the Route 53 situation for `templeofthefemininedivine.org`. Phase 0 deployed to the **interim domain** `tofd.graycandle.org` on the existing `graycandle.org` zone, so a hosted zone for the real domain likely does **not** exist yet — the first cutover PR below creates it. If one does already exist in the AWS account, its ID goes in `existing_hosted_zone_id` with `create_hosted_zone = false`; otherwise use `create_hosted_zone = true` and read the new zone's name servers from `terraform output` (`hosted_zone_name_servers`).
3. Confirm the current Wix subscription status and whether the human wants to keep it active briefly as a fallback during the transition (recommended) or cancel immediately (not recommended — DNS propagation can take time, and having Wix as a fallback during that window is cheap insurance).
4. Take note of the current live Wix site's content one final time (screenshot or export) in case anything needs to be referenced after cutover.

### Step 4: Cutover

The site is already live on the interim domain `tofd.graycandle.org` (and `admin.tofd.graycandle.org`) with a real ACM certificate, served from the existing `graycandle.org` hosted zone. Cutover to `templeofthefemininedivine.org` is a **tfvars-only change** in `infra/live/terraform.tfvars`, done as **two PRs** because ACM DNS validation requires the new zone to be publicly authoritative first.

1. **PR 1 — create the new hosted zone (custom domains temporarily off).** In `terraform.tfvars` set `zone_name = "templeofthefemininedivine.org"`, `public_hostname = "www.templeofthefemininedivine.org"`, `admin_hostname = "admin.templeofthefemininedivine.org"`, `create_hosted_zone = true` (or `false` + `existing_hosted_zone_id` if a zone already exists), `existing_hosted_zone_id = ""`, and `enable_custom_domains = false`. Merge. The apply creates only the new hosted zone — no certs (they would hang on validation against a non-authoritative zone), no aliases, no alias records. **Note:** this also destroys the interim `tofd.graycandle.org` certs/aliases/records (they are Terraform-managed), so the interim hostname stops serving — expected; the default `*.cloudfront.net` domains keep working throughout. Read the new zone's name servers from `terraform output` (`hosted_zone_name_servers`).
2. At the domain registrar, update the nameservers for `templeofthefemininedivine.org` to those four AWS name servers. **This is a manual action taken by whoever controls the registrar account — it is explicitly not something to automate via Terraform**, since nameserver changes are a one-time, high-stakes, human-approved event, not a repeatable infrastructure deployment.
3. Monitor DNS propagation (`dig templeofthefemininedivine.org NS`) until the domain resolves to the Route 53 name servers — i.e., until the new hosted zone is publicly authoritative.
4. **PR 2 — enable custom domains.** Set `enable_custom_domains = true` in `terraform.tfvars` and merge. The apply then requests + DNS-validates the ACM certificates for `www.`/`admin.` (validation succeeds — the zone is authoritative), attaches them and the aliases to the CloudFront distributions, and creates the Route 53 A/AAAA alias records pointing those names at the distributions. The interim `tofd.graycandle.org` validation CNAMEs and alias records are destroyed/replaced by the same apply since they are Terraform-managed — review the plan to confirm; if the interim URL should remain reachable afterwards, that is a separate decision requiring deliberately unmanaged records.
5. Verify HTTPS works correctly on the real domain (`curl -I https://www.templeofthefemininedivine.org`) and that the ACM certificate is being served correctly (no browser warnings).
6. Verify the admin app is reachable at `admin.templeofthefemininedivine.org` and still functions correctly now that it's on its final domain (re-check Cognito app client configuration — Cognito hosted UI/redirect URLs, if used, may need updating to reference the final domain instead of the interim `*.graycandle.org` or `*.cloudfront.net` URLs used during development).
7. **Open decision for the human — apex domain handling:** decide whether `templeofthefemininedivine.org` (apex, no `www`) should redirect to `www.templeofthefemininedivine.org`. This was deliberately not built — it needs either a CloudFront function/response-headers-policy redirect on a second alias + cert SAN, or a separate lightweight redirect. Confirm the desired behavior with the Temple before implementing; do not assume.
8. Once confirmed stable (the original migration plan suggested waiting through at least one full propagation cycle, roughly 24-48 hours, before fully relying on it), the human can downgrade or cancel the Wix subscription.

### Step 5: Post-Launch

1. Set up a CloudWatch billing alarm (consistent with the cost-consciousness principle repeated throughout this project) at a reasonable threshold (e.g. $15-20/month) so unexpected cost growth is caught early.
2. Do a final pass updating `README.md` and `planning/2026-11-10-architecture-pivot-and-master-plan.md` to reflect the site is live, linking to this document as the completed launch record.
3. Confirm with the human whether there's an ongoing "Phase 5+" backlog (e.g., the live social feed embed deferred in Step 1, RSVP features not built in Phase 3, further design polish) and capture it as a new dated planning doc rather than letting it live only in conversation.

---

## Acceptance Criteria

1. Social links (and, if built, embedded feeds) are live and point to confirmed-active accounts only.
2. A full content/functional QA pass has been completed and signed off by the human.
3. `templeofthefemininedivine.org` and `www.templeofthefemininedivine.org` resolve to the new AWS infrastructure with valid HTTPS.
4. The admin app works correctly on its final domain.
5. A billing alarm is in place.
6. Any deferred/follow-up work is documented, not lost.

This is the last phase in the current plan. Future enhancements should get their own new dated planning document rather than being appended indefinitely to this one, consistent with how this project has used dated, living documents throughout.
