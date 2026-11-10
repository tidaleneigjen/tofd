output "function_name" {
  description = "Name of the Lambda function."
  value       = aws_lambda_function.api.function_name
}

output "function_arn" {
  description = "ARN of the Lambda function."
  value       = aws_lambda_function.api.arn
}

output "api_id" {
  description = "ID of the API Gateway HTTP API."
  value       = aws_apigatewayv2_api.api.id
}

output "api_endpoint" {
  description = "Invoke URL of the API (no stage prefix — the $default stage is used)."
  value       = aws_apigatewayv2_api.api.api_endpoint
}

output "api_domain_name" {
  description = "Bare domain of the API endpoint, for use as a CloudFront custom origin."
  value       = trimprefix(aws_apigatewayv2_api.api.api_endpoint, "https://")
}

output "api_base_url" {
  description = "Base URL of the API for direct calls (admin app). No trailing slash, no stage prefix — the $default stage is used."
  value       = aws_apigatewayv2_api.api.api_endpoint
}
