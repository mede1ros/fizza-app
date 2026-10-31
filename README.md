# 🌱 Fizza

> Organizador financeiro pessoal para iPhone: registre seus gastos fixos e variáveis e veja, numa pizza, para onde vai o seu dinheiro.

**Abrir o app:** https://mede1ros.github.io/fizza-app/

Funciona **offline**, **sem login** e **sem servidor**. Os dados ficam salvos só no seu aparelho.

---

## 📱 Instalar no iPhone

1. Abra **https://mede1ros.github.io/fizza-app/** no **Safari**.
2. Toque em **Compartilhar** (o quadrado com a seta para cima).
3. Escolha **Adicionar à Tela de Início**.

Pronto: o Fizza vira um ícone, abre em tela cheia e funciona mesmo em modo avião. Quando houver uma versão nova, o app mostra **"Nova versão disponível — Atualizar"**.

> Não precisa de App Store nem de Mac: o Fizza é um *Progressive Web App* (PWA).

## ✨ O que dá para fazer

| Área | Recursos |
|---|---|
| **Início** | Renda, gastos e saldo do mês; **pizza por categoria com % (somam 100%)**; filtro Todos / Fixos / Variáveis; histórico de 6 meses; lembretes de metas e de backup. |
| **Gastos** | Gastos variáveis do mês agrupados por dia. O mês vem da data. Validação de valor no formato brasileiro (`1.234,56`). |
| **Fixos** | Aluguel, assinaturas e contas: status (Atrasados / Vencem hoje / Próximos / Pagos), pagamento por mês com valor ajustável (ex.: conta de luz), **parcelas**, encerrar sem perder o histórico e calendário. |
| **Renda** | Toque no cartão "Renda do mês": entradas **fixas** (salário, repetem todo mês) e **avulsas** (freela). |
| **Metas** | Valor alvo, quanto já guardou e prazo; dica de quanto guardar por mês com base nos seus gastos. |
| **Lista de Compras** | Orçamento e prioridade; ao comprar, opção de **registrar como gasto**. |
| **Backup e Configurações** | Exportar backup (Arquivos / iCloud Drive), importar com validação, categorias personalizadas, apagar todos os dados. |

## 💾 Seus dados

- Ficam no **IndexedDB** do navegador, **só neste aparelho**. Não há sincronização.
- O app da Tela de Início e o Safari guardam dados **separados**.
- **Faça backups** em *Menu → Backup e Configurações → Exportar backup* e salve o arquivo em **Arquivos** ou no **iCloud Drive**. O app lembra você se o último backup tiver mais de 30 dias.
- Para trocar de iPhone: exporte no antigo e importe no novo.

## 🧑‍💻 Desenvolvimento

Requisitos: **Node.js 18+**.

```bash
npm install
npm run dev        # http://localhost:5173/fizza-app/
npm test           # testes (Vitest)
npm run lint       # ESLint
npm run build      # gera dist/ (PWA)
npm run preview    # serve o build em http://localhost:4173/fizza-app/
```

No Windows, `Iniciar Fizza.bat` instala as dependências e abre o modo de desenvolvimento.

Para regenerar os ícones a partir de `public/icon.svg`, rode `npx pwa-assets-generator`.

### Arquitetura

```
src/
├── domain/      # Regras de negócio puras e testadas (sem React)
│   ├── money.js       # parseMoney / formatMoney (centavos)
│   ├── months.js      # meses "AAAA-MM", datas, rótulos pt-BR
│   ├── categories.js  # categorias padrão, normalização, cores
│   ├── finance.js     # totais do mês, pizza, status dos fixos
│   ├── migrate.js     # migração dos dados v1 → v2
│   └── backup.js      # formato e validação do backup
├── api/db.js    # IndexedDB: db.entities.X.list/create/update/delete, export/import
├── pages/       # Uma tela por rota
├── components/  # Shell (barra inferior + menu), formulários, componentes compartilhados
│   └── ui/      # shadcn/ui
├── lib/         # useMonth (mês selecionado), backupActions, utilitários
└── test/        # setup do Vitest e helpers
```

- **Rotas** (HashRouter): `#/`, `#/gastos`, `#/fixos`, `#/metas`, `#/compras`, `#/config`, `#/sobre`.
- **Stack:** React 18, Vite 6, Tailwind + shadcn/ui, TanStack Query, Recharts, date-fns, idb, vite-plugin-pwa.
- **Boas práticas adotadas:**
  - dinheiro sempre em centavos;
  - regras isoladas em funções puras;
  - testes antes do código (TDD);
  - confirmação em toda exclusão;
  - textos 100% em pt-BR;
  - acessibilidade (rótulos e alvos de toque de 44 px);
  - nenhum recurso externo carregado em tempo de execução.

### Modelo de dados (v2)

Todo registro tem `id`, `created_date` e `updated_date`. Valores em **centavos**.

| Entidade | Campos |
|---|---|
| `Expense` | `name`, `amount_cents`, `category`, `date` (AAAA-MM-DD), `notes` |
| `RecurringExpense` | `name`, `amount_cents`, `category`, `due_day`, `color`, `notes`, `start_month`, `end_month`, `payments: { "AAAA-MM": { paid_at, amount_cents } }` |
| `Income` | `name`, `amount_cents`, `kind` (`fixed` ou `once`), `date` (avulsa), `start_month` e `end_month` (fixa) |
| `FinancialGoal` | `title`, `target_cents`, `saved_cents`, `deadline` (AAAA-MM), `status` (`active`, `paused` ou `completed`), `notes` |
| `ShoppingItem` | `name`, `budget_cents`, `category`, `priority` (`baixa`, `média` ou `alta`), `purchased`, `notes` |
| `Category` | `name`, `color`, `is_default` |

Regras principais:
- Um fixo conta num mês se `start_month ≤ mês ≤ end_month`.
- O total do mês é a soma dos variáveis com data no mês mais os fixos ativos, usando o valor pago quando houver.

### Publicação

Cada push na `main` dispara o workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). Ele roda **lint, testes e build** e só publica no GitHub Pages se tudo passar.

## 📚 Documentação do projeto

- [docs/BACKLOG.md](docs/BACKLOG.md): bugs corrigidos e próximas ideias
- [CHANGELOG.md](CHANGELOG.md): histórico de versões
- [Design do MVP](docs/superpowers/specs/2026-10-30-fizza-mvp-design.md) e [plano de implementação](docs/superpowers/plans/2026-10-30-fizza-mvp.md)
