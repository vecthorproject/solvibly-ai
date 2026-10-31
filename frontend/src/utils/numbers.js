// Number helpers shared by the input forms.

/**
 * Parses amounts written in Italian or US style:
 * "1.234.567,89", "1,234,567.89", "(1.234)", "€ -12.500", "12,5".
 * Returns null when the text is not a number.
 */
export function parseLocaleNumber(raw) {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  let s = String(raw).trim();
  if (!s) return null;
  let negative = s.startsWith('(') && s.endsWith(')');
  s = s.replace(/[^\d,.-]/g, '');
  if (s.includes('-')) {
    negative = negative || s.startsWith('-');
    s = s.replace(/-/g, '');
  }
  if (!/\d/.test(s)) return null;
  if (s.includes(',') && s.includes('.')) {
    s = s.lastIndexOf(',') > s.lastIndexOf('.')
      ? s.replace(/\./g, '').replace(',', '.')
      : s.replace(/,/g, '');
  } else if (s.includes(',')) {
    const parts = s.split(',');
    const thousands = parts.length > 2 || (parts[parts.length - 1].length === 3 && !['', '0'].includes(parts[0]));
    s = thousands ? s.replace(/,/g, '') : s.replace(',', '.');
  } else if ((s.match(/\./g) || []).length > 1) {
    s = s.replace(/\./g, '');
  } else if (s.includes('.')) {
    const [head, tail] = s.split('.');
    if (tail.length === 3 && !['', '0'].includes(head)) s = head + tail;
  }
  const v = Number(s);
  if (!Number.isFinite(v)) return null;
  return negative ? -v : v;
}

/** Blocks characters that make no sense in an amount; "-" only where negatives are allowed. */
export function makeNumberKeyDownHandler(allowNegative = false) {
  return (e) => {
    const blocked = allowNegative ? ['e', 'E', '+'] : ['e', 'E', '+', '-'];
    if (blocked.includes(e.key) || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
    }
  };
}

/**
 * Paste handler for <input type="number">: converts formatted amounts
 * (thousands separators, currency symbols, parentheses) and rejects text.
 * `setValue(name, value)` receives the cleaned value as a string.
 */
export function makePasteHandler(setValue, allowNegative = false) {
  return (e) => {
    const text = e.clipboardData.getData('text');
    e.preventDefault();
    const v = parseLocaleNumber(text);
    if (v === null) return;
    if (!allowNegative && v < 0) return;
    setValue(e.target.name, String(v));
  };
}

export function preventWheelChange(e) {
  e.target.blur();
}

export function formatEuro(v) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return 'n.d.';
  return `€ ${v.toLocaleString('it-IT', { maximumFractionDigits: 0 })}`;
}

export function formatNumber(v, digits = 2) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return 'n.d.';
  return v.toLocaleString('it-IT', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function formatPercent(v, digits = 1) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return 'n.d.';
  return `${(v * 100).toLocaleString('it-IT', { maximumFractionDigits: digits })}%`;
}

export function formatDate(iso) {
  if (!iso) return 'n.d.';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? 'n.d.' : d.toLocaleDateString('it-IT');
}
