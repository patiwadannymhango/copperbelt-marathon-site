/**
 * Small inline-SVG brand marks for the payment method pickers. Drawn as
 * wordmarks (not traced from official artwork), so they're recognizable
 * without shipping trademarked logo files.
 */
import type { ReactElement } from 'react';

export function MtnLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-label="MTN Mobile Money">
      <circle cx="16" cy="16" r="16" fill="#FFCB05" />
      <text x="16" y="20" textAnchor="middle" fontSize="10.5" fontWeight="800" fontFamily="Arial, sans-serif" fill="#0a0a0a">
        MTN
      </text>
    </svg>
  );
}

export function AirtelLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-label="Airtel Money">
      <circle cx="16" cy="16" r="16" fill="#ED1C24" />
      <text x="16" y="20" textAnchor="middle" fontSize="8" fontWeight="800" fontFamily="Arial, sans-serif" fill="#fff">
        airtel
      </text>
    </svg>
  );
}

export function ZamtelLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-label="Zamtel Kwacha">
      <circle cx="16" cy="16" r="16" fill="#00A651" />
      <text x="16" y="20" textAnchor="middle" fontSize="7.5" fontWeight="800" fontFamily="Arial, sans-serif" fill="#fff">
        zamtel
      </text>
    </svg>
  );
}

export function VisaLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.64} viewBox="0 0 32 20.5" aria-label="Visa">
      <rect width="32" height="20.5" rx="3" fill="#1A1F71" />
      <text x="16" y="14.5" textAnchor="middle" fontSize="9" fontWeight="800" fontStyle="italic" fontFamily="Arial, sans-serif" fill="#fff">
        VISA
      </text>
    </svg>
  );
}

export function MastercardLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.64} viewBox="0 0 32 20.5" aria-label="Mastercard">
      <rect width="32" height="20.5" rx="3" fill="#16171B" />
      <circle cx="13.5" cy="10.25" r="6" fill="#EB001B" />
      <circle cx="18.5" cy="10.25" r="6" fill="#F79E1B" fillOpacity="0.9" />
    </svg>
  );
}

export function AmexLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.64} viewBox="0 0 32 20.5" aria-label="American Express">
      <rect width="32" height="20.5" rx="3" fill="#2E77BC" />
      <text x="16" y="13.5" textAnchor="middle" fontSize="6" fontWeight="800" fontFamily="Arial, sans-serif" fill="#fff">
        AMEX
      </text>
    </svg>
  );
}

export function CardLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-label="Card payment">
      <circle cx="16" cy="16" r="16" fill="#3A3F4B" />
      <rect x="7" y="11" width="18" height="12" rx="2" fill="#fff" />
      <rect x="7" y="14" width="18" height="3" fill="#3A3F4B" />
    </svg>
  );
}

export const PROVIDER_LOGO: Record<string, (props: { size?: number }) => ReactElement> = {
  MTN_MONEY: MtnLogo,
  AIRTEL_MONEY: AirtelLogo,
  ZAMTEL_KWACHA: ZamtelLogo,
};

export const PROVIDER_LABEL: Record<string, string> = {
  MTN_MONEY: 'MTN Mobile Money',
  AIRTEL_MONEY: 'Airtel Money',
  ZAMTEL_KWACHA: 'Zamtel Kwacha',
};
