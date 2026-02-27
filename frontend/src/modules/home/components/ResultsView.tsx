import { lazy, Suspense, useMemo } from 'react';

import { Prediction } from '@/core/store/slices/predictionSlice';
import { haversineDistance } from '@/core/utils/haversine';

import PageContainer from '@/shared/components/PageContainer';

const WorldMap = lazy(() => import('@/modules/predict/components/WorldMap'));

interface ResultsViewProps {
  predictions: Prediction[];
  destination: { lat: number; lng: number; missionName: string };
  onBack: () => void;
}

interface RankedPrediction extends Prediction {
  distanceKm: number;
}

const MEDAL_COLORS = ['#BF9B30', '#C0C0C0', '#CD7F32'] as const;
const MEDAL_LABELS = ['1er', '2do', '3er'] as const;

function ResultsView({ predictions, destination, onBack }: ResultsViewProps) {
  // Computed values
  const ranked = useMemo<RankedPrediction[]>(() => {
    return predictions
      .filter((p) => p.latitude && p.longitude)
      .map((p) => ({
        ...p,
        distanceKm: haversineDistance(
          parseFloat(p.latitude!),
          parseFloat(p.longitude!),
          destination.lat,
          destination.lng
        ),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [predictions, destination.lat, destination.lng]);

  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  // Render helpers
  const formatDistance = (km: number): string => {
    return Math.round(km).toLocaleString('es-MX');
  };

  const renderMedalIcon = (index: number) => {
    const color = MEDAL_COLORS[index];
    return (
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white tablet:h-10 tablet:w-10"
        style={{ backgroundColor: color }}
      >
        {MEDAL_LABELS[index]}
      </div>
    );
  };

  const renderTopCard = (prediction: RankedPrediction, index: number) => {
    const borderColor = MEDAL_COLORS[index];
    const isFirst = index === 0;

    return (
      <div
        key={prediction.id}
        className={`flex flex-col items-center rounded-xl border-2 bg-warm-white p-5 text-center transition-transform ${
          isFirst ? 'tablet:scale-105' : ''
        }`}
        style={{ borderColor }}
      >
        {renderMedalIcon(index)}
        <p className="mt-3 font-serif text-lg font-bold text-navy">
          {prediction.guestName}
        </p>
        <p className="mt-1 text-sm text-navy/70">
          {prediction.city}
          {prediction.state ? `, ${prediction.state}` : ''}
        </p>
        <p className="text-xs text-slate/60">{prediction.country}</p>
        <div className="mt-3 rounded-full px-3 py-1" style={{ backgroundColor: `${borderColor}15` }}>
          <p className="text-sm font-semibold" style={{ color: borderColor }}>
            {formatDistance(prediction.distanceKm)} km
          </p>
        </div>
      </div>
    );
  };

  const renderRestRow = (prediction: RankedPrediction, index: number) => {
    const rank = index + 4;
    return (
      <div
        key={prediction.id}
        className="flex items-center gap-4 rounded-lg border border-rose-soft bg-warm-white px-3 py-2.5 tablet:px-4 tablet:py-3"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy/5 text-xs font-semibold text-navy/50">
          {rank}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-navy">
            {prediction.guestName}
          </p>
          <p className="truncate text-xs text-slate/60">
            {prediction.city}
            {prediction.state ? `, ${prediction.state}` : ''} - {prediction.country}
          </p>
        </div>
        <p className="shrink-0 text-sm font-medium text-navy/60">
          {formatDistance(prediction.distanceKm)} km
        </p>
      </div>
    );
  };

  // Main render
  return (
    <PageContainer>
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium text-gold transition-colors hover:text-gold-dark"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Volver
        </button>
      </div>

      <div className="mb-6 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
          Resultados
        </p>
        <h2 className="mt-1 font-serif text-2xl font-bold text-navy tablet:text-4xl">
          {destination.missionName}
        </h2>
        <p className="mt-2 text-sm text-slate/60">
          {ranked.length} {ranked.length === 1 ? 'prediccion registrada' : 'predicciones registradas'}
        </p>
      </div>

      {/* Map */}
      <div className="mb-8">
        <Suspense fallback={null}>
          <WorldMap
            selectedCountryCode=""
            selectedStateCode=""
            selectedCity=""
            countryCenter={null}
            states={[]}
            cities={[]}
            predictions={predictions}
            destination={destination}
            showLines={true}
          />
        </Suspense>
      </div>

      {/* Top 3 Podium */}
      {top3.length > 0 && (
        <div className="mb-8">
          <h3 className="mb-4 text-center font-serif text-xl font-bold text-navy">
            Los mas cercanos
          </h3>
          <div className="grid grid-cols-1 gap-4 tablet:grid-cols-3">
            {top3.map((p, i) => renderTopCard(p, i))}
          </div>
        </div>
      )}

      {/* Remaining predictions */}
      {rest.length > 0 && (
        <div className="mb-8">
          <h3 className="mb-3 font-serif text-lg font-bold text-navy">
            Todas las predicciones
          </h3>
          <div className="flex flex-col gap-2">
            {rest.map((p, i) => renderRestRow(p, i))}
          </div>
        </div>
      )}
    </div>
    </PageContainer>
  );
}

export default ResultsView;
