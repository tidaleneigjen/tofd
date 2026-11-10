# Route 53 hosted zone + ACM certificates (us-east-1, required for
# CloudFront) with DNS validation. No registrar/NS changes are made here —
# creating the zone does not affect the live site until someone manually
# repoints nameservers at the registrar (a Phase 4 action).

resource "aws_route53_zone" "this" {
  count = var.create_hosted_zone ? 1 : 0

  name = var.zone_name
}

locals {
  zone_id = var.create_hosted_zone ? aws_route53_zone.this[0].zone_id : var.existing_zone_id
}

resource "aws_acm_certificate" "www" {
  domain_name       = "www.${var.zone_name}"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_acm_certificate" "admin" {
  domain_name       = "admin.${var.zone_name}"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "www_cert_validation" {
  zone_id = local.zone_id
  name    = one(aws_acm_certificate.www.domain_validation_options).resource_record_name
  type    = one(aws_acm_certificate.www.domain_validation_options).resource_record_type
  ttl     = 60
  records = [one(aws_acm_certificate.www.domain_validation_options).resource_record_value]
}

resource "aws_route53_record" "admin_cert_validation" {
  zone_id = local.zone_id
  name    = one(aws_acm_certificate.admin.domain_validation_options).resource_record_name
  type    = one(aws_acm_certificate.admin.domain_validation_options).resource_record_type
  ttl     = 60
  records = [one(aws_acm_certificate.admin.domain_validation_options).resource_record_value]
}

resource "aws_acm_certificate_validation" "www" {
  certificate_arn         = aws_acm_certificate.www.arn
  validation_record_fqdns = [aws_route53_record.www_cert_validation.fqdn]
}

resource "aws_acm_certificate_validation" "admin" {
  certificate_arn         = aws_acm_certificate.admin.arn
  validation_record_fqdns = [aws_route53_record.admin_cert_validation.fqdn]
}
