import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand, ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const INCIDENTS_TABLE = process.env.INCIDENTS_TABLE;
const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE;
const WS_ENDPOINT = process.env.WEBSOCKET_ENDPOINT;

async function broadcast(payload, excludeConnectionId) {
  const apigw = new ApiGatewayManagementApiClient({ endpoint: WS_ENDPOINT });
  const { Items: connections } = await ddb.send(new ScanCommand({
    TableName: CONNECTIONS_TABLE,
  }));

  if (!connections) return;
  const data = Buffer.from(JSON.stringify(payload));

  const sends = connections
    .filter(c => c.connectionId !== excludeConnectionId)
    .map(async ({ connectionId }) => {
      try {
        await apigw.send(new PostToConnectionCommand({
          ConnectionId: connectionId,
          Data: data,
        }));
      } catch (err) {
        if (err.statusCode === 410) {
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
  const connectionId = event.requestContext.connectionId;
  let body;

  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  const { action, incidentId, timestamp } = body;

  if (!action || !incidentId || !timestamp) {
    return { statusCode: 400, body: "Missing action, incidentId, or timestamp" };
  }

  const now = new Date().toISOString();
  let updateExpr, exprValues, broadcastType;

  switch (action) {
    case "acknowledge":
      updateExpr = "SET #s = :s, acknowledgedAt = :at";
      exprValues = { ":s": "acknowledged", ":at": now };
      broadcastType = "INCIDENT_ACKNOWLEDGED";
      break;

    case "escalate":
      updateExpr = "SET severity = :sev";
      exprValues = { ":sev": "critical" };
      broadcastType = "INCIDENT_ESCALATED";
      break;

    case "resolve":
      updateExpr = "SET #s = :s, resolvedAt = :at";
      exprValues = { ":s": "resolved", ":at": now };
      broadcastType = "INCIDENT_RESOLVED";
      break;

    default:
      return { statusCode: 400, body: `Unknown action: ${action}` };
  }

  const params = {
    TableName: INCIDENTS_TABLE,
    Key: { incidentId, timestamp },
    UpdateExpression: updateExpr,
    ExpressionAttributeValues: exprValues,
    ReturnValues: "ALL_NEW",
  };

  // "status" is a reserved word in DynamoDB
  if (updateExpr.includes("#s")) {
    params.ExpressionAttributeNames = { "#s": "status" };
  }

  const { Attributes: updated } = await ddb.send(new UpdateCommand(params));

  // broadcast the update to all other connected clients
  await broadcast({ type: broadcastType, incident: updated }, null);

  // also send confirmation back to the acting client
  const apigw = new ApiGatewayManagementApiClient({ endpoint: WS_ENDPOINT });
  await apigw.send(new PostToConnectionCommand({
    ConnectionId: connectionId,
    Data: Buffer.from(JSON.stringify({ type: broadcastType, incident: updated })),
  }));

  console.log(`${action} on ${incidentId} by ${connectionId}`);
  return { statusCode: 200 };
}