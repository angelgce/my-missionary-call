import api from '@/core/services/api';

export interface BlogPostListItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  readTime: string;
  publishedAt: string | null;
  images: string[];
}

export interface BlogPostDetail extends BlogPostListItem {
  content: string;
}

export const fetchPublicPosts = async (): Promise<BlogPostListItem[]> => {
  const { data } = await api.get<BlogPostListItem[]>('/blog/posts');
  return data;
};

export const fetchPublicPostBySlug = async (
  slug: string
): Promise<BlogPostDetail | null> => {
  try {
    const { data } = await api.get<BlogPostDetail>(`/blog/posts/${slug}`);
    return data;
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'response' in err &&
      (err as { response?: { status?: number } }).response?.status === 404
    ) {
      return null;
    }
    throw err;
  }
};

export const formatPostDate = (iso: string | null): string => {
  if (!iso) return '';
  const date = new Date(iso);
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};
