import { useEffect, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';

import PageContainer from '@/shared/components/PageContainer';
import DecorativeDivider from '@/shared/components/DecorativeDivider';

import {
  fetchPublicPostBySlug,
  formatPostDate,
  BlogPostDetail,
} from '@/modules/blog/blogService';

function BlogDetailPage() {
  // 1. Local state
  const [post, setPost] = useState<BlogPostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // 3. Custom hooks
  const { slug } = useParams<{ slug: string }>();

  // 5. Effects
  useEffect(() => {
    if (!slug) return;
    let active = true;
    setLoading(true);
    fetchPublicPostBySlug(slug)
      .then((data) => {
        if (!active) return;
        if (!data) setNotFound(true);
        else setPost(data);
      })
      .catch(() => {
        if (active) setNotFound(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  if (notFound) {
    return <Navigate to="/blog" replace />;
  }

  // 8. Main render
  return (
    <PageContainer>
      <Link
        to="/blog"
        className="inline-flex items-center gap-1.5 rounded-full border border-gold/20 bg-blush/30 px-4 py-2 text-[11px] font-medium text-gold transition-all hover:border-gold/40 hover:bg-blush/50"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Todas las historias
      </Link>

      {loading && (
        <div className="mt-16 flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold/20 border-t-gold" />
          <p className="text-xs text-slate/60">Cargando carta...</p>
        </div>
      )}

      {!loading && post && (
        <article className="mt-6 animate-fade-in">
          <div className="text-center">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-gold tablet:text-sm tablet:tracking-[0.3em]">
              {formatPostDate(post.publishedAt)} · {post.readTime} de lectura
            </p>
            <h1 className="mt-4 font-serif text-3xl font-bold leading-tight text-navy tablet:text-5xl desktop:text-6xl">
              {post.title}
            </h1>
            <DecorativeDivider className="my-6 tablet:my-8" />
            <p className="font-cursive text-lg text-gold tablet:text-2xl">
              por {post.author}
            </p>
          </div>

          {post.coverImageUrl && (
            <div className="mt-8 overflow-hidden rounded-2xl border border-gold/15 shadow-lg tablet:mt-10">
              <img
                src={post.coverImageUrl}
                alt={post.title}
                className="aspect-[16/9] w-full object-cover"
              />
            </div>
          )}

          <div className="mx-auto mt-10 max-w-2xl space-y-5 text-base leading-relaxed text-slate tablet:mt-14 tablet:text-lg">
            {post.content.split('\n\n').map((paragraph, idx) => (
              <p
                key={idx}
                className="first-letter:font-serif first-letter:text-2xl first-letter:font-bold first-letter:text-gold tablet:first-letter:text-3xl"
              >
                {paragraph}
              </p>
            ))}
          </div>

          {post.gallery.length > 0 && (
            <div className="mt-12 tablet:mt-16">
              <DecorativeDivider className="mb-6" />
              <p className="text-center text-[10px] font-medium uppercase tracking-[0.25em] text-gold/80">
                Galería
              </p>
              <div className="mt-6 grid grid-cols-1 gap-4 tablet:grid-cols-2">
                {post.gallery.map((img) => (
                  <div
                    key={img.id}
                    className="overflow-hidden rounded-xl border border-gold/15 shadow-sm"
                  >
                    <img
                      src={img.url}
                      alt={post.title}
                      loading="lazy"
                      className="aspect-[4/3] w-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-14 flex flex-col items-center gap-4 border-t border-gold/15 pt-10 text-center">
            <p className="font-cursive text-2xl text-gold">
              Con amor, {post.author}
            </p>
            <Link
              to="/blog"
              className="rounded-full border border-gold/30 bg-blush/40 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-gold transition-all hover:border-gold/60 hover:bg-blush/60"
            >
              Más historias
            </Link>
          </div>
        </article>
      )}
    </PageContainer>
  );
}

export default BlogDetailPage;
