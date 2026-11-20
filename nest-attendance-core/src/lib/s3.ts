import {
    PutObjectCommand,
    S3Client,
} from "@aws-sdk/client-s3";

const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === 'true';

export const s3 = new S3Client({
    endpoint: process.env.S3_ENDPOINT ?? '',
    region: process.env.S3_REGION ?? '',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
    },
    forcePathStyle: forcePathStyle,
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
});

export async function uploadObject(
    key: string,
    body: Buffer | Uint8Array | string | File,
    contentType: string,
) {
    await s3.send(
        new PutObjectCommand({
            Bucket: process.env.S3_BUCKET ?? '',
            Key: key,
            Body: body,
            ContentType: contentType,
        }),
    );
  
    return key;
}

export function isStoredObjectKey(key: string) {
    const normalized = key.replace(/^\/+/, "");
    if (normalized.startsWith(process.env.S3_BUCKET ?? '')) {
        return true;
    }
    return false;
}

export function getPublicObjectUrl(key: string) {
    if (!isStoredObjectKey(key)) {
      throw new Error("Invalid object key");
    }
    return `${process.env.S3_PUBLIC_URL ?? ''}/${key}`;
  }
  