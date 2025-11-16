## Visão geral

O módulo de orçamentos já consegue criar propostas completas, porém depois do envio inicial não há como revisar ou ajustar valores, tampouco uma maneira segura de compartilhar esse conteúdo com o cliente. Vamos evoluir o fluxo para que o orçamentista edite qualquer orçamento, gere um link público somente-leitura com visualização elegante, permita aprovação direta pelo cliente e ofereça botões para WhatsApp e PDF. O foco continua sendo React + Supabase, mantendo a arquitetura atual do app, mas adicionando uma rota pública desacoplada do `AuthProvider`.

### Problemas atuais

- Orçamentos criados ficam “congelados”, obrigando a refazer tudo para corrigir erros ou atualizar preços.
- A visualização disponível em `BudgetsPage` é uma modal interna nada amigável para o cliente final.
- Não há mecanismo de compartilhamento externo; o cliente não consegue aprovar sozinho e o time precisa explicar preços por chat.
- O app não exporta PDF e não há botão rápido de envio para WhatsApp.

### Objetivos

1. Permitir edição completa de um orçamento existente (cliente, itens, observações) mantendo histórico básico de atualização.
2. Criar uma visualização “preview” com aparência de documento, tanto para uso interno quanto para um link público protegido por token.
3. Inserir botões de compartilhamento (WhatsApp, copiar link) e exportação em PDF.
4. Implementar aprovação via link público que altera o status da proposta para `Aprovado` automaticamente e registra data/hora.
5. Garantir que o cliente não tenha acesso a nenhuma outra parte do app ao usar o link.

## Arquitetura proposta

### 1. Modelagem e Supabase

- **Novas colunas em `quotes`:**
  - `updated_at timestamptz default now()` – para facilitar ordenação por últimas edições.
  - `approved_at timestamptz` – salva quando o status vira `Aprovado` (via painel ou link público).
  - `public_link_token uuid` – token único ativo para compartilhamento.
  - `public_link_token_expires_at timestamptz` – opcional, para invalidar o link.
  - `public_link_last_viewed_at timestamptz` – telemetria simples.
- **Função segura para preview público:** `get_quote_public_preview(token uuid)` retorna orçamento, cliente e itens. Rodará como `security definer`, `select` direto nas tabelas mesmo quando o cliente estiver anônimo.
- **Função para aprovar via link:** `approve_quote_via_token(token uuid)` atualiza status/`approved_at` somente quando o token estiver válido.
- **Políticas:** liberar `select`/`rpc` dessas funções para `anon`, mantendo RLS restrita nas tabelas.

### 2. Reuso do formulário de orçamento

- Transformar `CreateBudgetPage` em um wrapper de um novo componente `BudgetForm` responsável por:
  - receber `mode: 'create' | 'edit'`.
  - carregar dados com `fetchQuoteDetails` quando em modo edição.
  - sincronizar itens via `react-hook-form` reaproveitando o schema existente.
- Novos serviços em `quotesService.ts`:
  - `updateQuoteWithItems(quoteId, payload, items)` – atualiza o registro da tabela `quotes`, remove/atualiza `quote_items` com transação.
  - `regenerateQuotePublicLink(quoteId, expiresAt?)` – cria token UUID e salva campos.
  - `getQuotePublicPreview(token)` + `approveQuoteViaToken(token)` para o modo público.
- Inserir no `BudgetsPage.tsx` botões “Editar orçamento” e “Compartilhar” dentro do drawer/modal de detalhes. Ao clicar em editar, o usuário vai para o mesmo fluxo do formulário, carregando o orçamento escolhido e permitindo salvar em qualquer status.

### 3. Tela de preview (interna e pública)

- Criar o componente `QuotePreview` contendo:
  - identidade visual similar a um documento (logo no topo esquerdo, bloco com dados do cliente/evento, tabela de itens com subtotais, bloco de observações).
  - CTA’s: `Baixar PDF`, `Compartilhar`, `Enviar WhatsApp` (no contexto interno) e `Aprovar orçamento` (no público).
- **Rota interna:** nova aba dentro de `BudgetsPage` (drawer com abas “Resumo” e “Preview”) usando `QuotePreview` para que o time valide antes de enviar.
- **Rota pública:** alterar `src/main.tsx` para inspecionar `window.location.pathname`. Se iniciar com `/orcamento/preview/:token`, renderizamos `<PublicQuotePreviewApp>` fora do `AuthProvider`. Essa página:
  - chama `getQuotePublicPreview(token)` com um loading elegante.
  - mantém estado de aprovação, exibindo toasts em caso de token inválido/expirado.
  - possui botão “Fale pelo WhatsApp” com mensagem padrão e telefone do cliente.
  - restringe ações a `approve` e `download pdf`, sem mostrar menus do app principal.

### 4. Aprovação e rastreabilidade

- Ao clicar em “Aprovar orçamento”:
  - **Painel interno:** usa `updateQuoteStatus` (já existente) + grava `approved_at`.
  - **Link público:** chama `approveQuoteViaToken`, que confirma token válido, atualiza status/`approved_at`, grava `public_link_last_viewed_at` e retorna payload atualizado para refletir imediatamente.
- Em ambos os casos, o status passa para `Aprovado`, o preview mostra um selo informando que o orçamento já foi aprovado e o botão é substituído por “Status: Aprovado”.

### 5. Compartilhamento (WhatsApp + link)

- No painel interno, adicionar dropdown `Compartilhar` com:
  - `Copiar link` – chama `regenerateQuotePublicLink` se ainda não existir token e copia `https://app.deliciasdAdri.com/orcamento/preview/${token}`.
  - `Enviar por WhatsApp` – abre `https://wa.me/55{client.phone}?text=${encodeURIComponent(msg)}` contendo saudação + URL.
- Armazenar `public_link_last_viewed_at` para identificar links nunca abertos e permitir expirar/regenerar manualmente.

### 6. Exportação em PDF

- Usar `@react-pdf/renderer` para criar `BudgetPdfDocument`, componente independente do preview HTML.
  - Reaproveita os dados já carregados pelo preview.
  - Insere logo (mesmo arquivo exibido na sidebar) e estilização com as cores do tema.
  - Botão “Baixar PDF” chama `pdf(<BudgetPdfDocument ... />).toBlob()` e dispara download.
- No público, o botão chama a mesma lógica; no painel interno podemos oferecer também “Imprimir” (usa `window.print()` no layout do preview).

### 7. Observabilidade e testes

- Adicionar telemetry leve em Supabase (`public_link_last_viewed_at`, `approved_at`).
- No front, criar testes de Storybook/Playwright para:
  - abrir o preview com dados mock (`QuotePreview.stories.tsx`).
  - fluxo público: utilizar Playwright para navegar até `/orcamento/preview/:token` (mockando RPC) e clicar em “Aprovar”.
  - regressões do formulário em modo edição (preencher, remover item, salvar).

## Fluxos detalhados

### Fluxo interno (admin/orçamentista)

1. Usuário acessa `BudgetsPage`, abre um orçamento e clica em “Editar”.
2. `BudgetForm` carrega dados via `fetchQuoteDetails`, popula o formulário e permite alterações de qualquer campo/status.
3. Ao salvar, `updateQuoteWithItems` valida e atualiza `quotes`/`quote_items`, recalcula total e grava `updated_at`.
4. Ao clicar em “Compartilhar”, se não houver token válido chamamos `regenerateQuotePublicLink`. Mostramos modal com URL, botão de cópia, botão “Enviar no WhatsApp” e opção de definir expiração.
5. Botão “Preview” abre `QuotePreview` com os dados finais e permite baixar PDF ou iniciar o envio.

### Fluxo do cliente (link público)

1. Cliente recebe URL `https://app.deliciasdAdri.com/orcamento/preview/<token>`.
2. PublicApp busca dados via `get_quote_public_preview`.
3. Cliente visualiza o documento, pode baixar PDF ou enviar dúvidas via WhatsApp usando o telefone já inserido no orçamento.
4. Se clicar em “Aprovar orçamento”, chamamos `approveQuoteViaToken`. Em caso de sucesso, mostramos confirmação, travamos novas aprovações e informamos que o time será notificado (internamente via toast + `updated_at`).

## Impacto nos arquivos principais

- `src/features/BudgetsPage.tsx`: novo botão de edição, drawer de preview, dropdown de compartilhamento.
- `src/features/CreateBudgetPage.tsx`: extrair `BudgetForm` reutilizável com suporte a edição, precarga e atualização otimista.
- `src/features/PublicQuotePreview.tsx` (novo): roteamento independente para link público, chama RPCs específicos.
- `src/services/quotesService.ts`: adicionar funções de update, geração de token, RPC públicas e helpers para WhatsApp/PDF.
- `src/main.tsx`: roteamento condicional para separar aplicação autenticada do fluxo público.
- Componentes utilitários (`QuotePreview`, `ShareQuoteDialog`, `BudgetPdfDocument`) com Styled components/Tailwind.

## Dependências sugeridas

- `@react-pdf/renderer` para geração de PDF.
- `uuid` (ou `crypto.randomUUID`) para tokens no front; token definitivo será salvo no banco via Supabase.
- Nenhuma outra dependência obrigatória; aproveitamos libs já existentes (Radix Dialog, Sonner, RHF, etc.).

## Métricas de sucesso

- 100% dos orçamentos podem ser atualizados sem refazer o cadastro (zero recriações).
- Tempo médio para envio/compartilhamento reduzido (botões dedicados).
- Pelo menos 80% dos clientes aprovam via link público (monitorado por `approved_at`).
- Não há acessos inválidos ao app principal a partir do link (verifica-se pelo fato de o público nunca carregar `AppLayout`).
