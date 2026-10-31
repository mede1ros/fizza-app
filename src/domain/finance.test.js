import {
  isActiveInMonth, effectiveDueDay, recurringAmountForMonth, endMonthForInstallments,
  monthSummary, categoryBreakdown, recurringStatus, incomeActiveInMonth,
} from './finance';
import { DEFAULT_CATEGORIES } from './categories';

const rec = { amount_cents: 10000, category: 'Moradia', due_day: 31, start_month: '2026-11', payments: {} };

test('fixo não conta antes do início nem depois do fim', () => {
  expect(isActiveInMonth(rec, '2026-10')).toBe(false);
  expect(isActiveInMonth(rec, '2026-11')).toBe(true);
  expect(isActiveInMonth({ ...rec, end_month: '2027-01' }, '2027-02')).toBe(false);
  expect(isActiveInMonth({ ...rec, end_month: '2027-01' }, '2027-01')).toBe(true);
});

test('valor pago ajustado vale só no mês do pagamento', () => {
  const r = { ...rec, payments: { '2026-11': { paid_at: '2026-11-05', amount_cents: 12345 } } };
  expect(recurringAmountForMonth(r, '2026-11')).toBe(12345);
  expect(recurringAmountForMonth(r, '2026-12')).toBe(10000);
});

test('vencimento 31 em fevereiro vira 28', () => {
  expect(effectiveDueDay(31, '2027-02')).toBe(28);
  expect(effectiveDueDay(15, '2027-02')).toBe(15);
  expect(recurringStatus(rec, '2027-02', new Date(2027, 1, 28))).toBe('today');
});

test('parcelas 10x a partir de 2026-11 terminam em 2027-08', () => {
  expect(endMonthForInstallments('2026-11', 10)).toBe('2027-08');
});

test('monthSummary soma variáveis do mês + fixos ativos + renda', () => {
  const data = {
    expenses: [
      { amount_cents: 2550, category: 'Alimentação', date: '2026-11-03' },
      { amount_cents: 999, category: 'Lazer', date: '2026-10-31' },
    ],
    recurring: [rec],
    incomes: [
      { kind: 'fixed', amount_cents: 500000, start_month: '2026-01' },
      { kind: 'once', amount_cents: 30000, date: '2026-11-10' },
    ],
  };
  expect(monthSummary(data, '2026-11')).toEqual({
    incomeCents: 530000, variableCents: 2550, fixedCents: 10000, totalCents: 12550, balanceCents: 517450,
  });
  expect(monthSummary(data, '2026-10').fixedCents).toBe(0);
  expect(monthSummary(data, '2026-10').incomeCents).toBe(500000);
});

test('categorias com grafias diferentes viram uma fatia e % fecha 100', () => {
  const expenses = ['lazer', 'Lazer ', 'LÁZER', 'Alimentação'].map((c) => ({ amount_cents: 1000, category: c, date: '2026-11-01' }));
  const slices = categoryBreakdown({ expenses, recurring: [] }, '2026-11', 'all', DEFAULT_CATEGORIES);
  expect(slices.map((s) => s.name)).toEqual(['Lazer', 'Alimentação']);
  expect(slices[0]).toMatchObject({ color: '#ec4899', cents: 3000, percent: 75 });
  expect(slices.reduce((s, x) => s + x.percent, 0)).toBeCloseTo(100, 5);
});

test('três fatias iguais somam 100.0', () => {
  const expenses = ['A', 'B', 'C'].map((c) => ({ amount_cents: 100, category: c, date: '2026-11-01' }));
  const p = categoryBreakdown({ expenses, recurring: [] }, '2026-11', 'all', []).map((s) => s.percent);
  expect(p.reduce((a, b) => a + b, 0)).toBeCloseTo(100, 5);
  p.forEach((x) => expect(Math.round(x * 10)).toBeCloseTo(x * 10, 5));
});

test('pizza vazia', () => {
  expect(categoryBreakdown({ expenses: [], recurring: [] }, '2026-11', 'all', [])).toEqual([]);
});

test('filtro fixed / variable', () => {
  const expenses = [{ amount_cents: 500, category: 'Lazer', date: '2026-11-02' }];
  const data = { expenses, recurring: [rec] };
  expect(categoryBreakdown(data, '2026-11', 'fixed', DEFAULT_CATEGORIES).map((s) => s.name)).toEqual(['Moradia']);
  expect(categoryBreakdown(data, '2026-11', 'variable', DEFAULT_CATEGORIES).map((s) => s.name)).toEqual(['Lazer']);
});

test('status em mês passado sem pagamento é overdue, futuro é upcoming', () => {
  const r = { ...rec, start_month: '2026-01' };
  const today = new Date(2026, 9, 30);
  expect(recurringStatus(r, '2026-09', today)).toBe('overdue');
  expect(recurringStatus(r, '2026-12', today)).toBe('upcoming');
});

test('status no mês atual', () => {
  const r = { ...rec, start_month: '2026-01', due_day: 10 };
  expect(recurringStatus(r, '2026-10', new Date(2026, 9, 9))).toBe('upcoming');
  expect(recurringStatus(r, '2026-10', new Date(2026, 9, 10))).toBe('today');
  expect(recurringStatus(r, '2026-10', new Date(2026, 9, 11))).toBe('overdue');
  const paid = { ...r, payments: { '2026-10': { paid_at: '2026-10-11', amount_cents: 10000 } } };
  expect(recurringStatus(paid, '2026-10', new Date(2026, 9, 11))).toBe('paid');
});

test('incomeActiveInMonth', () => {
  expect(incomeActiveInMonth({ kind: 'once', date: '2026-11-10' }, '2026-11')).toBe(true);
  expect(incomeActiveInMonth({ kind: 'once', date: '2026-11-10' }, '2026-12')).toBe(false);
  expect(incomeActiveInMonth({ kind: 'fixed', start_month: '2026-11', end_month: '2026-12' }, '2027-01')).toBe(false);
});
