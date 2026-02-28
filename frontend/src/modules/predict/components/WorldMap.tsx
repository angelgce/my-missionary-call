import { useRef, useCallback, useEffect, useState, useMemo } from 'react';

import Map, {
  Marker as MapMarker,
  NavigationControl,
  type MapRef,
  type MapLayerMouseEvent,
} from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { IState, ICity } from 'country-state-city';

import { Prediction } from '@/core/store/slices/predictionSlice';

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron';

interface CountryCenter {
  lat: number;
  lng: number;
}

interface PinPosition {
  lng: number;
  lat: number;
}

interface WorldMapProps {
  selectedCountryCode: string;
  selectedStateCode: string;
  selectedCity: string;
  countryCenter: CountryCenter | null;
  states: IState[];
  cities: ICity[];
  predictions?: Prediction[];
  highlightedPredictionId?: string | null;
  focusCoords?: { lat: number; lng: number; key: number } | null;
  onMapClick?: (lng: number, lat: number) => void;
  onStateClick?: (stateCode: string) => void;
  onPredictionClick?: (prediction: Prediction) => void;
  onBackToWorld?: () => void;
  onCoordinatesChange?: (lat: number, lng: number) => void;
  initialPin?: PinPosition;
  destination?: { lat: number; lng: number };
  showLines?: boolean;
  showCountBadges?: boolean;
}

function getCountryZoom(code: string): number {
  const zooms: Record<string, number> = {
    US: 3.5, RU: 2.5, CA: 3, CN: 3.5, BR: 3.5, AU: 3.5, IN: 4, AR: 3.5,
    MX: 4.5, CL: 3.5, ID: 3.5, KZ: 3.5, DZ: 4, CD: 4, SA: 4, IR: 4,
  };
  return zooms[code] ?? 5;
}

function WorldMap({
  selectedCountryCode,
  selectedStateCode,
  selectedCity,
  countryCenter,
  states,
  cities,
  predictions = [],
  highlightedPredictionId,
  focusCoords,
  onMapClick,
  onStateClick,
  onPredictionClick,
  onBackToWorld,
  onCoordinatesChange,
  initialPin,
  destination,
  showLines,
  showCountBadges,
}: WorldMapProps) {
  const mapRef = useRef<MapRef>(null);
  const isZoomed = selectedCountryCode !== '';
  const statesWithCoords = states.filter((s) => s.latitude && s.longitude);

  const [pin, setPin] = useState<PinPosition | null>(initialPin ?? null);
  const [lineCoords, setLineCoords] = useState<{ x1: number; y1: number; x2: number; y2: number }[]>([]);
  const [activePredictionId, setActivePredictionId] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [legendCountryCode, setLegendCountryCode] = useState<string | null>(null);

  // The active country for legend drill-down (from props or legend click)
  const activeCountryCode = selectedCountryCode || legendCountryCode || '';
  const isLegendZoomed = activeCountryCode !== '';

  // Count badges: group predictions by country (world view) or state (zoomed)
  const countBadges = useMemo(() => {
    if (!showCountBadges || predictions.length === 0) return [];

    const validPredictions = predictions.filter((p) => p.latitude && p.longitude);
    if (validPredictions.length === 0) return [];

    if (isLegendZoomed) {
      // Group by state within the active country
      const groups: Record<string, { count: number; lat: number; lng: number; label: string; code: string }> = {};
      const countryPredictions = validPredictions.filter((p) => p.countryCode === activeCountryCode);
      for (const p of countryPredictions) {
        const key = p.stateCode || p.state || 'unknown';
        if (!groups[key]) {
          groups[key] = { count: 0, lat: 0, lng: 0, label: p.state || key, code: '' };
        }
        groups[key].count++;
        groups[key].lat += parseFloat(p.latitude!);
        groups[key].lng += parseFloat(p.longitude!);
      }
      return Object.values(groups).map((g) => ({
        lat: g.lat / g.count,
        lng: g.lng / g.count,
        count: g.count,
        label: g.label,
        code: g.code,
      }));
    }

    // Group by country (world view)
    const groups: Record<string, { count: number; lat: number; lng: number; label: string; code: string }> = {};
    for (const p of validPredictions) {
      const key = p.countryCode || p.country || 'unknown';
      if (!groups[key]) {
        groups[key] = { count: 0, lat: 0, lng: 0, label: p.country || key, code: p.countryCode };
      }
      groups[key].count++;
      groups[key].lat += parseFloat(p.latitude!);
      groups[key].lng += parseFloat(p.longitude!);
    }
    return Object.values(groups).map((g) => ({
      lat: g.lat / g.count,
      lng: g.lng / g.count,
      count: g.count,
      label: g.label,
      code: g.code,
    }));
  }, [showCountBadges, predictions, isLegendZoomed, activeCountryCode]);

  // Set initial pin from pre-filled data
  useEffect(() => {
    if (initialPin) {
      setPin(initialPin);
    }
  }, [initialPin]);

  // Clear pin when country changes
  useEffect(() => {
    setPin(null);
  }, [selectedCountryCode]);

  // Fly to country when selected (from dropdown)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (countryCenter) {
      map.flyTo({
        center: [countryCenter.lng, countryCenter.lat],
        zoom: getCountryZoom(selectedCountryCode),
        duration: 1200,
      });
    } else {
      map.flyTo({
        center: [-85, 15],
        zoom: 1.5,
        duration: 800,
      });
    }
  }, [countryCenter, selectedCountryCode]);

  // Fly to state + place pin when state changes (dropdown or dot click)
  useEffect(() => {
    if (!selectedStateCode) {
      setPin(null);
      return;
    }
    const map = mapRef.current;
    const s = statesWithCoords.find((st) => st.isoCode === selectedStateCode);
    if (s?.latitude && s?.longitude) {
      const lng = parseFloat(s.longitude);
      const lat = parseFloat(s.latitude);
      setPin({ lng, lat });
      onCoordinatesChange?.(lat, lng);
      if (map) {
        map.flyTo({
          center: [lng, lat],
          zoom: Math.max(map.getZoom(), 6),
          duration: 800,
        });
      }
    }
  }, [selectedStateCode]);

  // Fly to city + move pin when city changes (dropdown or map click)
  useEffect(() => {
    if (!selectedCity || !selectedStateCode) return;
    const city = cities.find((c) => c.name === selectedCity);
    if (city?.latitude && city?.longitude) {
      const lng = parseFloat(city.longitude);
      const lat = parseFloat(city.latitude);
      setPin({ lng, lat });
      onCoordinatesChange?.(lat, lng);
      const map = mapRef.current;
      if (map) {
        map.flyTo({
          center: [lng, lat],
          zoom: Math.max(map.getZoom(), 8),
          duration: 800,
        });
      }
    }
  }, [selectedCity]);

  // Fly to focused prediction
  useEffect(() => {
    if (!focusCoords) return;
    const map = mapRef.current;
    if (map) {
      map.flyTo({
        center: [focusCoords.lng, focusCoords.lat],
        zoom: 6,
        duration: 1000,
      });
    }
  }, [focusCoords?.key]);

  // Fly to fit all predictions + destination (wait for map to be ready)
  useEffect(() => {
    if (!mapReady || !destination || predictions.length === 0) return;
    const map = mapRef.current;
    if (!map) return;

    const points = predictions
      .filter((p) => p.latitude && p.longitude)
      .map((p) => [parseFloat(p.longitude!), parseFloat(p.latitude!)] as [number, number]);
    points.push([destination.lng, destination.lat]);

    if (points.length < 2) return;

    const lngs = points.map((p) => p[0]);
    const lats = points.map((p) => p[1]);

    map.fitBounds(
      [
        [Math.min(...lngs) - 5, Math.min(...lats) - 5],
        [Math.max(...lngs) + 5, Math.max(...lats) + 5],
      ],
      { padding: 50, duration: 1500 }
    );
  }, [mapReady, destination, predictions.length]);

  // Project lat/lng to pixel coords for SVG overlay lines
  const updateLineCoords = useCallback(() => {
    const map = mapRef.current;
    if (!map || !showLines || !destination) {
      setLineCoords([]);
      return;
    }
    const destPx = map.project([destination.lng, destination.lat]);
    const coords = predictions
      .filter((p) => p.latitude && p.longitude)
      .map((p) => {
        const px = map.project([parseFloat(p.longitude!), parseFloat(p.latitude!)]);
        return { x1: px.x, y1: px.y, x2: destPx.x, y2: destPx.y };
      });
    setLineCoords(coords);
  }, [showLines, destination, predictions]);

  const handleBack = useCallback(() => {
    setPin(null);
    onBackToWorld?.();
  }, [onBackToWorld]);

  const handleClick = useCallback(
    (e: MapLayerMouseEvent) => {
      setActivePredictionId(null);
      const { lng, lat } = e.lngLat;
      setPin({ lng, lat });
      onCoordinatesChange?.(lat, lng);
      onMapClick?.(lng, lat);
    },
    [onMapClick, onCoordinatesChange]
  );

  return (
    <div className="relative overflow-hidden rounded-xl border border-rose-soft">
      {isZoomed && (
        <button
          onClick={handleBack}
          className="absolute left-3 top-3 z-10 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-navy shadow transition-colors hover:bg-gold hover:text-white"
        >
          ← Mundo
        </button>
      )}

      {/* SVG overlay for dashed lines */}
      {showLines && lineCoords.length > 0 && (
        <svg
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{ width: '100%', height: '100%' }}
        >
          {lineCoords.map((c, i) => (
            <line
              key={i}
              x1={c.x1}
              y1={c.y1}
              x2={c.x2}
              y2={c.y2}
              stroke="#1a1a1a"
              strokeWidth="3"
              strokeDasharray="8 8"
              strokeLinecap="round"
              strokeOpacity="0.85"
            />
          ))}
        </svg>
      )}

      <Map
        ref={mapRef}
        initialViewState={{
          longitude: -85,
          latitude: 15,
          zoom: 1.5,
        }}
        style={{ width: '100%', height: 420 }}
        mapStyle={MAP_STYLE}
        attributionControl={false}
        renderWorldCopies={false}
        cursor={isDragging ? 'grabbing' : 'crosshair'}
        onClick={handleClick}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setIsDragging(false)}
        onRender={updateLineCoords}
        onLoad={() => setMapReady(true)}
      >
        <NavigationControl position="bottom-right" showCompass={false} />

        {/* User-placed pin */}
        {pin && (
          <MapMarker longitude={pin.lng} latitude={pin.lat} anchor="bottom">
            <div className="flex flex-col items-center">
              <svg width="32" height="42" viewBox="0 0 32 42" fill="none">
                <path
                  d="M16 0C7.16 0 0 7.16 0 16c0 12 16 26 16 26s16-14 16-26C32 7.16 24.84 0 16 0z"
                  fill="#3B2140"
                />
                <circle cx="16" cy="15" r="6" fill="#FFF" />
                <circle cx="16" cy="15" r="3" fill="#3B2140" />
              </svg>
            </div>
          </MapMarker>
        )}

        {/* State dots: only show when zoomed AND no pin placed yet */}
        {isZoomed && !pin &&
          statesWithCoords.map((s) => (
            <MapMarker
              key={s.isoCode}
              longitude={parseFloat(s.longitude!)}
              latitude={parseFloat(s.latitude!)}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                onStateClick?.(s.isoCode);
              }}
            >
              <div className="marker-interactive group relative flex cursor-pointer flex-col items-center">
                <div className="h-2.5 w-2.5 rounded-full border-2 border-white bg-gold shadow transition-all group-hover:h-3.5 group-hover:w-3.5 group-hover:bg-gold-dark" />
                <div className="pointer-events-none absolute -top-2 z-50 -translate-y-full scale-95 opacity-0 transition-all duration-200 group-hover:scale-100 group-hover:opacity-100">
                  <div className="relative whitespace-nowrap rounded-lg border border-gold/20 bg-white px-2.5 py-1.5 shadow-lg">
                    <p className="text-[10px] font-semibold text-navy">{s.name}</p>
                    <div className="absolute -bottom-1.5 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-b border-r border-gold/20 bg-white" />
                  </div>
                </div>
              </div>
            </MapMarker>
          ))}

        {/* Prediction markers from all guesses */}
        {predictions
          .filter((p) => p.latitude && p.longitude)
          .map((p) => {
            const isHighlighted = p.id === highlightedPredictionId;
            const isActive = p.id === activePredictionId;
            return (
              <MapMarker
                key={p.id}
                longitude={parseFloat(p.longitude!)}
                latitude={parseFloat(p.latitude!)}
                anchor="bottom"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  setActivePredictionId(isActive ? null : p.id);
                  onPredictionClick?.(p);
                }}
              >
                <div className={`marker-interactive group relative flex cursor-pointer flex-col items-center ${isActive ? 'marker-active' : ''}`}>
                  <svg
                    width={isHighlighted || isActive ? 28 : 20}
                    height={isHighlighted || isActive ? 36 : 26}
                    viewBox="0 0 32 42"
                    fill="none"
                    className="transition-all duration-300"
                  >
                    <path
                      d="M16 0C7.16 0 0 7.16 0 16c0 12 16 26 16 26s16-14 16-26C32 7.16 24.84 0 16 0z"
                      fill={isHighlighted || isActive ? '#BE6B84' : '#D4849B'}
                    />
                    <circle cx="16" cy="15" r="6" fill={isHighlighted || isActive ? '#FFF' : '#FFF'} />
                  </svg>
                  {/* Tooltip */}
                  <div
                    className={`pointer-events-none absolute -top-2 z-50 -translate-y-full transition-all duration-200 ${
                      isActive ? 'scale-100 opacity-100' : 'scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100'
                    }`}
                  >
                    <div className="relative whitespace-nowrap rounded-lg border border-gold/20 bg-white px-3 py-2 shadow-lg">
                      <p className="text-xs font-bold text-navy">{p.guestName}</p>
                      <p className="mt-0.5 text-[10px] text-navy/60">
                        {p.city}{p.state ? `, ${p.state}` : ''}
                      </p>
                      {p.country && (
                        <p className="text-[9px] text-gold/70">{p.country}</p>
                      )}
                      {/* Arrow */}
                      <div className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-gold/20 bg-white" />
                    </div>
                  </div>
                </div>
              </MapMarker>
            );
          })}

        {/* Destination marker */}
        {destination && (
          <MapMarker longitude={destination.lng} latitude={destination.lat} anchor="bottom">
            <div className="flex flex-col items-center">
              <svg width="36" height="46" viewBox="0 0 32 42" fill="none">
                <path
                  d="M16 0C7.16 0 0 7.16 0 16c0 12 16 26 16 26s16-14 16-26C32 7.16 24.84 0 16 0z"
                  fill="#BE6B84"
                />
                <circle cx="16" cy="15" r="6" fill="#FFF" />
                <circle cx="16" cy="15" r="3" fill="#BE6B84" />
              </svg>
            </div>
          </MapMarker>
        )}
      </Map>

      {/* Legend overlay – bottom-left corner */}
      {countBadges.length > 0 && (
        <div className="absolute bottom-2 left-2 z-10 max-h-[45%] overflow-y-auto rounded-lg bg-white/90 px-2.5 py-2 shadow-md backdrop-blur-sm">
          {isLegendZoomed && (
            <button
              onClick={() => {
                setLegendCountryCode(null);
                const map = mapRef.current;
                if (map) {
                  map.flyTo({ center: [-85, 15], zoom: 1.5, duration: 800 });
                }
                if (isZoomed) handleBack();
              }}
              className="mb-1 text-[10px] font-medium text-gold hover:text-gold-dark"
            >
              ← Todos los paises
            </button>
          )}
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-navy/50">
            {isLegendZoomed ? 'Por estado' : 'Por pais'}
          </p>
          <div className="flex flex-col gap-1">
            {countBadges
              .sort((a, b) => b.count - a.count)
              .map((badge) => (
                <div
                  key={badge.label}
                  className={`flex items-center justify-between gap-3 rounded px-1 py-0.5 ${
                    !isLegendZoomed ? 'cursor-pointer transition-colors hover:bg-navy/10' : ''
                  }`}
                  onClick={() => {
                    if (isLegendZoomed || !badge.code) return;
                    const map = mapRef.current;
                    if (map) {
                      map.flyTo({
                        center: [badge.lng, badge.lat],
                        zoom: getCountryZoom(badge.code),
                        duration: 1200,
                      });
                    }
                    setLegendCountryCode(badge.code);
                  }}
                >
                  <span className="max-w-[100px] truncate text-[11px] text-navy/80">{badge.label}</span>
                  <span className="min-w-[18px] rounded-full bg-navy/85 px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-white">
                    {badge.count}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default WorldMap;
