import { useEffect, useState } from 'react';
import { RACE_CATEGORIES } from '../types';
import { useAppDispatch } from '../store/hooks';
import { openRegistrationModal } from '../store/registrationSlice';
import { fetchRaceCategories } from '../api/registrationApi';
import type { BackendCategory } from '../api/registrationApi';
import Reveal from '../components/Reveal';
import Spinner from '../components/Spinner';

export default function Races() {
  const dispatch = useAppDispatch();
  const [categories, setCategories] = useState<BackendCategory[] | null>(null);

  useEffect(() => {
    fetchRaceCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  function feeFor(code: string): number | null {
    const category = categories?.find((c) => c.code === code);
    if (!category) return null;
    const price = Number(category.price);
    return price > 0 ? price : null;
  }

  return (
    <main>
      <section className="page-hero">
        <div className="eyebrow">Race categories</div>
        <h1>Pick your distance</h1>
        <p className="lede">Eight categories, four core distances. Community categories run on custom pricing — contact the secretariat for details.</p>
      </section>

      <section className="section">
        <div className="section-inner">
          {!categories ? (
            <p className="hint"><Spinner size={13} /> Loading fees…</p>
          ) : (
            <Reveal as="div" className="race-table">
              {RACE_CATEGORIES.map((c) => (
                <div className="race-row" key={c.value}>
                  <div className="race-row-name">{c.label}</div>
                  <div className="race-row-dist">{c.distance}</div>
                  <div className="race-row-fee">{feeFor(c.value) ? `K${feeFor(c.value)}` : ''}</div>
                </div>
              ))}
            </Reveal>
          )}
        </div>
      </section>

      <section className="cta-band">
        <h2>Ready when you are</h2>
        <p>Choose a category and complete your registration in minutes.</p>
        <button type="button" className="btn-cta-light" onClick={() => dispatch(openRegistrationModal())}>
          Register now
        </button>
      </section>
    </main>
  );
}
