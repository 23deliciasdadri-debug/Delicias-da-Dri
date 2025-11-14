-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.clients (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT clients_pkey PRIMARY KEY (id)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  quote_id uuid,
  delivery_date date NOT NULL,
  status text NOT NULL DEFAULT 'Aprovado'::text CHECK (status = ANY (ARRAY['Aprovado'::text, 'Em Produção'::text, 'Pronto para Entrega'::text, 'Em Entrega'::text, 'Entregue'::text, 'Cancelado'::text])),
  total_amount numeric NOT NULL DEFAULT 0,
  delivery_details text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id),
  CONSTRAINT orders_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id)
);
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_url text,
  price numeric NOT NULL,
  unit_type text NOT NULL,
  product_type text NOT NULL CHECK (product_type = ANY (ARRAY['PRODUTO_MENU'::text, 'COMPONENTE_BOLO'::text])),
  component_category text,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'kitchen'::text CHECK (role = ANY (ARRAY['admin'::text, 'kitchen'::text, 'delivery'::text])),
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.quote_items (
  id bigint NOT NULL DEFAULT nextval('quote_items_id_seq'::regclass),
  quote_id uuid NOT NULL,
  product_id uuid,
  product_name_copy text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  price_at_creation numeric NOT NULL,
  CONSTRAINT quote_items_pkey PRIMARY KEY (id),
  CONSTRAINT quote_items_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id),
  CONSTRAINT quote_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.quotes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'Pendente'::text CHECK (status = ANY (ARRAY['Pendente'::text, 'Aprovado'::text, 'Recusado'::text])),
  event_type text,
  event_date date,
  total_amount numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT quotes_pkey PRIMARY KEY (id),
  CONSTRAINT quotes_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id)
);