import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '@/App';
import { db } from '@/api/db';

beforeEach(async () => {
  await db._reset();
  await db.init();
  window.location.hash = '#/';
});

test('barra inferior tem Início, Gastos e Fixos', async () => {
  render(<App />);
  const nav = screen.getByRole('navigation', { name: 'Navegação principal' });
  expect(within(nav).getByRole('link', { name: /Início/ })).toBeInTheDocument();
  expect(within(nav).getByRole('link', { name: /Gastos/ })).toBeInTheDocument();
  expect(within(nav).getByRole('link', { name: /Fixos/ })).toBeInTheDocument();
});

test('menu lateral abre as demais áreas', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Abrir menu' }));
  const menu = await screen.findByRole('dialog');
  ['Metas', 'Lista de Compras', 'Backup e Configurações', 'Sobre'].forEach((name) => {
    expect(within(menu).getByRole('link', { name })).toBeInTheDocument();
  });
  await user.click(within(menu).getByRole('link', { name: 'Metas' }));
  expect(await screen.findByRole('heading', { name: 'Minhas Metas' })).toBeInTheDocument();
  expect(window.location.hash).toBe('#/metas');
});

test('rota desconhecida mostra 404 em português', async () => {
  window.location.hash = '#/nao-existe';
  render(<App />);
  expect(await screen.findByText('Página não encontrada')).toBeInTheDocument();
});
