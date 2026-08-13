import { useEffect } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { EVENT, SPONSORS } from '../data/event';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { openRegistrationModal } from '../store/registrationSlice';
import RegistrationModal from './RegistrationModal';

const logos = import.meta.glob('../assets/logos/*.{png,jpg}', { eager: true, import: 'default' }) as Record<string, string>;

function logoSrc(file: string): string {
  const match = Object.entries(logos).find(([path]) => path.endsWith(file));
  return match ? match[1] : '';
}

export default function Layout() {
  const dispatch = useAppDispatch();
  const step = useAppSelector((s) => s.registration.step);
  const pendingPayment = useAppSelector((s) => s.registration.pendingPayment);

  // Card payments leave the SPA entirely for Lipila's hosted checkout and
  // land back here via `backUrl` — a full page load, so the modal is
  // closed by default even though registration state (persisted to
  // localStorage) still says "processing". Reopen it so the runner sees
  // the resumed status check instead of a closed site with no context.
  useEffect(() => {
    if (step === 'processing' && pendingPayment) {
      dispatch(openRegistrationModal());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="site">
      <header className="site-header">
        <div className="site-header-inner">
          <Link to="/" className="brand">
            <img src="/favicon.svg" alt="" className="brand-badge" aria-hidden="true" />
            <span className="brand-title-lg">{EVENT.title}</span>
          </Link>
          <nav className="site-nav">
            <NavLink to="/" end>Home</NavLink>
            <NavLink to="/about">About</NavLink>
            <NavLink to="/races">Races</NavLink>
            <NavLink to="/sponsors">Sponsors</NavLink>
          </nav>
          <button type="button" className="btn-primary btn-sm" onClick={() => dispatch(openRegistrationModal())}>
            Register
          </button>
        </div>
      </header>

      <Outlet />

      <footer className="site-footer">
        <div className="site-footer-inner">
          <div className="footer-top">
            <div className="footer-brand">
              <img src="/favicon.svg" alt="" className="brand-badge" aria-hidden="true" />
              <div>
                <div className="brand-title">{EVENT.title}</div>
                <div className="brand-org">{EVENT.tagline}</div>
              </div>
            </div>
            <div className="footer-cols">
              <div>
                <span className="footer-label">The race</span>
                <Link to="/races">Race categories</Link>
                <Link to="/about">Event info</Link>
                <a href="/#prize">Prize money</a>
              </div>
              <div>
                <span className="footer-label">Register</span>
                <button type="button" onClick={() => dispatch(openRegistrationModal())}>Individual entry</button>
                <a href="/#track">Track registration</a>
              </div>
              <div>
                <span className="footer-label">About</span>
                <Link to="/about">About the marathon</Link>
                <Link to="/sponsors">Sponsors &amp; partners</Link>
              </div>
              <div>
                <span className="footer-label">Contact</span>
                <span className="footer-text">{EVENT.venue}</span>
                <a href={`tel:${EVENT.phone.replace(/\s/g, '')}`}>{EVENT.phone}</a>
              </div>
            </div>
          </div>
          <div className="footer-sponsors">
            <span className="footer-label">Supported by</span>
            <div className="footer-logos">
              {SPONSORS.map((s) => (
                <img key={s.name} src={logoSrc(s.file)} alt={s.name} title={s.name} />
              ))}
            </div>
          </div>
          <p className="footer-fine">
            © {new Date().getFullYear()} {EVENT.title}. All rights reserved.
            <span className="footer-fine-sep">·</span>
            Designed by Enax Technology Limited
          </p>
        </div>
      </footer>

      <RegistrationModal />
    </div>
  );
}
