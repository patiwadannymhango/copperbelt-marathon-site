import { EVENT } from '../data/event';
import { RACE_CATEGORIES, type RegistrationRecord } from '../types';

const COPPER: [number, number, number] = [192, 106, 56];
const INK: [number, number, number] = [26, 17, 8];
const MUTED: [number, number, number] = [110, 101, 95];
const LINE: [number, number, number] = [225, 218, 210];

const GENDER_LABEL: Record<string, string> = { male: 'Male', female: 'Female' };
const AGE_LABEL: Record<string, string> = {
  'under-18': 'Under 18',
  '18-29': '18–29',
  '30-39': '30–39',
  '40-49': '40–49',
  '50-59': '50–59',
  '60-plus': '60+',
};
const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Confirmed',
  'pending-bank-transfer': 'Awaiting bank transfer',
  processing: 'Processing',
  failed: 'Failed',
};

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
}

/** Builds the ordered list of label/value rows to print, skipping anything
 * blank so a thinner record (e.g. from the "track registration" lookup,
 * which the backend only partially populates) still renders a clean receipt
 * instead of a page full of empty fields. */
function buildRows(record: RegistrationRecord & { amount?: number | null; currency?: string }): [string, string][] {
  const { details, payment } = record;
  const category = RACE_CATEGORIES.find((c) => c.value === details.raceCategory);
  const rows: [string, string][] = [];

  const add = (label: string, value: string | undefined | null) => {
    if (value && value.trim()) rows.push([label, value]);
  };

  add('Reference', record.reference);
  add('Status', STATUS_LABEL[record.status] ?? record.status);
  add('Submitted', fmtDate(record.submittedAt));
  add('Full name', details.fullName);
  add('Email', details.email);
  add('Phone', details.phone);
  add('Race category', category ? `${category.label}${category.distance ? ` (${category.distance})` : ''}` : '');
  add('Gender', GENDER_LABEL[details.gender] ?? '');
  add('Age range', AGE_LABEL[details.ageRange] ?? '');
  add('T-shirt size', details.tShirtSize);
  add('Attendance', details.attendanceType === 'virtual' ? 'Virtual' : 'In person');
  add('Club / institution', details.clubOrInstitution);
  add('Emergency contact', details.emergencyContactName);
  add('Emergency phone', details.emergencyContactPhone);
  if (record.amount != null) add('Amount paid', `${record.currency ?? 'K'} ${record.amount.toFixed(2)}`);
  add('Payment method', payment.method === 'card' ? 'Card' : payment.method === 'mobile-money' ? 'Mobile money' : '');
  if (payment.method === 'mobile-money') add('Mobile money provider', payment.provider?.replace('_', ' ') ?? '');

  return rows;
}

/** Generates and downloads a receipt PDF for a registration, entirely
 * client-side from data already in Redux state / the API response — no
 * backend receipt endpoint exists or is needed. jsPDF is dynamically
 * imported so its ~200KB doesn't sit in the main bundle for every visitor
 * who never registers. */
export async function downloadReceipt(
  record: RegistrationRecord & { amount?: number | null; currency?: string }
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 56;
  let y = 64;

  doc.setFillColor(...COPPER);
  doc.rect(0, 0, pageWidth, 8, 'F');

  doc.setTextColor(...COPPER);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(EVENT.title, margin, y);

  doc.setTextColor(...MUTED);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  y += 18;
  doc.text(`${EVENT.date} · ${EVENT.venue}`, margin, y);

  doc.setTextColor(...INK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  y += 34;
  doc.text('Registration receipt', margin, y);

  y += 10;
  doc.setDrawColor(...LINE);
  doc.line(margin, y, pageWidth - margin, y);

  const rows = buildRows(record);
  y += 28;
  const labelWidth = 150;

  for (const [label, value] of rows) {
    if (y > 760) {
      doc.addPage();
      y = 64;
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text(label, margin, y);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...INK);
    const valueLines = doc.splitTextToSize(value, pageWidth - margin - (margin + labelWidth));
    doc.text(valueLines, margin + labelWidth, y);
    y += 18 * valueLines.length;

    doc.setDrawColor(...LINE);
    doc.line(margin, y - 8, pageWidth - margin, y - 8);
  }

  y += 24;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(
    'This receipt is generated from your registration details and serves as proof of entry. Keep your reference number handy on race day.',
    margin,
    y,
    { maxWidth: pageWidth - margin * 2 }
  );
  y += 28;
  doc.text(`${EVENT.email}  ·  ${EVENT.phone}`, margin, y);

  doc.save(`${EVENT.title.replace(/\s+/g, '-')}-Receipt-${record.reference || 'registration'}.pdf`);
}
