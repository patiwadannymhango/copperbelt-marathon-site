/**
 * ---------------------------------------------------------------------------
 * VENDOR / EXHIBITOR REGISTRATION — a separate event from the runner
 * registration (see backend seed_vendor_registration), so this is a
 * parallel, self-contained API module rather than extending
 * registrationApi.ts — the two have nothing in common field-wise.
 * ---------------------------------------------------------------------------
 */

const rawApiBase = import.meta.env.VITE_API_BASE_URL;
const API_BASE_URL =
  rawApiBase === 'same-origin'
    ? ''
    : rawApiBase
      ? rawApiBase.replace(/\/+$/, '')
      : 'http://localhost:8000';

// Falls back to the real production vendor event if the env var isn't set
// (e.g. Vercel project settings not updated yet) — this id isn't
// sensitive, it's just a UUID visible in any API response.
const VENDOR_EVENT_ID = import.meta.env.VITE_VENDOR_EVENT_ID || '06c27591-74d3-4f9c-8690-9c9021b2600e';

export interface VendorCategory {
  id: string;
  name: string;
  code: string;
  price: string | number;
  currency: string;
}

let categoriesPromise: Promise<VendorCategory[]> | null = null;

function loadCategories(): Promise<VendorCategory[]> {
  if (!categoriesPromise) {
    categoriesPromise = fetch(`${API_BASE_URL}/api/v1/registrations/public/events/${VENDOR_EVENT_ID}/form/`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load vendor categories.');
        return res.json();
      })
      .then((form) => form.categories as VendorCategory[])
      .catch((err) => {
        categoriesPromise = null;
        throw err;
      });
  }
  return categoriesPromise;
}

export async function fetchVendorCategories(): Promise<VendorCategory[]> {
  return loadCategories();
}

export interface VendorDetails {
  businessName: string;
  contactPerson: string;
  phone: string;
  email: string;
  businessLocation: string;
  productsServices: string;
  category: string; // category code
  requirement: string;
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

export interface SubmitVendorResult {
  registrationId: string;
  reference: string;
  amount: number;
  currency: string;
  status: string;
}

/** Step 1: create the vendor registration. If the chosen category is free
 * (e.g. Official Sponsor), the backend confirms it immediately — the
 * caller should check `status` and skip the payment step when it's
 * already "CONFIRMED". */
export async function submitVendorRegistration(details: VendorDetails): Promise<SubmitVendorResult> {
  const categories = await loadCategories();
  const category = categories.find((c) => c.code === details.category);

  if (!category) {
    throw new Error('Unknown category — please reselect and try again.');
  }

  const res = await fetch(
    `${API_BASE_URL}/api/v1/registrations/public/events/${VENDOR_EVENT_ID}/registrations/`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category_id: category.id,
        participant: {
          ...splitName(details.contactPerson),
          email: details.email,
          phone: details.phone,
        },
        form_data: {
          business_name: details.businessName,
          business_location: details.businessLocation,
          products_services: details.productsServices,
          requirement: details.requirement,
        },
      }),
    }
  );

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(
      errorBody?.detail || 'Could not submit your registration. Please check your details and try again.'
    );
  }

  const data = await res.json();
  const registration = data.registration;

  return {
    registrationId: registration.id,
    reference: registration.registration_number,
    amount: Number(registration.amount) || 0,
    currency: registration.currency || 'ZMW',
    status: registration.status,
  };
}

export interface InitiateVendorPaymentParams {
  registrationId: string;
  paymentMethod: 'MTN_MONEY' | 'AIRTEL_MONEY' | 'ZAMTEL_KWACHA' | 'CARD';
  phoneNumber?: string;
  city?: string;
  address?: string;
  zipCode?: string;
  backUrl?: string;
}

export interface InitiateVendorPaymentResult {
  paymentId: string;
  status: string;
  redirectUrl: string;
}

/** Step 2: start payment on an already-created registration — mirrors
 * the runner flow exactly (same Lipila collection request under the
 * hood). Only called for paid categories. */
export async function initiateVendorPayment(
  params: InitiateVendorPaymentParams
): Promise<InitiateVendorPaymentResult> {
  const res = await fetch(
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

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const detail =
      errorBody?.detail ||
      errorBody?.phone_number?.[0] ||
      errorBody?.city?.[0] ||
      errorBody?.address?.[0] ||
      errorBody?.zip_code?.[0] ||
      'Registration was saved, but starting payment failed. Please try again.';
    throw new Error(detail);
  }

  const data = await res.json();

  return {
    paymentId: data.payment.id,
    status: data.payment.status,
    redirectUrl: data.payment.redirect_url || '',
  };
}

export interface VendorPaymentStatusResult {
  status: string;
  registrationStatus: string;
}

export async function checkVendorPaymentStatus(paymentId: string): Promise<VendorPaymentStatusResult> {
  const res = await fetch(`${API_BASE_URL}/api/v1/payments/public/payments/${paymentId}/status/`);
  if (!res.ok) throw new Error('Could not check payment status.');
  const data = await res.json();
  return { status: data.status, registrationStatus: data.registration_status };
}
