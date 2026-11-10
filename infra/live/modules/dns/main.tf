# Route 53 hosted zone + (optionally) ACM certificates with DNS validation.
# No registrar/NS changes are made here — creating the zone does not affect
# the live site until someone manually repoints nameservers at the registrar
# (a Phase 4 action).
#
# ACM certs are gated behind enable_custom_domains: DNS validation can only
# complete once the hosted zone is publicly authoritative, i.e. after the
# registrar NS cutover. Creating them earlier would hang `terraform apply`
# until validation times out.

resource "aws_route53_zone" "this" {
  count = var.create_hosted_zone ? 1 : 0

  name = var.zone_name
}

locals {
  zone_id = var.create_hosted_zone ? aws_route53_zone.this[0].zone_id : var.existing_zone_id
}

resource "aws_acm_certificate" "www" {
  count = var.enable_custom_domains ? 1 : 0

  domain_name       = "www.${var.zone_name}"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_acm_certificate" "admin" {
  count = var.enable_custom_domains ? 1 : 0

  domain_name       = "admin.${var.zone_name}"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "www_cert_validation" {
  count = var.enable_custom_domains ? 1 : 0

  zone_id = local.zone_id
  name    = one(aws_acm_certificate.www[0].domain_validation_options).resource_record_name
  type    = one(aws_acm_certificate.www[0].domain_validation_options).resource_record_type
  ttl     = 60
  records = [one(aws_acm_certificate.www[0].domain_validation_options).resource_record_value]
}

resource "aws_route53_record" "admin_cert_validation" {
  count = var.enable_custom_domains ? 1 : 0

  zone_id = local.zone_id
  name    = one(aws_acm_certificate.admin[0].domain_validation_options).resource_record_name
  type    = one(aws_acm_certificate.admin[0].domain_validation_options).resource_record_type
  ttl     = 60
  records = [one(aws_acm_certificate.admin[0].domain_validation_options).resource_record_value]
}

resource "aws_acm_certificate_validation" "www" {
  count = var.enable_custom_domains ? 1 : 0

  certificate_arn         = aws_acm_certificate.www[0].arn
  validation_record_fqdns = [aws_route53_record.www_cert_validation[0].fqdn]
}

resource "aws_acm_certificate_validation" "admin" {
  count = var.enable_custom_domains ? 1 : 0

  certificate_arn         = aws_acm_certificate.admin[0].arn
  validation_record_fqdns = [aws_route53_record.admin_cert_validation[0].fqdn]
}
