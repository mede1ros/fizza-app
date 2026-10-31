import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast } from '@/components/ui/use-toast';
import { ToastAction } from '@/components/ui/toast';

// Avisa quando há versão nova (o usuário escolhe a hora de atualizar) e quando o app já funciona offline.
export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    offlineReady: [offlineReady],
    updateServiceWorker,
  } = useRegisterSW();

  useEffect(() => {
    if (!needRefresh) return;
    toast({
      title: 'Nova versão disponível',
      description: 'Atualize para usar as novidades.',
      duration: Infinity,
      action: <ToastAction altText="Atualizar o app" onClick={() => updateServiceWorker(true)}>Atualizar</ToastAction>,
    });
  }, [needRefresh, updateServiceWorker]);

  useEffect(() => {
    if (offlineReady) toast({ title: 'Pronto para usar offline' });
  }, [offlineReady]);

  return null;
}
