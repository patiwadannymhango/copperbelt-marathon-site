import { EVENT } from '../data/event';

export default function SplashLoader() {
  return (
    <div className="splash">
      <img src="/favicon.svg" alt="" className="splash-badge" aria-hidden="true" />
      <div className="splash-title">{EVENT.title}</div>
      <div className="splash-spinner" role="status" aria-label="Loading" />
    </div>
  );
}
