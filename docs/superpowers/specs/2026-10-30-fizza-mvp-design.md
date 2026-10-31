# Fizza MVP: design

**Data:** 2026-10-30 · **Status:** aprovado pelo usuário ("corrija como achar melhor")

## 1. Intenção

O Fizza é um gerenciador financeiro pessoal **para iPhone**: funciona **offline** e **sem login**. A pessoa registra todos os gastos, **fixos** (aluguel, assinaturas, contas) e **variáveis** (almoço, Uber), e vê para onde vai o dinheiro num **gráfico de pizza com o percentual de cada categoria**.

O código atual (React + Vite, exportado de um protótipo) já tem uma interface boa, mas foi feito para desktop e tem bugs que tornam os números não confiáveis. O MVP transforma esse protótipo num app **confiável, instalável no iPhone e publicado no GitHub**, com a organização e as boas práticas de um projeto profissional.

### Sucesso significa
1. Abrir o endereço no Safari, tocar em **Adicionar à Tela de Início** e passar a usar o Fizza como um app, inclusive em modo avião.
2. Cada número exibido (totais, saldo, percentuais da pizza) estar **correto** e coberto por testes.
3. Nunca perder dados sem aviso: existe backup, e o app lembra de fazê-lo.

## 2. Objetivos, não objetivos e anti-objetivos

**Objetivos**
- Rodar como **PWA instalável no iPhone** (Safari, iOS 16.4+), em tela cheia e 100% offline depois da primeira visita.
- Cadastrar, editar e excluir gastos **variáveis** e **fixos**, com categorias.
- **Pizza do mês** com percentual por categoria, somando fixos e variáveis.
- Manter todas as áreas existentes: **Início, Gastos, Fixos, Metas, Lista de Compras**, mais **Backup e Configurações**.
- **Backup** (exportar/importar arquivo) e armazenamento durável.
- Publicação automática no **GitHub Pages** a cada push.
- Código organizado, com testes nas regras de negócio, lint limpo e documentação.

**Não objetivos (fora do MVP)**
- Login, contas, sincronização entre aparelhos, servidor ou backend.
- Versão desktop ou Android otimizada (o app funciona nesses lugares, mas não é testado neles).
- App Store / app nativo.
- Notificações push (no iOS exigiriam servidor de push).
- Integração bancária, várias moedas, vários idiomas, modo escuro.

**Anti-objetivos (o que tornaria o MVP um fracasso mesmo "funcionando")**
- Um total ou percentual errado.
- Perder dados do usuário numa atualização do app ou numa importação de backup.
- O app precisar de internet depois de instalado.
- Dados pessoais no repositório público (sem dados reais em seeds, testes ou capturas de tela).

## 3. Restrições

- **Plataforma:** Safari do iOS em modo standalone. Sem Mac e sem conta de desenvolvedor Apple.
- **Hospedagem:** GitHub Pages com o **repositório público** (`mede1ros/fizza-app`), publicado em `https://mede1ros.github.io/fizza-app/`.
  - Base path `/fizza-app/`.
  - O Pages não reescreve rotas, então a navegação usa **HashRouter** (`/#/gastos`).
- **Dados no aparelho:** no iOS, o app da Tela de Início e o Safari têm armazenamentos separados, e o iOS pode limpar dados de sites em situações de pouco espaço. Por isso, o backup é parte do MVP, não um extra.
- **Stack existente:** React 18, Vite 6, Tailwind 3, shadcn/ui (Radix), TanStack Query 5, Recharts, date-fns. O MVP continua sobre ela.
- **Idioma e moeda:** pt-BR e BRL.

## 4. Abordagens consideradas

| Abordagem | Trocas | Decisão |
|---|---|---|
| **A. PWA no GitHub Pages com repositório público** | Grátis, tudo no GitHub, deploy automático. Código visível publicamente (os dados não). | ✅ **Escolhida pelo usuário** |
| B. PWA com repositório privado + Vercel | Código privado, grátis; exige mais uma conta, hospedagem fora do GitHub. | Descartada |
| C. GitHub Pages com repositório privado | Exige GitHub Pro (US$ 4/mês) só para esconder o código. | Descartada |
| D. App nativo (Capacitor/React Native) | Exige Mac + conta Apple de US$ 99/ano; sem isso, a instalação expira em 7 dias. | Descartada: inviável para o usuário |

## 5. Decisões do usuário

- Uso **apenas no iPhone**; o computador serve só para desenvolver.
- **Sem login e sem senha**; dados só no aparelho, sem sincronização.
- Manter a **interface atual**, adaptada ao iPhone.
- **Barra inferior** com o uso diário + **menu lateral** com as demais áreas, para tudo poder ser testado e usado.
- Hospedar no **GitHub Pages** com repositório **público**.

## 6. Design

### 6.1 Navegação (iPhone)

- **Barra inferior fixa** com 4 itens: **Início**, **Gastos**, **Fixos** e **☰ Menu**.
- **☰ Menu** abre um **menu lateral** (Sheet, vindo da esquerda) com:
  - **Metas**
  - **Lista de Compras**
  - **Backup e Configurações**
  - **Sobre**
- **Botão "+"** flutuante nas telas de Gastos e Fixos (e no Início, para lançar um gasto rápido).
- Os formulários abrem como **painel de baixo para cima** (Drawer, já instalado: `vaul`), no padrão do iOS.
- Respeito às áreas seguras do iPhone (`viewport-fit=cover` + `env(safe-area-inset-*)`). Alvos de toque com no mínimo 44 px.
- Campos de dinheiro com `inputmode="decimal"` (teclado numérico com vírgula).
- Rotas: `/#/` (Início), `/#/gastos`, `/#/fixos`, `/#/metas`, `/#/compras`, `/#/config`, `/#/sobre`.

### 6.2 Telas

**Início**
- Seletor de mês.
- Cartões **Renda**, **Gastos** (variáveis + fixos do mês) e **Saldo**. Tocar em **Renda** abre o painel de **entradas do mês**: lista, adicionar, editar e excluir. Cada entrada é **fixa** (ex.: salário, repete todo mês a partir do mês de início até ser encerrada) ou **avulsa** (ex.: freelance, só na data informada).
- **Pizza do mês** por categoria, com o percentual no gráfico ou numa legenda em lista (categoria · valor · %). A lista vem ordenada do maior para o menor e cada categoria tem **cor estável**.
- Filtro da pizza: **Todos / Fixos / Variáveis**.
- Histórico de 6 meses (barras Renda × Gastos), usando as mesmas regras de cálculo.
- Lembretes de metas ativas.
- Estado vazio com um convite claro: "Registre seu primeiro gasto".

**Gastos (variáveis)**
- Lista do mês selecionado, agrupada por dia, com total do mês.
- Cadastrar/editar: nome, valor, categoria, data (padrão hoje) e observação. O **mês é derivado da data**.
- Excluir com confirmação.

**Fixos (recorrentes)**
- Lista dos fixos **ativos no mês selecionado**, separados em **Atrasados / Vencem hoje / Próximos / Pagos**. Essa separação só aparece no mês atual; meses passados mostram apenas pago/não pago.
- Cadastrar/editar: nome, valor previsto, categoria, dia de vencimento (1–31), cor e observação.
- **Marcar como pago** num mês registra o pagamento daquele mês, permitindo **ajustar o valor pago** (para contas de valor variável, como luz).
- **Encerrar** um fixo (ex.: cancelou a Netflix) define o mês final sem apagar o histórico. Excluir de vez pede confirmação e apaga o histórico.
- Calendário do mês selecionado com os vencimentos.

**Metas**
- Funcionalidade atual mantida.
- A dica deixa de citar "Lazer" fixo no código e passa a usar a **maior categoria variável** do mês.

**Lista de Compras**
- Funcionalidade atual mantida, com os mesmos padrões de formulário, confirmação e valor.
- Opcional: ao marcar um item como comprado, oferecer "registrar como gasto".

**Backup e Configurações**
- **Exportar backup:** gera `fizza-backup-AAAA-MM-DD.json` e abre a folha de compartilhamento do iOS (`navigator.share` com arquivo), permitindo salvar no iCloud Drive/Arquivos. Se o compartilhamento não estiver disponível, faz download.
- **Importar backup:** escolhe o arquivo, valida, mostra um resumo ("312 gastos, 9 fixos…") e pede confirmação antes de **substituir** os dados atuais.
- Mostra a **data do último backup**. O Início exibe um aviso discreto se o último backup tiver mais de 30 dias e houver dados.
- **Categorias:** gerenciar categorias personalizadas (nome e cor).
- **Apagar todos os dados** (com confirmação dupla).
- Versão do app e armazenamento usado.

**Sobre**
- Nome, versão e como instalar no iPhone (passo a passo com "Adicionar à Tela de Início").

### 6.3 Regras de negócio (o coração do MVP: funções puras e testadas)

Tudo em `src/domain/`, sem React, com testes unitários.

- **Dinheiro:**
  - Valores são guardados em **centavos (inteiros)**, e só se formata na exibição.
  - `parseMoney("1.234,56") → 123456`. Também aceita `"1234,56"`, `"1234.56"`, `"R$ 12"` e `"12"`.
  - Rejeita valor vazio, negativo, zero ou inválido, com mensagem de erro no campo.
- **Mês de um gasto variável:** derivado de `date` (`AAAA-MM-DD → AAAA-MM`).
- **Fixo ativo num mês M:** `start_month ≤ M` e (`end_month` vazio ou `M ≤ end_month`).
- **Valor de um fixo no mês M:** o valor pago naquele mês, se houver pagamento; senão, o valor previsto.
- **Total do mês** = soma dos variáveis do mês + soma dos fixos ativos no mês.
- **Pizza:** agrupa por categoria (comparação sem diferenciar maiúsculas/acentos; exibe o nome canônico). Os percentuais são calculados sobre o total do filtro. A soma exibida dos percentuais fecha em 100% (arredondamento pelo método do maior resto).
- **Renda do mês** = soma das entradas avulsas com data no mês + entradas fixas ativas no mês (mesma regra de ativo dos gastos fixos). *(decisão do engenheiro, ver §8)*
- **Saldo** = renda − total do mês.
- **Status de um fixo no mês atual:** pago / vence hoje / atrasado / próximo, conforme o dia de hoje. Para vencimentos 29–31 em meses curtos, conta o último dia do mês.

### 6.4 Modelo de dados (versão 2)

Todo registro tem `id`, `created_date` e `updated_date`. Valores em **centavos**.

| Entidade | Campos |
|---|---|
| `Expense` | `name`, `amount_cents`, `category`, `date` (AAAA-MM-DD, obrigatório), `notes?` |
| `RecurringExpense` | `name`, `amount_cents`, `category`, `due_day`, `color?`, `notes?`, `start_month` (AAAA-MM), `end_month?`, `payments: { "AAAA-MM": { paid_at, amount_cents } }` |
| `Income` | `name`, `amount_cents`, `kind` (`fixed` ou `once`), `date` (avulsa: AAAA-MM-DD), `start_month` e `end_month?` (fixa) |
| `FinancialGoal` | `title`, `target_cents`, `saved_cents`, `deadline?`, `status`, `notes?` |
| `ShoppingItem` | `name`, `budget_cents?`, `category?`, `priority`, `purchased`, `notes?` |
| `Category` | `name`, `color`. As padrão vêm pré-cadastradas, cada uma com cor fixa; as personalizadas são criadas pelo usuário. |
| `Meta` | `schema_version`, `last_backup_at` |

Mudanças em relação ao modelo atual:
- `month_year` deixa de ser guardado no `Expense`.
- `is_paid_this_month`/`paid_month_year` dão lugar a `payments`.
- Os valores passam a ser em centavos.
- Surgem `Category` e `Meta`.
- `MonthlyBudget` dá lugar a `Income`. Na migração, cada `MonthlyBudget` vira uma entrada **avulsa** "Renda" no dia 1 do mês, com o mesmo valor.

### 6.5 Armazenamento

- Sai o **localStorage** e entra o **IndexedDB** (biblioteca pequena e mantida, ex.: `idb`), que é mais durável e tem mais espaço.
- Na inicialização, o app chama `navigator.storage.persist()`.
- `src/api/db.js` mantém a **mesma interface** (`entities.X.list/create/update/delete`), mais `exportAll()`, `importAll()` e `clearAll()`.
- **Migrações versionadas:**
  - Na primeira execução, importa os dados que existirem no localStorage (`fizza:*`), converte para a v2 e marca `schema_version = 2`.
  - Antes de qualquer migração, guarda uma cópia dos dados antigos.
- O backup inclui `app`, `schema_version` e `exported_at`. A importação valida a estrutura, migra backups de versões antigas e, se algo estiver inválido, recusa **sem alterar nada**.

### 6.6 PWA e publicação

- **`vite-plugin-pwa`:**
  - manifest com nome "Fizza", `display: standalone`, cor do tema e ícones 192/512 + `apple-touch-icon` 180;
  - service worker que pré-carrega todo o app;
  - **aviso "Nova versão disponível — Atualizar"**, em vez de atualizar no meio do uso.
- Meta tags do iOS: `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style` e `apple-mobile-web-app-title`.
- O app não carrega nada de fora: sem fontes ou CDNs externos.
- **GitHub Actions:** workflow que, a cada push na `main`, roda lint, testes e build e publica no GitHub Pages. Se um teste falhar, nada é publicado.
- Para isso, o repositório passa a ser **público** e o Pages é ativado com origem "GitHub Actions".

### 6.7 Qualidade e boas práticas

- **Organização:**
  - `src/domain/` (regras puras), `src/api/` (dados), `src/features/<área>/` (telas e componentes de cada área), `src/components/` (compartilhados), `src/lib/` (utilitários, como `formatMoney`).
  - Uma função de formatação e um parser de dinheiro únicos, em vez das cópias espalhadas hoje.
- **Testes (Vitest):**
  - regras de negócio de §6.3: dinheiro, totais, fixos ativos, pizza com percentuais fechando em 100%, renda (entradas fixas e avulsas);
  - migração v1→v2;
  - validação de backup;
  - testes de componente (Testing Library) para os fluxos principais: adicionar gasto, marcar fixo como pago, importar backup.
- **Lint:** ESLint sem erros, rodando no CI.
- **Dependências:** remover as não usadas (`stripe`, `three`, `react-leaflet`, `react-quill`, `jspdf`, `html2canvas`, `moment`, `lodash`, `canvas-confetti` etc., confirmando caso a caso) para o app carregar rápido e caber bem no cache offline.
- **Acessibilidade:** botões só com ícone ganham `aria-label`, os formulários têm `label`, e as cores mantêm contraste.
- **Erros:**
  - um Error Boundary com tela amigável e o botão "Exportar backup", para o usuário nunca ficar preso;
  - falhas de gravação mostram um aviso (toast).
- **Git:** commits pequenos e descritivos, `CHANGELOG.md` e versão semântica (`1.0.0` no lançamento do MVP).

### 6.8 Organização de bugs e melhorias

- `docs/BACKLOG.md` vira a fonte única, com seções **Bugs**, **MVP** e **Depois do MVP**. Cada item tem ID (ex.: `BUG-03`), descrição, impacto e status.
- Bugs conhecidos hoje, todos corrigidos no MVP:
  - **BUG-01:** gasto entra no mês aberto na tela, não no mês da data.
  - **BUG-02:** fixos somados em todos os meses, inclusive anteriores ao cadastro; o histórico de 6 meses fica distorcido.
  - **BUG-03:** `1.234,56` é salvo como 1,23; não há validação de valor inválido, negativo ou zero.
  - **BUG-04:** "pago" dos fixos vale só para o mês atual; não existe histórico de pagamentos e a virada de mês apaga o status.
  - **BUG-05:** cores da pizza mudam conforme a ordem das categorias.
  - **BUG-06:** "Lazer" e "Lazer " (ou com maiúsculas diferentes) viram categorias separadas.
  - **BUG-07:** exclusões sem confirmação.
  - **BUG-08:** alerta "Lazer > 30%" e dica de metas fixos no código.
  - **BUG-09:** notificações disparam a cada atualização da lista e usam um ícone inexistente (`/favicon.ico`); além disso, o iOS não as exibe sem push. Removidas no MVP.
  - **BUG-10:** o calendário dos fixos ignora o mês selecionado e sempre mostra o mês atual.
  - **BUG-11:** a edição rápida de gasto não permite alterar data nem observação.
  - **BUG-12:** datas exibidas em formato bruto (`2026-10-30`).
  - **BUG-13:** dados só no localStorage, sem backup.
  - **BUG-14:** texto da página 404 e páginas restantes misturando inglês e português.

## 7. Critérios de aceite do MVP

1. Num iPhone, `https://mede1ros.github.io/fizza-app/` instala pela Tela de Início, abre em tela cheia e funciona em **modo avião** depois da primeira abertura.
2. Ao cadastrar 2 variáveis e 2 fixos, os totais, o saldo e a pizza (com % somando 100%) estão corretos no mês, e o mês anterior ao cadastro dos fixos não os inclui.
3. Marcar um fixo como pago em outubro não afeta novembro, e o valor ajustado aparece no total de outubro.
4. Exportar → apagar tudo → importar restaura exatamente os mesmos dados.
5. Dados existentes no localStorage são migrados sem perda na primeira abertura da nova versão.
6. Todas as áreas abrem pela barra inferior ou pelo menu lateral.
7. `npm run lint`, `npm test` e `npm run build` passam, e o CI publica automaticamente.
8. Nenhuma referência a dados reais ou segredos no repositório.

## 8. Decisões tomadas pelo engenheiro (para revisão)

- **PWA + IndexedDB + HashRouter**, como explicado em §3 e §6.5.
- **Valores em centavos** para evitar erros de arredondamento.
- **Renda em entradas** fixas ou avulsas, em vez de um valor único por mês. Cobre salário + extras sem tela nova (pergunta delegada pelo usuário).
- **Fixos com início/fim e histórico de pagamentos**, permitindo ajustar o valor pago.
- **Notificações removidas** do MVP; em troca, há destaques "Vence hoje/Atrasado" dentro do app.
- **Backlog em `docs/BACKLOG.md`**, em vez de GitHub Issues, para não depender de ferramentas externas. Pode ser espelhado em Issues depois.
- **`Iniciar Fizza.bat`** continua apenas como atalho de desenvolvimento no computador.
- **Uma lista única de categorias padrão** para variáveis e fixos, cada uma com cor fixa: Alimentação, Transporte, Moradia, Saúde, Educação, Lazer, Assinaturas, Vestuário, Serviços, Treino e Outros. Hoje cada tela tem a sua lista.
- **Compras parceladas:** o formulário de fixos ganha o campo opcional "Nº de parcelas", que calcula o `end_month` automaticamente (ex.: 10x a partir de 11/2026 termina em 08/2027).
- **Migração de fixos antigos:** `start_month` = mês de `created_date`. Um pagamento marcado no formato antigo vira `payments[paid_month_year]`.

## 9. Deixado para quem implementa

- Escolha exata dos ícones do PWA (gerados a partir do logo de folha atual).
- Animações e microinterações.
- Ordem dos commits e tamanho de cada etapa (definidos no plano de implementação).
