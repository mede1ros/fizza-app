import { Leaf, Share, PlusSquare, Smartphone } from 'lucide-react';

const STEPS = [
  { icon: Smartphone, text: 'Abra o Fizza no Safari do iPhone.' },
  { icon: Share, text: 'Toque em Compartilhar (o quadrado com a seta para cima).' },
  { icon: PlusSquare, text: 'Escolha "Adicionar à Tela de Início" e confirme.' },
];

export default function About() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center">
          <Leaf className="w-7 h-7 text-primary-foreground" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fizza</h1>
          <p className="text-sm text-muted-foreground">Versão {__APP_VERSION__}</p>
        </div>
      </div>

      <p className="text-sm text-foreground">
        Organizador financeiro pessoal: registre gastos fixos e variáveis, acompanhe sua renda e veja para onde vai o seu dinheiro.
      </p>

      <section aria-label="Instalar no iPhone" className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <h2 className="text-base font-semibold">Instalar no iPhone</h2>
        <ol className="space-y-3">
          {STEPS.map(({ icon: Icon, text }, i) => (
            <li key={text} className="flex items-start gap-3 text-sm">
              <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
              <span className="flex-1 pt-1">{text}</span>
              <Icon className="w-5 h-5 text-muted-foreground mt-0.5" aria-hidden="true" />
            </li>
          ))}
        </ol>
        <p className="text-xs text-muted-foreground">Depois de instalado, o Fizza abre em tela cheia e funciona sem internet.</p>
      </section>

      <section aria-label="Seus dados" className="rounded-2xl border border-border bg-card p-4 space-y-2">
        <h2 className="text-base font-semibold">Seus dados</h2>
        <p className="text-sm text-muted-foreground">
          Tudo fica salvo apenas neste aparelho, sem conta e sem servidor. O app da Tela de Início e o Safari guardam dados separados.
          Faça backups em Backup e Configurações.
        </p>
      </section>
    </div>
  );
}
