interface LocationSelectorProps {
  countries: { name: string; code: string }[];
  regions: string[];
  selectedCountry: string;
  selectedRegion: string;
  onCountryChange: (country: string) => void;
  onRegionChange: (region: string) => void;
}

function LocationSelector({
  countries,
  regions,
  selectedCountry,
  selectedRegion,
  onCountryChange,
  onRegionChange,
}: LocationSelectorProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label htmlFor="country" className="mb-1 block text-sm font-medium text-navy">
          País
        </label>
        <select
          id="country"
          value={selectedCountry}
          onChange={(e) => onCountryChange(e.target.value)}
          className="w-full rounded-lg border border-rose-soft bg-warm-white px-4 py-3 text-navy outline-none transition-colors focus:border-gold"
        >
          <option value="">Selecciona un país...</option>
          {countries.map((c) => (
            <option key={c.code} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="region" className="mb-1 block text-sm font-medium text-navy">
          Ciudad / Estado
        </label>
        <select
          id="region"
          value={selectedRegion}
          onChange={(e) => onRegionChange(e.target.value)}
          disabled={!selectedCountry}
          className="w-full rounded-lg border border-rose-soft bg-warm-white px-4 py-3 text-navy outline-none transition-colors focus:border-gold disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">
            {selectedCountry ? 'Selecciona una ciudad...' : 'Primero selecciona un país'}
          </option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default LocationSelector;
