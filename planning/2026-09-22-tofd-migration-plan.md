# Temple of the Feminine Divine — Migration & Modernization Plan (Living Document)

> **⚠️ SUPERSEDED (2026-11-10):** The WordPress-based CMS/hosting recommendation in this document (Sections 3 and 5) has been replaced by a custom Python/Lambda/DynamoDB/React build. See `2026-11-10-architecture-pivot-and-master-plan.md` for the current architecture and `phases/` for the implementation plan. The content goals, Wix-platform findings (Sections 1-2), and cost-consciousness principles in this document **still apply** — only the specific CMS/hosting technology choice changed.

**Status:** Draft — living document, update as decisions are made or reversed.
**Last updated:** 2026-09-22
**Note:** The existing `tofd/` repo (React + Vite scaffold) in this directory is **not** considered part of this project's history or starting point — it's disregarded per explicit instruction. This plan starts from the live production site only. Any new implementation work should treat this `planning/` folder as the source of truth going forward; the old scaffold can be archived or removed once a real implementation choice is made.

**See also:**
- `2026-11-10-architecture-pivot-and-master-plan.md` — **current top-level plan**: why WordPress was dropped and the new custom CMS architecture, with links to phase-by-phase implementation prompts.
- `2026-10-25-content-inventory-sitemap.md` — detailed page-by-page crawl/content audit and a draft new-site sitemap proposal. Still fully applicable.
- `2026-10-25-content-types-and-cms-mapping.md` — partitions content into static pages vs. CMS-managed collections (Posts, Events, Memberships) vs. external/linked content. The content/field analysis still applies; the WordPress mapping is superseded.
- `2026-10-25-first-meeting-agenda.md` — agenda for the first priorities-setting meeting with the Temple.

---

## 1. What Exists Today

**Live URL:** https://www.templeofthefemininedivine.org/

### 1.1 Platform

- Hosted on **Wix** (confirmed via `wix.com?utm_campaign=vir_created_with` footer link and Wix-style URL slugs like `/vision-mission`, `/events-1`).
- No access to underlying source/templates — Wix is a proprietary hosted platform; there is nothing to "migrate" in a code sense, only content and structure to recreate.

### 1.2 Site structure / content inventory (as of 2026-09-22)

| Page              | URL                                    | Notes                                                                                     |
| ----------------- | -------------------------------------- | ----------------------------------------------------------------------------------------- |
| Home              | `/`                                    | Hero image, mission statement excerpt, "Temple News" blog-style update, newsletter signup |
| Contact           | `/contact`                             |                                                                                           |
| About Us          | `/membership` (linked from "About Us") | Note: URL slug doesn't match label — likely a Wix artifact from page renaming             |
| Vision & Mission  | `/vision-mission`                      |                                                                                           |
| History           | `/history`                             |                                                                                           |
| Honoring Kay      | `/services`                            | Slug mismatch again — labeled "Honoring Kay" but URL is `/services`                       |
| Iseum Musicum     | `/iseum-musicum`                       | Likely music/ritual program page                                                          |
| TOFD News         | `/news`                                | Blog/news updates                                                                         |
| Events            | `/events-1`                            | Note the `-1` suffix — suggests a duplicate/rebuilt page in Wix's history                 |
| Library           | `/library`                             | Likely resources/reading material                                                         |
| Donate            | `/donate`                              |                                                                                           |
| Shop              | `/shop`                                | Wix e-commerce (unclear if actively used)                                                 |
| Newsletter signup | embedded on Home                       | "Subscribe Now" form                                                                      |

### 1.3 Observed content/UX issues

**A full page-by-page crawl (including Wix's sitemap index, which surfaced pages not in the visible nav) was done on 2026-10-25 — see `2026-10-25-content-inventory-sitemap.md` for full detail. Summary of findings:**

- **Roughly half the main nav pages are empty or placeholder**, not just outdated: "About Us" (`/membership`) and "Honoring Kay" (`/services`) have zero body content; "Vision & Mission" and "History" literally just say "COMING SOON! Check back for updates"; "Library" is empty. This is a content gap, not just a design refresh.
- **Stale content:** the homepage "Temple News" section references COVID-19 and says "no in-person events planned" — but the Events page itself shows a multi-year history of recurring events (rituals, business meetings, Red Tent, Open Temple) through 2022, and the News blog's last post was November 2023. The site hasn't been actively maintained in some time.
- **"Shop" is not general merchandise** — it only sells two things: Individual ($40) and Family ($75) annual memberships. It's effectively the online membership-purchase mechanism, tightly linked from the Donate page. Important to clarify this distinction before any "cut Shop" discussion.
- **"Library" may already exist elsewhere:** a LibraryThing catalog (`librarything.com/catalog/TOFD`) is linked from the Iseum Musicum page's social icons — this may be the real home of "Library" content, making a simple link/embed far cheaper than rebuilding a library feature from scratch.
- **A hidden `/members` page** exists (found via sitemap, not linked in nav) — empty when crawled; worth asking directly what it was for.
- **Inconsistent URL slugs vs. page labels** (`/membership` for "About Us", `/services` for "Honoring Kay") — a sign of ad hoc page renaming in Wix without cleaning up slugs; worth deciding whether to preserve old URLs (for any existing backlinks/bookmarks) or take the opportunity to fix them during migration.
- **Social media reliance without embedding:** the site tells visitors to "See us on Facebook" for ritual schedules rather than showing that content on-site. We now have the actual accounts (found on the Iseum Musicum page only): Facebook (`BangorTOFD`), Twitter/X (`bangortofd`), Pinterest (`BangorTOFD`), Instagram (`bangortofd`), YouTube, and the LibraryThing catalog above. Clear opportunity to surface these site-wide and/or embed live feeds.
- **Org identity:** 501(c)(3) nonprofit, mailing address in Brooks, ME, but social handles use "BangorTOFD" — worth clarifying which location is the organization's primary public identity. Contact via `webgoddess@templeofthefemininedivine.org`. Relevant for footer/legal content and possibly for donation-page requirements (tax-deductibility language, EIN, etc. — verify current page has this).
- **Iseum Musicum is the most complete, functional page on the site** — real program description, application PDF, and a working payment flow for classes. Good benchmark for what "done" content looks like elsewhere on the site.

### 1.4 What we don't yet know (needs direct input from the Temple, not just the public site)

- Who currently edits the Wix site, and how comfortable are they with a new CMS's editing UI? ("less tech-savvy person" is the stated constraint, but knowing their specific familiarity — e.g., have they used WordPress, Squarespace, Google Docs-like editors — helps pick the right CMS.)
- Wix subscription/plan currently in use (relevant for domain ownership transfer and understanding current spend to compare against).
- Domain registrar/DNS control for `templeofthefemininedivine.org` — needed to plan cutover.
- Whether membership purchases ("Shop") and the PayPal donation flow need to carry over as-is, or whether there's an appetite to change payment providers.
- Whether `/library` should simply link/embed the existing LibraryThing catalog rather than be rebuilt as native content — confirm the catalog is current and intended to be public-facing.
- What the hidden `/members` page was for (abandoned feature vs. intended members-only portal).
- Existing email list size/provider for the newsletter (Wix's built-in tool, or something like Mailchimp?) — affects whether newsletter migration is in scope. Note: newsletter PDFs were previously distributed via blog posts (last one Aug 2023) — confirm whether a newsletter is still being produced through some other channel today.
- Current social media presence details (Facebook page, Instagram?, etc.) to plan integration.

---

## 2. Goals (from stated requirements)

1. Recreate the site "in a sensible way" — clean, modern structure, mobile-friendly, maintainable.
2. Build on a **CMS a less-tech-savvy person can maintain** (content edits, event posting, news updates — without needing a developer).
3. **Modernize** the design.
4. **Increase social/community connectivity** (social media integration, possibly an events feed, mailing list, etc.).
5. Deploy to **AWS in a cost-efficient way** (per your stated cross-project constraint).
6. Treat this as a **living document** — revisit and adjust as the project progresses.

---

## 3. CMS Recommendation

You asked for a recommendation rather than pre-selecting a direction. Given the constraints (non-technical maintainer, nonprofit budget, cost-efficient AWS hosting, want for "modern" but not necessarily custom-built):

### Recommended: **WordPress**, self-hosted cost-efficiently on AWS

**Why:**

- By far the most common CMS for exactly this profile (nonprofit/community org, non-technical volunteer editors). Editing experience (block editor / Gutenberg) is well documented, widely tutorialized, and something a volunteer can likely find help with elsewhere if you're not available.
- Enormous plugin ecosystem covers every stated need out of the box: events calendars (e.g., "The Events Calendar"), donation/payment integration (e.g., Give, or simple PayPal/Stripe buttons), newsletter integration (Mailchimp/ConvertKit plugins), social media embedding (native Facebook/Instagram embed blocks, or plugins like Smash Balloon for live feeds), and e-commerce if Shop is still needed (WooCommerce).
- Well-trodden path for cost-efficient AWS hosting (see Section 5) — Lightsail has an official WordPress blueprint, or a small EC2/RDS-lite setup works fine at this traffic scale.
- Avoids reinventing a custom admin UI (unlike the Anu Dudley project, where a bespoke Django+React CMS made sense because of unique data types) — TOFD's needs (pages, news posts, events, a donate page) are exactly what WordPress is built for; a custom build here would be reinventing commodity functionality.

### Alternatives considered and why they rank lower for this specific case

- **Headless CMS (Sanity/Contentful/Strapi) + static frontend:** more "modern" architecturally and appealing from a developer's perspective, but adds real friction for a non-technical editor (content modeling, a separate deploy step for frontend changes, more moving pieces to maintain long-term without you). Better fit for a client who wants tight design control and has ongoing dev support — not clearly this case.
- **Reuse the Django/serverless pattern from anududley.com:** would require building a custom CMS admin (pages, blog posts, events, donate/shop) from scratch — essentially redoing the work WordPress plugins already provide, for a site whose content model doesn't need anything WordPress can't do. Consistency-with-your-other-project is a nice-to-have, not worth the extra build effort here.
- **Wix (stay put) or another SaaS builder (Squarespace):** simplest for the editor, but keeps you off AWS (conflicts with your stated hosting goal) and typically costs more monthly than a small self-hosted WordPress instance at this traffic scale, with less control.

**Record your decision here once confirmed** — this section should be updated to reflect the final choice and rationale before implementation begins.

---

## 4. Proposed Step-by-Step Plan

### Phase 0: Discovery & Content Audit

- Answer the "what we don't yet know" questions in Section 1.4 (talk to whoever currently maintains the Wix site).
- Full content export: screenshot or copy every page's text/images from the live Wix site (Wix does not offer a clean export — expect manual copy work). Store raw content in this `planning/` folder (e.g. `content-audit/` subfolder) as the source of truth for what needs to be recreated.
- Decide which pages are kept, merged, cut, or added (e.g., is "Shop" worth keeping? Should "Honoring Kay" become an archived tribute page vs. a nav item?).
- Confirm domain registrar access for `templeofthefemininedivine.org` (needed for Phase 4 cutover).

### Phase 1: Information Architecture & Design Direction

- Sketch new sitemap/nav (likely: Home, About [Vision & Mission, History, Honoring Kay merged as subpages], News/Blog, Events, Library, Donate, Contact — Shop only if confirmed active).
- Pick a WordPress theme (or a simple custom block-based theme) that's modern, mobile-first, and easy to edit within the block editor without breaking layout — favor a well-supported, actively maintained free/low-cost theme over a heavily customized one, to keep long-term maintenance low for a non-technical editor.
- Define the "modern + connected" enhancements concretely, e.g.:
  - Embedded live Facebook/Instagram feed (replacing "see Facebook for updates" text).
  - A real Events section (WordPress events plugin) replacing the stale "no events planned" copy.
  - Social share buttons on News/blog posts.
  - Newsletter signup wired to an actual email service (Mailchimp free tier or similar) if not already.

### Phase 2: Build

- Stand up WordPress in a **staging environment first** (see Section 5 for hosting approach) — never build directly against the domain that's currently live on Wix.
- Recreate pages/content per the Phase 0 audit and Phase 1 IA, following the static-vs-collection split in `2026-10-25-content-types-and-cms-mapping.md`: hand-authored **Pages** for static content (About, Vision & Mission, History, Honoring Kay, Iseum Musicum, Donate, Contact), native **Posts + Categories** for the news/blog archive, an **events plugin** for the calendar, and simple payment-link buttons (not a full e-commerce catalog) for the two membership tiers.
- Install/configure only the plugins actually needed (events, social embed, forms/newsletter) — avoid plugin sprawl, which is the main long-term maintenance/security risk for a non-technical admin.
- Set up backups (e.g., a scheduled plugin like UpdraftPlus configured to store backups in S3) from day one — critical since a non-technical maintainer won't be doing manual DB dumps.

### Phase 3: Content Migration & Review

- Migrate all audited content into the new WordPress site.
- Walk through every page side-by-side with the live Wix site to confirm nothing was dropped.
- Have the actual (non-technical) site maintainer test editing a page and creating a news/event post _before_ cutover — this validates the CMS choice is actually usable by them, which is the whole point of this migration.

### Phase 4: DNS Cutover & Go-Live

- Point `templeofthefemininedivine.org` DNS to the new AWS-hosted WordPress instance (Route 53, following the same pattern already used for anududley.com's domain cutover — see `anududley.com/planning/` and `anududley.com/docs/2026-05-06-domain-setup-guide.md` for a template of the DNS/ACM steps, adapted for a WordPress origin instead of CloudFront+S3+API Gateway).
- Cancel/downgrade the Wix subscription only after confirming the new site is fully live and stable (keep it briefly as a fallback during transition).
- Set up SSL (ACM certificate + CloudFront, or a simpler approach like Let's Encrypt directly on the instance — see hosting options below).

### Phase 5: Post-Launch Enhancements (ongoing, living roadmap)

- Live social media feed embeds.
- Expand Events section functionality (recurring rituals, RSVP if desired later).
- Consider basic analytics (e.g., a privacy-respecting option like Plausible, or Google Analytics if acceptable to the Temple) to inform future content decisions.
- Revisit Shop/e-commerce needs based on real usage data once live.

---

## 5. AWS Hosting Options (Cost-Efficient WordPress)

Mirroring the cost-comparison approach already used for anududley.com (`anududley.com/docs/aws-architecture-cost-comparison.md`), here's the equivalent analysis for a low-traffic WordPress site:

| Option                                  | Description                                            | Est. Monthly Cost                               | Notes                                                                                                                                                                                                |
| --------------------------------------- | ------------------------------------------------------ | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Lightsail WordPress blueprint**       | Pre-configured Bitnami WordPress instance on Lightsail | **$5–10/mo** (512MB–1GB plan) + ~$0.50 Route 53 | Simplest option; AWS-managed image, predictable pricing, includes some data transfer. Recommended starting point.                                                                                    |
| EC2 (t4g.micro) + local MySQL, no RDS   | Self-managed WordPress + MySQL on one small instance   | ~$6–8/mo (EC2) + EBS                            | Cheaper than RDS-backed, but you manage OS/security patching and DB backups yourself — more ops burden for a "hands-off" goal.                                                                       |
| EC2 + RDS (MySQL)                       | Traditional separated app/db tiers                     | ~$20–25/mo                                      | Overkill for this traffic level (≤ a few hundred visitors/month is a reasonable guess for a small nonprofit); mirrors the "Option 1" pattern already rejected for anududley.com for the same reason. |
| CloudFront in front of any of the above | Add CDN caching for images/static assets               | +~$1/mo                                         | Worth adding regardless of compute choice — cheap, speeds up global/mobile visitors, reduces origin load.                                                                                            |

**Recommendation:** Start with **Lightsail's WordPress blueprint** (~$5-10/mo total including a small bundle with SSD storage and a data transfer allowance) + Route 53 hosted zone (~$0.50/mo) + optionally a CloudFront distribution in front of it later once live traffic patterns are known. This matches the "Lightsail" option already evaluated (and priced) for anududley.com and gives the least operational burden — important since you won't be the one doing day-to-day maintenance.

Set a CloudWatch billing alarm (e.g. at $15/mo) as a safety net, consistent with the practice already used for anududley.com.

---

## 6. Open Decisions (revisit as this doc evolves)

| #   | Decision                                                                      | Status                                                                                  |
| --- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 1   | Final CMS choice                                                              | **Recommended: WordPress** — confirm before Phase 2 begins.                             |
| 2   | Hosting approach                                                              | **Recommended: Lightsail WordPress blueprint** — confirm before Phase 2.                |
| 3   | Keep/cut the Shop (e-commerce) section                                        | Needs input from Temple maintainers on actual usage.                                    |
| 4   | Preserve old URL slugs vs. clean them up                                      | Open — affects SEO/bookmarks vs. site tidiness.                                         |
| 5   | Newsletter provider (keep Wix's built-in tool vs. migrate to Mailchimp/other) | Open — depends on current list size/export feasibility.                                 |
| 6   | Which social platforms to integrate (Facebook confirmed; Instagram/others?)   | Needs confirmation from Temple maintainers.                                             |
| 7   | Analytics tool (if any)                                                       | Open — privacy-respecting option preferred given the site's spiritual/community nature. |

---

## 7. Suggested Sequencing Summary

1. **Phase 0** — Discovery & content audit (talk to current maintainer, export all content).
2. **Phase 1** — IA & design direction (sitemap, theme, concrete "modern + connected" feature list).
3. **Phase 2** — Build WordPress site on Lightsail in a staging environment.
4. **Phase 3** — Migrate content, review side-by-side, have real maintainer test-drive editing.
5. **Phase 4** — DNS cutover from Wix to AWS, decommission Wix subscription.
6. **Phase 5** — Ongoing post-launch enhancements (social feeds, events, analytics, Shop re-evaluation).
