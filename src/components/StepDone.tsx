import { useAppSelector } from '../store/hooks';

export default function StepDone({ onClose }: { onClose: () => void }) {
  const record = useAppSelector((s) => s.registration.record);

  if (!record) return null;

  const pendingBankTransfer = record.status === 'pending-bank-transfer';

  return (
    <div className="modal-form center">
      <div className="check-badge">{pendingBankTransfer ? '⏳' : '✓'}</div>
      <h2>{pendingBankTransfer ? 'Registration submitted' : 'Registration confirmed'}</h2>
      <p className="hint">
        {pendingBankTransfer
          ? `We've saved your registration. Complete the bank transfer using the details provided, and we'll confirm your entry by email once it's received at ${record.details.email}.`
          : `A confirmation has been sent to ${record.details.email}. Keep your reference safe — you'll need it to look up your entry later.`}
      </p>

      <div className="reference-box">
        <span>Reference</span>
        <strong>{record.reference}</strong>
      </div>

      <div className="status-pill-row">
        <span className={pendingBankTransfer ? 'status-pill reserved' : 'status-pill confirmed'}>
          {pendingBankTransfer ? 'Awaiting bank transfer' : 'Confirmed'}
        </span>
      </div>

      <button className="btn-primary btn-full" onClick={onClose}>
        Done
      </button>
    </div>
  );
}
