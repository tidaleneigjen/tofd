# TOFD Site Migration — First Meeting Agenda

**Date:** 2026-10-25 (meeting prep)
**Attendees:** You + Temple of the Feminine Divine representatives (current site maintainer(s)/clergy)
**Purpose of this meeting:** This is a discovery/priorities conversation, **not** a design or build meeting. Goal is to leave with a shared, ranked view of what content matters most, what's nice-to-have, and what should be cut — so the rebuild starts from the right foundation. This maps to "Phase 0: Discovery & Content Audit" in `2026-09-22-tofd-migration-plan.md`.

**Suggested length:** 60–75 minutes.

**Prep note:** A full crawl of the live site was done ahead of this meeting — see `2026-10-25-content-inventory-sitemap.md`. Key facts from that crawl are already folded into this agenda below so we don't waste meeting time re-discovering things we can just confirm. There's also `2026-10-25-content-types-and-cms-mapping.md`, which splits the site into pages they'll edit directly (About, History, etc.) vs. "add new item" collections (News posts, Events, Memberships) vs. things that just link out (Library, social media) — useful to reference if the conversation turns to "how will I actually update this."

---

## 0. Framing (5 min)

- Briefly explain why you're proposing a rebuild: current site is on Wix, hard to maintain long-term in a modern/connected way, and you want something a non-technical person on their team can keep updated themselves.
- Set expectations: today is about **content and priorities**, not picking colors/fonts or a specific platform. Technical/platform decisions (CMS, hosting) come after this.
- Ask: who in the room/org actually edits the current site today, and who would be the primary editor(s) going forward? (This person's comfort level should drive later CMS decisions — get them in the room if possible.)

---

## 1. Walk the Current Site Together, Page by Page (20 min)

Go through the existing site live (or screenshots) and ask **for each page: Keep as-is / Keep but revise / Merge into another page / Cut entirely** — capture answers directly in the table below. The "Already known" column reflects the crawl results, so lead with those facts rather than asking open-ended "what's here?" questions.

| Page | Current URL | Already known (from crawl) | Keep / Revise / Merge / Cut | Notes from discussion |
|---|---|---|---|---|
| Home | `/` | Stale COVID-era "Temple News" callout; says "no events planned," which the Events page itself contradicts | | |
| Contact | `/contact` | Just address + email, no visible form | | |
| About Us | `/membership` | **Completely empty** — zero body content | | Needs real content written from scratch, not just a refresh |
| Vision & Mission | `/vision-mission` | **Placeholder only** — literally says "COMING SOON!" | | Needs real content written from scratch |
| History | `/history` | **Placeholder only** — literally says "COMING SOON!" | | Needs real content written from scratch |
| Honoring Kay | `/services` | **Completely empty** | | Ask directly what/who this page is honoring — not self-explanatory from outside, and there's nothing there today to infer it from |
| Iseum Musicum | `/iseum-musicum` | **Most complete page on the site** — describes the 3-year clergy training program, links an application PDF and a payment page, has the only social media icons on the whole site | | Good candidate as a content/tone benchmark for the rest of the site |
| TOFD News | `/news` | Real blog history back to 2019, but **last post was Nov 2023** (~3 years stale) | | Is a newsletter/update still being produced anywhere (email, Facebook) that just isn't making it onto the site? |
| Events | `/events-1` | Real event history through 2022 (Sabbat rituals, monthly business meetings, Red Tent, Open Temple, occasional workshops) — but nothing current, and it contradicts the homepage | | Confirm current recurring event types so the new calendar can be seeded correctly |
| Library | `/library` | **Completely empty** — but a LibraryThing catalog (`librarything.com/catalog/TOFD`) is linked elsewhere on the site | | **Ask directly: is LibraryThing the "real" library, and would a simple link/embed be enough instead of rebuilding this as native content?** |
| Donate | `/donate` | PayPal one-time/recurring donation + a link to buy membership | | Confirm 501(c)(3)/tax-deductibility language is current; confirm PayPal is still the preferred processor |
| Shop | `/shop` | **Not general merchandise** — only sells Individual ($40) and Family ($75) annual memberships | | This is the online membership-purchase flow, not a "store" — reframe before asking keep/cut |
| Members (hidden) | `/members` | Not linked in nav, found via sitemap, empty when crawled | | Ask what this was for — abandoned feature or an intended members-only portal? |
| Newsletter signup | embedded on Home | Wix's built-in "Subscribe Now" form | | What tool powers this today? How big is the list? Does it connect to the newsletter PDFs mentioned in old blog posts? |

---

## 2. Priority Ranking Exercise (15 min)

Ask the group to sort content into three buckets — this is the core output of the meeting:

### Must-have (launch blockers)
_What absolutely must be on the new site on day one?_

### Nice-to-have (can follow in a later phase)
_What's valuable but doesn't need to block launch?_

### Cut / doesn't belong
_What's outdated, unused, or no longer representative of the Temple?_

Prompting questions to drive this:
- "If someone new found this site today, what do you most want them to understand about the Temple in the first 30 seconds?"
- "What's something important about the Temple that's *missing* from the current site entirely?" (e.g., is there anything about becoming a member, ordination/clergy paths, community events, that isn't represented at all today?)
- "Is there anything on the current site that makes you wince or feel embarrassed when you show it to someone new?"

---

## 3. Content Gaps & New Ideas (10 min)

Ask directly whether there's content they've wanted on the site but never had a way to add themselves, e.g.:
- Information about becoming a member / the path to ordination or clergy training (you have some personal context here from class notes — ask rather than assume, since this may or may not be something they want public-facing).
- A real, current events calendar (vs. the current static "no events planned" page).
- Photos/stories from past rituals or gatherings.
- A way to welcome newcomers who are curious but not yet members.

---

## 4. "Modern & Connected" — Social Media Discussion (10 min)

The current site tells visitors to "see us on Facebook" rather than showing anything on-site. We already found accounts for Facebook (`BangorTOFD`), Twitter/X (`bangortofd`), Pinterest (`BangorTOFD`), Instagram (`bangortofd`), and YouTube — all currently only linked from one obscure page (Iseum Musicum). Discuss:
- Which of these are actually still active/monitored today? (Don't assume all 5 are alive just because the links exist.)
- Who manages those accounts, and would they be open to the website automatically displaying recent posts/events from them?
- Is there interest in the website driving people *to* social media (follow buttons) vs. pulling social content *into* the website (embedded feed), or both?
- Clarify "BangorTOFD" vs. the Brooks, ME mailing address — which is the primary public-facing identity/location?

---

## 5. Logistics / Discovery Questions (10 min)

Quick-fire questions needed regardless of priorities — capture answers for the planning doc:
- Who has access to the domain registrar for `templeofthefemininedivine.org`? (Needed later for DNS cutover — no action now, just confirm someone knows.)
- What is their current Wix plan/subscription (so we know what we're eventually replacing)?
- Any constraints on budget for ongoing hosting (even a rough comfort range helps confirm the cost-efficient AWS/WordPress approach already proposed is acceptable)?
- Is there a logo/brand guide, or any existing photography/imagery library, that should carry over?

---

## 6. Wrap-up & Next Steps (5 min)

- Recap the must-have / nice-to-have / cut lists back to the group to confirm agreement.
- Explain next steps: you'll take this input, finalize a sitemap and content plan, and come back with a proposed design direction and platform recommendation (WordPress is the current working recommendation — no need to present this as locked-in yet unless they ask).
- Agree on a rough timeline expectation and how/when you'll follow up (don't commit to hard dates yet if still scoping).

---

## After the Meeting

- Transfer the filled-in tables/notes from this agenda back into `2026-09-22-tofd-migration-plan.md` Section 1 (content inventory) and Section 6 (open decisions) so the plan reflects what was actually decided.
- Update the "What we don't yet know" list in the plan (Section 1.4) with anything resolved today.
