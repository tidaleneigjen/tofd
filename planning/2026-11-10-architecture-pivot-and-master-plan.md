# TOFD Rebuild — Architecture Pivot & Master Plan

**Status:** Living document — this is now the top-level source of truth for the TOFD rebuild. It **supersedes the WordPress-based approach** described in `2026-09-22-tofd-migration-plan.md` and the WordPress-specific mapping in `2026-10-25-content-types-and-cms-mapping.md` (both left in place for historical context and content-audit value — see the "What still applies" section below).
**Last updated:** 2026-11-10

---

## 1. Why the Pivot

The original plan recommended WordPress because it's the most common, lowest-maintenance CMS for a non-technical nonprofit editor. That recommendation still stands **if cost is flexible** — but the owner wants to minimize AWS spend using DynamoDB specifically, and WordPress's core database layer cannot run on DynamoDB (it requires MySQL/MariaDB). Rather than force a mismatched pairing (e.g., paying for both a relational DB for WordPress *and* DynamoDB for nothing), the decision is to **drop WordPress and build a custom, lightweight CMS** with:

- **Backend:** Python on AWS Lambda
- **Database:** DynamoDB (one table per content type, on-demand billing)
- **Frontend:** React (public site + a separate admin SPA)
- **Hosting:** S3 + CloudFront
- **IaC:** Terraform, 100% — no manual AWS console resource creation except one unavoidable one-time bootstrap step (Section 3)
- **CI/CD:** GitHub Actions — every merge to `main` deploys infrastructure and application code automatically

**Trade-off being accepted:** this is a larger build than "install WordPress and pick a theme." There is no off-the-shelf plugin ecosystem — events, forms, media handling, and the admin editing UI itself all have to be built by hand, incrementally. The plan below breaks that into small, independently-shippable phases specifically to manage that risk, with an explicit feedback checkpoint with the Temple after each phase.

---

## 2. What Still Applies From Earlier Planning Docs

- `2026-10-25-content-inventory-sitemap.md` — **fully still applies.** This is a content audit of the live Wix site (what pages exist, what's empty/placeholder, what's stale). Nothing about the tech-stack pivot changes what content exists today.
- `2026-10-25-content-types-and-cms-mapping.md` — **the content-type analysis still applies** (static pages vs. repeating collections vs. external/linked content, and the field shapes observed for Posts/Events/Memberships). Only the "Recommended WordPress construct" column is obsolete — read that document for *what* content exists and *how it's shaped*, and this document for *how it will actually be built* now.
- `2026-10-25-first-meeting-agenda.md` — still a valid agenda for a content-priorities meeting with the Temple; independent of the tech-stack decision.
- `2026-09-22-tofd-migration-plan.md` — the content-goals, Wix-platform findings, and cost-consciousness principles still apply. Its Section 3 (feature roadmap) and Section 5 (hosting cost comparison) are specific to WordPress and are superseded by this document.

---

## 3. Architecture Overview

```
GitHub repo (tidaleneigjen/tofd), trunk-based on `main`
        │  (push/merge to main)
        ▼
GitHub Actions (OIDC → AWS IAM role, no stored AWS keys)
        │
        ├── terraform apply (infra/live)  ──►  AWS resources (see below)
        ├── build + sync public-site frontend ──► S3 (public site bucket)
        ├── build + sync admin frontend ──► S3 (admin app bucket)
        └── CloudFront invalidations

AWS resources (all Terraform-managed):
  - DynamoDB tables (one per content type)
  - Lambda function(s) (Python, API backend)
  - API Gateway (HTTP API)
  - Cognito User Pool (admin authentication)
  - S3 buckets × 2 (public site build, admin app build)
  - CloudFront distribution × 2 (public site + API passthrough, admin app)
  - Route 53 hosted zone + ACM certificates (created early, NOT cut over until go-live)
```

### One unavoidable manual step
Terraform cannot create the S3 bucket/DynamoDB table it uses to store *its own* remote state out of nothing while also being driven by a CI pipeline that doesn't exist yet. The standard, fully-code-based way to handle this (not console-clicking) is a **separate, small Terraform configuration (`infra/bootstrap/`) that a human runs once, locally**, using their own AWS credentials, to create: the Terraform state S3 bucket, a DynamoDB state-lock table, and the GitHub OIDC provider + IAM role that CI will use for everything after that. This is a one-time, auditable, code-reviewed action — not "manually creating things and forgetting about them." Every AWS resource after that point is created and updated exclusively via CI running Terraform against the real `infra/live/` configuration. This is spelled out as Step 1 of Phase 0 below.

### Data model approach: one DynamoDB table per content type
Rather than a single-table DynamoDB design (powerful but harder to reason about and harder to extend incrementally), each content type gets its **own table**, mirroring the pattern already proven on `anududley.com` (e.g., `anududley-radio-essays`). This is simpler for incremental, phase-by-phase development and easy to reason about at this traffic scale. All tables use `PAY_PER_REQUEST` billing (near-$0 at low traffic).

### Backend approach: single Lambda, Lambda Powertools router
To avoid managing many separate Lambda functions as content types are added phase over phase, the backend is **one Lambda function** exposing all API routes, using [AWS Lambda Powertools for Python](https://docs.powertools.aws.dev/lambda/python/latest/) (`APIGatewayHttpResolver`) as a lightweight Flask-like router inside that function. New content types in later phases mean adding new route handlers to the same function, not new infrastructure.

### Auth approach: Amazon Cognito
Rather than hand-rolling authentication (as `anududley.com` did with custom token auth), admin login uses a **Cognito User Pool**. The admin React app authenticates against Cognito and calls the API with a Cognito-issued JWT; API Gateway's built-in JWT authorizer protects write/admin routes without any custom auth code to maintain.

### Hosting approach: two CloudFront distributions
1. **Public site** (`www.templeofthefemininedivine.org`): CloudFront → S3 (public site React build) as the default behavior, **plus a `/api/*` cache behavior pointing at API Gateway** — this lets the public site call its own API same-origin (no CORS needed) while still being "CloudFront hosting the frontend."
2. **Admin app** (`admin.templeofthefemininedivine.org`): a separate, simpler CloudFront → S3 distribution for the admin SPA. It calls the same API Gateway cross-origin (CORS configured to allow this one additional origin).

### Domain/DNS approach
Route 53 hosted zone and ACM certificates are created **early** (Phase 0) since they don't affect the live Wix site until nameservers are actually switched at the registrar. **Nameserver cutover is an explicit, separate, human-approved step at go-live (end of Phase 4)** — not something any phase's automation does on its own, to avoid accidentally taking down the live site mid-build.

---

## 4. Phase Index

Each phase has its own standalone prompt document under `phases/`, written to be handed to a coding agent as its full task brief. **Phases 1 onward end with an explicit checkpoint: present the result to the Temple for feedback before starting the next phase** — this is a deliberately iterative, living process, not a waterfall plan.

| Phase | Document | Goal |
|---|---|---|
| 0 | `phases/phase-0-repo-reset-and-infra-foundation.md` | Reset `main` to a clean slate; stand up the Terraform + CI/CD pipeline and all baseline AWS infra (empty API, empty DynamoDB table, empty S3/CloudFront, Cognito pool, DNS/ACM). Prove that a merge to `main` deploys to AWS automatically. **No site content work happens in this phase.** |
| 1 | `phases/phase-1-mvp-homepage-cms.md` | Minimal backend + minimal CMS admin + minimal public site, scoped to **just the homepage**. Proves the full content pipeline end-to-end (DynamoDB → Lambda API → admin edit UI → public site render) on the smallest possible surface area. |
| 2 | `phases/phase-2-informational-pages.md` | Extend the same "Page" content type/admin/site pattern from Phase 1 to the remaining static informational pages (About, Vision & Mission, History, Honoring Kay, Iseum Musicum, Donate, Contact). |
| 3 | `phases/phase-3-dynamic-collections.md` | Build genuinely new content types for the repeating collections identified in the content-mapping doc: News/Posts and Events. Membership ("Shop") is handled as simple static content + payment links, not a new collection (see that doc's reasoning). |
| 4 | `phases/phase-4-social-connectivity-and-launch.md` | Social media embeds ("modern & connected" goal), final QA against the Wix site, and the actual domain cutover/go-live. |

---

## 5. Ground Rules That Apply to Every Phase

Repeat these in every phase prompt so each one is fully self-contained for a coding agent with no memory of this document:

1. **Never create AWS resources by hand.** Every resource is defined in Terraform under `infra/live/`. If a phase needs a new AWS resource, write the Terraform for it in this phase's work, don't create it in the console "for now."
2. **Every change ships through `main`.** Work happens on a feature branch, opens a PR (which should trigger a `terraform plan` check), and merges to `main`, which triggers the real deploy. Do not apply Terraform manually from a laptop against the live environment outside of the Phase 0 bootstrap step.
3. **Keep secrets out of the repo.** Any API keys/secrets needed (e.g., a future payment provider key in Phase 3/4) go into AWS Secrets Manager or SSM Parameter Store, provisioned via Terraform, and are read by Lambda at runtime — never committed to git or hardcoded in frontend code.
4. **Cost discipline.** Every new resource should default to the cheapest viable tier (DynamoDB on-demand, Lambda, S3/CloudFront) consistent with the project's stated cost-minimization goal. Flag anything that introduces an always-on fixed cost (e.g., NAT Gateways, provisioned-capacity anything) before adding it.
5. **Stop and check in with the human after each phase** (Phases 1+). Do not self-approve moving to the next phase's document — that's an explicit, separate decision made after reviewing the working result with the Temple.
