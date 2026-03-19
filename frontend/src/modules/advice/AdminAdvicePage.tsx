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

  // Event handlers
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Buzón de Consejos</title>
        <style>
          body { font-family: Georgia, serif; padding: 40px; color: #1a1a2e; }
          h1 { text-align: center; font-size: 24px; margin-bottom: 4px; }
          .subtitle { text-align: center; font-size: 12px; color: #888; margin-bottom: 30px; }
          .advice { border-bottom: 1px solid #e0d6cc; padding: 16px 0; }
          .advice:last-child { border-bottom: none; }
          .name { font-weight: bold; font-size: 16px; }
          .text { margin-top: 6px; font-size: 14px; color: #444; white-space: pre-wrap; }
          .date { font-size: 11px; color: #999; margin-top: 4px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>Buzón de Consejos</h1>
        <p class="subtitle">${advices.length} consejo${advices.length === 1 ? '' : 's'} — Impreso el ${new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        ${advices.map((a) => `
          <div class="advice">
            <div class="name">${a.guestName}</div>
            <div class="text">${a.advice}</div>
            <div class="date">${new Date(a.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        `).join('')}
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

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
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              disabled={advices.length === 0}
              className="rounded-full border border-gold/40 px-4 py-2 text-sm text-navy transition-colors hover:bg-gold/10 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Imprimir
            </button>
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="rounded-full border border-rose-soft px-4 py-2 text-sm text-slate transition-colors hover:bg-rose-soft"
            >
              Volver al Dashboard
            </button>
          </div>
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
