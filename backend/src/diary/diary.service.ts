import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { DiaryRepository } from './diary.repository';

export interface R2Config {
  endpoint: string;
  bucketName: string;
  accessKeyId: string;
  secretAccessKey: string;
}

const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24; // 24h

export class DiaryService {
  private s3: S3Client;

  constructor(private repo: DiaryRepository, private r2: R2Config) {
    this.s3 = new S3Client({
      region: 'auto',
      endpoint: r2.endpoint,
      credentials: {
        accessKeyId: r2.accessKeyId,
        secretAccessKey: r2.secretAccessKey,
      },
    });
  }

  private async signKey(key: string): Promise<string> {
    if (!key) return '';
    const command = new GetObjectCommand({
      Bucket: this.r2.bucketName,
      Key: key,
    });
    return getSignedUrl(this.s3, command, { expiresIn: SIGNED_URL_TTL_SECONDS });
  }

  buildImageKey(entryId: string, filename: string): string {
    const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `alexa/assets/diary/${entryId}/${Date.now()}_${safe}`;
  }

  async createEntry(content: string) {
    return this.repo.create(content);
  }

  async updateEntry(id: string, content: string) {
    return this.repo.update(id, content);
  }

  async deleteEntry(id: string) {
    return this.repo.deleteById(id);
  }

  async getEntryWithImages(id: string) {
    const entry = await this.repo.findById(id);
    if (!entry) return null;
    const images = await this.repo.findImagesByEntryId(id);
    const gallery = await Promise.all(
      images.map(async (img) => ({
        id: img.id,
        url: await this.signKey(img.imageKey),
      }))
    );
    return { ...entry, gallery };
  }

  async listAll() {
    const entries = await this.repo.findAll();
    return Promise.all(
      entries.map(async (e) => {
        const images = await this.repo.findImagesByEntryId(e.id);
        const imageUrls = await Promise.all(
          images.map((img) => this.signKey(img.imageKey))
        );
        return { ...e, images: imageUrls };
      })
    );
  }

  async addImage(entryId: string, imageKey: string, sortOrder: number) {
    return this.repo.addImage(entryId, imageKey, sortOrder);
  }

  async removeImage(imageId: string) {
    return this.repo.deleteImageById(imageId);
  }
}
