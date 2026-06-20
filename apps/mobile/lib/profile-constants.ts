export const CTC_OPTIONS = [
  'Not disclosed',
  '0 - 3 LPA',
  '3 - 6 LPA',
  '6 - 10 LPA',
  '10 - 15 LPA',
  '15 - 25 LPA',
  '25 - 50 LPA',
  '50+ LPA',
];

export const INDUSTRY_OPTIONS = [
  'IT Services & Consulting',
  'Software Product',
  'Internet / E-commerce',
  'BFSI',
  'Healthcare',
  'Education / EdTech',
  'Manufacturing',
  'Retail',
  'Telecom',
  'Media & Entertainment',
  'Real Estate',
  'Hospitality',
  'Logistics',
  'Automobile',
  'Pharma & Life Sciences',
  'Other',
];

export const COMPANY_TYPE_OPTIONS = [
  'Startup',
  'SME',
  'MNC',
  'Public Sector',
  'NGO / Non-profit',
  'Consulting',
  'Agency',
  'Other',
];

export const COMPANY_SIZE_OPTIONS = [
  '1-10 employees',
  '11-50 employees',
  '51-200 employees',
  '201-500 employees',
  '501-1000 employees',
  '1000+ employees',
];

export const NOTICE_OPTIONS = [
  'Immediately',
  '15 Days',
  '1 Month',
  '2 Months',
  '3 Months',
  '6 Months',
  'Serving Notice Period',
];

export const EXPERIENCE_OPTIONS = [
  { label: 'Fresher', value: '0' },
  ...Array.from({ length: 30 }, (_, i) => ({
    label: `${i + 1} year${i === 0 ? '' : 's'}`,
    value: String(i + 1),
  })),
  { label: '30+ years', value: '31' },
];
