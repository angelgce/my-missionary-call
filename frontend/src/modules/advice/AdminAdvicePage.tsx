import { useState, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { RootState } from '@/core/store/store';
import api from '@/core/services/api';

import PageContainer from '@/shared/components/PageContainer';
import DecorativeDivider from '@/shared/components/DecorativeDivider';

interface AdviceItem {
  id: string;
  guestName: string;
  advice: string;
  createdAt: string;
}

function AdminAdvicePage() {
  // Local state
  const [advices, setAdvices] = useState<AdviceItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Redux selectors
  const { isAuthenticated } = useSelector((state: RootState) => state.admin);

  // Custom hooks
  const navigate = useNavigate();

  // Effects
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin');
      return;
    }

    const fetchAdvices = async () => {
      try {
        const res = await api.get('/advice');
        setAdvices(res.data);
      } catch {
        // silently fail
      }
      setLoading(false);
    };

    fetchAdvices();
    const interval = setInterval(fetchAdvices, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, navigate]);

  return (
    <PageContainer>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-gold">
              Administración
            </p>
            <h1 className="mt-1 font-serif text-2xl font-bold text-navy tablet:text-3xl">
              Buzón de Consejos
            </h1>
          </div>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="rounded-full border border-rose-soft px-4 py-2 text-sm text-slate transition-colors hover:bg-rose-soft"
          >
            Volver al Dashboard
          </button>
        </div>

        <DecorativeDivider className="my-6" />

        <p className="mb-4 text-center text-xs font-medium uppercase tracking-[0.2em] text-gold">
          {advices.length} {advices.length === 1 ? 'consejo' : 'consejos'}
        </p>

        {loading ? (
          <p className="text-center text-slate/60">Cargando consejos...</p>
        ) : advices.length === 0 ? (
          <p className="text-center text-slate/60">No hay consejos aún</p>
        ) : (
          <div className="space-y-3">
            {advices.map((a) => (
              <div
                key={a.id}
                className="rounded-xl border border-rose-soft bg-warm-white p-4 tablet:p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-lg font-bold text-navy">
                      {a.guestName}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-navy/70">
                      {a.advice}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs text-slate/50">
                    {new Date(a.createdAt).toLocaleDateString('es-MX', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}

export default AdminAdvicePage;
