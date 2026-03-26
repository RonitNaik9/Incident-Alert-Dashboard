import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { ApiGatewayManagementApiClient, PostToConnectionCommand, DeleteConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";
import { randomUUID } from "crypto";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const INCIDENTS_TABLE = process.env.INCIDENTS_TABLE;
const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE;
const WS_ENDPOINT = process.env.WEBSOCKET_ENDPOINT;

const SEVERITY_RULES = {
  cpu_spike:          (v) => v >= 95 ? "critical" : v >= 90 ? "warning" : "info",
  memory_leak:        (v) => v >= 95 ? "critical" : v >= 92 ? "warning" : "info",
  high_error_rate:    (v) => v >= 20 ? "critical" : v >= 10 ? "warning" : "info",
  latency_spike:      (v) => v >= 3000 ? "critical" : v >= 1500 ? "warning" : "info",
  health_check_fail:  (v) => v >= 5 ? "critical" : v >= 3 ? "warning" : "info",
  disk_usage_high:    (v) => v >= 95 ? "critical" : v >= 90 ? "warning" : "info",
  connection_pool_exhausted: (v) => v >= 98 ? "critical" : "warning",
};

function scoreSeverity(eventType, value) {
  const rule = SEVERITY_RULES[eventType];
  return rule ? rule(value) : "info";
}

function buildMessage(event, severity) {
  const msgs = {
    cpu_spike: `CPU at ${event.value}% on ${event.service}`,
    memory_leak: `Memory at ${event.value}% on ${event.service}`,
    high_error_rate: `Error rate ${event.value}% on ${event.service}`,
    latency_spike: `p99 latency ${event.value}ms on ${event.service}`,
    health_check_fail: `${event.value} consecutive health check failures on ${event.service}`,
    disk_usage_high: `Disk usage at ${event.value}% on ${event.service}`,
    connection_pool_exhausted: `Connection pool at ${event.value}% on ${event.service}`,
  };
  return msgs[event.eventType] || `${event.eventType} on ${event.service}: ${event.value}${event.unit}`;
}

async function broadcast(payload) {
  const apigw = new ApiGatewayManagementApiClient({ endpoint: WS_ENDPOINT });
  const { Items: connections } = await ddb.send(new ScanCommand({
    TableName: CONNECTIONS_TABLE,
  }));

  if (!connections || connections.length === 0) return;

  const data = Buffer.from(JSON.stringify(payload));

  const sends = connections.map(async ({ connectionId }) => {
    try {
      await apigw.send(new PostToConnectionCommand({
        ConnectionId: connectionId,
        Data: data,
      }));
    } catch (err) {
      if (err.statusCode === 410) {
        // stale connection, clean up
        await ddb.send(new DeleteCommand({
          TableName: CONNECTIONS_TABLE,
          Key: { connectionId },
        }));
      }
    }
  });

  await Promise.allSettled(sends);
}

export async function handler(event) {
  for (const record of event.Records) {
    let body;
    try {
      // SQS wraps the SNS message
      const sqsBody = JSON.parse(record.body);
      body = JSON.parse(sqsBody.Message);
    } catch (err) {
      console.error("Failed to parse record:", err);
      continue;
    }

    const severity = scoreSeverity(body.eventType, body.value);
    const now = new Date().toISOString();
    const incident = {
      incidentId: randomUUID(),
      timestamp: now,
      service: body.service,
      eventType: body.eventType,
      metric: body.metric,
      value: body.value,
      unit: body.unit || "",
      severity,
      status: "open",
      message: buildMessage(body, severity),
      assignee: null,
      acknowledgedAt: null,
      resolvedAt: null,
    };

    await ddb.send(new PutCommand({
      TableName: INCIDENTS_TABLE,
      Item: incident,
    }));

    await broadcast({ type: "NEW_INCIDENT", incident });

    console.log(`Processed incident ${incident.incidentId} [${severity}]`);
  }

  return { statusCode: 200 };
}