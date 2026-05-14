import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import * as fs from 'fs';

export const BUCKET = 'hoerspiel-skill-media';
export const REGION = 'eu-central-1';
export const S3_BASE_URL = `https://${BUCKET}.s3.${REGION}.amazonaws.com`;
export const S3_CATALOG_KEY = 'catalog/series.json';

export const s3 = new S3Client({ region: REGION });

export async function listAllObjects(): Promise<string[]> {
  const keys: string[] = [];
  let continuationToken: string | undefined;

  do {
    const response = await s3.send(new ListObjectsV2Command({
      Bucket: BUCKET,
      ContinuationToken: continuationToken,
    }));

    for (const obj of response.Contents ?? []) {
      if (obj.Key) keys.push(obj.Key);
    }

    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  return keys;
}

export async function uploadBuffer(key: string, body: Buffer, contentType: string): Promise<void> {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));
}

export async function uploadStream(key: string, filePath: string, contentType: string): Promise<void> {
  const stream = fs.createReadStream(filePath);
  const upload = new Upload({
    client: s3,
    params: {
      Bucket: BUCKET,
      Key: key,
      Body: stream,
      ContentType: contentType,
    },
    queueSize: 4,
    partSize: 5 * 1024 * 1024,
  });
  await upload.done();
}

export async function uploadCatalogToS3(catalogJson: string): Promise<void> {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: S3_CATALOG_KEY,
    Body: catalogJson,
    ContentType: 'application/json',
  }));
}
