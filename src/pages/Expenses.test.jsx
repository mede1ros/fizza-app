import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Expenses from './Expenses';
import { db } from '@/api/db';
import { freshDb, renderPage } from '@/test/utils';

beforeEach(freshDb);

test('gasto entra no mês da data, não no mês aberto (BUG-01)', async () => {
  const user = userEvent.setup();
  renderPage(<Expenses />, { month: '2026-10' });

  await user.click(screen.getByRole('button', { name: 'Novo gasto' }));
  const form = await screen.findByRole('dialog');
  await user.type(within(form).getByLabelText('Nome'), 'Almoço');
  await user.type(within(form).getByLabelText('Valor'), '1.234,56');
  await user.click(within(form).getByRole('button', { name: 'Alimentação' }));
  fireEvent.change(within(form).getByLabelText('Data'), { target: { value: '2026-09-10' } });
  await user.click(within(form).getByRole('button', { name: 'Salvar' }));

  await waitFor(async () => {
    expect(await db.entities.Expense.list()).toEqual([
      expect.objectContaining({ name: 'Almoço', amount_cents: 123456, category: 'Alimentação', date: '2026-09-10' }),
    ]);
  });
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(screen.queryByText('Almoço')).not.toBeInTheDocument();
  expect(screen.getByText('Nenhum gasto neste mês.')).toBeInTheDocument();
});

test('valor inválido mostra erro e não salva', async () => {
  const user = userEvent.setup();
  renderPage(<Expenses />);
  await user.click(screen.getByRole('button', { name: 'Novo gasto' }));
  const form = await screen.findByRole('dialog');
  await user.type(within(form).getByLabelText('Nome'), 'Teste');
  await user.type(within(form).getByLabelText('Valor'), 'abc');
  await user.click(within(form).getByRole('button', { name: 'Lazer' }));
  await user.click(within(form).getByRole('button', { name: 'Salvar' }));
  expect(await within(form).findByText('Informe um valor válido maior que zero')).toBeInTheDocument();
  expect(await db.entities.Expense.list()).toEqual([]);
});

test('lista agrupa por dia com data brasileira e total do mês', async () => {
  await db.entities.Expense.create({ name: 'Café', amount_cents: 850, category: 'Alimentação', date: '2026-10-05' });
  await db.entities.Expense.create({ name: 'Uber', amount_cents: 2150, category: 'Transporte', date: '2026-10-07' });
  renderPage(<Expenses />, { month: '2026-10' });
  expect(await screen.findByText('Café')).toBeInTheDocument();
  expect(screen.getByText('05/10/2026')).toBeInTheDocument();
  expect(screen.getByTestId('total-mes')).toHaveTextContent('R$ 30,00');
});

test('excluir pede confirmação; Cancelar mantém o gasto', async () => {
  const user = userEvent.setup();
  await db.entities.Expense.create({ name: 'Cinema', amount_cents: 4000, category: 'Lazer', date: '2026-10-03' });
  renderPage(<Expenses />, { month: '2026-10' });
  await user.click(await screen.findByRole('button', { name: /Cinema/ }));
  await user.click(await screen.findByRole('button', { name: 'Excluir' }));
  const confirm = await screen.findByRole('alertdialog');
  await user.click(within(confirm).getByRole('button', { name: 'Cancelar' }));
  expect(await db.entities.Expense.list()).toHaveLength(1);
});

test('editar altera data e observação', async () => {
  const user = userEvent.setup();
  await db.entities.Expense.create({ name: 'Livro', amount_cents: 5000, category: 'Educação', date: '2026-10-03' });
  renderPage(<Expenses />, { month: '2026-10' });
  await user.click(await screen.findByRole('button', { name: /Livro/ }));
  const form = await screen.findByRole('dialog');
  fireEvent.change(within(form).getByLabelText('Data'), { target: { value: '2026-10-20' } });
  await user.type(within(form).getByLabelText('Observação'), 'presente');
  await user.click(within(form).getByRole('button', { name: 'Salvar' }));
  await waitFor(async () => {
    expect((await db.entities.Expense.list())[0]).toMatchObject({ date: '2026-10-20', notes: 'presente', amount_cents: 5000 });
  });
});
