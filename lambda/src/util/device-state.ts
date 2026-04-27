import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { DeviceState } from '../types';

const TABLE_NAME = process.env.DEVICE_STATE_TABLE || 'HoerspielDeviceState';
const DYNAMODB_REGION = process.env.DYNAMODB_REGION || 'eu-central-1';

const client = new DynamoDBClient({ region: DYNAMODB_REGION });
const docClient = DynamoDBDocumentClient.from(client);

export async function getDeviceState(userId: string, deviceId: string): Promise<DeviceState | null> {
  const result = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { userId, deviceId },
  }));
  return (result.Item as DeviceState) || null;
}

export async function saveDeviceState(
  userId: string,
  deviceId: string,
  episodeId: string,
  seriesId: string,
  offsetMs: number
): Promise<void> {
  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      userId,
      deviceId,
      episodeId,
      seriesId,
      offsetMs,
      lastActive: new Date().toISOString(),
    },
  }));
}
