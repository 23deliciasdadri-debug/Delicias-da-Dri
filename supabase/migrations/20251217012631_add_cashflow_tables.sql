-- Migration: Add Cashflow Tables
-- Creates transaction_categories, transactions tables with RLS policies
-- =============================================
-- 1. Tabela transaction_categories
-- =============================================
CREATE TABLE IF NOT EXISTS transaction_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON transaction_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON transaction_categories(type);
COMMENT ON TABLE transaction_categories IS 'Categorias de transações (padrão e customizadas)';
COMMENT ON COLUMN transaction_categories.is_default IS 'Se true, categoria padrão do sistema (não pode ser excluída)';
-- =============================================
-- 2. Categorias Padrão (Seed Data)
-- =============================================
INSERT INTO transaction_categories (user_id, name, type, is_default)
VALUES (NULL, 'Ingredientes', 'expense', true),
    (NULL, 'Embalagens', 'expense', true),
    (NULL, 'Gás/Energia', 'expense', true),
    (NULL, 'Transporte', 'expense', true),
    (NULL, 'Equipamentos', 'expense', true),
    (NULL, 'Outros (Despesa)', 'expense', true),
    (NULL, 'Vendas', 'income', true),
    (NULL, 'Serviços', 'income', true),
    (NULL, 'Outros (Receita)', 'income', true);
-- =============================================
-- 3. Tabela transactions
-- =============================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES transaction_categories(id) ON DELETE RESTRICT,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    description TEXT,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_transactions_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_transactions_updated_at BEFORE
UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_transactions_updated_at();
COMMENT ON TABLE transactions IS 'Transações financeiras do fluxo de caixa';
COMMENT ON COLUMN transactions.type IS 'Tipo: income (entrada) ou expense (saída)';
-- =============================================
-- 4. Políticas RLS
-- =============================================
ALTER TABLE transaction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
-- CATEGORIAS: usuário vê padrão (user_id IS NULL) + próprias
CREATE POLICY "View default and own categories" ON transaction_categories FOR
SELECT USING (
        user_id IS NULL
        OR auth.uid() = user_id
    );
CREATE POLICY "Insert own categories" ON transaction_categories FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Delete own categories" ON transaction_categories FOR DELETE USING (
    auth.uid() = user_id
    AND is_default = false
);
-- TRANSAÇÕES
CREATE POLICY "Users can view own transactions" ON transactions FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON transactions FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON transactions FOR
UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON transactions FOR DELETE USING (auth.uid() = user_id);
-- =============================================
-- 5. Campos de Notificação em profiles
-- =============================================
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS notify_new_orders BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS notify_approved_quotes BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS notify_delivery_reminder BOOLEAN DEFAULT true;
COMMENT ON COLUMN profiles.notify_new_orders IS 'Receber notificação de novos pedidos';
COMMENT ON COLUMN profiles.notify_approved_quotes IS 'Receber notificação de orçamentos aprovados';
COMMENT ON COLUMN profiles.notify_delivery_reminder IS 'Receber lembrete de entrega';