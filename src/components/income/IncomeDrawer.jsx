import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/api/db';
import { formatMoney, parseMoney, centsToInput } from '@/domain/money';
import { formatDateBR, todayISO, currentMonth, addMonths } from '@/domain/months';
import { incomeActiveInMonth } from '@/domain/finance';
import FormSheet from '@/components/FormSheet';
import MoneyInput from '@/components/MoneyInput';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

export const useIncomes = () => useQuery({ queryKey: ['incomes'], queryFn: () => db.entities.Income.list() });

function IncomeForm({ initial, month, onSaved, onCancel }) {
  const qc = useQueryClient();
  const isEdit = Boolean(initial?.id);
  const [name, setName] = useState(initial?.name || '');
  const [amount, setAmount] = useState(centsToInput(initial?.amount_cents));
  const [kind, setKind] = useState(initial?.kind || 'fixed');
  const [date, setDate] = useState(initial?.date || (month === currentMonth() ? todayISO() : `${month}-01`));
  const [errors, setErrors] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  const done = () => { qc.invalidateQueries({ queryKey: ['incomes'] }); onSaved(); };
  const onError = () => toast({ title: 'Não foi possível salvar', variant: 'destructive' });

  const save = useMutation({
    mutationFn: async (data) => {
      if (!isEdit) return db.entities.Income.create(data);
      // Mudar o valor de uma entrada fixa vale a partir do mês aberto: os meses anteriores mantêm o valor antigo.
      const fromLaterMonth = initial.kind === 'fixed' && data.kind === 'fixed' && initial.start_month < month;
      if (fromLaterMonth && data.amount_cents !== initial.amount_cents) {
        await db.entities.Income.update(initial.id, { end_month: addMonths(month, -1) });
        return db.entities.Income.create({ ...data, start_month: month });
      }
      return db.entities.Income.update(initial.id, data);
    },
    onSuccess: done,
    onError,
  });
  const end = useMutation({ mutationFn: () => db.entities.Income.update(initial.id, { end_month: month }), onSuccess: done, onError });
  const remove = useMutation({ mutationFn: () => db.entities.Income.delete(initial.id), onSuccess: done, onError });

  const submit = (e) => {
    e.preventDefault();
    const money = parseMoney(amount);
    const next = {};
    if (!name.trim()) next.name = 'Informe o nome';
    if (!money.ok) next.amount = money.error;
    if (kind === 'once' && !date) next.date = 'Informe a data';
    setErrors(next);
    if (Object.keys(next).length) return;
    const base = { name: name.trim(), amount_cents: money.cents, kind };
    save.mutate(kind === 'once'
      ? { ...base, date, start_month: null, end_month: null }
      : { ...base, date: null, start_month: initial?.start_month || month, end_month: initial?.end_month || null });
  };

  return (
    <form onSubmit={submit} className="space-y-4 border-t border-border pt-4" noValidate>
      <div>
        <label htmlFor="renda-nome" className="text-xs text-muted-foreground mb-1 block">Nome</label>
        <Input id="renda-nome" placeholder="Ex.: Salário, Freela" value={name} onChange={(e) => setName(e.target.value)} className="h-11 text-base" />
        {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
      </div>
      <MoneyInput id="renda-valor" label="Valor" value={amount} onChange={setAmount} error={errors.amount} />
      <fieldset>
        <legend className="text-xs text-muted-foreground mb-2">Tipo</legend>
        <div className="grid grid-cols-2 gap-2">
          {[['fixed', 'Fixa'], ['once', 'Avulsa']].map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={kind === value}
              onClick={() => setKind(value)}
              className={cn('h-11 rounded-xl border text-sm font-medium', kind === value ? 'bg-primary text-primary-foreground border-primary' : 'border-border')}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {kind === 'fixed' ? 'Repete todo mês a partir deste mês.' : 'Conta só no mês da data.'}
        </p>
      </fieldset>
      {kind === 'once' && (
        <div>
          <label htmlFor="renda-data" className="text-xs text-muted-foreground mb-1 block">Data</label>
          <Input id="renda-data" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 text-base" />
          {errors.date && <p className="text-xs text-destructive mt-1">{errors.date}</p>}
        </div>
      )}
      {isEdit && (
        <div className="flex flex-col gap-2">
          {initial.kind === 'fixed' && <Button type="button" variant="outline" className="h-11" onClick={() => end.mutate()}>Encerrar neste mês</Button>}
          <Button type="button" variant="ghost" className="h-11 text-destructive" onClick={() => setConfirmDelete(true)}>Excluir</Button>
        </div>
      )}
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" className="h-11" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" className="h-11" disabled={save.isPending}>Salvar</Button>
      </div>
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Excluir entrada?"
        description={initial?.kind === 'fixed' ? 'Ela deixa de contar em todos os meses. Para parar só daqui em diante, use Encerrar.' : undefined}
        confirmLabel="Excluir"
        destructive
        onConfirm={() => remove.mutate()}
      />
    </form>
  );
}

// Painel com as entradas de renda ativas no mês.
export default function IncomeDrawer({ open, onOpenChange, month }) {
  const { data: incomes = [] } = useIncomes();
  const [editing, setEditing] = useState(null); // null | 'new' | income
  const active = incomes.filter((i) => incomeActiveInMonth(i, month));
  const total = active.reduce((s, i) => s + (i.amount_cents || 0), 0);

  const close = (o) => { if (!o) setEditing(null); onOpenChange(o); };

  return (
    <FormSheet open={open} onOpenChange={close} title="Renda do mês" description={`Total: ${formatMoney(total)}`}>
      {active.length === 0 && !editing && (
        <p className="text-sm text-muted-foreground mb-4">Nenhuma entrada neste mês. Adicione seu salário como entrada fixa.</p>
      )}
      {active.length > 0 && (
        <ul className="rounded-2xl border border-border divide-y divide-border mb-4">
          {active.map((i) => (
            <li key={i.id}>
              <button type="button" onClick={() => setEditing(i)} className="w-full flex items-center gap-3 px-4 min-h-[56px] text-left">
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium truncate">{i.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {i.kind === 'fixed' ? 'Fixa · todo mês' : `Avulsa · ${formatDateBR(i.date)}`}
                  </span>
                </span>
                <span className="text-sm font-semibold text-primary">{formatMoney(i.amount_cents)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {editing ? (
        <IncomeForm
          key={editing === 'new' ? 'new' : editing.id}
          initial={editing === 'new' ? null : editing}
          month={month}
          onSaved={() => setEditing(null)}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <Button type="button" className="h-11 w-full" onClick={() => setEditing('new')}>Adicionar entrada</Button>
      )}
    </FormSheet>
  );
}
