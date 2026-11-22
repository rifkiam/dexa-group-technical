import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const bucket = process.env.S3_BUCKET ?? 'attendance-photos';
const s3 = new S3Client({
  endpoint: process.env.S3_PUBLIC_URL ?? 'http://localhost:9000/attendance-photos',
  region: process.env.S3_REGION ?? 'us-east-1', //placeholder for minio
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? 'admin',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? 'password',
  },
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
});

export async function uploadObject(
  key: string,
  body: Buffer | Uint8Array | string | File,
  contentType: string,
) {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );

  return key;
}

export function isStoredObjectKey(key: string) {
  const normalized = key.replace(/^\/+/, '');
  return normalized.startsWith(bucket);
}

export function getPublicObjectUrl(key: string) {
  if (!isStoredObjectKey(key)) {
    throw new Error('Invalid object key');
  }
  return `${process.env.S3_PUBLIC_URL ?? ''}/${key}`;
}
