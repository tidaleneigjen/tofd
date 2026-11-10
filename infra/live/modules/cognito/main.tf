# Admin user pool for the admin SPA. No users are created here — that is a
# Phase 1 task once there is something to log into.
resource "aws_cognito_user_pool" "admin" {
  name = "${var.project}-admin-users"

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

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

# Public SPA client — no client secret, since it runs in a browser.
resource "aws_cognito_user_pool_client" "admin_spa" {
  name         = "${var.project}-admin-spa"
  user_pool_id = aws_cognito_user_pool.admin.id

  generate_secret               = false
  prevent_user_existence_errors = "ENABLED"
}
