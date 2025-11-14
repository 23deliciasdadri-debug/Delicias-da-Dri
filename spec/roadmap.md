# Roadmap de Melhoria — Delícias da Dri v2

Checklist macro para atacar os pontos levantados (encoding, arquitetura, UI/UX e features). Cada fase prepara a próxima, mas pode ser trabalhada em paralelo caso equipes diferentes estejam envolvidas.

---

## Fase A — Fundamentos & Qualidade
- [ ] Normalizar encoding em todos os arquivos (`spec/`, `src/`, configs) para UTF-8 e registrar regra em `.editorconfig`.
- [ ] Revisar `spec/schema_sql.md` habilitando RLS explicitamente nas tabelas mencionadas e limpando caracteres corrompidos.
- [ ] Documentar playbook de policies (quem roda, como validar) dentro de `spec/schema_sql.md` e `README.md`.
- [ ] Automatizar lint/typecheck/build no CI local (`npm run lint && npm run typecheck && npm run build`) antes de qualquer merge.

## Fase B — Arquitetura de Rotas & Layout
- [ ] Introduzir React Router (ou equivalente) com rotas privadas por papel, evitando o `useState` global em `App.tsx`.
- [ ] Criar `MainLayout` que compõe `Sidebar`, `Header` responsivo e `PageContainer`, alinhado ao guideline do UI Kit.
- [ ] Implementar `PageHeader` reutilizável (título, descrição, ações) e remover duplicação de hero sections das páginas.
- [ ] Garantir suporte a deep-links (ex.: `/orders`, `/budgets/:id`) e histórico para facilitar QA e handoff.

## Fase C — Design System & Tokens
- [ ] Centralizar tokens (cores, gradientes, espaçamentos, radius) em um módulo TS/JSON consumido por Tailwind e componentes.
- [ ] Expandir componentes base (`Button`, `Badge`, `Card`, `Alert`, `Dialog`) com variantes documentadas para estados comuns.
- [ ] Criar componentes auxiliares (`StatsCard`, `Section`, `EmptyState`, `ConfirmDialog`) para eliminar CSS inline nas features.
- [ ] Atualizar `styles/index.css` e documentação do UI Kit descrevendo como aplicar os tokens nas novas páginas.

## Fase D — Formulários & UX de Dados
- [ ] Adotar `react-hook-form` + `zod` (ou outra lib de schema) para Produtos, Clientes, Orçamentos e Login.
- [ ] Criar inputs especializados (`CurrencyInput`, `PhoneInput`, `AsyncCombobox`) com validação e máscaras.
- [ ] Substituir `window.confirm` por dialogs acessíveis e consistentes em todas as ações destrutivas.
- [ ] Implementar loaders/skeletons padrão, feedback de erro contextual e retry em todos os formulários.

## Fase E — Features Modulares
- [ ] **Products:** extrair `ProductFilters`, `ProductCard`, `ProductModal`; aplicar paginação server-side real e toasts padronizadas.
- [ ] **Clients:** dividir em `ClientList`, `ClientFormDrawer`; adicionar seleção paginada ao fluxo de orçamentos.
- [ ] **Budgets:** separar listagem (`QuoteList`) de detalhes (`QuoteDetailsDrawer`), incluir logs/status timeline e geração de pedido.
- [ ] **Orders:** implementar `KanbanBoard`, `OrderCard` e `OrderDialog` com regras de transição isoladas por hook (`useOrderTransitions`).
- [ ] Registrar testes básicos (RTL) para fluxos críticos de cada feature.

## Fase F — Dashboard & Observabilidade
- [ ] Reescrever `DashboardPage` com componentes (`StatsGrid`, `RevenueTrend`, `RecentOrders`) e dados vindos de hooks cacheados.
- [ ] Adicionar cancelamento / polling configurável usando React Query (ou estender hooks atuais com abort controller).
- [ ] Expor métricas adicionais (conversão de orçamentos, produtos mais vendidos) e preparar endpoints no Supabase (RPC/views).
- [ ] Criar sistema de toasts/logs centralizado (ex.: `useAppNotifications`) para registrar erros de rede/RLS.

## Fase G — Handoff & Medição
- [ ] Atualizar `spec/brief` e `README` com screenshots da nova UI, fluxos de auth/roles e instruções de testes.
- [ ] Publicar changelog por fase e abrir tarefas em `spec/tasks.md` conforme os checkboxes forem concluídos.
- [ ] Validar manualmente o fluxo completo (produto → cliente → orçamento → pedido → dashboard) antes de encerrar cada fase.

---

### Critérios de saídas
- Cada fase só é considerada concluída quando todos os itens marcados estiverem revisados em PR e os testes (`lint`, `typecheck`, `build`) executados.
- O roadmap é vivo: ao finalizar uma fase, revisitar as próximas e detalhar sub-tarefas específicas no `spec/tasks.md`.
