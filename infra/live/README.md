# infra/live — main infrastructure

Everything in the AWS account for this project is defined here and deployed by
CI on merge to `main`. Do not `terraform apply` this configuration from a
laptop — the deploy workflow does it.

## Prerequisites

1. `infra/bootstrap/` has been applied once by a human (see
   `infra/bootstrap/README.md`).
2. `backend.hcl` has been filled in with the bootstrap outputs
   (`state_bucket_name`, `lock_table_name`).
3. The GitHub repo variable `AWS_DEPLOY_ROLE_ARN` is set.

## Local commands

The Lambda package is built by `backend/build.sh` — `archive_file` reads that
directory at plan time, so run it before `plan`/`apply` locally:

```bash
backend/build.sh
terraform init -backend-config=backend.hcl
terraform plan
```

## Variables

See `variables.tf`. Notable ones:

- `zone_name` — apex domain for the Route 53 hosted zone (default
  `templeofthefemininedivine.org`, the eventual production domain).
- `public_hostname` / `admin_hostname` — hostnames for the two sites
  (CloudFront aliases, ACM certs, Route53 records). Default to
  `www.`/`admin.` subdomains of `zone_name`; set explicitly to deploy on a
  different domain.
- `create_hosted_zone` — set `false` + `existing_hosted_zone_id` if a Route 53
  hosted zone for the zone already exists in the account. When `false`,
  Terraform only manages records *inside* that zone — it cannot create or
  destroy the zone itself.
- `enable_custom_domains` — controls whether ACM certs, distribution aliases,
  and Route53 alias records are created. Must be `false` while the zone is not
  publicly authoritative (ACM DNS validation would hang); `true` once it is.
- `price_class` — CloudFront price class (default `PriceClass_100`, cheapest).

## Interim domain: tofd.graycandle.org

The committed `terraform.tfvars` currently deploys the site at
**tofd.graycandle.org** (public) and **admin.tofd.graycandle.org** (admin),
served from the **existing** `graycandle.org` Route 53 hosted zone
(`Z15A3OOMLRD544`, same AWS account — managed outside this repo; Terraform
only adds `tofd.*` records and ACM validation CNAMEs inside it).

`enable_custom_domains = true` is set there because that zone is already
authoritative, so certificate validation works normally. The eventual swap to
`templeofthefemininedivine.org` at Phase 4 cutover is a **tfvars-only change**
— see the comments at the top of `terraform.tfvars`.
