import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  RegistrationDetails,
  PaymentInfo,
  PendingPayment,
  RegistrationRecord,
  RegistrationStatus,
  Step,
} from '../types';

interface ActiveRegistration {
  id: string;
  reference: string;
  amount: number | null;
  currency: string;
}

interface RegistrationState {
  step: Step;
  details: RegistrationDetails;
  payment: PaymentInfo;
  pendingPayment: PendingPayment | null;
  // The registration created by the first payment attempt for the current
  // details — kept around (separate from pendingPayment, which only
  // covers one in-flight attempt) so that clicking "Try again" after a
  // failed payment retries against this same registration instead of
  // creating a new one every time. Only cleared when the runner goes back
  // to "details" (where they could change category/amount) or completes.
  activeRegistration: ActiveRegistration | null;
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
      activeRegistration: parsed.activeRegistration ?? null,
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
      activeRegistration: null,
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
      // Going back to "details" means the runner might change category
      // (and therefore the amount) — the registration already created for
      // the old details would no longer be valid, so drop it rather than
      // risk retrying payment against stale amount/category.
      if (action.payload === 'details') {
        state.activeRegistration = null;
      }
      state.step = action.payload;
    },
    setActiveRegistration(state, action: PayloadAction<ActiveRegistration>) {
      state.activeRegistration = action.payload;
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
        amount: state.pendingPayment?.amount ?? null,
        currency: state.pendingPayment?.currency ?? '',
      };
      state.record = record;
      state.submittedRecords.push(record);
      state.pendingPayment = null;
      state.activeRegistration = null;
      state.step = 'done';
    },
    resetRegistration(state) {
      state.step = 'details';
      state.details = initialDetails;
      state.payment = { ...initialPayment };
      state.pendingPayment = null;
      state.activeRegistration = null;
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
  setActiveRegistration,
  setPendingPayment,
  clearPendingPayment,
  submitRegistration,
  resetRegistration,
  openRegistrationModal,
  closeRegistrationModal,
} = registrationSlice.actions;
export default registrationSlice.reducer;
