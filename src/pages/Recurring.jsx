import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Circle } from 'lucide-react';
import { db } from '@/api/db';
import { formatMoney, parseMoney, centsToInput } from '@/domain/money';
import { todayISO } from '@/domain/months';
import { isActiveInMonth, recurringStatus, recurringAmountForMonth, effectiveDueDay } from '@/domain/finance';
import { useMonth } from '@/lib/useMonth';
import MonthSelector from '@/components/MonthSelector';
import FormSheet from '@/components/FormSheet';
import ConfirmDialog from '@/components/ConfirmDialog';
import MoneyInput from '@/components/MoneyInput';
import Fab from '@/components/Fab';
import RecurringForm from '@/components/recurring/RecurringForm';
import RecurringCalendar from '@/components/recurring/RecurringCalendar';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const CURRENT_GROUPS = [
  { status: 'overdue', title: 'Atrasados', tone: 'text-destructive' },
  { status: 'today', title: 'Vencem hoje', tone: 'text-amber-600' },
  { status: 'upcoming', title: 'Próximos', tone: 'text-foreground' },
  { status: 'paid', title: 'Pagos', tone: 'text-primary' },
];

function Row({ item, month, onTogglePaid, onEdit }) {
  const paid = Boolean(item.payments?.[month]);
  return (
    <li className="flex items-center gap-2 pl-2 pr-3 min-h-[60px]">
      <button
        type="button"
        aria-label={paid ? `Desmarcar ${item.name}` : `Marcar ${item.name} como pago`}
        onClick={() => onTogglePaid(item)}
        className="h-11 w-11 flex items-center justify-center rounded-full flex-shrink-0"
      >
        {paid
          ? <Check className="w-5 h-5 text-primary" />
          : <Circle className="w-5 h-5 text-muted-foreground" />}
      </button>
      <button type="button" aria-label={`Editar ${item.name}`} onClick={() => onEdit(item)} className="flex-1 flex items-center gap-3 min-w-0 text-left min-h-[56px]">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color || '#10b981' }} aria-hidden="true" />
        <span className="flex-1 min-w-0">
          <span className={`block text-sm font-medium truncate ${paid ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{item.name}</span>
          <span className="block text-xs text-muted-foreground truncate">
            {item.category || 'Outros'} · vence dia {effectiveDueDay(item.due_day, month)}
            {item.end_month ? ` · até ${item.end_month.split('-').reverse().join('/')}` : ''}
          </span>
        </span>
        <span className="text-sm font-semibold text-foreground">{formatMoney(recurringAmountForMonth(item, month))}</span>
      </button>
    </li>
  );
}

export default function Recurring() {
  const qc = useQueryClient();
  const { month, isCurrent } = useMonth();
  const [editing, setEditing] = useState(null); // null | 'new' | item
  const [paying, setPaying] = useState(null);
  const [paidValue, setPaidValue] = useState('');
  const [paidError, setPaidError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: recurring = [], isLoading } = useQuery({
    queryKey: ['recurring'],
    queryFn: () => db.entities.RecurringExpense.list('due_day'),
  });

  const active = useMemo(() => recurring.filter((r) => isActiveInMonth(r, month)), [recurring, month]);
  const today = new Date();

  const totals = active.reduce(
    (acc, r) => {
      const amount = recurringAmountForMonth(r, month);
      acc.planned += amount;
      if (r.payments?.[month]) acc.paid += amount;
      return acc;
    },
    { planned: 0, paid: 0 }
  );

  const groups = isCurrent
    ? CURRENT_GROUPS.map((g) => ({ ...g, items: active.filter((r) => recurringStatus(r, month, today) === g.status) }))
    : [
      { status: 'unpaid', title: 'Não pagos', tone: 'text-foreground', items: active.filter((r) => !r.payments?.[month]) },
      { status: 'paid', title: 'Pagos', tone: 'text-primary', items: active.filter((r) => r.payments?.[month]) },
    ];

  const invalidate = () => qc.invalidateQueries({ queryKey: ['recurring'] });
  const onError = () => toast({ title: 'Não foi possível salvar', description: 'Tente novamente.', variant: 'destructive' });
  const closeEditor = () => { setEditing(null); setConfirmDelete(false); };

  const saveMutation = useMutation({
    mutationFn: (data) => (editing && editing !== 'new'
      ? db.entities.RecurringExpense.update(editing.id, data)
      : db.entities.RecurringExpense.create({ ...data, payments: {} })),
    onSuccess: () => { invalidate(); closeEditor(); },
    onError,
  });

  const paymentsMutation = useMutation({
    mutationFn: ({ item, payments }) => db.entities.RecurringExpense.update(item.id, { payments }),
    onSuccess: () => { invalidate(); setPaying(null); },
    onError,
  });

  const endMutation = useMutation({
    mutationFn: (item) => db.entities.RecurringExpense.update(item.id, { end_month: month }),
    onSuccess: () => { invalidate(); closeEditor(); toast({ title: 'Fixo encerrado', description: 'O histórico foi mantido.' }); },
    onError,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.RecurringExpense.delete(id),
    onSuccess: () => { invalidate(); closeEditor(); },
    onError,
  });

  const togglePaid = (item) => {
    if (item.payments?.[month]) {
      const payments = { ...item.payments };
      delete payments[month];
      paymentsMutation.mutate({ item, payments });
    } else {
      setPaidValue(centsToInput(item.amount_cents));
      setPaidError('');
      setPaying(item);
    }
  };

  const confirmPayment = (e) => {
    e.preventDefault();
    const money = parseMoney(paidValue);
    if (!money.ok) { setPaidError(money.error); return; }
    const payments = { ...(paying.payments || {}), [month]: { paid_at: todayISO(), amount_cents: money.cents } };
    paymentsMutation.mutate({ item: paying, payments });
  };

  const isEdit = editing && editing !== 'new';

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">Fixos</h1>
        <MonthSelector />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-secondary/60 p-3">
          <p className="text-[11px] text-muted-foreground">Previsto</p>
          <p data-testid="total-previsto" className="text-sm font-bold text-foreground">{formatMoney(totals.planned)}</p>
        </div>
        <div className="rounded-2xl bg-primary/10 p-3">
          <p className="text-[11px] text-muted-foreground">Pago</p>
          <p className="text-sm font-bold text-primary">{formatMoney(totals.paid)}</p>
        </div>
        <div className="rounded-2xl bg-amber-500/10 p-3">
          <p className="text-[11px] text-muted-foreground">Pendente</p>
          <p className="text-sm font-bold text-amber-600">{formatMoney(totals.planned - totals.paid)}</p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-8 text-sm">Carregando…</p>
      ) : active.length === 0 ? (
        <div className="text-center py-12 space-y-1">
          <p className="text-sm text-muted-foreground">Nenhum gasto fixo neste mês.</p>
          <p className="text-xs text-muted-foreground">Cadastre aluguel, assinaturas e contas com o +.</p>
        </div>
      ) : (
        groups.filter((g) => g.items.length).map((g) => (
          <section key={g.status} aria-label={g.title}>
            <h2 className={`text-xs font-semibold mb-1 px-1 ${g.tone}`}>{g.title} ({g.items.length})</h2>
            <ul className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
              {g.items.map((item) => (
                <Row key={item.id} item={item} month={month} onTogglePaid={togglePaid} onEdit={setEditing} />
              ))}
            </ul>
          </section>
        ))
      )}

      {active.length > 0 && <RecurringCalendar items={active} month={month} today={today} />}

      <Fab label="Novo fixo" onClick={() => setEditing('new')} />

      <FormSheet open={Boolean(editing)} onOpenChange={(o) => !o && closeEditor()} title={isEdit ? 'Editar fixo' : 'Novo gasto fixo'}>
        {editing && (
          <RecurringForm
            key={isEdit ? editing.id : 'new'}
            initial={isEdit ? editing : {}}
            defaultStartMonth={month}
            saving={saveMutation.isPending}
            onSubmit={(data) => saveMutation.mutate(data)}
            onCancel={closeEditor}
            onEnd={isEdit ? () => endMutation.mutate(editing) : undefined}
            onDelete={isEdit ? () => setConfirmDelete(true) : undefined}
          />
        )}
      </FormSheet>

      <FormSheet open={Boolean(paying)} onOpenChange={(o) => !o && setPaying(null)} title={paying ? `Pagamento de ${paying.name}` : 'Pagamento'} description="Ajuste o valor se a conta variou este mês.">
        {paying && (
          <form onSubmit={confirmPayment} className="space-y-4" noValidate>
            <MoneyInput id="valor-pago" label="Valor pago" value={paidValue} onChange={setPaidValue} error={paidError} />
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" className="h-11" onClick={() => setPaying(null)}>Cancelar</Button>
              <Button type="submit" className="h-11">Confirmar pagamento</Button>
            </div>
          </form>
        )}
      </FormSheet>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Excluir gasto fixo?"
        description="Isso apaga também o histórico de pagamentos. Para parar de contar só daqui em diante, use Encerrar."
        confirmLabel="Excluir"
        destructive
        onConfirm={() => isEdit && deleteMutation.mutate(editing.id)}
      />
    </div>
  );
}
