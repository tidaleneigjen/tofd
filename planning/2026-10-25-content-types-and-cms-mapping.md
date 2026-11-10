# TOFD Content Types & CMS Mapping

> **⚠️ PARTIALLY SUPERSEDED (2026-11-10):** The content-type partition below (static vs. collection vs. external) and the field-shape analysis (Sections 3-4, confirmed from real Wix detail pages) are **still accurate and used directly** by the Phase 1-3 implementation prompts in `phases/`. Only **Section 7's WordPress-specific mapping** is obsolete — the project now uses a custom Python/Lambda/DynamoDB/React CMS instead of WordPress. See `2026-11-10-architecture-pivot-and-master-plan.md` for the current architecture.

**Status:** Living document — based on crawling list pages *and* individual detail pages.
**Last updated:** 2026-10-25
**Builds on:** `2026-10-25-content-inventory-sitemap.md` (page inventory) — this doc partitions that inventory into **static content** (authored once, edited occasionally) vs. **collection content** (repeating items of the same shape, meant to be added routinely by a non-technical editor) vs. **external/linked content** (lives on a third-party platform already).

This distinction matters directly for the CMS build: static pages map to simple editable page records; collections (Posts, Events) map to their own data tables with list/create/edit UI; external content is just a link/embed, not something to migrate at all. (Originally written with WordPress constructs in mind — see the superseded-notice above.)

---

## 1. Summary

| # | Content type | Static or Collection | Current home | Recommended WordPress construct |
|---|---|---|---|---|
| 1 | Core informational pages (Home, Contact, About, Vision & Mission, History, Honoring Kay, Iseum Musicum, Donate) | **Static** | Wix Pages | WordPress **Pages** (hierarchical, e.g. About > sub-pages) |
| 2 | News/Blog posts (incl. "Newsletters" and "Sabbats" categories) | **Collection** | Wix Blog app (`/news`) | WordPress native **Posts** + **Categories** taxonomy |
| 3 | Events | **Collection** | Wix Events app (`/events-1`) | A WordPress **events plugin** (e.g. "The Events Calendar") — already flagged in the main plan |
| 4 | Memberships ("Shop" products) | **Collection, but very narrow (2 fixed items)** | Wix Stores (`/shop`) | Judgment call — see Section 5; likely **not** worth a full e-commerce plugin |
| 5 | Library catalog | **External** | LibraryThing (`librarything.com/catalog/TOFD`) | Just a link/embed, not migrated content |
| 6 | Social feeds | **External** | Facebook, Instagram, Twitter/X, Pinterest, YouTube | Embed widgets (e.g. Smash Balloon), not migrated content |

---

## 2. Static Content (authored once, edited occasionally)

These are genuinely one-off pages — there's no repeating structure, so they don't need a "collection," just ordinary CMS pages that the editor opens and edits directly:

- **Home** — currently a mix of a mission blurb + a manually-pasted "Temple News" callout. In the new site, that callout should probably just be **the latest 1-2 blog posts pulled in automatically** (see Section 3) rather than hand-copied text — this is exactly the kind of staleness bug (COVID-era message) a CMS with a dynamic "latest posts" block fixes permanently.
- **Contact** — static.
- **About Us, Vision & Mission, History, Honoring Kay** — static, but **currently empty or placeholder** (see inventory doc) — real content needs to be written, not just migrated.
- **Iseum Musicum** — static page, but contains two embedded PDFs (program info, application) and a link to a payment page. The PDFs themselves are just media-library uploads in WordPress; the "payment page" link is really item #4 below (a membership/class-payment product).
- **Donate** — static page with an embedded PayPal button + a link into the membership product (item #4).

---

## 3. Collection: News / Blog Posts

Confirmed by reading individual post pages (`/post/<slug>`), not just the list view. This **is** a real blog-post collection with consistent fields:

| Field | Observed values |
|---|---|
| Title | e.g. "CANCELLATION NOTICE: SAMHAIN ZOOM RITUAL 11/5/2023" |
| Author | Always "Bangor TOFD" (a single shared account — likely the `webgoddess@` role account) |
| Published date | e.g. Nov 4, 2023 |
| Body | Rich text, variable length (some posts are a single sentence; the "0 min read" conference post has no body at all beyond the title) |
| Categories (taxonomy, multi-select) | `Temple News`, `Sabbats`, `Newsletters`, `Upcoming Events` — a post can carry more than one category (e.g. a ritual announcement tagged both Temple News and Sabbats) |
| Attachment (optional) | PDF file — used specifically for the "Newsletters" category (e.g. `TOFD Lughnasadh 2023 Newsletter.pdf`, 6.29MB, described as a 20-page newsletter) |
| Image (optional) | Some posts have an associated photo (e.g. "Samhain altar" photo) |

**Maps cleanly to WordPress's built-in Posts + Categories** — no plugin needed. The PDF attachment is just a media-library file linked from the post body (WordPress handles this natively). The "Newsletters" category effectively makes the newsletter archive just a filtered view of this same Posts collection (`/category/newsletters`) rather than a separate content type — recommend keeping it that way rather than building a distinct "Newsletter" CMS object, since the current site shows no fields unique to newsletters beyond "has a PDF attached."

**Important migration note — exclude legacy template content:** the sitemap includes two posts from **Feb 2019** ("We Are Excited!", "Our Digital Temple") that are clearly leftover **default Wix onboarding/starter content** (they talk about "upgrading our website" and explain generic Wix blog features like "Set as Writer"), not real Temple content. These should **not** be migrated — flag this explicitly so nobody mistakes them for real historical posts.

**Open question for the meeting:** is a newsletter still being produced today through some other channel (email, Facebook) that simply isn't making it onto the website anymore? The last "Newsletters"-tagged post was Aug 2023.

---

## 4. Collection: Events

Confirmed by reading individual event pages (`/events/<slug>`) — this is Wix's **Events app** (a distinct product from the blog), and it has a noticeably different field shape than blog posts:

| Field | Observed values |
|---|---|
| Title | e.g. "Litha", "Monthly Business Meeting (July 2021)" |
| Start date/time | e.g. "Jun 20, 2022, 7:00 PM" |
| End date/time (optional) | e.g. "Jul 11, 2021, 3:30 PM – 5:30 PM" (some events have it, some don't) |
| Location | Either a physical location or, for virtual events, the description field contains a Zoom link/meeting ID pasted directly into the body text (not a structured "virtual location" field — Wix doesn't seem to have modeled that separately here) |
| Description | Rich text — ranges from empty to several paragraphs (e.g. the Business Meeting description explains the Temple's "Peace & Power process" meeting format in detail) |
| Ticketing | Every event — even free recurring ones like Monthly Business Meetings — went through Wix's **ticketing** flow: a "Ticket type," a price (commonly **$0.00**), and a registration state ("Registration Closed" / "Sale ended" since these are all past). This means even free events were modeled as "free tickets" rather than simple RSVPs. |

**Reconciling with the main plan's Phase 3 (Event Calendar):** the main plan recommended starting with simple manual entries and no payment processing, consistent with your decision to skip payments for classes. The current site's "every event has a $0 ticket" pattern is more ceremony than necessity — a plugin like **The Events Calendar** (free tier) supports a plain "event info + optional RSVP form," without needing a full ticketing/payments layer, and that's sufficient to match what's actually being used today (free tickets only). No evidence from the crawl that paid ticketing was ever actually used — worth confirming in the meeting, but likely safe to simplify.

**Recurring categories identified** (useful for seeding the new calendar — see the content-inventory doc Section 4 for full list): Sabbat public rituals (the 8 Wheel-of-the-Year holidays), Monthly Business Meetings, Red Tent gatherings, Open Temple, occasional workshops/classes (e.g. "Warding 101"), and occasional fundraisers (e.g. "Online Auction").

---

## 5. Collection: Memberships ("Shop")

| Field | Observed values |
|---|---|
| Product name | "Individual Membership", "Family Membership" |
| Price | $40.00 / $75.00 |
| Description | Not fully visible in the crawl (product detail pages weren't fetched — would need a Wix Stores checkout flow to see full product descriptions, terms, renewal period, etc.) |

This is technically a Wix Stores "product" collection, but with only **two fixed, rarely-changing items**, it doesn't really behave like a true content collection (nothing is being added/edited routinely here — unlike posts or events). Two implementation paths to raise in the meeting:

1. **Full e-commerce plugin (WooCommerce)** — only justified if the Temple wants to expand into real merchandise/multiple products later, or needs robust order/renewal tracking.
2. **Lightweight approach** — two simple "Buy Now" buttons (PayPal or Stripe Payment Links) directly on a static "Become a Member" page, no product catalog/cart needed at all. Given there are only 2 SKUs and the current Donate page already links out to this the same way, this is probably the better cost/complexity fit — avoids bringing in WooCommerce (a notably heavier, more maintenance-prone plugin) for a 2-item catalog.

**Recommend the lightweight approach** unless the meeting surfaces a concrete reason to expect the product catalog to grow.

---

## 6. External/Linked Content (not migrated, just connected)

- **Library** → likely just a prominent link (or simple iframe embed, if LibraryThing supports it) to the existing `librarything.com/catalog/TOFD` catalog, pending confirmation this is actually the intended "Library" content (see open question in the content-inventory doc).
- **Social media** → Facebook, Instagram, Twitter/X, Pinterest, YouTube. Recommend a live feed embed (e.g. Smash Balloon for Facebook/Instagram) on the homepage and/or a dedicated "Connect with us" section, rather than migrating any content — this is exactly the "more modern and connected through social media" goal from the original brief.

---

## 7. What This Means for the CMS Build (WordPress)

Translating directly into implementation tasks for Phase 2 of the main plan:

1. **Pages:** hand-author the static pages (About, Vision & Mission, History, Honoring Kay, Iseum Musicum, Donate, Contact) — real content-writing work, not just template setup, since most are currently empty.
2. **Posts + Categories:** set up categories (`Temple News`, `Sabbats`, `Newsletters`) matching the existing taxonomy so any content the Temple wants to carry over slots in immediately; skip migrating the 2019 starter posts.
3. **Events plugin:** install a free-tier events plugin, seed it with the recurring event *types* identified (not the stale historical dates), skip replicating the $0-ticket flow — just event info + optional simple RSVP, consistent with the "no payments for now" decision already made for Anu Dudley's class roster and apply the same logic here for consistency across your projects.
4. **Membership:** two Buy Now payment buttons on a "Become a Member" page instead of a full product catalog, unless the meeting reveals a reason to expect more SKUs.
5. **Homepage:** replace the hand-pasted "Temple News" blurb with a dynamically-pulled "latest posts" block (built into most WordPress themes/page builders) so it can never go stale the way it has now.
6. **Library/Social:** links/embeds only, no content migration needed.

This is a good artifact to bring to the meeting alongside the agenda — it lets you explain to the Temple, concretely, "this part of the site you'll edit like a Word document, and this part you'll just click 'add new' and fill in a form," which is exactly the distinction a non-technical editor needs to understand up front.
