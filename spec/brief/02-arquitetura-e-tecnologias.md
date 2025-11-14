# 2. Arquitetura e Tecnologias

Este documento detalha a arquitetura de software, a stack de tecnologias e as decisões de design que fundamentam o Painel Administrativo "Delicias da Dri". A solução foi projetada para ser robusta, segura e escalável, utilizando ferramentas modernas de desenvolvimento web.

## 2.1 Stack de Tecnologias

A aplicação será construída sobre uma base de tecnologias modernas e eficientes, escolhidas para proporcionar uma excelente experiência de desenvolvimento e um produto final de alta performance.

-   **Ambiente de Desenvolvimento:** **Vite**. Adotamos Vite como nossa principal ferramenta de desenvolvimento e build. Ele fornece um servidor de desenvolvimento extremamente rápido e um processo de compilação otimizado para produção. Vite também gerencia de forma nativa as variáveis de ambiente (arquivos `.env`), um requisito essencial para manusear as chaves de API do Supabase de forma segura.

-   **Framework Frontend:** **React**. Utilizaremos a biblioteca React para construir a interface de usuário reativa e componentizada. Sua vasta comunidade e ecossistema nos permitem criar UIs complexas de forma organizada e eficiente.

-   **Linguagem:** **TypeScript**. Todo o código da aplicação será escrito em TypeScript. A tipagem estática nos garante maior segurança e robustez, prevenindo erros em tempo de desenvolvimento, melhorando o autocompletar e servindo como uma documentação viva da estrutura dos nossos dados.

-   **Estilização:** **TailwindCSS**. Empregaremos TailwindCSS para a estilização, utilizando sua abordagem *utility-first*. Isso nos permite construir interfaces consistentes e responsivas diretamente no JSX, sem a necessidade de arquivos CSS separados, acelerando o desenvolvimento da UI.

-   **Backend as a Service (BaaS):** **Supabase**. O Supabase é o pilar da nossa infraestrutura de backend. Ele nos fornece todos os serviços necessários, acessados via API:
    -   **Banco de Dados:** Um banco de dados PostgreSQL relacional e completo.
    -   **Autenticação:** Sistema de gerenciamento de usuários, logins, e controle de acesso via tokens JWT.
    -   **Armazenamento de Arquivos:** Um serviço para fazer upload e servir arquivos, como imagens de produtos e banners (Supabase Storage).
    -   **APIs:** Geração automática de APIs RESTful e GraphQL para interagir com o banco de dados.

## 2.2 Arquitetura da Aplicação

A estrutura do projeto foi pensada para promover a modularidade e a clareza, mesmo dentro das limitações de um ambiente com estrutura de arquivos plana. A ausência da pasta `src/` é uma decisão de design deliberada para garantir a compatibilidade com o Google AI Studio.

-   **Ponto de Entrada:** O arquivo `index.html` na raiz do projeto é a página inicial. Ele contém o `<div>` com `id="root"` onde a aplicação React será montada. O Vite injetará automaticamente a referência ao nosso script principal.

-   **Inicialização do React:** O arquivo `main.tsx`, também na raiz, é o ponto de entrada do JavaScript. Ele importa o React, localiza o elemento `#root` no `index.html`, e renderiza o componente principal `App.tsx` dentro dele.

-   **Componente Raiz (`App.tsx`):** Este componente é o orquestrador geral da aplicação. Suas responsabilidades incluem:
    -   Gerenciar o roteamento principal da aplicação (qual página está sendo exibida).
    -   Prover o contexto de autenticação para todos os componentes filhos.
    -   Renderizar o layout principal (com menu lateral e cabeçalho) após um login bem-sucedido, ou a tela de Login caso contrário.

-   **Estrutura de Diretórios (Raiz):**
    A organização do código será feita através de pastas de primeiro nível, localizadas na raiz do projeto:

    /
    |-- components/      # Componentes de UI genéricos e reutilizáveis (Card, Modal, Button)
    |-- features/        # Componentes de alto nível que representam cada módulo/página (Dashboard, Products, Orders)
    |-- contexts/        # Provedores de Contexto do React (ex: AuthProvider para estado de autenticação)
    |-- hooks/           # Hooks customizados (ex: useUserProfile para buscar dados do usuário logado)
    |-- lib/             # Biblioteca de código auxiliar, primariamente o cliente Supabase (ex: supabaseClient.ts)
    |-- assets/          # Arquivos estáticos como logos e imagens padrão
    |
    |-- App.tsx          # Componente Raiz da Aplicação
    |-- main.tsx         # Ponto de Entrada do React
    |-- index.html       # Arquivo HTML principal
    |-- tailwind.config.js # Configuração do TailwindCSS
    |-- package.json     # Dependências do projeto
    |-- types.ts         # Definições globais de tipos do TypeScript
    `-- .env.local       # Chaves de API secretas para o Supabase (NÃO versionar no Git)

## 2.3 Comunicação com o Backend

Toda a interação com o Supabase será mediada por um cliente centralizado.

-   **Cliente Supabase:** Será criado um arquivo `lib/supabaseClient.ts` que inicializa o cliente Supabase usando as chaves de API carregadas a partir das variáveis de ambiente (`.env.local`). Este cliente será importado por todos os componentes ou hooks que precisem acessar o banco de dados.

-   **Segurança:** As chaves secretas do Supabase NUNCA serão expostas no código do frontend. O Vite garante que as variáveis no arquivo `.env.local` só sejam acessíveis durante o processo de desenvolvimento e build, não ficando visíveis no código final que vai para o navegador.

## 2.4 Gerenciamento de Estado

A estratégia de estado evolui de um modelo local para um que reflete a realidade de uma aplicação conectada a um banco de dados externo.

-   **Fonte da Verdade:** O banco de dados Supabase é agora a única e definitiva fonte da verdade para todos os dados de negócio (produtos, pedidos, clientes, etc.).

-   **Estado Global:** Informações sobre a sessão do usuário (se está logado, quem é, qual seu papel) serão gerenciadas globalmente através de um React Context (`contexts/AuthProvider.tsx`). Isso evita a passagem excessiva de props (`prop drilling`) com dados de autenticação.

-   **Estado Remoto (Dados do Backend):** Os dados das tabelas serão buscados sob demanda. Cada componente de `features/` será responsável por buscar os dados que precisa para ser renderizado, utilizando hooks `useState` e `useEffect`. Para otimizações futuras, a adoção de uma biblioteca como TanStack Query (React Query) pode ser considerada para gerenciar cache, revalidação e estados de carregamento de forma mais eficiente.```