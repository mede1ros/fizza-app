import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/api/db';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PlusCircle, Trash2, Edit2, Check, X, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

const formatCurrency = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

const currentMonth = format(new Date(), 'yyyy-MM');

const emptyForm = { title: '', target_amount: '', saved_amount: '', deadline: '', notes: '' };

function GoalSuggestion({ goal, expenses }) {
  const monthExpenses = expenses.filter(e => e.month_year === currentMonth);
  const totalExpenses = monthExpenses.reduce((s, e) => s + (e.amount || 0), 0);

  const remaining = (goal.target_amount || 0) - (goal.saved_amount || 0);
  if (remaining <= 0) return null;

  // Calculate months until deadline
  let months = 3;
  if (goal.deadline) {
    const [y, m] = goal.deadline.split('-').map(Number);
    const now = new Date();
    months = Math.max(1, (y - now.getFullYear()) * 12 + (m - now.getMonth()));
  }

  const monthlyNeeded = remaining / months;
  const lazerExpenses = monthExpenses.filter(e => e.category?.toLowerCase() === 'lazer').reduce((s, e) => s + (e.amount || 0), 0);
  const lazerPct = totalExpenses > 0 ? (lazerExpenses / totalExpenses) * 100 : 0;

  const suggestion = lazerPct > 20
    ? `Para atingir sua meta de ${formatCurrency(goal.target_amount)} em ${months} ${months === 1 ? 'mês' : 'meses'}, guarde ${formatCurrency(monthlyNeeded)}/mês. Que tal reduzir gastos com Lazer em 10%? Isso economizaria ${formatCurrency(lazerExpenses * 0.1)}/mês! 💡`
    : `Para atingir sua meta de ${formatCurrency(goal.target_amount)} em ${months} ${months === 1 ? 'mês' : 'meses'}, você precisa guardar ${formatCurrency(monthlyNeeded)}/mês. Continue assim! 🚀`;

  return (
    <div className="flex gap-2 bg-accent/10 border border-accent/30 rounded-xl p-3 mt-3">
      <Lightbulb className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
      <p className="text-xs text-foreground/80">{suggestion}</p>
    </div>
  );
}

export default function Goals() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: () => db.entities.FinancialGoal.list(),
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => db.entities.Expense.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => db.entities.FinancialGoal.create({
      ...data,
      target_amount: parseFloat(String(data.target_amount).replace(',', '.')),
      saved_amount: parseFloat(String(data.saved_amount || 0).replace(',', '.')),
      status: 'active',
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['goals'] }); setForm(emptyForm); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.FinancialGoal.update(id, {
      ...data,
      target_amount: parseFloat(String(data.target_amount).replace(',', '.')),
      saved_amount: parseFloat(String(data.saved_amount || 0).replace(',', '.')),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['goals'] }); setEditId(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.FinancialGoal.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.target_amount) return;
    createMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Minhas Metas</h1>
          <p className="text-muted-foreground text-sm">Planeje e acompanhe seus objetivos financeiros</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <PlusCircle className="w-4 h-4" />
          Nova Meta
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="border-primary/30 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-base">Criar Nova Meta</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Título da meta *</label>
                  <Input placeholder="Ex: Viagem para a praia" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Valor alvo (R$) *</label>
                  <Input placeholder="0,00" value={form.target_amount} onChange={e => setForm(f => ({ ...f, target_amount: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Já guardei (R$)</label>
                  <Input placeholder="0,00" value={form.saved_amount} onChange={e => setForm(f => ({ ...f, saved_amount: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Prazo (mês/ano)</label>
                  <Input type="month" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Anotações</label>
                <Textarea placeholder="Detalhes, motivações..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="ghost" onClick={() => { setShowForm(false); setForm(emptyForm); }}>Cancelar</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Salvando...' : 'Criar Meta'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Goals List */}
      {isLoading ? (
        <p className="text-center text-muted-foreground py-8 text-sm">Carregando...</p>
      ) : goals.length === 0 ? (
        <Card className="border-dashed border-border shadow-sm">
          <CardContent className="p-10 text-center">
            <p className="text-muted-foreground text-sm">Nenhuma meta criada ainda.</p>
            <p className="text-xs text-muted-foreground mt-1">Clique em <strong>Nova Meta</strong> para começar!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {goals.map(goal => {
            const pct = goal.target_amount > 0
              ? Math.min(100, ((goal.saved_amount || 0) / goal.target_amount) * 100)
              : 0;
            const remaining = (goal.target_amount || 0) - (goal.saved_amount || 0);
            const isCompleted = pct >= 100;

            return (
              <Card key={goal.id} className={`border shadow-sm ${isCompleted ? 'border-primary/40 bg-primary/5' : 'border-border'}`}>
                <CardContent className="p-5">
                  {editId === goal.id ? (
                    <div className="space-y-2">
                      <Input value={editData.title || ''} onChange={e => setEditData(d => ({ ...d, title: e.target.value }))} className="h-8 text-sm" placeholder="Título" />
                      <div className="grid grid-cols-2 gap-2">
                        <Input value={editData.target_amount || ''} onChange={e => setEditData(d => ({ ...d, target_amount: e.target.value }))} className="h-8 text-sm" placeholder="Meta R$" />
                        <Input value={editData.saved_amount || ''} onChange={e => setEditData(d => ({ ...d, saved_amount: e.target.value }))} className="h-8 text-sm" placeholder="Guardado R$" />
                      </div>
                      <Input type="month" value={editData.deadline || ''} onChange={e => setEditData(d => ({ ...d, deadline: e.target.value }))} className="h-8 text-sm" />
                      <Textarea value={editData.notes || ''} onChange={e => setEditData(d => ({ ...d, notes: e.target.value }))} rows={2} className="text-sm" placeholder="Anotações" />
                      <div className="flex gap-1 justify-end">
                        <Button size="icon" className="h-8 w-8" onClick={() => updateMutation.mutate({ id: goal.id, data: editData })}>
                          <Check className="w-3 h-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditId(null)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-foreground text-sm">{goal.title}</h3>
                          {goal.deadline && (
                            <p className="text-xs text-muted-foreground mt-0.5">Prazo: {goal.deadline}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {isCompleted && <Badge className="bg-primary text-primary-foreground text-xs">Concluída! 🎉</Badge>}
                          <button onClick={() => { setEditId(goal.id); setEditData({ title: goal.title, target_amount: String(goal.target_amount), saved_amount: String(goal.saved_amount || 0), deadline: goal.deadline || '', notes: goal.notes || '' }); }} className="p-1.5 text-muted-foreground hover:text-primary rounded-lg hover:bg-secondary transition-colors">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteMutation.mutate(goal.id)} className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Guardado</span>
                        <span className="font-medium text-foreground">{formatCurrency(goal.saved_amount)} / {formatCurrency(goal.target_amount)}</span>
                      </div>

                      <div className="w-full bg-secondary rounded-full h-2.5 mb-1">
                        <div
                          className={`h-2.5 rounded-full transition-all ${isCompleted ? 'bg-accent' : 'bg-primary'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-2">
                        <span>{pct.toFixed(0)}% concluído</span>
                        {!isCompleted && <span>Falta {formatCurrency(remaining)}</span>}
                      </div>

                      {goal.notes && (
                        <p className="text-xs text-muted-foreground bg-secondary rounded-lg p-2 mt-2">{goal.notes}</p>
                      )}

                      <GoalSuggestion goal={goal} expenses={expenses} />
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}