import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Campo de valor em reais: teclado numérico com vírgula no iPhone.
export default function MoneyInput({ id, label, value, onChange, error, autoFocus, placeholder = '0,00' }) {
  return (
    <div>
      <label htmlFor={id} className="text-xs text-muted-foreground mb-1 block">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground" aria-hidden="true">R$</span>
        <Input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="done"
          placeholder={placeholder}
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn('pl-9 h-11 text-base', error && 'border-destructive')}
        />
      </div>
      {error && <p id={`${id}-error`} className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
