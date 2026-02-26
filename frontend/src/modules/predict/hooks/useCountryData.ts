interface CountryData {
  name: string;
  code: string;
  regions: string[];
}

const countries: CountryData[] = [
  {
    name: 'Argentina',
    code: 'ARG',
    regions: ['Buenos Aires', 'Córdoba', 'Mendoza', 'Rosario', 'Salta', 'Tucumán'],
  },
  {
    name: 'Australia',
    code: 'AUS',
    regions: ['Brisbane', 'Melbourne', 'Perth', 'Sydney', 'Adelaide'],
  },
  {
    name: 'Bolivia',
    code: 'BOL',
    regions: ['Cochabamba', 'La Paz', 'Santa Cruz'],
  },
  {
    name: 'Brasil',
    code: 'BRA',
    regions: [
      'Belo Horizonte', 'Brasília', 'Campinas', 'Curitiba', 'Fortaleza',
      'Manaus', 'Porto Alegre', 'Recife', 'Rio de Janeiro', 'Salvador', 'São Paulo',
    ],
  },
  {
    name: 'Canadá',
    code: 'CAN',
    regions: ['Calgary', 'Edmonton', 'Montreal', 'Toronto', 'Vancouver', 'Winnipeg'],
  },
  {
    name: 'Chile',
    code: 'CHL',
    regions: ['Antofagasta', 'Concepción', 'Santiago', 'Viña del Mar'],
  },
  {
    name: 'Colombia',
    code: 'COL',
    regions: ['Barranquilla', 'Bogotá', 'Cali', 'Medellín'],
  },
  {
    name: 'Corea del Sur',
    code: 'KOR',
    regions: ['Busan', 'Daejeon', 'Seúl'],
  },
  {
    name: 'Costa Rica',
    code: 'CRI',
    regions: ['San José'],
  },
  {
    name: 'Ecuador',
    code: 'ECU',
    regions: ['Guayaquil', 'Quito'],
  },
  {
    name: 'El Salvador',
    code: 'SLV',
    regions: ['San Salvador'],
  },
  {
    name: 'España',
    code: 'ESP',
    regions: ['Barcelona', 'Madrid', 'Málaga'],
  },
  {
    name: 'Estados Unidos',
    code: 'USA',
    regions: [
      'Arizona', 'California', 'Colorado', 'Florida', 'Georgia', 'Idaho',
      'Illinois', 'New York', 'Ohio', 'Oregon', 'Pennsylvania', 'Texas',
      'Utah', 'Virginia', 'Washington',
    ],
  },
  {
    name: 'Filipinas',
    code: 'PHL',
    regions: ['Cebú', 'Davao', 'Manila', 'Quezon City'],
  },
  {
    name: 'Francia',
    code: 'FRA',
    regions: ['Lyon', 'Marsella', 'París'],
  },
  {
    name: 'Guatemala',
    code: 'GTM',
    regions: ['Ciudad de Guatemala', 'Quetzaltenango'],
  },
  {
    name: 'Honduras',
    code: 'HND',
    regions: ['San Pedro Sula', 'Tegucigalpa'],
  },
  {
    name: 'Italia',
    code: 'ITA',
    regions: ['Catania', 'Milán', 'Roma'],
  },
  {
    name: 'Japón',
    code: 'JPN',
    regions: ['Fukuoka', 'Kobe', 'Nagoya', 'Sapporo', 'Tokio'],
  },
  {
    name: 'México',
    code: 'MEX',
    regions: [
      'Ciudad de México', 'Guadalajara', 'Hermosillo', 'León',
      'Mérida', 'Monterrey', 'Oaxaca', 'Puebla', 'Tijuana', 'Veracruz',
    ],
  },
  {
    name: 'Nicaragua',
    code: 'NIC',
    regions: ['Managua'],
  },
  {
    name: 'Panamá',
    code: 'PAN',
    regions: ['Ciudad de Panamá'],
  },
  {
    name: 'Paraguay',
    code: 'PRY',
    regions: ['Asunción'],
  },
  {
    name: 'Perú',
    code: 'PER',
    regions: ['Arequipa', 'Cusco', 'Lima', 'Trujillo'],
  },
  {
    name: 'Portugal',
    code: 'PRT',
    regions: ['Lisboa', 'Porto'],
  },
  {
    name: 'Puerto Rico',
    code: 'PRI',
    regions: ['San Juan'],
  },
  {
    name: 'República Dominicana',
    code: 'DOM',
    regions: ['Santo Domingo'],
  },
  {
    name: 'Uruguay',
    code: 'URY',
    regions: ['Montevideo'],
  },
  {
    name: 'Venezuela',
    code: 'VEN',
    regions: ['Caracas', 'Maracaibo', 'Valencia'],
  },
];

export function useCountryData() {
  const getRegions = (countryName: string): string[] => {
    const country = countries.find((c) => c.name === countryName);
    return country?.regions ?? [];
  };

  const getCountryCode = (countryName: string): string => {
    const country = countries.find((c) => c.name === countryName);
    return country?.code ?? '';
  };

  return {
    countries,
    getRegions,
    getCountryCode,
  };
}
