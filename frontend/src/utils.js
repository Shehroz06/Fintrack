// Formats as Pakistani Rupees, e.g. "Rs. 1,234.56" — single source of truth
// for currency display so every screen stays consistent.
export function money(value) {
  const n = Number(value || 0);
  const safe = Number.isFinite(n) ? n : 0;
  const formatted = safe.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `Rs. ${formatted}`;
}

export function percent(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n.toFixed(1) : '0.0';
}

// Today's date in the browser's local timezone, as YYYY-MM-DD.
// (`new Date().toISOString()` reflects UTC, which drifts to the wrong
// calendar day for part of the day in timezones ahead of UTC.)
export function todayLocalISODate() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 'YYYY-MM' for a transaction date, read via local getters so it matches
// the calendar day the server intended (see todayLocalISODate above).
export function monthKey(dateValue) {
  const d = new Date(dateValue);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export const PERIOD_OPTIONS = [
  { id: 'this-month', label: 'This Month' },
  { id: 'last-month', label: 'Last Month' },
  { id: 'this-year', label: 'This Year' },
  { id: 'all-time', label: 'All Time' }
];

export function periodLabel(period) {
  return PERIOD_OPTIONS.find(p => p.id === period)?.label || 'All Time';
}

export function filterByPeriod(transactions, period) {
  if (period === 'all-time') return transactions;

  const now = new Date();

  if (period === 'this-month') {
    const currentKey = monthKey(now);
    return transactions.filter(t => monthKey(t.transaction_date) === currentKey);
  }

  if (period === 'last-month') {
    const lastMonthKey = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    return transactions.filter(t => monthKey(t.transaction_date) === lastMonthKey);
  }

  if (period === 'this-year') {
    const currentYear = now.getFullYear();
    return transactions.filter(t => new Date(t.transaction_date).getFullYear() === currentYear);
  }

  return transactions;
}
