import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'node:stream';

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

function getR2Client() {
  const accountId = requiredEnv('R2_ACCOUNT_ID');
  const accessKeyId = requiredEnv('R2_ACCESS_KEY_ID');
  const secretAccessKey = requiredEnv('R2_SECRET_ACCESS_KEY');
  const endpoint = process.env.R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`;

  return new S3Client({
    region: 'auto',
    endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

async function bodyToBuffer(body: unknown): Promise<Buffer> {
  if (!body) return Buffer.from([]);

  if (Buffer.isBuffer(body)) return body;

  if (body instanceof Uint8Array) return Buffer.from(body);

  const maybeReadable = body as { transformToByteArray?: () => Promise<Uint8Array> };
  if (typeof maybeReadable.transformToByteArray === 'function') {
    const bytes = await maybeReadable.transformToByteArray();
    return Buffer.from(bytes);
  }

  if (body instanceof Readable) {
    const chunks: Buffer[] = [];
    for await (const chunk of body) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  throw new Error('Unsupported response body type');
}

export const storage = {
  savePackage: async (agentId: string, version: string, zipBuffer: Buffer) => {
    const client = getR2Client();
    const bucket = requiredEnv('R2_BUCKET');
    const storagePath = `agents/${agentId}/${version}/package.zip`;

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: storagePath,
        Body: zipBuffer,
        ContentType: 'application/zip',
      })
    );

    return storagePath;
  },

  getPackage: async (storagePath: string) => {
    const client = getR2Client();
    const bucket = requiredEnv('R2_BUCKET');

    const res = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: storagePath,
      })
    );

    return bodyToBuffer(res.Body);
  },

  deletePackage: async (storagePath: string) => {
    const client = getR2Client();
    const bucket = requiredEnv('R2_BUCKET');

    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: storagePath,
      })
    );
  },

  getPresignedDownloadUrl: async (storagePath: string, expiresInSeconds = 600) => {
    const client = getR2Client();
    const bucket = requiredEnv('R2_BUCKET');

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: storagePath,
      ResponseContentDisposition: 'attachment; filename="package.zip"',
    });

    return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  },
};
