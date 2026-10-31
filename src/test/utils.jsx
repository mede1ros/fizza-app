import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { MonthProvider } from '@/lib/useMonth';
import { Toaster } from '@/components/ui/toaster';
import { db } from '@/api/db';

export async function freshDb() {
  await db._reset();
  localStorage.clear();
  await db.init();
}

// Renderiza uma tela com React Query, roteador e mês selecionado controlados.
export function renderPage(ui, { month = '2026-10', route = '/' } = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MonthProvider initialMonth={month}>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
        <Toaster />
      </MonthProvider>
    </QueryClientProvider>
  );
}
