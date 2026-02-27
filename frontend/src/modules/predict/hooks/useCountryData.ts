import { useState, useEffect, useMemo, useCallback } from 'react';

import type { ICountry, IState, ICity } from 'country-state-city';

/**
 * Mapping from world-atlas geo.properties.name → ISO alpha-2 code.
 * Only needed for names that differ between world-atlas and country-state-city.
 */
const ATLAS_NAME_OVERRIDES: Record<string, string> = {
  'United States of America': 'US',
  'Dem. Rep. Congo': 'CD',
  'Central African Rep.': 'CF',
  'S. Sudan': 'SS',
  'Bosnia and Herz.': 'BA',
  'Czech Republic': 'CZ',
  'Dominican Rep.': 'DO',
  'Eq. Guinea': 'GQ',
  'eSwatini': 'SZ',
  'Falkland Is.': 'FK',
  'Fr. S. Antarctic Lands': 'TF',
  'N. Cyprus': 'CY',
  'Solomon Is.': 'SB',
  'W. Sahara': 'EH',
  'Timor-Leste': 'TL',
  'Korea': 'KR',
  'Dem. Rep. Korea': 'KP',
  "Côte d'Ivoire": 'CI',
  'Macedonia': 'MK',
  'North Macedonia': 'MK',
};

type CscModule = typeof import('country-state-city');

export function useCountryData() {
  const [csc, setCsc] = useState<CscModule | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import('country-state-city')
      .then((mod) => {
        setCsc(mod);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const countries = useMemo(() => {
    if (!csc) return [];
    return csc.Country.getAllCountries()
      .map((c: ICountry) => ({
        name: c.name,
        isoCode: c.isoCode,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [csc]);

  const nameToCodeMap = useMemo(() => {
    const map = new Map<string, string>();
    countries.forEach((c) => {
      map.set(c.name.toLowerCase(), c.isoCode);
    });
    return map;
  }, [countries]);

  const getStates = useCallback(
    (countryCode: string): IState[] => {
      if (!csc || !countryCode) return [];
      return csc.State.getStatesOfCountry(countryCode);
    },
    [csc]
  );

  const getCountryName = useCallback(
    (isoCode: string): string => {
      if (!csc || !isoCode) return '';
      const country = csc.Country.getCountryByCode(isoCode);
      return country?.name ?? '';
    },
    [csc]
  );

  const getCountryCenter = useCallback(
    (isoCode: string): { lat: number; lng: number } | null => {
      if (!csc || !isoCode) return null;
      const c = csc.Country.getCountryByCode(isoCode);
      if (!c?.latitude || !c?.longitude) return null;
      return { lat: parseFloat(c.latitude), lng: parseFloat(c.longitude) };
    },
    [csc]
  );

  const getStateName = useCallback(
    (stateCode: string, countryCode: string): string => {
      if (!csc || !stateCode || !countryCode) return stateCode;
      const stateObj = csc.State.getStateByCodeAndCountry(stateCode, countryCode);
      return stateObj?.name ?? stateCode;
    },
    [csc]
  );

  const resolveAtlasName = useCallback(
    (atlasName: string): string => {
      if (!atlasName) return '';

      if (ATLAS_NAME_OVERRIDES[atlasName]) {
        return ATLAS_NAME_OVERRIDES[atlasName];
      }

      const direct = nameToCodeMap.get(atlasName.toLowerCase());
      if (direct) return direct;

      const atlasLower = atlasName.toLowerCase();
      for (const [name, code] of nameToCodeMap) {
        if (atlasLower.includes(name) || name.includes(atlasLower)) {
          return code;
        }
      }

      return '';
    },
    [nameToCodeMap]
  );

  const findNearestLocation = useCallback(
    (
      lng: number,
      lat: number
    ): { countryCode: string; stateCode: string | null } | null => {
      if (!csc) return null;
      const allCountries = csc.Country.getAllCountries();

      const candidates = allCountries
        .filter((c) => c.latitude && c.longitude)
        .map((c) => ({
          code: c.isoCode,
          dist:
            (lat - parseFloat(c.latitude!)) ** 2 +
            (lng - parseFloat(c.longitude!)) ** 2,
        }))
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 15);

      if (candidates.length === 0) return null;

      let bestCountry = candidates[0].code;
      let bestState: string | null = null;
      let bestDist = Infinity;

      for (const c of candidates) {
        const states = csc.State.getStatesOfCountry(c.code);
        for (const s of states) {
          if (!s.latitude || !s.longitude) continue;
          const dist =
            (lat - parseFloat(s.latitude)) ** 2 +
            (lng - parseFloat(s.longitude)) ** 2;
          if (dist < bestDist) {
            bestDist = dist;
            bestCountry = c.code;
            bestState = s.isoCode;
          }
        }
      }

      return { countryCode: bestCountry, stateCode: bestState };
    },
    [csc]
  );

  const getCities = useCallback(
    (countryCode: string, stateCode: string): ICity[] => {
      if (!csc || !countryCode || !stateCode) return [];
      return csc.City.getCitiesOfState(countryCode, stateCode);
    },
    [csc]
  );

  const findNearestCity = useCallback(
    (
      countryCode: string,
      stateCode: string,
      lng: number,
      lat: number
    ): string | null => {
      if (!csc) return null;
      const cities = csc.City.getCitiesOfState(countryCode, stateCode);
      let bestName: string | null = null;
      let bestDist = Infinity;

      for (const c of cities) {
        if (!c.latitude || !c.longitude) continue;
        const dist =
          (lat - parseFloat(c.latitude)) ** 2 +
          (lng - parseFloat(c.longitude)) ** 2;
        if (dist < bestDist) {
          bestDist = dist;
          bestName = c.name;
        }
      }

      return bestName;
    },
    [csc]
  );

  return {
    loading,
    countries,
    getStates,
    getCities,
    getCountryName,
    getCountryCenter,
    getStateName,
    resolveAtlasName,
    findNearestLocation,
    findNearestCity,
  };
}
