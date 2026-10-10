import { EVENT } from '../data/event';
import Reveal from '../components/Reveal';

export default function About() {
  return (
    <main>
      <section className="page-hero">
        <div className="eyebrow">About the event</div>
        <h1>{EVENT.title}</h1>
        <p className="lede">
          A road running festival through Kitwe, the heart of Zambia's Copperbelt — starting
          and finishing at {EVENT.venue} on {EVENT.date}.
        </p>
      </section>

      <section className="section">
        <div className="section-inner narrow">
          <Reveal as="div" className="quick-facts">
            <div><strong>Route</strong>Out-and-back through central Kitwe, closed to traffic</div>
            <div><strong>Support</strong>Water and medical points along every distance</div>
            <div><strong>Timing</strong>Electronic chip timing with instant results</div>
            <div><strong>Community</strong>Open categories for schools, veterans and differently-abled runners</div>
          </Reveal>
        </div>
      </section>

    </main>
  );
}
