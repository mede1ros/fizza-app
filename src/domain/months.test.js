import { addMonths, monthOf, daysInMonth, formatDateBR, compareMonths, currentMonth, monthLabel } from './months';

test('addMonths cruza o ano', () => {
  expect(addMonths('2026-12', 1)).toBe('2027-01');
  expect(addMonths('2027-01', -1)).toBe('2026-12');
  expect(addMonths('2026-11', 9)).toBe('2027-08');
  expect(addMonths('2026-03', -15)).toBe('2024-12');
});

test('monthOf / daysInMonth / formatDateBR', () => {
  expect(monthOf('2026-10-30')).toBe('2026-10');
  expect(daysInMonth('2027-02')).toBe(28);
  expect(daysInMonth('2028-02')).toBe(29);
  expect(daysInMonth('2026-04')).toBe(30);
  expect(formatDateBR('2026-10-30')).toBe('30/10/2026');
});

test('compareMonths', () => {
  expect(compareMonths('2026-09', '2026-10')).toBe(-1);
  expect(compareMonths('2027-01', '2026-12')).toBe(1);
  expect(compareMonths('2026-10', '2026-10')).toBe(0);
});

test('currentMonth usa a data local', () => {
  expect(currentMonth(new Date(2026, 0, 31, 23, 59))).toBe('2026-01');
});

test('monthLabel em português', () => {
  expect(monthLabel('2026-10')).toBe('outubro de 2026');
});
