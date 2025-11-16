# 1. Visão Geral do Projeto: Delicias da Dri - Painel Administrativo

## 1.1 Propósito

Este documento descreve o "Painel Administrativo Delicias da Dri", uma aplicação de planejamento de recursos empresariais (ERP) sob medida, concebida para ser o centro de controle operacional e estratégico da confeitaria. O objetivo fundamental desta plataforma é equipar a equipe interna com ferramentas digitais robustas para gerenciar, otimizar e escalar todas as facetas do negócio de forma centralizada e eficiente.

A aplicação foi projetada para substituir processos manuais e fragmentados (planilhas, cadernos, mensagens) por um ecossistema digital çõeso e uma única fonte da verdade para todos os dados operacionais. Desde a gestão detalhada de receitas e controle de inventário até o ciclo de vida completo de um pedido e o relacionamento com o cliente, o sistema visa trazer clareza, padronização e profissionalismo à operação.

Construído sobre uma base tecnológica moderna, o painel está preparado para o crescimento, permitindo o acesso simultâneo de múltiplos funcionários com diferentes níveis de responsabilidade e estabelecendo as fundações para futuras expansões, como a integração com um aplicativo móvel.

## 1.2 Público-Alvo

A aplicação é de uso estritamente interno, projetada para atender às necessidades específicas de cada membro da equipe da "Delicias da Dri". O acesso à plataforma é controlado por autenticação e os níveis de permissão são definidos de acordo com as seguintes funções (papéis):

1.  **Administrador (Gestão):** O principal usuário do sistema, tipicamente a proprietária ou gerente do negócio. Este usuário possui acesso irrestrito a todas as funcionalidades. Suas responsabilidades incluem a análise de performance de vendas através do Dashboard, gestão financeira (orçamentos), controle de clientes (CRM), configuração do catálogo de produtos, gerenciamento de funcionários (criação de contas e atribuição de papéis) e a supervisão geral do fluxo de pedidos.

2.  **Equipe da Cozinha (Produção):** Usuários com o papel de "Cozinha". O foco deste perfil é a execução da produção. Eles terão uma visão limitada do sistema, focada nos módulos de **Pedidos** e **Receitas**. Seu fluxo de trabalho consiste em consultar as fichas técnicas das receitas e acompanhar a fila de pedidos aprovados, atualizando seus status de "Em Produção" para "Pronto para Entrega", sinalizando que um item está finalizado e pronto para a próxima etapa.

3.  **Equipe de Entrega (Logística):** Usuários com o papel de "Entregador". Este perfil possui a visão mais restrita do sistema, focada exclusivamente na logística da última milha. Terão acesso a uma interface simplificada do módulo de **Pedidos**, visualizando apenas os pedidos com status "Pronto para Entrega" ou "Em Entrega". A interface exibirá informações cruciais para a tarefa: nome e contato do cliente, endereço de entrega e detalhes do pedido. Sua principal interação é atualizar o status do pedido para "Entregue", finalizando o ciclo de vida daquele pedido no sistema.

## 1.3 Problemas Solucionados e Valor Agregado

O Painel Administrativo foi projetado para resolver desafios operacionais críticos e agregar valor estratégico ao negócio:

*   **Centralização da Informação:** Elimina a dispersão de dados e o risco de inconsistências ao consolidar pedidos, informações de clientes, receitas e produtos em um único banco de dados seguro e confiável.
*   **Gestão Estruturada do Fluxo de Trabalho:** Define um pipeline claro e rastreável para cada pedido (da aprovação à entrega), distribuindo responsabilidades e permitindo que a gestão identifique gargalos no processo produtivo.
*   **Escalabilidade Operacional:** A arquitetura baseada em papéis e o uso de um banco de dados real permitem que o negócio cresça, adicionando novos funcionários com permissões controladas sem comprometer a segurança ou a organização dos dados.
*   **Padronização e Controle de Qualidade:** O módulo de **Receitas** funciona como um repositório de fichas técnicas digitais, garantindo que cada produto seja feito de forma consistente, independentemente de quem o produza, mantendo o padrão de qualidade da marca.
*   **Agilidade e Profissionalismo Comercial:** O sistema de **Orçamentos** permite a criação rápida e precisa de propostas comerciais, incluindo a complexa personalização de bolos, reduzindo o tempo de negociação e transmitindo uma imagem mais profissional ao cliente.
*   **Tomada de Decisão Baseada em Dados:** O **Dashboard** transforma dados brutos de vendas em visualizações e indicadores de performance, oferecendo ao administrador insights valiosos para decisões estratégicas sobre precificação, mix de produtos e marketing.