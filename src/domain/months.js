// Meses são strings "AAAA-MM"; datas são "AAAA-MM-DD". Tudo no fuso local.

const MONTH_NAMES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

const MONTH_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const pad = (n) => String(n).padStart(2, '0');

const split = (month) => month.split('-').map(Number);

export function currentMonth(today = new Date()) {
  return `${today.getFullYear()}-${pad(today.getMonth() + 1)}`;
}

export function todayISO(today = new Date()) {
  return `${currentMonth(today)}-${pad(today.getDate())}`;
}

export function monthOf(date) {
  return date.slice(0, 7);
}

export function addMonths(month, n) {
  const [y, m] = split(month);
  const index = y * 12 + (m - 1) + n;
  return `${Math.floor(index / 12)}-${pad((index % 12) + 1)}`;
}

export function compareMonths(a, b) {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

export function daysInMonth(month) {
  const [y, m] = split(month);
  return new Date(y, m, 0).getDate();
}

export function monthLabel(month) {
  const [y, m] = split(month);
  return `${MONTH_NAMES[m - 1]} de ${y}`;
}

export function monthShortLabel(month) {
  const [y, m] = split(month);
  return `${MONTH_SHORT[m - 1]}/${String(y).slice(2)}`;
}

export function formatDateBR(date) {
  const [y, m, d] = date.split('-');
  return `${d}/${m}/${y}`;
}
