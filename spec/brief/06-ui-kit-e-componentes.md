# 6. UI Kit e Componentes

Este documento define a biblioteca de componentes de interface de usuário (UI) reutilizáveis para o Painel Administrativo "Delicias da Dri". O objetivo deste UI Kit é estabelecer uma identidade visual consistente, acelerar o desenvolvimento front-end e garantir que a experiência do usuário seja previsível e intuitiva em toda a aplicação. Todos os componentes serão construídos com React, TypeScript e estilizados com TailwindCSS.

A estrutura de arquivos seguirá o padrão `components/NOME_DO_COMPONENTE/NomeDoComponente.tsx`.

---

## 6.1 Filosofia de Design e Estilo

-   **Consistência:** Elementos comuns como botões, formulários e cards devem ter uma aparência e comportamento uniformes em todas as telas.
-   **Clareza e Simplicidade:** A interface deve ser limpa, priorizando a legibilidade e a facilidade de uso, evitando excesso de informações.
-   **Responsividade:** Todos os componentes devem ser projetados para funcionar perfeitamente em telas de desktop, tablets e dispositivos móveis.
-   **Estado Visual:** Componentes interativos devem fornecer feedback visual claro para os estados `hover`, `focus`, `active` e `disabled`.

## 6.2 Componentes de Layout (`components/layout/`)

Estes componentes formam a estrutura esquelética principal da aplicação.

#### **`MainLayout.tsx`**
-   **Propósito:** Orquestra a disposição do `Sidebar`, `Header` e o conteúdo da página principal.
-   **Estrutura:** Utiliza CSS Grid ou Flexbox para criar um layout de três colunas em telas de desktop, que se adapta para um layout de uma coluna com navegação móvel em telas menores.

#### **`Sidebar.tsx`**
-   **Propósito:** Menu de navegação principal, sempre visível em telas maiores.
-   **Funcionalidades:**
    -   Exibe o logotipo da "Delicias da Dri".
    -   Renderiza a lista de `NavItems` (itens de navegação) com ícones e labels.
    -   Destaca visualmente o link da página atualmente ativa.
    -   Suporta itens de navegação aninhados (submenus).
    -   Oculta-se automaticamente em telas pequenas.

#### **`Header.tsx`**
-   **Propósito:** Barra superior que fornece contexto e ações globais.
-   **Funcionalidades:**
    -   Em telas móveis, exibe um botão "hamburger" para alternar a visibilidade do menu de navegação móvel.
    -   Exibe o título da página atual.
    -   Contém um menu de perfil de usuário com opções para "Configurações" (se `admin`) e "Sair" (Logout).

## 6.3 Componentes de UI Genéricos (`components/ui/`)

Estes são os blocos de construção fundamentais da nossa interface.

#### **`Card.tsx`**
-   **Propósito:** Container visual padrão para agrupar conteúdo.
-   **Estilo:** Bordas arredondadas, sombra sutil (`box-shadow`), e fundo branco. Pode ter um cabeçalho opcional.
-   **Props:** `title?: string`, `children: React.ReactNode`, `className?: string`.

#### **`Modal.tsx`**
-   **Propósito:** Exibir conteúdo sobreposto para ações focadas, como formulários de criação/edição ou visualização de detalhes.
-   **Funcionalidades:**
    -   Cobre o fundo da tela com um overlay escurecido.
    -   Pode ser fechado clicando no "X", no botão "Cancelar" ou na tecla `Esc`.
    -   Apresenta uma animação de fade-in ao abrir.
-   **Props:** `isOpen: boolean`, `onClose: () => void`, `title: string`, `children: React.ReactNode`.

#### **`Button.tsx`**
-   **Propósito:** Botão padronizado para todas as ações.
-   **Variantes (via props):**
    -   `variant`: `primary` (para ações principais, com cor de destaque), `secondary` (para ações secundárias, com estilo de contorno), `danger` (para ações destrutivas, com cor vermelha).
    -   `size`: `sm`, `md`, `lg`.
    -   `isLoading`: `boolean` (mostra um spinner e desativa o botão durante operações assíncronas).
-   **Props:** `children`, `onClick`, `variant`, `size`, `isLoading`, `type`, etc.

#### **`Input.tsx`, `Textarea.tsx`, `Select.tsx`**
-   **Propósito:** Componentes de formulário padronizados e acessíveis.
-   **Funcionalidades:**
    -   Estilo consistente para todos os campos de entrada de texto e seleção.
    -   Associam um `<label>` ao campo de entrada para melhor acessibilidade.
    -   Exibem mensagens de erro de validação (passadas via props).
-   **Props:** Todas as props HTML padrão, mais `label: string`, `error?: string`.

#### **`Table.tsx`**
-   **Propósito:** Componente genérico para exibição de dados tabulares.
-   **Funcionalidades:**
    -   Renderiza um cabeçalho (`<thead>`) e o corpo da tabela (`<tbody>`) a partir de arrays de dados e configurações de colunas.
    -   Estilização consistente com linhas alternadas e estado de hover.
    -   Pode ser extensível para suportar ordenação e paginação.

#### **`Spinner.tsx`**
-   **Propósito:** Um indicador de carregamento animado (loading spinner).
-   **Uso:** Exibido sempre que a aplicação está buscando ou enviando dados para o Supabase, proporcionando feedback visual ao usuário de que uma operação está em andamento.

---

## 6.4 Componentes Específicos (`features/NOME_DA_FEATURE/components/`)

Quando um componente é reutilizável, mas apenas dentro de uma feature específica, ele deve residir dentro da pasta dessa feature.

-   **Exemplo:** `features/Dashboard/components/StatsCard.tsx`. Um card de KPI específico para o dashboard, que recebe um título, um valor e talvez um ícone.
-   **Exemplo:** `features/Orders/components/OrderCard.tsx`. O card que representa um único pedido na visualização Kanban, contendo a lógica específica para exibir dados de um pedido.

Essa estrutura mantém os componentes verdadeiramente globais em `components/ui`, enquanto encapsula a complexidade específica de cada feature em seu próprio diretório.