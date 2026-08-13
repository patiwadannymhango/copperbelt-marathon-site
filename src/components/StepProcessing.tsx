import { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { submitRegistration, goToStep, clearPendingPayment } from '../store/registrationSlice';
import { checkPaymentStatus } from '../api/registrationApi';
import { PROVIDER_LOGO, PROVIDER_LABEL, CardLogo } from './PaymentLogos';
import Spinner from './Spinner';

const POLL_INTERVAL_MS = 3000;
// Card confirmations (bank 3-D Secure step) tend to take longer than a
// mobile money PIN prompt, so give card a longer runway before timing out.
const TIMEOUT_MS: Record<'mobile-money' | 'card', number> = {
  'mobile-money': 90000,
  card: 150000,
};

type Outcome = 'waiting' | 'failed' | 'timeout';

export default function StepProcessing() {
  const dispatch = useAppDispatch();
  const pending = useAppSelector((s) => s.registration.pendingPayment);

  const [elapsed, setElapsed] = useState(0);
  const [outcome, setOutcome] = useState<Outcome>('waiting');
  const startRef = useRef(0);
  const timeoutMs = TIMEOUT_MS[pending?.method ?? 'mobile-money'];

  useEffect(() => {
    if (!pending || outcome !== 'waiting') return;

    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout>;
    startRef.current = Date.now();

    const tickTimer = setInterval(() => {
      if (!cancelled) setElapsed(Date.now() - startRef.current);
    }, 1000);

    async function poll() {
      if (cancelled) return;

      try {
        const result = await checkPaymentStatus(pending!.paymentId);
        if (cancelled) return;

        if (result.status === 'SUCCESS') {
          dispatch(submitRegistration({ reference: pending!.reference, status: 'confirmed' }));
          return;
        }
        if (result.status === 'FAILED' || result.status === 'CANCELLED') {
          setOutcome('failed');
          return;
        }
      } catch {
        // Transient network hiccup — keep polling rather than failing
        // the whole flow over one dropped request.
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
  }, [pending, outcome, dispatch, timeoutMs]);

  if (!pending) return null;

  function handleTryAgain() {
    dispatch(clearPendingPayment());
    dispatch(goToStep('payment'));
  }

  function handleKeepWaiting() {
    setElapsed(0);
    setOutcome('waiting');
  }

  if (outcome === 'failed') {
    return (
      <div className="modal-form center">
        <div className="check-badge failed">✕</div>
        <h2>Payment not completed</h2>
        <p className="hint">
          {pending.method === 'card'
            ? "The card payment wasn't approved, or it was declined by your bank. No money has been taken — you can try again."
            : "The payment wasn't approved on your phone, or it was declined. No money has been taken — you can try again."}
        </p>
        <button className="btn-primary btn-full" onClick={handleTryAgain}>
          Try again
        </button>
      </div>
    );
  }

  if (outcome === 'timeout') {
    return (
      <div className="modal-form center">
        <div className="check-badge pending">⏳</div>
        <h2>Still waiting</h2>
        <p className="hint">
          This is taking longer than expected. Your reference is{' '}
          <strong>{pending.reference}</strong> — you can look it up anytime from{' '}
          "Track my registration" once it goes through, or keep waiting here.
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
    );
  }

  const Logo = pending.method === 'card' ? CardLogo : PROVIDER_LOGO[pending.provider];
  const seconds = Math.floor(elapsed / 1000);
  const progressPct = Math.min(100, (elapsed / timeoutMs) * 100);

  return (
    <div className="modal-form center">
      <div className="processing-icon">{Logo ? <Logo size={40} /> : <Spinner size={28} />}</div>
      <h2>{pending.method === 'card' ? 'Confirming your card payment' : 'Check your phone'}</h2>
      <p className="hint">
        {pending.method === 'card' ? (
          <>
            Your bank is confirming the card payment of{' '}
            <strong>
              {pending.currency} {(pending.amount ?? 0).toFixed(2)}
            </strong>
            . This page will update automatically once it's done — no need to refresh.
          </>
        ) : (
          <>
            We've sent a payment prompt to <strong>{pending.phoneNumber}</strong> via{' '}
            {PROVIDER_LABEL[pending.provider] || 'mobile money'}. Enter your PIN on your phone to approve
            the payment of{' '}
            <strong>
              {pending.currency} {(pending.amount ?? 0).toFixed(2)}
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
  );
}
