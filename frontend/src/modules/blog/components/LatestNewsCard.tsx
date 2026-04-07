import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  fetchPublicPosts,
  formatPostDate,
  BlogPostListItem,
} from '@/modules/blog/blogService';

function LatestNewsCard() {
  // 1. Local state
  const [post, setPost] = useState<BlogPostListItem | null>(null);
  const [loading, setLoading] = useState(true);

  // 5. Effects
  useEffect(() => {
    let active = true;
    fetchPublicPosts()
      .then((posts) => {
        if (active) setPost(posts[0] ?? null);
      })
      .catch(() => {
        if (active) setPost(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) return null;

  // 8. Main render
  return (
    <section className="mx-auto mt-12 w-full max-w-2xl px-2 tablet:mt-16">
      <div className="text-center">
        <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-gold tablet:text-xs">
          {post ? 'Última carta' : 'Diario misional'}
        </p>
        <h2 className="mt-2 font-serif text-2xl font-bold text-navy tablet:text-3xl">
          Desde el campo misional
        </h2>
      </div>

      {post ? (
        <Link
          to={`/blog/${post.slug}`}
          className="group mt-6 flex flex-col overflow-hidden rounded-2xl border border-gold/20 bg-warm-white text-left shadow-md transition-all hover:-translate-y-1 hover:border-gold/40 hover:shadow-xl tablet:flex-row"
        >
          <div className="relative aspect-[16/10] overflow-hidden bg-blush/40 tablet:aspect-auto tablet:w-2/5">
            {post.coverImageUrl && (
              <img
                src={post.coverImageUrl}
                alt={post.title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            )}
            <span className="absolute left-3 top-3 rounded-full bg-warm-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gold">
              Nuevo
            </span>
          </div>

          <div className="flex flex-1 flex-col justify-center p-5 tablet:p-7">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-gold/80">
              {formatPostDate(post.publishedAt)} · {post.readTime}
            </p>
            <h3 className="mt-2 font-serif text-xl font-bold leading-snug text-navy tablet:text-2xl">
              {post.title}
            </h3>
            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate">
              {post.excerpt}
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-gold transition-all group-hover:gap-3">
              Leer carta
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
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </div>
          </div>
        </Link>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-gold/30 bg-warm-white px-6 py-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-gold/30 bg-blush/40">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gold"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <p className="mt-4 font-serif text-lg font-bold text-navy">
            Próximamente
          </p>
          <p className="mt-2 text-xs leading-relaxed text-slate">
            La Hermana Tarazona pronto compartirá sus primeras historias desde la
            misión.
          </p>
          <p className="mt-3 font-cursive text-base text-gold">
            Vuelve pronto ♡
          </p>
        </div>
      )}
    </section>
  );
}

export default LatestNewsCard;
