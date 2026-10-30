import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MonthSelector({ label, isCurrentMonth, onPrev, onNext, onGoToCurrent }) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onPrev}
        className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-sm font-medium text-foreground capitalize min-w-[160px] text-center">
        {label}
      </span>
      <button
        onClick={onNext}
        className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
      {!isCurrentMonth && (
        <button
          onClick={onGoToCurrent}
          className="ml-1 text-xs text-primary hover:underline flex items-center gap-1"
        >
          <CalendarDays className="w-3 h-3" />
          Hoje
        </button>
      )}
    </div>
  );
}