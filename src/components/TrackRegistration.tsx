import { useState } from 'react';
import { useAppSelector } from '../store/hooks';
import type { RegistrationRecord } from '../types';
import { searchRegistration } from '../api/registrationApi';
import { downloadReceipt } from '../utils/receipt';
import Spinner from './Spinner';

export default function TrackRegistration() {
  const records = useAppSelector((s) => s.registration.submittedRecords);
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<RegistrationRecord | null | 'not-found'>(null);
  const [searching, setSearching] = useState(false);
  const [downloading, setDownloading] = useState(false);

  async function handleSearch() {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    const match = await searchRegistration(q, records);
    setResult(match ?? 'not-found');
    setSearching(false);
  }

  async function handleDownload(record: RegistrationRecord) {
    setDownloading(true);
    try {
      await downloadReceipt(record);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="card">
      <h2>Track your registration</h2>
      <p className="hint">Look up a submission from this session by reference number or email.</p>

      <div className="search-row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. COPPER-0043 or your email"
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button className="btn-primary" onClick={handleSearch} disabled={searching}>
          {searching ? <Spinner size={14} /> : 'Search'}
        </button>
      </div>

      {result === 'not-found' && <p className="error">No matching registration found.</p>}

      {result && result !== 'not-found' && (
        <div className="summary-row-block">
          <div className="summary-row"><span>Reference</span><strong>{result.reference}</strong></div>
          <div className="summary-row"><span>Status</span>
            <strong>
              <span className={result.status === 'pending-bank-transfer' ? 'status-pill reserved' : 'status-pill confirmed'}>
                {result.status === 'pending-bank-transfer' ? 'Awaiting bank transfer' : 'Confirmed'}
              </span>
            </strong>
          </div>
          <div className="summary-row"><span>Name</span><strong>{result.details.fullName}</strong></div>
          <div className="summary-row"><span>Race category</span><strong>{result.details.raceCategory}</strong></div>
          <div className="summary-row"><span>Submitted</span><strong>{new Date(result.submittedAt).toLocaleString()}</strong></div>
          <div className="actions">
            <button className="btn-ghost btn-full" onClick={() => handleDownload(result)} disabled={downloading}>
              {downloading ? (
                <span className="btn-loading">
                  <Spinner size={14} /> Preparing receipt…
                </span>
              ) : (
                'Download receipt'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
