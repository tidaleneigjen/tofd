# Phase 0 Prompt: Repository Reset & Infrastructure Foundation

**You are a coding agent implementing Phase 0 of the TOFD (Temple of the Feminine Divine) website rebuild.** This document is your complete task brief. Read it fully before making any changes. Do not skip steps or reorder them — later steps assume earlier ones are complete.

## Context You Need

- Repository: `tofd`, GitHub remote `git@github.com:tidaleneigjen/tofd.git`.
- The `main` branch currently contains an old, abandoned React+Vite prototype. It has **already been archived** on a branch called `2026-11-10-stale-work` (confirm this branch exists on the remote before deleting anything — if it does not exist, STOP and ask the human before proceeding, do not delete anything).
- There is a `planning/` directory at the repo root containing markdown planning documents (content audits, meeting agendas, this phase plan, etc.). **Do not delete or modify anything in `planning/` as part of this phase** — it is documentation, not application code.
- There is a `README.md` at the repo root describing the old React+Vite template — this will be replaced.
- Full architecture context (why these specific technology choices) is in `planning/2026-11-10-architecture-pivot-and-master-plan.md`. Read it if anything below is unclear.

## Goal of This Phase

By the end of this phase:
1. `main` is reset to a clean slate (old prototype code removed, a couple of real image assets preserved).
2. A working Terraform + GitHub Actions pipeline exists such that **merging a PR to `main` automatically deploys infrastructure changes to AWS** with no manual console steps.
3. The pipeline is proven end-to-end with a trivial "hello world" API (Lambda behind API Gateway, one placeholder DynamoDB table) reachable through CloudFront — **not real site content**. Content work starts in Phase 1.

**Out of scope for this phase:** anything related to actual site content, the homepage, the CMS admin's real functionality, Cognito user creation workflows beyond pool creation, or domain nameserver cutover (DNS records are created but the live site is NOT touched).

---

## Step 1: Preserve Real Assets, Then Reset `main`

1. Confirm the archive branch exists: `git fetch origin && git branch -a | grep 2026-11-10-stale-work`. If it's missing on both local and remote, stop and ask the human — do not proceed with deletion.
2. From current `main`, copy these image files out to a temporary location (they appear to be real Temple photography, not template placeholders, and may be reused later in site content):
   - `public/labyrinth.jpg`
   - `public/membership.png`
   - `public/pride-heart.jpg`
   - `public/red-tent.jpg`
   - `public/ritual-room.jpg`
   - `public/temple-ritual.jpg`
   - `public/tofd.jpg`
   - `public/window-tofd.jpg`
3. Create a new directory `planning/assets/legacy-images/` and move the preserved images there, with a short `planning/assets/legacy-images/README.md` noting they were pulled from the pre-rebuild prototype and may or may not be used in final content (don't assume they're authoritative — flag for the Temple to confirm during content work).
4. On `main`, delete everything at the repo root **except**: `.git/`, `.gitignore`, `planning/` (including the newly added `assets/` subfolder).
   - This means removing: `README.md`, `eslint.config.js`, `index.html`, `package-lock.json`, `package.json`, `postcss.config.js`, `public/`, `src/`, `tailwind.config.js`, `vite.config.js`, `node_modules/` (if present), `.svelte-kit/` (if present — leftover build artifact, not source).
5. Review `.gitignore` — replace its contents with a fresh one appropriate for the new stack (Python, Node/React, Terraform). At minimum it must ignore: `node_modules/`, `.env`, `.env.*`, `*.pyc`, `__pycache__/`, `.terraform/`, `*.tfstate`, `*.tfstate.*`, `.terraform.lock.hcl` (actually: **do** commit `.terraform.lock.hcl`, do not ignore it — remove it from any ignore list), build output directories (`frontend/*/dist/`, `frontend/*/build/`), and Lambda packaging artifacts (e.g. `backend/.build/`, `*.zip`).
6. Commit this as a single commit on `main` with a clear message, e.g. `Reset main for ground-up rebuild (old prototype archived on 2026-11-10-stale-work)`.
7. Do not force-push unless the human explicitly approves it — if `main` is protected or force-push is rejected, stop and ask rather than weakening branch protection yourself.

## Step 2: Set Up Repository Structure

Create this directory layout (empty placeholder files like `.gitkeep` or a short `README.md` are fine for now where noted — do not invent content for directories this phase doesn't populate):

```
tofd/
├── infra/
│   ├── bootstrap/        # one-time, human-run, local state (Step 3)
│   └── live/             # main infra, remote state, CI-run (Step 4)
│       └── modules/
│           ├── dynamodb-table/
│           ├── lambda-api/
│           ├── cloudfront-site/
│           ├── cognito/
│           └── dns/
├── backend/
│   ├── src/              # Python Lambda source (Step 5)
│   └── tests/
├── frontend/
│   ├── public-site/      # React/Vite app (Step 6)
│   └── admin/            # React/Vite app (Step 6)
├── .github/
│   └── workflows/
│       ├── terraform-plan.yml
│       └── deploy.yml
├── planning/             # already exists — leave as-is
├── .gitignore
└── README.md             # new top-level README (Step 7)
```

## Step 3: Terraform Bootstrap (One-Time, Human-Run)

This is the **one necessary exception** to "everything is created by CI." It creates the resources CI needs in order to exist at all (remote state storage + the IAM identity CI assumes). It is still 100% Terraform code — just applied once, locally, by a human with their own AWS credentials, not by a pipeline.

1. In `infra/bootstrap/`, write a Terraform configuration (using **local** state — do not configure a backend block here, that would be circular) that creates:
   - An S3 bucket for Terraform remote state (e.g. `tofd-terraform-state-<random-suffix-or-account-id>`), with versioning enabled, default encryption (SSE-S3 or SSE-KMS), and all public access blocked.
   - A DynamoDB table for Terraform state locking (e.g. `tofd-terraform-locks`), with a string hash key `LockID`, `PAY_PER_REQUEST` billing.
   - A GitHub OIDC identity provider for `token.actions.githubusercontent.com` (only create this if one does not already exist in the AWS account — check first with `aws iam list-open-id-connect-providers`, since an account can only have one of a given provider URL; if it already exists, use a `data` source to reference it instead of creating a duplicate).
   - An IAM role (e.g. `tofd-github-actions-deploy`) with a trust policy that allows `sts:AssumeRoleWithWebIdentity` from that OIDC provider, scoped via a `StringLike`/`StringEquals` condition on `token.actions.githubusercontent.com:sub` to **only** the `tidaleneigjen/tofd` repository (e.g. `repo:tidaleneigjen/tofd:ref:refs/heads/main` for the role used by the deploy workflow, and `repo:tidaleneigjen/tofd:pull_request` for a plan-only role/policy if you choose to separate plan vs. apply permissions — using one role for both is acceptable for this project's size, but scope the trust condition correctly either way).
   - An IAM policy attached to that role granting the permissions Terraform will need to manage the resources in `infra/live/` (DynamoDB, Lambda, API Gateway, S3, CloudFront, Cognito, Route 53, ACM, IAM role/policy management for Lambda's own execution role, CloudWatch Logs). Scope to the account/region where reasonable; it's acceptable for this small project to grant broad access to these specific services rather than hand-crafting minimal per-action policies, but do not grant blanket `*:*` admin access.
2. Output the state bucket name, lock table name, and the deploy role ARN as Terraform outputs.
3. Document in `infra/bootstrap/README.md`: this is run **once, manually, by a human**, with instructions:
   ```
   cd infra/bootstrap
   terraform init
   terraform apply
   ```
   and a note to save the outputs (bucket name, table name, role ARN) — they're needed to configure `infra/live`'s backend and the GitHub Actions workflow's role ARN.
4. **Do not run `terraform apply` yourself as the coding agent unless you have been given real AWS credentials and explicit instruction to do so.** If you don't have credentials, write the configuration completely and correctly, then stop and tell the human exactly what command to run and what to do with the outputs.

## Step 4: Main Terraform Configuration (`infra/live/`)

1. Configure the Terraform backend to use the S3 bucket + DynamoDB table from Step 3 (via `backend "s3" {}` with a `backend.hcl` partial config file checked into the repo containing bucket/key/region/dynamodb_table — do not hardcode the bucket name directly in the `terraform {}` block if you want it reusable, but either approach is acceptable as long as it's not committed with secrets).
2. Define the AWS provider, pinned to a specific region (`us-east-1` — required anyway for CloudFront/ACM certs used with CloudFront).
3. For this phase, the actual resources to create (via the modules scaffolded in Step 2) are:
   - **One DynamoDB table** named `tofd-placeholder` (hash key `id`, `PAY_PER_REQUEST`) — purely to prove the pipeline works; this gets replaced by real content tables in Phase 1 and can be deleted at that point.
   - **One Lambda function** (Python 3.12+, from `backend/src/` — see Step 5) with an execution role that has permission to read/write the placeholder table and write CloudWatch Logs.
   - **One API Gateway HTTP API** with a single route (e.g. `GET /api/health`) integrated with the Lambda function.
   - **Two S3 buckets** (public site, admin app) — private, accessed only via CloudFront using Origin Access Control (OAC), not public bucket policies.
   - **Two CloudFront distributions**:
     - Public site: default behavior → public-site S3 bucket (via OAC); additional behavior for path pattern `/api/*` → the API Gateway HTTP API as an origin, with caching disabled (`CachingDisabled` managed policy) and all headers/query strings/cookies forwarded (`AllViewer` managed origin request policy) so the Cognito JWT reaches the API correctly in later phases.
     - Admin app: default behavior → admin S3 bucket (via OAC). No API behavior needed here — the admin app will call the API cross-origin.
     - Both distributions: SPA fallback via a shared CloudFront Function (`spa-rewrite.js`, runtime `cloudfront-js-2.0`) associated as `viewer-request` on the **default (S3) behavior only** — extensionless URIs are rewritten to `/index.html` so client-side routing works once React Router is added in later phases. Distribution-wide `custom_error_response` (403/404 → `/index.html`) is deliberately NOT used because it applies to every behavior and would mask real API Gateway errors on `/api/*`. `Redirect HTTP to HTTPS`.
   - **One Cognito User Pool** (e.g. `tofd-admin-users`) with a single app client (no secret, since it's used from a public SPA) — email-based sign-in, reasonable password policy. **Do not create any actual users yet** — that's a Phase 1 task once there's something for them to log into.
   - **Route 53 hosted zone** for `templeofthefemininedivine.org` (if one doesn't already exist in this AWS account — check first, controlled by a `create_hosted_zone` variable). **ACM certificates** (in `us-east-1`, required for CloudFront) for `www.templeofthefemininedivine.org` and `admin.templeofthefemininedivine.org`, their DNS validation records, the CloudFront distribution aliases, and the Route53 A/AAAA alias records are all gated behind an `enable_custom_domains` variable that **defaults to `false` and must stay false in this phase** — ACM DNS validation can only complete once the hosted zone is publicly authoritative, which requires the registrar NS cutover (a Phase 4 action). With the flag off, the distributions serve only on their default `*.cloudfront.net` domains. **Do not change nameservers at the domain registrar in this phase** — the hosted zone existing doesn't affect the live Wix site until someone manually repoints the registrar's NS records.
4. Every resource must have consistent naming/tagging (e.g. a `Project = "tofd"` tag) so they're easy to find and distinguish from any other projects in the same AWS account.
5. Run `terraform fmt` and `terraform validate` before considering this step done.

## Step 5: Minimal Backend ("Hello World" Lambda)

1. In `backend/src/`, write a minimal Python handler using **AWS Lambda Powertools** (`aws_lambda_powertools.event_handler.APIGatewayHttpResolver`) with exactly one route: `GET /api/health` returning `{"status": "ok", "service": "tofd-api"}`.
2. Add `backend/requirements.txt` with `aws-lambda-powertools` and any other baseline dependencies.
3. In `infra/live`'s Lambda module, package the contents of `backend/src/` (plus installed dependencies) into a zip using Terraform's `archive_file` data source, and set `source_code_hash` from that archive so that any future code change automatically triggers a Lambda update on the next `terraform apply` — no separate manual deploy step needed for backend code changes.
4. Add a minimal test in `backend/tests/` that imports the handler and asserts `GET /api/health` returns a 200 with the expected body (use `pytest` — check if `pytest` is already a convention elsewhere in the user's other projects before picking a different test runner; it is, based on `anududley.com/backend`, so use it here too for consistency).

## Step 6: Minimal Frontend Scaffolding

1. In `frontend/public-site/`, scaffold a new **React + Vite** app (`npm create vite@latest . -- --template react`), matching the stack the old prototype used so tooling is familiar. Clear out the Vite starter boilerplate content and replace the homepage with a single placeholder component that fetches `/api/health` (same-origin, since CloudFront will route `/api/*` to the backend) and displays the result — this is purely to prove connectivity end-to-end, not real site design.
2. In `frontend/admin/`, scaffold a second React + Vite app the same way, with a placeholder page that will later host the Cognito login flow (Phase 1) — for this phase, a static "Admin — coming soon" page is sufficient.
3. Do not add any CSS framework, component library, or design system yet — that's a content/design decision for later phases, not infrastructure.

## Step 7: CI/CD Workflows

1. `.github/workflows/terraform-plan.yml` — triggers on `pull_request` when files under `infra/live/**` or `backend/**` change. Steps: checkout, configure AWS credentials via `aws-actions/configure-aws-credentials` using OIDC (`role-to-assume: <deploy role ARN from Step 3>`, no access keys), `terraform init` (with the backend config from Step 4), `terraform plan`. Fail the check if `terraform plan` errors; it's fine (and expected) for this workflow to just show the plan as job output without posting it as a PR comment for this phase — that's a nice-to-have, not required.
2. `.github/workflows/deploy.yml` — triggers on `push` to `main`. Steps:
   - Checkout, configure AWS credentials via OIDC (same role).
   - `terraform init && terraform apply -auto-approve` in `infra/live/` — this deploys infra **and** any backend Lambda code changes (since the zip hash is part of the Terraform resource).
   - Build the public-site frontend (`npm ci && npm run build` in `frontend/public-site/`), sync the build output to the public-site S3 bucket (`aws s3 sync ./dist s3://<bucket> --delete`), then invalidate that CloudFront distribution's cache (`aws cloudfront create-invalidation --distribution-id <id> --paths "/*"`). Bucket name and distribution ID should come from Terraform outputs (e.g., written to a file during the `terraform apply` step and read in later steps, or fetched via `terraform output` directly).
   - Do the same for the admin frontend against its own bucket/distribution.
3. Both workflows need the deploy role ARN and AWS region available — store the role ARN as a GitHub Actions repository variable (not a secret, ARNs aren't sensitive) once Step 3's bootstrap has been applied and the human has provided it to you.

## Step 8: New Top-Level README

Replace `README.md` with a short description of the project, a link to `planning/2026-11-10-architecture-pivot-and-master-plan.md` for full architecture context, and basic instructions for running the frontend apps locally and running backend tests. Do not duplicate the full architecture explanation here — point to the planning doc as the source of truth.

---

## Acceptance Criteria (How You Know Phase 0 Is Done)

1. `main` contains only the new structure from Step 2 plus `planning/` — no leftover prototype code.
2. `infra/bootstrap/` is written and documented, but has only been applied by a human (not by you, unless you were explicitly given credentials and told to).
3. A PR that changes something trivial in `infra/live/` (e.g., a tag value) triggers `terraform-plan.yml` and shows a clean plan.
4. Merging a PR to `main` triggers `deploy.yml`, which completes successfully and results in:
   - `https://tofd.graycandle.org/api/health` — the interim public hostname (real ACM cert on the existing graycandle.org zone) — returning `{"status": "ok", "service": "tofd-api"}`. The default `*.cloudfront.net` domains of both distributions should also respond.
   - The public-site CloudFront URL serving the placeholder React page showing that health-check result.
   - The admin CloudFront URL serving the "Admin — coming soon" placeholder page.
5. No AWS resource related to this project exists that isn't defined in `infra/bootstrap/` or `infra/live/`.

**STOP after this phase.** Do not begin Phase 1 work automatically — confirm with the human that the pipeline is working as expected first, since every later phase depends on this foundation being solid.
