variable "project" {
  description = "Project name, used in resource names."
  type        = string
}

variable "domain_name" {
  description = "Apex domain name; www. and admin. subdomains are used as distribution aliases when enable_custom_domains = true."
  type        = string
}

variable "api_domain_name" {
  description = "Bare domain of the API Gateway HTTP API endpoint, used as the origin for the /api/* cache behavior on the public distribution."
  type        = string
}

variable "enable_custom_domains" {
  description = "Serve the distributions on www./admin. <domain_name> with ACM certs. MUST stay false until registrar NS records point at the Route 53 zone (Phase 4 cutover). When false, distributions use the default *.cloudfront.net certificate and have no aliases."
  type        = bool
  default     = false
}

variable "public_cert_arn" {
  description = "Validated ACM certificate ARN (us-east-1) for www.<domain_name>. Required when enable_custom_domains = true; ignored otherwise."
  type        = string
  default     = null
  nullable    = true
}

variable "admin_cert_arn" {
  description = "Validated ACM certificate ARN (us-east-1) for admin.<domain_name>. Required when enable_custom_domains = true; ignored otherwise."
  type        = string
  default     = null
  nullable    = true
}

variable "price_class" {
  description = "CloudFront price class for both distributions."
  type        = string
  default     = "PriceClass_100"
}
