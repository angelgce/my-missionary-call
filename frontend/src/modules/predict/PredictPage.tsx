import { useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { RootState } from '@/core/store/store';
import {
  setGuestName,
  setSelectedCountry,
  setSelectedRegion,
  addPrediction,
} from '@/core/store/slices/predictionSlice';

import PageContainer from '@/shared/components/PageContainer';
import DecorativeDivider from '@/shared/components/DecorativeDivider';
import WorldMap from './components/WorldMap';
import LocationSelector from './components/LocationSelector';

import { useCountryData } from './hooks/useCountryData';

function PredictPage() {
  // Local state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [lastPrediction, setLastPrediction] = useState({ name: '', country: '', region: '' });

  // Redux selectors
  const { guestName, selectedCountry, selectedRegion, predictions } = useSelector(
    (state: RootState) => state.prediction
  );
  const dispatch = useDispatch();

  // Custom hooks
  const { countries, getRegions, getCountryCode } = useCountryData();

  // Computed values
  const regions = getRegions(selectedCountry);
  const countryCode = getCountryCode(selectedCountry);
  const isFormValid = guestName.trim() && selectedCountry && selectedRegion;

  // Event handlers
  const handleSubmit = () => {
    if (!isFormValid) return;
    setLastPrediction({
      name: guestName,
      country: selectedCountry,
      region: selectedRegion,
    });
    dispatch(addPrediction());
    setShowConfirmation(true);
    setTimeout(() => setShowConfirmation(false), 4000);
  };

  return (
    <PageContainer>
      <div className="animate-fade-in">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-gold">
            Predicciones
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-navy tablet:text-4xl">
            ¿A dónde será enviada?
          </h1>
          <p className="mt-2 text-slate">
            Registra tu predicción de la misión
          </p>
        </div>

        <DecorativeDivider className="my-6" />

        <div className="flex flex-col gap-6 tablet:flex-row">
          {/* Left: Map */}
          <div className="tablet:w-1/2">
            <WorldMap
              selectedCountryCode={countryCode}
              onCountrySelect={(name) => {
                const match = countries.find(
                  (c) => c.name.toLowerCase() === name.toLowerCase()
                );
                if (match) dispatch(setSelectedCountry(match.name));
              }}
            />
          </div>

          {/* Right: Form */}
          <div className="tablet:w-1/2">
            <div className="rounded-xl border border-rose-soft bg-warm-white p-6">
              <div className="mb-4">
                <label htmlFor="guestName" className="mb-1 block text-sm font-medium text-navy">
                  Tu nombre
                </label>
                <input
                  id="guestName"
                  type="text"
                  value={guestName}
                  onChange={(e) => dispatch(setGuestName(e.target.value))}
                  placeholder="Escribe tu nombre..."
                  className="w-full rounded-lg border border-rose-soft bg-cream px-4 py-3 text-navy outline-none transition-colors placeholder:text-slate/40 focus:border-gold"
                />
              </div>

              <LocationSelector
                countries={countries}
                regions={regions}
                selectedCountry={selectedCountry}
                selectedRegion={selectedRegion}
                onCountryChange={(c) => dispatch(setSelectedCountry(c))}
                onRegionChange={(r) => dispatch(setSelectedRegion(r))}
              />

              <button
                onClick={handleSubmit}
                disabled={!isFormValid}
                className="mt-6 w-full rounded-full bg-gold py-3 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-gold-dark disabled:cursor-not-allowed disabled:opacity-40"
              >
                Guardar Predicción
              </button>
            </div>

            {/* Confirmation */}
            {showConfirmation && (
              <div className="mt-4 animate-slide-up rounded-xl border border-gold/30 bg-warm-white p-4 text-center">
                <p className="font-medium text-navy">
                  {lastPrediction.name} predice:
                </p>
                <p className="mt-1 text-lg font-bold text-gold">
                  {lastPrediction.region}, {lastPrediction.country}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Predictions list */}
        {predictions.length > 0 && (
          <div className="mt-10">
            <DecorativeDivider />
            <h2 className="mb-4 text-center font-serif text-xl font-bold text-navy">
              Predicciones ({predictions.length})
            </h2>
            <div className="grid gap-3 tablet:grid-cols-2 desktop:grid-cols-3">
              {predictions.map((p) => (
                <div
                  key={p.id}
                  className="rounded-lg border border-rose-soft bg-warm-white p-4"
                >
                  <p className="font-medium text-navy">{p.guestName}</p>
                  <p className="text-sm text-gold">
                    {p.region}, {p.country}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

export default PredictPage;
