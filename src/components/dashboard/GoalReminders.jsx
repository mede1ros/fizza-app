import { Target } from 'lucide-react';
import { formatMoney } from '@/domain/money';

export default function GoalReminders({ goals = [] }) {
  const activeGoals = goals.filter((g) => g.status === 'active');
  if (activeGoals.length === 0) return null;

  return (
    <div className="space-y-2">
      {activeGoals.map((goal) => {
        const remaining = Math.max(0, (goal.target_cents || 0) - (goal.saved_cents || 0));
        const pct = goal.target_cents > 0 ? Math.min(100, ((goal.saved_cents || 0) / goal.target_cents) * 100) : 0;
        return (
          <div key={goal.id} className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-2xl px-4 py-3">
            <Target className="w-5 h-5 text-primary flex-shrink-0" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground truncate">
                <strong>{goal.title}</strong> · faltam {formatMoney(remaining)}
              </p>
              <div className="w-full bg-primary/10 rounded-full h-1.5 mt-1">
                <div className="bg-primary h-1.5 rounded-full" style={{ width: `${pct}%` }} />
              </div>
            </div>
            <span className="text-xs text-primary font-medium">{pct.toFixed(0)}%</span>
          </div>
        );
      })}
    </div>
  );
}
