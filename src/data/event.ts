export const EVENT = {
  title: 'Copperbelt Marathon 2026',
  tagline: 'The pulse of the Copperbelt',
  date: '10 October 2026',
  isoDate: '2026-10-10T06:00:00',
  venue: 'ECL Mall, Kitwe',
  prizeFund: 'K500,000',
  phone: '+260 764 915 118',
  email: 'copperbeltmarathon@gmail.com',
  runnersExpected: '6,000+',
  courseLimit: '6h 15m',
};

export const STATS = [
  { value: '4', label: 'Race distances' },
  { value: '42.2km', label: 'Full marathon' },
  { value: 'K500k', label: 'Prize fund' },
  { value: '6,000+', label: 'Runners and Spectators' },
];

export const COUNTERS = [
  { target: 6000, suffix: '+', label: 'Runners and Spectators' },
  // { target: 15000, suffix: '+', label: 'Spectators expected' },
  { target: 500000, prefix: 'K', label: 'Prize fund' },
  { target: 300, suffix: '+', label: 'Volunteers on course' },
];

export const DISTANCES = [
  { code: '42.195KM', categoryCode: 'full-marathon', label: 'Full Marathon', start: '05:30' },
  { code: '21.1KM', categoryCode: 'half-marathon', label: 'Half Marathon', start: '05:45' },
  { code: '10KM', categoryCode: '10k', label: 'Challenge', start: '06:00' },
  { code: '5KM', categoryCode: '5k-fun-run', label: 'Fun Run & Walk', start: '06:15' },
];

export const SCHEDULE = [
  { time: '05:00', label: 'Start area opens', note: 'Bib holders only' },
  { time: '05:30', label: '42.2km Full Marathon', note: 'Gun start' },
  { time: '05:45', label: '21.1km Half Marathon', note: 'Gun start' },
  { time: '06:00', label: '10km Challenge', note: 'Gun start' },
  { time: '06:15', label: '5km Fun Run & Walk', note: 'Gun start' },
];

export const FEATURES = [
  { title: 'Certified route', desc: 'A measured course through central Kitwe, closed to traffic on race morning.' },
  { title: 'Electronic timing', desc: 'Chip timing on every bib gives you an accurate split and finish time.' },
  { title: 'Finisher medal', desc: 'Every runner who crosses the line takes home a commemorative medal.' },
  { title: 'Full race pack', desc: 'Bib, event t-shirt, cap and performance socks included with entry.' },
  { title: 'Hydration & medical', desc: 'Water points and first-aid support are spaced along every distance.' },
  { title: 'Community categories', desc: 'Dedicated entries for schools, veterans and differently-abled runners.' },
];

export const PACKAGE_ITEMS = [
  'Official event T-shirt',
  'Finisher medal',
  'Running cap',
  'Race bib number',
  'Electronic timing',
  'Finisher certificate',
  'Hydration support',
  'Medical support',
];

// export const PACKAGE_ITEMS = [
//   'Official event T-shirt',
//   'Finisher medal',
//   'Running cap',
//   'Performance running socks',
//   'Arm sleeves',
//   'Race bib number',
//   'Electronic timing',
//   'Finisher certificate',
//   'Hydration support',
//   'Medical support',
// ];

export const PRIZE_ITEMS = [
  'Cash prizes',
  'Championship titles',
  'Finisher medals',
  'Sponsor gifts',
  'Lucky draw prizes',
  'Special achievement awards',
  'Youth recognition awards',
];

export const SPONSORS = [
  { name: 'FIT Sports Drink', file: 'fit.png', tier: 'Presenting sponsor' },
  { name: 'Vatra Mineral Water', file: 'vatra.png', tier: 'Hydration partner' },
  { name: 'Zambia Athletics', file: 'za.png', tier: 'Governing body' },
  { name: 'Kwendura Infinity Corporation', file: 'kwendura.jpg', tier: 'Official partner' },
  { name: 'Enax Technology Limited', file: 'enax-logo.png', tier: 'Technology partner' },
  { name: 'Limitless Consultancy and Research Limited', file: 'limitless-logo.png', tier: 'Offical partner' },
];
