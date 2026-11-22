const S3_PUBLIC_URL = import.meta.env.VITE_S3_PUBLIC_URL ?? 'http://localhost:9000';
const S3_BUCKET = import.meta.env.VITE_S3_BUCKET ?? 'attendance-photos';

export function getPublicS3ObjectUrl(key: string): string {
  const baseUrl = S3_PUBLIC_URL.replace(/\/+$/, '');
  const bucketUrl = baseUrl.endsWith(`/${S3_BUCKET}`) ? baseUrl : `${baseUrl}/${S3_BUCKET}`;
  const encodedKey = key.replace(/^\/+/, '').split('/').map(encodeURIComponent).join('/');

  return `${bucketUrl}/${encodedKey}`;
}
