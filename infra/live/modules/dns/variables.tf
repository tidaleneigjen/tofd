variable "project" {
  description = "Project name, used in resource names."
  type        = string
}

variable "zone_name" {
  description = "Apex domain name for the Route 53 hosted zone."
  type        = string
}

variable "public_hostname" {
  description = "Hostname for the public-site ACM certificate."
  type        = string
}

variable "admin_hostname" {
  description = "Hostname for the admin-app ACM certificate."
  type        = string
}

variable "create_hosted_zone" {
  description = "Create a new hosted zone. Set false to use existing_zone_id instead."
  type        = bool
  default     = true
}

variable "existing_zone_id" {
  description = "ID of an existing hosted zone for zone_name. Only used when create_hosted_zone = false."
  type        = string
  default     = ""
}

variable "enable_custom_domains" {
  description = "Create ACM certificates + DNS validation records. MUST stay false until registrar NS records point at this hosted zone (Phase 4 cutover) — ACM DNS validation only completes once the zone is authoritative."
  type        = bool
  default     = false
}
