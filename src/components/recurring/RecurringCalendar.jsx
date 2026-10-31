import { daysInMonth, monthLabel, currentMonth } from '@/domain/months';
import { effectiveDueDay } from '@/domain/finance';
import { formatMoney } from '@/domain/money';
import { cn } from '@/lib/utils';

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Calendário de vencimentos do mês exibido (items já filtrados como ativos no mês).
export default function RecurringCalendar({ items, month, today = new Date() }) {
  const [y, m] = month.split('-').map(Number);
  const firstWeekday = new Date(y, m - 1, 1).getDay();
  const total = daysInMonth(month);
  const todayDay = currentMonth(today) === month ? today.getDate() : null;

  const byDay = {};
  items.forEach((item) => {
    const d = effectiveDueDay(item.due_day, month);
    (byDay[d] ||= []).push(item);
  });

  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];

  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <p className="font-semibold text-sm text-foreground mb-3 capitalize">Calendário · {monthLabel(month)}</p>
      <div className="grid grid-cols-7 mb-1" aria-hidden="true">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-[11px] text-muted-foreground font-medium py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={`vazio-${idx}`} />;
          const events = byDay[day] || [];
          const isPaid = (e) => Boolean(e.payments?.[month]);
          const label = events.length
            ? `Dia ${day}: ${events.map((e) => `${e.name} ${formatMoney(e.amount_cents)}${isPaid(e) ? ' (pago)' : ''}`).join(', ')}`
            : `Dia ${day}`;
          return (
            <div
              key={day}
              data-testid={`dia-${day}`}
              aria-label={label}
              className={cn(
                'rounded-lg min-h-[40px] flex flex-col items-center pt-1',
                day === todayDay ? 'bg-primary text-primary-foreground' : events.length ? 'bg-secondary' : ''
              )}
            >
              <span className="text-xs font-medium">{day}</span>
              {events.length > 0 && (
                <span className="flex gap-0.5 mt-0.5">
                  {events.slice(0, 3).map((e) => (
                    <span
                      key={e.id}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: isPaid(e) ? '#10b981' : e.color || '#f59e0b' }}
                    />
                  ))}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Pago</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" />Pendente</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary" />Hoje</span>
      </div>
    </div>
  );
}
