output "websocket_url" {
  value = aws_apigatewayv2_stage.prod.invoke_url
}

output "websocket_callback_url" {
  description = "HTTPS endpoint for postToConnection calls"
  value       = "https://${aws_apigatewayv2_api.ws.id}.execute-api.${data.aws_region.current.name}.amazonaws.com/${aws_apigatewayv2_stage.prod.name}"
}

output "execution_arn" {
  value = aws_apigatewayv2_api.ws.execution_arn
}

data "aws_region" "current" {}