import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  LayoutDashboard, Receipt, RefreshCcw, Menu, Target, ShoppingCart, Settings, Info, Leaf,
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const TABS = [
  { to: '/', label: 'Início', icon: LayoutDashboard, end: true },
  { to: '/gastos', label: 'Gastos', icon: Receipt },
  { to: '/fixos', label: 'Fixos', icon: RefreshCcw },
];

const MENU = [
  { to: '/metas', label: 'Metas', icon: Target },
  { to: '/compras', label: 'Lista de Compras', icon: ShoppingCart },
  { to: '/config', label: 'Backup e Configurações', icon: Settings },
  { to: '/sobre', label: 'Sobre', icon: Info },
];

const tabClass = ({ isActive }) =>
  cn(
    'flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[56px] text-[11px] font-medium transition-colors',
    isActive ? 'text-primary' : 'text-muted-foreground'
  );

export default function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border pt-safe">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
            <Leaf className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground tracking-tight">Fizza</span>
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 pt-4 pb-tabbar">
        <Outlet />
      </main>

      <nav
        aria-label="Navegação principal"
        className="fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t border-border pb-safe"
      >
        <div className="max-w-2xl mx-auto flex">
          {TABS.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={tabClass}>
              <Icon className="w-6 h-6" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
          <button
            type="button"
            aria-label="Abrir menu"
            onClick={() => setMenuOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[56px] text-[11px] font-medium text-muted-foreground"
          >
            <Menu className="w-6 h-6" aria-hidden="true" />
            Menu
          </button>
        </div>
      </nav>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-[82vw] max-w-xs pt-safe">
          <SheetHeader className="text-left">
            <SheetTitle>Fizza</SheetTitle>
            <SheetDescription>Mais áreas do app</SheetDescription>
          </SheetHeader>
          <ul className="mt-4 space-y-1">
            {MENU.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <Link
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 min-h-[48px] rounded-xl text-sm font-medium text-foreground hover:bg-secondary active:bg-secondary"
                >
                  <Icon className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>
    </div>
  );
}
