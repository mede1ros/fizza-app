import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Goals from './Goals';
import { db } from '@/api/db';
import { freshDb, renderPage } from '@/test/utils';

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 15, 12));
  await freshDb();
});
afterEach(() => vi.useRealTimers());

test('dica usa a maior categoria variável do mês (BUG-08)', async () => {
  await db.entities.FinancialGoal.create({ title: 'Viagem', target_cents: 120000, saved_cents: 0, deadline: '2027-01', status: 'active' });
  await db.entities.Expense.create({ name: 'Mercado', amount_cents: 50000, category: 'Alimentação', date: '2026-10-02' });
  await db.entities.Expense.create({ name: 'Cinema', amount_cents: 2000, category: 'Lazer', date: '2026-10-03' });
  renderPage(<Goals />, { month: '2026-10' });
  const tip = await screen.findByTestId('dica-meta');
  expect(tip).toHaveTextContent('R$ 400,00/mês');
  expect(tip).toHaveTextContent('Alimentação');
  expect(tip).not.toHaveTextContent('Lazer');
});

test('dica sem gastos variáveis é só o valor mensal', async () => {
  await db.entities.FinancialGoal.create({ title: 'Reserva', target_cents: 60000, saved_cents: 0, deadline: '2026-12', status: 'active' });
  renderPage(<Goals />, { month: '2026-10' });
  const tip = await screen.findByTestId('dica-meta');
  expect(tip).toHaveTextContent('R$ 300,00/mês');
});

test('criar meta valida e salva em centavos', async () => {
  const user = userEvent.setup();
  renderPage(<Goals />);
  await user.click(screen.getByRole('button', { name: 'Nova meta' }));
  const form = await screen.findByRole('dialog');
  await user.type(within(form).getByLabelText('Título'), 'Notebook');
  await user.type(within(form).getByLabelText('Valor alvo'), '4.500');
  await user.type(within(form).getByLabelText('Já guardei'), '500,50');
  await user.click(within(form).getByRole('button', { name: 'Salvar' }));
  await waitFor(async () => {
    expect(await db.entities.FinancialGoal.list()).toEqual([
      expect.objectContaining({ title: 'Notebook', target_cents: 450000, saved_cents: 50050, status: 'active' }),
    ]);
  });
});

test('excluir meta pede confirmação', async () => {
  const user = userEvent.setup();
  await db.entities.FinancialGoal.create({ title: 'Carro', target_cents: 100, saved_cents: 0, status: 'active' });
  renderPage(<Goals />);
  await user.click(await screen.findByRole('button', { name: 'Editar Carro' }));
  await user.click(await screen.findByRole('button', { name: 'Excluir' }));
  const confirm = await screen.findByRole('alertdialog');
  await user.click(within(confirm).getByRole('button', { name: 'Excluir' }));
  await waitFor(async () => expect(await db.entities.FinancialGoal.list()).toEqual([]));
});
