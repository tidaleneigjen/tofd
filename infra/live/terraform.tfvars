# Interim deployment domain: tofd.graycandle.org, served from the EXISTING
# graycandle.org Route 53 hosted zone (same AWS account, already
# authoritative, verified to have no tofd.* records).
#
# IMPORTANT — shared zone safety: the graycandle.org zone is managed OUTSIDE
# this repo. This configuration only ADDS records under tofd.* (the A/AAAA
# aliases and the ACM validation CNAMEs) and must never create or destroy
# that zone. create_hosted_zone = false keeps aws_route53_zone out of the
# plan graph entirely — Terraform has no zone resource to touch.
#
# enable_custom_domains = true is safe here because the graycandle.org zone
# is already publicly authoritative, so ACM DNS validation completes
# normally. (It must stay false for a brand-new zone until the registrar NS
# cutover — see variable description.)
#
# Phase 4 cutover to the real domain is a TFVARS-ONLY change, made AFTER the
# registrar NS records for templeofthefemininedivine.org point at its new
# hosted zone:
#   zone_name               = "templeofthefemininedivine.org"
#   public_hostname         = "www.templeofthefemininedivine.org"
#   admin_hostname          = "admin.templeofthefemininedivine.org"
#   create_hosted_zone      = true    # or false + existing_hosted_zone_id
#                                      # if the zone already exists
#   existing_hosted_zone_id = ""
# No code changes are needed for the swap.

zone_name               = "graycandle.org"
public_hostname         = "tofd.graycandle.org"
admin_hostname          = "admin.tofd.graycandle.org"
create_hosted_zone      = false
existing_hosted_zone_id = "Z15A3OOMLRD544"
enable_custom_domains   = true
