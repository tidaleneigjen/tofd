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

variable "table_name" {
  description = "Name of the DynamoDB table the function may access."
  type        = string
}

variable "table_arn" {
  description = "ARN of the DynamoDB table the function may access."
  type        = string
}

variable "environment" {
  description = "Environment variables for the Lambda function."
  type        = map(string)
  default     = {}
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
