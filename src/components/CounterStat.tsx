import { useReveal } from '../hooks/useReveal';
import { useCountUp } from '../hooks/useCountUp';

export default function CounterStat({
  target,
  label,
  prefix = '',
  suffix = '',
  delay = 0,
}: {
  target: number;
  label: string;
  prefix?: string;
  suffix?: string;
  delay?: number;
}) {
  const { ref, visible } = useReveal<HTMLDivElement>(0.5);
  const value = useCountUp(target, visible, 1500);

  return (
    <div ref={ref} className="counter-item reveal" style={{ opacity: visible ? 1 : 0, transitionDelay: `${delay}ms` }}>
      <div className="counter-value">
        {prefix}
        {value.toLocaleString()}
        {suffix}
      </div>
      <div className="counter-label">{label}</div>
    </div>
  );
}
