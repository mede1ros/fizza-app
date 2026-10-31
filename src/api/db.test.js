import { db } from './db';

beforeEach(async () => {
  await db._reset();
  localStorage.clear();
});

test('CRUD e ordenação', async () => {
  await db.init();
  const a = await db.entities.Expense.create({ name: 'A', amount_cents: 100, date: '2026-10-02' });
  await db.entities.Expense.create({ name: 'B', amount_cents: 200, date: '2026-10-05' });
  expect((await db.entities.Expense.list('-date')).map((e) => e.name)).toEqual(['B', 'A']);
  expect((await db.entities.Expense.list('date')).map((e) => e.name)).toEqual(['A', 'B']);
  const updated = await db.entities.Expense.update(a.id, { amount_cents: 150 });
  expect(updated).toMatchObject({ id: a.id, name: 'A', amount_cents: 150 });
  await db.entities.Expense.delete(a.id);
  expect(await db.entities.Expense.list()).toHaveLength(1);
});

test('create gera id e datas', async () => {
  await db.init();
  const r = await db.entities.Income.create({ name: 'Salário', amount_cents: 1 });
  expect(typeof r.id).toBe('string');
  expect(r.created_date).toBeTruthy();
  expect(r.updated_date).toBeTruthy();
});

test('update de id inexistente falha', async () => {
  await db.init();
  await expect(db.entities.Expense.update('nope', {})).rejects.toThrow();
});

test('migra dados do localStorage uma única vez', async () => {
  localStorage.setItem('fizza:Expense', JSON.stringify([{ id: 'x', name: 'Almoço', amount: 25.5, category: 'Alimentação', date: '2026-10-30', month_year: '2026-10' }]));
  await db.init();
  await db.init();
  expect(await db.entities.Expense.list()).toEqual([expect.objectContaining({ id: 'x', amount_cents: 2550 })]);
  expect(localStorage.getItem('fizza:Expense')).toBeNull();
  expect(await db.getMeta('v1_snapshot')).toBeTruthy();
  expect(await db.getMeta('schema_version')).toBe(2);
});

test('banco novo recebe categorias padrão', async () => {
  await db.init();
  expect(await db.entities.Category.list()).toHaveLength(11);
});

test('importAll substitui tudo; exportAll devolve igual', async () => {
  await db.init();
  await db.entities.Expense.create({ name: 'velho', amount_cents: 1, date: '2026-01-01' });
  const data = {
    Expense: [{ id: 'n', name: 'novo', amount_cents: 2, date: '2026-02-01' }],
    RecurringExpense: [], Income: [], FinancialGoal: [], ShoppingItem: [], Category: [],
  };
  await db.importAll(data);
  expect(await db.exportAll()).toEqual(data);
});

test('clearAll mantém categorias padrão e meta de versão', async () => {
  await db.init();
  await db.entities.Expense.create({ name: 'x', amount_cents: 1, date: '2026-01-01' });
  await db.clearAll();
  expect(await db.entities.Expense.list()).toEqual([]);
  expect(await db.entities.Category.list()).toHaveLength(11);
  expect(await db.getMeta('schema_version')).toBe(2);
});

test('setMeta / getMeta', async () => {
  await db.init();
  await db.setMeta('last_backup_at', '2026-10-30T00:00:00.000Z');
  expect(await db.getMeta('last_backup_at')).toBe('2026-10-30T00:00:00.000Z');
});
