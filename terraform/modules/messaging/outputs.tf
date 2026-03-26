output "sns_topic_arn" {
  value = aws_sns_topic.alerts.arn
}

output "sqs_queue_arn" {
  value = aws_sqs_queue.alerts.arn
}

output "sqs_queue_url" {
  value = aws_sqs_queue.alerts.url
}