# Terraform Bootstrap (one-time, human-run)

This configuration creates the resources the CI/CD pipeline needs in order to
exist at all:

- An S3 bucket for Terraform remote state (versioned, encrypted, private)
- A DynamoDB table for Terraform state locking
- The GitHub Actions OIDC identity provider (skipped if one already exists —
  see `create_oidc_provider` / `oidc_provider_arn` in `variables.tf`)
- The IAM role (`tofd-github-actions-deploy`) that GitHub Actions assumes via
  OIDC to run `terraform plan` / `terraform apply` for `infra/live/`

It uses **local state** deliberately — a backend block here would be circular.

## Run once, manually

A human with their own AWS credentials runs this **once**, locally. It is not
run by CI.

```bash
cd infra/bootstrap
terraform init
terraform apply
```

Use the default `aws_region` (`us-east-1`) — the deploy role's IAM policy is
scoped to that region and CloudFront/ACM require it anyway.

## After apply — save these outputs

`terraform output` prints three values; you will need all of them:

1. **`state_bucket_name`** and **`lock_table_name`** → fill in the `TODO`
   placeholders in `infra/live/backend.hcl`, then commit that file.
2. **`deploy_role_arn`** → set it as a **repository variable** (not a secret)
   named `AWS_DEPLOY_ROLE_ARN` in GitHub:
   **Repo → Settings → Secrets and variables → Actions → Variables → New**.
   The CI workflows read it via `${{ vars.AWS_DEPLOY_ROLE_ARN }}`.

After that, every infrastructure change ships through `infra/live/` via CI —
never `terraform apply` from a laptop against the live environment.
