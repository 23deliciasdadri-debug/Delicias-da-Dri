# 5. Autenticação e Controle de Acesso

Este documento descreve a arquitetura e a estratégia de implementação para o gerenciamento de autenticação de usuários e o controle de acesso granular no Painel Administrativo "Delicias da Dri". A solução utilizará os serviços nativos do Supabase (Auth e Row Level Security) para garantir um sistema seguro e robusto.

## 5.1 Fluxo de Autenticação

O fluxo de autenticação governa como os usuários acessam a aplicação. Ele é projetado para ser seguro, utilizando o mecanismo de JSON Web Tokens (JWT) fornecido pelo Supabase Auth.

**1. Tela de Login (`features/Login`):**
*   Esta será a primeira tela que um usuário não autenticado verá ao acessar a aplicação.
*   Conterá um formulário simples com campos para `email` e `senha`, e um botão "Entrar".
*   Haverá um link para o fluxo de "Esqueci minha senha", que utilizará a funcionalidade nativa de recuperação de senha do Supabase.

**2. Processo de Login:**
*   Ao submeter o formulário, a aplicação chamará a função `supabase.auth.signInWithPassword()`, passando as credenciais fornecidas.
*   O Supabase Auth validará as credenciais contra a sua tabela `auth.users`.
*   **Em caso de sucesso:** O Supabase retornará um objeto de sessão contendo um `access_token` (JWT). O cliente do Supabase gerencia automaticamente o armazenamento seguro deste token (no `localStorage`) e sua renovação.
*   **Em caso de falha:** A API retornará um erro, que será exibido de forma amigável ao usuário (ex: "E-mail ou senha inválidos").

**3. Gerenciamento da Sessão:**
*   O estado de autenticação (se há ou não um usuário logado) será gerenciado globalmente na aplicação através de um React Context (`contexts/AuthProvider`).
*   Este `AuthProvider` irá escutar o evento `onAuthStateChange` do cliente Supabase. Este evento é disparado automaticamente no login, logout e na renovação do token.
*   Isso garante que a UI reaja instantaneamente a mudanças no estado de autenticação, redirecionando o usuário para o dashboard após o login ou para a tela de login após o logout, sem precisar recarregar a página.

**4. Rotas Protegidas:**
*   O componente raiz da aplicação (`App.tsx`) conterá uma lógica que verifica o estado de autenticação provido pelo `AuthProvider`.
*   Se não houver usuário logado, ele renderizará o componente `Login`.
*   Se houver um usuário logado, ele renderizará o layout principal do painel (`MainLayout`), que contém as páginas protegidas da aplicação.

**5. Processo de Logout:**
*   A ação de logout (ex: um botão no cabeçalho) chamará a função `supabase.auth.signOut()`.
*   Esta ação invalida a sessão do usuário no Supabase e limpa o token armazenado localmente.
*   O evento `onAuthStateChange` será disparado, e o `AuthProvider` atualizará seu estado, fazendo com que a aplicação automaticamente redirecione o usuário para a tela de `Login`.

## 5.2 Gerenciamento de Contas de Usuários

A criação e gerenciamento de contas de funcionários será uma responsabilidade exclusiva do usuário `admin`.

**1. Fluxo de Criação (via Painel ADM):**
*   Um administrador, em uma seção de "Gerenciar Usuários", terá um formulário para cadastrar um novo funcionário.
*   O formulário coletará `nome completo`, `email`, `senha inicial` e o `papel` (`role` - `kitchen` ou `delivery`).
*   Ao submeter, o backend (através de uma chamada segura do front-end do admin) executará duas operações:
    a. Chamar `supabase.auth.signUp()` (ou `supabase.auth.admin.createUser()` se for via uma Edge Function segura) para criar o usuário na tabela `auth.users`.
    b. Inserir um registro correspondente na nossa tabela `profiles`, associando o `id` do novo usuário ao `full_name` e, crucialmente, ao `role` selecionado.

**2. Relação `auth.users` e `public.profiles`:**
*   A integridade entre a tabela de autenticação e nossa tabela de perfis será garantida via um `trigger` no banco de dados.
*   **Trigger `on_user_created`:** Ao criar um novo usuário em `auth.users`, este trigger irá copiar automaticamente o `id` e o `email` para um novo registro na tabela `profiles`. O `full_name` e o `role` serão preenchidos pela lógica da aplicação no momento do cadastro.

## 5.3 Controle de Acesso com Row Level Security (RLS)

O RLS é o mecanismo principal que garante que cada usuário veja apenas os dados aos quais seu papel permite. O RLS será habilitado em todas as tabelas sensíveis.

**Conceito Central:** Cada política RLS é uma condição SQL que deve ser verdadeira para que a operação (SELECT, INSERT, UPDATE, DELETE) seja permitida. Usaremos funções utilitárias que extraem o `id` e o `role` do usuário a partir do JWT da sessão atual.

**Exemplo de Políticas RLS na Tabela `orders`:**

*   **Política de Leitura (SELECT):**
    *   **Para `admin`:**
        `CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT TO authenticated USING (get_my_claim('role')::text = 'admin');`
        *(Permite que um `admin` veja todas as linhas.)*
    *   **Para `kitchen`:**
        `CREATE POLICY "Kitchen can view orders in production" ON public.orders FOR SELECT TO authenticated USING (get_my_claim('role')::text = 'kitchen' AND status IN ('Aprovado', 'Em Produção'));`
        *(Permite que a `cozinha` veja apenas pedidos com status relevantes para eles.)*
    *   **Para `delivery`:**
        `CREATE POLICY "Delivery can view ready orders" ON public.orders FOR SELECT TO authenticated USING (get_my_claim('role')::text = 'delivery' AND status IN ('Pronto para Entrega', 'Em Entrega'));`

*   **Política de Escrita (UPDATE):**
    *   As políticas de UPDATE serão mais restritivas, permitindo que cada papel altere apenas campos específicos (como o `status`), sob condições específicas, garantindo que o fluxo de trabalho seja seguido.

Esta abordagem move a lógica de segurança para o banco de dados, tornando-a muito mais robusta do que se dependêssemos apenas de esconder/mostrar botões na interface do usuário. A API do Supabase respeitará automaticamente essas políticas.