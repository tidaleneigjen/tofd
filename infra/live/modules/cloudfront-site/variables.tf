variable "project" {
  description = "Project name, used in resource names."
  type        = string
}

variable "domain_name" {
  description = "Apex domain name; www. and admin. subdomains are used as distribution aliases."
  type        = string
}

variable "api_domain_name" {
  description = "Bare domain of the API Gateway HTTP API endpoint, used as the origin for the /api/* cache behavior on the public distribution."
  type        = string
}

variable "public_cert_arn" {
  description = "Validated ACM certificate ARN (us-east-1) for www.<domain_name>."
  type        = string
}

variable "admin_cert_arn" {
  description = "Validated ACM certificate ARN (us-east-1) for admin.<domain_name>."
  type        = string
}

variable "price_class" {
  description = "CloudFront price class for both distributions."
  type        = string
  default     = "PriceClass_100"
}
