# TOFD Current Site — Content Inventory & Sitemap

**Status:** Living document — findings from a manual crawl of the live site.
**Last updated:** 2026-10-25
**Method:** Fetched every page linked in the main nav, plus Wix's sitemap index (`/sitemap.xml` → `pages-sitemap.xml`, `blog-posts-sitemap.xml`, `event-pages-sitemap.xml`, `store-products-sitemap.xml`) to find any pages not in the visible nav. This supersedes/expands the content table in `2026-09-22-tofd-migration-plan.md` Section 1.2 — treat this doc as the detailed source and that one as the summary.

---

## 1. Site Outline (as it actually renders today)

```
/ (Home)
├── /contact (About > Contact)
├── /membership (About > "About Us")        -- EMPTY
├── /vision-mission (About > Vision & Mission) -- "COMING SOON"
├── /history (About > History)               -- "COMING SOON"
├── /services (About > "Honoring Kay")        -- EMPTY
├── /iseum-musicum                            -- HAS CONTENT (clergy school)
├── /news (TOFD News, blog)                   -- HAS CONTENT, stale (last post Nov 2023)
│   ├── /news/categories/temple-news
│   ├── /news/categories/sabbats
│   ├── /news/categories/newsletters
│   └── /news/categories/upcoming-events
├── /events-1 (Events)                        -- HAS CONTENT, badly stale (2020-2022)
│   └── /events/<slug>  (~50 individual event pages)
├── /library                                  -- EMPTY
├── /donate                                   -- HAS CONTENT (PayPal + membership link)
├── /shop                                     -- HAS CONTENT (2 membership products only)
│   ├── /product-page/individual-membership ($40)
│   └── /product-page/family-membership ($75)
└── /members                                  -- EMPTY (not in visible nav; found via sitemap — likely a members-only/gated page that renders nothing without login)
```

**Not in the nav at all, but discoverable via Wix sitemap:** `/members`. Worth asking the Temple directly what this page is for (members-only portal? forgotten/abandoned page?).

---

## 2. Page-by-Page Content Status

| Page | URL | Actual Status | What's there |
|---|---|---|---|
| Home | `/` | **Has content**, but stale | Mission blurb, a "Temple News" callout referencing COVID-19 and "no in-person events planned" (contradicted by the Events page itself — see below), newsletter signup |
| Contact | `/contact` | **Minimal** | Just mailing address + email; no visible contact form in the crawled HTML (may render client-side via Wix widget — verify in browser) |
| About Us | `/membership` | **Empty** | Nav label "About Us" but URL is `/membership` and the page itself has zero body content |
| Vision & Mission | `/vision-mission` | **Placeholder** | Literally just "COMING SOON! Check back for updates" |
| History | `/history` | **Placeholder** | Literally just "COMING SOON! Check back for updates" |
| Honoring Kay | `/services` | **Empty** | No body content at all |
| Iseum Musicum | `/iseum-musicum` | **Has real content** | Description of the 3-year clergy training program ("School of the Muse"), links to a "More Information" PDF, an "Application" PDF, and a "Class Payment" product page; also the only page with visible social media icons |
| TOFD News | `/news` | **Has content, stale** | Blog with categories (All Posts, Temple News, Sabbats, Newsletters, Upcoming Events). **Most recent post: Nov 4, 2023** — a ritual cancellation notice. Full post history goes back to 2019. |
| Events | `/events-1` | **Has content, very stale** | ~50 listed events, but the visible/recent ones in the crawl are all from **2020–2022** (Litha, Beltane, Ostara, Imbolc rituals; monthly business meetings; a few classes like "Warding 101" and "History of the Goddess"). Directly contradicts the homepage's "no in-person events planned" message. |
| Library | `/library` | **Empty** | No body content |
| Donate | `/donate` | **Has content** | PayPal donate button (one-time or recurring) + a "Become a member" callout linking to Shop |
| Shop | `/shop` | **Has content, but narrow** | Only 2 products: Individual Membership ($40/yr) and Family Membership ($75/yr). **This is not general merchandise — "Shop" is actually the membership-purchase mechanism.** Important reframe for the priority discussion: cutting "Shop" would mean cutting the ability to buy a membership online. |
| Members | `/members` | **Empty (hidden)** | Not linked in main nav; found only via sitemap. Ask the Temple what this was for. |

---

## 3. Blog ("TOFD News") Post Inventory Summary

- Full post history found via sitemap goes back to **2019** ("Grow Your Blog Community", "Our Digital Temple" — likely default Wix-generated starter posts, worth checking if these are real content or template leftovers).
- Real content clusters: 2021 posts (seasonal ritual announcements: "Change", "Waxing Moon", "Lughnasadh"), then a bigger cluster in **2023** (newsletters, in-person and Zoom ritual announcements, a conference mention: "Maine Pagan Clergy Association Annual Conference... features TOFD clergy talk").
- **Nothing posted since November 2023** — roughly 3 years stale as of this writing (2026-10-25).
- Newsletter posts mention a recurring **20-page PDF newsletter** distributed via blog post + downloadable PDF — worth asking if this newsletter still exists/is produced, and whether it should become a real "Newsletter archive" section on the new site rather than being buried in blog posts.

---

## 4. Events Inventory Summary

- ~50 individual event pages exist, spanning **2020–2022** based on the sitemap dates, plus a handful from 2021 visible on the main events list.
- Recurring patterns identified:
  - **Monthly Business Meetings** (member-facing, recurring monthly)
  - **Sabbat public rituals** (Imbolc, Ostara, Beltane, Litha, Lughnasadh, Mabon, Samhain, Yule — the 8 Wheel-of-the-Year holidays, both in-person and Zoom)
  - **Red Tent** gatherings (recurring, multiple instances)
  - **Open Temple** (recurring, multiple instances)
  - Occasional **classes/workshops**: "Warding 101", "History of the Goddess" (registration-based), "Variety Show Extravaganza" (annual), "2nd Annual Online Auction" (fundraiser)
- This is useful raw material: it shows the Temple's actual recurring event *types* even though the specific listed dates are all expired. A rebuilt Events section should probably be seeded with these recurring categories (Sabbat rituals, Business Meetings, Red Tent, Open Temple, occasional workshops/classes, fundraisers) rather than built from scratch.

---

## 5. Social Media & External Presence (found on Iseum Musicum page)

The current site only surfaces these as small icons on **one** page (`/iseum-musicum`) — not on the homepage or anywhere else:

| Platform | Handle/URL |
|---|---|
| Facebook | facebook.com/BangorTOFD |
| Twitter/X | twitter.com/bangortofd |
| Pinterest | pinterest.com/BangorTOFD |
| Instagram | instagram.com/bangortofd |
| YouTube | youtube.com/channel/UCZq3W3V4Tj2vUvtmYV9fjKg |
| LibraryThing | librarything.com/catalog/TOFD |

Notes:
- Handle naming uses **"BangorTOFD"** — confirms a Bangor, ME association distinct from the Brooks, ME mailing address. Worth clarifying which city is the "home base" for messaging purposes.
- **LibraryThing** is interesting and unexpected — it's a book cataloging site. This could be the actual home of whatever the "Library" page was *meant* to show (a catalog of books/texts the Temple owns or recommends) and may explain why `/library` is empty on the main site — the real content might already live on LibraryThing and just needs linking/embedding rather than rebuilding from scratch.
- This answers one of the open discovery questions from the meeting agenda (which social platforms are in use) — no need to ask that cold in the meeting; instead, confirm these are still active/monitored.

---

## 6. Key Findings to Bring Into the Priorities Meeting

1. **Roughly half the main nav pages are empty or placeholder** (About Us, Honoring Kay, Library, Vision & Mission, History). This isn't just "needs modernizing" — there's a real content gap to fill, not just a redesign.
2. **"Shop" is actually membership purchasing, not merchandise.** Don't let the Temple dismiss "Shop" as unused retail — clarify this is literally how people pay for membership today before any decision to cut it.
3. **The homepage's "no events planned" message is contradicted by the Events page itself showing a multi-year history of recurring events** (rituals, business meetings, Red Tent, Open Temple) — suggests the site hasn't been actively maintained in a while, reinforcing the case for a CMS a non-technical person can actually keep current.
4. **"Library" may already exist elsewhere (LibraryThing)** — a linking/embedding fix might be much cheaper than building a real library feature from scratch. Ask directly.
5. **Blog/newsletter content stopped in Nov 2023.** If there's a newsletter still being produced some other way (email list, Facebook), it's not making it onto the website — an integration opportunity.
6. **Iseum Musicum is the most complete, real, and functional page on the whole site** — it has an actual program description, application process, and payment flow. It's a strong model for "what good content looks like here" and should probably be used as a template/benchmark for how other sections (About, History) get fleshed out.
7. **Found a hidden `/members` page not in nav** — worth asking about directly; may be an abandoned Wix members-area feature.

---

## 7. Draft Sitemap Proposal for the New Site (starting point for discussion, not a decision)

Based on what's actually real/working today vs. what's placeholder, a reasonable starting IA to bring into the meeting as a conversation prompt:

```
Home
About
  ├── Our Story / History  (needs real content — currently placeholder)
  ├── Vision & Mission     (needs real content — currently placeholder)
  ├── Honoring Kay         (needs real content — currently empty; clarify what/who this is)
  └── Contact
Iseum Musicum (clergy training)   -- carry over largely as-is, it's the strongest existing page
News & Updates                    -- revive, merge "Newsletters" category into a clearer archive
Events                            -- rebuild with real, current data; seed categories from Section 4 above
Library / Resources               -- likely just link out to LibraryThing catalog instead of rebuilding
Membership
  ├── Become a Member (the content currently buried in "Shop")
  └── Donate
```

This is intentionally a starting point to react to in the meeting, not a final decision — update this section after the meeting based on what's actually agreed.
