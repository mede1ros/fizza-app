import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/api/db';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TrendingDown, Wallet, Target, Edit2, Check, X, RefreshCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import GoalReminders from '@/components/dashboard/GoalReminders';
import MonthSelector from '@/components/MonthSelector';
import { useMonth } from '@/lib/useMonth';

const CHART_COLORS = [
  '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6',
  '#ec4899', '#f97316', '#06b6d4', '#84cc16',
  '#ef4444', '#a78bfa',
];

const formatCurrency = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

export default function Dashboard() {
  const qc = useQueryClient();
  const { month: monthYear, isCurrent: isCurrentMonth } = useMonth();
  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeInput, setIncomeInput] = useState('');

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => db.entities.MonthlyBudget.list(),
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => db.entities.Expense.list(),
  });

  const { data: recurring = [] } = useQuery({
    queryKey: ['recurring'],
    queryFn: () => db.entities.RecurringExpense.list(),
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['goals'],
    queryFn: () => db.entities.FinancialGoal.list(),
  });

  const budget = budgets.find(b => b.month_year === monthYear);
  const income = budget?.income || 0;

  // Manual expenses for selected month
  const monthExpenses = expenses.filter(e => e.month_year === monthYear);

  // Recurring expenses count as expenses for the selected month (sum all recurring)
  const recurringTotal = recurring.reduce((s, e) => s + (e.amount || 0), 0);

  // Build combined category map: manual + recurring
  const categoryData = useMemo(() => {
    const map = {};
    monthExpenses.forEach(e => {
      map[e.category || 'Outros'] = (map[e.category || 'Outros'] || 0) + (e.amount || 0);
    });
    recurring.forEach(e => {
      const cat = e.category || 'Recorrentes';
      map[cat] = (map[cat] || 0) + (e.amount || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [monthExpenses, recurring]);

  const totalExpenses = monthExpenses.reduce((s, e) => s + (e.amount || 0), 0) + recurringTotal;
  const balance = income - totalExpenses;

  // ---- Comparison: last 6 months ----
  const comparisonData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(new Date(), 5 - i);
      const my = format(d, 'yyyy-MM');
      const manualTotal = expenses.filter(e => e.month_year === my).reduce((s, e) => s + (e.amount || 0), 0);
      // recurring always the same amount per month
      const total = manualTotal + recurringTotal;
      const bud = budgets.find(b => b.month_year === my);
      return {
        name: format(d, 'MMM/yy', { locale: ptBR }),
        Gastos: parseFloat(total.toFixed(2)),
        Renda: bud?.income || 0,
      };
    });
  }, [expenses, budgets, recurringTotal]);

  const saveBudgetMutation = useMutation({
    mutationFn: async (newIncome) => {
      const val = parseFloat(newIncome.replace(',', '.'));
      if (budget) {
        return db.entities.MonthlyBudget.update(budget.id, { income: val });
      } else {
        return db.entities.MonthlyBudget.create({ month_year: monthYear, income: val });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgets'] });
      setEditingIncome(false);
    },
  });

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const { name, value } = payload[0].payload;
      const pct = totalExpenses > 0 ? ((value / totalExpenses) * 100).toFixed(1) : 0;
      return (
        <div className="bg-card border border-border rounded-xl p-3 shadow-lg text-sm">
          <p className="font-semibold text-foreground">{name}</p>
          <p className="text-primary font-medium">{formatCurrency(value)}</p>
          <p className="text-muted-foreground">{pct}% do total</p>
        </div>
      );
    }
    return null;
  };

  const BarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-xl p-3 shadow-lg text-sm space-y-1">
          <p className="font-semibold text-foreground capitalize">{label}</p>
          {payload.map((p, i) => (
            <p key={i} style={{ color: p.color }}>{p.name}: {formatCurrency(p.value)}</p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            {isCurrentMonth ? 'Olá! 👋' : 'Relatório'}
          </h1>
        </div>
        <MonthSelector />
      </div>

      {/* Goal Reminders — only current month */}
      {isCurrentMonth && <GoalReminders goals={goals} />}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Renda */}
        <Card className="border-border shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <button
                onClick={() => { setEditingIncome(true); setIncomeInput(income ? String(income) : ''); }}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-1">Renda do Mês</p>
            {editingIncome ? (
              <div className="flex items-center gap-1 mt-1">
                <Input value={incomeInput} onChange={e => setIncomeInput(e.target.value)} className="h-8 text-sm" placeholder="0,00" autoFocus />
                <Button size="icon" className="h-8 w-8" onClick={() => saveBudgetMutation.mutate(incomeInput)}><Check className="w-3 h-3" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingIncome(false)}><X className="w-3 h-3" /></Button>
              </div>
            ) : (
              <p className="text-2xl font-bold text-foreground">{formatCurrency(income)}</p>
            )}
          </CardContent>
        </Card>

        {/* Gastos */}
        <Card className="border-border shadow-sm">
          <CardContent className="p-5">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center mb-3">
              <TrendingDown className="w-5 h-5 text-destructive" />
            </div>
            <p className="text-xs text-muted-foreground mb-1">Total de Gastos</p>
            <p className="text-2xl font-bold text-destructive">{formatCurrency(totalExpenses)}</p>
            {recurringTotal > 0 && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <RefreshCcw className="w-3 h-3" />
                incl. {formatCurrency(recurringTotal)} recorrentes
              </p>
            )}
          </CardContent>
        </Card>

        {/* Saldo */}
        <Card className="border-border shadow-sm">
          <CardContent className="p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${balance >= 0 ? 'bg-primary/10' : 'bg-destructive/10'}`}>
              <Target className={`w-5 h-5 ${balance >= 0 ? 'text-primary' : 'text-destructive'}`} />
            </div>
            <p className="text-xs text-muted-foreground mb-1">Saldo Disponível</p>
            <p className={`text-2xl font-bold ${balance >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {formatCurrency(balance)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pie Chart */}
      {categoryData.length > 0 ? (
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Gastos por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={100} paddingAngle={3} dataKey="value">
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(value) => <span className="text-xs text-foreground">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border shadow-sm border-dashed">
          <CardContent className="p-10 text-center">
            <p className="text-muted-foreground text-sm">Nenhum gasto registrado neste período.</p>
          </CardContent>
        </Card>
      )}

      {/* Comparison Bar Chart — last 6 months */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Histórico — Últimos 6 meses</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={comparisonData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} width={48} />
              <Tooltip content={<BarTooltip />} />
              <Bar dataKey="Renda" fill="#10b981" radius={[4,4,0,0]} />
              <Bar dataKey="Gastos" fill="#ef4444" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-500 block"/><span className="text-xs text-muted-foreground">Renda</span></div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500 block"/><span className="text-xs text-muted-foreground">Gastos</span></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}