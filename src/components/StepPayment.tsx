import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { updatePayment, goToStep, setPendingPayment, submitRegistration } from '../store/registrationSlice';
import { RACE_CATEGORIES } from '../types';
import type { MobileMoneyProvider } from '../types';
import { fetchRaceFee, fetchBankDetails, submitRegistrationDetails, initiatePayment } from '../api/registrationApi';
import type { BankDetails } from '../api/registrationApi';
import { MtnLogo, AirtelLogo, ZamtelLogo, BankTransferLogo, VisaLogo, MastercardLogo, AmexLogo } from './PaymentLogos';
import Spinner from './Spinner';

const PROVIDERS: { value: MobileMoneyProvider; label: string; Logo: typeof MtnLogo }[] = [
  { value: 'MTN_MONEY', label: 'MTN', Logo: MtnLogo },
  { value: 'AIRTEL_MONEY', label: 'Airtel', Logo: AirtelLogo },
  { value: 'ZAMTEL_KWACHA', label: 'Zamtel', Logo: ZamtelLogo },
];

export default function StepPayment() {
  const dispatch = useAppDispatch();
  const { details, payment } = useAppSelector((s) => s.registration);
  const category = RACE_CATEGORIES.find((c) => c.value === details.raceCategory);

  const [fee, setFee] = useState<number | null | undefined>(undefined);
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setFee(undefined);
    fetchRaceFee(details.raceCategory).then((result) => {
      if (!cancelled) setFee(result);
    });
    return () => {
      cancelled = true;
    };
  }, [details.raceCategory]);

  useEffect(() => {
    if (payment.method === 'bank-transfer' && !bankDetails) {
      fetchBankDetails().then(setBankDetails).catch(() => {});
    }
  }, [payment.method, bankDetails]);

  // Prefill the payment-specific fields from the details step once, so the
  // runner doesn't have to retype anything they already gave us — but
  // both stay editable here since the number that receives the Lipila
  // prompt, or the name a bank transfer will show up under, isn't always
  // the same as the contact details entered earlier.
  useEffect(() => {
    if (!payment.phoneNumber) dispatch(updatePayment({ phoneNumber: details.phone }));
    if (!payment.payerName) dispatch(updatePayment({ payerName: details.fullName }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit() {
    setSubmitError('');

    if (payment.method === 'mobile-money' && !payment.provider) {
      setSubmitError('Please choose MTN, Airtel or Zamtel to receive the payment prompt.');
      return;
    }
    if (payment.method === 'mobile-money' && !(payment.phoneNumber || '').trim()) {
      setSubmitError('Please enter the phone number that will receive the payment prompt.');
      return;
    }
    if (payment.method === 'bank-transfer' && !(payment.payerName || '').trim()) {
      setSubmitError('Please enter the name the transfer will be made from.');
      return;
    }
    if (
      payment.method === 'card' &&
      (!(payment.city || '').trim() || !(payment.address || '').trim() || !(payment.zipCode || '').trim())
    ) {
      setSubmitError('Please fill in your billing city, address and postal code.');
      return;
    }

    setSubmitting(true);
    try {
      const registration = await submitRegistrationDetails(details);

      if (payment.method === 'bank-transfer') {
        await initiatePayment({
          registrationId: registration.registrationId,
          paymentMethod: 'BANK_TRANSFER',
          payerName: payment.payerName,
          transferReference: payment.transferReference,
        });
        dispatch(submitRegistration({ reference: registration.reference, status: 'pending-bank-transfer' }));
      } else if (payment.method === 'card') {
        const backUrl = `${window.location.origin}${import.meta.env.BASE_URL}`;
        const pay = await initiatePayment({
          registrationId: registration.registrationId,
          paymentMethod: 'CARD',
          city: payment.city,
          address: payment.address,
          zipCode: payment.zipCode,
          backUrl,
        });
        dispatch(
          setPendingPayment({
            paymentId: pay.paymentId,
            registrationId: registration.registrationId,
            reference: registration.reference,
            email: details.email,
            amount: registration.amount,
            currency: registration.currency,
            method: 'card',
            phoneNumber: '',
            provider: '',
          })
        );
        if (pay.redirectUrl) {
          // Leaving the SPA entirely — Lipila's own hosted, PCI-compliant
          // checkout page collects the card number, not us. Registration
          // state (incl. this pendingPayment) is already persisted to
          // localStorage by the time this navigation happens, so when the
          // browser comes back via backUrl the app resumes on the
          // "processing" step and picks the poll back up — see App.tsx.
          window.location.href = pay.redirectUrl;
          return;
        }
      } else {
        const pay = await initiatePayment({
          registrationId: registration.registrationId,
          paymentMethod: payment.provider as 'MTN_MONEY' | 'AIRTEL_MONEY' | 'ZAMTEL_KWACHA',
          phoneNumber: payment.phoneNumber,
        });
        dispatch(
          setPendingPayment({
            paymentId: pay.paymentId,
            registrationId: registration.registrationId,
            reference: registration.reference,
            email: details.email,
            amount: registration.amount,
            currency: registration.currency,
            method: 'mobile-money',
            phoneNumber: payment.phoneNumber || '',
            provider: payment.provider as MobileMoneyProvider,
          })
        );
      }
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Something went wrong submitting your registration. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  const feeLoading = fee === undefined;

  return (
    <div className="payment-step">
      <div className="summary-row">
        <span>Race category</span>
        <strong>{category ? `${category.label}${category.distance ? ` (${category.distance})` : ''}` : '—'}</strong>
      </div>
      <div className="summary-row">
        <span>Entry fee</span>
        {feeLoading ? (
          <span className="fee-loading"><Spinner size={13} /> Fetching…</span>
        ) : (
          <strong className="fee-highlight">{fee ? `K${fee.toFixed(2)}` : ''}</strong>
        )}
      </div>

      <div className="field">
        <span className="field-label">Payment method</span>
        <div className="segmented segmented-3">
          <button
            type="button"
            className={payment.method === 'mobile-money' ? 'active' : ''}
            onClick={() => dispatch(updatePayment({ method: 'mobile-money' }))}
          >
            Mobile money
          </button>
          <button
            type="button"
            className={payment.method === 'card' ? 'active' : ''}
            onClick={() => dispatch(updatePayment({ method: 'card' }))}
          >
            Card
          </button>
          <button
            type="button"
            className={payment.method === 'bank-transfer' ? 'active' : ''}
            onClick={() => dispatch(updatePayment({ method: 'bank-transfer' }))}
          >
            Bank transfer
          </button>
        </div>
      </div>

      {payment.method === 'mobile-money' && (
        <>
          <div className="field">
            <span className="field-label">Network</span>
            <div className="provider-row">
              {PROVIDERS.map(({ value, label, Logo }) => (
                <button
                  key={value}
                  type="button"
                  className={`provider-tile${payment.provider === value ? ' active' : ''}`}
                  onClick={() => dispatch(updatePayment({ provider: value }))}
                >
                  <Logo size={26} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="payment-phone">
              Mobile money number<span className="req">*</span>
            </label>
            <input
              id="payment-phone"
              type="tel"
              placeholder="e.g. 0977 123 456"
              value={payment.phoneNumber || ''}
              onChange={(e) => dispatch(updatePayment({ phoneNumber: e.target.value }))}
            />
            <span className="field-hint">A prompt to approve the payment will be sent to this number.</span>
          </div>
        </>
      )}

      {payment.method === 'card' && (
        <>
          <div className="bank-details-header">
            <div className="card-brand-row">
              <VisaLogo size={30} />
              <MastercardLogo size={30} />
              <AmexLogo size={30} />
            </div>
          </div>
          <p className="hint">
            You'll be taken to a secure Lipila checkout page to enter your card details — we never see or
            store your card number.
          </p>

          <div className="field">
            <label className="field-label" htmlFor="card-city">
              City<span className="req">*</span>
            </label>
            <input
              id="card-city"
              type="text"
              placeholder="e.g. Kitwe"
              value={payment.city || ''}
              onChange={(e) => dispatch(updatePayment({ city: e.target.value }))}
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="card-address">
              Billing address<span className="req">*</span>
            </label>
            <input
              id="card-address"
              type="text"
              placeholder="Street address"
              value={payment.address || ''}
              onChange={(e) => dispatch(updatePayment({ address: e.target.value }))}
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="card-zip">
              Postal code<span className="req">*</span>
            </label>
            <input
              id="card-zip"
              type="text"
              placeholder="Postal / zip code"
              value={payment.zipCode || ''}
              onChange={(e) => dispatch(updatePayment({ zipCode: e.target.value }))}
            />
          </div>
        </>
      )}

      {payment.method === 'bank-transfer' && (
        <>
          <div className="bank-details-header">
            <BankTransferLogo size={24} />
            <span>Bank transfer</span>
          </div>
          {bankDetails ? (
            <div className="bank-details">
              <div className="summary-row"><span>Bank</span><strong>{bankDetails.bank_name}</strong></div>
              <div className="summary-row"><span>Account name</span><strong>{bankDetails.account_name}</strong></div>
              <div className="summary-row"><span>Account number</span><strong>{bankDetails.account_number}</strong></div>
              {bankDetails.branch && <div className="summary-row"><span>Branch</span><strong>{bankDetails.branch}</strong></div>}
              {bankDetails.sort_code && <div className="summary-row"><span>Sort code</span><strong>{bankDetails.sort_code}</strong></div>}
              {bankDetails.swift_code && <div className="summary-row"><span>Swift code</span><strong>{bankDetails.swift_code}</strong></div>}
              <p className="hint">Use your name and reference as the transfer narration. We'll confirm your entry once the transfer is received.</p>
            </div>
          ) : (
            <p className="hint"><Spinner size={13} /> Loading bank details…</p>
          )}

          <div className="field">
            <label className="field-label" htmlFor="payer-name">
              Name the transfer will be made from<span className="req">*</span>
            </label>
            <input
              id="payer-name"
              type="text"
              placeholder="As it appears on your bank statement"
              value={payment.payerName || ''}
              onChange={(e) => dispatch(updatePayment({ payerName: e.target.value }))}
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="transfer-reference">
              Transaction reference <span className="optional">(optional)</span>
            </label>
            <input
              id="transfer-reference"
              type="text"
              placeholder="Bank's reference number, if you have it"
              value={payment.transferReference || ''}
              onChange={(e) => dispatch(updatePayment({ transferReference: e.target.value }))}
            />
            <span className="field-hint">Helps us match your transfer faster — add it once you've completed the transfer if you don't have it yet.</span>
          </div>
        </>
      )}

      {submitError && <p className="error">{submitError}</p>}

      <div className="actions actions-stack">
        <button className="btn-primary" onClick={handleSubmit} disabled={submitting || feeLoading}>
          {submitting ? (
            <span className="btn-loading">
              <Spinner size={14} />{' '}
              {payment.method === 'bank-transfer'
                ? 'Submitting…'
                : payment.method === 'card'
                  ? 'Redirecting to checkout…'
                  : 'Sending prompt…'}
            </span>
          ) : payment.method === 'bank-transfer' ? (
            'Submit registration'
          ) : payment.method === 'card' ? (
            fee ? `Pay by card — K${fee.toFixed(2)}` : 'Continue to card checkout'
          ) : fee ? (
            `Send payment prompt — K${fee.toFixed(2)}`
          ) : (
            'Confirm registration'
          )}
        </button>
        <button className="btn-text" onClick={() => dispatch(goToStep('details'))} disabled={submitting}>
          Back to details
        </button>
      </div>
    </div>
  );
}
