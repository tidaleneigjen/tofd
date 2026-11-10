data "aws_caller_identity" "current" {}

check "custom_domains_require_certs" {
  assert {
    condition     = !var.enable_custom_domains || (var.public_cert_arn != null && var.admin_cert_arn != null)
    error_message = "public_cert_arn and admin_cert_arn must be provided when enable_custom_domains = true."
  }
}

locals {
  public_alias = var.public_hostname
  admin_alias  = var.admin_hostname
}

# Managed cache/origin-request policies, looked up by name so we don't
# hardcode their IDs.
data "aws_cloudfront_cache_policy" "caching_optimized" {
  name = "Managed-CachingOptimized"
}

data "aws_cloudfront_cache_policy" "caching_disabled" {
  name = "Managed-CachingDisabled"
}

# AllViewerExceptHostHeader is used instead of AllViewer for the /api/*
# behavior: API Gateway HTTP API origins reject requests whose Host header
# doesn't match the execute-api domain, and AllViewer would forward the
# viewer's Host (the site's public hostname).
data "aws_cloudfront_origin_request_policy" "all_viewer_except_host_header" {
  name = "Managed-AllViewerExceptHostHeader"
}

# --- Private S3 buckets (CloudFront OAC only, no public access) ------------

resource "aws_s3_bucket" "public_site" {
  bucket = "${var.project}-public-site-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket" "admin_site" {
  bucket = "${var.project}-admin-app-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_public_access_block" "public_site" {
  bucket = aws_s3_bucket.public_site.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "admin_site" {
  bucket = aws_s3_bucket.admin_site.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "public_site" {
  bucket = aws_s3_bucket.public_site.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_ownership_controls" "admin_site" {
  bucket = aws_s3_bucket.admin_site.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "public_site" {
  bucket = aws_s3_bucket.public_site.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "admin_site" {
  bucket = aws_s3_bucket.admin_site.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# --- Origin Access Control -------------------------------------------------

resource "aws_cloudfront_origin_access_control" "public_site" {
  name                              = "${var.project}-public-site-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_origin_access_control" "admin_site" {
  name                              = "${var.project}-admin-site-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# SPA fallback: rewrites extensionless URIs to /index.html so client-side
# routing works. Attached as viewer-request on the DEFAULT (S3) behavior of
# each distribution only — never on /api/*. We deliberately do NOT use
# distribution-wide custom_error_response (403/404 -> /index.html) because it
# applies to every behavior and would mask real API Gateway errors (e.g. a
# legitimate 404 from GET /api/pages/{slug}) with HTML and a 200.
resource "aws_cloudfront_function" "spa_rewrite" {
  name    = "${var.project}-spa-rewrite"
  runtime = "cloudfront-js-2.0"
  comment = "Rewrite extensionless URIs to /index.html for SPA routing"
  publish = true
  code    = file("${path.module}/spa-rewrite.js")
}

# --- Public site distribution ----------------------------------------------
# Default behavior serves the React SPA from S3; /api/* proxies to the API
# Gateway HTTP API so the frontend can call its own API same-origin.

resource "aws_cloudfront_distribution" "public_site" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${var.project} public site"
  default_root_object = "index.html"
  price_class         = var.price_class
  http_version        = "http2and3"
  aliases             = var.enable_custom_domains ? [local.public_alias] : []

  origin {
    domain_name              = aws_s3_bucket.public_site.bucket_regional_domain_name
    origin_id                = "public-site-s3"
    origin_access_control_id = aws_cloudfront_origin_access_control.public_site.id
  }

  origin {
    domain_name = var.api_domain_name
    origin_id   = "api-gateway"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    target_origin_id       = "public-site-s3"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    cache_policy_id        = data.aws_cloudfront_cache_policy.caching_optimized.id

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.spa_rewrite.arn
    }
  }

  ordered_cache_behavior {
    path_pattern             = "/api/*"
    target_origin_id         = "api-gateway"
    viewer_protocol_policy   = "redirect-to-https"
    allowed_methods          = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods           = ["GET", "HEAD", "OPTIONS"]
    cache_policy_id          = data.aws_cloudfront_cache_policy.caching_disabled.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_viewer_except_host_header.id
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = var.enable_custom_domains ? false : true
    acm_certificate_arn            = var.enable_custom_domains ? var.public_cert_arn : null
    ssl_support_method             = var.enable_custom_domains ? "sni-only" : null
    minimum_protocol_version       = var.enable_custom_domains ? "TLSv1.2_2021" : null
  }
}

# --- Admin app distribution ------------------------------------------------
# Serves only the admin SPA from S3. The admin app calls the API cross-origin.

resource "aws_cloudfront_distribution" "admin_site" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${var.project} admin app"
  default_root_object = "index.html"
  price_class         = var.price_class
  http_version        = "http2and3"
  aliases             = var.enable_custom_domains ? [local.admin_alias] : []

  origin {
    domain_name              = aws_s3_bucket.admin_site.bucket_regional_domain_name
    origin_id                = "admin-site-s3"
    origin_access_control_id = aws_cloudfront_origin_access_control.admin_site.id
  }

  default_cache_behavior {
    target_origin_id       = "admin-site-s3"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    cache_policy_id        = data.aws_cloudfront_cache_policy.caching_optimized.id

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.spa_rewrite.arn
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = var.enable_custom_domains ? false : true
    acm_certificate_arn            = var.enable_custom_domains ? var.admin_cert_arn : null
    ssl_support_method             = var.enable_custom_domains ? "sni-only" : null
    minimum_protocol_version       = var.enable_custom_domains ? "TLSv1.2_2021" : null
  }
}

# --- Bucket policies: allow only the matching CloudFront distribution -------

data "aws_iam_policy_document" "public_site_bucket" {
  statement {
    sid    = "AllowCloudFrontServicePrincipalReadOnly"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.public_site.arn}/*"]

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.public_site.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "public_site" {
  bucket = aws_s3_bucket.public_site.id
  policy = data.aws_iam_policy_document.public_site_bucket.json

  depends_on = [aws_s3_bucket_public_access_block.public_site]
}

data "aws_iam_policy_document" "admin_site_bucket" {
  statement {
    sid    = "AllowCloudFrontServicePrincipalReadOnly"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.admin_site.arn}/*"]

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.admin_site.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "admin_site" {
  bucket = aws_s3_bucket.admin_site.id
  policy = data.aws_iam_policy_document.admin_site_bucket.json

  depends_on = [aws_s3_bucket_public_access_block.admin_site]
}
