provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project   = var.project
      ManagedBy = "terraform"
    }
  }
}

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

locals {
  account_id         = data.aws_caller_identity.current.account_id
  region             = data.aws_region.current.region
  state_bucket_name  = var.state_bucket_name != "" ? var.state_bucket_name : "${var.project}-terraform-state-${local.account_id}"
  oidc_provider_arn  = var.create_oidc_provider ? aws_iam_openid_connect_provider.github[0].arn : var.oidc_provider_arn
  github_repo_prefix = "repo:${var.github_repository}"
}

# --- Terraform remote state storage -------------------------------------

resource "aws_s3_bucket" "terraform_state" {
  bucket = local.state_bucket_name

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# --- Terraform state locking --------------------------------------------

resource "aws_dynamodb_table" "terraform_locks" {
  name         = var.lock_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}

# --- GitHub Actions OIDC + deploy role -----------------------------------

# An AWS account can only have one OIDC provider per URL. If one already
# exists (check: aws iam list-open-id-connect-providers), set
# create_oidc_provider = false and pass its ARN via oidc_provider_arn.
resource "aws_iam_openid_connect_provider" "github" {
  count = var.create_oidc_provider ? 1 : 0

  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

data "aws_iam_policy_document" "deploy_assume_role" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [local.oidc_provider_arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    # Only this repository may assume the role: pushes to main (deploy) and
    # pull requests (plan).
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values = [
        "${local.github_repo_prefix}:ref:refs/heads/main",
        "${local.github_repo_prefix}:pull_request",
      ]
    }
  }
}

resource "aws_iam_role" "github_actions_deploy" {
  name                 = "${var.project}-github-actions-deploy"
  assume_role_policy   = data.aws_iam_policy_document.deploy_assume_role.json
  max_session_duration = 3600

  lifecycle {
    precondition {
      condition     = var.create_oidc_provider || var.oidc_provider_arn != ""
      error_message = "oidc_provider_arn must be set when create_oidc_provider = false."
    }
  }
}

# Permissions needed by `terraform apply` in infra/live/ plus the deploy
# workflow's `aws s3 sync` and `aws cloudfront create-invalidation` steps.
# Broad per-service access (no hand-tuned per-action policies), but never
# wildcard admin: every statement is scoped to a single AWS service, and
# most are further scoped to this project's resource name prefix.
data "aws_iam_policy_document" "deploy_permissions" {
  statement {
    sid     = "DynamoDBTables"
    actions = ["dynamodb:*"]
    resources = [
      "arn:aws:dynamodb:${local.region}:${local.account_id}:table/${var.project}-*",
      "arn:aws:dynamodb:${local.region}:${local.account_id}:table/${var.project}-*/index/*",
    ]
  }

  statement {
    sid       = "DynamoDBList"
    actions   = ["dynamodb:ListTables", "dynamodb:DescribeEndpoints"]
    resources = ["*"]
  }

  statement {
    sid = "LambdaList"
    actions = [
      "lambda:ListFunctions",
      "lambda:GetAccountSettings",
    ]
    resources = ["*"]
  }

  statement {
    sid     = "LambdaFunctions"
    actions = ["lambda:*"]
    resources = [
      "arn:aws:lambda:${local.region}:${local.account_id}:function:${var.project}-*",
      "arn:aws:lambda:${local.region}:${local.account_id}:function:${var.project}-*:*",
    ]
  }

  statement {
    sid     = "CloudWatchLogs"
    actions = ["logs:*"]
    resources = [
      "arn:aws:logs:${local.region}:${local.account_id}:log-group:/aws/lambda/${var.project}-*",
      "arn:aws:logs:${local.region}:${local.account_id}:log-group:/aws/lambda/${var.project}-*:*",
    ]
  }

  statement {
    sid       = "ApiGatewayHttpApis"
    actions   = ["apigateway:*"]
    resources = ["arn:aws:apigateway:${local.region}::/*"]
  }

  statement {
    sid     = "S3ProjectBuckets"
    actions = ["s3:*"]
    resources = [
      "arn:aws:s3:::${var.project}-*",
      "arn:aws:s3:::${var.project}-*/*",
    ]
  }

  statement {
    sid       = "S3ListAllBuckets"
    actions   = ["s3:ListAllMyBuckets"]
    resources = ["*"]
  }

  # CloudFront create/update actions cannot be scoped to a not-yet-existing
  # distribution ARN, so this stays service-wide.
  statement {
    sid       = "CloudFront"
    actions   = ["cloudfront:*"]
    resources = ["*"]
  }

  statement {
    sid     = "CognitoUserPools"
    actions = ["cognito-idp:*"]
    resources = [
      "arn:aws:cognito-idp:${local.region}:${local.account_id}:userpool/*",
    ]
  }

  statement {
    sid = "CognitoCreateAndList"
    actions = [
      "cognito-idp:CreateUserPool",
      "cognito-idp:CreateUserPoolClient",
      "cognito-idp:ListUserPools",
    ]
    resources = ["*"]
  }

  statement {
    sid       = "Route53HostedZones"
    actions   = ["route53:*"]
    resources = ["arn:aws:route53:::hostedzone/*"]
  }

  statement {
    sid = "Route53ListAndCreate"
    actions = [
      "route53:ListHostedZones",
      "route53:CreateHostedZone",
      "route53:GetChange",
    ]
    resources = ["*"]
  }

  statement {
    sid     = "AcmCertificates"
    actions = ["acm:*"]
    resources = [
      "arn:aws:acm:${local.region}:${local.account_id}:certificate/*",
    ]
  }

  statement {
    sid = "AcmRequestAndList"
    actions = [
      "acm:RequestCertificate",
      "acm:ListCertificates",
      "acm:DescribeCertificate",
    ]
    resources = ["*"]
  }

  statement {
    sid = "IamProjectRolesAndPolicies"
    actions = [
      "iam:CreateRole",
      "iam:DeleteRole",
      "iam:GetRole",
      "iam:ListRolePolicies",
      "iam:ListAttachedRolePolicies",
      "iam:PutRolePolicy",
      "iam:DeleteRolePolicy",
      "iam:AttachRolePolicy",
      "iam:DetachRolePolicy",
      "iam:TagRole",
      "iam:UntagRole",
      "iam:UpdateRole",
      "iam:UpdateAssumeRolePolicy",
      "iam:PassRole",
      "iam:CreatePolicy",
      "iam:DeletePolicy",
      "iam:GetPolicy",
      "iam:GetPolicyVersion",
      "iam:ListPolicyVersions",
      "iam:CreatePolicyVersion",
      "iam:DeletePolicyVersion",
      "iam:TagPolicy",
      "iam:UntagPolicy",
    ]
    resources = [
      "arn:aws:iam::${local.account_id}:role/${var.project}-*",
      "arn:aws:iam::${local.account_id}:policy/${var.project}-*",
    ]
  }

  statement {
    sid       = "IamListRoles"
    actions   = ["iam:ListRoles"]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "deploy_permissions" {
  name   = "${var.project}-deploy-permissions"
  role   = aws_iam_role.github_actions_deploy.id
  policy = data.aws_iam_policy_document.deploy_permissions.json
}
