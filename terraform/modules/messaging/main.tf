resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-alerts"
  tags = { Name = "${var.project_name}-alerts" }
}

resource "aws_sqs_queue" "alerts_dlq" {
  name                      = "${var.project_name}-alerts-dlq"
  message_retention_seconds = 1209600 # 14 days
}

resource "aws_sqs_queue" "alerts" {
  name                       = "${var.project_name}-alerts"
  visibility_timeout_seconds = 60
  message_retention_seconds  = 86400 # 1 day

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.alerts_dlq.arn
    maxReceiveCount     = 3
  })

  tags = { Name = "${var.project_name}-alerts" }
}

resource "aws_sqs_queue_policy" "allow_sns" {
  queue_url = aws_sqs_queue.alerts.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "sns.amazonaws.com" }
      Action    = "sqs:SendMessage"
      Resource  = aws_sqs_queue.alerts.arn
      Condition = {
        ArnEquals = { "aws:SourceArn" = aws_sns_topic.alerts.arn }
      }
    }]
  })
}

resource "aws_sns_topic_subscription" "sqs" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.alerts.arn
}