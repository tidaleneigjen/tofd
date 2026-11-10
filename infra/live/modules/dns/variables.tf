variable "project" {
  description = "Project name, used in resource names."
  type        = string
}

variable "zone_name" {
  description = "Apex domain name for the Route 53 hosted zone."
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
