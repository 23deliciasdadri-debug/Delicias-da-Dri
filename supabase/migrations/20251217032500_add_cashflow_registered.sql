-- Migration: Add cashflow_registered column to orders
-- Tracks if an order has been registered in the cashflow
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS cashflow_registered BOOLEAN DEFAULT false;
COMMENT ON COLUMN orders.cashflow_registered IS 'Indica se este pedido já foi lançado como receita no fluxo de caixa';
-- Índice parcial para pedidos entregues não lançados
CREATE INDEX IF NOT EXISTS idx_orders_pending_cashflow ON orders(id)
WHERE status = 'Entregue'
    AND cashflow_registered = false;