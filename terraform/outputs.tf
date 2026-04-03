output "s3_bucket_name" {
  description = "pfsrd2-display S3 bucket name"
  value       = aws_s3_bucket.site.id
}

output "s3_bucket_arn" {
  description = "pfsrd2-display S3 bucket ARN"
  value       = aws_s3_bucket.site.arn
}

output "s3_bucket_regional_domain" {
  description = "pfsrd2-display S3 bucket regional domain (used as CloudFront origin)"
  value       = aws_s3_bucket.site.bucket_regional_domain_name
}

output "active_sha" {
  description = "Git SHA of the currently deployed site build"
  value       = var.active_sha
}
