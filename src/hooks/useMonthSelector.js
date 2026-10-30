import { useState } from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function useMonthSelector() {
  const [date, setDate] = useState(new Date());

  const monthYear = format(date, 'yyyy-MM');
  const label = format(date, "MMMM 'de' yyyy", { locale: ptBR });
  const isCurrentMonth = monthYear === format(new Date(), 'yyyy-MM');

  const prev = () => setDate(d => subMonths(d, 1));
  const next = () => setDate(d => addMonths(d, 1));
  const goToCurrent = () => setDate(new Date());

  return { monthYear, label, isCurrentMonth, prev, next, goToCurrent };
}