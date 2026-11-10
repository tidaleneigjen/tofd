output "hosted_zone_id" {
  description = "ID of the hosted zone (created or existing)."
  value       = local.zone_id
}

output "hosted_zone_name_servers" {
  description = "Name servers of the created hosted zone. Empty when using an existing zone — needed at registrar cutover time (Phase 4)."
  value       = var.create_hosted_zone ? aws_route53_zone.this[0].name_servers : []
}

output "www_cert_arn" {
  description = "ARN of the validated ACM certificate for www.<domain>."
  value       = aws_acm_certificate_validation.www.certificate_arn
}

output "admin_cert_arn" {
  description = "ARN of the validated ACM certificate for admin.<domain>."
  value       = aws_acm_certificate_validation.admin.certificate_arn
}
