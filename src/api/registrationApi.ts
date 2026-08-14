import type { RegistrationDetails, RegistrationRecord } from '../types';

/**
 * ---------------------------------------------------------------------------
 * BACKEND INTEGRATION LAYER — wired to the Django REST API
 * ---------------------------------------------------------------------------
 * Configure these in a .env file at the project root:
 *   VITE_API_BASE_URL=http://localhost:8000   (or `same-origin` in production)
 *   VITE_EVENT_ID=<uuid printed by `python manage.py seed_copperbelt_marathon`>
 * ---------------------------------------------------------------------------
 */

// `same-origin` (what the production deploy sets) resolves to an empty
// base, so every request below becomes a relative URL served by the same
// Caddy that served this page — works on localhost or any server IP with
// no rebuild, and no CORS. Unset means `npm run dev`, where the backend is
// a separate process on :8000.
const rawApiBase = import.meta.env.VITE_API_BASE_URL;
const API_BASE_URL =
  rawApiBase === 'same-origin'
    ? ''
    : rawApiBase
      ? rawApiBase.replace(/\/+$/, '')
      : 'http://localhost:8000';
const EVENT_ID = import.meta.env.VITE_EVENT_ID || '';

export interface BackendCategory {
  id: string;
  name: string;
  code: string;
  price: string | number;
  currency: string;
}

interface BackendForm {
  id: string;
  event: string;
  categories: BackendCategory[];
}

let categoriesPromise: Promise<BackendCategory[]> | null = null;

function loadCategories(): Promise<BackendCategory[]> {
  if (!categoriesPromise) {
    categoriesPromise = fetch(`${API_BASE_URL}/api/v1/registrations/public/events/${EVENT_ID}/form/`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load race categories');
        return res.json() as Promise<BackendForm>;
      })
      .then((form) => form.categories)
      .catch((err) => {
        // Reset the cache on failure so a retry is possible instead of
        // permanently caching a rejected promise.
        categoriesPromise = null;
        throw err;
      });
  }
  return categoriesPromise;
}

/**
 * Fetch every race category with its live price — used by the Home and
 * Races pages so displayed fees always come from the backend rather than
 * a value baked into the frontend bundle.
 */
export async function fetchRaceCategories(): Promise<BackendCategory[]> {
  return loadCategories();
}

/**
 * Fetch the entry fee for a single race category. The backend is the
 * source of truth for pricing — this never trusts a client-side number.
 * Custom-priced categories (price = 0 in the backend, meaning "contact
 * us") resolve to null so the UI shows "Custom pricing" instead of K0.
 */
export async function fetchRaceFee(categoryValue: string): Promise<number | null> {
  const categories = await loadCategories();
  const category = categories.find((c) => c.code === categoryValue);
  if (!category) return null;
  const price = Number(category.price);
  return price > 0 ? price : null;
}

export interface SubmitRegistrationResult {
  registrationId: string;
  reference: string;
  amount: number | null;
  currency: string;
}

function splitName(fullName: string): { first_name: string; last_name: string } {
  const trimmed = fullName.trim();
  const spaceIndex = trimmed.indexOf(' ');
  if (spaceIndex === -1) return { first_name: trimmed, last_name: '' };
  return {
    first_name: trimmed.slice(0, spaceIndex),
    last_name: trimmed.slice(spaceIndex + 1),
  };
}

/** Step 1 of checkout: create the registration (no payment yet). */
export async function submitRegistrationDetails(
  details: RegistrationDetails
): Promise<SubmitRegistrationResult> {
  const categories = await loadCategories();
  const category = categories.find((c) => c.code === details.raceCategory);

  if (!category) {
    throw new Error('Unknown race category — please reselect and try again.');
  }

  const createRes = await fetch(
    `${API_BASE_URL}/api/v1/registrations/public/events/${EVENT_ID}/registrations/`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category_id: category.id,
        participant: {
          ...splitName(details.fullName),
          email: details.email,
          phone: details.phone,
        },
        form_data: {
          gender: details.gender,
          age_range: details.ageRange,
          country: details.country,
          tshirt_size: details.tShirtSize,
          attendance_type: details.attendanceType,
          club_or_institution: details.clubOrInstitution,
          emergency_contact_name: details.emergencyContactName,
          emergency_contact_phone: details.emergencyContactPhone,
          medical_notes: details.medicalNotes,
        },
      }),
    }
  );

  if (!createRes.ok) {
    const errorBody = await createRes.json().catch(() => ({}));
    throw new Error(
      errorBody?.detail || 'Could not submit your registration. Please check your details and try again.'
    );
  }

  const createData = await createRes.json();
  const registration = createData.registration;

  return {
    registrationId: registration.id,
    reference: registration.registration_number,
    amount: Number(registration.amount) || null,
    currency: registration.currency || 'ZMW',
  };
}

export interface InitiatePaymentParams {
  registrationId: string;
  paymentMethod: 'MTN_MONEY' | 'AIRTEL_MONEY' | 'ZAMTEL_KWACHA' | 'CARD';
  phoneNumber?: string;
  city?: string;
  address?: string;
  zipCode?: string;
  backUrl?: string;
}

export interface InitiatePaymentResult {
  paymentId: string;
  status: string;
  /** Card only — the Lipila-hosted checkout page to send the browser to. */
  redirectUrl: string;
}

/**
 * Step 2 of checkout: start payment on an already-created registration.
 *  - Mobile money (MTN/Airtel/Zamtel): sends a Lipila collection request,
 *    which triggers a PIN prompt on the runner's phone. Resolves with the
 *    payment's initial status (typically "PROCESSING") — the caller
 *    should poll `checkPaymentStatus` until it settles.
 *  - Card: sends a Lipila collection request and resolves with a
 *    `redirectUrl` — the caller must navigate the browser there (Lipila's
 *    own PCI-compliant hosted checkout; we never touch the card number).
 */
export async function initiatePayment(
  params: InitiatePaymentParams
): Promise<InitiatePaymentResult> {
  const payRes = await fetch(
    `${API_BASE_URL}/api/v1/payments/public/registrations/${params.registrationId}/pay/`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payment_method: params.paymentMethod,
        phone_number: params.phoneNumber || '',
        city: params.city || '',
        address: params.address || '',
        zip_code: params.zipCode || '',
        back_url: params.backUrl || '',
      }),
    }
  );

  if (!payRes.ok) {
    const errorBody = await payRes.json().catch(() => ({}));
    const detail =
      errorBody?.detail ||
      errorBody?.phone_number?.[0] ||
      errorBody?.city?.[0] ||
      errorBody?.address?.[0] ||
      errorBody?.zip_code?.[0] ||
      'Registration was saved, but starting payment failed. Please try again.';
    throw new Error(detail);
  }

  const payData = await payRes.json();

  return {
    paymentId: payData.payment.id,
    status: payData.payment.status,
    redirectUrl: payData.payment.redirect_url || '',
  };
}

export interface PaymentStatusResult {
  status: string;
  registrationStatus: string;
}

/** Polled by the "check your phone" screen until the Lipila collection
 * settles (or the caller gives up waiting). */
export async function checkPaymentStatus(paymentId: string): Promise<PaymentStatusResult> {
  const res = await fetch(`${API_BASE_URL}/api/v1/payments/public/payments/${paymentId}/status/`);
  if (!res.ok) throw new Error('Could not check payment status.');
  const data = await res.json();
  return { status: data.status, registrationStatus: data.registration_status };
}

/**
 * Look up a registration by reference number or email via the backend's
 * public lookup endpoint. `localRecords` is unused now (kept only so the
 * call signature in TrackRegistration.tsx doesn't need to change).
 */
export async function searchRegistration(
  query: string,
  _localRecords: RegistrationRecord[]
): Promise<RegistrationRecord | null> {
  const res = await fetch(
    `${API_BASE_URL}/api/v1/registrations/public/lookup/?q=${encodeURIComponent(query)}`
  );

  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Search failed. Please try again.');

  const data = await res.json();

  // Adapt the backend's lookup response into the shape the UI expects.
  return {
    reference: data.reference,
    status: data.status === 'CONFIRMED' ? 'confirmed' : 'pending-bank-transfer',
    submittedAt: data.submitted_at,
    details: {
      fullName: data.full_name,
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
      acceptedTerms: true,
    },
    payment: { method: 'mobile-money' },
  } as RegistrationRecord;
}
