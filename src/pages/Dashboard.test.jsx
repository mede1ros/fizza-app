import { screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from './Dashboard';
import { db } from '@/api/db';
import { freshDb, renderPage } from '@/test/utils';

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 15, 12));
  await freshDb();
});
afterEach(() => vi.useRealTimers());

const seed = async () => {
  await db.entities.Income.create({ name: 'Salário', kind: 'fixed', amount_cents: 500000, start_month: '2026-01', end_month: null });
  await db.entities.Expense.create({ name: 'Cinema', amount_cents: 3000, category: 'lazer', date: '2026-10-02' });
  await db.entities.Expense.create({ name: 'Mercado', amount_cents: 7000, category: 'Alimentação', date: '2026-10-03' });
};

test('cartões e pizza com percentuais (fixos + variáveis)', async () => {
  await seed();
  renderPage(<Dashboard />, { month: '2026-10' });
  await waitFor(() => expect(screen.getByTestId('card-renda')).toHaveTextContent('R$ 5.000,00'));
  expect(screen.getByTestId('card-gastos')).toHaveTextContent('R$ 100,00');
  expect(screen.getByTestId('card-saldo')).toHaveTextContent('R$ 4.900,00');
  const slices = screen.getAllByTestId('fatia');
  expect(slices[0]).toHaveTextContent('Alimentação');
  expect(slices[0]).toHaveTextContent('70,0%');
  expect(slices[1]).toHaveTextContent('Lazer');
  expect(slices[1]).toHaveTextContent('30,0%');
});

test('filtro Fixos sem fixos mostra estado vazio', async () => {
  const user = userEvent.setup();
  await seed();
  renderPage(<Dashboard />, { month: '2026-10' });
  await screen.findAllByTestId('fatia');
  await user.click(screen.getByRole('button', { name: 'Fixos' }));
  expect(await screen.findByText('Nenhum gasto neste mês')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Variáveis' }));
  expect(await screen.findAllByTestId('fatia')).toHaveLength(2);
});

test('lembrete de backup aparece com dados e sem backup', async () => {
  await seed();
  renderPage(<Dashboard />, { month: '2026-10' });
  expect(await screen.findByText(/Faça um backup/)).toBeInTheDocument();
});

test('sem lembrete quando o backup é recente', async () => {
  await seed();
  await db.setMeta('last_backup_at', new Date(2026, 9, 10).toISOString());
  renderPage(<Dashboard />, { month: '2026-10' });
  await screen.findAllByTestId('fatia');
  expect(screen.queryByText(/Faça um backup/)).not.toBeInTheDocument();
});

test('adicionar entrada avulsa pelo cartão de renda', async () => {
  const user = userEvent.setup();
  renderPage(<Dashboard />, { month: '2026-10' });
  await user.click(screen.getByRole('button', { name: 'Ver entradas de renda' }));
  const sheet = await screen.findByRole('dialog');
  await user.click(within(sheet).getByRole('button', { name: 'Adicionar entrada' }));
  await user.type(within(sheet).getByLabelText('Nome'), 'Freela');
  await user.type(within(sheet).getByLabelText('Valor'), '300');
  await user.click(within(sheet).getByRole('button', { name: 'Avulsa' }));
  fireEvent.change(within(sheet).getByLabelText('Data'), { target: { value: '2026-10-20' } });
  await user.click(within(sheet).getByRole('button', { name: 'Salvar' }));
  await waitFor(async () => {
    expect(await db.entities.Income.list()).toEqual([
      expect.objectContaining({ name: 'Freela', kind: 'once', amount_cents: 30000, date: '2026-10-20' }),
    ]);
  });
  await waitFor(() => expect(screen.getByTestId('card-renda')).toHaveTextContent('R$ 300,00'));
});

test('aumento de salário vale a partir do mês aberto, sem mudar meses passados', async () => {
  const user = userEvent.setup();
  await db.entities.Income.create({ name: 'Salário', kind: 'fixed', amount_cents: 500000, start_month: '2026-09', end_month: null });
  renderPage(<Dashboard />, { month: '2026-11' });
  await user.click(screen.getByRole('button', { name: 'Ver entradas de renda' }));
  const sheet = await screen.findByRole('dialog');
  await user.click(await within(sheet).findByRole('button', { name: /Salário/ }));
  const valor = within(sheet).getByLabelText('Valor');
  await user.clear(valor);
  await user.type(valor, '6.000');
  await user.click(within(sheet).getByRole('button', { name: 'Salvar' }));
  await waitFor(async () => {
    const list = await db.entities.Income.list('start_month');
    expect(list).toEqual([
      expect.objectContaining({ amount_cents: 500000, start_month: '2026-09', end_month: '2026-10' }),
      expect.objectContaining({ amount_cents: 600000, start_month: '2026-11', end_month: null }),
    ]);
  });
});

test('editar entrada fixa no próprio mês de início só atualiza', async () => {
  const user = userEvent.setup();
  await db.entities.Income.create({ name: 'Salário', kind: 'fixed', amount_cents: 500000, start_month: '2026-11', end_month: null });
  renderPage(<Dashboard />, { month: '2026-11' });
  await user.click(screen.getByRole('button', { name: 'Ver entradas de renda' }));
  const sheet = await screen.findByRole('dialog');
  await user.click(await within(sheet).findByRole('button', { name: /Salário/ }));
  const valor = within(sheet).getByLabelText('Valor');
  await user.clear(valor);
  await user.type(valor, '5.100');
  await user.click(within(sheet).getByRole('button', { name: 'Salvar' }));
  await waitFor(async () => {
    expect(await db.entities.Income.list()).toEqual([expect.objectContaining({ amount_cents: 510000, start_month: '2026-11' })]);
  });
});

test('entrada fixa começa no mês selecionado', async () => {
  const user = userEvent.setup();
  renderPage(<Dashboard />, { month: '2026-11' });
  await user.click(screen.getByRole('button', { name: 'Ver entradas de renda' }));
  const sheet = await screen.findByRole('dialog');
  await user.click(within(sheet).getByRole('button', { name: 'Adicionar entrada' }));
  await user.type(within(sheet).getByLabelText('Nome'), 'Salário');
  await user.type(within(sheet).getByLabelText('Valor'), '4.500,00');
  await user.click(within(sheet).getByRole('button', { name: 'Salvar' }));
  await waitFor(async () => {
    expect(await db.entities.Income.list()).toEqual([
      expect.objectContaining({ kind: 'fixed', amount_cents: 450000, start_month: '2026-11', end_month: null }),
    ]);
  });
});
