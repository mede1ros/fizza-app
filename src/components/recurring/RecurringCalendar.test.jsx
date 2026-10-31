import { render, screen } from '@testing-library/react';
import RecurringCalendar from './RecurringCalendar';

test('fevereiro tem 28 dias e o vencimento 31 cai no dia 28', () => {
  const items = [{ id: '1', name: 'Aluguel', amount_cents: 10000, due_day: 31, payments: {} }];
  render(<RecurringCalendar items={items} month="2027-02" today={new Date(2026, 9, 15)} />);
  expect(screen.getAllByTestId(/^dia-/)).toHaveLength(28);
  expect(screen.getByTestId('dia-28')).toHaveAttribute('aria-label', expect.stringContaining('Aluguel'));
  expect(screen.getByText(/fevereiro de 2027/i)).toBeInTheDocument();
});

test('marca pago pelo pagamento do mês exibido', () => {
  const items = [{ id: '1', name: 'Luz', amount_cents: 5000, due_day: 3, payments: { '2026-09': { amount_cents: 5000 } } }];
  render(<RecurringCalendar items={items} month="2026-09" today={new Date(2026, 9, 15)} />);
  expect(screen.getByTestId('dia-3')).toHaveAttribute('aria-label', expect.stringContaining('pago'));
});
