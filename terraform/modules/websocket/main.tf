resource "aws_apigatewayv2_api" "ws" {
  name                       = "${var.project_name}-ws"
  protocol_type              = "WEBSOCKET"
  route_selection_expression = "$request.body.action"
}

# ─── Integrations ────────────────────────────────────────────────────────────

resource "aws_apigatewayv2_integration" "connect" {
  api_id             = aws_apigatewayv2_api.ws.id
  integration_type   = "AWS_PROXY"
  integration_uri    = var.ws_connect_invoke_arn
  integration_method = "POST"
}

resource "aws_apigatewayv2_integration" "disconnect" {
  api_id             = aws_apigatewayv2_api.ws.id
  integration_type   = "AWS_PROXY"
  integration_uri    = var.ws_disconnect_invoke_arn
  integration_method = "POST"
}

resource "aws_apigatewayv2_integration" "default" {
  api_id             = aws_apigatewayv2_api.ws.id
  integration_type   = "AWS_PROXY"
  integration_uri    = var.ws_default_invoke_arn
  integration_method = "POST"
}

# ─── Routes ──────────────────────────────────────────────────────────────────

resource "aws_apigatewayv2_route" "connect" {
  api_id    = aws_apigatewayv2_api.ws.id
  route_key = "$connect"
  target    = "integrations/${aws_apigatewayv2_integration.connect.id}"
}

resource "aws_apigatewayv2_route" "disconnect" {
  api_id    = aws_apigatewayv2_api.ws.id
  route_key = "$disconnect"
  target    = "integrations/${aws_apigatewayv2_integration.disconnect.id}"
}

resource "aws_apigatewayv2_route" "default" {
  api_id    = aws_apigatewayv2_api.ws.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.default.id}"
}

# ─── Stage ───────────────────────────────────────────────────────────────────

resource "aws_apigatewayv2_stage" "prod" {
  api_id      = aws_apigatewayv2_api.ws.id
  name        = "prod"
  auto_deploy = true
}

# ─── Lambda permissions for API Gateway ──────────────────────────────────────

resource "aws_lambda_permission" "ws_connect" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = var.ws_connect_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.ws.execution_arn}/*/*"
}

resource "aws_lambda_permission" "ws_disconnect" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = var.ws_disconnect_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.ws.execution_arn}/*/*"
}

resource "aws_lambda_permission" "ws_default" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = var.ws_default_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.ws.execution_arn}/*/*"
}