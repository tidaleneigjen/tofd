output "state_bucket_name" {
  description = "S3 bucket for Terraform remote state. Needed for infra/live/backend.hcl."
  value       = aws_s3_bucket.terraform_state.id
}

output "lock_table_name" {
  description = "DynamoDB table for Terraform state locking. Needed for infra/live/backend.hcl."
  value       = aws_dynamodb_table.terraform_locks.name
}

output "deploy_role_arn" {
  description = "ARN of the GitHub Actions deploy role. Set as the AWS_DEPLOY_ROLE_ARN repository variable in GitHub."
  value       = aws_iam_role.github_actions_deploy.arn
}
