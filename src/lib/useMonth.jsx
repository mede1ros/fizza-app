import { createContext, useContext, useMemo, useState } from 'react';
import { addMonths, currentMonth, monthLabel } from '@/domain/months';

const MonthContext = createContext(null);

// Mês selecionado compartilhado entre as telas (trocar de aba mantém o mês).
export function MonthProvider({ children, initialMonth }) {
  const [month, setMonth] = useState(initialMonth || currentMonth());

  const value = useMemo(() => {
    const today = currentMonth();
    return {
      month,
      label: monthLabel(month),
      isCurrent: month === today,
      prev: () => setMonth((m) => addMonths(m, -1)),
      next: () => setMonth((m) => addMonths(m, 1)),
      goToCurrent: () => setMonth(currentMonth()),
      setMonth,
    };
  }, [month]);

  return <MonthContext.Provider value={value}>{children}</MonthContext.Provider>;
}

export function useMonth() {
  const ctx = useContext(MonthContext);
  if (!ctx) throw new Error('useMonth precisa estar dentro de <MonthProvider>');
  return ctx;
}
