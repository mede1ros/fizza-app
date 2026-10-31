import { parseMoney, formatMoney } from './money';

test.each([
  ['1.234,56', 123456],
  ['1234,56', 123456],
  ['1234.56', 123456],
  ['R$ 12', 1200],
  [' 12,5 ', 1250],
  ['0,01', 1],
  [12.3, 1230],
  ['1.000', 100000],
  ['1.234.567,89', 123456789],
])('parseMoney(%s) → %i', (input, cents) => {
  expect(parseMoney(input)).toEqual({ ok: true, cents });
});

test.each(['', 'abc', '-3', '0', '0,00', '1,2,3', '12abc', null, undefined])('parseMoney rejeita %s', (input) => {
  const result = parseMoney(input);
  expect(result.ok).toBe(false);
  expect(result.error).toBe('Informe um valor válido maior que zero');
});

test('formatMoney', () => {
  expect(formatMoney(123456).replace(/\s/g, ' ')).toBe('R$ 1.234,56');
  expect(formatMoney(0).replace(/\s/g, ' ')).toBe('R$ 0,00');
  expect(formatMoney(-2550).replace(/\s/g, ' ')).toBe('-R$ 25,50');
});
