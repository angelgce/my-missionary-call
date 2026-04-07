import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import {
  BlogRepository,
  CreatePostData,
  UpdatePostData,
} from './blog.repository';

export interface R2Config {
  endpoint: string;
  bucketName: string;
  accessKeyId: string;
  secretAccessKey: string;
}

const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24; // 24h

export class BlogService {
  private s3: S3Client;

  constructor(private repo: BlogRepository, private r2: R2Config) {
    this.s3 = new S3Client({
      region: 'auto',
      endpoint: r2.endpoint,
      credentials: {
        accessKeyId: r2.accessKeyId,
        secretAccessKey: r2.secretAccessKey,
      },
    });
  }

  private slugify(input: string): string {
    return input
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 80);
  }

  private async signKey(key: string): Promise<string> {
    if (!key) return '';
    const command = new GetObjectCommand({
      Bucket: this.r2.bucketName,
      Key: key,
    });
    return getSignedUrl(this.s3, command, { expiresIn: SIGNED_URL_TTL_SECONDS });
  }

  async createPost(input: CreatePostData) {
    const slug = input.slug?.trim() || this.slugify(input.title);
    return this.repo.create({ ...input, slug });
  }

  async updatePost(id: string, input: UpdatePostData) {
    const data: UpdatePostData = { ...input };
    if (input.slug !== undefined) {
      data.slug = input.slug.trim() || this.slugify(input.title || '');
    }
    return this.repo.update(id, data);
  }

  async deletePost(id: string) {
    return this.repo.deleteById(id);
  }

  async listPublic() {
    const posts = await this.repo.findAllPublished();
    return Promise.all(
      posts.map(async (p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        author: p.author,
        readTime: p.readTime,
        publishedAt: p.publishedAt,
        coverImageUrl: await this.signKey(p.coverImageKey),
      }))
    );
  }

  async listAdmin() {
    const posts = await this.repo.findAllAdmin();
    return Promise.all(
      posts.map(async (p) => ({
        ...p,
        coverImageUrl: await this.signKey(p.coverImageKey),
      }))
    );
  }

  async getPublicBySlug(slug: string) {
    const post = await this.repo.findPublishedBySlug(slug);
    if (!post) return null;
    const images = await this.repo.findImagesByPostId(post.id);
    const gallery = await Promise.all(
      images.map(async (img) => ({
        id: img.id,
        url: await this.signKey(img.imageKey),
      }))
    );
    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      author: post.author,
      readTime: post.readTime,
      publishedAt: post.publishedAt,
      coverImageUrl: await this.signKey(post.coverImageKey),
      gallery,
    };
  }

  async getAdminById(id: string) {
    const post = await this.repo.findById(id);
    if (!post) return null;
    const images = await this.repo.findImagesByPostId(post.id);
    const gallery = await Promise.all(
      images.map(async (img) => ({
        id: img.id,
        imageKey: img.imageKey,
        url: await this.signKey(img.imageKey),
      }))
    );
    return {
      ...post,
      coverImageUrl: await this.signKey(post.coverImageKey),
      gallery,
    };
  }

  async addImageToPost(postId: string, imageKey: string, sortOrder: number) {
    return this.repo.addImage(postId, imageKey, sortOrder);
  }

  async removeImage(imageId: string) {
    return this.repo.deleteImageById(imageId);
  }

  buildImageKey(postId: string, filename: string): string {
    const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `alexa/assets/mission/${postId}/${Date.now()}_${safe}`;
  }
}
