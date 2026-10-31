import { Target } from 'lucide-react';

const formatCurrency = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

export default function GoalReminders({ goals = [] }) {
  const activeGoals = goals.filter(g => g.status === 'active');
  if (activeGoals.length === 0) return null;

  return (
    <div className="space-y-2">
      {activeGoals.map(goal => {
        const remaining = (goal.target_amount || 0) - (goal.saved_amount || 0);
        const pct = goal.target_amount > 0
          ? Math.min(100, ((goal.saved_amount || 0) / goal.target_amount) * 100)
          : 0;
        return (
          <div key={goal.id} className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
            <Target className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                🎯 <strong>{goal.title}</strong> — faltam {formatCurrency(remaining)}
              </p>
              <div className="w-full bg-primary/10 rounded-full h-1.5 mt-1">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
            <span className="text-xs text-primary font-medium flex-shrink-0">{pct.toFixed(0)}%</span>
          </div>
        );
      })}
    </div>
  );
}