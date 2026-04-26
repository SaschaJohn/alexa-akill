import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { EpisodeProgress } from '../types';

const TABLE_NAME = process.env.DYNAMODB_TABLE || 'HoerspielProgress';

const DYNAMODB_REGION = process.env.DYNAMODB_REGION || 'eu-central-1';

const client = new DynamoDBClient({ region: DYNAMODB_REGION });
const docClient = DynamoDBDocumentClient.from(client);

export async function getEpisodeProgress(userId: string, episodeId: string): Promise<EpisodeProgress | null> {
  const result = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { userId, episodeId },
  }));
  return (result.Item as EpisodeProgress) || null;
}

export async function getSeriesProgress(userId: string, seriesId: string): Promise<EpisodeProgress[]> {
  const result = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: 'SeriesIndex',
    KeyConditionExpression: 'userId = :uid AND begins_with(seriesEpisodeKey, :prefix)',
    ExpressionAttributeValues: {
      ':uid': userId,
      ':prefix': `${seriesId}#`,
    },
  }));
  return (result.Items as EpisodeProgress[]) || [];
}

export async function savePosition(userId: string, episodeId: string, seriesId: string, offsetMs: number): Promise<void> {
  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      userId,
      episodeId,
      seriesId,
      seriesEpisodeKey: `${seriesId}#${episodeId}`,
      status: 'playing',
      offsetMs,
      lastPlayed: new Date().toISOString(),
    },
  }));
}

export async function markPlayed(userId: string, episodeId: string, seriesId: string): Promise<void> {
  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      userId,
      episodeId,
      seriesId,
      seriesEpisodeKey: `${seriesId}#${episodeId}`,
      status: 'played',
      offsetMs: 0,
      lastPlayed: new Date().toISOString(),
    },
  }));
}

export async function markUnplayed(userId: string, episodeId: string, seriesId: string): Promise<void> {
  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      userId,
      episodeId,
      seriesId,
      seriesEpisodeKey: `${seriesId}#${episodeId}`,
      status: 'unplayed',
      offsetMs: 0,
      lastPlayed: new Date().toISOString(),
    },
  }));
}
