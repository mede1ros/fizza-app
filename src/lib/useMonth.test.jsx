import { render, screen, act } from '@testing-library/react';
import { MonthProvider, useMonth } from './useMonth';

function Probe() {
  const { month, isCurrent, prev } = useMonth();
  return (
    <div>
      <span data-testid="mes">{month}</span>
      <span data-testid="atual">{String(isCurrent)}</span>
      <button type="button" onClick={prev}>voltar</button>
    </div>
  );
}

beforeEach(() => vi.useFakeTimers({ toFake: ['Date'] }));
afterEach(() => vi.useRealTimers());

const resume = () => act(() => { document.dispatchEvent(new Event('visibilitychange')); });

test('app retomado no mês seguinte avança para o novo mês atual', () => {
  vi.setSystemTime(new Date(2026, 9, 31, 23, 50));
  render(<MonthProvider><Probe /></MonthProvider>);
  expect(screen.getByTestId('mes')).toHaveTextContent('2026-10');
  vi.setSystemTime(new Date(2026, 10, 1, 8, 0));
  resume();
  expect(screen.getByTestId('mes')).toHaveTextContent('2026-11');
  expect(screen.getByTestId('atual')).toHaveTextContent('true');
});

test('mês escolhido manualmente é mantido, mas deixa de ser o atual', () => {
  vi.setSystemTime(new Date(2026, 9, 31, 23, 50));
  render(<MonthProvider><Probe /></MonthProvider>);
  act(() => screen.getByText('voltar').click());
  expect(screen.getByTestId('mes')).toHaveTextContent('2026-09');
  vi.setSystemTime(new Date(2026, 10, 1, 8, 0));
  resume();
  expect(screen.getByTestId('mes')).toHaveTextContent('2026-09');
  expect(screen.getByTestId('atual')).toHaveTextContent('false');
});
