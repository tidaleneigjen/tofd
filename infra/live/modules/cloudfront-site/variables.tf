variable "project" {
  description = "Project name, used in resource names."
  type        = string
}

variable "public_hostname" {
  description = "Hostname for the public site — used as the distribution alias when enable_custom_domains = true."
  type        = string
}

variable "admin_hostname" {
  description = "Hostname for the admin app — used as the distribution alias when enable_custom_domains = true."
  type        = string
}

variable "api_domain_name" {
  description = "Bare domain of the API Gateway HTTP API endpoint, used as the origin for the /api/* cache behavior on the public distribution."
  type        = string
}

variable "enable_custom_domains" {
  description = "Serve the distributions on the public/admin hostnames with ACM certs. MUST stay false until the hosted zone is publicly authoritative (Phase 4 cutover, or already-live zones). When false, distributions use the default *.cloudfront.net certificate and have no aliases."
  type        = bool
  default     = false
}

variable "public_cert_arn" {
  description = "Validated ACM certificate ARN (us-east-1) for the public hostname. Required when enable_custom_domains = true; ignored otherwise."
  type        = string
  default     = null
  nullable    = true
}

variable "admin_cert_arn" {
  description = "Validated ACM certificate ARN (us-east-1) for the admin hostname. Required when enable_custom_domains = true; ignored otherwise."
  type        = string
  default     = null
  nullable    = true
}

variable "price_class" {
  description = "CloudFront price class for both distributions."
  type        = string
  default     = "PriceClass_100"
}
