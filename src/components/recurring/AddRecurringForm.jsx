import { useState, useEffect } from 'react';
import { db } from '@/api/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#ef4444', '#06b6d4'];

const SUGGESTED_CATEGORIES = [
  'Moradia', 'Assinaturas', 'Saúde', 'Educação',
  'Transporte', 'Alimentação', 'Serviços', 'Outros'
];

const emptyForm = {
  name: '',
  amount: '',
  category: '',
  due_day: '',
  notes: '',
  color: '#10b981',
};

export default function AddRecurringForm({ editItem, onClose, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editItem) {
      setForm({
        name: editItem.name || '',
        amount: String(editItem.amount || ''),
        category: editItem.category || '',
        due_day: String(editItem.due_day || ''),
        notes: editItem.notes || '',
        color: editItem.color || '#10b981',
      });
    }
  }, [editItem]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.amount || !form.due_day) return;
    setSaving(true);
    const data = {
      ...form,
      amount: parseFloat(String(form.amount).replace(',', '.')),
      due_day: parseInt(form.due_day),
    };
    if (editItem) {
      await db.entities.RecurringExpense.update(editItem.id, data);
    } else {
      await db.entities.RecurringExpense.create({ ...data, is_paid_this_month: false });
    }
    setSaving(false);
    onSaved();
  };

  return (
    <Card className="border-primary/30 shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="font-heading text-base">
          {editItem ? 'Editar Recorrente' : 'Novo Gasto Recorrente'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nome *</label>
              <Input
                placeholder="Ex: Netflix, Aluguel..."
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Valor (R$) *</label>
              <Input
                placeholder="0,00"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Dia de vencimento (1–31) *</label>
              <Input
                type="number"
                min="1"
                max="31"
                placeholder="Ex: 10"
                value={form.due_day}
                onChange={e => setForm(f => ({ ...f, due_day: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Observações</label>
              <Input
                placeholder="Opcional..."
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Categoria</label>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, category: cat }))}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    form.category === cat
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-secondary text-secondary-foreground border-border hover:border-primary/50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Cor no calendário</label>
            <div className="flex gap-2">
              {COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, color }))}
                  className={`w-7 h-7 rounded-full transition-transform ${form.color === color ? 'scale-125 ring-2 ring-offset-2 ring-foreground/30' : ''}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : editItem ? 'Salvar alterações' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}