// Armazenamento local do Fizza: cada entidade é uma lista de registros
// guardada no localStorage do navegador, sem servidor e sem login.

const STORAGE_PREFIX = 'fizza:';

const ENTITY_NAMES = [
  'Expense',
  'RecurringExpense',
  'MonthlyBudget',
  'FinancialGoal',
  'ShoppingItem',
];

const read = (name) => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_PREFIX + name)) || [];
  } catch {
    return [];
  }
};

const write = (name, records) => {
  localStorage.setItem(STORAGE_PREFIX + name, JSON.stringify(records));
};

const newId = () =>
  (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));

// sort: nome do campo, com "-" na frente para ordem decrescente (ex.: '-date').
const sortRecords = (records, sort = '-created_date') => {
  const desc = sort.startsWith('-');
  const field = desc ? sort.slice(1) : sort;
  return [...records].sort((a, b) => {
    const x = a[field];
    const y = b[field];
    if (x === y) return 0;
    if (x === undefined || x === null) return 1;
    if (y === undefined || y === null) return -1;
    const cmp = x > y ? 1 : -1;
    return desc ? -cmp : cmp;
  });
};

const createEntity = (name) => ({
  async list(sort) {
    return sortRecords(read(name), sort);
  },

  async create(data) {
    const now = new Date().toISOString();
    const record = { ...data, id: newId(), created_date: now, updated_date: now };
    write(name, [...read(name), record]);
    return record;
  },

  async update(id, data) {
    let updated = null;
    const records = read(name).map((r) => {
      if (r.id !== id) return r;
      updated = { ...r, ...data, id, updated_date: new Date().toISOString() };
      return updated;
    });
    if (!updated) throw new Error(`${name} ${id} não encontrado`);
    write(name, records);
    return updated;
  },

  async delete(id) {
    write(name, read(name).filter((r) => r.id !== id));
  },
});

export const db = {
  entities: Object.fromEntries(ENTITY_NAMES.map((n) => [n, createEntity(n)])),
};
