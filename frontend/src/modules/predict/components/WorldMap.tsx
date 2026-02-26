import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

interface WorldMapProps {
  selectedCountryCode: string;
  onCountrySelect?: (countryName: string) => void;
}

function WorldMap({ selectedCountryCode, onCountrySelect }: WorldMapProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-rose-soft bg-warm-white">
      <ComposableMap
        projectionConfig={{ scale: 147 }}
        className="h-auto w-full"
      >
        <ZoomableGroup center={[0, 20]} zoom={1}>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const isSelected = geo.properties.ISO_A3 === selectedCountryCode;
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => onCountrySelect?.(geo.properties.NAME)}
                    style={{
                      default: {
                        fill: isSelected ? '#D4849B' : '#F8E0E8',
                        stroke: '#FFF8FA',
                        strokeWidth: 0.5,
                        outline: 'none',
                      },
                      hover: {
                        fill: isSelected ? '#BE6B84' : '#F0CCD7',
                        stroke: '#FFF8FA',
                        strokeWidth: 0.5,
                        outline: 'none',
                        cursor: 'pointer',
                      },
                      pressed: {
                        fill: '#BE6B84',
                        stroke: '#FFF8FA',
                        strokeWidth: 0.5,
                        outline: 'none',
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
}

export default WorldMap;
