// Regras de negócio do Fizza. Funções puras; valores em centavos.
import { addMonths, compareMonths, currentMonth, daysInMonth, monthOf } from './months';
import { categoryKey, resolveCategory } from './categories';

export function isActiveInMonth({ start_month, end_month }, month) {
  if (start_month && compareMonths(month, start_month) < 0) return false;
  if (end_month && compareMonths(month, end_month) > 0) return false;
  return true;
}

export function effectiveDueDay(dueDay, month) {
  return Math.min(dueDay, daysInMonth(month));
}

export function recurringAmountForMonth(rec, month) {
  return rec.payments?.[month]?.amount_cents ?? rec.amount_cents ?? 0;
}

export function endMonthForInstallments(startMonth, installments) {
  return addMonths(startMonth, installments - 1);
}

export function incomeActiveInMonth(income, month) {
  if (income.kind === 'once') return Boolean(income.date) && monthOf(income.date) === month;
  return isActiveInMonth(income, month);
}

const sum = (items, fn) => items.reduce((s, x) => s + fn(x), 0);

const variableOfMonth = (expenses, month) => expenses.filter((e) => e.date && monthOf(e.date) === month);
const fixedOfMonth = (recurring, month) => recurring.filter((r) => isActiveInMonth(r, month));

export function monthSummary({ expenses = [], recurring = [], incomes = [] }, month) {
  const incomeCents = sum(incomes.filter((i) => incomeActiveInMonth(i, month)), (i) => i.amount_cents || 0);
  const variableCents = sum(variableOfMonth(expenses, month), (e) => e.amount_cents || 0);
  const fixedCents = sum(fixedOfMonth(recurring, month), (r) => recurringAmountForMonth(r, month));
  const totalCents = variableCents + fixedCents;
  return { incomeCents, variableCents, fixedCents, totalCents, balanceCents: incomeCents - totalCents };
}

// Percentuais com uma casa decimal que somam exatamente 100 (maior resto).
function percentsSummingTo100(values) {
  const total = sum(values, (v) => v);
  if (total === 0) return values.map(() => 0);
  const raw = values.map((v) => (v / total) * 1000);
  const floors = raw.map(Math.floor);
  let missing = 1000 - sum(floors, (v) => v);
  raw
    .map((r, i) => ({ i, rest: r - floors[i] }))
    .sort((a, b) => b.rest - a.rest)
    .forEach(({ i }) => {
      if (missing > 0) { floors[i] += 1; missing -= 1; }
    });
  return floors.map((f) => f / 10);
}

export function categoryBreakdown({ expenses = [], recurring = [] }, month, filter, categories) {
  const items = [];
  if (filter !== 'fixed') {
    variableOfMonth(expenses, month).forEach((e) => items.push({ category: e.category, cents: e.amount_cents || 0 }));
  }
  if (filter !== 'variable') {
    fixedOfMonth(recurring, month).forEach((r) => items.push({ category: r.category, cents: recurringAmountForMonth(r, month) }));
  }

  const groups = new Map();
  items.forEach(({ category, cents }) => {
    const resolved = resolveCategory(category, categories);
    const key = categoryKey(resolved.name);
    const group = groups.get(key) || { ...resolved, cents: 0 };
    group.cents += cents;
    groups.set(key, group);
  });

  const slices = [...groups.values()].filter((g) => g.cents > 0).sort((a, b) => b.cents - a.cents);
  const percents = percentsSummingTo100(slices.map((s) => s.cents));
  return slices.map((s, i) => ({ ...s, percent: percents[i] }));
}

export function recurringStatus(rec, month, today = new Date()) {
  if (rec.payments?.[month]) return 'paid';
  const cmp = compareMonths(month, currentMonth(today));
  if (cmp < 0) return 'overdue';
  if (cmp > 0) return 'upcoming';
  const due = effectiveDueDay(rec.due_day, month);
  const day = today.getDate();
  if (due === day) return 'today';
  return due < day ? 'overdue' : 'upcoming';
}
