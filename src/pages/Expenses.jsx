import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/api/db';
import { format } from 'date-fns';
import { PlusCircle, Trash2, Edit2, Check, X, AlertTriangle, RefreshCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MonthSelector from '@/components/MonthSelector';
import { useMonthSelector } from '@/hooks/useMonthSelector';

const formatCurrency = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

const SUGGESTED_CATEGORIES = [
  'Alimentação', 'Transporte', 'Saúde', 'Lazer', 'Treino',
  'Educação', 'Moradia', 'Vestuário', 'Assinaturas', 'Outros'
];

const emptyForm = { name: '', amount: '', category: '', date: format(new Date(), 'yyyy-MM-dd'), notes: '' };

export default function Expenses() {
  const qc = useQueryClient();
  const { monthYear, label, isCurrentMonth, prev, next, goToCurrent } = useMonthSelector();
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [customCategory, setCustomCategory] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => db.entities.Expense.list('-date'),
  });

  const { data: recurring = [] } = useQuery({
    queryKey: ['recurring'],
    queryFn: () => db.entities.RecurringExpense.list('due_day'),
  });

  const monthExpenses = expenses.filter(e => e.month_year === monthYear);
  const manualTotal = monthExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const recurringTotal = recurring.reduce((s, e) => s + (e.amount || 0), 0);
  const totalExpenses = manualTotal + recurringTotal;

  // Category totals: manual + recurring
  const categoryTotals = {};
  monthExpenses.forEach(e => {
    categoryTotals[e.category || 'Outros'] = (categoryTotals[e.category || 'Outros'] || 0) + (e.amount || 0);
  });
  recurring.forEach(e => {
    const cat = e.category || 'Recorrentes';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + (e.amount || 0);
  });

  const createMutation = useMutation({
    mutationFn: (data) => db.entities.Expense.create({
      ...data,
      month_year: monthYear,
      amount: parseFloat(data.amount.replace(',', '.')),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); setForm(emptyForm); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.Expense.update(id, { ...data, amount: parseFloat(String(data.amount).replace(',', '.')) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); setEditId(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.Expense.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.amount || !form.category) return;
    createMutation.mutate(form);
  };

  const selectCategory = (cat) => { setForm(f => ({ ...f, category: cat })); setShowCustom(false); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Gastos</h1>
        </div>
        <div className="flex items-center gap-3">
          <MonthSelector label={label} isCurrentMonth={isCurrentMonth} onPrev={prev} onNext={next} onGoToCurrent={goToCurrent} />
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Gasto</span>
          </Button>
        </div>
      </div>

      {/* Add Expense Form */}
      {showForm && (
        <Card className="border-primary/30 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Registrar Gasto</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Nome do gasto *</label>
                  <Input placeholder="Ex: Creatina, Almoço..." value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Valor (R$) *</label>
                  <Input placeholder="0,00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Categoria *</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {SUGGESTED_CATEGORIES.map(cat => (
                    <button key={cat} type="button" onClick={() => selectCategory(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${form.category === cat ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-secondary-foreground border-border hover:border-primary/50'}`}>
                      {cat}
                    </button>
                  ))}
                  <button type="button" onClick={() => setShowCustom(!showCustom)}
                    className="px-3 py-1 rounded-full text-xs font-medium border border-dashed border-muted-foreground text-muted-foreground hover:border-primary/50">
                    + Personalizada
                  </button>
                </div>
                {showCustom && (
                  <div className="flex gap-2">
                    <Input placeholder="Nome da categoria" value={customCategory} onChange={e => setCustomCategory(e.target.value)} className="h-8 text-sm" />
                    <Button type="button" size="sm" onClick={() => { if (customCategory.trim()) { selectCategory(customCategory.trim()); setCustomCategory(''); } }}>Usar</Button>
                  </div>
                )}
                {form.category && <p className="text-xs text-primary mt-1">Selecionada: <strong>{form.category}</strong></p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Data</label>
                  <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Observações</label>
                  <Input placeholder="Opcional..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="ghost" onClick={() => { setShowForm(false); setForm(emptyForm); }}>Cancelar</Button>
                <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? 'Salvando...' : 'Salvar Gasto'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Category Summary */}
      {Object.keys(categoryTotals).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.entries(categoryTotals).map(([cat, val]) => {
            const pct = totalExpenses > 0 ? (val / totalExpenses) * 100 : 0;
            const isAlert = cat.toLowerCase() === 'lazer' && pct > 30;
            return (
              <Card key={cat} className={`border shadow-sm ${isAlert ? 'border-orange-300 bg-orange-50' : 'border-border'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-foreground truncate">{cat}</span>
                    {isAlert && <AlertTriangle className="w-3 h-3 text-orange-500 flex-shrink-0" />}
                  </div>
                  <p className="font-bold text-sm text-primary">{formatCurrency(val)}</p>
                  <p className="text-xs text-muted-foreground">{pct.toFixed(1)}% do total</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Recurring summary */}
      {recurring.length > 0 && (
        <Card className="border-border shadow-sm bg-secondary/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCcw className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Recorrentes do mês</span>
              <span className="ml-auto text-sm font-bold text-primary">{formatCurrency(recurringTotal)}</span>
            </div>
            <div className="space-y-1">
              {recurring.map(r => (
                <div key={r.id} className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: r.color || '#10b981' }} />
                    {r.name} <Badge variant="secondary" className="px-1.5 py-0 text-xs">{r.category || 'Recorrente'}</Badge>
                  </span>
                  <span className="font-medium text-foreground">{formatCurrency(r.amount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expenses List */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Gastos Avulsos</span>
            <span className="text-sm font-normal text-muted-foreground">{formatCurrency(manualTotal)}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8 text-sm">Carregando...</p>
          ) : monthExpenses.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">Nenhum gasto avulso neste mês.</p>
          ) : (
            <div className="divide-y divide-border">
              {monthExpenses.map(expense => (
                <div key={expense.id} className="px-4 py-3 flex items-center gap-3">
                  {editId === expense.id ? (
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <Input value={editData.name || ''} onChange={e => setEditData(d => ({ ...d, name: e.target.value }))} className="h-8 text-sm" />
                      <Input value={editData.amount || ''} onChange={e => setEditData(d => ({ ...d, amount: e.target.value }))} className="h-8 text-sm" />
                      <Input value={editData.category || ''} onChange={e => setEditData(d => ({ ...d, category: e.target.value }))} className="h-8 text-sm" />
                      <div className="flex gap-1">
                        <Button size="icon" className="h-8 w-8" onClick={() => updateMutation.mutate({ id: expense.id, data: editData })}><Check className="w-3 h-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditId(null)}><X className="w-3 h-3" /></Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{expense.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="secondary" className="text-xs px-2 py-0">{expense.category}</Badge>
                          {expense.date && <span className="text-xs text-muted-foreground">{expense.date}</span>}
                        </div>
                      </div>
                      <span className="font-semibold text-sm text-foreground flex-shrink-0">{formatCurrency(expense.amount)}</span>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditId(expense.id); setEditData({ name: expense.name, amount: String(expense.amount), category: expense.category }); }}
                          className="p-1.5 text-muted-foreground hover:text-primary rounded-lg hover:bg-secondary transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteMutation.mutate(expense.id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Total footer */}
      <div className="flex justify-end items-center gap-2 text-sm text-muted-foreground">
        <span>Total do mês (avulsos + recorrentes):</span>
        <span className="font-bold text-foreground text-base">{formatCurrency(totalExpenses)}</span>
      </div>
    </div>
  );
}