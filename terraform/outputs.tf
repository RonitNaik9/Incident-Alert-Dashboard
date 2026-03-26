output "websocket_url" {
  description = "WebSocket URL for the dashboard to connect to"
  value       = module.websocket.websocket_url
}

output "websocket_callback_url" {
  description = "HTTPS callback URL for Lambda to push messages"
  value       = module.websocket.websocket_callback_url
}

output "incidents_table" {
  value = module.dynamodb.incidents_table_name
}

output "frontend_bucket" {
  value = module.frontend.bucket_name
}

output "frontend_url" {
  description = "CloudFront URL - share this with anyone"
  value       = module.frontend.cloudfront_url
}