import { useAppDispatch, useAppSelector } from '../store/hooks';
import { closeRegistrationModal, clearPendingPayment, goToStep, resetRegistration } from '../store/registrationSlice';
import Modal from './Modal';
import StepDetails from './StepDetails';
import StepPayment from './StepPayment';
import StepProcessing from './StepProcessing';
import StepDone from './StepDone';
import type { Step } from '../types';

const TABS: { key: Step; label: string }[] = [
  { key: 'details', label: 'Details' },
  { key: 'payment', label: 'Payment' },
  { key: 'done', label: 'Done' },
];

export default function RegistrationModal() {
  const dispatch = useAppDispatch();
  const modalOpen = useAppSelector((s) => s.registration.modalOpen);
  const step = useAppSelector((s) => s.registration.step);

  function handleClose() {
    dispatch(closeRegistrationModal());
    if (step === 'done') {
      dispatch(resetRegistration());
    } else if (step === 'processing') {
      // Abandoning a payment mid-wait — same as "Try a different method" on
      // timeout/failure. Without this, the stale pendingPayment (and its
      // now-wrong provider logo) survives and resumes on the next open.
      dispatch(clearPendingPayment());
      dispatch(goToStep('payment'));
    }
  }

  // "processing" has no tab of its own — it's a sub-state of "payment"
  // (waiting on the Lipila prompt), so the tab bar just keeps "Payment"
  // highlighted while it's showing.
  const currentIndex = TABS.findIndex((t) => t.key === (step === 'processing' ? 'payment' : step));

  return (
    <Modal
      open={modalOpen}
      onClose={handleClose}
      title="Secure your place"
      headerExtra={
        <div className="modal-tabs">
          {TABS.map((t, i) => (
            <button
              key={t.key}
              type="button"
              className={
                i === currentIndex ? 'modal-tab active' : i < currentIndex ? 'modal-tab complete' : 'modal-tab'
              }
              disabled={i > currentIndex}
              onClick={() => i < currentIndex && dispatch(goToStep(t.key))}
            >
              <span className="modal-tab-dot">{i < currentIndex ? '✓' : i + 1}</span>
              {t.label}
            </button>
          ))}
        </div>
      }
    >
      {step === 'details' && <StepDetails />}
      {step === 'payment' && <StepPayment />}
      {step === 'processing' && <StepProcessing />}
      {step === 'done' && <StepDone onClose={handleClose} />}
    </Modal>
  );
}
