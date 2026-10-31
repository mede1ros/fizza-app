import { buildBackup, parseBackup, backupFileName } from './backup';

const empty = () => ({ Expense: [], RecurringExpense: [], Income: [], FinancialGoal: [], ShoppingItem: [], Category: [] });

test('backup ida e volta', () => {
  const data = empty();
  data.Expense.push({ id: 'a', name: 'Almoço', amount_cents: 100, date: '2026-10-01' });
  const res = parseBackup(JSON.stringify(buildBackup(data, new Date('2026-10-30T12:00:00Z'))));
  expect(res).toMatchObject({ ok: true, data, summary: { Expense: 1, RecurringExpense: 0 } });
});

test('buildBackup tem cabeçalho', () => {
  expect(buildBackup(empty(), new Date('2026-10-30T12:00:00Z'))).toMatchObject({
    app: 'fizza', schema_version: 2, exported_at: '2026-10-30T12:00:00.000Z',
  });
});

test.each([
  ['', 'Arquivo inválido: não é um backup do Fizza'],
  ['não é json', 'Arquivo inválido: não é um backup do Fizza'],
  ['{"app":"outro"}', 'Arquivo inválido: não é um backup do Fizza'],
  ['{"app":"fizza","schema_version":2,"data":{"Expense":"x"}}', 'Backup corrompido: Expense inválido'],
  ['{"app":"fizza","schema_version":2,"data":{"Expense":[{"name":"sem id"}]}}', 'Backup corrompido: Expense inválido'],
  ['{"app":"fizza","schema_version":99,"data":{}}', 'Backup de uma versão mais nova do Fizza'],
])('parseBackup recusa %s', (text, error) => {
  expect(parseBackup(text)).toEqual({ ok: false, error });
});

test('aceita backup v1 e migra', () => {
  const v1 = { app: 'fizza', schema_version: 1, data: { Expense: [{ id: 'x', amount: 10, category: 'Lazer', date: '2026-10-02' }] } };
  const res = parseBackup(JSON.stringify(v1));
  expect(res.ok).toBe(true);
  expect(res.data.Expense[0]).toMatchObject({ id: 'x', amount_cents: 1000 });
});

test('stores ausentes viram listas vazias', () => {
  const res = parseBackup(JSON.stringify({ app: 'fizza', schema_version: 2, data: { Expense: [] } }));
  expect(res.ok).toBe(true);
  expect(res.data.Income).toEqual([]);
});

test('backupFileName', () => {
  expect(backupFileName(new Date(2026, 9, 30))).toBe('fizza-backup-2026-10-30.json');
});
