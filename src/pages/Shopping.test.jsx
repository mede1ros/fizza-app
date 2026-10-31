import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Shopping from './Shopping';
import { db } from '@/api/db';
import { freshDb, renderPage } from '@/test/utils';

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 15, 12));
  await freshDb();
});
afterEach(() => vi.useRealTimers());

test('comprar item e registrar como gasto', async () => {
  const user = userEvent.setup();
  await db.entities.ShoppingItem.create({ name: 'Violão', budget_cents: 30000, category: 'Lazer', priority: 'alta', purchased: false });
  renderPage(<Shopping />, { month: '2026-10' });

  await user.click(await screen.findByRole('button', { name: 'Marcar Violão como comprado' }));
  const ask = await screen.findByRole('alertdialog');
  await user.click(within(ask).getByRole('button', { name: 'Registrar gasto' }));
  const form = await screen.findByRole('dialog');
  expect(within(form).getByLabelText('Valor')).toHaveValue('300,00');
  await user.click(within(form).getByRole('button', { name: 'Salvar' }));

  await waitFor(async () => {
    expect(await db.entities.Expense.list()).toEqual([
      expect.objectContaining({ name: 'Violão', amount_cents: 30000, category: 'Lazer', date: '2026-10-15' }),
    ]);
  });
  expect((await db.entities.ShoppingItem.list())[0].purchased).toBe(true);
});

test('comprar sem registrar gasto', async () => {
  const user = userEvent.setup();
  await db.entities.ShoppingItem.create({ name: 'Livro', budget_cents: 5000, priority: 'média', purchased: false });
  renderPage(<Shopping />);
  await user.click(await screen.findByRole('button', { name: 'Marcar Livro como comprado' }));
  const ask = await screen.findByRole('alertdialog');
  await user.click(within(ask).getByRole('button', { name: 'Cancelar' }));
  await waitFor(async () => expect((await db.entities.ShoppingItem.list())[0].purchased).toBe(true));
  expect(await db.entities.Expense.list()).toEqual([]);
});

test('novo item com orçamento opcional', async () => {
  const user = userEvent.setup();
  renderPage(<Shopping />);
  await user.click(screen.getByRole('button', { name: 'Novo item' }));
  const form = await screen.findByRole('dialog');
  await user.type(within(form).getByLabelText('Nome'), 'Tênis');
  await user.click(within(form).getByRole('button', { name: 'Alta' }));
  await user.click(within(form).getByRole('button', { name: 'Salvar' }));
  await waitFor(async () => {
    expect(await db.entities.ShoppingItem.list()).toEqual([
      expect.objectContaining({ name: 'Tênis', budget_cents: null, priority: 'alta', purchased: false }),
    ]);
  });
});

test('orçamento inválido mostra erro', async () => {
  const user = userEvent.setup();
  renderPage(<Shopping />);
  await user.click(screen.getByRole('button', { name: 'Novo item' }));
  const form = await screen.findByRole('dialog');
  await user.type(within(form).getByLabelText('Nome'), 'X');
  await user.type(within(form).getByLabelText('Orçamento'), 'abc');
  await user.click(within(form).getByRole('button', { name: 'Salvar' }));
  expect(await within(form).findByText('Informe um valor válido maior que zero')).toBeInTheDocument();
});
