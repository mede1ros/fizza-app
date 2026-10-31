import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Settings from './Settings';
import { db } from '@/api/db';
import { exportBackup } from '@/lib/backupActions';
import { buildBackup } from '@/domain/backup';
import { freshDb, renderPage } from '@/test/utils';

beforeEach(freshDb);
afterEach(() => {
  delete navigator.share;
  delete navigator.canShare;
});

const jsonFile = (text) => new File([text], 'backup.json', { type: 'application/json' });

test('arquivo inválido mostra erro e mantém os dados', async () => {
  const user = userEvent.setup();
  await db.entities.Expense.create({ name: 'Existente', amount_cents: 100, category: 'Outros', date: '2026-10-01' });
  renderPage(<Settings />);
  await user.upload(screen.getByLabelText('Arquivo de backup'), jsonFile('isto não é json'));
  expect(await screen.findByText('Arquivo inválido: não é um backup do Fizza')).toBeInTheDocument();
  expect(await db.entities.Expense.list()).toHaveLength(1);
});

test('backup válido mostra resumo e substitui após confirmar', async () => {
  const user = userEvent.setup();
  await db.entities.Expense.create({ name: 'Antigo', amount_cents: 100, category: 'Outros', date: '2026-10-01' });
  const data = {
    Expense: [
      { id: 'a', name: 'A', amount_cents: 100, category: 'Lazer', date: '2026-10-01' },
      { id: 'b', name: 'B', amount_cents: 200, category: 'Lazer', date: '2026-10-02' },
    ],
    RecurringExpense: [], Income: [], FinancialGoal: [], ShoppingItem: [], Category: [],
  };
  renderPage(<Settings />);
  await user.upload(screen.getByLabelText('Arquivo de backup'), jsonFile(JSON.stringify(buildBackup(data))));
  const dialog = await screen.findByRole('alertdialog');
  expect(dialog).toHaveTextContent('2 gastos');
  await user.click(within(dialog).getByRole('button', { name: 'Substituir dados' }));
  await waitFor(async () => {
    expect((await db.entities.Expense.list()).map((e) => e.id).sort()).toEqual(['a', 'b']);
  });
  expect(await screen.findByText('Backup restaurado')).toBeInTheDocument();
});

test('exportBackup compartilha e registra a data do backup', async () => {
  navigator.canShare = () => true;
  navigator.share = vi.fn().mockResolvedValue(undefined);
  await db.entities.Expense.create({ name: 'X', amount_cents: 100, category: 'Outros', date: '2026-10-01' });
  expect(await exportBackup()).toBe('shared');
  const [{ files }] = navigator.share.mock.calls[0];
  expect(files[0].name).toMatch(/^fizza-backup-\d{4}-\d{2}-\d{2}\.json$/);
  expect(await db.getMeta('last_backup_at')).toBeTruthy();
});

test('cancelar o compartilhamento não registra backup', async () => {
  navigator.canShare = () => true;
  navigator.share = vi.fn().mockRejectedValue(Object.assign(new Error('cancel'), { name: 'AbortError' }));
  expect(await exportBackup()).toBe('cancelled');
  expect(await db.getMeta('last_backup_at')).toBeUndefined();
});

test('se o iPhone recusar o compartilhamento, baixa o arquivo', async () => {
  navigator.canShare = () => true;
  navigator.share = vi.fn().mockRejectedValue(new DOMException('gesto perdido', 'NotAllowedError'));
  URL.createObjectURL = vi.fn(() => 'blob:fizza');
  URL.revokeObjectURL = vi.fn();
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  expect(await exportBackup()).toBe('downloaded');
  expect(click).toHaveBeenCalled();
  expect(await db.getMeta('last_backup_at')).toBeTruthy();
  click.mockRestore();
});

test('apagar tudo exige digitar APAGAR', async () => {
  const user = userEvent.setup();
  await db.entities.Expense.create({ name: 'X', amount_cents: 100, category: 'Outros', date: '2026-10-01' });
  renderPage(<Settings />);
  await user.click(screen.getByRole('button', { name: 'Apagar todos os dados' }));
  await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Continuar' }));
  const second = await screen.findByRole('alertdialog');
  const confirm = within(second).getByRole('button', { name: 'Apagar tudo' });
  expect(confirm).toBeDisabled();
  await user.type(within(second).getByLabelText('Digite APAGAR para confirmar'), 'APAGAR');
  await user.click(confirm);
  await waitFor(async () => expect(await db.entities.Expense.list()).toEqual([]));
});

test('mostra a versão do app', async () => {
  renderPage(<Settings />);
  expect(screen.getByText(/Versão 1\.0\.0/)).toBeInTheDocument();
});
