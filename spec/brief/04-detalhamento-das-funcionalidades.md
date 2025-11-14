# 4. Detalhamento das Funcionalidades

Este documento fornece uma descrição completa e detalhada de cada módulo (feature) do Painel Administrativo "Delicias da Dri". Ele serve como guia para o desenvolvimento da interface do usuário (UI) e da lógica de negócios associada a cada tela da aplicação.

---

### 4.1 Módulo: Dashboard (`features/Dashboard`)

É a tela principal após o login, projetada para fornecer ao **Administrador** uma visão geral e estratégica da saúde do negócio em um piscar de olhos. Acesso restrito ao papel `admin`.

**Interface e Componentes:**

*   **Filtro de Período:** Um seletor (`select`) no topo da página permite ao usuário alternar a visualização dos dados entre "Últimos 30 dias", "Este Mês", "Este Ano" e "Desde o Início".
*   **Cards de KPIs (Indicadores-Chave):** Uma linha de 3 a 4 cards de destaque exibindo métricas principais para o período selecionado:
    *   **Receita Total:** Soma dos `total_amount` de todos os `orders` com status "Entregue".
    *   **Pedidos Finalizados:** Contagem total de `orders` com status "Entregue".
    *   **Orçamentos Aprovados:** Contagem total de `quotes` com status "Aprovado".
    *   **Novos Clientes:** Contagem de `clients` cadastrados no período.
*   **Gráfico de Vendas ao Longo do Tempo:** Um gráfico de barras (usando uma biblioteca como Recharts) mostrando a evolução da receita por semana ou por mês, dependendo do período selecionado.
*   **Tabela de Pedidos Recentes:** Uma tabela concisa exibindo os 5 últimos pedidos, com colunas para ID do Pedido, Nome do Cliente, Data de Entrega, Valor Total e Status. Cada linha pode ser clicável para navegar diretamente ao detalhe daquele pedido.
*   **Ranking de Produtos Mais Vendidos:** Uma lista ou gráfico de pizza que mostra os produtos (`quote_items`) mais populares (em quantidade ou valor) no período, ajudando a identificar os itens de maior sucesso.

---

### 4.2 Módulo: Orçamentos (`features/Quotes`)

Esta é a ferramenta comercial central para criar, gerenciar e acompanhar propostas para clientes. Acesso principal para o papel `admin`.

**Telas e Fluxo:**

1.  **Tela de Listagem:**
    *   Uma tabela principal exibe todos os orçamentos, com colunas para: ID, Nome do Cliente, Data do Evento, Valor Total e Status (`Pendente`, `Aprovado`, `Recusado`).
    *   **Funcionalidades:** Busca por nome do cliente ou ID, e filtros por status.
    *   Um botão de "Novo Orçamento" proeminente que leva ao formulário de criação.
    *   Ações por linha: Editar, Visualizar PDF, e um menu para "Criar Pedido" (se o status for "Aprovado").

2.  **Tela de Criação/Edição:** Um formulário abrangente dividido em seções:
    *   **Dados do Cliente:** Um campo de busca que pesquisa na tabela `clients`. Se o cliente não for encontrado, um botão permite cadastrá-lo rapidamente em um modal.
    *   **Informações do Evento:** Campos para data, tipo de evento e observações gerais.
    *   **Montagem do Menu (Itens):**
        *   Uma seção interativa onde o administrador pode buscar e adicionar produtos da tabela `products` (onde `product_type` = "PRODUTO_MENU").
        *   Ao adicionar um item, ele especifica a quantidade. O sistema busca o `price` do produto e calcula o subtotal da linha.
    *   **Montador de Bolos (Feature Especial):** Uma aba ou seção dedicada que renderiza o formulário interativo de personalização de bolo.
        *   Busca componentes da tabela `products` (onde `product_type` = "COMPONENTE_BOLO"), agrupados por `component_category` (tamanho, recheio, etc.).
        *   À medida que as seleções são feitas, o preço total do bolo é calculado e exibido em tempo real.
        *   Ao final, o "Bolo Personalizado" é adicionado como um item especial na lista do orçamento.
    *   **Resumo e Totalização:** Um painel lateral ou inferior exibe o valor total do orçamento sendo atualizado em tempo real.
    *   **Ações:** "Salvar Rascunho", "Finalizar e Salvar".

---

### 4.3 Módulo: Pedidos (`features/Orders`)

Centraliza o fluxo de produção. Visível para `admin`, `kitchen` e `delivery`, mas com ações e visualizações diferentes por papel.

**Interface e Fluxo:**

*   **Visão em Kanban ou Tabela:** A tela exibe os pedidos, preferencialmente em colunas no estilo Kanban representando cada `status` ("Aprovado", "Em Produção", "Pronto para Entrega", etc.). Isso proporciona uma visão clara do pipeline de produção. Uma visualização de tabela tradicional também deve ser uma opção.
*   **Filtragem e Busca:** Capacidade de buscar por ID ou nome do cliente e filtrar por data de entrega.
*   **Card de Pedido:** Cada pedido é representado por um card que mostra as informações essenciais: ID, nome do cliente, data e hora da entrega, e uma prévia dos itens.
*   **Modal de Detalhes:** Clicar em um card abre um modal com todos os detalhes:
    *   Informações completas do cliente e da entrega.
    *   Lista detalhada de todos os itens do pedido (cópia dos `quote_items`).
    *   Histórico de mudanças de status.
*   **Lógica de Mudança de Status:** Dentro do modal, um dropdown permite a mudança de status. As opções disponíveis no dropdown dependem do `role` do usuário logado e do status atual, seguindo a lógica de negócio:
    *   **Admin:** Pode alterar para qualquer status, a qualquer momento.
    *   **Kitchen:** Só pode ver pedidos em "Aprovado" ou "Em Produção". Só pode alterar de "Aprovado" -> "Em Produção" e de "Em Produção" -> "Pronto para Entrega".
    *   **Delivery:** Só pode ver pedidos em "Pronto para Entrega" ou "Em Entrega". Só pode alterar de "Pronto para Entrega" -> "Em Entrega" e de "Em Entrega" -> "Entregue".

---

### 4.4 Módulo: Catálogo de Produtos (`features/Products`)

Gerencia todos os itens vendáveis, incluindo tanto os produtos de menu quanto os componentes de bolo. Acesso de escrita restrito ao `admin`.

**Interface e Fluxo:**

*   **Visão Geral:** Uma tela que lista todos os itens da tabela `products` em um layout de grid de cards ou tabela.
*   **Filtros:** Filtros por `product_type` ("PRODUTO_MENU", "COMPONENTE_BOLO") e, para componentes, por `component_category`.
*   **Formulário de Criação/Edição (em Modal):**
    *   Campos para `name`, `description`, `price` e `unit_type`.
    *   Um componente para upload de imagem, que enviará o arquivo para o Supabase Storage e salvará a `image_url` no banco.
    *   Um seletor para `product_type`. Se "COMPONENTE_BOLO" for selecionado, um campo adicional para `component_category` aparece.
    *   Um checkbox (`toggle`) para `is_public`, controlando a visibilidade na vitrine.
*   **Lógica de Exclusão:** Deve haver um aviso de confirmação antes de deletar um produto. A exclusão de um produto não deve afetar orçamentos e pedidos antigos que já o utilizaram (graças à cópia dos dados em `quote_items` e `orders`).

---

### 4.5 Módulos Adicionais (Mais Simples)

#### **Clientes (CRM) (`features/Crm`)**
*   **Função:** Gerenciar a tabela `clients`.
*   **Interface:** Uma tabela simples com busca, exibindo nome, telefone e e-mail. Um modal para adicionar/editar clientes.

#### **Receitas (`features/Recipes`)**
*   **Função:** Gerenciar a tabela `recipes` (se implementada na fase 1).
*   **Interface:** Um layout de cards mostrando o nome e foto da receita. Clicar abre um modal com o detalhe completo (ingredientes e modo de preparo). Um formulário (em modal ou página dedicada) para criar/editar receitas.

#### **Dispensa (`features/Pantry`)**
*   **Função:** Gerenciar a tabela `pantry_items`.
*   **Interface:** Tabela com busca, mostrando item, quantidade em estoque e nível mínimo de reposição, com destaque visual para itens que precisam de compra. Um modal para adicionar/editar itens e um botão rápido para ajustar a quantidade em estoque.