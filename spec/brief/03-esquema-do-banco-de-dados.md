# 3. Esquema do Banco de Dados (Supabase/PostgreSQL)

Este documento detalha o esquema do banco de dados PostgreSQL que será gerenciado pelo Supabase. Ele serve como a única fonte da verdade para a estrutura de dados, relacionamentos e restrições da aplicação "Delicias da Dri - Painel Administrativo". A implementação correta deste esquema é fundamental para a integridade e segurança dos dados.

---

### Tabela 1: `profiles` (Perfis de Usuários)

Esta tabela estende a tabela `users` do sistema de autenticação do Supabase. Ela armazena os metadados públicos e a função de cada usuário do sistema.

-   **Relação:** Chave primária (`id`) é uma chave estrangeira que referencia `auth.users.id`.
-   **Propósito:** Associar uma função (papel) e informações adicionais a cada conta de usuário autenticada.

| Nome da Coluna  | Tipo de Dado        | Restrições e Descrição                                       |
| --------------- | ------------------- | ------------------------------------------------------------ |
| `id`            | `UUID`              | **Chave Primária**. Referencia `auth.users.id`. O valor é preenchido automaticamente na criação do usuário via trigger. |
| `full_name`     | `TEXT`              | Nome completo do funcionário. Não pode ser nulo.             |
| `email`         | `TEXT`              | E-mail do funcionário, usado para referência e contato. Único. |
| `avatar_url`    | `TEXT`              | URL para a imagem de perfil do usuário, armazenada no Supabase Storage. Opcional. |
| `role`          | `TEXT`              | **Coluna Crítica para Segurança**. Define o nível de permissão. Valores permitidos: `admin`, `kitchen`, `delivery`. O valor padrão deve ser `kitchen`. |
| `created_at`    | `TIMESTAMPTZ`       | Data e hora de criação do perfil. Valor padrão `now()`.      |
| `updated_at`    | `TIMESTAMPTZ`       | Data e hora da última atualização do perfil. Atualizado via trigger. |

---

### Tabela 2: `clients` (Clientes)

Armazena as informações de contato dos clientes da confeitaria (CRM).

| Nome da Coluna  | Tipo de Dado        | Restrições e Descrição                                       |
| --------------- | ------------------- | ------------------------------------------------------------ |
| `id`            | `UUID`              | **Chave Primária**. Gerada automaticamente (`gen_random_uuid()`). |
| `name`          | `TEXT`              | Nome completo do cliente. Não pode ser nulo.                 |
| `phone`         | `TEXT`              | Número de telefone (WhatsApp). Essencial para contato e para orçamentos. Não pode ser nulo. |
| `email`         | `TEXT`              | E-mail do cliente. Opcional.                                 |
| `created_at`    | `TIMESTAMPTZ`       | Data e hora de cadastro do cliente.                          |

---

### Tabela 3: `products` (Produtos Vendáveis)

Catálogo de todos os produtos que podem ser vendidos, tanto itens de menu padrão quanto componentes para bolos personalizados.

| Nome da Coluna        | Tipo de Dado        | Restrições e Descrição                                       |
| --------------------- | ------------------- | ------------------------------------------------------------ |
| `id`                  | `UUID`              | **Chave Primária**. Gerada automaticamente.                  |
| `name`                | `TEXT`              | Nome do produto (ex: "Bolo de Cenoura", "Recheio de Brigadeiro"). Não pode ser nulo. |
| `description`         | `TEXT`              | Descrição detalhada do produto. Opcional.                    |
| `image_url`           | `TEXT`              | URL para a imagem do produto.                                |
| `price`               | `NUMERIC(10, 2)`    | Preço do produto/componente. Não pode ser negativo.          |
| `unit_type`           | `TEXT`              | Unidade de medida (ex: "kg", "unidade", "cento"). Usado para produtos de cardápio. |
| `product_type`        | `TEXT`              | **Coluna Importante.** Define se é um "PRODUTO_MENU" (item vendável direto) ou um "COMPONENTE_BOLO". Não pode ser nulo. |
| `component_category`  | `TEXT`              | Se `product_type` for "COMPONENTE_BOLO", especifica a categoria (ex: "tamanho", "recheio", "cobertura"). |
| `is_public`           | `BOOLEAN`           | Controla se o produto ("PRODUTO_MENU") deve aparecer na vitrine pública. Valor padrão `true`. |
| `created_at`          | `TIMESTAMPTZ`       | Data e hora de criação do produto.                           |

---

### Tabela 4: `quotes` (Orçamentos)

Registra todas as propostas comerciais enviadas aos clientes.

| Nome da Coluna        | Tipo de Dado        | Restrições e Descrição                                       |
| --------------------- | ------------------- | ------------------------------------------------------------ |
| `id`                  | `UUID`              | **Chave Primária**. Gerada automaticamente.                  |
| `client_id`           | `UUID`              | **Chave Estrangeira** que referencia `clients(id)`. Não pode ser nulo. |
| `status`              | `TEXT`              | Status do orçamento: "Pendente", "Aprovado", "Recusado". Valor padrão "Pendente". |
| `event_type`          | `TEXT`              | Tipo de evento (ex: "Aniversário", "Casamento", "Corporativo"). Opcional. |
| `event_date`          | `DATE`              | Data do evento/entrega.                                      |
| `total_amount`        | `NUMERIC(10, 2)`    | Valor total do orçamento, calculado.                         |
| `notes`               | `TEXT`              | Observações e detalhes adicionais.                           |
| `created_at`          | `TIMESTAMPTZ`       | Data e hora de criação do orçamento.                         |

### Tabela 5: `quote_items` (Itens do Orçamento)

Tabela associativa que liga produtos a um orçamento específico, definindo a quantidade e o preço no momento da criação.

-   **Propósito:** Armazena o "menu" de um orçamento.

| Nome da Coluna      | Tipo de Dado        | Restrições e Descrição                                       |
| ------------------- | ------------------- | ------------------------------------------------------------ |
| `id`                | `BIGINT`            | **Chave Primária**. Gerada automaticamente.                  |
| `quote_id`          | `UUID`              | **Chave Estrangeira** que referencia `quotes(id)`. Não pode ser nulo. |
| `product_id`        | `UUID`              | **Chave Estrangeira** que referencia `products(id)`. Opcional, para permitir itens customizados. |
| `product_name_copy` | `TEXT`              | Uma cópia do nome do produto no momento em que o orçamento foi criado, para evitar que edições futuras no produto alterem o registro histórico. |
| `quantity`          | `INTEGER`           | Quantidade do item. Não pode ser nulo.                       |
| `price_at_creation` | `NUMERIC(10, 2)`    | Preço unitário do produto no momento da criação, para integridade histórica. |

---

### Tabela 6: `orders` (Pedidos)

Registra os pedidos que foram confirmados e entraram no fluxo de produção.

-   **Relação:** Um `Pedido` pode ser gerado a partir de um `Orçamento` aprovado.

| Nome da Coluna    | Tipo de Dado        | Restrições e Descrição                                       |
| ----------------- | ------------------- | ------------------------------------------------------------ |
| `id`              | `UUID`              | **Chave Primária**. Gerada automaticamente.                  |
| `client_id`       | `UUID`              | **Chave Estrangeira** que referencia `clients(id)`.          |
| `quote_id`        | `UUID`              | **Chave Estrangeira** que referencia `quotes(id)`. Opcional, caso o pedido seja criado diretamente. |
| `delivery_date`   | `DATE`              | Data de entrega agendada. Não pode ser nula.                 |
| `status`          | `TEXT`              | Status do fluxo de produção: "Aprovado", "Em Produção", "Pronto para Entrega", "Em Entrega", "Entregue", "Cancelado". Padrão "Aprovado". |
| `total_amount`    | `NUMERIC(10, 2)`    | Valor total do pedido.                                       |
| `delivery_details` | `TEXT`              | Endereço e instruções de entrega.                            |
| `created_at`      | `TIMESTAMPTZ`       | Data e hora de criação do pedido.                            |

---

### Outras Tabelas Potenciais (Não detalhadas aqui, mas a serem consideradas):

*   **`recipes` (Receitas):** Para armazenar as fichas técnicas.
*   **`pantry_items` (Itens da Dispensa):** Para controle de inventário.
*   **`recipe_ingredients` (Ingredientes da Receita):** Tabela associativa entre receitas e itens da dispensa.

Estes podem ser adicionados em uma segunda fase de desenvolvimento para focar o MVP nos módulos comerciais.