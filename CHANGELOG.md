# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [1.0.0] — 2026-10-31

Primeira versão do MVP, feita para o iPhone.

### Adicionado
- App instalável (PWA): ícone na Tela de Início, tela cheia e funcionamento offline, com aviso quando há versão nova.
- Navegação com barra inferior (Início, Gastos, Fixos) e menu lateral (Metas, Lista de Compras, Backup e Configurações, Sobre).
- Renda como entradas fixas ou avulsas.
- Pizza por categoria com percentuais que somam 100% e filtro Todos/Fixos/Variáveis.
- Gastos fixos com histórico de pagamentos, valor pago ajustável, parcelas e opção de encerrar.
- Backup: exportar/importar arquivo, validação, resumo antes de restaurar e lembrete após 30 dias.
- Categorias personalizadas com cores fixas.
- "Registrar como gasto" ao marcar um item da Lista de Compras como comprado.
- Página Sobre com o passo a passo de instalação no iPhone.
- Testes automáticos, lint e publicação automática no GitHub Pages.

### Alterado
- Dados saem do localStorage e passam para o IndexedDB, com migração automática.
- Valores passam a ser guardados em centavos.
- Formulários abrem em painel inferior, no padrão do iOS.

### Corrigido
- BUG-01 a BUG-17 (detalhes em [docs/BACKLOG.md](docs/BACKLOG.md)).

### Removido
- Notificações do navegador (não funcionam no iOS sem push).
- Dependências não usadas (Stripe, three.js, Leaflet, Quill, jsPDF etc.).
