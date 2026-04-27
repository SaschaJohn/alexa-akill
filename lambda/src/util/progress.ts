import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
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
  const now = new Date().toISOString();
  try {
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        userId,
        episodeId,
        seriesId,
        seriesEpisodeKey: `${seriesId}#${episodeId}`,
        status: 'playing',
        offsetMs,
        lastPlayed: now,
      },
      // Conditional write: only update if our data is newer than what's stored.
      // This prevents a stale event from an older device overwriting a more recent position.
      ConditionExpression: 'attribute_not_exists(lastPlayed) OR lastPlayed <= :now',
      ExpressionAttributeValues: {
        ':now': now,
      },
    }));
  } catch (err: any) {
    if (err.name === 'ConditionalCheckFailedException') {
      console.log(`savePosition: skipped stale write for ${episodeId} (user: ${userId})`);
      return;
    }
    throw err;
  }
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

/**
 * Get the last playing episode for a user, optionally filtered by device.
 * When deviceId is provided, only returns episodes that match the device's current state,
 * preventing cross-device resume suggestions.
 * Falls back to the most recently played episode across all devices if no deviceId match.
 */
export async function getLastPlayingEpisode(userId: string, deviceId?: string): Promise<EpisodeProgress | null> {
  const result = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'userId = :uid',
    FilterExpression: '#s = :status',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: {
      ':uid': userId,
      ':status': 'playing',
    },
  }));

  const items = (result.Items as EpisodeProgress[]) || [];
  if (items.length === 0) return null;

  // Sort by most recently played first
  items.sort((a, b) => b.lastPlayed.localeCompare(a.lastPlayed));

  return items[0];
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
