// Dinheiro é sempre guardado em centavos inteiros; texto só na entrada e na exibição.

const INVALID = { ok: false, error: 'Informe um valor válido maior que zero' };

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

// Normaliza o texto digitado (formato brasileiro ou com ponto decimal) para "1234.56".
const normalize = (text) => {
  const s = text.replace(/R\$/gi, '').replace(/\s/g, '');
  if (!/^\d[\d.,]*$/.test(s)) return null;

  const hasComma = s.includes(',');
  const hasDot = s.includes('.');

  if (hasComma && hasDot) {
    // "." separa milhar e "," separa decimal: 1.234,56
    if (s.indexOf(',') < s.lastIndexOf('.')) return null;
    const [int, dec, extra] = s.split(',');
    if (extra !== undefined || !/^\d{1,3}(\.\d{3})*$/.test(int)) return null;
    return `${int.replace(/\./g, '')}.${dec}`;
  }
  if (hasComma) {
    const parts = s.split(',');
    if (parts.length !== 2) return null;
    return `${parts[0]}.${parts[1]}`;
  }
  if (hasDot) {
    // Pontos seguidos de grupos de 3 dígitos são milhar (1.000 / 1.234.567)
    if (/^\d{1,3}(\.\d{3})+$/.test(s)) return s.replace(/\./g, '');
    if (s.split('.').length !== 2) return null;
    return s;
  }
  return s;
};

export function parseMoney(input) {
  let value;
  if (typeof input === 'number') {
    value = input;
  } else if (typeof input === 'string') {
    const normalized = normalize(input.trim());
    if (normalized === null) return INVALID;
    value = Number(normalized);
  } else {
    return INVALID;
  }
  if (!Number.isFinite(value)) return INVALID;
  const cents = Math.round(value * 100);
  if (cents <= 0) return INVALID;
  return { ok: true, cents };
}

export function formatMoney(cents) {
  return BRL.format((cents || 0) / 100);
}

// Valor em centavos → texto editável no formato brasileiro ("1234,56").
export function centsToInput(cents) {
  if (!cents) return '';
  return (cents / 100).toFixed(2).replace('.', ',');
}
