output "placeholder_table_name" {
  description = "Name of the placeholder DynamoDB table (deleted in Phase 1)."
  value       = module.placeholder_table.table_name
}

output "api_endpoint" {
  description = "Direct invoke URL of the API Gateway HTTP API."
  value       = module.api.api_endpoint
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

output "hosted_zone_id" {
  description = "Route 53 hosted zone ID."
  value       = module.dns.hosted_zone_id
}

output "hosted_zone_name_servers" {
  description = "Name servers to set at the registrar at go-live (Phase 4). Empty if using an existing zone."
  value       = module.dns.hosted_zone_name_servers
}
