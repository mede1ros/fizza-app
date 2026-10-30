import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/api/db';
import { format, getDaysInMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PlusCircle, Trash2, Bell, BellOff, Check, X, Edit2, CalendarDays, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import RecurringCalendar from '@/components/recurring/RecurringCalendar';
import AddRecurringForm from '@/components/recurring/AddRecurringForm';

const formatCurrency = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

const currentMonth = format(new Date(), 'yyyy-MM');
const today = new Date().getDate();

export default function Recurring() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [notifGranted, setNotifGranted] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );

  const { data: recurring = [], isLoading } = useQuery({
    queryKey: ['recurring'],
    queryFn: () => db.entities.RecurringExpense.list('due_day'),
  });

  // Reset paid status if new month
  useEffect(() => {
    recurring.forEach(item => {
      if (item.is_paid_this_month && item.paid_month_year && item.paid_month_year !== currentMonth) {
        db.entities.RecurringExpense.update(item.id, {
          is_paid_this_month: false,
          paid_month_year: null,
        }).then(() => qc.invalidateQueries({ queryKey: ['recurring'] }));
      }
    });
  }, [recurring]);

  // Schedule browser notifications for due today/tomorrow
  useEffect(() => {
    if (notifGranted !== 'granted') return;
    recurring.forEach(item => {
      if (item.is_paid_this_month) return;
      const daysUntil = item.due_day - today;
      if (daysUntil === 1) {
        new Notification(`⚠️ Fizza — Vence amanhã`, {
          body: `${item.name}: ${formatCurrency(item.amount)}`,
          icon: '/favicon.ico',
        });
      } else if (daysUntil === 0) {
        new Notification(`🔔 Fizza — Vence hoje!`, {
          body: `${item.name}: ${formatCurrency(item.amount)}`,
          icon: '/favicon.ico',
        });
      }
    });
  }, [recurring, notifGranted]);

  const requestNotifications = async () => {
    if (typeof Notification === 'undefined') return;
    const perm = await Notification.requestPermission();
    setNotifGranted(perm);
  };

  const togglePaidMutation = useMutation({
    mutationFn: ({ id, paid }) =>
      db.entities.RecurringExpense.update(id, {
        is_paid_this_month: paid,
        paid_month_year: paid ? currentMonth : null,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recurring'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.RecurringExpense.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recurring'] }),
  });

  const totalRecurring = recurring.reduce((s, e) => s + (e.amount || 0), 0);
  const totalPaid = recurring.filter(e => e.is_paid_this_month).reduce((s, e) => s + (e.amount || 0), 0);
  const totalPending = totalRecurring - totalPaid;

  const overdue = recurring.filter(e => !e.is_paid_this_month && e.due_day < today);
  const dueToday = recurring.filter(e => !e.is_paid_this_month && e.due_day === today);
  const upcoming = recurring.filter(e => !e.is_paid_this_month && e.due_day > today);
  const paid = recurring.filter(e => e.is_paid_this_month);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Recorrentes</h1>
          <p className="text-muted-foreground text-sm capitalize">
            {format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="flex gap-2">
          {notifGranted !== 'granted' && (
            <Button variant="outline" size="sm" onClick={requestNotifications} className="gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Ativar alertas</span>
            </Button>
          )}
          {notifGranted === 'granted' && (
            <div className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-3 py-1.5 rounded-lg">
              <Bell className="w-3 h-3" />
              Alertas ativos
            </div>
          )}
          <Button onClick={() => { setEditItem(null); setShowForm(true); }} className="gap-2">
            <PlusCircle className="w-4 h-4" />
            Novo
          </Button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <AddRecurringForm
          editItem={editItem}
          onClose={() => { setShowForm(false); setEditItem(null); }}
          onSaved={() => { qc.invalidateQueries({ queryKey: ['recurring'] }); setShowForm(false); setEditItem(null); }}
        />
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total/Mês</p>
            <p className="font-bold text-base text-foreground">{formatCurrency(totalRecurring)}</p>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Pago</p>
            <p className="font-bold text-base text-primary">{formatCurrency(totalPaid)}</p>
          </CardContent>
        </Card>
        <Card className="border-destructive/30 shadow-sm bg-destructive/5">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Pendente</p>
            <p className="font-bold text-base text-destructive">{formatCurrency(totalPending)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <RecurringCalendar items={recurring} />

      {/* Lists */}
      {isLoading ? (
        <p className="text-center text-muted-foreground py-8 text-sm">Carregando...</p>
      ) : recurring.length === 0 ? (
        <Card className="border-dashed border-border shadow-sm">
          <CardContent className="p-10 text-center">
            <p className="text-muted-foreground text-sm">Nenhum gasto recorrente cadastrado.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Overdue */}
          {overdue.length > 0 && (
            <ExpenseSection
              title="⚠️ Em Atraso"
              items={overdue}
              accentClass="border-destructive/40"
              onToggle={(id, paid) => togglePaidMutation.mutate({ id, paid })}
              onEdit={(item) => { setEditItem(item); setShowForm(true); }}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          )}
          {/* Due Today */}
          {dueToday.length > 0 && (
            <ExpenseSection
              title="🔔 Vence Hoje"
              items={dueToday}
              accentClass="border-accent/40"
              onToggle={(id, paid) => togglePaidMutation.mutate({ id, paid })}
              onEdit={(item) => { setEditItem(item); setShowForm(true); }}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          )}
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <ExpenseSection
              title="📅 Próximos"
              items={upcoming}
              accentClass="border-border"
              onToggle={(id, paid) => togglePaidMutation.mutate({ id, paid })}
              onEdit={(item) => { setEditItem(item); setShowForm(true); }}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          )}
          {/* Paid */}
          {paid.length > 0 && (
            <ExpenseSection
              title="✅ Pagos"
              items={paid}
              accentClass="border-border opacity-60"
              onToggle={(id, paid) => togglePaidMutation.mutate({ id, paid })}
              onEdit={(item) => { setEditItem(item); setShowForm(true); }}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          )}
        </div>
      )}
    </div>
  );
}

function ExpenseSection({ title, items, accentClass, onToggle, onEdit, onDelete }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{title}</p>
      <div className="space-y-2">
        {items.map(item => (
          <Card key={item.id} className={`border shadow-sm ${accentClass}`}>
            <CardContent className="p-4 flex items-center gap-3">
              {/* Color dot */}
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color || '#10b981' }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-medium truncate ${item.is_paid_this_month ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {item.name}
                  </p>
                  {item.category && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0 flex-shrink-0">{item.category}</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Todo dia <strong>{item.due_day}</strong> • {formatCurrency(item.amount)}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => onToggle(item.id, !item.is_paid_this_month)}
                  className={`p-1.5 rounded-lg transition-colors ${item.is_paid_this_month ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:border-primary hover:text-primary'}`}
                  title={item.is_paid_this_month ? 'Marcar como pendente' : 'Marcar como pago'}
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onEdit(item)}
                  className="p-1.5 text-muted-foreground hover:text-primary rounded-lg hover:bg-secondary transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}