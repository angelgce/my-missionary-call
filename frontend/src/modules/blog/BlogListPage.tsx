import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import PageContainer from '@/shared/components/PageContainer';
import DecorativeDivider from '@/shared/components/DecorativeDivider';

import {
  fetchPublicPosts,
  formatPostDate,
  BlogPostListItem,
} from '@/modules/blog/blogService';

function BlogListPage() {
  // 1. Local state
  const [posts, setPosts] = useState<BlogPostListItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 5. Effects
  useEffect(() => {
    let active = true;
    fetchPublicPosts()
      .then((data) => {
        if (active) setPosts(data);
      })
      .catch(() => {
        if (active) setPosts([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // 7. Render helpers
  const renderEmpty = () => (
    <div className="mx-auto mt-12 max-w-md rounded-2xl border border-dashed border-gold/30 bg-warm-white px-6 py-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-blush/40">
        <svg
          width="28"
          height="28"
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
      <p className="mt-5 font-serif text-2xl font-bold text-navy">
        Próximamente
      </p>
      <p className="mt-3 text-sm leading-relaxed text-slate">
        La Hermana Tarazona aún no ha enviado su primera carta desde el campo
        misional. Vuelve pronto para leer sus historias y milagros.
      </p>
      <p className="mt-4 font-cursive text-lg text-gold">
        Con cariño, espera un poquito ♡
      </p>
    </div>
  );

  const renderLoading = () => (
    <div className="mt-16 flex flex-col items-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold/20 border-t-gold" />
      <p className="text-xs text-slate/60">Cargando cartas...</p>
    </div>
  );

  // 8. Main render
  return (
    <PageContainer>
      {/* Header */}
      <div className="text-center animate-fade-in">
        <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-gold tablet:text-sm tablet:tracking-[0.3em]">
          Diario misional
        </p>
        <h1 className="font-serif text-3xl font-bold text-navy tablet:text-5xl desktop:text-6xl">
          Cartas desde la misión
        </h1>
        <DecorativeDivider className="my-4 tablet:my-6" />
        <p className="mx-auto max-w-xl text-sm text-slate tablet:text-base">
          Historias, milagros y aprendizajes que la Hermana Tarazona comparte
          desde el campo misional.
        </p>
      </div>

      {/* Back link */}
      <div className="mt-6 flex justify-center">
        <Link
          to="/"
          className="flex items-center gap-1.5 rounded-full border border-gold/20 bg-blush/30 px-4 py-2 text-[11px] font-medium text-gold transition-all hover:border-gold/40 hover:bg-blush/50"
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
          Volver al inicio
        </Link>
      </div>

      {loading && renderLoading()}
      {!loading && posts.length === 0 && renderEmpty()}

      {!loading && posts.length > 0 && (
        <div className="mt-10 grid grid-cols-1 gap-6 tablet:grid-cols-2 tablet:gap-8 desktop:gap-10">
          {posts.map((post) => (
            <Link
              key={post.id}
              to={`/blog/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-gold/15 bg-warm-white shadow-sm transition-all hover:-translate-y-1 hover:border-gold/40 hover:shadow-lg"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-blush/40">
                {post.coverImageUrl && (
                  <img
                    src={post.coverImageUrl}
                    alt={post.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-navy/40 via-transparent to-transparent" />
                <span className="absolute left-3 top-3 rounded-full bg-warm-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gold">
                  {post.readTime}
                </span>
              </div>

              <div className="flex flex-1 flex-col p-5 tablet:p-6">
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-gold/80">
                  {formatPostDate(post.publishedAt)}
                </p>
                <h2 className="mt-2 font-serif text-xl font-bold text-navy tablet:text-2xl">
                  {post.title}
                </h2>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-slate">
                  {post.excerpt}
                </p>
                <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-gold transition-all group-hover:gap-3">
                  Leer historia
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
          ))}
        </div>
      )}
    </PageContainer>
  );
}

export default BlogListPage;
