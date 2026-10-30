import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/api/db';
import { PlusCircle, Trash2, Edit2, Check, X, ShoppingCart, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const formatCurrency = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

const SUGGESTED_CATEGORIES = [
  'Lazer', 'Eletrônicos', 'Vestuário', 'Alimentação', 'Casa',
  'Saúde', 'Educação', 'Transporte', 'Outros'
];

const PRIORITY_COLORS = {
  baixa: 'bg-secondary text-secondary-foreground',
  média: 'bg-amber-100 text-amber-700',
  alta: 'bg-red-100 text-red-600',
};

const emptyForm = { name: '', budget: '', category: '', priority: 'média', notes: '' };

export default function Shopping() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['shopping'],
    queryFn: () => db.entities.ShoppingItem.list('-created_date'),
  });

  const pending = items.filter(i => !i.purchased);
  const purchased = items.filter(i => i.purchased);
  const totalBudget = pending.reduce((s, i) => s + (i.budget || 0), 0);

  const createMutation = useMutation({
    mutationFn: (data) => db.entities.ShoppingItem.create({
      ...data,
      budget: data.budget ? parseFloat(String(data.budget).replace(',', '.')) : null,
      purchased: false,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shopping'] }); setForm(emptyForm); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.ShoppingItem.update(id, {
      ...data,
      budget: data.budget ? parseFloat(String(data.budget).replace(',', '.')) : null,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shopping'] }); setEditId(null); },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, purchased }) => db.entities.ShoppingItem.update(id, { purchased }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shopping'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.ShoppingItem.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shopping'] }),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name) return;
    createMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Lista de Compras</h1>
          <p className="text-muted-foreground text-sm">
            {pending.length} {pending.length === 1 ? 'item pendente' : 'itens pendentes'}
            {totalBudget > 0 && ` · Orçamento: ${formatCurrency(totalBudget)}`}
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <PlusCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Adicionar Item</span>
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="border-primary/30 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Novo Item</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Nome *</label>
                  <Input placeholder="Ex: Violão novo" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Orçamento (R$)</label>
                  <Input placeholder="0,00" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Categoria</label>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_CATEGORIES.map(cat => (
                    <button key={cat} type="button" onClick={() => setForm(f => ({ ...f, category: cat }))}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${form.category === cat ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-secondary-foreground border-border hover:border-primary/50'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Prioridade</label>
                <div className="flex gap-2">
                  {['baixa', 'média', 'alta'].map(p => (
                    <button key={p} type="button" onClick={() => setForm(f => ({ ...f, priority: p }))}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors capitalize ${form.priority === p ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-secondary-foreground border-border'}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Observações</label>
                <Input placeholder="Opcional..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="ghost" onClick={() => { setShowForm(false); setForm(emptyForm); }}>Cancelar</Button>
                <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? 'Salvando...' : 'Adicionar'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Pending Items */}
      {isLoading ? (
        <p className="text-center text-muted-foreground py-8 text-sm">Carregando...</p>
      ) : items.length === 0 ? (
        <Card className="border-dashed border-border shadow-sm">
          <CardContent className="p-10 text-center">
            <ShoppingCart className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-muted-foreground text-sm">Sua lista está vazia.</p>
            <p className="text-xs text-muted-foreground mt-1">Clique em <strong>Adicionar Item</strong> para começar!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pending.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">🛒 Pendentes</p>
              <div className="space-y-2">
                {pending.map(item => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    editId={editId}
                    editData={editData}
                    setEditId={setEditId}
                    setEditData={setEditData}
                    onToggle={(id) => toggleMutation.mutate({ id, purchased: true })}
                    onUpdate={(id, data) => updateMutation.mutate({ id, data })}
                    onDelete={(id) => deleteMutation.mutate(id)}
                  />
                ))}
              </div>
            </div>
          )}

          {purchased.length > 0 && (
            <div className="opacity-60">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">✅ Comprados</p>
              <div className="space-y-2">
                {purchased.map(item => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    editId={editId}
                    editData={editData}
                    setEditId={setEditId}
                    setEditData={setEditData}
                    onToggle={(id) => toggleMutation.mutate({ id, purchased: false })}
                    onUpdate={(id, data) => updateMutation.mutate({ id, data })}
                    onDelete={(id) => deleteMutation.mutate(id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ItemRow({ item, editId, editData, setEditId, setEditData, onToggle, onUpdate, onDelete }) {
  const isEditing = editId === item.id;

  const PRIORITY_COLORS = {
    baixa: 'bg-secondary text-secondary-foreground',
    média: 'bg-amber-100 text-amber-700',
    alta: 'bg-red-100 text-red-600',
  };

  return (
    <Card className={`border shadow-sm ${item.purchased ? 'border-border' : 'border-border'}`}>
      <CardContent className="p-4 flex items-center gap-3">
        {isEditing ? (
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Input value={editData.name || ''} onChange={e => setEditData(d => ({ ...d, name: e.target.value }))} className="h-8 text-sm" placeholder="Nome" />
            <Input value={editData.budget || ''} onChange={e => setEditData(d => ({ ...d, budget: e.target.value }))} className="h-8 text-sm" placeholder="Orçamento" />
            <Input value={editData.category || ''} onChange={e => setEditData(d => ({ ...d, category: e.target.value }))} className="h-8 text-sm" placeholder="Categoria" />
            <div className="flex gap-1">
              <Button size="icon" className="h-8 w-8" onClick={() => onUpdate(item.id, editData)}><Check className="w-3 h-3" /></Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditId(null)}><X className="w-3 h-3" /></Button>
            </div>
          </div>
        ) : (
          <>
            <button
              onClick={() => onToggle(item.id)}
              className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${item.purchased ? 'bg-primary border-primary text-primary-foreground' : 'border-border hover:border-primary'}`}
            >
              {item.purchased && <Check className="w-3 h-3" />}
            </button>

            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${item.purchased ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                {item.name}
              </p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {item.category && <Badge variant="secondary" className="text-xs px-1.5 py-0">{item.category}</Badge>}
                {item.priority && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[item.priority] || ''}`}>
                    {item.priority}
                  </span>
                )}
                {item.notes && <span className="text-xs text-muted-foreground truncate">{item.notes}</span>}
              </div>
            </div>

            {item.budget > 0 && (
              <span className="text-sm font-semibold text-foreground flex-shrink-0">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.budget)}
              </span>
            )}

            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => { setEditId(item.id); setEditData({ name: item.name, budget: item.budget ? String(item.budget) : '', category: item.category || '', notes: item.notes || '' }); }}
                className="p-1.5 text-muted-foreground hover:text-primary rounded-lg hover:bg-secondary transition-colors">
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => onDelete(item.id)}
                className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}