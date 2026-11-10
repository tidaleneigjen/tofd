variable "project" {
  description = "Project name, used in resource names."
  type        = string
}

variable "function_name" {
  description = "Name of the Lambda function."
  type        = string
}

variable "source_dir" {
  description = "Directory containing the packaged Lambda code (run backend/build.sh first — this is what terraform's archive_file zips)."
  type        = string
}

variable "table_arns" {
  description = "ARNs of the DynamoDB tables the function may access."
  type        = list(string)
}

variable "environment" {
  description = "Environment variables for the Lambda function."
  type        = map(string)
  default     = {}
}

variable "cognito_user_pool_id" {
  description = "ID of the Cognito user pool whose ID tokens authorize PUT routes."
  type        = string
}

variable "cognito_app_client_id" {
  description = "App client ID used as the JWT authorizer audience."
  type        = string
}

variable "cors_allowed_origins" {
  description = "Origins allowed to call the API cross-origin (the admin app origin only)."
  type        = list(string)
  default     = []
}

variable "runtime" {
  description = "Lambda runtime."
  type        = string
  default     = "python3.12"
}

variable "handler" {
  description = "Lambda handler entrypoint."
  type        = string
  default     = "app.handler"
}

variable "timeout" {
  description = "Lambda timeout in seconds."
  type        = number
  default     = 10
}

variable "memory_size" {
  description = "Lambda memory size in MB."
  type        = number
  default     = 256
}
