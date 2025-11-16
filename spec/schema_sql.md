-- Bucket para armazenar imagens enviadas diretamente do dispositivo.
insert into storage.buckets (id, name, public)
values ('product-media', 'product-media', true)
on conflict (id) do nothing;

-- Permissões básicas: todos os usuários autenticados podem fazer upload/leitura dos próprios arquivos.
create policy "Autenticado pode enviar imagens de produto"
on storage.objects for insert
with check (
  bucket_id = 'product-media'
  and auth.role() = 'authenticated'
);

create policy "Autenticado pode ler imagens de produto"
on storage.objects for select
using (
  bucket_id = 'product-media'
);

-- Tabela para controlar múltiplas imagens por produto.
create table if not exists public.product_media (
  id bigserial primary key,
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create unique index if not exists product_media_product_path_idx
  on public.product_media (product_id, storage_path);

-- Campos extras para controle de compartilhamento de orçamentos.
alter table public.quotes
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists approved_at timestamptz,
  add column if not exists public_link_token uuid,
  add column if not exists public_link_token_expires_at timestamptz,
  add column if not exists public_link_last_viewed_at timestamptz;

create unique index if not exists quotes_public_link_token_idx
  on public.quotes (public_link_token)
  where public_link_token is not null;

-- Função que retorna um preview público completo (um registro por item) e atualiza o last_viewed_at.
create or replace function public.get_quote_public_preview(input_token uuid)
returns table (
  quote_id uuid,
  quote_status text,
  quote_event_type text,
  quote_event_date date,
  quote_notes text,
  quote_total_amount numeric,
  quote_created_at timestamptz,
  quote_updated_at timestamptz,
  quote_approved_at timestamptz,
  client_id uuid,
  client_name text,
  client_phone text,
  client_email text,
  item_id bigint,
  item_product_id uuid,
  item_product_name text,
  item_quantity integer,
  item_price numeric
)
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.quotes
     set public_link_last_viewed_at = now()
   where public_link_token = input_token
     and (public_link_token_expires_at is null or public_link_token_expires_at > now());

  return query
  select
    q.id,
    q.status,
    q.event_type,
    q.event_date,
    q.notes,
    q.total_amount,
    q.created_at,
    q.updated_at,
    q.approved_at,
    c.id,
    c.name,
    c.phone,
    c.email,
    qi.id,
    qi.product_id,
    qi.product_name_copy,
    qi.quantity,
    qi.price_at_creation
  from public.quotes q
  join public.clients c on c.id = q.client_id
  left join public.quote_items qi on qi.quote_id = q.id
  where q.public_link_token = input_token
    and (q.public_link_token_expires_at is null or q.public_link_token_expires_at > now());
end;
$$;

-- Função que aprova o orçamento via token público.
create or replace function public.approve_quote_via_token(input_token uuid)
returns public.quotes
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.quotes%rowtype;
begin
  select *
    into target
    from public.quotes
   where public_link_token = input_token
     and (public_link_token_expires_at is null or public_link_token_expires_at > now())
   for update;

  if not found then
    raise exception 'Token inválido ou expirado';
  end if;

  update public.quotes
     set status = 'Aprovado',
         approved_at = coalesce(target.approved_at, now()),
         updated_at = now(),
         public_link_last_viewed_at = now()
   where id = target.id
   returning * into target;

  return target;
end;
$$;

grant execute on function public.get_quote_public_preview(uuid) to anon, authenticated;
grant execute on function public.approve_quote_via_token(uuid) to anon, authenticated;
