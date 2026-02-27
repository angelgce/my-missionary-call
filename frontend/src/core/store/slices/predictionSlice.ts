import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

import api from '@/core/services/api';
import { getSessionId } from '@/core/utils/session';

export interface Prediction {
  id: string;
  guestName: string;
  country: string;
  countryCode: string;
  state: string;
  stateCode: string;
  city: string;
  latitude?: string | null;
  longitude?: string | null;
  createdAt: string;
}

interface PredictionState {
  guestName: string;
  selectedCountryCode: string;
  selectedStateCode: string;
  selectedCity: string;
  /** world-atlas name for map highlighting */
  selectedAtlasName: string;
  latitude: string | null;
  longitude: string | null;
  predictions: Prediction[];
  loading: boolean;
  prefilled: boolean;
  myPredictionId: string | null;
}

const initialState: PredictionState = {
  guestName: '',
  selectedCountryCode: '',
  selectedStateCode: '',
  selectedCity: '',
  selectedAtlasName: '',
  latitude: null,
  longitude: null,
  predictions: [],
  loading: false,
  prefilled: false,
  myPredictionId: null,
};

export const fetchPredictions = createAsyncThunk(
  'prediction/fetchAll',
  async () => {
    const response = await api.get('/predictions');
    return response.data as Prediction[];
  }
);

export const fetchMyPrediction = createAsyncThunk(
  'prediction/fetchMine',
  async (sessionId: string) => {
    const response = await api.get(`/predictions/session/${sessionId}`);
    return response.data as Prediction;
  }
);

export const submitPrediction = createAsyncThunk(
  'prediction/submit',
  async (data: {
    name: string;
    country: string;
    countryCode: string;
    state: string;
    stateCode: string;
    city: string;
    sessionId: string;
    latitude?: string | null;
    longitude?: string | null;
  }) => {
    // Create or get user by IP
    const userRes = await api.post('/users', { name: data.name });
    const userId = userRes.data.id;

    // Create or update prediction
    const predRes = await api.post('/predictions', {
      userId,
      guestName: data.name,
      country: data.country,
      countryCode: data.countryCode,
      state: data.state,
      stateCode: data.stateCode,
      city: data.city,
      sessionId: data.sessionId,
      latitude: data.latitude ?? undefined,
      longitude: data.longitude ?? undefined,
    });

    return { ...predRes.data, guestName: data.name } as Prediction;
  }
);

const predictionSlice = createSlice({
  name: 'prediction',
  initialState,
  reducers: {
    setGuestName(state, action: PayloadAction<string>) {
      state.guestName = action.payload;
    },
    setSelectedCountry(
      state,
      action: PayloadAction<{ countryCode: string; atlasName?: string }>
    ) {
      state.selectedCountryCode = action.payload.countryCode;
      state.selectedAtlasName = action.payload.atlasName ?? '';
      state.selectedStateCode = '';
      state.selectedCity = '';
      state.latitude = null;
      state.longitude = null;
    },
    setSelectedState(state, action: PayloadAction<string>) {
      state.selectedStateCode = action.payload;
      state.selectedCity = '';
    },
    setSelectedCity(state, action: PayloadAction<string>) {
      state.selectedCity = action.payload;
    },
    setCoordinates(state, action: PayloadAction<{ lat: string; lng: string }>) {
      state.latitude = action.payload.lat;
      state.longitude = action.payload.lng;
    },
    clearForm(state) {
      state.guestName = '';
      state.selectedCountryCode = '';
      state.selectedStateCode = '';
      state.selectedCity = '';
      state.selectedAtlasName = '';
      state.latitude = null;
      state.longitude = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPredictions.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPredictions.fulfilled, (state, action) => {
        state.loading = false;
        state.predictions = action.payload;
      })
      .addCase(fetchPredictions.rejected, (state) => {
        state.loading = false;
      })
      .addCase(fetchMyPrediction.fulfilled, (state, action) => {
        const p = action.payload;
        state.guestName = p.guestName;
        state.selectedCountryCode = p.countryCode;
        state.selectedStateCode = p.stateCode;
        state.selectedCity = p.city;
        state.latitude = p.latitude ?? null;
        state.longitude = p.longitude ?? null;
        state.prefilled = true;
        state.myPredictionId = p.id;
      })
      .addCase(submitPrediction.fulfilled, (state, action) => {
        // Don't clear form on upsert — user may want to update again
        state.prefilled = true;
        state.myPredictionId = action.payload.id;
      });
  },
});

export const {
  setGuestName,
  setSelectedCountry,
  setSelectedState,
  setSelectedCity,
  setCoordinates,
  clearForm,
} = predictionSlice.actions;

export default predictionSlice.reducer;
