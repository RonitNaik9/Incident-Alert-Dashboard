module "networking" {
  source       = "./modules/networking"
  project_name = var.project_name
  vpc_cidr     = var.vpc_cidr
}

module "dynamodb" {
  source       = "./modules/dynamodb"
  project_name = var.project_name
}

module "messaging" {
  source       = "./modules/messaging"
  project_name = var.project_name
}

# WebSocket API is created first (just the shell + stage)
# Lambda module creates the functions and wires integrations via the websocket module
module "websocket" {
  source       = "./modules/websocket"
  project_name = var.project_name

  ws_connect_invoke_arn    = module.lambda.ws_connect_invoke_arn
  ws_disconnect_invoke_arn = module.lambda.ws_disconnect_invoke_arn
  ws_default_invoke_arn    = module.lambda.ws_default_invoke_arn

  ws_connect_function_name    = module.lambda.ws_connect_function_name
  ws_disconnect_function_name = module.lambda.ws_disconnect_function_name
  ws_default_function_name    = module.lambda.ws_default_function_name
}

module "frontend" {
  source       = "./modules/frontend"
  project_name = var.project_name
}

module "lambda" {
  source       = "./modules/lambda"
  project_name = var.project_name

  sns_topic_arn       = module.messaging.sns_topic_arn
  sqs_queue_arn       = module.messaging.sqs_queue_arn
  simulator_interval  = var.simulator_interval

  incidents_table_name = module.dynamodb.incidents_table_name
  incidents_table_arn  = module.dynamodb.incidents_table_arn
  connections_table_name = module.dynamodb.connections_table_name
  connections_table_arn  = module.dynamodb.connections_table_arn

  websocket_api_execution_arn = module.websocket.execution_arn
  websocket_callback_url      = module.websocket.websocket_callback_url
}