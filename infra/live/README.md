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

- `domain_name` — apex domain (default `templeofthefemininedivine.org`).
- `create_hosted_zone` — set `false` + `existing_hosted_zone_id` if a Route 53
  hosted zone for the domain already exists in the account.
- `enable_custom_domains` — **must stay `false` until Phase 4 cutover.** When
  `false` (default), the Route 53 zone is created but no ACM certs, aliases,
  or custom-domain records exist, and the CloudFront distributions serve only
  on their `*.cloudfront.net` domains. Flip to `true` via a normal PR **after**
  the registrar NS records are repointed to the hosted zone — that apply
  creates the certs (DNS validation then succeeds), the www/admin aliases, and
  the A/AAAA alias records.
- `price_class` — CloudFront price class (default `PriceClass_100`, cheapest).
