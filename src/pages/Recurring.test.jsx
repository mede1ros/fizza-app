import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Recurring from './Recurring';
import { db } from '@/api/db';
import { freshDb, renderPage } from '@/test/utils';

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 15, 12));
  await freshDb();
});
afterEach(() => vi.useRealTimers());

const aluguel = { name: 'Aluguel', amount_cents: 10000, category: 'Moradia', due_day: 5, start_month: '2026-10', end_month: null, payments: {} };

test('pago com valor ajustado vale só no mês (BUG-04)', async () => {
  const user = userEvent.setup();
  const created = await db.entities.RecurringExpense.create(aluguel);
  renderPage(<Recurring />, { month: '2026-10' });

  await user.click(await screen.findByRole('button', { name: 'Marcar Aluguel como pago' }));
  const sheet = await screen.findByRole('dialog');
  const valor = within(sheet).getByLabelText('Valor pago');
  expect(valor).toHaveValue('100,00');
  await user.clear(valor);
  await user.type(valor, '120,00');
  await user.click(within(sheet).getByRole('button', { name: 'Confirmar pagamento' }));

  await waitFor(async () => {
    const [r] = await db.entities.RecurringExpense.list();
    expect(r.payments['2026-10']).toMatchObject({ amount_cents: 12000, paid_at: '2026-10-15' });
  });
  expect(await screen.findByRole('button', { name: 'Desmarcar Aluguel' })).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Próximo mês' }));
  expect(await screen.findByRole('button', { name: 'Marcar Aluguel como pago' })).toBeInTheDocument();
  expect(created.id).toBeTruthy();
});

test('cadastro com 3 parcelas define o mês final', async () => {
  const user = userEvent.setup();
  renderPage(<Recurring />, { month: '2026-11' });
  await user.click(screen.getByRole('button', { name: 'Novo fixo' }));
  const form = await screen.findByRole('dialog');
  await user.type(within(form).getByLabelText('Nome'), 'Celular');
  await user.type(within(form).getByLabelText('Valor'), '300');
  await user.click(within(form).getByRole('button', { name: 'Serviços' }));
  await user.type(within(form).getByLabelText('Dia do vencimento'), '10');
  await user.type(within(form).getByLabelText('Nº de parcelas'), '3');
  await user.click(within(form).getByRole('button', { name: 'Salvar' }));
  await waitFor(async () => {
    expect(await db.entities.RecurringExpense.list()).toEqual([
      expect.objectContaining({ name: 'Celular', amount_cents: 30000, due_day: 10, start_month: '2026-11', end_month: '2027-01', payments: {} }),
    ]);
  });
});

test('dia inválido mostra erro', async () => {
  const user = userEvent.setup();
  renderPage(<Recurring />, { month: '2026-10' });
  await user.click(screen.getByRole('button', { name: 'Novo fixo' }));
  const form = await screen.findByRole('dialog');
  await user.type(within(form).getByLabelText('Nome'), 'X');
  await user.type(within(form).getByLabelText('Valor'), '10');
  await user.click(within(form).getByRole('button', { name: 'Outros' }));
  await user.type(within(form).getByLabelText('Dia do vencimento'), '32');
  await user.click(within(form).getByRole('button', { name: 'Salvar' }));
  expect(await within(form).findByText('Informe um dia entre 1 e 31')).toBeInTheDocument();
});

test('fixo que começa depois não aparece no mês anterior (BUG-02)', async () => {
  await db.entities.RecurringExpense.create({ ...aluguel, start_month: '2026-11' });
  renderPage(<Recurring />, { month: '2026-10' });
  expect(await screen.findByText('Nenhum gasto fixo neste mês.')).toBeInTheDocument();
  expect(screen.queryByText('Aluguel')).not.toBeInTheDocument();
});

test('agrupa por status no mês atual e mostra totais', async () => {
  await db.entities.RecurringExpense.create(aluguel); // dia 5 → atrasado em 15/10
  await db.entities.RecurringExpense.create({ ...aluguel, name: 'Internet', due_day: 15, amount_cents: 9990 });
  await db.entities.RecurringExpense.create({ ...aluguel, name: 'Academia', due_day: 20, amount_cents: 8000 });
  renderPage(<Recurring />, { month: '2026-10' });
  expect(within(await screen.findByRole('region', { name: 'Atrasados' })).getByText('Aluguel')).toBeInTheDocument();
  expect(within(screen.getByRole('region', { name: 'Vencem hoje' })).getByText('Internet')).toBeInTheDocument();
  expect(within(screen.getByRole('region', { name: 'Próximos' })).getByText('Academia')).toBeInTheDocument();
  expect(screen.getByTestId('total-previsto')).toHaveTextContent('R$ 279,90');
});

test('encerrar mantém o histórico e para de contar nos meses seguintes', async () => {
  const user = userEvent.setup();
  await db.entities.RecurringExpense.create(aluguel);
  renderPage(<Recurring />, { month: '2026-10' });
  await user.click(await screen.findByRole('button', { name: /Editar Aluguel/ }));
  await user.click(await screen.findByRole('button', { name: 'Encerrar neste mês' }));
  await waitFor(async () => expect((await db.entities.RecurringExpense.list())[0].end_month).toBe('2026-10'));
});
