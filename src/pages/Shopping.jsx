import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Circle } from 'lucide-react';
import { db } from '@/api/db';
import { formatMoney, parseMoney, centsToInput } from '@/domain/money';
import { todayISO } from '@/domain/months';
import FormSheet from '@/components/FormSheet';
import ConfirmDialog from '@/components/ConfirmDialog';
import MoneyInput from '@/components/MoneyInput';
import CategoryPicker from '@/components/CategoryPicker';
import Fab from '@/components/Fab';
import ExpenseForm from '@/components/expenses/ExpenseForm';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

const PRIORITIES = [['baixa', 'Baixa'], ['média', 'Média'], ['alta', 'Alta']];
const PRIORITY_ORDER = { alta: 0, 'média': 1, baixa: 2 };
const PRIORITY_STYLE = { alta: 'bg-red-100 text-red-700', 'média': 'bg-amber-100 text-amber-700', baixa: 'bg-secondary text-muted-foreground' };

function ItemForm({ initial = {}, onSubmit, onCancel, onDelete, saving }) {
  const [name, setName] = useState(initial.name || '');
  const [budget, setBudget] = useState(centsToInput(initial.budget_cents));
  const [category, setCategory] = useState(initial.category || '');
  const [priority, setPriority] = useState(initial.priority || 'média');
  const [notes, setNotes] = useState(initial.notes || '');
  const [errors, setErrors] = useState({});

  const submit = (e) => {
    e.preventDefault();
    const money = budget.trim() ? parseMoney(budget) : { ok: true, cents: null };
    const next = {};
    if (!name.trim()) next.name = 'Informe o nome';
    if (!money.ok) next.budget = money.error;
    setErrors(next);
    if (Object.keys(next).length) return;
    onSubmit({ name: name.trim(), budget_cents: money.cents, category: category || null, priority, notes: notes.trim() });
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="item-nome" className="text-xs text-muted-foreground mb-1 block">Nome</label>
        <Input id="item-nome" placeholder="Ex.: Tênis, Fone" value={name} onChange={(e) => setName(e.target.value)} className="h-11 text-base" />
        {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
      </div>
      <MoneyInput id="item-orcamento" label="Orçamento" placeholder="Opcional" value={budget} onChange={setBudget} error={errors.budget} />
      <CategoryPicker value={category} onChange={setCategory} />
      <fieldset>
        <legend className="text-xs text-muted-foreground mb-2">Prioridade</legend>
        <div className="grid grid-cols-3 gap-2">
          {PRIORITIES.map(([value, label]) => (
            <button key={value} type="button" aria-pressed={priority === value} onClick={() => setPriority(value)}
              className={cn('h-10 rounded-xl border text-xs font-medium', priority === value ? 'bg-primary text-primary-foreground border-primary' : 'border-border')}>
              {label}
            </button>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="item-obs" className="text-xs text-muted-foreground mb-1 block">Observação</label>
        <Input id="item-obs" placeholder="Opcional" value={notes} onChange={(e) => setNotes(e.target.value)} className="h-11 text-base" />
      </div>
      <div className="flex gap-2 pt-1">
        {onDelete && <Button type="button" variant="ghost" className="h-11 text-destructive mr-auto" onClick={onDelete}>Excluir</Button>}
        <Button type="button" variant="outline" className="h-11 ml-auto" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" className="h-11" disabled={saving}>Salvar</Button>
      </div>
    </form>
  );
}

export default function Shopping() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [askExpense, setAskExpense] = useState(null); // item recém-comprado
  const [expenseFrom, setExpenseFrom] = useState(null);

  const { data: items = [], isLoading } = useQuery({ queryKey: ['shopping'], queryFn: () => db.entities.ShoppingItem.list('-created_date') });

  const pending = items.filter((i) => !i.purchased).sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  const purchased = items.filter((i) => i.purchased);
  const totalBudget = pending.reduce((s, i) => s + (i.budget_cents || 0), 0);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['shopping'] });
  const onError = () => toast({ title: 'Não foi possível salvar', variant: 'destructive' });
  const close = () => { setEditing(null); setConfirmDelete(false); };
  const isEdit = editing && editing !== 'new';

  const save = useMutation({
    mutationFn: (data) => (isEdit ? db.entities.ShoppingItem.update(editing.id, data) : db.entities.ShoppingItem.create({ ...data, purchased: false })),
    onSuccess: () => { invalidate(); close(); },
    onError,
  });
  const toggle = useMutation({
    mutationFn: ({ item, value }) => db.entities.ShoppingItem.update(item.id, { purchased: value }),
    onSuccess: (item) => { invalidate(); if (item.purchased) setAskExpense(item); },
    onError,
  });
  const remove = useMutation({
    mutationFn: (id) => db.entities.ShoppingItem.delete(id),
    onSuccess: () => { invalidate(); close(); },
    onError,
  });
  const createExpense = useMutation({
    mutationFn: (data) => db.entities.Expense.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); setExpenseFrom(null); toast({ title: 'Gasto registrado' }); },
    onError,
  });

  const renderItem = (item) => (
    <li key={item.id} className="flex items-center gap-2 pl-2 pr-3 min-h-[60px]">
      <button
        type="button"
        aria-label={item.purchased ? `Desmarcar ${item.name}` : `Marcar ${item.name} como comprado`}
        onClick={() => toggle.mutate({ item, value: !item.purchased })}
        className="h-11 w-11 flex items-center justify-center rounded-full"
      >
        {item.purchased ? <Check className="w-5 h-5 text-primary" /> : <Circle className="w-5 h-5 text-muted-foreground" />}
      </button>
      <button type="button" aria-label={`Editar ${item.name}`} onClick={() => setEditing(item)} className="flex-1 flex items-center gap-2 min-w-0 text-left min-h-[56px]">
        <span className="flex-1 min-w-0">
          <span className={cn('block text-sm font-medium truncate', item.purchased && 'line-through text-muted-foreground')}>{item.name}</span>
          <span className="block text-xs text-muted-foreground truncate">{item.category || 'Sem categoria'}{item.notes ? ` · ${item.notes}` : ''}</span>
        </span>
        {!item.purchased && <span className={cn('text-[11px] px-2 py-0.5 rounded-full', PRIORITY_STYLE[item.priority])}>{item.priority}</span>}
        {item.budget_cents ? <span className="text-sm font-semibold">{formatMoney(item.budget_cents)}</span> : null}
      </button>
    </li>
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Lista de Compras</h1>
        <p className="text-sm text-muted-foreground">Planeje antes de comprar.</p>
      </div>

      <div className="flex items-center justify-between rounded-2xl bg-secondary/60 px-4 py-3">
        <span className="text-sm text-muted-foreground">Orçamento pendente</span>
        <span className="text-base font-bold">{formatMoney(totalBudget)}</span>
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-8 text-sm">Carregando…</p>
      ) : items.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-12">Lista vazia. Toque em + para adicionar.</p>
      ) : (
        <>
          {pending.length > 0 && (
            <section aria-label="A comprar">
              <h2 className="text-xs font-semibold text-muted-foreground mb-1 px-1">A comprar ({pending.length})</h2>
              <ul className="rounded-2xl border border-border bg-card divide-y divide-border">{pending.map(renderItem)}</ul>
            </section>
          )}
          {purchased.length > 0 && (
            <section aria-label="Comprados">
              <h2 className="text-xs font-semibold text-muted-foreground mb-1 px-1">Comprados ({purchased.length})</h2>
              <ul className="rounded-2xl border border-border bg-card divide-y divide-border">{purchased.map(renderItem)}</ul>
            </section>
          )}
        </>
      )}

      <Fab label="Novo item" onClick={() => setEditing('new')} />

      <FormSheet open={Boolean(editing)} onOpenChange={(o) => !o && close()} title={isEdit ? 'Editar item' : 'Novo item'}>
        {editing && (
          <ItemForm
            key={isEdit ? editing.id : 'new'}
            initial={isEdit ? editing : {}}
            saving={save.isPending}
            onSubmit={(data) => save.mutate(data)}
            onCancel={close}
            onDelete={isEdit ? () => setConfirmDelete(true) : undefined}
          />
        )}
      </FormSheet>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Excluir item?"
        confirmLabel="Excluir"
        destructive
        onConfirm={() => isEdit && remove.mutate(editing.id)}
      />

      <ConfirmDialog
        open={Boolean(askExpense)}
        onOpenChange={(o) => !o && setAskExpense(null)}
        title="Registrar como gasto?"
        description={askExpense ? `Lançar "${askExpense.name}" nos gastos de hoje.` : undefined}
        confirmLabel="Registrar gasto"
        onConfirm={() => { setExpenseFrom(askExpense); setAskExpense(null); }}
      />

      <FormSheet open={Boolean(expenseFrom)} onOpenChange={(o) => !o && setExpenseFrom(null)} title="Registrar gasto">
        {expenseFrom && (
          <ExpenseForm
            initial={{ name: expenseFrom.name, amount_cents: expenseFrom.budget_cents, category: expenseFrom.category || 'Outros', date: todayISO() }}
            saving={createExpense.isPending}
            onSubmit={(data) => createExpense.mutate(data)}
            onCancel={() => setExpenseFrom(null)}
          />
        )}
      </FormSheet>
    </div>
  );
}
