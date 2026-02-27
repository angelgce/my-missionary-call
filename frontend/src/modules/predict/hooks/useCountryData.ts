import { useMemo } from 'react';

import { Country, State, City, ICountry, IState, ICity } from 'country-state-city';

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

export function useCountryData() {
  const countries = useMemo(() => {
    return Country.getAllCountries()
      .map((c: ICountry) => ({
        name: c.name,
        isoCode: c.isoCode,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const nameToCodeMap = useMemo(() => {
    const map = new Map<string, string>();
    countries.forEach((c) => {
      map.set(c.name.toLowerCase(), c.isoCode);
    });
    return map;
  }, [countries]);

  const getStates = (countryCode: string): IState[] => {
    if (!countryCode) return [];
    return State.getStatesOfCountry(countryCode);
  };

  const getCountryName = (isoCode: string): string => {
    if (!isoCode) return '';
    const country = Country.getCountryByCode(isoCode);
    return country?.name ?? '';
  };

  /**
   * Resolves a world-atlas geo.properties.name to an ISO alpha-2 code.
   */
  const resolveAtlasName = (atlasName: string): string => {
    if (!atlasName) return '';

    // Check override map first
    if (ATLAS_NAME_OVERRIDES[atlasName]) {
      return ATLAS_NAME_OVERRIDES[atlasName];
    }

    // Direct match (case-insensitive)
    const direct = nameToCodeMap.get(atlasName.toLowerCase());
    if (direct) return direct;

    // Partial match: atlas name contains library name or vice versa
    const atlasLower = atlasName.toLowerCase();
    for (const [name, code] of nameToCodeMap) {
      if (atlasLower.includes(name) || name.includes(atlasLower)) {
        return code;
      }
    }

    return '';
  };

  /**
   * Finds nearest state by searching within the top 15 closest countries.
   * Avoids bad global data (some libraries have wrong coords for distant countries)
   * while still covering large countries like Mexico whose edges are far from center.
   */
  const findNearestLocation = (
    lng: number,
    lat: number
  ): { countryCode: string; stateCode: string | null } | null => {
    const allCountries = Country.getAllCountries();

    // Top 15 countries by distance to click
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
      const states = State.getStatesOfCountry(c.code);
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
  };

  const getCities = (countryCode: string, stateCode: string): ICity[] => {
    if (!countryCode || !stateCode) return [];
    return City.getCitiesOfState(countryCode, stateCode);
  };

  /**
   * Finds the nearest city within a given country+state.
   */
  const findNearestCity = (
    countryCode: string,
    stateCode: string,
    lng: number,
    lat: number
  ): string | null => {
    const cities = City.getCitiesOfState(countryCode, stateCode);
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
  };

  return {
    countries,
    getStates,
    getCities,
    getCountryName,
    resolveAtlasName,
    findNearestLocation,
    findNearestCity,
  };
}
