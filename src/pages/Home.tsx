import { useEffect, useState } from 'react';
import { EVENT, DISTANCES, COUNTERS, PRIZE_ITEMS, PACKAGE_ITEMS, SPONSORS } from '../data/event';
import { useCountdown } from '../hooks/useCountdown';
import { useReveal } from '../hooks/useReveal';
import { useCountUp } from '../hooks/useCountUp';
import { useAppDispatch } from '../store/hooks';
import { openRegistrationModal } from '../store/registrationSlice';
import { fetchRaceCategories } from '../api/registrationApi';
import type { BackendCategory } from '../api/registrationApi';
import Reveal from '../components/Reveal';
import CounterStat from '../components/CounterStat';
import TrackRegistration from '../components/TrackRegistration';
import merchCap from '../assets/merch-cap.jpg';
import merchBag from '../assets/merch-bag.jpg';
import merchShirt from '../assets/merch-shirt.jpg';

const logos = import.meta.glob('../assets/logos/*.{png,jpg}', { eager: true, import: 'default' }) as Record<string, string>;

function logoSrc(file: string): string {
  const match = Object.entries(logos).find(([path]) => path.endsWith(file));
  return match ? match[1] : '';
}

export default function Home() {
  const dispatch = useAppDispatch();
  const { days, hours, minutes, seconds } = useCountdown(EVENT.isoDate);
  const { ref: prizeRef, visible: prizeVisible } = useReveal(0.4);
  const prizeValue = useCountUp(500000, prizeVisible, 1600);

  // Prices always come from the backend — never trust a number baked
  // into the frontend bundle for something people pay real money for.
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

  
  // const lowestFee = categories
  //   ? Math.min(...categories.map((c) => Number(c.price)).filter((p) => p > 0))
  //   : null;

  return (
    <main>
      <section className="sponsor-strip-top">
        <div className="section-inner sponsor-strip-top-inner">
          <span className="footer-label">Official partners</span>
          <div className="trust-strip">
            {SPONSORS.map((s, i) => (
              <Reveal as="img" key={s.name} delay={i * 80} src={logoSrc(s.file)} alt={s.name} title={s.name} />
            ))}
          </div>
        </div>
      </section>

      <section className="hero">
        <div className="hero-bg" aria-hidden="true" />

        <div className="hero-side hero-side-left" aria-hidden="true">
          <img src={merchCap} alt="" loading="lazy" />
          <img src={merchBag} alt="" loading="lazy" />
        </div>
        <div className="hero-side hero-side-right" aria-hidden="true">
          <img src={merchShirt} alt="" loading="lazy" />
        </div>

        <div className="hero-inner">
          <div className="eyebrow eyebrow-lg">Inaugural edition · {EVENT.venue}</div>
          <h1>One Copperbelt. One finish line.</h1>
          <p className="lede hero-lede">Four distances, one start line, {EVENT.runnersExpected} runners taking on Zambia's Copperbelt on {EVENT.date}.</p>

          <div className="hero-facts">
            <span>{EVENT.date}</span>
            <span className="dot">·</span>
            <span>{EVENT.venue}</span>
            {/* <span className="dot">·</span>
            <span>{lowestFee ? `From K${lowestFee} entry` : 'Loading entry fees…'}</span> */}
          </div>

          <div className="hero-distances">
            {DISTANCES.map((d) => {
              const fee = feeFor(d.categoryCode);
              return (
                <span key={d.code} className="hero-distance-pill">
                  <span className="hero-distance-pill-main">
                    <strong>{d.code}</strong> {d.label}
                  </span>
                  <span className="hero-distance-pill-fee">{fee ? `K${fee}` : ' '}</span>
                </span>
              );
            })}
          </div>

          <div className="hero-cta">
            <button type="button" className="btn-primary" onClick={() => dispatch(openRegistrationModal())}>
              Register now
            </button>
            <a href="#races" className="btn-ghost">See race categories</a>
          </div>

          <div className="countdown">
            <span className="countdown-label">Flag-off in</span>
            <div className="countdown-cells">
              <div className="cell"><div className="num">{days}</div><div className="lbl">Days</div></div>
              <div className="cell"><div className="num">{hours}</div><div className="lbl">Hrs</div></div>
              <div className="cell"><div className="num">{minutes}</div><div className="lbl">Min</div></div>
              <div className="cell"><div className="num">{seconds}</div><div className="lbl">Sec</div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="counters">
        <div className="counters-inner">
          {COUNTERS.map((c, i) => (
            <CounterStat key={c.label} target={c.target} label={c.label} prefix={c.prefix} suffix={c.suffix} delay={i * 90} />
          ))}
        </div>
      </section>

      <section className="section compact" id="races">
        <div className="section-inner">
          <Reveal as="div" className="section-head-row">
            <div>
              <div className="eyebrow">Race categories</div>
              <h2>Choose your race</h2>
            </div>
            <a href="/races" className="section-head-link">All categories →</a>
          </Reveal>
          <div className="race-cards">
            {DISTANCES.map((d, i) => (
              <Reveal as="div" key={d.code} delay={i * 70} className="race-card">
                <div className="race-card-dist">{d.code}</div>
                <div className="race-card-label">{d.label}</div>
                <div className="race-card-meta">
                  <span className="race-card-fee">{feeFor(d.categoryCode) ? `K${feeFor(d.categoryCode)}` : ''}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="prize-section" ref={prizeRef} id="prize">
        <div className="prize-inner">
          <div>
            <div className="eyebrow">Be part of it</div>
            <div className="prize-amount">K{prizeValue.toLocaleString()}</div>
            <p className="lede">in prize money and rewards, shared across every race category.</p>
            <button type="button" className="btn-on-prize" onClick={() => dispatch(openRegistrationModal())}>
              Register to compete
            </button>
          </div>
          <div className="prize-table">
            {PRIZE_ITEMS.map((p) => (
              <div className="prize-table-row" key={p}>{p}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="section compact alt">
        <div className="section-inner">
          <div className="reg-panel">
            <Reveal as="div" className="reg-panel-info">
              <div className="eyebrow">Registration</div>
              <h2>One entry. Everything included.</h2>
              <p className="lede">Secure your place and pay by mobile money — your bib number and confirmation arrive by email.</p>
              <button type="button" className="btn-primary" onClick={() => dispatch(openRegistrationModal())}>
                Register now
              </button>
            </Reveal>
            <Reveal as="div" delay={100} className="reg-panel-package">
              <span className="footer-label">Your race pack includes</span>
              <ul className="package-grid compact">
                {PACKAGE_ITEMS.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section compact" id="track">
        <div className="section-inner narrow">
          <Reveal as="div">
            <div className="eyebrow">Already registered?</div>
            <h2>Track your registration</h2>
          </Reveal>
          <TrackRegistration />
        </div>
      </section>
    </main>
  );
}
