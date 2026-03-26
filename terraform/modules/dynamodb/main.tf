resource "aws_dynamodb_table" "incidents" {
  name         = "${var.project_name}-incidents"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "incidentId"
  range_key    = "timestamp"

  attribute {
    name = "incidentId"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  global_secondary_index {
    name            = "status-index"
    hash_key        = "status"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  tags = { Name = "${var.project_name}-incidents" }
}

resource "aws_dynamodb_table" "connections" {
  name         = "${var.project_name}-connections"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "connectionId"

  attribute {
    name = "connectionId"
    type = "S"
  }

  tags = { Name = "${var.project_name}-connections" }
}