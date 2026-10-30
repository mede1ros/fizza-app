import { getDaysInMonth, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formatCurrency = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

const today = new Date().getDate();
const currentYear = new Date().getFullYear();
const currentMonthNum = new Date().getMonth();
const daysInMonth = getDaysInMonth(new Date());

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function RecurringCalendar({ items }) {
  // first day of month (0=Sun)
  const firstDay = new Date(currentYear, currentMonthNum, 1).getDay();

  // Build map: day -> items
  const dayMap = {};
  items.forEach(item => {
    if (!dayMap[item.due_day]) dayMap[item.due_day] = [];
    dayMap[item.due_day].push(item);
  });

  const cells = [];
  // empty cells before first day
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm p-4">
      <p className="font-heading font-semibold text-sm text-foreground mb-4 capitalize">
        📅 Calendário — {format(new Date(), 'MMMM yyyy', { locale: ptBR })}
      </p>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-2">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-xs text-muted-foreground font-medium py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />;
          const events = dayMap[day] || [];
          const isToday = day === today;
          const hasPaid = events.some(e => e.is_paid_this_month);
          const hasPending = events.some(e => !e.is_paid_this_month);

          return (
            <div
              key={day}
              className={`relative rounded-xl p-1 min-h-[44px] flex flex-col items-center transition-colors
                ${isToday ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}
                ${events.length > 0 && !isToday ? 'bg-secondary/60' : ''}
              `}
            >
              <span className={`text-xs font-medium ${isToday ? 'text-primary-foreground' : 'text-foreground'}`}>
                {day}
              </span>
              {events.length > 0 && (
                <div className="flex flex-wrap gap-0.5 justify-center mt-0.5">
                  {events.slice(0, 3).map((e, i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: e.is_paid_this_month ? '#10b981' : (e.color || '#f59e0b') }}
                      title={`${e.name}: ${formatCurrency(e.amount)}`}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 block" />
          <span className="text-xs text-muted-foreground">Pago</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 block" />
          <span className="text-xs text-muted-foreground">Pendente</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-primary block" />
          <span className="text-xs text-muted-foreground">Hoje</span>
        </div>
      </div>
    </div>
  );
}