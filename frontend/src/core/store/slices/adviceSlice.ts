import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

import api from '@/core/services/api';

export interface Advice {
  id: string;
  guestName: string;
  advice: string;
  createdAt: string;
}

interface AdviceState {
  guestName: string;
  advice: string;
  loading: boolean;
}

const initialState: AdviceState = {
  guestName: '',
  advice: '',
  loading: false,
};

export const submitAdvice = createAsyncThunk(
  'advice/submit',
  async (data: {
    name: string;
    advice: string;
    sessionId: string;
  }, { rejectWithValue }) => {
    const userRes = await api.post('/users', { name: data.name });
    const userId = userRes.data.id;

    try {
      const adviceRes = await api.post('/advice', {
        userId,
        guestName: data.name,
        advice: data.advice,
        sessionId: data.sessionId,
      });
      return adviceRes.data as Advice;
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { reason?: string } } };
      if (axiosErr.response?.status === 400 && axiosErr.response?.data?.reason) {
        return rejectWithValue(axiosErr.response.data.reason);
      }
      throw err;
    }
  }
);

const adviceSlice = createSlice({
  name: 'advice',
  initialState,
  reducers: {
    setAdviceGuestName(state, action: PayloadAction<string>) {
      state.guestName = action.payload;
    },
    setAdviceText(state, action: PayloadAction<string>) {
      state.advice = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitAdvice.pending, (state) => {
        state.loading = true;
      })
      .addCase(submitAdvice.fulfilled, (state) => {
        state.loading = false;
        state.advice = '';
      })
      .addCase(submitAdvice.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const { setAdviceGuestName, setAdviceText } = adviceSlice.actions;

export default adviceSlice.reducer;
