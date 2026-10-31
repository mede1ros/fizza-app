import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Download, Upload, Trash2, Info } from 'lucide-react';
import { db } from '@/api/db';
import { formatDateBR } from '@/domain/months';
import { categoryKey, EXTRA_COLORS, DEFAULT_CATEGORIES } from '@/domain/categories';
import { exportBackup, readBackupFile } from '@/lib/backupActions';
import { useCategories } from '@/components/CategoryPicker';
import FormSheet from '@/components/FormSheet';
import ConfirmDialog from '@/components/ConfirmDialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { buttonVariants, Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

const STORE_LABELS = {
  Expense: ['gasto', 'gastos'],
  RecurringExpense: ['fixo', 'fixos'],
  Income: ['entrada de renda', 'entradas de renda'],
  FinancialGoal: ['meta', 'metas'],
  ShoppingItem: ['item de compra', 'itens de compra'],
  Category: ['categoria', 'categorias'],
};

const describeSummary = (summary) =>
  Object.entries(summary)
    .map(([store, n]) => `${n} ${STORE_LABELS[store][n === 1 ? 0 : 1]}`)
    .join(', ');

const PALETTE = [...new Set([...DEFAULT_CATEGORIES.map((c) => c.color), ...EXTRA_COLORS])];
const CATEGORY_STORES = ['Expense', 'RecurringExpense', 'ShoppingItem'];

function Section({ title, children }) {
  return (
    <section aria-label={title} className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function CategoryEditor({ category, onClose }) {
  const qc = useQueryClient();
  const [name, setName] = useState(category.name);
  const [color, setColor] = useState(category.color);
  const [message, setMessage] = useState('');

  const usages = async () => {
    const lists = await Promise.all(CATEGORY_STORES.map((s) => db.entities[s].list()));
    return lists.flatMap((list, i) => list.filter((r) => categoryKey(r.category) === categoryKey(category.name)).map((r) => [CATEGORY_STORES[i], r]));
  };

  const done = () => { qc.invalidateQueries(); onClose(); };

  const save = useMutation({
    mutationFn: async () => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error('Informe o nome');
      if (trimmed !== category.name) {
        const found = (await db.entities.Category.list()).some((c) => c.id !== category.id && categoryKey(c.name) === categoryKey(trimmed));
        if (found) throw new Error('Já existe uma categoria com esse nome');
        for (const [store, record] of await usages()) await db.entities[store].update(record.id, { category: trimmed });
      }
      await db.entities.Category.update(category.id, { name: trimmed, color });
    },
    onSuccess: done,
    onError: (e) => setMessage(e.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const used = await usages();
      if (used.length) throw new Error(`Em uso em ${used.length} ${used.length === 1 ? 'lançamento' : 'lançamentos'}`);
      await db.entities.Category.delete(category.id);
    },
    onSuccess: done,
    onError: (e) => setMessage(e.message),
  });

  return (
    <div className="space-y-4">
      {category.is_default ? (
        <p className="text-sm">Categoria padrão: <strong>{category.name}</strong>. Você pode trocar a cor.</p>
      ) : (
        <div>
          <label htmlFor="cat-nome" className="text-xs text-muted-foreground mb-1 block">Nome</label>
          <Input id="cat-nome" value={name} onChange={(e) => setName(e.target.value)} className="h-11 text-base" />
        </div>
      )}
      <fieldset>
        <legend className="text-xs text-muted-foreground mb-2">Cor</legend>
        <div className="flex flex-wrap gap-2">
          {PALETTE.map((c) => (
            <button key={c} type="button" aria-label={`Cor ${c}`} aria-pressed={color === c} onClick={() => setColor(c)}
              className={cn('w-9 h-9 rounded-full border-2', color === c ? 'border-foreground' : 'border-transparent')} style={{ backgroundColor: c }} />
          ))}
        </div>
      </fieldset>
      {message && <p className="text-sm text-destructive">{message}</p>}
      <div className="flex gap-2">
        {!category.is_default && (
          <Button type="button" variant="ghost" className="h-11 text-destructive mr-auto" onClick={() => remove.mutate()}>Excluir</Button>
        )}
        <Button type="button" variant="outline" className="h-11 ml-auto" onClick={onClose}>Cancelar</Button>
        <Button type="button" className="h-11" onClick={() => save.mutate()}>Salvar</Button>
      </div>
    </div>
  );
}

export default function Settings() {
  const qc = useQueryClient();
  const fileInput = useRef(null);
  const [importError, setImportError] = useState('');
  const [pendingImport, setPendingImport] = useState(null);
  const [clearStep, setClearStep] = useState(0);
  const [clearText, setClearText] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [storage, setStorage] = useState(null);

  const { data: lastBackup } = useQuery({
    queryKey: ['meta', 'last_backup_at'],
    queryFn: async () => (await db.getMeta('last_backup_at')) ?? null,
  });
  const { data: categories = [] } = useCategories();

  useEffect(() => {
    navigator.storage?.estimate?.().then((e) => setStorage(e)).catch(() => {});
  }, []);

  const doExport = async () => {
    try {
      const result = await exportBackup();
      if (result !== 'cancelled') {
        qc.invalidateQueries({ queryKey: ['meta'] });
        toast({ title: 'Backup exportado', description: 'Guarde o arquivo em Arquivos ou no iCloud Drive.' });
      }
    } catch {
      toast({ title: 'Não foi possível exportar', variant: 'destructive' });
    }
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImportError('');
    const result = await readBackupFile(file);
    if (!result.ok) { setImportError(result.error); return; }
    setPendingImport(result);
  };

  const confirmImport = async () => {
    try {
      await db.importAll(pendingImport.data);
      setPendingImport(null);
      await qc.invalidateQueries();
      toast({ title: 'Backup restaurado' });
    } catch {
      toast({ title: 'Não foi possível restaurar', description: 'Seus dados não foram alterados.', variant: 'destructive' });
    }
  };

  const clearAll = async () => {
    await db.clearAll();
    setClearStep(0);
    setClearText('');
    await qc.invalidateQueries();
    toast({ title: 'Todos os dados foram apagados' });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Backup e Configurações</h1>

      <Section title="Backup">
        <p className="text-sm text-muted-foreground">
          Seus dados ficam só neste iPhone. Exporte um backup e guarde em Arquivos ou no iCloud Drive.
        </p>
        <p className="text-sm">Último backup: <strong>{lastBackup ? formatDateBR(lastBackup.slice(0, 10)) : 'Nunca'}</strong></p>
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" className="h-11 gap-2" onClick={doExport}><Download className="w-4 h-4" />Exportar backup</Button>
          <Button type="button" variant="outline" className="h-11 gap-2" onClick={() => fileInput.current?.click()}><Upload className="w-4 h-4" />Importar backup</Button>
        </div>
        <label htmlFor="arquivo-backup" className="sr-only">Arquivo de backup</label>
        <input id="arquivo-backup" ref={fileInput} type="file" accept="application/json,.json" className="sr-only" onChange={onFile} />
        {importError && <p role="alert" className="text-sm text-destructive">{importError}</p>}
      </Section>

      <Section title="Categorias">
        <ul className="divide-y divide-border">
          {categories.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => setEditingCategory(c)} className="w-full flex items-center gap-3 min-h-[48px] text-left">
                <span className="w-4 h-4 rounded-full" style={{ backgroundColor: c.color }} aria-hidden="true" />
                <span className="flex-1 text-sm">{c.name}</span>
                {!c.is_default && <span className="text-xs text-muted-foreground">personalizada</span>}
              </button>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Dados">
        <Button type="button" variant="outline" className="h-11 w-full gap-2 text-destructive border-destructive/40" onClick={() => setClearStep(1)}>
          <Trash2 className="w-4 h-4" />Apagar todos os dados
        </Button>
      </Section>

      <Section title="App">
        <p className="text-sm flex items-center gap-2"><Info className="w-4 h-4 text-muted-foreground" />Fizza · Versão {__APP_VERSION__}</p>
        {storage?.usage !== undefined && (
          <p className="text-xs text-muted-foreground">Armazenamento usado: {(storage.usage / 1024).toFixed(0)} KB</p>
        )}
      </Section>

      <FormSheet open={Boolean(editingCategory)} onOpenChange={(o) => !o && setEditingCategory(null)} title="Editar categoria">
        {editingCategory && <CategoryEditor key={editingCategory.id} category={editingCategory} onClose={() => setEditingCategory(null)} />}
      </FormSheet>

      <ConfirmDialog
        open={Boolean(pendingImport)}
        onOpenChange={(o) => !o && setPendingImport(null)}
        title="Restaurar este backup?"
        description={pendingImport ? `O backup tem ${describeSummary(pendingImport.summary)}. Os dados atuais deste iPhone serão substituídos.` : undefined}
        confirmLabel="Substituir dados"
        destructive
        onConfirm={confirmImport}
      />

      <ConfirmDialog
        open={clearStep === 1}
        onOpenChange={(o) => !o && setClearStep((s) => (s === 1 ? 0 : s))}
        title="Apagar todos os dados?"
        description="Gastos, fixos, renda, metas e compras deste iPhone serão apagados. Faça um backup antes se quiser guardar."
        confirmLabel="Continuar"
        destructive
        onConfirm={() => setClearStep(2)}
      />

      <AlertDialog open={clearStep === 2} onOpenChange={(o) => { if (!o) { setClearStep(0); setClearText(''); } }}>
        <AlertDialogContent className="max-w-[92vw] sm:max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmação final</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <label htmlFor="confirmar-apagar" className="text-sm">Digite APAGAR para confirmar</label>
          <Input id="confirmar-apagar" value={clearText} onChange={(e) => setClearText(e.target.value)} autoComplete="off" className="h-11 text-base" />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={clearText !== 'APAGAR'} onClick={clearAll} className={buttonVariants({ variant: 'destructive' })}>
              Apagar tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
