# 7. Fluxos de Usuário Chave

Este documento descreve os fluxos de trabalho mais críticos da aplicação "Delicias da Dri - Painel Administrativo". O mapeamento passo a passo dessas jornadas de usuário serve como um guia para o desenvolvimento, garantindo que a interação entre a interface (UI), a lógica de negócio (frontend) e o banco de dados (Supabase) seja çõesa, eficiente e livre de erros.

---

## 7.1 Fluxo: "Gestão do Ciclo de Vida de um Pedido"

Este é o fluxo operacional mais importante da plataforma. Ele envolve múltiplos papéis (Cliente, Admin, Cozinha, Entregador) e transita por vários estados.

**Atores:** Administrador, Equipe de Cozinha, Equipe de Entrega.

**Gatilho:** Um novo registro é criado na tabela `orders` (seja a partir da Vitrine Pública ou manualmente pelo Admin). O estado inicial é **"Aprovado"**.

**Passos:**

1.  **Revisão (Admin):**
    *   **Contexto:** O `Administrador` acessa a página de **Pedidos**.
    *   **UI:** O novo pedido aparece na coluna "Aprovado" do Kanban ou no topo da tabela de pedidos.
    *   **Ação:** O `Administrador` clica no pedido para abrir o modal de detalhes, revisa todos os itens, a data e o endereço de entrega para garantir que todas as informações estão corretas e que a produção pode ser iniciada. Se necessário, ele pode entrar em contato com o cliente para ajustes antes de prosseguir.
    *   **Estado:** O pedido permanece em "Aprovado".

2.  **Início da Produção (Cozinha):**
    *   **Contexto:** Um usuário com o papel `kitchen` está logado e acessa a página de **Pedidos**.
    *   **UI (Restrita):** Ele vê apenas os pedidos nas colunas "Aprovado" e "Em Produção".
    *   **Ação:** Ao decidir iniciar o trabalho em um pedido da coluna "Aprovado", o usuário clica no pedido, abre o modal, e altera o status no seletor para "Em Produção". Ele pode também consultar as `Receitas` associadas aos produtos em uma tela separada.
    *   **Sistema:** O frontend envia uma requisição `UPDATE` para a tabela `orders`, alterando o campo `status`. A política de RLS do Supabase valida que o usuário `kitchen` tem permissão para fazer essa transição específica. O card do pedido move-se para a coluna "Em Produção".

3.  **Finalização da Produção (Cozinha):**
    *   **Contexto:** A equipe da `kitchen` finaliza a preparação de todos os itens do pedido.
    *   **Ação:** O usuário `kitchen` encontra o pedido correspondente na coluna "Em Produção", abre o modal, e atualiza o status para "Pronto para Entrega".
    *   **Sistema:** Requisição `UPDATE` é enviada e validada pelo RLS. O card do pedido move-se para a coluna "Pronto para Entrega", sinalizando que o pedido está pronto para a fase de logística.

4.  **Início da Entrega (Entregador):**
    *   **Contexto:** Um usuário com o papel `delivery` acessa a aplicação.
    *   **UI (Super Restrita):** Ele vê uma lista ou Kanban simplificado com os pedidos nas colunas "Pronto para Entrega" e "Em Entrega".
    *   **Ação:** Ao coletar um pedido para iniciar a rota de entrega, o `Entregador` localiza o pedido, abre o modal de detalhes (que mostra principalmente informações de endereço e contato), e atualiza o status para "Em Entrega".
    *   **Sistema:** O card do pedido move-se para a coluna "Em Entrega", informando a todos os outros usuários (principalmente o Admin) que o produto já não está mais na loja.

5.  **Confirmação de Entrega (Entregador):**
    *   **Contexto:** O `Entregador` chega ao destino e finaliza a entrega ao cliente.
    *   **Ação:** Utilizando um dispositivo móvel, ele acessa a aplicação, encontra o pedido na coluna "Em Entrega" e o marca como "Entregue".
    *   **Sistema:** A transição final é realizada. O card move-se para a coluna "Entregue". Esta ação é o gatilho para que o valor deste pedido seja considerado como "Receita Faturada" nos cálculos do Dashboard.

---

## 7.2 Fluxo: "Criação de um Bolo Personalizado via Orçamento"

Este fluxo detalha como a funcionalidade de destaque, o Montador de Bolos, é utilizada pelo Administrador para criar uma proposta comercial.

**Ator:** Administrador.

**Gatilho:** O `Administrador` inicia a criação de um "Novo Orçamento".

**Passos:**

1.  **Seleção de Cliente e Dados do Evento:**
    *   O `Administrador` preenche os dados iniciais do orçamento (cliente, data do evento, etc.), conforme o fluxo padrão de criação de orçamentos.

2.  **Acesso ao Montador de Bolos:**
    *   **UI:** Dentro do formulário de orçamento, existe uma seção ou botão "Adicionar Bolo Personalizado".
    *   **Ação:** Ao clicar, um modal ou uma seção dedicada é aberta, apresentando a interface do Montador de Bolos.

3.  **Seleção dos Componentes:**
    *   **UI:** A interface exibe seções agrupadas por `component_category` (Tamanho, Massa, Recheios, Cobertura, Adereços). Cada seção contém opções que são carregadas da tabela `products` (filtrando por `product_type = 'COMPONENTE_BOLO'`).
    *   **Ação:** O `Administrador` seleciona as opções desejadas. Por exemplo:
        *   Seleciona o tamanho "Bolo Redondo 20cm". O preço base deste componente é registrado.
        *   Seleciona dois recheios (ex: "Brigadeiro Gourmet" e "Ninho Trufado"). A soma dos preços destes dois componentes é adicionada.
        *   Seleciona uma cobertura. O preço é adicionado.
    *   **Sistema (Frontend):** O estado local do React acompanha as seleções e soma os preços em tempo real, exibindo um subtotal para o bolo. A representação visual do bolo é atualizada a cada seleção.

4.  **Adicionar ao Orçamento:**
    *   **Ação:** Após finalizar a personalização, o `Administrador` clica no botão "Adicionar Bolo ao Orçamento".
    *   **Sistema:**
        *   O bolo personalizado é consolidado como um único `quote_item` especial.
        *   O campo `product_name_copy` deste item é preenchido com uma descrição consolidada (ex: "Bolo Personalizado - 20cm, Brigadeiro/Ninho, Chantininho").
        *   O campo `price_at_creation` é preenchido com o subtotal calculado.
        *   O `quantity` é 1.
    *   **UI:** O bolo agora aparece como uma linha no resumo do orçamento, junto com outros produtos que possam ter sido adicionados.

5.  **Finalização e Envio do Orçamento:**
    *   O fluxo continua com a finalização e salvamento padrão do orçamento. Quando o orçamento for convertido em PDF para envio, o bolo personalizado aparecerá com sua descrição detalhada e preço, de forma transparente para o cliente.