import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

// Painel que sobe de baixo (padrão do iOS) para formulários.
export default function FormSheet({ open, onOpenChange, title, description, children }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl max-h-[92dvh] overflow-y-auto pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
      >
        <SheetHeader className="text-left mb-4">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription className={description ? undefined : 'sr-only'}>
            {description || title}
          </SheetDescription>
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  );
}
