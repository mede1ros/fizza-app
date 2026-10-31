// Armazenamento local do Fizza em IndexedDB: sem servidor e sem login.
// Cada entidade é um object store; "meta" guarda versão do esquema e datas de backup.
import { openDB, deleteDB } from 'idb';
import { STORES, SCHEMA_VERSION, migrateV1ToV2, defaultCategoryRecords, newId } from '@/domain/migrate';

const DB_NAME = 'fizza';
const META = 'meta';
const V1_PREFIX = 'fizza:';
const V1_STORES = ['Expense', 'RecurringExpense', 'MonthlyBudget', 'FinancialGoal', 'ShoppingItem'];

let dbPromise = null;

const open = () => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(database) {
        STORES.forEach((s) => database.createObjectStore(s, { keyPath: 'id' }));
        database.createObjectStore(META);
      },
    });
  }
  return dbPromise;
};

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
    return sortRecords(await (await open()).getAll(name), sort);
  },

  async create(data) {
    const now = new Date().toISOString();
    const record = { ...data, id: newId(), created_date: now, updated_date: now };
    await (await open()).add(name, record);
    return record;
  },

  async update(id, data) {
    const database = await open();
    const tx = database.transaction(name, 'readwrite');
    const current = await tx.store.get(id);
    if (!current) throw new Error(`${name} ${id} não encontrado`);
    const updated = { ...current, ...data, id, updated_date: new Date().toISOString() };
    await tx.store.put(updated);
    await tx.done;
    return updated;
  },

  async delete(id) {
    await (await open()).delete(name, id);
  },
});

const readV1FromLocalStorage = () => {
  const found = {};
  V1_STORES.forEach((s) => {
    const raw = localStorage.getItem(V1_PREFIX + s);
    if (raw === null) return;
    try {
      found[s] = JSON.parse(raw) || [];
    } catch {
      found[s] = [];
    }
  });
  return Object.keys(found).length ? found : null;
};

const writeAll = async (data) => {
  const database = await open();
  const tx = database.transaction(STORES, 'readwrite');
  await Promise.all(STORES.map(async (s) => {
    const store = tx.objectStore(s);
    await store.clear();
    await Promise.all((data[s] || []).map((r) => store.put(r)));
  }));
  await tx.done;
};

let initPromise = null;

export const db = {
  entities: Object.fromEntries(STORES.map((s) => [s, createEntity(s)])),

  init() {
    if (!initPromise) {
      initPromise = (async () => {
        const database = await open();
        if (!(await database.get(META, 'schema_version'))) {
          const v1 = readV1FromLocalStorage();
          if (v1) {
            await database.put(META, v1, 'v1_snapshot');
            await writeAll(migrateV1ToV2(v1));
            V1_STORES.forEach((s) => localStorage.removeItem(V1_PREFIX + s));
          } else if ((await database.count('Category')) === 0) {
            await writeAll({ Category: defaultCategoryRecords() });
          }
          await database.put(META, SCHEMA_VERSION, 'schema_version');
        }
        try {
          await navigator.storage?.persist?.();
        } catch {
          // O navegador pode recusar; os dados continuam salvos.
        }
      })();
    }
    return initPromise;
  },

  async exportAll() {
    const database = await open();
    const entries = await Promise.all(STORES.map(async (s) => [s, await database.getAll(s)]));
    return Object.fromEntries(entries);
  },

  async importAll(data) {
    await writeAll(data);
  },

  async clearAll() {
    await writeAll({ Category: defaultCategoryRecords() });
  },

  async getMeta(key) {
    return (await open()).get(META, key);
  },

  async setMeta(key, value) {
    await (await open()).put(META, value, key);
  },

  // Somente para testes: fecha e apaga o banco.
  async _reset() {
    if (dbPromise) (await dbPromise).close();
    dbPromise = null;
    initPromise = null;
    await deleteDB(DB_NAME);
  },
};
