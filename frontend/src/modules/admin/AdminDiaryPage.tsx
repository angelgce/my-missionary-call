import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import api from '@/core/services/api';

import PageContainer from '@/shared/components/PageContainer';
import DecorativeDivider from '@/shared/components/DecorativeDivider';

interface DiaryEntry {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  images: string[];
}

function AdminDiaryPage() {
  // 1. Local state
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // 3. Custom hooks
  const navigate = useNavigate();

  // 7. Render helpers
  const fetchEntries = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<DiaryEntry[]>('/diary');
      setEntries(data);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        navigate('/admin');
        return;
      }
      setError('No se pudieron cargar las entradas.');
    } finally {
      setLoading(false);
    }
  };

  // 5. Effects
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/admin');
      return;
    }
    fetchEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 6. Event handlers
  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar esta entrada del diario? Esta acción no se puede deshacer.')) {
      return;
    }
    setDeleting(id);
    try {
      await api.delete(`/diary/${id}`);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch {
      alert('Error eliminando la entrada');
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('es-MX', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'America/Mexico_City',
    });
  };

  // 8. Main render
  return (
    <PageContainer>
      <div className="text-center animate-fade-in">
        <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-gold tablet:text-sm tablet:tracking-[0.3em]">
          Administración
        </p>
        <h1 className="font-serif text-3xl font-bold text-navy tablet:text-5xl">
          Diario privado
        </h1>
        <DecorativeDivider className="my-4 tablet:my-6" />
        <p className="mx-auto max-w-xl text-sm text-slate">
          Solo visible aquí. Las entradas se crean desde Messenger con{' '}
          <code className="rounded bg-blush/40 px-1.5 py-0.5 text-xs text-gold">
            /diario
          </code>
        </p>
      </div>

      <div className="mt-6 flex justify-center gap-3">
        <Link
          to="/admin/dashboard"
          className="rounded-full border border-gold/20 bg-blush/30 px-4 py-2 text-[11px] font-medium text-gold transition-all hover:border-gold/40 hover:bg-blush/50"
        >
          ← Dashboard
        </Link>
        <button
          onClick={fetchEntries}
          className="rounded-full border border-gold/20 bg-blush/30 px-4 py-2 text-[11px] font-medium text-gold transition-all hover:border-gold/40 hover:bg-blush/50"
        >
          Refrescar
        </button>
      </div>

      {loading && (
        <div className="mt-16 flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold/20 border-t-gold" />
          <p className="text-xs text-slate/60">Cargando diario...</p>
        </div>
      )}

      {!loading && error && (
        <div className="mt-12 rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && entries.length === 0 && (
        <div className="mx-auto mt-12 max-w-md rounded-2xl border border-dashed border-gold/30 bg-warm-white px-6 py-12 text-center">
          <p className="font-serif text-2xl font-bold text-navy">
            Diario vacío
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate">
            Aún no has escrito ninguna entrada. Manda{' '}
            <code className="rounded bg-blush/40 px-1.5 py-0.5 text-xs text-gold">
              /diario
            </code>{' '}
            al bot desde Messenger para empezar.
          </p>
        </div>
      )}

      {!loading && !error && entries.length > 0 && (
        <div className="mt-10 space-y-8">
          {entries.map((entry) => (
            <article
              key={entry.id}
              className="overflow-hidden rounded-2xl border border-gold/15 bg-warm-white shadow-sm"
            >
              <header className="flex items-start justify-between gap-3 border-b border-gold/10 bg-blush/20 p-5 tablet:p-6">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-gold/80">
                    {formatDate(entry.createdAt)}
                  </p>
                  <p className="mt-1 font-mono text-[10px] text-slate/50">
                    🆔 {entry.id}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(entry.id)}
                  disabled={deleting === entry.id}
                  className="shrink-0 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-red-600 transition-all hover:border-red-300 hover:bg-red-100 disabled:opacity-50"
                >
                  {deleting === entry.id ? '...' : 'Eliminar'}
                </button>
              </header>

              <div className="space-y-4 p-5 text-sm leading-relaxed text-slate tablet:p-6 tablet:text-base">
                {entry.content.split('\n').map((line, idx) =>
                  line.trim() ? (
                    <p key={idx}>{line}</p>
                  ) : (
                    <div key={idx} className="h-1" />
                  )
                )}
              </div>

              {entry.images.length > 0 && (
                <div className="grid grid-cols-2 gap-2 border-t border-gold/10 p-5 tablet:grid-cols-3 tablet:gap-3 tablet:p-6">
                  {entry.images.map((src, idx) => (
                    <a
                      key={idx}
                      href={src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block overflow-hidden rounded-lg border border-gold/15"
                    >
                      <img
                        src={src}
                        alt={`Foto ${idx + 1}`}
                        loading="lazy"
                        className="aspect-square w-full object-cover transition-transform hover:scale-105"
                      />
                    </a>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </PageContainer>
  );
}

export default AdminDiaryPage;
