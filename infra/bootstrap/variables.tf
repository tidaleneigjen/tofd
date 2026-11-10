variable "project" {
  description = "Project name used as a prefix for all resource names."
  type        = string
  default     = "tofd"
}

variable "aws_region" {
  description = "AWS region for bootstrap resources. Keep us-east-1: the deploy role's IAM policy is scoped to this region and CloudFront/ACM require us-east-1."
  type        = string
  default     = "us-east-1"
}

variable "github_repository" {
  description = "GitHub repository (owner/name) allowed to assume the deploy role via OIDC."
  type        = string
  default     = "tidaleneigjen/tofd"
}

variable "state_bucket_name" {
  description = "Name for the Terraform state bucket. Leave empty to default to <project>-terraform-state-<account-id>."
  type        = string
  default     = ""
}

variable "lock_table_name" {
  description = "Name for the DynamoDB state-lock table."
  type        = string
  default     = "tofd-terraform-locks"
}

variable "create_oidc_provider" {
  description = "Set to false if an IAM OIDC provider for token.actions.githubusercontent.com already exists in this account; then set oidc_provider_arn."
  type        = bool
  default     = true
}

variable "oidc_provider_arn" {
  description = "ARN of an existing GitHub Actions OIDC provider. Only used when create_oidc_provider = false."
  type        = string
  default     = ""
}
