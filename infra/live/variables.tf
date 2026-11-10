variable "project" {
  description = "Project name used as a prefix for all resource names."
  type        = string
  default     = "tofd"
}

variable "aws_region" {
  description = "Primary AWS region. CloudFront and the ACM certs it uses always live in us-east-1 regardless of this value."
  type        = string
  default     = "us-east-1"
}

variable "zone_name" {
  description = "Apex domain for the Route 53 hosted zone. Public/admin hostnames default to its www./admin. subdomains unless overridden."
  type        = string
  default     = "templeofthefemininedivine.org"
}

variable "public_hostname" {
  description = "Hostname for the public site (CloudFront alias, ACM cert, Route53 record). Defaults to www.<zone_name> when null — set explicitly for interim deployments on a different domain."
  type        = string
  default     = null
}

variable "admin_hostname" {
  description = "Hostname for the admin app (CloudFront alias, ACM cert, Route53 record). Defaults to admin.<zone_name> when null."
  type        = string
  default     = null
}

variable "enable_custom_domains" {
  description = "Serve the CloudFront distributions on the public/admin hostnames with ACM certs and create the Route53 alias records. Keep false until the hosted zone for zone_name is publicly authoritative (registrar NS pointed at it) — ACM DNS validation cannot complete otherwise. When false, the sites are reachable only on their default *.cloudfront.net domains."
  type        = bool
  default     = false
}

variable "create_hosted_zone" {
  description = "Create a new Route 53 hosted zone for zone_name. Set to false if a hosted zone already exists in this account (then set existing_hosted_zone_id) — Terraform will then only manage records inside that zone, never the zone itself."
  type        = bool
  default     = true
}

variable "existing_hosted_zone_id" {
  description = "ID of an existing Route 53 hosted zone for zone_name. Only used when create_hosted_zone = false."
  type        = string
  default     = ""
}

variable "price_class" {
  description = "CloudFront price class. PriceClass_100 (US/Canada/Europe) is the cheapest tier and covers the expected audience."
  type        = string
  default     = "PriceClass_100"
}

variable "admin_emails" {
  description = "Email addresses that get a Cognito admin account for the admin app. Each receives a temporary password by email on creation (valid 7 days). Add more emails here to grant access; removing one does not delete the Cognito user."
  type        = list(string)
  default     = []
}
