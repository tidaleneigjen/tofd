resource "aws_cognito_user_pool" "admin" {
  name = "${var.project}-admin-users"

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  admin_create_user_config {
    allow_admin_create_user_only = true
  }

  password_policy {
    minimum_length                   = 12
    require_lowercase                = true
    require_uppercase                = true
    require_numbers                  = true
    require_symbols                  = true
    temporary_password_validity_days = 7
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }
}

# Public SPA client — no client secret, since it runs in a browser. Amplify
# v6 uses USER_SRP_AUTH for sign-in and REFRESH_TOKEN_AUTH for session
# renewal, so USER_PASSWORD_AUTH is deliberately not enabled.
resource "aws_cognito_user_pool_client" "admin_spa" {
  name         = "${var.project}-admin-spa"
  user_pool_id = aws_cognito_user_pool.admin.id

  generate_secret               = false
  prevent_user_existence_errors = "ENABLED"

  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
  ]

  # Token validity left at Cognito defaults (1h access/id, 30d refresh).
  # NOTE: in AWS provider v6 the *_token_validity attributes are unitless
  # numbers whose default unit is hours (access/id) and days (refresh) —
  # omitting them avoids unit ambiguity.
}

# Initial admin accounts. No `password` is set: Cognito generates a
# temporary password and emails it (temporary_password_validity_days = 7
# on the pool). Nothing secret is stored in Terraform state.
resource "aws_cognito_user" "admin" {
  for_each = toset(var.admin_emails)

  user_pool_id = aws_cognito_user_pool.admin.id
  username     = each.value

  desired_delivery_mediums = ["EMAIL"]

  attributes = {
    email          = each.value
    email_verified = "true"
  }
}
