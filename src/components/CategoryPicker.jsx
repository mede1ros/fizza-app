import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '@/api/db';
import { DEFAULT_CATEGORIES, categoryKey, colorForName } from '@/domain/categories';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const useCategories = () =>
  useQuery({ queryKey: ['categories'], queryFn: () => db.entities.Category.list('name') });

// Chips de categoria + criação de categoria personalizada.
export default function CategoryPicker({ value, onChange, error }) {
  const qc = useQueryClient();
  const { data: stored = [] } = useCategories();
  const categories = stored.length ? stored : DEFAULT_CATEGORIES;
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

  const addCategory = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const existing = categories.find((c) => categoryKey(c.name) === categoryKey(trimmed));
    if (!existing) {
      await db.entities.Category.create({ name: trimmed, color: colorForName(trimmed), is_default: false });
      await qc.invalidateQueries({ queryKey: ['categories'] });
    }
    onChange(existing ? existing.name : trimmed);
    setName('');
    setCreating(false);
  };

  return (
    <fieldset>
      <legend className="text-xs text-muted-foreground mb-2">Categoria</legend>
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => {
          const selected = categoryKey(value) === categoryKey(c.name);
          return (
            <button
              key={c.name}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(c.name)}
              className={cn(
                'flex items-center gap-1.5 px-3 min-h-[36px] rounded-full text-xs font-medium border transition-colors',
                selected ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-secondary-foreground border-border'
              )}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} aria-hidden="true" />
              {c.name}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setCreating((v) => !v)}
          className="px-3 min-h-[36px] rounded-full text-xs font-medium border border-dashed border-muted-foreground text-muted-foreground"
        >
          + Nova
        </button>
      </div>
      {creating && (
        <div className="flex gap-2 mt-2">
          <label htmlFor="nova-categoria" className="sr-only">Nome da nova categoria</label>
          <Input
            id="nova-categoria"
            placeholder="Nome da categoria"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCategory(); } }}
            className="h-10"
          />
          <Button type="button" onClick={addCategory} className="h-10">Criar</Button>
        </div>
      )}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </fieldset>
  );
}
