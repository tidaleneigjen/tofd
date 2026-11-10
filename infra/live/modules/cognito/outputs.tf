output "user_pool_id" {
  description = "ID of the Cognito user pool."
  value       = aws_cognito_user_pool.admin.id
}

output "user_pool_client_id" {
  description = "ID of the public SPA app client."
  value       = aws_cognito_user_pool_client.admin_spa.id
}

output "user_pool_arn" {
  description = "ARN of the Cognito user pool."
  value       = aws_cognito_user_pool.admin.arn
}
