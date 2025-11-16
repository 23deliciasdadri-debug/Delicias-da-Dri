## Visão geral

O produto já atende o fluxo básico de orçamentos/pedidos, porém a experiência do operador e do cliente está inconsistente: tema único, navegação rígida, telas com scroll quebrado, modais transparentes, filtros ocupando espaço e impedimentos para excluir/automatizar registros. Vamos focar em três pilares — experiência visual (tema, sidebar, filtros), estabilidade estrutural (modais, kanban, responsividade) e automações (edição inline, criação de pedidos a partir de orçamentos) — mantendo a stack atual (React + Vite + Supabase) e entregando melhorias incrementais.

## Problemas atuais

1. **UX limitada**: não existe modo escuro, o favicon ainda é genérico e a sidebar ocupa muito espaço, especialmente no desktop.
2. **Layout inconsistente**: o menu de pedidos tem largura menor, o kanban faz a página inteira rolar (quebrando mobile) e modais abrem transparentes.
3. **Fluxos truncados**: filtros e buscas ocupam área fixa em todas as páginas; o menu lateral cresce demais e empurra o botão de logout.
4. **Pedidos e orçamentos**: não há CTA para criar/excluir pedidos direto nas colunas, o status dos orçamentos só muda via menu, e alguns dados “seed” não podem ser removidos.
5. **Integração**: quando um orçamento é aprovado, o pedido correspondente não é criado automaticamente.

## Objetivos

1. Entregar modo claro/escuro com toggle persistente e atualizar o branding (favicon + ícones).  
2. Unificar a navegação lateral: colapsável em desktop, com scroll interno, logout fixo e filtros compactados em popover.  
3. Revisar o `OrdersPage`: kanban responsivo com scroll local, botões de criação nos rodapés das colunas e exclusão direta nos cards.  
4. Corrigir o sistema de modais para garantir overlay e fundo opacos em qualquer cenário.  
5. Transformar o status dos orçamentos em um seletor inline e bloquear edições/deleções quando o orçamento estiver aprovado.  
6. Automatizar a criação de pedidos ao aprovar orçamentos (via painel ou link público).  
7. Limpar registros “seed” ou constraints que impedem exclusões legítimas e garantir comunicação clara de erros.  

## Arquitetura proposta

### 1. Tema e branding
- Adicionar um `ThemeProvider` (ou estender o existente) com persistência em `localStorage`.  
- Criar `ThemeToggle` exibido ao lado do avatar/ícone de admin e aplicar tokens `dark:` nas shells principais (`AppLayout`, `Sidebar`, modais).  
- Exportar o ícone de bolo já usado no painel como `favicon.svg`/`favicon.png` e atualizar `index.html` + manifest.

### 2. Sidebar colapsável
- Reestruturar o componente `Sidebar` usando `grid-rows: auto 1fr auto`, com o menu rolando separadamente do cabeçalho e do bloco de logout.  
- Adicionar botão de collapse que reduz para uma coluna estreita (apenas ícones + tooltip) tanto no desktop quanto no mobile drawer; preferência salva localmente.
- Ajustar `AppLayout` para responder à largura da sidebar com transição suave.

### 3. Filtros compactos
- Criar `FilterPopover`/`FilterSheet` acionado por um botão com ícone de lupa.  
- Migrar campos atuais (busca, status, datas) de `BudgetsPage`, `OrdersPage` e demais listas para dentro desse popover, preservando estado e validando no submit.

### 4. Modais e componentes Radix
- Revisar `src/components/ui/dialog.tsx` para garantir que `DialogContent` sempre possua `bg-popover` (ou `bg-white`), `shadow` e `border`.  
- Forçar `DialogPortal` a incluir `Overlay` opaco com blur leve e garantir `z-index` alto para evitar herança de transparência.

### 5. Orders (Kanban + ações)
- Ajustar o container principal para usar `overflow-hidden` e permitir que o kanban possua `max-height` calculado (viewport – header – filtros).  
- Cada coluna terá o botão “Adicionar pedido” no rodapé (abre modal).  
- Os cards exibem ícone de exclusão (`Trash2`), disparando confirmação e chamada a `deleteOrder`.  
- Garantir responsividade com scroll horizontal em telas menores.

### 6. Budgets (status e travas)
- A badge de status vira um `Select` inline; ao mudar para “Aprovado” registramos `approved_at`, mostramos feedback e bloqueamos futuras edições/deleções.  
- `QuotePreview` passa a exibir aviso verde quando aprovado e o drawer interno/menus de ação respeitam o bloqueio.

### 7. Automatização de pedidos
- Criar serviço `createOrderFromQuote` em `quotesService` (ou novo `ordersService`) que gera pedido + itens baseado nos dados do orçamento e cliente.  
- Integrar essa chamada após `updateQuoteStatus` (quando vira “Aprovado”) e dentro de `approve_quote_via_token`.  
- Garantir idempotência verificando `orders.quote_id`.

### 8. Limpeza de dados e exclusões
- Auditar scripts/seed para remover registros que não podem ser apagados.  
- Ajustar mensagens de erro quando o Supabase impedir exclusão (ex.: pedido vinculado), e liberar remoção quando não houver dependências.

### 9. Testes e QA
- Storybook para `QuotePreview` (estados pendente/aprovado) e novos componentes (`ThemeToggle`, `FilterPopover`, `OrderCard`).  
- Playwright cobrindo: modo dark toggle, collapse da sidebar, criação/exclusão de pedido na coluna, edição inline de status e aprovação pública (com criação automática de pedido).  
- Scripts manuais para validar resposividade no mobile e a troca de favicons.

## Impacto esperado
- **Desenvolvedores**: código mais modular (providers, components reutilizáveis, serviços para pedidos).  
- **Operação**: filtros compactos, status clicável e automação de pedidos reduzem passos manuais.  
- **Clientes**: layout mais estável (scroll/kanban) e tema dark melhoram a percepção de profissionalismo.  
- **Governança**: logs e feedbacks claros ao bloquear exclusões e ao criar pedidos automaticamente.
