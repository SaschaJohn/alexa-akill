import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const REGION = 'eu-central-1';
const PROGRESS_TABLE = 'HoerspielProgress';
const DEVICE_STATE_TABLE = 'HoerspielDeviceState';

const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);

export async function scanProgress(): Promise<Record<string, unknown>[]> {
  const result = await docClient.send(new ScanCommand({ TableName: PROGRESS_TABLE }));
  return (result.Items ?? []) as Record<string, unknown>[];
}

export async function scanDeviceState(): Promise<Record<string, unknown>[]> {
  const result = await docClient.send(new ScanCommand({ TableName: DEVICE_STATE_TABLE }));
  return (result.Items ?? []) as Record<string, unknown>[];
}
