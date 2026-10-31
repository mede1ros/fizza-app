import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Lightbulb, ChevronRight } from 'lucide-react';
import { db } from '@/api/db';
import { formatMoney, parseMoney, centsToInput } from '@/domain/money';
import { currentMonth, monthLabel } from '@/domain/months';
import { categoryBreakdown } from '@/domain/finance';
import { useCategories } from '@/components/CategoryPicker';
import FormSheet from '@/components/FormSheet';
import ConfirmDialog from '@/components/ConfirmDialog';
import MoneyInput from '@/components/MoneyInput';
import Fab from '@/components/Fab';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

const STATUS = [['active', 'Ativa'], ['paused', 'Pausada'], ['completed', 'Concluída']];

const monthsUntil = (deadline, fromMonth) => {
  const [dy, dm] = deadline.split('-').map(Number);
  const [cy, cm] = fromMonth.split('-').map(Number);
  return Math.max(1, (dy - cy) * 12 + (dm - cm));
};

function GoalTip({ goal, expenses, recurring, categories }) {
  const remaining = (goal.target_cents || 0) - (goal.saved_cents || 0);
  if (remaining <= 0 || goal.status !== 'active' || !goal.deadline) return null;
  const month = currentMonth();
  const months = monthsUntil(goal.deadline, month);
  const monthly = Math.ceil(remaining / months);
  const [top] = categoryBreakdown({ expenses, recurring }, month, 'variable', categories);

  return (
    <div data-testid="dica-meta" className="flex gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mt-3 text-xs text-amber-900">
      <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <p>
        Para chegar lá até {monthLabel(goal.deadline)}, guarde {formatMoney(monthly)}/mês.
        {top && ` Seu maior gasto variável este mês é ${top.name} (${formatMoney(top.cents)}); cortar 10% liberaria ${formatMoney(Math.round(top.cents * 0.1))}/mês.`}
      </p>
    </div>
  );
}

function GoalForm({ initial = {}, onSubmit, onCancel, onDelete, saving }) {
  const [title, setTitle] = useState(initial.title || '');
  const [target, setTarget] = useState(centsToInput(initial.target_cents));
  const [saved, setSaved] = useState(centsToInput(initial.saved_cents));
  const [deadline, setDeadline] = useState(initial.deadline || '');
  const [notes, setNotes] = useState(initial.notes || '');
  const [status, setStatus] = useState(initial.status || 'active');
  const [errors, setErrors] = useState({});

  const submit = (e) => {
    e.preventDefault();
    const t = parseMoney(target);
    const s = saved.trim() ? parseMoney(saved) : { ok: true, cents: 0 };
    const next = {};
    if (!title.trim()) next.title = 'Informe o título';
    if (!t.ok) next.target = t.error;
    if (!s.ok) next.saved = s.error;
    setErrors(next);
    if (Object.keys(next).length) return;
    onSubmit({ title: title.trim(), target_cents: t.cents, saved_cents: s.cents, deadline: deadline || null, notes: notes.trim(), status });
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="meta-titulo" className="text-xs text-muted-foreground mb-1 block">Título</label>
        <Input id="meta-titulo" placeholder="Ex.: Viagem, Reserva de emergência" value={title} onChange={(e) => setTitle(e.target.value)} className="h-11 text-base" />
        {errors.title && <p className="text-xs text-destructive mt-1">{errors.title}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <MoneyInput id="meta-alvo" label="Valor alvo" value={target} onChange={setTarget} error={errors.target} />
        <MoneyInput id="meta-guardado" label="Já guardei" value={saved} onChange={setSaved} error={errors.saved} />
      </div>
      <div>
        <label htmlFor="meta-prazo" className="text-xs text-muted-foreground mb-1 block">Prazo (mês)</label>
        <Input id="meta-prazo" type="month" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="h-11 text-base" />
      </div>
      <fieldset>
        <legend className="text-xs text-muted-foreground mb-2">Status</legend>
        <div className="grid grid-cols-3 gap-2">
          {STATUS.map(([value, label]) => (
            <button key={value} type="button" aria-pressed={status === value} onClick={() => setStatus(value)}
              className={cn('h-10 rounded-xl border text-xs font-medium', status === value ? 'bg-primary text-primary-foreground border-primary' : 'border-border')}>
              {label}
            </button>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="meta-notas" className="text-xs text-muted-foreground mb-1 block">Anotações</label>
        <Textarea id="meta-notas" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="text-base" />
      </div>
      <div className="flex gap-2 pt-1">
        {onDelete && <Button type="button" variant="ghost" className="h-11 text-destructive mr-auto" onClick={onDelete}>Excluir</Button>}
        <Button type="button" variant="outline" className="h-11 ml-auto" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" className="h-11" disabled={saving}>Salvar</Button>
      </div>
    </form>
  );
}

export default function Goals() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: goals = [], isLoading } = useQuery({ queryKey: ['goals'], queryFn: () => db.entities.FinancialGoal.list() });
  const { data: expenses = [] } = useQuery({ queryKey: ['expenses'], queryFn: () => db.entities.Expense.list('-date') });
  const { data: recurring = [] } = useQuery({ queryKey: ['recurring'], queryFn: () => db.entities.RecurringExpense.list('due_day') });
  const { data: categories = [] } = useCategories();

  const close = () => { setEditing(null); setConfirmDelete(false); };
  const onError = () => toast({ title: 'Não foi possível salvar', variant: 'destructive' });
  const isEdit = editing && editing !== 'new';

  const save = useMutation({
    mutationFn: (data) => (isEdit ? db.entities.FinancialGoal.update(editing.id, data) : db.entities.FinancialGoal.create(data)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['goals'] }); close(); },
    onError,
  });
  const remove = useMutation({
    mutationFn: (id) => db.entities.FinancialGoal.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['goals'] }); close(); },
    onError,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Minhas Metas</h1>
        <p className="text-sm text-muted-foreground">Planeje e acompanhe seus objetivos.</p>
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-8 text-sm">Carregando…</p>
      ) : goals.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-12">Nenhuma meta ainda. Toque em + para criar.</p>
      ) : (
        <ul className="space-y-3">
          {goals.map((goal) => {
            const pct = goal.target_cents > 0 ? Math.min(100, ((goal.saved_cents || 0) / goal.target_cents) * 100) : 0;
            const done = pct >= 100 || goal.status === 'completed';
            return (
              <li key={goal.id} className={cn('rounded-2xl border bg-card p-4', done ? 'border-primary/40' : 'border-border')}>
                <button type="button" aria-label={`Editar ${goal.title}`} onClick={() => setEditing(goal)} className="w-full text-left">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground">{goal.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {goal.deadline ? `Até ${monthLabel(goal.deadline)}` : 'Sem prazo'}
                        {goal.status === 'paused' ? ' · pausada' : ''}{done ? ' · concluída 🎉' : ''}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <div className="flex justify-between text-xs mt-3 mb-1">
                    <span className="text-muted-foreground">{formatMoney(goal.saved_cents)} de {formatMoney(goal.target_cents)}</span>
                    <span className="font-medium text-primary">{pct.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </button>
                <GoalTip goal={goal} expenses={expenses} recurring={recurring} categories={categories} />
              </li>
            );
          })}
        </ul>
      )}

      <Fab label="Nova meta" onClick={() => setEditing('new')} />

      <FormSheet open={Boolean(editing)} onOpenChange={(o) => !o && close()} title={isEdit ? 'Editar meta' : 'Nova meta'}>
        {editing && (
          <GoalForm
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
        title="Excluir meta?"
        confirmLabel="Excluir"
        destructive
        onConfirm={() => isEdit && remove.mutate(editing.id)}
      />
    </div>
  );
}
