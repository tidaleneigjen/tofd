# MVP homepage CMS (Phase 1): pages table + authenticated page editor API.
# Later phases add more content tables and routes.

locals {
  # Effective hostnames: default to www./admin. subdomains of zone_name,
  # overridable via tfvars for interim deployments on a different domain.
  public_hostname = var.public_hostname != null ? var.public_hostname : "www.${var.zone_name}"
  admin_hostname  = var.admin_hostname != null ? var.admin_hostname : "admin.${var.zone_name}"

  # CloudFront's fixed Route 53 hosted zone ID — required as the alias target
  # zone_id for records pointing at a distribution.
  cloudfront_zone_id = "Z2FDTNDATAQYW2"
}

check "hosted_zone_config" {
  assert {
    condition     = var.create_hosted_zone || var.existing_hosted_zone_id != ""
    error_message = "existing_hosted_zone_id must be set when create_hosted_zone = false."
  }
}

# Alias records pointing the custom domains at the CloudFront distributions.
# Only created when enable_custom_domains = true (post-NS-cutover, Phase 4);
# until then the sites are reachable on their *.cloudfront.net domains.
locals {
  distribution_aliases = var.enable_custom_domains ? {
    www_a = {
      record_name         = local.public_hostname
      type                = "A"
      distribution_domain = module.site.public_distribution_domain_name
    }
    www_aaaa = {
      record_name         = local.public_hostname
      type                = "AAAA"
      distribution_domain = module.site.public_distribution_domain_name
    }
    admin_a = {
      record_name         = local.admin_hostname
      type                = "A"
      distribution_domain = module.site.admin_distribution_domain_name
    }
    admin_aaaa = {
      record_name         = local.admin_hostname
      type                = "AAAA"
      distribution_domain = module.site.admin_distribution_domain_name
    }
  } : {}
}

resource "aws_route53_record" "distribution_alias" {
  for_each = local.distribution_aliases

  zone_id         = module.dns.hosted_zone_id
  name            = each.value.record_name
  type            = each.value.type
  allow_overwrite = true

  alias {
    name                   = each.value.distribution_domain
    zone_id                = local.cloudfront_zone_id
    evaluate_target_health = false
  }
}

# Content store. One table per content type; Phase 1 has only pages.
module "pages_table" {
  source = "./modules/dynamodb-table"

  table_name = "${var.project}-pages"
  hash_key   = "slug"
}

module "api" {
  source = "./modules/lambda-api"

  project       = var.project
  function_name = "${var.project}-api"
  source_dir    = "${path.root}/../../backend/.build/package"

  table_arns = [module.pages_table.table_arn]
  environment = {
    PAGES_TABLE_NAME = module.pages_table.table_name
  }

  cognito_user_pool_id  = module.cognito.user_pool_id
  cognito_app_client_id = module.cognito.user_pool_client_id
  # Only the admin app calls the API cross-origin; the public site uses
  # same-origin /api/* through CloudFront.
  cors_allowed_origins = ["https://${local.admin_hostname}"]
}

module "dns" {
  source = "./modules/dns"

  # ACM certs for CloudFront must be in us-east-1 — see providers.tf.
  providers = {
    aws = aws.us_east_1
  }

  project               = var.project
  zone_name             = var.zone_name
  public_hostname       = local.public_hostname
  admin_hostname        = local.admin_hostname
  create_hosted_zone    = var.create_hosted_zone
  existing_zone_id      = var.existing_hosted_zone_id
  enable_custom_domains = var.enable_custom_domains
}

module "site" {
  source = "./modules/cloudfront-site"

  project               = var.project
  public_hostname       = local.public_hostname
  admin_hostname        = local.admin_hostname
  api_domain_name       = module.api.api_domain_name
  public_cert_arn       = module.dns.public_cert_arn
  admin_cert_arn        = module.dns.admin_cert_arn
  enable_custom_domains = var.enable_custom_domains
  price_class           = var.price_class
}

module "cognito" {
  source = "./modules/cognito"

  project      = var.project
  admin_emails = var.admin_emails
}
