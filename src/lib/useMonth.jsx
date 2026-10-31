import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { addMonths, currentMonth, monthLabel } from '@/domain/months';

const MonthContext = createContext(null);

// Mês selecionado compartilhado entre as telas (trocar de aba mantém o mês).
// No iPhone o app fica suspenso por dias; ao voltar, o "mês atual" é recalculado
// e, se o usuário estava no mês atual antigo, avança junto.
export function MonthProvider({ children, initialMonth }) {
  const [month, setMonth] = useState(initialMonth || currentMonth());
  const [today, setToday] = useState(currentMonth());

  useEffect(() => {
    const refresh = () => {
      const now = currentMonth();
      setToday((previous) => {
        if (previous !== now) setMonth((m) => (m === previous ? now : m));
        return now;
      });
    };
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    window.addEventListener('pageshow', refresh);
    return () => {
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('pageshow', refresh);
    };
  }, []);

  const value = useMemo(() => ({
    month,
    label: monthLabel(month),
    isCurrent: month === today,
    prev: () => setMonth((m) => addMonths(m, -1)),
    next: () => setMonth((m) => addMonths(m, 1)),
    goToCurrent: () => setMonth(currentMonth()),
    setMonth,
  }), [month, today]);

  return <MonthContext.Provider value={value}>{children}</MonthContext.Provider>;
}

export function useMonth() {
  const ctx = useContext(MonthContext);
  if (!ctx) throw new Error('useMonth precisa estar dentro de <MonthProvider>');
  return ctx;
}
