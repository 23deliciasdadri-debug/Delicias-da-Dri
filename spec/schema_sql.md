-- Executar esse bloco no SQL Editor do Supabase para habilitar links públicos de orçamentos.
alter table public.quotes
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists approved_at timestamptz,
  add column if not exists public_link_token uuid,
  add column if not exists public_link_token_expires_at timestamptz,
  add column if not exists public_link_last_viewed_at timestamptz;

create unique index if not exists quotes_public_link_token_idx
  on public.quotes (public_link_token)
  where public_link_token is not null;

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
