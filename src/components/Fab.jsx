import { Plus } from 'lucide-react';

// Botão flutuante "+" posicionado acima da barra inferior.
export default function Fab({ label, onClick }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="fixed right-4 bottom-above-tabbar z-30 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-95 transition-transform"
    >
      <Plus className="w-6 h-6" aria-hidden="true" />
    </button>
  );
}
