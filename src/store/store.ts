import { configureStore } from '@reduxjs/toolkit';
import registrationReducer from './registrationSlice';

const STORAGE_KEY = 'cbm2026-registration';

export const store = configureStore({
  reducer: {
    registration: registrationReducer,
  },
});

let saveTimer: ReturnType<typeof setTimeout> | null = null;
store.subscribe(() => {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store.getState().registration));
    } catch {
      // storage unavailable — ignore
    }
  }, 150);
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
