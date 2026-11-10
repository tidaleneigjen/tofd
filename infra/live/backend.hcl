# Partial backend configuration for the S3 backend declared in versions.tf.
#
# TODO: replace the two placeholder values with the `state_bucket_name` and
# `lock_table_name` outputs from `terraform output` in infra/bootstrap after a
# human has run the one-time bootstrap. See infra/bootstrap/README.md.
#
# This file contains no secrets and is safe to commit.

bucket         = "TODO-state-bucket-name-from-bootstrap-output"
key            = "live/terraform.tfstate"
region         = "us-east-1"
dynamodb_table = "TODO-lock-table-name-from-bootstrap-output"
encrypt        = true
