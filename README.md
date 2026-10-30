# 🌱 Fizza

> Um organizador financeiro pessoal moderno e motivador, desenhado para transformar a gestão do seu dinheiro em uma rotina leve, clara e focada em alcançar seus sonhos.

O Fizza roda **direto no navegador, sem login e sem servidor**: os dados ficam salvos no próprio computador (localStorage).

---

## Sumário

1. [Como rodar](#-como-rodar)
2. [Funcionalidades](#-funcionalidades)
3. [Tecnologias](#-tecnologias)
4. [Estrutura de pastas](#-estrutura-de-pastas)
5. [Rotas / páginas](#-rotas--páginas)
6. [Armazenamento de dados](#-armazenamento-de-dados)
7. [Modelo de dados](#-modelo-de-dados)
8. [Scripts npm](#-scripts-npm)
9. [Publicar online](#-publicar-online)

---

## 🚀 Como rodar

### Windows: dois cliques

1. Instale o **Node.js LTS** (versão 18 ou superior): https://nodejs.org
2. Dê **dois cliques em `Iniciar Fizza.bat`**.
   - Na primeira vez, ele roda `npm install` (leva alguns minutos).
   - Depois, sobe o servidor e abre `http://localhost:5173` no navegador.
3. Para encerrar, feche a janela preta do terminal.

### Manual (qualquer sistema)

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173`.

---

## ✨ Funcionalidades

| Área | O que faz |
|---|---|
| **Dashboard** (`/`) | Seletor de mês, **renda do mês** (editável), **total de gastos** (gastos avulsos + recorrentes), **saldo disponível**, gráfico de pizza de **gastos por categoria**, gráfico de barras com o **histórico dos últimos 6 meses** e lembretes de **metas ativas** com barra de progresso. |
| **Gastos** (`/expenses`) | Registrar, editar e excluir gastos do mês, com categorias sugeridas ou personalizadas, data e observações. Mostra o total por categoria e inclui as contas recorrentes no resumo. |
| **Recorrentes** (`/recurring`) | Contas fixas mensais (aluguel, assinaturas…) com dia de vencimento e cor. Separa em **Em atraso / Vence hoje / Próximos / Pagos**, permite marcar como pago no mês, tem **calendário** de vencimentos e **notificações do navegador** para contas que vencem hoje ou amanhã. |
| **Metas** (`/goals`) | Metas financeiras com valor-alvo, valor guardado, prazo (mês/ano), status (ativa, concluída, pausada) e anotações. Mostra o progresso e dicas. |
| **Compras** (`/shopping`) | Lista de desejos/compras com orçamento estimado, categoria, prioridade (baixa/média/alta) e marcação de "comprado". |

Todos os valores são formatados em **R$ (pt-BR)** e as datas usam `date-fns` com locale `ptBR`.

---

## 🧰 Tecnologias

- **React 18** + **Vite 6**
- **React Router 6** (rotas)
- **TanStack React Query 5** (cache e estado dos dados)
- **Tailwind CSS 3** + **shadcn/ui** (componentes Radix UI em `src/components/ui`)
- **Recharts** (gráficos), **lucide-react** (ícones), **date-fns** (datas)
- **localStorage** como banco de dados local (`src/api/db.js`)

---

## 📁 Estrutura de pastas

```
fizza/
├── Iniciar Fizza.bat          # Inicializador para Windows (duplo clique)
├── public/favicon.svg
├── src/
│   ├── main.jsx               # Ponto de entrada React
│   ├── App.jsx                # Rotas + providers (React Query, Toaster)
│   ├── index.css              # Tema (variáveis CSS do Tailwind/shadcn)
│   ├── api/db.js              # Armazenamento local (CRUD sobre localStorage)
│   ├── components/
│   │   ├── Layout.jsx         # Cabeçalho com logo e navegação
│   │   ├── MonthSelector.jsx  # Seletor de mês (‹ Outubro de 2026 ›)
│   │   ├── dashboard/GoalReminders.jsx
│   │   ├── recurring/AddRecurringForm.jsx, RecurringCalendar.jsx
│   │   └── ui/                # Componentes shadcn/ui (button, card, dialog…)
│   ├── hooks/                 # useMonthSelector, use-mobile
│   ├── lib/                   # PageNotFound, query-client, utils
│   ├── pages/                 # Uma página por rota
│   └── utils/index.ts
├── index.html, vite.config.js, tailwind.config.js, postcss.config.js
├── components.json            # Config do shadcn/ui
├── eslint.config.js, jsconfig.json
└── package.json
```

---

## 🧭 Rotas / páginas

| Rota | Arquivo |
|---|---|
| `/` | `src/pages/Dashboard.jsx` |
| `/expenses` | `src/pages/Expenses.jsx` |
| `/recurring` | `src/pages/Recurring.jsx` |
| `/goals` | `src/pages/Goals.jsx` |
| `/shopping` | `src/pages/Shopping.jsx` |
| `*` | `src/lib/PageNotFound.jsx` |

---

## 💾 Armazenamento de dados

`src/api/db.js` expõe uma API simples por entidade:

```js
import { db } from '@/api/db';

await db.entities.Expense.list('-date');          // lista (ordenação opcional; "-" = decrescente)
await db.entities.Expense.create({ name, amount }); // cria (gera id, created_date, updated_date)
await db.entities.Expense.update(id, { amount });  // atualiza
await db.entities.Expense.delete(id);              // remove
```

- Cada entidade fica numa chave do localStorage: `fizza:Expense`, `fizza:RecurringExpense`, `fizza:MonthlyBudget`, `fizza:FinancialGoal`, `fizza:ShoppingItem`.
- Os dados ficam **no navegador e no computador onde o app é usado**. Limpar os dados do site ou trocar de navegador/computador começa do zero.
- Para sincronizar entre dispositivos no futuro, basta trocar a implementação de `db.js` por um backend (ex.: Supabase ou Firebase) mantendo a mesma interface. As páginas não precisam mudar.

---

## 🗃️ Modelo de dados

Todo registro recebe automaticamente `id`, `created_date` e `updated_date`.

### `Expense`: gasto avulso
| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| `name` | string | ✔ | Nome do gasto (ex.: Creatina) |
| `amount` | number | ✔ | Valor em R$ |
| `category` | string | ✔ | Categoria (ex.: Treino, Alimentação) |
| `month_year` | string | ✔ | `YYYY-MM` |
| `date` | string | | `YYYY-MM-DD` |
| `notes` | string | | Observações |

### `RecurringExpense`: conta recorrente
| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| `name` | string | ✔ | Ex.: Netflix, Aluguel |
| `amount` | number | ✔ | Valor em R$ |
| `due_day` | number | ✔ | Dia do vencimento (1–31) |
| `category` | string | | Ex.: Moradia, Assinaturas |
| `is_paid_this_month` | boolean | | Padrão `false` |
| `paid_month_year` | string | | Mês em que foi pago (`YYYY-MM`) |
| `color` | string | | Cor no calendário |
| `notes` | string | | Observações |

### `MonthlyBudget`: renda do mês
| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| `month_year` | string | ✔ | `YYYY-MM` |
| `income` | number | ✔ | Renda mensal em R$ |

### `FinancialGoal`: meta
| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| `title` | string | ✔ | Título |
| `target_amount` | number | ✔ | Valor-alvo |
| `saved_amount` | number | | Valor já guardado |
| `deadline` | string | | Prazo `YYYY-MM` |
| `status` | enum | | `active` (padrão), `completed`, `paused` |
| `notes` | string | | Anotações |

### `ShoppingItem`: item da lista de compras
| Campo | Tipo | Obrig. | Descrição |
|---|---|---|---|
| `name` | string | ✔ | Ex.: Violão novo |
| `budget` | number | | Orçamento estimado |
| `category` | string | | Ex.: Lazer, Eletrônicos |
| `priority` | enum | | `baixa`, `média` (padrão), `alta` |
| `purchased` | boolean | | Padrão `false` |
| `notes` | string | | Observações |

---

## 📜 Scripts npm

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (Vite) |
| `npm run build` | Gera a versão de produção em `dist/` |
| `npm run preview` | Serve o `dist/` localmente |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run typecheck` | Checagem de tipos via `tsc` |

---

## 🌐 Publicar online

Como o Fizza é 100% front-end, o resultado de `npm run build` (pasta `dist/`) pode ser hospedado em qualquer serviço de site estático: **Vercel**, **Netlify** ou **GitHub Pages**. Por ser uma SPA, configure o serviço para redirecionar todas as rotas para `index.html`.
