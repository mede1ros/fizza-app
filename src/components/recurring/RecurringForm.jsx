import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import MoneyInput from '@/components/MoneyInput';
import CategoryPicker from '@/components/CategoryPicker';
import { parseMoney, centsToInput } from '@/domain/money';
import { endMonthForInstallments } from '@/domain/finance';
import { cn } from '@/lib/utils';

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#ef4444', '#06b6d4'];

// onSubmit recebe { name, amount_cents, category, due_day, color, notes, start_month, end_month }.
export default function RecurringForm({ initial = {}, defaultStartMonth, onSubmit, onCancel, onEnd, onDelete, saving }) {
  const [name, setName] = useState(initial.name || '');
  const [amount, setAmount] = useState(centsToInput(initial.amount_cents));
  const [category, setCategory] = useState(initial.category || '');
  const [dueDay, setDueDay] = useState(initial.due_day ? String(initial.due_day) : '');
  const [installments, setInstallments] = useState('');
  const [color, setColor] = useState(initial.color || COLORS[0]);
  const [notes, setNotes] = useState(initial.notes || '');
  const [errors, setErrors] = useState({});

  const startMonth = initial.start_month || defaultStartMonth;

  const handleSubmit = (e) => {
    e.preventDefault();
    const money = parseMoney(amount);
    const day = Number(dueDay);
    const n = installments.trim() ? Number(installments) : null;
    const next = {};
    if (!name.trim()) next.name = 'Informe o nome';
    if (!money.ok) next.amount = money.error;
    if (!category) next.category = 'Escolha uma categoria';
    if (!Number.isInteger(day) || day < 1 || day > 31) next.dueDay = 'Informe um dia entre 1 e 31';
    if (n !== null && (!Number.isInteger(n) || n < 2)) next.installments = 'Mínimo de 2 parcelas';
    setErrors(next);
    if (Object.keys(next).length) return;
    onSubmit({
      name: name.trim(),
      amount_cents: money.cents,
      category,
      due_day: day,
      color,
      notes: notes.trim(),
      start_month: startMonth,
      end_month: n ? endMonthForInstallments(startMonth, n) : initial.end_month || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="fixo-nome" className="text-xs text-muted-foreground mb-1 block">Nome</label>
        <Input id="fixo-nome" placeholder="Ex.: Aluguel, Netflix, Luz" value={name} onChange={(e) => setName(e.target.value)} className="h-11 text-base" />
        {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
      </div>
      <MoneyInput id="fixo-valor" label="Valor" value={amount} onChange={setAmount} error={errors.amount} />
      <CategoryPicker value={category} onChange={setCategory} error={errors.category} />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="fixo-dia" className="text-xs text-muted-foreground mb-1 block">Dia do vencimento</label>
          <Input id="fixo-dia" inputMode="numeric" placeholder="1 a 31" value={dueDay} onChange={(e) => setDueDay(e.target.value)} className="h-11 text-base" />
          {errors.dueDay && <p className="text-xs text-destructive mt-1">{errors.dueDay}</p>}
        </div>
        <div>
          <label htmlFor="fixo-parcelas" className="text-xs text-muted-foreground mb-1 block">Nº de parcelas</label>
          <Input id="fixo-parcelas" inputMode="numeric" placeholder="Opcional" value={installments} onChange={(e) => setInstallments(e.target.value)} className="h-11 text-base" />
          {errors.installments && <p className="text-xs text-destructive mt-1">{errors.installments}</p>}
        </div>
      </div>
      <fieldset>
        <legend className="text-xs text-muted-foreground mb-2">Cor no calendário</legend>
        <div className="flex gap-2 flex-wrap">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Cor ${c}`}
              aria-pressed={color === c}
              onClick={() => setColor(c)}
              className={cn('w-9 h-9 rounded-full border-2', color === c ? 'border-foreground' : 'border-transparent')}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="fixo-obs" className="text-xs text-muted-foreground mb-1 block">Observação</label>
        <Input id="fixo-obs" placeholder="Opcional" value={notes} onChange={(e) => setNotes(e.target.value)} className="h-11 text-base" />
      </div>
      {(onEnd || onDelete) && (
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          {onEnd && <Button type="button" variant="outline" className="h-11" onClick={onEnd}>Encerrar neste mês</Button>}
          {onDelete && <Button type="button" variant="ghost" className="h-11 text-destructive" onClick={onDelete}>Excluir</Button>}
        </div>
      )}
      <div className="flex gap-2 justify-end pt-1">
        <Button type="button" variant="outline" className="h-11" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" className="h-11" disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</Button>
      </div>
    </form>
  );
}
