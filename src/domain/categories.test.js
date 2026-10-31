import { DEFAULT_CATEGORIES, categoryKey, resolveCategory } from './categories';

test('11 categorias padrão com cores fixas', () => {
  expect(DEFAULT_CATEGORIES).toHaveLength(11);
  expect(DEFAULT_CATEGORIES.find((c) => c.name === 'Lazer').color).toBe('#ec4899');
  expect(DEFAULT_CATEGORIES.find((c) => c.name === 'Outros').color).toBe('#94a3b8');
});

test('categoryKey ignora maiúsculas, acentos e espaços', () => {
  expect(categoryKey(' LÁZER ')).toBe('lazer');
  expect(categoryKey('Alimentação')).toBe('alimentacao');
});

test('resolveCategory usa o nome canônico e a cor cadastrada', () => {
  expect(resolveCategory('lazer ', DEFAULT_CATEGORIES)).toEqual({ name: 'Lazer', color: '#ec4899' });
});

test('categoria desconhecida recebe cor determinística', () => {
  const a = resolveCategory('Pets', []);
  const b = resolveCategory(' pets', []);
  expect(a.name).toBe('Pets');
  expect(a.color).toMatch(/^#[0-9a-f]{6}$/);
  expect(b.color).toBe(a.color);
});

test('categoria vazia vira Outros', () => {
  expect(resolveCategory('', DEFAULT_CATEGORIES).name).toBe('Outros');
  expect(resolveCategory(undefined, DEFAULT_CATEGORIES).name).toBe('Outros');
});
