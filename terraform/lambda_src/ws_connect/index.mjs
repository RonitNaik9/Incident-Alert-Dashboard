import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.CONNECTIONS_TABLE;

export async function handler(event) {
  const connectionId = event.requestContext.connectionId;

  await ddb.send(new PutCommand({
    TableName: TABLE,
    Item: {
      connectionId,
      connectedAt: new Date().toISOString(),
    },
  }));

  console.log(`Connected: ${connectionId}`);
  return { statusCode: 200, body: "Connected" };
}