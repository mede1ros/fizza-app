# Backlog do Fizza

Fonte única de bugs, entregas e ideias. Cada item tem um ID; ao corrigir ou entregar, registre o status e o commit.

Legenda: ✅ feito · 🔜 próximo · 💡 ideia

---

## Bugs

| ID | Descrição | Impacto | Status | Correção |
|---|---|---|---|---|
| BUG-01 | Gasto entrava no mês aberto na tela, não no mês da data informada. | Totais e pizza no mês errado. | ✅ | `78dc867`: o mês agora é derivado da data |
| BUG-02 | Fixos eram somados em todos os meses, inclusive antes do cadastro, e distorciam o histórico. | Totais e histórico errados. | ✅ | `5317935`, `8c8e3d6`: início e fim do fixo |
| BUG-03 | `1.234,56` era salvo como R$ 1,23; não havia validação de valor inválido, zero ou negativo. | Valores errados salvos sem aviso. | ✅ | `c10b906`: `parseMoney`, valores em centavos |
| BUG-04 | "Pago" dos fixos valia só para o mês atual e era apagado na virada do mês, sem histórico. | Impossível saber o que foi pago antes. | ✅ | `8c8e3d6`: `payments` por mês, valor ajustável |
| BUG-05 | As cores da pizza mudavam conforme a ordem das categorias. | Confusão ao comparar meses. | ✅ | `5317935`: cor fixa por categoria |
| BUG-06 | "Lazer", "lazer " e "LÁZER" viravam categorias diferentes. | Pizza fragmentada. | ✅ | `5317935`: `categoryKey` normaliza |
| BUG-07 | Exclusões aconteciam sem confirmação. | Perda acidental de dados. | ✅ | `78dc867` em diante: `ConfirmDialog` |
| BUG-08 | O alerta "Lazer > 30%" e a dica das metas estavam fixos no código. | Dicas irrelevantes. | ✅ | `61f7d5e`: usa a maior categoria variável do mês |
| BUG-09 | Notificações disparavam a cada atualização, usavam um ícone inexistente e não funcionam no iOS sem push. | Spam e recurso enganoso. | ✅ | `8c8e3d6`: removidas; destaques "Vence hoje / Atrasados" no app |
| BUG-10 | O calendário dos fixos ignorava o mês selecionado. | Calendário errado ao navegar. | ✅ | `8c8e3d6` |
| BUG-11 | A edição rápida de gasto não permitia mudar data nem observação. | Correções impossíveis. | ✅ | `78dc867`: o mesmo formulário para criar e editar |
| BUG-12 | Datas apareciam no formato bruto `2026-10-30`. | Leitura ruim. | ✅ | `78dc867`: `formatDateBR` |
| BUG-13 | Dados só no localStorage, sem backup. | Risco de perder tudo. | ✅ | `9253c45`, `c9f3849`: IndexedDB + exportar/importar |
| BUG-14 | Telas misturavam inglês e português. | Inconsistência. | ✅ | Interface toda em pt-BR |
| BUG-15 | O rótulo do mês aparecia como "Outubro De 2026". | Estética. | ✅ | `ebb23fc` |
| BUG-16 | O eixo do histórico arredondava 1.500 para "2k". | Leitura enganosa. | ✅ | `ebb23fc`: mostra "1,5k" |
| BUG-17 | Em "Apagar todos os dados", o primeiro diálogo voltava ao início depois de "Continuar". | Impossível apagar. | ✅ | `c9f3849` |

## MVP 1.0.0 (entregue)

- ✅ App instalável no iPhone (PWA), em tela cheia, funcionando offline.
- ✅ Gastos variáveis: cadastro em painel, validação, agrupamento por dia.
- ✅ Gastos fixos: pagamento por mês com valor ajustável, parcelas, encerrar sem perder histórico e calendário.
- ✅ Renda em entradas fixas (salário) e avulsas (freela).
- ✅ Início: renda, gastos, saldo, **pizza por categoria com % que somam 100%**, filtro Todos/Fixos/Variáveis e histórico de 6 meses.
- ✅ Metas com dica baseada nos seus gastos; Lista de Compras com "registrar como gasto".
- ✅ Backup: exportar para Arquivos/iCloud, importar com validação e resumo, lembrete após 30 dias.
- ✅ Categorias personalizadas com cor; apagar todos os dados com confirmação dupla.
- ✅ Migração automática dos dados da versão anterior.
- ✅ Barra inferior + menu lateral, áreas seguras do iPhone, teclado numérico nos valores.
- ✅ Testes automáticos (Vitest), lint e deploy automático no GitHub Pages.

## Depois do MVP

| ID | Ideia | Por quê |
|---|---|---|
| 💡 IDEA-01 | Sincronização entre aparelhos (conta opcional, ex.: Supabase) | Hoje os dados ficam em um aparelho só. |
| 💡 IDEA-02 | Modo escuro | Conforto à noite; o iOS já tem a preferência. |
| 💡 IDEA-03 | Lembretes de vencimento via Web Push (iOS 16.4+) | Exige servidor de push. |
| 💡 IDEA-04 | Exportar CSV para planilhas | Análises fora do app. |
| 💡 IDEA-05 | Bloqueio com Face ID (WebAuthn) | Privacidade se emprestar o celular. |
| 💡 IDEA-06 | Orçamento por categoria com alerta | Controle de limites (ex.: Lazer até R$ 400). |
| 💡 IDEA-07 | Busca e filtro nos gastos | Achar lançamentos antigos. |
| 💡 IDEA-08 | Testes em Android e desktop | Hoje o foco é só o iPhone. |
