import { lazy, Suspense, useState, useEffect, useRef } from 'react';

import { useSelector } from 'react-redux';

import { RootState } from '@/core/store/store';
import { useAppDispatch } from '@/core/hooks/useAppDispatch';
import { getSessionId } from '@/core/utils/session';
import {
  setGuestName,
  setSelectedCountry,
  setSelectedState,
  setSelectedCity,
  setCoordinates,
  fetchPredictions,
  fetchMyPrediction,
  submitPrediction,
} from '@/core/store/slices/predictionSlice';

import PageContainer from '@/shared/components/PageContainer';
import DecorativeDivider from '@/shared/components/DecorativeDivider';
import LocationSelector from './components/LocationSelector';

const WorldMap = lazy(() => import('./components/WorldMap'));

import { useCountryData } from './hooks/useCountryData';

function PredictPage() {
  // Local state
  const [submitting, setSubmitting] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [highlightedPredictionId, setHighlightedPredictionId] = useState<string | null>(null);
  const [focusCoords, setFocusCoords] = useState<{ lat: number; lng: number; key: number } | null>(null);
  const [errors, setErrors] = useState({
    guestName: false,
    country: false,
    state: false,
    city: false,
  });

  // Refs
  const myPredictionRef = useRef<HTMLDivElement>(null);

  // Redux selectors
  const {
    guestName,
    selectedCountryCode,
    selectedStateCode,
    selectedCity,
    latitude,
    longitude,
    predictions,
    prefilled,
    myPredictionId,
  } = useSelector((state: RootState) => state.prediction);
  const dispatch = useAppDispatch();

  // Custom hooks
  const { loading: geoLoading, countries, getStates, getCities, getCountryName, getCountryCenter, getStateName, findNearestLocation, findNearestCity } =
    useCountryData();

  // Computed values
  const states = getStates(selectedCountryCode);
  const cities = getCities(selectedCountryCode, selectedStateCode);
  const countryCenter = getCountryCenter(selectedCountryCode);

  const myPrediction = myPredictionId
    ? predictions.find((p) => p.id === myPredictionId)
    : null;

  // Effects
  useEffect(() => {
    dispatch(fetchPredictions());
    dispatch(fetchMyPrediction(getSessionId()));
  }, [dispatch]);

  // Event handlers
  const handleCoordinatesChange = (lat: number, lng: number) => {
    dispatch(setCoordinates({ lat: String(lat), lng: String(lng) }));
  };

  const handleMapClick = (lng: number, lat: number) => {
    const result = findNearestLocation(lng, lat);
    if (!result) return;

    dispatch(setSelectedCountry({ countryCode: result.countryCode }));
    handleCoordinatesChange(lat, lng);
    setErrors((prev) => ({ ...prev, country: false }));
    if (result.stateCode) {
      dispatch(setSelectedState(result.stateCode));
      setErrors((prev) => ({ ...prev, state: false }));

      const city = findNearestCity(result.countryCode, result.stateCode, lng, lat);
      if (city) {
        dispatch(setSelectedCity(city));
        setErrors((prev) => ({ ...prev, city: false }));
      }
    }
  };

  const handleStateClick = (stateCode: string) => {
    dispatch(setSelectedState(stateCode));
  };

  const handleBackToWorld = () => {
    dispatch(setSelectedCountry({ countryCode: '' }));
  };

  const handleCountryDropdownChange = (countryCode: string) => {
    dispatch(setSelectedCountry({ countryCode }));
  };

  const handleSubmit = async () => {
    const newErrors = {
      guestName: !guestName.trim(),
      country: !selectedCountryCode,
      state: !selectedStateCode,
      city: !selectedCity,
    };
    setErrors(newErrors);

    const hasErrors = Object.values(newErrors).some(Boolean);
    if (hasErrors || submitting) return;

    const countryName = getCountryName(selectedCountryCode);
    const stateName = getStateName(selectedStateCode, selectedCountryCode);

    setSubmitting(true);
    try {
      await dispatch(
        submitPrediction({
          name: guestName,
          country: countryName,
          countryCode: selectedCountryCode,
          state: stateName,
          stateCode: selectedStateCode,
          city: selectedCity,
          sessionId: getSessionId(),
          latitude,
          longitude,
        })
      ).unwrap();

      await dispatch(fetchPredictions()).unwrap();

      setJustSaved(true);
      setTimeout(() => {
        myPredictionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      setTimeout(() => setJustSaved(false), 2000);
    } catch {
      // handle error silently
    }
    setSubmitting(false);
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
          <p className="mt-2 text-slate">Registra tu predicción de la misión</p>
        </div>

        {/* My prediction card */}
        {myPrediction && (
          <div
            ref={myPredictionRef}
            className={`mx-auto mt-10 max-w-md rounded-2xl border bg-warm-white p-6 transition-all duration-500 tablet:p-8 ${justSaved ? 'border-gold shadow-lg' : 'border-rose-soft shadow-sm'}`}
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy/5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-navy/60">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" fill="currentColor" />
                </svg>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-[0.15em] text-gold">
                  Tu predicción
                </p>
                <p className="mt-1 truncate font-serif text-xl font-bold text-navy">
                  {myPrediction.guestName}
                </p>
                <p className="mt-2 text-sm font-medium text-navy/70">
                  {myPrediction.city ? `${myPrediction.city}, ` : ''}
                  {myPrediction.state}
                </p>
                <p className="mt-0.5 text-xs text-slate/50">
                  {myPrediction.country}
                </p>
              </div>
            </div>
          </div>
        )}

        <DecorativeDivider className="my-6" />

        <div className="flex flex-col gap-6 tablet:flex-row">
          {/* Map — always left half on tablet+ */}
          <div className="tablet:w-1/2">
            <Suspense fallback={null}>
              <WorldMap
                selectedCountryCode={selectedCountryCode}
                selectedStateCode={selectedStateCode}
                selectedCity={selectedCity}
                countryCenter={countryCenter}
                states={states}
                cities={cities}
                predictions={predictions}
                highlightedPredictionId={highlightedPredictionId}
                focusCoords={focusCoords}
                onMapClick={handleMapClick}
                onStateClick={handleStateClick}
                onBackToWorld={handleBackToWorld}
              onCoordinatesChange={handleCoordinatesChange}
              initialPin={
                prefilled && latitude && longitude
                  ? { lat: parseFloat(latitude), lng: parseFloat(longitude) }
                  : undefined
              }
            />
            </Suspense>
            <p className="mt-2 text-center text-base font-semibold text-slate/60">
              {selectedCountryCode
                ? 'Haz clic en el mapa para colocar tu pin'
                : 'Selecciona un país o haz clic en el mapa'}
            </p>
          </div>

          {/* Form — always right half on tablet+ */}
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
                  onChange={(e) => {
                    dispatch(setGuestName(e.target.value));
                    if (e.target.value.trim()) setErrors((prev) => ({ ...prev, guestName: false }));
                  }}
                  placeholder="Escribe tu nombre..."
                  className={`w-full rounded-lg border bg-cream px-4 py-3 text-navy outline-none transition-colors placeholder:text-slate/40 focus:border-gold ${errors.guestName ? 'border-red-400' : 'border-rose-soft'}`}
                />
              </div>

              <LocationSelector
                countries={countries}
                states={states}
                cities={cities}
                selectedCountryCode={selectedCountryCode}
                selectedStateCode={selectedStateCode}
                selectedCity={selectedCity}
                onCountryChange={(code) => {
                  handleCountryDropdownChange(code);
                  if (code) setErrors((prev) => ({ ...prev, country: false }));
                }}
                onStateChange={(code) => {
                  dispatch(setSelectedState(code));
                  if (code) setErrors((prev) => ({ ...prev, state: false }));
                }}
                onCityChange={(name) => {
                  dispatch(setSelectedCity(name));
                  if (name) setErrors((prev) => ({ ...prev, city: false }));
                }}
                errors={{ country: errors.country, state: errors.state, city: errors.city }}
              />

              <button
                onClick={handleSubmit}
                className="mt-6 w-full rounded-full bg-gold py-3 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-gold-dark"
              >
                {submitting
                  ? 'Guardando...'
                  : prefilled
                    ? 'Actualizar Predicción'
                    : 'Guardar Predicción'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

export default PredictPage;
