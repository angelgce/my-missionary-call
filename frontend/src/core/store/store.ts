import { configureStore } from '@reduxjs/toolkit';

import predictionReducer from './slices/predictionSlice';
import adminReducer from './slices/adminSlice';
import adviceReducer from './slices/adviceSlice';

export const store = configureStore({
  reducer: {
    prediction: predictionReducer,
    admin: adminReducer,
    advice: adviceReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
