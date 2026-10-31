import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { formatMoney } from '@/domain/money';

const formatPercent = (p) => `${p.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

// slices: [{ name, color, cents, percent }] já ordenadas.
export default function CategoryPie({ slices }) {
  if (slices.length === 0) {
    return (
      <div className="text-center py-8 space-y-3">
        <p className="text-sm text-muted-foreground">Nenhum gasto neste mês</p>
        <Link to="/gastos?novo=1" className="inline-flex items-center h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium">
          Registrar gasto
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="h-56" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={slices} dataKey="cents" nameKey="name" innerRadius="58%" outerRadius="92%" paddingAngle={2} stroke="none" isAnimationActive={false}>
              {slices.map((s) => <Cell key={s.name} fill={s.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-3 space-y-2" aria-label="Gastos por categoria">
        {slices.map((s) => (
          <li key={s.name} data-testid="fatia" className="flex items-center gap-3 text-sm">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} aria-hidden="true" />
            <span className="flex-1 min-w-0 truncate text-foreground">{s.name}</span>
            <span className="text-muted-foreground">{formatMoney(s.cents)}</span>
            <span className="w-14 text-right font-semibold text-foreground">{formatPercent(s.percent)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
