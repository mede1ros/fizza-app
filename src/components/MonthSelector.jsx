import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMonth } from '@/lib/useMonth';

export default function MonthSelector() {
  const { label, isCurrent, prev, next, goToCurrent } = useMonth();
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={prev}
        aria-label="Mês anterior"
        className="h-11 w-11 flex items-center justify-center rounded-xl hover:bg-secondary text-muted-foreground active:bg-secondary"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <span className="text-sm font-medium text-foreground capitalize min-w-[136px] text-center" aria-live="polite">
        {label}
      </span>
      <button
        type="button"
        onClick={next}
        aria-label="Próximo mês"
        className="h-11 w-11 flex items-center justify-center rounded-xl hover:bg-secondary text-muted-foreground active:bg-secondary"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
      {!isCurrent && (
        <button type="button" onClick={goToCurrent} className="h-11 px-2 text-xs font-medium text-primary">
          Hoje
        </button>
      )}
    </div>
  );
}
