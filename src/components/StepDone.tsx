import { useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { downloadReceipt } from '../utils/receipt';
import Spinner from './Spinner';

export default function StepDone({ onClose }: { onClose: () => void }) {
  const record = useAppSelector((s) => s.registration.record);
  const [downloading, setDownloading] = useState(false);

  if (!record) return null;

  const pendingBankTransfer = record.status === 'pending-bank-transfer';

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadReceipt(record!);
    } finally {
      setDownloading(false);
    }
  }

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

      <div className="actions actions-stack">
        <button className="btn-ghost btn-full" onClick={handleDownload} disabled={downloading}>
          {downloading ? (
            <span className="btn-loading">
              <Spinner size={14} /> Preparing receipt…
            </span>
          ) : (
            'Download receipt'
          )}
        </button>
        <button className="btn-primary btn-full" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
