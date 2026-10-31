// Formato do arquivo de backup e validação na importação.
import { SCHEMA_VERSION, STORES, migrateV1ToV2 } from './migrate';
import { todayISO } from './months';

const NOT_FIZZA = { ok: false, error: 'Arquivo inválido: não é um backup do Fizza' };
const TOO_NEW = { ok: false, error: 'Backup de uma versão mais nova do Fizza' };
const corrupted = (store) => ({ ok: false, error: `Backup corrompido: ${store} inválido` });

const V1_STORES = ['Expense', 'RecurringExpense', 'MonthlyBudget', 'FinancialGoal', 'ShoppingItem'];

export function buildBackup(data, now = new Date()) {
  return { app: 'fizza', schema_version: SCHEMA_VERSION, exported_at: now.toISOString(), data };
}

export function backupFileName(now = new Date()) {
  return `fizza-backup-${todayISO(now)}.json`;
}

const isRecordList = (value) =>
  Array.isArray(value) && value.every((r) => r && typeof r === 'object' && !Array.isArray(r) && typeof r.id === 'string');

export function parseBackup(text) {
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    return NOT_FIZZA;
  }
  if (!json || json.app !== 'fizza' || typeof json.data !== 'object' || json.data === null) return NOT_FIZZA;
  if (typeof json.schema_version !== 'number') return NOT_FIZZA;
  if (json.schema_version > SCHEMA_VERSION) return TOO_NEW;

  const stores = json.schema_version < 2 ? V1_STORES : STORES;
  for (const store of stores) {
    if (store in json.data && !isRecordList(json.data[store])) return corrupted(store);
  }

  const data = json.schema_version < 2
    ? migrateV1ToV2(json.data)
    : Object.fromEntries(STORES.map((s) => [s, json.data[s] || []]));

  const summary = Object.fromEntries(STORES.map((s) => [s, data[s].length]));
  return { ok: true, data, summary };
}
