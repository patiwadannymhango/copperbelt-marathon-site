import { useEffect, useRef, useState } from 'react';
import {
  fetchVendorCategories,
  submitVendorRegistration,
  initiateVendorPayment,
  checkVendorPaymentStatus,
  type VendorCategory,
  type VendorDetails,
} from '../api/vendorApi';
import { MtnLogo, AirtelLogo, ZamtelLogo, VisaLogo, MastercardLogo, AmexLogo, CardLogo } from '../components/PaymentLogos';
import Spinner from '../components/Spinner';

const REQUIREMENTS = [
  'Exhibition Space',
  'Vendor Stall',
  'Food & Beverage Stall',
  'Corporate Activation',
  'Branding / Promotional Space',
  'Other',
];

const PROVIDERS: { value: 'MTN_MONEY' | 'AIRTEL_MONEY' | 'ZAMTEL_KWACHA'; label: string; Logo: typeof MtnLogo }[] = [
  { value: 'MTN_MONEY', label: 'MTN', Logo: MtnLogo },
  { value: 'AIRTEL_MONEY', label: 'Airtel', Logo: AirtelLogo },
  { value: 'ZAMTEL_KWACHA', label: 'Zamtel', Logo: ZamtelLogo },
];

const STORAGE_KEY = 'cbm2026-vendor-pending';
const POLL_INTERVAL_MS = 3000;
const TIMEOUT_MS: Record<'mobile-money' | 'card', number> = {
  'mobile-money': 90000,
  card: 150000,
};

interface PendingPayment {
  paymentId: string;
  reference: string;
  amount: number;
  currency: string;
  method: 'mobile-money' | 'card';
  provider: string;
  phoneNumber: string;
}

type Step = 'details' | 'payment' | 'processing' | 'done';

const initialDetails: VendorDetails = {
  businessName: '',
  contactPerson: '',
  phone: '',
  email: '',
  businessLocation: '',
  productsServices: '',
  category: '',
  requirement: '',
};

function loadPendingPayment(): PendingPayment | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function Vendors() {
  const [categories, setCategories] = useState<VendorCategory[] | null>(null);
  const [details, setDetails] = useState<VendorDetails>(initialDetails);
  const [step, setStep] = useState<Step>('details');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<'mobile-money' | 'card'>('mobile-money');
  const [provider, setProvider] = useState<'MTN_MONEY' | 'AIRTEL_MONEY' | 'ZAMTEL_KWACHA' | ''>('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [registrationId, setRegistrationId] = useState('');

  const [pending, setPending] = useState<PendingPayment | null>(() => loadPendingPayment());
  const [elapsed, setElapsed] = useState(0);
  const [outcome, setOutcome] = useState<'waiting' | 'failed' | 'timeout'>('waiting');
  const startRef = useRef(0);

  useEffect(() => {
    fetchVendorCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  // Resume the "processing" step if a card payment redirected the browser
  // away to Lipila's hosted checkout and back — mirrors the runner flow's
  // localStorage persistence for exactly the same reason.
  useEffect(() => {
    if (pending) {
      setStep('processing');
      setReference(pending.reference);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (pending) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [pending]);

  useEffect(() => {
    if (!pending || outcome !== 'waiting') return;

    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout>;
    const timeoutMs = TIMEOUT_MS[pending.method];
    startRef.current = Date.now();

    const tickTimer = setInterval(() => {
      if (!cancelled) setElapsed(Date.now() - startRef.current);
    }, 1000);

    async function poll() {
      if (cancelled) return;
      try {
        const result = await checkVendorPaymentStatus(pending!.paymentId);
        if (cancelled) return;
        if (result.status === 'SUCCESS') {
          setStep('done');
          setPending(null);
          return;
        }
        if (result.status === 'FAILED' || result.status === 'CANCELLED') {
          setOutcome('failed');
          return;
        }
      } catch {
        // Transient network hiccup — keep polling.
      }
      if (Date.now() - startRef.current >= timeoutMs) {
        setOutcome('timeout');
        return;
      }
      pollTimer = setTimeout(poll, POLL_INTERVAL_MS);
    }

    poll();
    return () => {
      cancelled = true;
      clearInterval(tickTimer);
      clearTimeout(pollTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, outcome]);

  const selectedCategory = categories?.find((c) => c.code === details.category);
  const amount = selectedCategory ? Number(selectedCategory.price) : null;
  const isFree = selectedCategory ? Number(selectedCategory.price) <= 0 : false;

  function update<K extends keyof VendorDetails>(key: K, value: VendorDetails[K]) {
    setDetails((d) => ({ ...d, [key]: value }));
  }

  async function handleDetailsSubmit() {
    setError('');
    if (
      !details.businessName ||
      !details.contactPerson ||
      !details.phone ||
      !details.email ||
      !details.businessLocation ||
      !details.productsServices ||
      !details.category ||
      !details.requirement
    ) {
      setError('Please fill in every field.');
      return;
    }

    setSubmitting(true);
    try {
      const registration = await submitVendorRegistration(details);
      setReference(registration.reference);
      setRegistrationId(registration.registrationId);
      setPhoneNumber(details.phone);

      if (registration.status === 'CONFIRMED') {
        // Free category (e.g. Official Sponsor) — the backend confirms
        // on creation, nothing to pay.
        setStep('done');
      } else {
        setStep('payment');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePaySubmit() {
    setError('');
    if (paymentMethod === 'mobile-money' && !provider) {
      setError('Please choose MTN, Airtel or Zamtel to receive the payment prompt.');
      return;
    }
    if (paymentMethod === 'mobile-money' && !phoneNumber.trim()) {
      setError('Please enter the phone number that will receive the payment prompt.');
      return;
    }
    if (paymentMethod === 'card' && (!city.trim() || !address.trim() || !zipCode.trim())) {
      setError('Please fill in your billing city, address and postal code.');
      return;
    }

    setSubmitting(true);
    try {
      if (paymentMethod === 'card') {
        const backUrl = `${window.location.origin}${import.meta.env.BASE_URL}vendors`;
        const pay = await initiateVendorPayment({
          registrationId,
          paymentMethod: 'CARD',
          city,
          address,
          zipCode,
          backUrl,
        });
        setPending({
          paymentId: pay.paymentId,
          reference,
          amount: amount ?? 0,
          currency: selectedCategory?.currency ?? 'ZMW',
          method: 'card',
          provider: '',
          phoneNumber: '',
        });
        setStep('processing');
        if (pay.redirectUrl) {
          window.location.href = pay.redirectUrl;
          return;
        }
      } else {
        const pay = await initiateVendorPayment({
          registrationId,
          paymentMethod: provider as 'MTN_MONEY' | 'AIRTEL_MONEY' | 'ZAMTEL_KWACHA',
          phoneNumber,
        });
        setPending({
          paymentId: pay.paymentId,
          reference,
          amount: amount ?? 0,
          currency: selectedCategory?.currency ?? 'ZMW',
          method: 'mobile-money',
          provider,
          phoneNumber,
        });
        setStep('processing');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong submitting payment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleTryAgain() {
    setPending(null);
    setOutcome('waiting');
    setStep('payment');
  }

  function handleKeepWaiting() {
    setElapsed(0);
    setOutcome('waiting');
  }

  function handleStartOver() {
    setDetails(initialDetails);
    setStep('details');
    setReference('');
    setPending(null);
    setOutcome('waiting');
  }

  const ProcLogo = pending?.method === 'card' ? CardLogo : PROVIDERS.find((p) => p.value === pending?.provider)?.Logo;
  const timeoutMs = TIMEOUT_MS[pending?.method ?? 'mobile-money'];
  const progressPct = Math.min(100, (elapsed / timeoutMs) * 100);
  const seconds = Math.floor(elapsed / 1000);

  return (
    <main>
      <section className="page-hero">
        <div className="eyebrow">Vendors &amp; Exhibitors</div>
        <h1>Register your business</h1>
        <p className="lede">
          Secure a stall, exhibition space or activation at Copperbelt Marathon 2026 — fill in your details,
          pick a category, and pay in a few minutes.
        </p>
      </section>

      <section className="section">
        <div className="section-inner narrow">
          <div className="modal-form">
            {step === 'details' && (
              <>
                <p className="hint">Tell us about your business, then choose a category.</p>

                <div className="grid-2">
                  <div className="field">
                    <span className="field-label">
                      Business / Company Name<span className="req">*</span>
                    </span>
                    <input value={details.businessName} onChange={(e) => update('businessName', e.target.value)} />
                  </div>
                  <div className="field">
                    <span className="field-label">
                      Contact Person<span className="req">*</span>
                    </span>
                    <input
                      value={details.contactPerson}
                      onChange={(e) => update('contactPerson', e.target.value)}
                      placeholder="Jane Mwansa"
                    />
                  </div>
                  <div className="field">
                    <span className="field-label">
                      Phone Number<span className="req">*</span>
                    </span>
                    <input value={details.phone} onChange={(e) => update('phone', e.target.value)} placeholder="e.g. 097 000 0000" />
                  </div>
                  <div className="field">
                    <span className="field-label">
                      Email Address<span className="req">*</span>
                    </span>
                    <input
                      type="email"
                      value={details.email}
                      onChange={(e) => update('email', e.target.value)}
                      placeholder="jane@example.com"
                    />
                  </div>
                  <div className="field">
                    <span className="field-label">
                      Business Location<span className="req">*</span>
                    </span>
                    <input value={details.businessLocation} onChange={(e) => update('businessLocation', e.target.value)} />
                  </div>
                  <div className="field">
                    <span className="field-label">
                      Registration Category<span className="req">*</span>
                    </span>
                    <select value={details.category} onChange={(e) => update('category', e.target.value)}>
                      <option value="">Select Category</option>
                      {categories?.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name} — {Number(c.price) > 0 ? `K${Number(c.price).toLocaleString()}` : 'FREE'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="field">
                  <span className="field-label">
                    Products / Services<span className="req">*</span>
                  </span>
                  <textarea
                    rows={3}
                    value={details.productsServices}
                    onChange={(e) => update('productsServices', e.target.value)}
                  />
                </div>

                <div className="field">
                  <span className="field-label">
                    Exhibition / Activation Requirement<span className="req">*</span>
                  </span>
                  <select value={details.requirement} onChange={(e) => update('requirement', e.target.value)}>
                    <option value="">Select Requirement</option>
                    {REQUIREMENTS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCategory && (
                  <div className="summary-row">
                    <span>Amount payable</span>
                    <strong className="fee-highlight">{amount ? `K${amount.toLocaleString()}` : 'FREE'}</strong>
                  </div>
                )}

                {error && <p className="error">{error}</p>}

                <button className="btn-primary btn-full" onClick={handleDetailsSubmit} disabled={submitting || !categories}>
                  {submitting ? (
                    <span className="btn-loading">
                      <Spinner size={14} /> Submitting…
                    </span>
                  ) : isFree ? (
                    'Register — free'
                  ) : (
                    'Continue to payment'
                  )}
                </button>
              </>
            )}

            {step === 'payment' && (
              <>
                <div className="summary-row">
                  <span>Category</span>
                  <strong>{selectedCategory?.name}</strong>
                </div>
                <div className="summary-row">
                  <span>Amount payable</span>
                  <strong className="fee-highlight">{amount ? `K${amount.toLocaleString()}` : ''}</strong>
                </div>

                <div className="field">
                  <span className="field-label">Payment method</span>
                  <div className="segmented segmented-2">
                    <button type="button" className={paymentMethod === 'mobile-money' ? 'active' : ''} onClick={() => setPaymentMethod('mobile-money')}>
                      Mobile money
                    </button>
                    <button type="button" className={paymentMethod === 'card' ? 'active' : ''} onClick={() => setPaymentMethod('card')}>
                      Card
                    </button>
                  </div>
                </div>

                {paymentMethod === 'mobile-money' && (
                  <>
                    <div className="field">
                      <span className="field-label">Network</span>
                      <div className="provider-row">
                        {PROVIDERS.map(({ value, label, Logo }) => (
                          <button
                            key={value}
                            type="button"
                            className={`provider-tile${provider === value ? ' active' : ''}`}
                            onClick={() => setProvider(value)}
                          >
                            <Logo size={26} />
                            <span>{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="field">
                      <span className="field-label">
                        Mobile money number<span className="req">*</span>
                      </span>
                      <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
                      <span className="field-hint">A prompt to approve the payment will be sent to this number.</span>
                    </div>
                  </>
                )}

                {paymentMethod === 'card' && (
                  <>
                    <div className="bank-details-header">
                      <div className="card-brand-row">
                        <VisaLogo size={30} />
                        <MastercardLogo size={30} />
                        <AmexLogo size={30} />
                      </div>
                    </div>
                    <p className="hint">
                      You'll be taken to a secure Lipila checkout page to enter your card details — we never see
                      or store your card number.
                    </p>
                    <div className="field">
                      <span className="field-label">
                        City<span className="req">*</span>
                      </span>
                      <input value={city} onChange={(e) => setCity(e.target.value)} />
                    </div>
                    <div className="field">
                      <span className="field-label">
                        Billing address<span className="req">*</span>
                      </span>
                      <input value={address} onChange={(e) => setAddress(e.target.value)} />
                    </div>
                    <div className="field">
                      <span className="field-label">
                        Postal code<span className="req">*</span>
                      </span>
                      <input value={zipCode} onChange={(e) => setZipCode(e.target.value)} />
                    </div>
                  </>
                )}

                {error && <p className="error">{error}</p>}

                <div className="actions actions-stack">
                  <button className="btn-primary" onClick={handlePaySubmit} disabled={submitting}>
                    {submitting ? (
                      <span className="btn-loading">
                        <Spinner size={14} /> {paymentMethod === 'card' ? 'Redirecting to checkout…' : 'Sending prompt…'}
                      </span>
                    ) : paymentMethod === 'card' ? (
                      `Pay by card — K${amount?.toLocaleString()}`
                    ) : (
                      `Send payment prompt — K${amount?.toLocaleString()}`
                    )}
                  </button>
                  <button className="btn-text" onClick={() => setStep('details')} disabled={submitting}>
                    Back to details
                  </button>
                </div>
              </>
            )}

            {step === 'processing' && pending && outcome === 'waiting' && (
              <div className="center">
                <div className="processing-icon">{ProcLogo ? <ProcLogo size={40} /> : <Spinner size={28} />}</div>
                <h2>{pending.method === 'card' ? 'Confirming your card payment' : 'Check your phone'}</h2>
                <p className="hint">
                  {pending.method === 'card' ? (
                    <>
                      Your bank is confirming the card payment of{' '}
                      <strong>
                        {pending.currency} {pending.amount.toFixed(2)}
                      </strong>
                      . This page will update automatically — no need to refresh.
                    </>
                  ) : (
                    <>
                      We've sent a payment prompt to <strong>{pending.phoneNumber}</strong>. Enter your PIN to
                      approve the payment of{' '}
                      <strong>
                        {pending.currency} {pending.amount.toFixed(2)}
                      </strong>
                      .
                    </>
                  )}
                </p>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
                </div>
                <p className="hint small">
                  <Spinner size={12} /> Waiting for confirmation… {seconds}s
                </p>
              </div>
            )}

            {step === 'processing' && outcome === 'failed' && (
              <div className="center">
                <div className="check-badge failed">✕</div>
                <h2>Payment not completed</h2>
                <p className="hint">No money has been taken — you can try again.</p>
                <button className="btn-primary btn-full" onClick={handleTryAgain}>
                  Try again
                </button>
              </div>
            )}

            {step === 'processing' && outcome === 'timeout' && (
              <div className="center">
                <div className="check-badge pending">⏳</div>
                <h2>Still waiting</h2>
                <p className="hint">
                  This is taking longer than expected. Your reference is <strong>{reference}</strong>.
                </p>
                <div className="actions actions-stack">
                  <button className="btn-primary btn-full" onClick={handleKeepWaiting}>
                    Keep waiting
                  </button>
                  <button className="btn-text" onClick={handleTryAgain}>
                    Try a different method
                  </button>
                </div>
              </div>
            )}

            {step === 'done' && (
              <div className="center">
                <div className="check-badge">✓</div>
                <h2>Registration confirmed</h2>
                <p className="hint">A confirmation has been sent to {details.email}. Keep your reference safe.</p>
                <div className="reference-box">
                  <span>Reference</span>
                  <strong>{reference}</strong>
                </div>
                <button className="btn-primary btn-full" onClick={handleStartOver}>
                  Register another
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
