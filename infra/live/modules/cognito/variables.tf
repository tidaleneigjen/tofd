variable "project" {
  description = "Project name, used in resource names."
  type        = string
}

variable "admin_emails" {
  description = "Email addresses that get a Cognito admin account. Each gets a temporary password emailed by Cognito on creation."
  type        = list(string)
  default     = []
}
