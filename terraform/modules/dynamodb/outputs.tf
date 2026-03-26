output "incidents_table_name" {
  value = aws_dynamodb_table.incidents.name
}

output "incidents_table_arn" {
  value = aws_dynamodb_table.incidents.arn
}

output "connections_table_name" {
  value = aws_dynamodb_table.connections.name
}

output "connections_table_arn" {
  value = aws_dynamodb_table.connections.arn
}