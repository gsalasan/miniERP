// Tax utilities for HR frontend
// PTKP options and simple PPh21 estimator aligned with available data fields

export type PTKPCode = 'TK/0' | 'TK/1' | 'K/0' | 'K/1' | 'K/2' | 'K/3';

export const PTKP_VALUES: Record<PTKPCode, number> = {
  'TK/0': 54000000,
  'TK/1': 58500000,
  'K/0': 58500000,
  'K/1': 63000000,
  'K/2': 67500000,
  'K/3': 72000000,
};

export const PTKP_OPTIONS: Array<{ code: PTKPCode; label: string }> = [
  { code: 'TK/0', label: 'TK/0 - Tidak Kawin, 0 Tanggungan' },
  { code: 'TK/1', label: 'TK/1 - Tidak Kawin, 1 Tanggungan' },
  { code: 'K/0', label: 'K/0  - Kawin, 0 Tanggungan' },
  { code: 'K/1', label: 'K/1  - Kawin, 1 Tanggungan' },
  { code: 'K/2', label: 'K/2  - Kawin, 2 Tanggungan' },
  { code: 'K/3', label: 'K/3  - Kawin, 3 Tanggungan' },
];

// Normalize NPWP by keeping only digits; optionally return formatted string if desired
export function normalizeNpwp(npwp: string): string {
  const digits = (npwp || '').replace(/\D/g, '').slice(0, 15);
  return digits;
}

// Validate NPWP: either 15 digits (normalized) or formatted pattern 99.999.999.9-999.999
export function isValidNpwp(npwp: string): boolean {
  if (!npwp) return true; // optional field
  const digits = npwp.replace(/\D/g, '');
  if (digits.length === 15) return true;
  const formatted = /^\d{2}\.\d{3}\.\d{3}\.\d-\d{3}\.\d{3}$/;
  return formatted.test(npwp);
}

export function sumAllowancesFromArray(allowances: Array<{ name: string; amount: number }>): number {
  return (allowances || []).reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
}

// Estimate simple PPh21 per month (approx) based on salary, allowances, PTKP and NPWP existence.
// This uses a simplified approach without BPJS, biaya jabatan, or pension; meant as an indicative preview only.
export function estimatePPh21Monthly(
  basicSalary: number,
  totalAllowances: number,
  ptkpCode: string | undefined,
  hasNpwp: boolean
): number {
  const brutoMonthly = (Number(basicSalary) || 0) + (Number(totalAllowances) || 0);
  const netMonthly = brutoMonthly; // simplified, no other deductions in current system
  const netAnnual = netMonthly * 12;

  const ptkpAnnual = PTKP_VALUES[(ptkpCode as PTKPCode) || 'TK/0'] || PTKP_VALUES['TK/0'];
  let pkp = Math.max(0, netAnnual - ptkpAnnual);
  // round down to nearest thousand
  pkp = Math.floor(pkp / 1000) * 1000;

  let pphAnnual = 0;
  const tiers = [
    { upTo: 60000000, rate: 0.05 },
    { upTo: 250000000, rate: 0.15 },
    { upTo: 500000000, rate: 0.25 },
    { upTo: 5000000000, rate: 0.30 },
    { upTo: Infinity, rate: 0.35 },
  ];

  let remaining = pkp;
  let prevCap = 0;
  for (const tier of tiers) {
    const cap = tier.upTo;
    if (remaining <= 0) break;
    const taxable = Math.max(0, Math.min(remaining, cap - prevCap));
    if (taxable > 0) {
      pphAnnual += taxable * tier.rate;
      remaining -= taxable;
    }
    prevCap = cap;
  }

  let pphMonthly = pphAnnual / 12;
  if (!hasNpwp && pphMonthly > 0) pphMonthly *= 1.2; // 20% higher without NPWP

  // round to nearest 1 rupiah (keep as number)
  return Math.round(pphMonthly);
}

export function formatCurrencyID(value: number): string {
  try {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
      Number(value) || 0
    );
  } catch {
    return `Rp ${Math.round(Number(value) || 0).toLocaleString('id-ID')}`;
  }
}
