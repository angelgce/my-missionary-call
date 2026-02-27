import type { IState, ICity } from 'country-state-city';

interface LocationSelectorProps {
  countries: { name: string; isoCode: string }[];
  states: IState[];
  cities: ICity[];
  selectedCountryCode: string;
  selectedStateCode: string;
  selectedCity: string;
  onCountryChange: (countryCode: string) => void;
  onStateChange: (stateCode: string) => void;
  onCityChange: (cityName: string) => void;
  errors?: { country: boolean; state: boolean; city: boolean };
}

function LocationSelector({
  countries,
  states,
  cities,
  selectedCountryCode,
  selectedStateCode,
  selectedCity,
  onCountryChange,
  onStateChange,
  onCityChange,
  errors,
}: LocationSelectorProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label htmlFor="country" className="mb-1 block text-sm font-medium text-navy">
          País
        </label>
        <select
          id="country"
          value={selectedCountryCode}
          onChange={(e) => onCountryChange(e.target.value)}
          className={`w-full rounded-lg border bg-warm-white px-4 py-3 text-navy outline-none transition-colors focus:border-gold ${errors?.country ? 'border-red-400' : 'border-rose-soft'}`}
        >
          <option value="">Selecciona un país...</option>
          {countries.map((c) => (
            <option key={c.isoCode} value={c.isoCode}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="state" className="mb-1 block text-sm font-medium text-navy">
          Estado / Región
        </label>
        <select
          id="state"
          value={selectedStateCode}
          onChange={(e) => onStateChange(e.target.value)}
          disabled={!selectedCountryCode}
          className={`w-full rounded-lg border bg-warm-white px-4 py-3 text-navy outline-none transition-colors focus:border-gold disabled:cursor-not-allowed disabled:opacity-50 ${errors?.state ? 'border-red-400' : 'border-rose-soft'}`}
        >
          <option value="">
            {selectedCountryCode ? 'Selecciona un estado...' : 'Primero selecciona un país'}
          </option>
          {states.map((s) => (
            <option key={s.isoCode} value={s.isoCode}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="city" className="mb-1 block text-sm font-medium text-navy">
          Ciudad
        </label>
        <select
          id="city"
          value={selectedCity}
          onChange={(e) => onCityChange(e.target.value)}
          disabled={!selectedStateCode}
          className={`w-full rounded-lg border bg-warm-white px-4 py-3 text-navy outline-none transition-colors focus:border-gold disabled:cursor-not-allowed disabled:opacity-50 ${errors?.city ? 'border-red-400' : 'border-rose-soft'}`}
        >
          <option value="">
            {selectedStateCode ? 'Selecciona una ciudad...' : 'Primero selecciona un estado'}
          </option>
          {cities.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default LocationSelector;
