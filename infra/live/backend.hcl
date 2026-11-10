# Partial backend configuration for the S3 backend declared in versions.tf.
#
# This file contains no secrets and is safe to commit.

bucket         = "tofd-terraform-state-603078153136"
key            = "live/terraform.tfstate"
region         = "us-east-1"
dynamodb_table = "tofd-terraform-locks"
encrypt        = true
