-- ====================================================
-- MIGRATION: Vitrine Delícias da Dri - Schema Updates
-- Data: 19/12/2024
-- ====================================================
-- 1. ALTERAÇÕES NA TABELA CLIENTS
-- Vincular cliente ao usuário autenticado
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE
SET NULL;
-- Role do cliente (client, employee, admin)
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'client';
-- Adicionar constraint de check para roles válidas
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'clients_role_check'
) THEN
ALTER TABLE clients
ADD CONSTRAINT clients_role_check CHECK (role IN ('client', 'employee', 'admin'));
END IF;
END $$;
-- Avatar do cliente
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS avatar_url TEXT;
-- Índice para busca por user_id
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
-- Índice para busca por role
CREATE INDEX IF NOT EXISTS idx_clients_role ON clients(role);
-- ====================================================
-- 2. ALTERAÇÕES NA TABELA ORDERS
-- ====================================================
-- Origem do pedido (storefront, admin, whatsapp)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'admin';
-- Adicionar constraint de check para sources válidas
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'orders_source_check'
) THEN
ALTER TABLE orders
ADD CONSTRAINT orders_source_check CHECK (source IN ('storefront', 'admin', 'whatsapp'));
END IF;
END $$;
-- Items do pedido em formato JSON (para pedidos da vitrine sem quote)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS items JSONB;
-- ====================================================
-- 3. ALTERAÇÕES NA TABELA PRODUCTS
-- ====================================================
-- Campo para destacar produto na home
ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
-- Índice para produtos públicos
CREATE INDEX IF NOT EXISTS idx_products_is_public ON products(is_public)
WHERE is_public = true;
-- Índice para produtos destacados
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured)
WHERE is_featured = true;
-- ====================================================
-- 4. TABELA FAVORITES (Produtos Favoritos)
-- ====================================================
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(client_id, product_id)
);
-- Índices
CREATE INDEX IF NOT EXISTS idx_favorites_client_id ON favorites(client_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product_id ON favorites(product_id);
-- Habilitar RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
-- Policy: Clientes podem ver seus próprios favoritos
DROP POLICY IF EXISTS "Clients can view own favorites" ON favorites;
CREATE POLICY "Clients can view own favorites" ON favorites FOR
SELECT USING (
        client_id IN (
            SELECT id
            FROM clients
            WHERE user_id = auth.uid()
        )
    );
-- Policy: Clientes podem inserir seus próprios favoritos
DROP POLICY IF EXISTS "Clients can insert own favorites" ON favorites;
CREATE POLICY "Clients can insert own favorites" ON favorites FOR
INSERT WITH CHECK (
        client_id IN (
            SELECT id
            FROM clients
            WHERE user_id = auth.uid()
        )
    );
-- Policy: Clientes podem deletar seus próprios favoritos
DROP POLICY IF EXISTS "Clients can delete own favorites" ON favorites;
CREATE POLICY "Clients can delete own favorites" ON favorites FOR DELETE USING (
    client_id IN (
        SELECT id
        FROM clients
        WHERE user_id = auth.uid()
    )
);
-- ====================================================
-- 5. TABELA CAKE_CREATIONS (Histórico do "Faça seu Bolo")
-- ====================================================
CREATE TABLE IF NOT EXISTS cake_creations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    choices JSONB NOT NULL,
    prompt TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Índice
CREATE INDEX IF NOT EXISTS idx_cake_creations_client_id ON cake_creations(client_id);
-- Habilitar RLS
ALTER TABLE cake_creations ENABLE ROW LEVEL SECURITY;
-- Policy: Clientes podem ver suas próprias criações
DROP POLICY IF EXISTS "Clients can view own creations" ON cake_creations;
CREATE POLICY "Clients can view own creations" ON cake_creations FOR
SELECT USING (
        client_id IN (
            SELECT id
            FROM clients
            WHERE user_id = auth.uid()
        )
    );
-- Policy: Clientes podem criar suas próprias criações
DROP POLICY IF EXISTS "Clients can insert own creations" ON cake_creations;
CREATE POLICY "Clients can insert own creations" ON cake_creations FOR
INSERT WITH CHECK (
        client_id IN (
            SELECT id
            FROM clients
            WHERE user_id = auth.uid()
        )
    );
-- Policy: Admins podem ver todas as criações
DROP POLICY IF EXISTS "Admins can view all creations" ON cake_creations;
CREATE POLICY "Admins can view all creations" ON cake_creations FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM clients
            WHERE user_id = auth.uid()
                AND role IN ('admin', 'employee')
        )
    );
-- ====================================================
-- 6. TRIGGER PARA AUTO-CRIAR CLIENTE APÓS SIGNUP
-- ====================================================
-- Função que cria o registro de cliente
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
DECLARE new_client_id UUID;
BEGIN -- Verifica se já existe um cliente com esse email
SELECT id INTO new_client_id
FROM public.clients
WHERE email = NEW.email
LIMIT 1;
IF new_client_id IS NOT NULL THEN -- Se já existe, apenas vincula o user_id
UPDATE public.clients
SET user_id = NEW.id,
    avatar_url = COALESCE(
        avatar_url,
        NEW.raw_user_meta_data->>'avatar_url'
    )
WHERE id = new_client_id;
ELSE -- Se não existe, cria novo registro
INSERT INTO public.clients (
        user_id,
        name,
        email,
        phone,
        role,
        avatar_url
    )
VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            split_part(NEW.email, '@', 1)
        ),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        'client',
        NEW.raw_user_meta_data->>'avatar_url'
    );
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Remove trigger se existir (para poder recriar)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- Cria o trigger
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- ====================================================
-- 7. ATUALIZAÇÃO DE RLS NA TABELA CLIENTS
-- ====================================================
-- Policy: Usuários autenticados podem ver seu próprio registro
DROP POLICY IF EXISTS "Users can view own client record" ON clients;
CREATE POLICY "Users can view own client record" ON clients FOR
SELECT USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1
            FROM clients c
            WHERE c.user_id = auth.uid()
                AND c.role IN ('admin', 'employee')
        )
    );
-- Policy: Usuários podem atualizar seu próprio registro
DROP POLICY IF EXISTS "Users can update own client record" ON clients;
CREATE POLICY "Users can update own client record" ON clients FOR
UPDATE USING (user_id = auth.uid());
-- Policy: Admins podem gerenciar todos os registros
DROP POLICY IF EXISTS "Admins can manage all clients" ON clients;
CREATE POLICY "Admins can manage all clients" ON clients FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM clients c
        WHERE c.user_id = auth.uid()
            AND c.role IN ('admin', 'employee')
    )
);
-- ====================================================
-- 8. RLS PARA CLIENTES VEREM SEUS PRÓPRIOS PEDIDOS
-- ====================================================
-- Policy: Clientes podem ver seus próprios pedidos
DROP POLICY IF EXISTS "Clients can view own orders" ON orders;
CREATE POLICY "Clients can view own orders" ON orders FOR
SELECT USING (
        client_id IN (
            SELECT id
            FROM clients
            WHERE user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1
            FROM clients c
            WHERE c.user_id = auth.uid()
                AND c.role IN ('admin', 'employee')
        )
    );
-- Policy: Clientes podem criar pedidos para si mesmos
DROP POLICY IF EXISTS "Clients can create own orders" ON orders;
CREATE POLICY "Clients can create own orders" ON orders FOR
INSERT WITH CHECK (
        client_id IN (
            SELECT id
            FROM clients
            WHERE user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1
            FROM clients c
            WHERE c.user_id = auth.uid()
                AND c.role IN ('admin', 'employee')
        )
    );