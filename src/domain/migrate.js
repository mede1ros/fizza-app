// Conversão dos dados da versão 1 (localStorage, valores em reais) para a versão 2.
import { DEFAULT_CATEGORIES } from './categories';
import { monthOf } from './months';

export const SCHEMA_VERSION = 2;

export const STORES = ['Expense', 'RecurringExpense', 'Income', 'FinancialGoal', 'ShoppingItem', 'Category'];

export const newId = () =>
  globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);

const toCents = (reais) => Math.round((Number(reais) || 0) * 100);

const omit = (obj, keys) => Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));

const withId = (r) => ({ ...r, id: r.id || newId() });

export const defaultCategoryRecords = () =>
  DEFAULT_CATEGORIES.map((c) => ({ ...c, id: newId(), is_default: true }));

export function migrateV1ToV2(v1 = {}) {
  const Expense = (v1.Expense || []).map((e) => ({
    ...omit(withId(e), ['amount', 'month_year']),
    amount_cents: toCents(e.amount),
    date: e.date || `${e.month_year}-01`,
  }));

  const RecurringExpense = (v1.RecurringExpense || []).map((r) => {
    const amount_cents = toCents(r.amount);
    const payments = {};
    if (r.is_paid_this_month && r.paid_month_year) {
      payments[r.paid_month_year] = { paid_at: `${r.paid_month_year}-01`, amount_cents };
    }
    return {
      ...omit(withId(r), ['amount', 'is_paid_this_month', 'paid_month_year']),
      amount_cents,
      start_month: r.start_month || (r.created_date ? monthOf(r.created_date) : r.paid_month_year) || null,
      end_month: r.end_month || null,
      payments,
    };
  });

  const Income = (v1.MonthlyBudget || []).map((b) => ({
    id: newId(),
    name: 'Renda',
    kind: 'once',
    date: `${b.month_year}-01`,
    amount_cents: toCents(b.income),
    created_date: b.created_date,
    updated_date: b.updated_date,
  }));

  const FinancialGoal = (v1.FinancialGoal || []).map((g) => ({
    ...omit(withId(g), ['target_amount', 'saved_amount']),
    target_cents: toCents(g.target_amount),
    saved_cents: toCents(g.saved_amount),
  }));

  const ShoppingItem = (v1.ShoppingItem || []).map((s) => ({
    ...omit(withId(s), ['budget']),
    budget_cents: s.budget ? toCents(s.budget) : null,
  }));

  return { Expense, RecurringExpense, Income, FinancialGoal, ShoppingItem, Category: defaultCategoryRecords() };
}
