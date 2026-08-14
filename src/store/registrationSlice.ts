import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  RegistrationDetails,
  PaymentInfo,
  PendingPayment,
  RegistrationRecord,
  RegistrationStatus,
  Step,
} from '../types';

interface RegistrationState {
  step: Step;
  details: RegistrationDetails;
  payment: PaymentInfo;
  pendingPayment: PendingPayment | null;
  record: RegistrationRecord | null;
  submittedRecords: RegistrationRecord[];
  modalOpen: boolean;
}

const initialPayment: PaymentInfo = {
  method: 'mobile-money',
  provider: '',
  phoneNumber: '',
  city: '',
  address: '',
  zipCode: '',
};

const initialDetails: RegistrationDetails = {
  fullName: '',
  email: '',
  phone: '',
  gender: '',
  ageRange: '',
  country: '',
  tShirtSize: '',
  raceCategory: '',
  attendanceType: 'in-person',
  clubOrInstitution: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  medicalNotes: '',
  acceptedTerms: false,
};

const STORAGE_KEY = 'cbm2026-registration';

function loadPersistedState(): RegistrationState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error('empty');
    const parsed = JSON.parse(raw);
    return {
      step: parsed.step ?? 'details',
      details: { ...initialDetails, ...parsed.details },
      payment: { ...initialPayment, ...parsed.payment },
      pendingPayment: parsed.pendingPayment ?? null,
      record: parsed.record ?? null,
      submittedRecords: Array.isArray(parsed.submittedRecords) ? parsed.submittedRecords : [],
      modalOpen: false,
    };
  } catch {
    return {
      step: 'details',
      details: initialDetails,
      payment: { ...initialPayment },
      pendingPayment: null,
      record: null,
      submittedRecords: [],
      modalOpen: false,
    };
  }
}

const initialState: RegistrationState = loadPersistedState();

const registrationSlice = createSlice({
  name: 'registration',
  initialState,
  reducers: {
    updateDetails(state, action: PayloadAction<Partial<RegistrationDetails>>) {
      state.details = { ...state.details, ...action.payload };
    },
    updatePayment(state, action: PayloadAction<Partial<PaymentInfo>>) {
      state.payment = { ...state.payment, ...action.payload };
    },
    goToStep(state, action: PayloadAction<Step>) {
      state.step = action.payload;
    },
    setPendingPayment(state, action: PayloadAction<PendingPayment>) {
      state.pendingPayment = action.payload;
      state.step = 'processing';
    },
    clearPendingPayment(state) {
      state.pendingPayment = null;
    },
    submitRegistration(state, action: PayloadAction<{ reference: string; status: RegistrationStatus }>) {
      const record: RegistrationRecord = {
        reference: action.payload.reference,
        details: state.details,
        payment: state.payment,
        status: action.payload.status,
        submittedAt: new Date().toISOString(),
      };
      state.record = record;
      state.submittedRecords.push(record);
      state.pendingPayment = null;
      state.step = 'done';
    },
    resetRegistration(state) {
      state.step = 'details';
      state.details = initialDetails;
      state.payment = { ...initialPayment };
      state.pendingPayment = null;
      state.record = null;
    },
    openRegistrationModal(state) {
      state.modalOpen = true;
    },
    closeRegistrationModal(state) {
      state.modalOpen = false;
    },
  },
});

export const {
  updateDetails,
  updatePayment,
  goToStep,
  setPendingPayment,
  clearPendingPayment,
  submitRegistration,
  resetRegistration,
  openRegistrationModal,
  closeRegistrationModal,
} = registrationSlice.actions;
export default registrationSlice.reducer;
