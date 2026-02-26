import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Prediction {
  id: string;
  guestName: string;
  country: string;
  region: string;
  createdAt: string;
}

interface PredictionState {
  guestName: string;
  selectedCountry: string;
  selectedRegion: string;
  predictions: Prediction[];
}

function loadFromStorage(): Prediction[] {
  try {
    const stored = localStorage.getItem('predictions');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveToStorage(predictions: Prediction[]) {
  localStorage.setItem('predictions', JSON.stringify(predictions));
}

const initialState: PredictionState = {
  guestName: '',
  selectedCountry: '',
  selectedRegion: '',
  predictions: loadFromStorage(),
};

const predictionSlice = createSlice({
  name: 'prediction',
  initialState,
  reducers: {
    setGuestName(state, action: PayloadAction<string>) {
      state.guestName = action.payload;
    },
    setSelectedCountry(state, action: PayloadAction<string>) {
      state.selectedCountry = action.payload;
      state.selectedRegion = '';
    },
    setSelectedRegion(state, action: PayloadAction<string>) {
      state.selectedRegion = action.payload;
    },
    addPrediction(state) {
      const prediction: Prediction = {
        id: crypto.randomUUID(),
        guestName: state.guestName,
        country: state.selectedCountry,
        region: state.selectedRegion,
        createdAt: new Date().toISOString(),
      };
      state.predictions.push(prediction);
      saveToStorage(state.predictions);
      state.guestName = '';
      state.selectedCountry = '';
      state.selectedRegion = '';
    },
    clearPredictions(state) {
      state.predictions = [];
      localStorage.removeItem('predictions');
    },
  },
});

export const {
  setGuestName,
  setSelectedCountry,
  setSelectedRegion,
  addPrediction,
  clearPredictions,
} = predictionSlice.actions;

export default predictionSlice.reducer;
