import { SPONSORS, EVENT } from '../data/event';
import Reveal from '../components/Reveal';

const logos = import.meta.glob('../assets/logos/*.{png,jpg}', { eager: true, import: 'default' }) as Record<string, string>;

function logoSrc(file: string): string {
  const match = Object.entries(logos).find(([path]) => path.endsWith(file));
  return match ? match[1] : '';
}

export default function Sponsors() {
  return (
    <main>
      <section className="page-hero">
        <div className="eyebrow">Our partners</div>
        <h1>Sponsors</h1>
        <p className="lede">Made possible with support from the organisations below.</p>
      </section>

      <section className="section">
        <div className="section-inner">
          <div className="sponsor-grid">
            {SPONSORS.map((s, i) => (
              <Reveal as="div" key={s.name} delay={i * 100} className="sponsor-card">
                <img src={logoSrc(s.file)} alt={s.name} />
                <div className="sponsor-name">{s.name}</div>
                <div className="sponsor-tier">{s.tier}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section alt" id="sponsor">
        <div className="section-inner narrow">
          <h2>Become a sponsor or volunteer</h2>
          <p>
            Partner packages range from race-day branding to title sponsorship, and we're
            also looking for volunteers for water stations, marshalling and the finish line.
          </p>
          <a className="btn-primary" href={`tel:${EVENT.phone.replace(/\s/g, '')}`}>Call {EVENT.phone}</a>
        </div>
      </section>

      <section className="section" id="contact">
        <div className="section-inner narrow">
          <h2>Contact the secretariat</h2>
          <p>{EVENT.venue}</p>
          <p><a href={`tel:${EVENT.phone.replace(/\s/g, '')}`}>{EVENT.phone}</a></p>
        </div>
      </section>
    </main>
  );
}
