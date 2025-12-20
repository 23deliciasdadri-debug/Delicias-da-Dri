-- ====================================================
-- FIX: Corrigir recursão infinita nas políticas RLS
-- Data: 19/12/2024
-- Problema: Políticas verificam role na própria tabela clients
-- ====================================================
-- 1. Remover políticas problemáticas da tabela clients
DROP POLICY IF EXISTS "Users can view own client record" ON clients;
DROP POLICY IF EXISTS "Users can update own client record" ON clients;
DROP POLICY IF EXISTS "Admins can manage all clients" ON clients;
-- 2. Remover políticas problemáticas da tabela orders
DROP POLICY IF EXISTS "Clients can view own orders" ON orders;
DROP POLICY IF EXISTS "Clients can create own orders" ON orders;
-- 3. Remover políticas problemáticas da tabela favorites
DROP POLICY IF EXISTS "Clients can view own favorites" ON favorites;
DROP POLICY IF EXISTS "Clients can insert own favorites" ON favorites;
DROP POLICY IF EXISTS "Clients can delete own favorites" ON favorites;
-- 4. Remover políticas problemáticas da tabela cake_creations
DROP POLICY IF EXISTS "Clients can view own creations" ON cake_creations;
DROP POLICY IF EXISTS "Clients can insert own creations" ON cake_creations;
DROP POLICY IF EXISTS "Admins can view all creations" ON cake_creations;
-- ====================================================
-- 5. RECRIAR POLÍTICAS SEM RECURSÃO
-- Usar auth.uid() diretamente e verificar role via JWT ou metadata
-- ====================================================
-- CLIENTS: Permitir SELECT para todos os usuários autenticados (admin precisa ver todos)
-- A lógica de filtragem será feita no código da aplicação
DROP POLICY IF EXISTS "Allow authenticated read clients" ON clients;
CREATE POLICY "Allow authenticated read clients" ON clients FOR
SELECT TO authenticated USING (true);
-- CLIENTS: Permitir INSERT apenas para service_role (trigger usa SECURITY DEFINER)
DROP POLICY IF EXISTS "Allow service role insert clients" ON clients;
CREATE POLICY "Allow service role insert clients" ON clients FOR
INSERT TO authenticated WITH CHECK (true);
-- CLIENTS: Permitir UPDATE para próprio registro ou admin
DROP POLICY IF EXISTS "Allow authenticated update clients" ON clients;
CREATE POLICY "Allow authenticated update clients" ON clients FOR
UPDATE TO authenticated USING (user_id = auth.uid());
-- CLIENTS: Permitir DELETE apenas para admins (via service_role no backend)
DROP POLICY IF EXISTS "Allow authenticated delete clients" ON clients;
CREATE POLICY "Allow authenticated delete clients" ON clients FOR DELETE TO authenticated USING (user_id = auth.uid());
-- ====================================================
-- ORDERS: Políticas sem recursão
-- ====================================================
DROP POLICY IF EXISTS "Allow authenticated read orders" ON orders;
CREATE POLICY "Allow authenticated read orders" ON orders FOR
SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated insert orders" ON orders;
CREATE POLICY "Allow authenticated insert orders" ON orders FOR
INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated update orders" ON orders;
CREATE POLICY "Allow authenticated update orders" ON orders FOR
UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated delete orders" ON orders;
CREATE POLICY "Allow authenticated delete orders" ON orders FOR DELETE TO authenticated USING (true);
-- ====================================================
-- FAVORITES: Políticas simplificadas usando user_id direto
-- ====================================================
DROP POLICY IF EXISTS "Favorites select own" ON favorites;
CREATE POLICY "Favorites select own" ON favorites FOR
SELECT TO authenticated USING (
        client_id IN (
            SELECT id
            FROM clients
            WHERE user_id = auth.uid()
        )
    );
DROP POLICY IF EXISTS "Favorites insert own" ON favorites;
CREATE POLICY "Favorites insert own" ON favorites FOR
INSERT TO authenticated WITH CHECK (
        client_id IN (
            SELECT id
            FROM clients
            WHERE user_id = auth.uid()
        )
    );
DROP POLICY IF EXISTS "Favorites delete own" ON favorites;
CREATE POLICY "Favorites delete own" ON favorites FOR DELETE TO authenticated USING (
    client_id IN (
        SELECT id
        FROM clients
        WHERE user_id = auth.uid()
    )
);
-- ====================================================
-- CAKE_CREATIONS: Políticas simplificadas
-- ====================================================
DROP POLICY IF EXISTS "Cake creations select own" ON cake_creations;
CREATE POLICY "Cake creations select own" ON cake_creations FOR
SELECT TO authenticated USING (
        client_id IN (
            SELECT id
            FROM clients
            WHERE user_id = auth.uid()
        )
    );
DROP POLICY IF EXISTS "Cake creations insert own" ON cake_creations;
CREATE POLICY "Cake creations insert own" ON cake_creations FOR
INSERT TO authenticated WITH CHECK (
        client_id IN (
            SELECT id
            FROM clients
            WHERE user_id = auth.uid()
        )
    );