output "pages_table_name" {
  description = "Name of the DynamoDB table holding CMS page content (keyed by slug)."
  value       = module.pages_table.table_name
}

output "api_endpoint" {
  description = "Direct invoke URL of the API Gateway HTTP API."
  value       = module.api.api_endpoint
}

output "api_base_url" {
  description = "Base URL for direct API calls from the admin app (no trailing slash, no stage prefix)."
  value       = module.api.api_base_url
}

output "public_site_bucket_name" {
  description = "S3 bucket the deploy workflow syncs frontend/public-site into."
  value       = module.site.public_site_bucket_name
}

output "admin_site_bucket_name" {
  description = "S3 bucket the deploy workflow syncs frontend/admin into."
  value       = module.site.admin_site_bucket_name
}

output "public_distribution_id" {
  description = "CloudFront distribution ID invalidated after public-site deploys."
  value       = module.site.public_distribution_id
}

output "admin_distribution_id" {
  description = "CloudFront distribution ID invalidated after admin deploys."
  value       = module.site.admin_distribution_id
}

output "public_distribution_domain_name" {
  description = "cloudfront.net domain serving the public site (usable before DNS cutover)."
  value       = module.site.public_distribution_domain_name
}

output "admin_distribution_domain_name" {
  description = "cloudfront.net domain serving the admin app (usable before DNS cutover)."
  value       = module.site.admin_distribution_domain_name
}

output "cognito_user_pool_id" {
  description = "ID of the admin Cognito user pool."
  value       = module.cognito.user_pool_id
}

output "cognito_user_pool_client_id" {
  description = "ID of the public SPA app client for the admin app."
  value       = module.cognito.user_pool_client_id
}

output "cognito_app_client_id" {
  description = "ID of the Cognito app client used as the API JWT audience."
  value       = module.cognito.user_pool_client_id
}

output "hosted_zone_id" {
  description = "Route 53 hosted zone ID."
  value       = module.dns.hosted_zone_id
}

output "hosted_zone_name_servers" {
  description = "Name servers to set at the registrar at go-live (Phase 4). Empty if using an existing zone."
  value       = module.dns.hosted_zone_name_servers
}
