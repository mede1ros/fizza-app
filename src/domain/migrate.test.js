import { migrateV1ToV2, STORES, SCHEMA_VERSION } from './migrate';

test('constantes', () => {
  expect(SCHEMA_VERSION).toBe(2);
  expect(STORES).toEqual(['Expense', 'RecurringExpense', 'Income', 'FinancialGoal', 'ShoppingItem', 'Category']);
});

test('migra gasto, fixo pago, renda e categorias', () => {
  const v2 = migrateV1ToV2({
    Expense: [{ id: 'e1', name: 'Almoço', amount: 25.5, category: 'Alimentação', month_year: '2026-10', date: '2026-10-30', created_date: '2026-10-30T10:00:00Z' }],
    RecurringExpense: [{ id: 'r1', name: 'Aluguel', amount: 1200, due_day: 5, is_paid_this_month: true, paid_month_year: '2026-10', created_date: '2026-09-15T00:00:00Z' }],
    MonthlyBudget: [{ id: 'b1', month_year: '2026-10', income: 3000 }],
  });
  expect(v2.Expense[0]).toMatchObject({ id: 'e1', amount_cents: 2550, date: '2026-10-30' });
  expect(v2.Expense[0]).not.toHaveProperty('month_year');
  expect(v2.Expense[0]).not.toHaveProperty('amount');
  expect(v2.RecurringExpense[0]).toMatchObject({ amount_cents: 120000, start_month: '2026-09', payments: { '2026-10': { amount_cents: 120000 } } });
  expect(v2.RecurringExpense[0]).not.toHaveProperty('is_paid_this_month');
  expect(v2.Income[0]).toMatchObject({ name: 'Renda', kind: 'once', date: '2026-10-01', amount_cents: 300000 });
  expect(v2.Category).toHaveLength(11);
  v2.Category.forEach((c) => expect(typeof c.id).toBe('string'));
});

test('gasto v1 sem data usa o dia 1 do month_year', () => {
  expect(migrateV1ToV2({ Expense: [{ amount: 1, category: 'X', month_year: '2026-08' }] }).Expense[0].date).toBe('2026-08-01');
});

test('metas e compras viram centavos', () => {
  const v2 = migrateV1ToV2({
    FinancialGoal: [{ id: 'g', title: 'Viagem', target_amount: 1500, saved_amount: 200.1, status: 'active' }],
    ShoppingItem: [{ id: 's', name: 'Violão', budget: 899.9, priority: 'alta', purchased: false }],
  });
  expect(v2.FinancialGoal[0]).toMatchObject({ target_cents: 150000, saved_cents: 20010 });
  expect(v2.ShoppingItem[0]).toMatchObject({ budget_cents: 89990 });
});

test('entrada vazia gera stores vazias + categorias padrão', () => {
  const v2 = migrateV1ToV2({});
  STORES.filter((s) => s !== 'Category').forEach((s) => expect(v2[s]).toEqual([]));
});
