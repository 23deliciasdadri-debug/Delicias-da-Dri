# Playbook de Policies e RLS — Supabase

## Objetivo
Garantir que todas as tabelas expostas ao frontend respeitem Row Level Security (RLS) com regras claras por papel (`admin`, `kitchen`, `delivery`). Este documento serve como manual operacional e script oficial para aplicar/reativar as policies no Supabase.

## Quem executa
- Membro com acesso ao projeto no Supabase Console e permissão para usar o `service_role` (ou rodar o script via CLI com a mesma role).
- Antes de executar, faça backup/export das policies atuais (SQL Editor > “Download query result”).

## Passo a passo básico
1. Abrir o **SQL Editor** do Supabase e selecionar o banco `postgres`.
2. Copiar os blocos abaixo por seção (ou o arquivo inteiro) e executar.
3. Após cada execução, rodar:
   ```sql
   select tablename, is_rls_enabled, is_rls_forced
   from pg_tables
   where schemaname = 'public'
     and tablename in ('profiles','clients','products','quotes','quote_items','orders');
   ```
4. Validar policies com:
   ```sql
   select schemaname, tablename, policyname, permissive, roles, cmd
   from pg_policies
   where schemaname = 'public'
   order by tablename, policyname;
   ```
5. Testar rapidamente via SQL (por exemplo, usando `auth.uid()` simulado com `set local role authenticated;` em sessões seguras) ou via aplicação/harness.

## Checklist de validação
- Todas as tabelas listadas retornam `is_rls_enabled = true` e `is_rls_forced = true`.
- Usuário `admin` consegue CRUD completo em `clients`, `products`, `quotes`, `quote_items`, `orders`.
- Usuário `kitchen` consegue ler `clients/products/quotes/orders` e atualizar pedidos apenas nos status permitidos.
- Usuário `delivery` consegue ler `clients/products/quotes/orders` e atualizar pedidos apenas em fase de entrega.
- Usuário autenticado comum só consegue ler/alterar seu próprio registro em `profiles`.

## Matriz de acesso por papel

| Tabela        | Admin                          | Kitchen                        | Delivery                       | Observações principais                                     |
|---------------|--------------------------------|--------------------------------|--------------------------------|------------------------------------------------------------|
| `profiles`    | Pode ler/atualizar todos via `service_role` (bypass). | Apenas o próprio registro.     | Apenas o próprio registro.     | RLS evita leitura cruzada de perfis.                       |
| `clients`     | CRUD completo.                 | Leitura somente.               | Leitura somente.               | Protege dados sensíveis de clientes.                       |
| `products`    | CRUD completo.                 | Leitura somente.               | Leitura somente.               | Catálogo controlado apenas por admin.                      |
| `quotes`      | CRUD completo.                 | Leitura.                       | Leitura.                       | Apenas admin cria/edita/or exclui orçamentos.              |
| `quote_items` | CRUD completo.                 | Leitura.                       | Leitura.                       | Items seguem mesma regra de `quotes`.                      |
| `orders`      | CRUD completo.                 | Leitura e atualização limitada (`Aprovado` ⇄ `Pronto para Entrega`). | Leitura e atualização limitada (`Pronto para Entrega` ⇄ `Entregue`). | Delivery não pode mexer em itens de cozinha e vice-versa. |

---

## SQL por tabela

> **Observação:** os blocos abaixo são idempotentes (`drop policy if exists ...`). Execute todos para manter consistência.

### Perfis (`public.profiles`)

```sql
alter table public.profiles enable row level security;
alter table public.profiles force row level security;

drop policy if exists "profiles_select_self" on public.profiles;
create policy "profiles_select_self" on public.profiles
  for select
  using (id = auth.uid());

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());
```

### Clientes (`public.clients`)

```sql
alter table public.clients enable row level security;
alter table public.clients force row level security;

drop policy if exists "clients_select_roles" on public.clients;
create policy "clients_select_roles" on public.clients
  for select
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin','kitchen','delivery')
    )
  );

drop policy if exists "clients_mutation_admin" on public.clients;
create policy "clients_mutation_admin" on public.clients
  for all
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );
```

### Produtos (`public.products`)

```sql
alter table public.products enable row level security;
alter table public.products force row level security;

drop policy if exists "products_select_roles" on public.products;
create policy "products_select_roles" on public.products
  for select
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin','kitchen','delivery')
    )
  );

drop policy if exists "products_mutation_admin" on public.products;
create policy "products_mutation_admin" on public.products
  for all
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );
```

### Orçamentos (`public.quotes`)

```sql
alter table public.quotes enable row level security;
alter table public.quotes force row level security;

drop policy if exists "quotes_select_roles" on public.quotes;
create policy "quotes_select_roles" on public.quotes
  for select
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin','kitchen','delivery')
    )
  );

drop policy if exists "quotes_mutation_admin" on public.quotes;
create policy "quotes_mutation_admin" on public.quotes
  for all
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );
```

### Itens de orçamento (`public.quote_items`)

```sql
alter table public.quote_items enable row level security;
alter table public.quote_items force row level security;

drop policy if exists "quote_items_select_roles" on public.quote_items;
create policy "quote_items_select_roles" on public.quote_items
  for select
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin','kitchen','delivery')
    )
  );

drop policy if exists "quote_items_mutation_admin" on public.quote_items;
create policy "quote_items_mutation_admin" on public.quote_items
  for all
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );
```

### Pedidos (`public.orders`)

```sql
alter table public.orders enable row level security;
alter table public.orders force row level security;

-- SELECT
drop policy if exists "orders_select_admin" on public.orders;
create policy "orders_select_admin" on public.orders
  for select
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );

drop policy if exists "orders_select_kitchen" on public.orders;
create policy "orders_select_kitchen" on public.orders
  for select
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'kitchen'
    )
    and status in ('Aprovado','Em Produção','Pronto para Entrega')
  );

drop policy if exists "orders_select_delivery" on public.orders;
create policy "orders_select_delivery" on public.orders
  for select
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'delivery'
    )
    and status in ('Pronto para Entrega','Em Entrega','Entregue')
  );

-- INSERT
drop policy if exists "orders_insert_admin" on public.orders;
create policy "orders_insert_admin" on public.orders
  for insert
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );

-- UPDATE
drop policy if exists "orders_update_admin" on public.orders;
create policy "orders_update_admin" on public.orders
  for update
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  )
  with check (true);

drop policy if exists "orders_update_kitchen" on public.orders;
create policy "orders_update_kitchen" on public.orders
  for update
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'kitchen'
    )
    and status in ('Aprovado','Em Produção')
  )
  with check (
    status in ('Em Produção','Pronto para Entrega')
  );

drop policy if exists "orders_update_delivery" on public.orders;
create policy "orders_update_delivery" on public.orders
  for update
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'delivery'
    )
    and status in ('Pronto para Entrega','Em Entrega')
  )
  with check (
    status in ('Em Entrega','Entregue')
  );

-- DELETE
drop policy if exists "orders_delete_admin" on public.orders;
create policy "orders_delete_admin" on public.orders
  for delete
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );
```

---

## Referências rápidas
- [Documentação Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- Comando para verificar policies específicas:
  ```sql
  select *
  from pg_policies
  where schemaname = 'public' and tablename = '<tabela>';
  ```
- Para resetar políticas de uma tabela, basta executar novamente o bloco correspondente (os `drop policy` garantem idempotência).
