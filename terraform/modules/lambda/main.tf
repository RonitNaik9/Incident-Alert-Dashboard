# ─── IAM role shared by all Lambdas ──────────────────────────────────────────

resource "aws_iam_role" "lambda" {
  name = "${var.project_name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "lambda" {
  name = "${var.project_name}-lambda-policy"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = ["sns:Publish"]
        Resource = var.sns_topic_arn
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = var.sqs_queue_arn
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          var.incidents_table_arn,
          "${var.incidents_table_arn}/index/*",
          var.connections_table_arn
        ]
      },
      {
        Effect   = "Allow"
        Action   = ["execute-api:ManageConnections"]
        Resource = "${var.websocket_api_execution_arn}/*"
      }
    ]
  })
}

# ─── Zip each Lambda source directory ────────────────────────────────────────

data "archive_file" "simulator" {
  type        = "zip"
  source_dir  = "${path.root}/lambda_src/simulator"
  output_path = "${path.root}/.build/simulator.zip"
}

data "archive_file" "processor" {
  type        = "zip"
  source_dir  = "${path.root}/lambda_src/processor"
  output_path = "${path.root}/.build/processor.zip"
}

data "archive_file" "ws_connect" {
  type        = "zip"
  source_dir  = "${path.root}/lambda_src/ws_connect"
  output_path = "${path.root}/.build/ws_connect.zip"
}

data "archive_file" "ws_disconnect" {
  type        = "zip"
  source_dir  = "${path.root}/lambda_src/ws_disconnect"
  output_path = "${path.root}/.build/ws_disconnect.zip"
}

data "archive_file" "ws_default" {
  type        = "zip"
  source_dir  = "${path.root}/lambda_src/ws_default"
  output_path = "${path.root}/.build/ws_default.zip"
}

# ─── Lambda functions ────────────────────────────────────────────────────────

resource "aws_lambda_function" "simulator" {
  function_name    = "${var.project_name}-simulator"
  role             = aws_iam_role.lambda.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  timeout          = 30
  filename         = data.archive_file.simulator.output_path
  source_code_hash = data.archive_file.simulator.output_base64sha256

  environment {
    variables = {
      SNS_TOPIC_ARN = var.sns_topic_arn
    }
  }
}

resource "aws_lambda_function" "processor" {
  function_name    = "${var.project_name}-processor"
  role             = aws_iam_role.lambda.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  timeout          = 30
  filename         = data.archive_file.processor.output_path
  source_code_hash = data.archive_file.processor.output_base64sha256

  environment {
    variables = {
      INCIDENTS_TABLE    = var.incidents_table_name
      CONNECTIONS_TABLE  = var.connections_table_name
      WEBSOCKET_ENDPOINT = var.websocket_callback_url
    }
  }
}

resource "aws_lambda_function" "ws_connect" {
  function_name    = "${var.project_name}-ws-connect"
  role             = aws_iam_role.lambda.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  timeout          = 10
  filename         = data.archive_file.ws_connect.output_path
  source_code_hash = data.archive_file.ws_connect.output_base64sha256

  environment {
    variables = {
      CONNECTIONS_TABLE = var.connections_table_name
    }
  }
}

resource "aws_lambda_function" "ws_disconnect" {
  function_name    = "${var.project_name}-ws-disconnect"
  role             = aws_iam_role.lambda.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  timeout          = 10
  filename         = data.archive_file.ws_disconnect.output_path
  source_code_hash = data.archive_file.ws_disconnect.output_base64sha256

  environment {
    variables = {
      CONNECTIONS_TABLE = var.connections_table_name
    }
  }
}

resource "aws_lambda_function" "ws_default" {
  function_name    = "${var.project_name}-ws-default"
  role             = aws_iam_role.lambda.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  timeout          = 10
  filename         = data.archive_file.ws_default.output_path
  source_code_hash = data.archive_file.ws_default.output_base64sha256

  environment {
    variables = {
      INCIDENTS_TABLE    = var.incidents_table_name
      CONNECTIONS_TABLE  = var.connections_table_name
      WEBSOCKET_ENDPOINT = var.websocket_callback_url
    }
  }
}

# ─── CloudWatch schedule for the simulator ───────────────────────────────────

resource "aws_cloudwatch_event_rule" "simulator" {
  name                = "${var.project_name}-simulator-schedule"
  schedule_expression = var.simulator_interval
}

resource "aws_cloudwatch_event_target" "simulator" {
  rule = aws_cloudwatch_event_rule.simulator.name
  arn  = aws_lambda_function.simulator.arn
}

resource "aws_lambda_permission" "cloudwatch" {
  statement_id  = "AllowCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.simulator.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.simulator.arn
}

# ─── SQS trigger for the processor ──────────────────────────────────────────

resource "aws_lambda_event_source_mapping" "sqs_processor" {
  event_source_arn = var.sqs_queue_arn
  function_name    = aws_lambda_function.processor.arn
  batch_size       = 5
  enabled          = true
}