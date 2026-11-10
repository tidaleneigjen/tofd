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

variable "domain_name" {
  description = "Apex domain for the site (Route 53 hosted zone + ACM certs are created for www. and admin. subdomains)."
  type        = string
  default     = "templeofthefemininedivine.org"
}

variable "create_hosted_zone" {
  description = "Create a new Route 53 hosted zone for domain_name. Set to false if a hosted zone already exists in this account (then set existing_hosted_zone_id)."
  type        = bool
  default     = true
}

variable "existing_hosted_zone_id" {
  description = "ID of an existing Route 53 hosted zone for domain_name. Only used when create_hosted_zone = false."
  type        = string
  default     = ""
}

variable "price_class" {
  description = "CloudFront price class. PriceClass_100 (US/Canada/Europe) is the cheapest tier and covers the expected audience."
  type        = string
  default     = "PriceClass_100"
}
