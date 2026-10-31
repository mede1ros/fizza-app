import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { Wallet, TrendingDown, Scale, ChevronRight, ShieldAlert } from 'lucide-react';
import { db } from '@/api/db';
import { formatMoney } from '@/domain/money';
import { addMonths, monthShortLabel } from '@/domain/months';
import { monthSummary, categoryBreakdown } from '@/domain/finance';
import { useMonth } from '@/lib/useMonth';
import { useCategories } from '@/components/CategoryPicker';
import MonthSelector from '@/components/MonthSelector';
import Fab from '@/components/Fab';
import GoalReminders from '@/components/dashboard/GoalReminders';
import CategoryPie from '@/components/dashboard/CategoryPie';
import IncomeDrawer, { useIncomes } from '@/components/income/IncomeDrawer';
import { cn } from '@/lib/utils';

const FILTERS = [['all', 'Todos'], ['fixed', 'Fixos'], ['variable', 'Variáveis']];
const BACKUP_REMINDER_DAYS = 30;

export default function Dashboard() {
  const navigate = useNavigate();
  const { month, isCurrent } = useMonth();
  const [filter, setFilter] = useState('all');
  const [incomeOpen, setIncomeOpen] = useState(false);

  const { data: expenses = [] } = useQuery({ queryKey: ['expenses'], queryFn: () => db.entities.Expense.list('-date') });
  const { data: recurring = [] } = useQuery({ queryKey: ['recurring'], queryFn: () => db.entities.RecurringExpense.list('due_day') });
  const { data: goals = [] } = useQuery({ queryKey: ['goals'], queryFn: () => db.entities.FinancialGoal.list() });
  const { data: lastBackup, isFetched: backupChecked } = useQuery({
    queryKey: ['meta', 'last_backup_at'],
    queryFn: async () => (await db.getMeta('last_backup_at')) ?? null,
  });
  const { data: incomes = [] } = useIncomes();
  const { data: categories = [] } = useCategories();

  const data = { expenses, recurring, incomes };
  const summary = monthSummary(data, month);
  const slices = categoryBreakdown(data, month, filter, categories);

  const history = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const m = addMonths(month, i - 5);
    const s = monthSummary({ expenses, recurring, incomes }, m);
    return { name: monthShortLabel(m), Renda: s.incomeCents / 100, Gastos: s.totalCents / 100 };
  }), [month, expenses, recurring, incomes]);

  const hasData = expenses.length + recurring.length + incomes.length > 0;
  const backupStale = !lastBackup || Date.now() - new Date(lastBackup).getTime() > BACKUP_REMINDER_DAYS * 864e5;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">{isCurrent ? 'Olá! 👋' : 'Resumo do mês'}</h1>
        <MonthSelector />
      </div>

      {backupChecked && hasData && backupStale && (
        <Link to="/config" className="flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <ShieldAlert className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
          <span className="flex-1">Faça um backup: seus dados ficam só neste iPhone.</span>
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      )}

      {isCurrent && <GoalReminders goals={goals} />}

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          aria-label="Ver entradas de renda"
          onClick={() => setIncomeOpen(true)}
          data-testid="card-renda"
          className="col-span-2 rounded-2xl border border-border bg-card p-4 text-left flex items-center gap-3 active:bg-secondary"
        >
          <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Wallet className="w-5 h-5 text-primary" /></span>
          <span className="flex-1">
            <span className="block text-xs text-muted-foreground">Renda do mês</span>
            <span className="block text-xl font-bold text-foreground">{formatMoney(summary.incomeCents)}</span>
          </span>
          <ChevronRight className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
        </button>
        <div data-testid="card-gastos" className="rounded-2xl border border-border bg-card p-4">
          <TrendingDown className="w-5 h-5 text-destructive mb-2" aria-hidden="true" />
          <p className="text-xs text-muted-foreground">Gastos</p>
          <p className="text-lg font-bold text-destructive">{formatMoney(summary.totalCents)}</p>
          {summary.fixedCents > 0 && <p className="text-[11px] text-muted-foreground">incl. {formatMoney(summary.fixedCents)} em fixos</p>}
        </div>
        <div data-testid="card-saldo" className="rounded-2xl border border-border bg-card p-4">
          <Scale className={cn('w-5 h-5 mb-2', summary.balanceCents >= 0 ? 'text-primary' : 'text-destructive')} aria-hidden="true" />
          <p className="text-xs text-muted-foreground">Saldo</p>
          <p className={cn('text-lg font-bold', summary.balanceCents >= 0 ? 'text-primary' : 'text-destructive')}>{formatMoney(summary.balanceCents)}</p>
        </div>
      </div>

      <section aria-labelledby="pizza-titulo" className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h2 id="pizza-titulo" className="text-base font-semibold">Para onde vai o dinheiro</h2>
        </div>
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-secondary p-1 mb-3">
          {FILTERS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
              className={cn('h-9 rounded-lg text-xs font-medium', filter === value ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground')}
            >
              {label}
            </button>
          ))}
        </div>
        <CategoryPie slices={slices} />
      </section>

      <section aria-labelledby="historico-titulo" className="rounded-2xl border border-border bg-card p-4">
        <h2 id="historico-titulo" className="text-base font-semibold mb-2">Últimos 6 meses</h2>
        <div className="h-52" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={history} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} width={44} tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k` : v)} />
              <Tooltip formatter={(v) => formatMoney(Math.round(v * 100))} />
              <Bar dataKey="Renda" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500" />Renda</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500" />Gastos</span>
        </div>
      </section>

      <Fab label="Registrar gasto" onClick={() => navigate('/gastos?novo=1')} />

      <IncomeDrawer open={incomeOpen} onOpenChange={setIncomeOpen} month={month} />
    </div>
  );
}
