output "ws_connect_invoke_arn" {
  value = aws_lambda_function.ws_connect.invoke_arn
}

output "ws_disconnect_invoke_arn" {
  value = aws_lambda_function.ws_disconnect.invoke_arn
}

output "ws_default_invoke_arn" {
  value = aws_lambda_function.ws_default.invoke_arn
}

output "ws_connect_function_name" {
  value = aws_lambda_function.ws_connect.function_name
}

output "ws_disconnect_function_name" {
  value = aws_lambda_function.ws_disconnect.function_name
}

output "ws_default_function_name" {
  value = aws_lambda_function.ws_default.function_name
}