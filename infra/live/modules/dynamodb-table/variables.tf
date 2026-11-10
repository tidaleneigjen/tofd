variable "table_name" {
  description = "Name of the DynamoDB table."
  type        = string
}

variable "hash_key" {
  description = "Name of the table's hash (partition) key."
  type        = string
  default     = "id"
}

variable "billing_mode" {
  description = "DynamoDB billing mode. PAY_PER_REQUEST keeps costs near zero at low traffic."
  type        = string
  default     = "PAY_PER_REQUEST"
}
