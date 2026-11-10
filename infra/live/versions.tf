terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # Remote state lives in the bucket/table created by infra/bootstrap.
  # Values come from infra/bootstrap outputs — see backend.hcl and
  # infra/bootstrap/README.md. Initialize with:
  #   terraform init -backend-config=backend.hcl
  backend "s3" {}
}
