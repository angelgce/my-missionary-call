import { useState, useEffect, useRef } from 'react';

import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';

import { RootState } from '@/core/store/store';
import { useAppDispatch } from '@/core/hooks/useAppDispatch';
import { logout } from '@/core/store/slices/adminSlice';
import api from '@/core/services/api';

import PageContainer from '@/shared/components/PageContainer';
import DecorativeDivider from '@/shared/components/DecorativeDivider';

GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface AdminRevelation {
  id?: string;
  missionaryName: string;
  isRevealed: boolean;
  hasData?: boolean;
  updatedAt?: string;
}

interface PredictionItem {
  id: string;
  guestName: string;
  country: string;
  countryCode: string;
  state: string;
  stateCode: string;
  userEmail: string | null;
  ipAddress: string;
  createdAt: string;
}

type ExtractedField = 'missionaryName' | 'missionName' | 'language' | 'trainingCenter' | 'entryDate';

interface ExtractedData {
  missionaryName: string;
  missionName: string;
  language: string;
  trainingCenter: string;
  entryDate: string;
  confidence?: Record<ExtractedField, number>;
}

function AdminDashboardPage() {
  // Local state
  const [revelation, setRevelation] = useState<AdminRevelation>({
    missionaryName: '',
    isRevealed: false,
  });
  const [predictions, setPredictions] = useState<PredictionItem[]>([]);
  const [revealing, setRevealing] = useState(false);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [pdfText, setPdfText] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);
  const [showExtracted, setShowExtracted] = useState(false);
  const [advices, setAdvices] = useState<{ id: string; guestName: string; advice: string; ipAddress: string; createdAt: string }[]>([]);
  const [showAdvices, setShowAdvices] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [openingDate, setOpeningDate] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [locationUrl, setLocationUrl] = useState('');
  const [savingEventSettings, setSavingEventSettings] = useState(false);

  // Redux selectors
  const { isAuthenticated } = useSelector((state: RootState) => state.admin);
  const dispatch = useAppDispatch();

  // Custom hooks
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Effects
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin');
      return;
    }
    fetchData();
  }, [isAuthenticated, navigate]);

  // Event handlers
  const fetchData = async () => {
    try {
      const [revRes, predRes] = await Promise.all([
        api.get('/revelation/admin'),
        api.get('/predictions/admin'),
      ]);
      if (revRes.data) {
        setRevelation({
          id: revRes.data.id,
          missionaryName: revRes.data.missionaryName || '',
          isRevealed: revRes.data.isRevealed,
          hasData: revRes.data.hasData,
          updatedAt: revRes.data.updatedAt,
        });
      }
      setPredictions(predRes.data);
    } catch {
      // silently fail
    }
    try {
      const advRes = await api.get('/advice');
      setAdvices(advRes.data);
    } catch {
      // silently fail
    }
    try {
      const eventRes = await api.get('/revelation/event-settings');
      if (eventRes.data) {
        setOpeningDate(eventRes.data.openingDate || '');
        setLocationAddress(eventRes.data.locationAddress || '');
        setLocationUrl(eventRes.data.locationUrl || '');
      }
    } catch {
      // silently fail
    }
  };

  const handleToggleReveal = async () => {
    setRevealing(true);
    try {
      const res = await api.patch('/revelation/reveal');
      setRevelation((prev) => ({ ...prev, isRevealed: res.data.isRevealed }));
      setMessage(res.data.isRevealed ? 'Revelación visible' : 'Revelación oculta');
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('Error al cambiar estado');
    }
    setRevealing(false);
  };

  const extractTextFromPdf = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    const pages: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const lines: string[] = [];
      let currentLine = '';

      for (const item of content.items as Array<{ str?: string; hasEOL?: boolean }>) {
        currentLine += item.str || '';
        if (item.hasEOL) {
          lines.push(currentLine);
          currentLine = '';
        }
      }
      if (currentLine) lines.push(currentLine);

      // Group lines into paragraphs: an empty/whitespace-only line = paragraph break
      // Join lines within the same paragraph with spaces (not newlines) so the AI
      // receives clean, continuous text (e.g. multi-line mission names stay together)
      const text = lines
        .map((l) => l.trim())
        .reduce((acc, line) => {
          if (!line) return acc + '\n\n';
          if (acc.endsWith('\n\n')) return acc + line;
          return acc + ' ' + line;
        }, '');

      pages.push(text.trim());
    }

    return pages.join('\n\n');
  };

  const handlePdfUpload = async (file: File) => {
    if (!file.type.includes('pdf')) {
      setMessage('Solo se aceptan archivos PDF');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      const text = await extractTextFromPdf(file);

      if (!text.trim()) {
        setMessage('No se pudo extraer texto del PDF');
        setUploading(false);
        return;
      }

      // Normalize text: collapse multiple newlines into single spaces so multi-line
      // fields (like mission names split across lines) are sent as continuous text
      const normalizedText = text.replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ').trim();

      const res = await api.post('/revelation/extract-pdf-preview', { text: normalizedText });

      if (res.data?.success) {
        setExtractedData(res.data.data);
        setPdfText(text);
        setMessage('Datos extraídos — revisa y confirma');
      }
    } catch {
      setMessage('Error al procesar el PDF');
    }

    setUploading(false);
    setTimeout(() => setMessage(''), 5000);
  };

  const handleConfirmPdf = async () => {
    if (!extractedData || !pdfText) return;

    setConfirming(true);
    try {
      await api.post('/revelation/confirm-pdf', {
        ...extractedData,
        pdfText,
      });
      setRevelation((prev) => ({
        ...prev,
        missionaryName: extractedData.missionaryName,
        hasData: true,
      }));
      setMessage('Datos confirmados y guardados');
      setExtractedData(null);
      setPdfText('');
    } catch {
      setMessage('Error al guardar los datos');
    }
    setConfirming(false);
    setTimeout(() => setMessage(''), 5000);
  };

  const handleCancelPreview = () => {
    setExtractedData(null);
    setPdfText('');
    setMessage('');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handlePdfUpload(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handlePdfUpload(file);
    e.target.value = '';
  };

  const censor = (text: string) => '•'.repeat(Math.min((text || '').length, 12));

  const handleSaveEventSettings = async () => {
    setSavingEventSettings(true);
    try {
      await api.put('/revelation/event-settings', {
        openingDate,
        locationAddress,
        locationUrl,
      });
      setMessage('Configuración del evento guardada');
    } catch {
      setMessage('Error al guardar la configuración del evento');
    }
    setSavingEventSettings(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleEditName = () => {
    setEditedName(revelation.missionaryName);
    setEditingName(true);
  };

  const handleSaveName = async () => {
    if (!editedName.trim()) return;
    setSavingName(true);
    try {
      await api.patch('/revelation/missionary-name', { missionaryName: editedName.trim() });
      setRevelation((prev) => ({ ...prev, missionaryName: editedName.trim() }));
      setEditingName(false);
      setMessage('Nombre actualizado');
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('Error al actualizar el nombre');
      setTimeout(() => setMessage(''), 3000);
    }
    setSavingName(false);
  };

  const handleCancelEditName = () => {
    setEditingName(false);
    setEditedName('');
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/admin');
  };

  return (
    <PageContainer>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-gold">
              Panel Admin
            </p>
            <h1 className="mt-1 font-serif text-2xl font-bold text-navy tablet:text-3xl">
              Dashboard
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-full border border-rose-soft px-4 py-2 text-sm text-slate transition-colors hover:bg-rose-soft"
          >
            Cerrar Sesión
          </button>
        </div>

        <DecorativeDivider className="my-6" />

        {message && (
          <div className="mb-4 rounded-lg bg-cream p-3 text-center text-sm font-medium text-navy">
            {message}
          </div>
        )}

        {/* Event Settings Section */}
        <div className="rounded-xl border border-rose-soft bg-warm-white p-6">
          <h2 className="mb-4 font-serif text-xl font-bold text-navy">
            Configuración del Evento
          </h2>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-navy">
              Fecha de Apertura del Llamamiento
            </label>
            <input
              type="datetime-local"
              value={openingDate}
              onChange={(e) => setOpeningDate(e.target.value)}
              className="w-full rounded-lg border border-rose-soft bg-warm-white px-3 py-2 text-sm text-navy focus:border-gold focus:outline-none"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-navy">
              Dirección del Evento
            </label>
            <input
              type="text"
              value={locationAddress}
              onChange={(e) => setLocationAddress(e.target.value)}
              placeholder="Ej: Calle Ejemplo 123, Ciudad"
              className="w-full rounded-lg border border-rose-soft bg-warm-white px-3 py-2 text-sm text-navy focus:border-gold focus:outline-none"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-navy">
              Enlace de Google Maps
            </label>
            <input
              type="text"
              value={locationUrl}
              onChange={(e) => setLocationUrl(e.target.value)}
              placeholder="https://maps.google.com/..."
              className="w-full rounded-lg border border-rose-soft bg-warm-white px-3 py-2 text-sm text-navy focus:border-gold focus:outline-none"
            />
          </div>

          <button
            onClick={handleSaveEventSettings}
            disabled={savingEventSettings}
            className="w-full rounded-full bg-navy py-3 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-slate disabled:opacity-40"
          >
            {savingEventSettings ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>

        <DecorativeDivider className="my-6" />

        {/* Carta Misional Section */}
        <div className="rounded-xl border border-rose-soft bg-warm-white p-6">
          <h2 className="mb-4 font-serif text-xl font-bold text-navy">
            Carta Misional
          </h2>

          {/* Missionary Name (editable) */}
          <div className="mb-4">
            <p className="mb-1 text-sm font-medium text-navy">Nombre de la Misionera</p>
            {editingName ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="flex-1 rounded-lg border border-rose-soft bg-warm-white px-4 py-3 font-semibold text-navy focus:border-gold focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  disabled={savingName || !editedName.trim()}
                  className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate disabled:opacity-40"
                >
                  {savingName ? '...' : 'Guardar'}
                </button>
                <button
                  onClick={handleCancelEditName}
                  className="rounded-lg border border-rose-soft px-4 py-2 text-sm font-medium text-slate transition-colors hover:bg-rose-soft"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="flex-1 rounded-lg bg-cream px-4 py-3 font-semibold text-navy">
                  {revelation.missionaryName || 'Sin asignar'}
                </p>
                <button
                  onClick={handleEditName}
                  className="rounded-lg border border-rose-soft px-3 py-3 text-slate transition-colors hover:bg-rose-soft"
                  title="Editar nombre"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Encrypted data status */}
          <div className="mb-4 rounded-lg bg-navy/5 p-4">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${revelation.hasData ? 'bg-green-500' : 'bg-slate/30'}`} />
              <p className="text-sm text-slate/70">
                {revelation.hasData
                  ? 'Datos del llamamiento cargados y encriptados'
                  : 'Sin datos — sube el PDF del llamamiento'}
              </p>
            </div>
            {revelation.hasData && (
              <div className="mt-2 space-y-1 pl-4 text-xs text-slate/50">
                <p>Misión: ••••••••</p>
                <p>Idioma: ••••••••</p>
                <p>Centro de Capacitación: ••••••••</p>
                <p>Fecha de Entrada: ••••••••</p>
              </div>
            )}
          </div>

          {/* PDF Upload */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`mb-4 cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
              dragOver
                ? 'border-gold bg-gold/5'
                : 'border-rose-soft hover:border-gold/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            {uploading ? (
              <div>
                <p className="text-sm font-medium text-navy">Procesando PDF con IA...</p>
                <p className="mt-1 text-xs text-slate/60">
                  Extrayendo y encriptando datos del llamamiento
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-navy">
                  {revelation.hasData ? 'Subir nuevo PDF para reemplazar datos' : 'Arrastra tu PDF aquí o haz click para seleccionar'}
                </p>
                <p className="mt-1 text-xs text-slate/60">
                  La IA extraerá los datos y los encriptará automáticamente
                </p>
              </div>
            )}
          </div>

          {/* Extracted data preview */}
          {extractedData && (
            <div className="mb-4 rounded-lg border border-gold/30 bg-gold/5 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-navy">
                  Datos Extraídos — Revisa y Edita
                </h3>
                <button
                  type="button"
                  onClick={() => setShowExtracted((prev) => !prev)}
                  className="flex items-center gap-1.5 rounded-full border border-gold/30 px-3 py-1.5 text-xs text-slate transition-colors hover:bg-gold/10"
                >
                  {showExtracted ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  )}
                  {showExtracted ? 'Ocultar' : 'Ver datos'}
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { key: 'missionaryName' as const, label: 'Nombre de la Misionera' },
                  { key: 'missionName' as const, label: 'Misión' },
                  { key: 'language' as const, label: 'Idioma' },
                  { key: 'trainingCenter' as const, label: 'Centro de Capacitación' },
                  { key: 'entryDate' as const, label: 'Fecha de Entrada' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <div className="mb-1 flex items-center justify-between">
                      <label className="block text-xs font-medium text-slate/70">
                        {label}
                      </label>
                      {extractedData.confidence && (
                        <span
                          className={`text-xs font-medium ${
                            extractedData.confidence[key] >= 80
                              ? 'text-green-600'
                              : extractedData.confidence[key] >= 50
                                ? 'text-yellow-600'
                                : 'text-red-500'
                          }`}
                        >
                          {extractedData.confidence[key]}% seguridad
                        </span>
                      )}
                    </div>
                    {showExtracted ? (
                      <input
                        type="text"
                        value={extractedData[key]}
                        onChange={(e) =>
                          setExtractedData((prev) =>
                            prev ? { ...prev, [key]: e.target.value } : prev,
                          )
                        }
                        placeholder={`Escribe ${label.toLowerCase()}`}
                        className={`w-full rounded-lg border bg-warm-white px-3 py-2 text-sm text-navy focus:border-gold focus:outline-none ${
                          extractedData[key].trim() ? 'border-rose-soft' : 'border-red-400 bg-red-50'
                        }`}
                      />
                    ) : (
                      <p className="w-full rounded-lg border border-rose-soft bg-warm-white px-3 py-2 text-sm text-slate/40 select-none">
                        {extractedData[key].trim() ? censor(extractedData[key]) : '—'}
                      </p>
                    )}
                    {!extractedData[key].trim() && (
                      <p className="mt-1 text-xs text-red-500">Campo vacío — la IA no pudo extraerlo</p>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleConfirmPdf}
                  disabled={confirming}
                  className="flex-1 rounded-full bg-navy py-2.5 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-slate disabled:opacity-40"
                >
                  {confirming ? 'Guardando...' : 'Confirmar y Guardar'}
                </button>
                <button
                  onClick={handleCancelPreview}
                  className="rounded-full border border-rose-soft px-6 py-2.5 text-sm font-medium text-slate transition-colors hover:bg-rose-soft"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Reveal toggle */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleToggleReveal}
              disabled={revealing || !revelation.hasData}
              className={`flex-1 rounded-full py-3 text-sm font-semibold uppercase tracking-wider text-white transition-colors disabled:opacity-40 ${
                revelation.isRevealed
                  ? 'bg-slate hover:bg-navy'
                  : 'bg-navy hover:bg-slate'
              }`}
            >
              {revealing
                ? 'Cambiando...'
                : revelation.isRevealed
                  ? 'Ocultar Llamamiento'
                  : 'Revelar Llamamiento'}
            </button>
          </div>

          <p className="mt-3 text-center text-xs text-slate/60">
            Estado: {revelation.isRevealed ? 'Visible para todos' : 'Oculto — nadie puede ver los datos'}
          </p>
          {revelation.updatedAt && (
            <p className="mt-1 text-center text-xs text-slate/40">
              Última actualización: {new Date(revelation.updatedAt).toLocaleString()}
            </p>
          )}
        </div>

        {/* Predictions Section */}
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-navy">
              Predicciones ({predictions.length})
            </h2>
            {predictions.length > 0 && (
              <button
                type="button"
                onClick={() => setShowPredictions((prev) => !prev)}
                className="flex items-center gap-2 rounded-full border border-rose-soft px-4 py-2 text-sm text-slate transition-colors hover:bg-rose-soft"
              >
                {showPredictions ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                )}
                {showPredictions ? 'Ocultar' : 'Mostrar'}
              </button>
            )}
          </div>

          {predictions.length === 0 ? (
            <p className="text-center text-slate/60">No hay predicciones aún</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-rose-soft">
              <table className="w-full text-left text-sm">
                <thead className="bg-cream text-xs uppercase text-slate">
                  <tr>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">País</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 hidden tablet:table-cell">IP</th>
                    <th className="px-4 py-3">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-soft bg-warm-white">
                  {predictions.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3 font-medium text-navy">
                        {showPredictions ? p.guestName : censor(p.guestName)}
                      </td>
                      <td className="px-4 py-3 text-slate">
                        {showPredictions ? p.country : censor(p.country)}
                      </td>
                      <td className="px-4 py-3 text-slate">
                        {showPredictions ? p.state : censor(p.state)}
                      </td>
                      <td className="px-4 py-3 text-slate/60 hidden tablet:table-cell">
                        {showPredictions ? p.ipAddress : censor(p.ipAddress)}
                      </td>
                      <td className="px-4 py-3 text-slate/60">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Advice Section */}
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-navy">
              Consejos ({advices.length})
            </h2>
            {advices.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAdvices((prev) => !prev)}
                className="flex items-center gap-2 rounded-full border border-rose-soft px-4 py-2 text-sm text-slate transition-colors hover:bg-rose-soft"
              >
                {showAdvices ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                )}
                {showAdvices ? 'Ocultar' : 'Mostrar'}
              </button>
            )}
          </div>

          {advices.length === 0 ? (
            <p className="text-center text-slate/60">No hay consejos aún</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-rose-soft">
              <table className="w-full text-left text-sm">
                <thead className="bg-cream text-xs uppercase text-slate">
                  <tr>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Consejo</th>
                    <th className="px-4 py-3 hidden tablet:table-cell">IP</th>
                    <th className="px-4 py-3">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-soft bg-warm-white">
                  {advices.map((a) => (
                    <tr key={a.id}>
                      <td className="px-4 py-3 font-medium text-navy">
                        {showAdvices ? a.guestName : censor(a.guestName)}
                      </td>
                      <td className="max-w-xs px-4 py-3 text-slate">
                        {showAdvices ? (
                          <span className="line-clamp-2">{a.advice}</span>
                        ) : censor(a.advice)}
                      </td>
                      <td className="px-4 py-3 text-slate/60 hidden tablet:table-cell">
                        {showAdvices ? a.ipAddress : censor(a.ipAddress)}
                      </td>
                      <td className="px-4 py-3 text-slate/60">
                        {new Date(a.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}

export default AdminDashboardPage;
