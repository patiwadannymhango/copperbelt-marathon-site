import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { updateDetails, goToStep } from '../store/registrationSlice';
import { RACE_CATEGORIES } from '../types';
import { fetchRaceFee } from '../api/registrationApi';
import Spinner from './Spinner';

export default function StepDetails() {
  const dispatch = useAppDispatch();
  const details = useAppSelector((s) => s.registration.details);
  const [error, setError] = useState('');
  const selectedCategory = RACE_CATEGORIES.find((c) => c.value === details.raceCategory);

  const [fee, setFee] = useState<number | null>(null);
  const [feeLoading, setFeeLoading] = useState(false);

  useEffect(() => {
    if (!details.raceCategory) {
      setFee(null);
      return;
    }
    let cancelled = false;
    setFeeLoading(true);
    fetchRaceFee(details.raceCategory).then((result) => {
      if (!cancelled) {
        setFee(result);
        setFeeLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [details.raceCategory]);

  function handleChange<K extends keyof typeof details>(key: K, value: (typeof details)[K]) {
    dispatch(updateDetails({ [key]: value } as Partial<typeof details>));
  }

  function handleContinue() {
    if (!details.fullName || !details.email || !details.phone || !details.raceCategory) {
      setError('Please fill in name, email, phone and race category.');
      return;
    }
    if (details.attendanceType === 'in-person' && !details.emergencyContactPhone) {
      setError('Emergency contact phone is required for in-person entries.');
      return;
    }
    if (!details.acceptedTerms) {
      setError('Please accept the event terms and indemnity to continue.');
      return;
    }
    setError('');
    dispatch(goToStep('payment'));
  }

  return (
    <div className="modal-form">
      <p className="hint">Tell us who's running — your details, then payment.</p>

      <div className="grid-2">
        <Field label="Full name" required>
          <input
            value={details.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            placeholder="Jane Mwansa"
          />
        </Field>
        <Field label="Email" required>
          <input
            type="email"
            value={details.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="jane@example.com"
          />
        </Field>
        <Field label="Phone (mobile money)" required>
          <input
            value={details.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="e.g. 097 000 0000"
          />
        </Field>
        <Field label="Country">
          <input
            value={details.country}
            onChange={(e) => handleChange('country', e.target.value)}
            placeholder="Zambia"
          />
        </Field>
        <Field label="Gender">
          <select value={details.gender} onChange={(e) => handleChange('gender', e.target.value as typeof details.gender)}>
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </Field>
        <Field label="Age range">
          <select value={details.ageRange} onChange={(e) => handleChange('ageRange', e.target.value as typeof details.ageRange)}>
            <option value="">Select</option>
            <option value="Under 18">Under 18</option>
            <option value="18-29">18–29</option>
            <option value="30-39">30–39</option>
            <option value="40-49">40–49</option>
            <option value="50-59">50–59</option>
            <option value="60+">60+</option>
          </select>
        </Field>
        <Field label="T-shirt size">
          <select value={details.tShirtSize} onChange={(e) => handleChange('tShirtSize', e.target.value as typeof details.tShirtSize)}>
            <option value="">Select</option>
            {['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL'].map((sz) => (
              <option key={sz} value={sz}>{sz}</option>
            ))}
          </select>
        </Field>
        <Field label="Race category" required>
          <select value={details.raceCategory} onChange={(e) => handleChange('raceCategory', e.target.value as typeof details.raceCategory)}>
            <option value="">Select your race</option>
            {RACE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label} — {c.distance}</option>
            ))}
          </select>
        </Field>
      </div>

      {selectedCategory && (
        <div className="fee-preview">
          <span>Entry fee for {selectedCategory.label}</span>
          {feeLoading ? (
            <span className="fee-loading"><Spinner size={13} /> Fetching…</span>
          ) : (
            <strong>{fee ? `K${fee}` : ''}</strong>
          )}
        </div>
      )}

      <Field label="Attendance type">
        <div className="segmented">
          <button
            type="button"
            className={details.attendanceType === 'in-person' ? 'active' : ''}
            onClick={() => handleChange('attendanceType', 'in-person')}
          >
            In-person
          </button>
          <button
            type="button"
            className={details.attendanceType === 'virtual' ? 'active' : ''}
            onClick={() => handleChange('attendanceType', 'virtual')}
          >
            Virtual
          </button>
        </div>
      </Field>

      <div className="grid-2">
        <Field label="Club / institution (optional)">
          <input
            value={details.clubOrInstitution}
            onChange={(e) => handleChange('clubOrInstitution', e.target.value)}
          />
        </Field>
        <Field label="Emergency contact name (optional)">
          <input
            value={details.emergencyContactName}
            onChange={(e) => handleChange('emergencyContactName', e.target.value)}
          />
        </Field>
        <Field label={`Emergency contact phone${details.attendanceType === 'in-person' ? ' (required)' : ' (optional)'}`}>
          <input
            value={details.emergencyContactPhone}
            onChange={(e) => handleChange('emergencyContactPhone', e.target.value)}
          />
        </Field>
      </div>

      <Field label="Medical notes (optional)">
        <textarea
          rows={3}
          value={details.medicalNotes}
          onChange={(e) => handleChange('medicalNotes', e.target.value)}
        />
      </Field>

      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={details.acceptedTerms}
          onChange={(e) => handleChange('acceptedTerms', e.target.checked)}
        />
        I confirm the details are correct and accept the event terms and indemnity.
      </label>

      {error && <p className="error">{error}</p>}

      <button className="btn-primary btn-full" onClick={handleContinue}>
        {fee ? `Continue to payment — K${fee.toFixed(2)}` : 'Continue to payment'}
      </button>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span className="field-label">
        {label}
        {required && <span className="req">*</span>}
      </span>
      {children}
    </label>
  );
}
