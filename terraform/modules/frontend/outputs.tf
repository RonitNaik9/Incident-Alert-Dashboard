output "bucket_name" {
  value = aws_s3_bucket.frontend.id
}

output "website_url" {
  value = "http://${aws_s3_bucket_website_configuration.frontend.website_endpoint}"
}

output "cloudfront_url" {
  value = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.frontend.id
}