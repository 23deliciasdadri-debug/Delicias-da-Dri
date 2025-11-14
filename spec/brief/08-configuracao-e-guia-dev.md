# 8. Configuração do Ambiente e Guia de Desenvolvimento

Este documento fornece as instruções necessárias para configurar o ambiente de desenvolvimento local do "Delicias da Dri - Painel Administrativo" e um guia com as melhores práticas a serem seguidas ao contribuir com o projeto.

---

## 8.1 Requisitos de Software

Antes de iniciar, garanta que você tenha os seguintes softwares instalados em sua máquina:
-   **Node.js**: Versão 18.x ou superior.
-   **npm** ou **yarn**: Gerenciador de pacotes do Node.js.
-   **Git**: Sistema de controle de versão.

## 8.2 Configuração do Projeto Supabase

O projeto depende de uma instância do Supabase para funcionar.

1.  **Crie uma Conta no Supabase:** Acesse [supabase.com](https://supabase.com) e crie uma conta gratuita.
2.  **Crie um Novo Projeto:**
    -   No seu dashboard do Supabase, crie uma nova organização e um novo projeto.
    -   Guarde a **senha do banco de dados** em um local seguro. Ela será necessária se você precisar acessar o banco diretamente.
3.  **Obtenha as Chaves de API:**
    -   Dentro do seu projeto Supabase, navegue até **Project Settings > API**.
    -   Você precisará de duas informações:
        -   **Project URL**
        -   **`anon` (public) API Key**
    -   Estes valores serão usados para configurar o cliente Supabase no front-end.
4.  **Execute o Schema do Banco de Dados:**
    -   Navegue até o **SQL Editor** no seu projeto Supabase.
    -   Copie o conteúdo do arquivo `03-esquema-do-banco-de-dados.md` (convertido para SQL válido) e execute os scripts para criar todas as tabelas, relacionamentos e chaves.
    -   **Importante:** Após criar as tabelas, navegue até **Authentication > Policies** e habilite o **Row Level Security (RLS)** para cada uma das tabelas criadas. Em seguida, adicione as políticas de acesso detalhadas no documento `05-autenticacao-e-controle-de-acesso.md`.

## 8.3 Configuração do Ambiente de Desenvolvimento Local

Siga estes passos para rodar a aplicação front-end em sua máquina:

1.  **Clone o Repositório:**
    `git clone <URL_DO_REPOSITORIO>`
    `cd <NOME_DO_DIRETORIO>`

2.  **Crie o Arquivo de Variáveis de Ambiente:**
    -   Na raiz do projeto, crie um arquivo chamado `.env.local`. Este arquivo é ignorado pelo Git para proteger suas chaves secretas.
    -   Adicione as chaves obtidas do Supabase neste arquivo, prefixadas com `VITE_` conforme exigido pelo Vite:

    ```env
    VITE_SUPABASE_URL="SUA_PROJECT_URL_AQUI"
    VITE_SUPABASE_ANON_KEY="SUA_ANON_PUBLIC_KEY_AQUI"
    ```

3.  **Instale as Dependências:**
    Execute o seguinte comando para instalar todos os pacotes definidos no `package.json`:
    `npm install`

4.  **Inicie o Servidor de Desenvolvimento:**
    `npm run dev`

    -   Isso iniciará o servidor de desenvolvimento do Vite, geralmente na porta `http://localhost:5173`. A aplicação será aberta automaticamente no seu navegador e recarregará a cada alteração que você fizer no código.

## 8.4 Guia de Contribuição e Padrões de Código

Para manter a qualidade e a consistência do código, siga estas diretrizes ao adicionar ou modificar funcionalidades.

**Estrutura de Arquivos:**

*   **Siga a Estrutura Definida:** Adicione novos componentes, features, hooks e contextos em seus respectivos diretórios (`components/`, `features/`, etc.). Lembre-se, **não crie uma pasta `src/`**.
*   **Componentes:** Cada componente deve residir em sua própria pasta e ser nomeado em PascalCase (ex: `components/ui/Button/Button.tsx`).
*   **Centralize os Tipos:** Todos os tipos e interfaces globais que são compartilhados entre múltiplos arquivos devem ser definidos no arquivo `types.ts` na raiz do projeto. Tipos que são usados exclusivamente dentro de um único componente podem ser definidos no próprio arquivo do componente.

**Convenções de Código:**

*   **TypeScript em Tudo:** Todo o novo código deve ser escrito em TypeScript. Utilize tipos sempre que possível para garantir a segurança dos dados.
*   **Nomenclatura:**
    *   **Variáveis e Funções:** `camelCase`
    *   **Componentes React:** `PascalCase`
    *   **Tipos e Interfaces:** `PascalCase`
*   **Estilização com TailwindCSS:** Evite escrever CSS customizado. Utilize as classes de utilitário do TailwindCSS diretamente no JSX. Para lógica de estilo complexa, considere o uso da diretiva `@apply` no seu arquivo CSS principal se estritamente necessário, ou crie componentes encapsulados.

**Adicionando uma Nova Funcionalidade (Ex: "Fornecedores"):**

1.  **Defina a Tabela:** Crie a tabela `suppliers` no Supabase usando o SQL Editor.
2.  **Defina o Tipo:** Adicione a interface `Supplier` no arquivo `types.ts`.
3.  **Crie a Página da Feature:** Crie uma nova pasta `features/suppliers/` e dentro dela o arquivo `Suppliers.tsx`. Este componente será responsável por buscar, exibir e interagir com os dados da tabela `suppliers`.
4.  **Crie a Rota:** Adicione a lógica de roteamento no `App.tsx` para renderizar o componente `Suppliers` quando a URL correspondente for acessada.
5.  **Adicione ao Menu:** Atualize o `Sidebar` para incluir o link de navegação para a nova página.

**Interagindo com o Supabase:**

*   **Cliente Centralizado:** Importe e utilize a instância do cliente Supabase definida em `lib/supabaseClient.ts` para todas as suas consultas. Não crie novas instâncias do cliente.
*   **Tratamento de Erros:** Sempre envolva suas chamadas de API do Supabase em blocos `try...catch` ou use o padrão de retorno de `{ data, error }` para tratar possíveis falhas na comunicação com o backend e exibir feedback apropriado ao usuário.
*   **Segurança:** Lembre-se que o RLS é sua principal camada de segurança. O front-end assume que o backend aplicará as permissões corretas. Não implemente lógica de permissão crítica apenas no cliente.