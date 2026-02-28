import { Hono } from 'hono';
import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import type { Env } from '../worker';

export const assetsRoutes = new Hono<{ Bindings: Env }>()
  .get('/signed-url/*', async (c) => {
    const key = decodeURIComponent(c.req.path.replace('/api/assets/signed-url/', ''));
    if (!key) {
      return c.json({ error: 'Missing file key' }, 400);
    }

    const client = new S3Client({
      region: 'auto',
      endpoint: c.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: c.env.R2_ACCESS_KEY_ID,
        secretAccessKey: c.env.R2_SECRET_ACCESS_KEY,
      },
    });

    const command = new GetObjectCommand({
      Bucket: c.env.R2_BUCKET_NAME,
      Key: key,
    });

    const signedUrl = await getSignedUrl(client, command, { expiresIn: 3600 });

    return c.json({ url: signedUrl });
  })
  .get('/list/*', async (c) => {
    const prefix = decodeURIComponent(c.req.path.replace('/api/assets/list/', ''));
    if (!prefix) {
      return c.json({ error: 'Missing directory prefix' }, 400);
    }

    const client = new S3Client({
      region: 'auto',
      endpoint: c.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: c.env.R2_ACCESS_KEY_ID,
        secretAccessKey: c.env.R2_SECRET_ACCESS_KEY,
      },
    });

    const command = new ListObjectsV2Command({
      Bucket: c.env.R2_BUCKET_NAME,
      Prefix: prefix,
    });

    const presignedUrl = await getSignedUrl(client, command, { expiresIn: 60 });
    const response = await fetch(presignedUrl);
    const xml = await response.text();

    const keys: string[] = [];
    const keyRegex = /<Key>([^<]+)<\/Key>/g;
    let match;
    while ((match = keyRegex.exec(xml)) !== null) {
      if (!match[1].endsWith('/')) keys.push(match[1]);
    }

    return c.json({ keys });
  });
