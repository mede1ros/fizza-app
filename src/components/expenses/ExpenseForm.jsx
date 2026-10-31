import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import MoneyInput from '@/components/MoneyInput';
import CategoryPicker from '@/components/CategoryPicker';
import { parseMoney, centsToInput } from '@/domain/money';

// initial: gasto existente (edição) ou valores iniciais; onSubmit recebe
// { name, amount_cents, category, date, notes }.
export default function ExpenseForm({ initial = {}, onSubmit, onCancel, onDelete, saving }) {
  const [name, setName] = useState(initial.name || '');
  const [amount, setAmount] = useState(centsToInput(initial.amount_cents));
  const [category, setCategory] = useState(initial.category || '');
  const [date, setDate] = useState(initial.date || '');
  const [notes, setNotes] = useState(initial.notes || '');
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const money = parseMoney(amount);
    const next = {};
    if (!name.trim()) next.name = 'Informe o nome';
    if (!money.ok) next.amount = money.error;
    if (!category) next.category = 'Escolha uma categoria';
    if (!date) next.date = 'Informe a data';
    setErrors(next);
    if (Object.keys(next).length) return;
    onSubmit({ name: name.trim(), amount_cents: money.cents, category, date, notes: notes.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="gasto-nome" className="text-xs text-muted-foreground mb-1 block">Nome</label>
        <Input
          id="gasto-nome"
          placeholder="Ex.: Almoço, Uber, Farmácia"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-11 text-base"
          aria-invalid={Boolean(errors.name)}
        />
        {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
      </div>
      <MoneyInput id="gasto-valor" label="Valor" value={amount} onChange={setAmount} error={errors.amount} />
      <CategoryPicker value={category} onChange={setCategory} error={errors.category} />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="gasto-data" className="text-xs text-muted-foreground mb-1 block">Data</label>
          <Input id="gasto-data" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 text-base" />
          {errors.date && <p className="text-xs text-destructive mt-1">{errors.date}</p>}
        </div>
        <div>
          <label htmlFor="gasto-obs" className="text-xs text-muted-foreground mb-1 block">Observação</label>
          <Input id="gasto-obs" placeholder="Opcional" value={notes} onChange={(e) => setNotes(e.target.value)} className="h-11 text-base" />
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        {onDelete && (
          <Button type="button" variant="ghost" className="h-11 text-destructive mr-auto" onClick={onDelete}>
            Excluir
          </Button>
        )}
        <Button type="button" variant="outline" className="h-11 ml-auto" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" className="h-11" disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</Button>
      </div>
    </form>
  );
}
