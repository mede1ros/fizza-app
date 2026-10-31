export const DEFAULT_CATEGORIES = [
  { name: 'Alimentação', color: '#f59e0b' },
  { name: 'Transporte', color: '#3b82f6' },
  { name: 'Moradia', color: '#8b5cf6' },
  { name: 'Saúde', color: '#ef4444' },
  { name: 'Educação', color: '#06b6d4' },
  { name: 'Lazer', color: '#ec4899' },
  { name: 'Assinaturas', color: '#f97316' },
  { name: 'Vestuário', color: '#a78bfa' },
  { name: 'Serviços', color: '#84cc16' },
  { name: 'Treino', color: '#10b981' },
  { name: 'Outros', color: '#94a3b8' },
];

// Paleta para categorias criadas pelo usuário (cor estável por nome).
export const EXTRA_COLORS = [
  '#0ea5e9', '#d946ef', '#14b8a6', '#eab308', '#6366f1',
  '#f43f5e', '#22c55e', '#fb923c', '#64748b', '#a855f7',
];

export function categoryKey(name) {
  return (name || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();
}

export function colorForName(name) {
  const key = categoryKey(name);
  let hash = 0;
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return EXTRA_COLORS[hash % EXTRA_COLORS.length];
}

export function resolveCategory(name, categories) {
  const trimmed = (name || '').trim() || 'Outros';
  const key = categoryKey(trimmed);
  const found = [...categories, ...DEFAULT_CATEGORIES].find((c) => categoryKey(c.name) === key);
  if (found) return { name: found.name, color: found.color };
  return { name: trimmed, color: colorForName(trimmed) };
}
