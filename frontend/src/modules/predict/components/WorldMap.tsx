import { useRef, useCallback, useEffect, useState } from 'react';

import Map, {
  Marker as MapMarker,
  NavigationControl,
  type MapRef,
  type MapLayerMouseEvent,
} from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { IState, ICity } from 'country-state-city';

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
  onBackToWorld?: () => void;
  onCoordinatesChange?: (lat: number, lng: number) => void;
  initialPin?: PinPosition;
  destination?: { lat: number; lng: number };
  showLines?: boolean;
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
  onBackToWorld,
  onCoordinatesChange,
  initialPin,
  destination,
  showLines,
}: WorldMapProps) {
  const mapRef = useRef<MapRef>(null);
  const isZoomed = selectedCountryCode !== '';
  const statesWithCoords = states.filter((s) => s.latitude && s.longitude);

  const [pin, setPin] = useState<PinPosition | null>(initialPin ?? null);
  const [lineCoords, setLineCoords] = useState<{ x1: number; y1: number; x2: number; y2: number }[]>([]);

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
        center: [0, 20],
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

  // Fly to fit all predictions + destination
  useEffect(() => {
    if (!destination || predictions.length === 0) return;
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
  }, [destination, predictions.length]);

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
          longitude: 0,
          latitude: 20,
          zoom: 1.5,
        }}
        style={{ width: '100%', height: 420 }}
        mapStyle={MAP_STYLE}
        attributionControl={false}
        cursor="crosshair"
        onClick={handleClick}
        onRender={updateLineCoords}
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
                <circle cx="16" cy="15" r="6" fill="#D4849B" />
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
              <div className="group relative flex cursor-pointer flex-col items-center">
                <div className="h-2.5 w-2.5 rounded-full border-2 border-white bg-gold shadow transition-all group-hover:h-3.5 group-hover:w-3.5 group-hover:bg-gold-dark" />
                <span className="pointer-events-none absolute -top-6 whitespace-nowrap rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-medium text-navy opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                  {s.name}
                </span>
              </div>
            </MapMarker>
          ))}

        {/* Prediction markers from all guesses */}
        {predictions
          .filter((p) => p.latitude && p.longitude)
          .map((p) => {
            const isHighlighted = p.id === highlightedPredictionId;
            return (
              <MapMarker
                key={p.id}
                longitude={parseFloat(p.longitude!)}
                latitude={parseFloat(p.latitude!)}
                anchor="bottom"
              >
                <div className="group relative flex flex-col items-center">
                  <svg
                    width={isHighlighted ? 28 : 20}
                    height={isHighlighted ? 36 : 26}
                    viewBox="0 0 32 42"
                    fill="none"
                    className="transition-all duration-300"
                  >
                    <path
                      d="M16 0C7.16 0 0 7.16 0 16c0 12 16 26 16 26s16-14 16-26C32 7.16 24.84 0 16 0z"
                      fill={isHighlighted ? '#B8860B' : '#D4849B'}
                    />
                    <circle cx="16" cy="15" r="6" fill={isHighlighted ? '#FFF' : '#3B2140'} />
                  </svg>
                  <span className="pointer-events-none absolute -top-6 whitespace-nowrap rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-medium text-navy opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                    {p.guestName}: {p.city}, {p.state}
                  </span>
                </div>
              </MapMarker>
            );
          })}

        {/* Destination marker (gold) */}
        {destination && (
          <MapMarker longitude={destination.lng} latitude={destination.lat} anchor="bottom">
            <div className="flex flex-col items-center">
              <svg width="36" height="46" viewBox="0 0 32 42" fill="none">
                <path
                  d="M16 0C7.16 0 0 7.16 0 16c0 12 16 26 16 26s16-14 16-26C32 7.16 24.84 0 16 0z"
                  fill="#BF9B30"
                />
                <circle cx="16" cy="15" r="6" fill="#FFF" />
                <circle cx="16" cy="15" r="3" fill="#BF9B30" />
              </svg>
            </div>
          </MapMarker>
        )}
      </Map>
    </div>
  );
}

export default WorldMap;
