output "public_site_bucket_name" {
  description = "Name of the public site S3 bucket (deploy target for frontend/public-site)."
  value       = aws_s3_bucket.public_site.id
}

output "admin_site_bucket_name" {
  description = "Name of the admin app S3 bucket (deploy target for frontend/admin)."
  value       = aws_s3_bucket.admin_site.id
}

output "public_distribution_id" {
  description = "ID of the public site CloudFront distribution (invalidation target)."
  value       = aws_cloudfront_distribution.public_site.id
}

output "admin_distribution_id" {
  description = "ID of the admin app CloudFront distribution (invalidation target)."
  value       = aws_cloudfront_distribution.admin_site.id
}

output "public_distribution_domain_name" {
  description = "Default cloudfront.net domain of the public site distribution."
  value       = aws_cloudfront_distribution.public_site.domain_name
}

output "admin_distribution_domain_name" {
  description = "Default cloudfront.net domain of the admin app distribution."
  value       = aws_cloudfront_distribution.admin_site.domain_name
}
