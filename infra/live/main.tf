# Phase 0 scope: prove the pipeline end-to-end with placeholder resources.
# The placeholder DynamoDB table is replaced by real content tables in
# Phase 1 and can be deleted then.

check "hosted_zone_config" {
  assert {
    condition     = var.create_hosted_zone || var.existing_hosted_zone_id != ""
    error_message = "existing_hosted_zone_id must be set when create_hosted_zone = false."
  }
}

module "placeholder_table" {
  source = "./modules/dynamodb-table"

  table_name = "${var.project}-placeholder"
  hash_key   = "id"
}

module "api" {
  source = "./modules/lambda-api"

  project       = var.project
  function_name = "${var.project}-api"
  source_dir    = "${path.root}/../../backend/.build/package"

  table_name = module.placeholder_table.table_name
  table_arn  = module.placeholder_table.table_arn
  environment = {
    TABLE_NAME = module.placeholder_table.table_name
  }
}

module "dns" {
  source = "./modules/dns"

  # ACM certs for CloudFront must be in us-east-1 — see providers.tf.
  providers = {
    aws = aws.us_east_1
  }

  project            = var.project
  zone_name          = var.domain_name
  create_hosted_zone = var.create_hosted_zone
  existing_zone_id   = var.existing_hosted_zone_id
}

module "site" {
  source = "./modules/cloudfront-site"

  project         = var.project
  domain_name     = var.domain_name
  api_domain_name = module.api.api_domain_name
  public_cert_arn = module.dns.www_cert_arn
  admin_cert_arn  = module.dns.admin_cert_arn
  price_class     = var.price_class
}

module "cognito" {
  source = "./modules/cognito"

  project = var.project
}
