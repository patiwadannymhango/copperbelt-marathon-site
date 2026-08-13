import { EVENT } from '../data/event';

export default function SplashLoader() {
  return (
    <div className="splash">
      <div className="splash-badge" aria-hidden="true">Logo</div>
      <div className="splash-title">{EVENT.title}</div>
      <div className="splash-spinner" role="status" aria-label="Loading" />
    </div>
  );
}
