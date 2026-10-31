import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/api/db';
import { formatMoney } from '@/domain/money';
import { formatDateBR, monthOf, todayISO } from '@/domain/months';
import { resolveCategory } from '@/domain/categories';
import { useMonth } from '@/lib/useMonth';
import { useCategories } from '@/components/CategoryPicker';
import MonthSelector from '@/components/MonthSelector';
import FormSheet from '@/components/FormSheet';
import ConfirmDialog from '@/components/ConfirmDialog';
import Fab from '@/components/Fab';
import ExpenseForm from '@/components/expenses/ExpenseForm';
import { toast } from '@/components/ui/use-toast';

export default function Expenses() {
  const qc = useQueryClient();
  const { month, isCurrent } = useMonth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [editing, setEditing] = useState(null); // null | 'new' | expense
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => db.entities.Expense.list('-date'),
  });
  const { data: categories = [] } = useCategories();

  // Atalho do Início: /gastos?novo=1 abre o formulário.
  useEffect(() => {
    if (searchParams.get('novo') === '1') {
      setEditing('new');
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const monthExpenses = useMemo(
    () => expenses.filter((e) => e.date && monthOf(e.date) === month),
    [expenses, month]
  );
  const total = monthExpenses.reduce((s, e) => s + (e.amount_cents || 0), 0);

  const groups = useMemo(() => {
    const byDay = new Map();
    monthExpenses.forEach((e) => {
      if (!byDay.has(e.date)) byDay.set(e.date, []);
      byDay.get(e.date).push(e);
    });
    return [...byDay.entries()].sort(([a], [b]) => (a < b ? 1 : -1));
  }, [monthExpenses]);

  const close = () => { setEditing(null); setConfirmDelete(false); };
  const onError = () => toast({ title: 'Não foi possível salvar', description: 'Tente novamente.', variant: 'destructive' });

  const saveMutation = useMutation({
    mutationFn: (data) => (editing && editing !== 'new'
      ? db.entities.Expense.update(editing.id, data)
      : db.entities.Expense.create(data)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); close(); },
    onError,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.Expense.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); close(); },
    onError,
  });

  const defaultDate = isCurrent ? todayISO() : `${month}-01`;
  const isEdit = editing && editing !== 'new';

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">Gastos</h1>
        <MonthSelector />
      </div>

      <div className="flex items-center justify-between rounded-2xl bg-secondary/60 px-4 py-3">
        <span className="text-sm text-muted-foreground">Total de gastos variáveis</span>
        <span data-testid="total-mes" className="text-base font-bold text-foreground">{formatMoney(total)}</span>
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-8 text-sm">Carregando…</p>
      ) : groups.length === 0 ? (
        <div className="text-center py-12 space-y-1">
          <p className="text-sm text-muted-foreground">Nenhum gasto neste mês.</p>
          <p className="text-xs text-muted-foreground">Toque em + para registrar.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map(([day, items]) => (
            <section key={day} aria-label={formatDateBR(day)}>
              <h2 className="text-xs font-semibold text-muted-foreground mb-1 px-1">{formatDateBR(day)}</h2>
              <ul className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
                {items.map((e) => {
                  const cat = resolveCategory(e.category, categories);
                  return (
                    <li key={e.id}>
                      <button
                        type="button"
                        onClick={() => setEditing(e)}
                        className="w-full flex items-center gap-3 px-4 min-h-[56px] text-left active:bg-secondary"
                      >
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} aria-hidden="true" />
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-medium text-foreground truncate">{e.name}</span>
                          <span className="block text-xs text-muted-foreground truncate">
                            {cat.name}{e.notes ? ` · ${e.notes}` : ''}
                          </span>
                        </span>
                        <span className="text-sm font-semibold text-foreground">{formatMoney(e.amount_cents)}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      <Fab label="Novo gasto" onClick={() => setEditing('new')} />

      <FormSheet open={Boolean(editing)} onOpenChange={(o) => !o && close()} title={isEdit ? 'Editar gasto' : 'Novo gasto'}>
        {editing && (
          <ExpenseForm
            key={isEdit ? editing.id : 'new'}
            initial={isEdit ? editing : { date: defaultDate }}
            saving={saveMutation.isPending}
            onSubmit={(data) => saveMutation.mutate(data)}
            onCancel={close}
            onDelete={isEdit ? () => setConfirmDelete(true) : undefined}
          />
        )}
      </FormSheet>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Excluir gasto?"
        description={isEdit ? `"${editing.name}" será removido.` : undefined}
        confirmLabel="Excluir"
        destructive
        onConfirm={() => isEdit && deleteMutation.mutate(editing.id)}
      />
    </div>
  );
}
