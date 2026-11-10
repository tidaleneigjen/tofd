# Temple of the Feminine Divine — Website

Rebuild of the Temple of the Feminine Divine website: a lightweight custom CMS
(no WordPress) on AWS.

- **Frontend:** two React + Vite SPAs — `frontend/public-site` (public site)
  and `frontend/admin` (admin/CMS UI)
- **Backend:** a single Python Lambda behind API Gateway HTTP API, routed with
  AWS Lambda Powertools (`backend/src/`)
- **Data:** DynamoDB (one table per content type, on-demand billing)
- **Hosting:** private S3 buckets behind CloudFront (OAC), Route 53 + ACM
- **Infra/IaC:** Terraform (`infra/`), deployed by GitHub Actions on merge to
  `main`

Full architecture and phase plan:
[`planning/2026-11-10-architecture-pivot-and-master-plan.md`](planning/2026-11-10-architecture-pivot-and-master-plan.md)
— that document is the source of truth. Per-phase task briefs live in
`planning/phases/`.

## Repository layout

```
infra/bootstrap/   one-time local Terraform run (state bucket, lock table,
                   GitHub OIDC + deploy role) — see its README
infra/live/        main infrastructure, deployed by CI
backend/           Python Lambda source + pytest tests
frontend/          public-site and admin React apps
planning/          planning docs and preserved assets (do not treat as code)
```

## Local development

Frontend apps (each is a standard Vite React app):

```bash
cd frontend/public-site   # or frontend/admin
npm install
npm run dev               # dev server with HMR
npm run build             # production build -> dist/
npm test                  # admin only: vitest component/unit tests
```

**Public site** (`frontend/public-site`): `npm run dev` proxies `/api/*`
to `https://tofd.graycandle.org` so API calls work locally (override with
`VITE_DEV_API_TARGET`). If the API is unreachable the homepage falls back
to the default copy — the dev proxy is convenient but not required.

**Admin app** (`frontend/admin`): needs three public Cognito/API identifiers
or it renders a "not configured" notice. Copy `.env.example` to `.env.local`
(gitignored) and fill in `VITE_COGNITO_USER_POOL_ID`,
`VITE_COGNITO_APP_CLIENT_ID`, and `VITE_API_BASE_URL` — get the values from
`terraform output` in `infra/live` after a deploy. These are public client
identifiers, not secrets.

Backend tests:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
pytest
```

Building the Lambda deployment package (needed before local
`terraform plan`/`apply` in `infra/live`, since `archive_file` zips it):

```bash
backend/build.sh
```

## Deployment

- `infra/bootstrap/` is applied **once, manually, by a human** — it creates the
  Terraform state bucket, lock table, and the GitHub OIDC deploy role. See
  `infra/bootstrap/README.md` for the exact steps and the required follow-up
  (fill `infra/live/backend.hcl`, set the `AWS_DEPLOY_ROLE_ARN` repo variable).
- Every merge to `main` runs `.github/workflows/deploy.yml`: `terraform apply`
  in `infra/live/`, then build + S3 sync + CloudFront invalidation for both
  frontends. PRs touching `infra/live/` or `backend/` get a `terraform plan`
  check via `.github/workflows/terraform-plan.yml`.

Domain/DNS: the site currently deploys to the **interim domain**
`tofd.graycandle.org` / `admin.tofd.graycandle.org`, served from the existing
`graycandle.org` Route 53 hosted zone via the committed
`infra/live/terraform.tfvars` (hostnames are decoupled from the zone name, so
the eventual swap to `templeofthefemininedivine.org` at Phase 4 cutover is a
tfvars-only change made after the registrar NS repoint). ACM certificates,
aliases, and alias records are gated behind `enable_custom_domains`, which
must stay `false` while a zone is not yet publicly authoritative. The default
`*.cloudfront.net` distribution domains always work (see `terraform output`
in `infra/live`).
