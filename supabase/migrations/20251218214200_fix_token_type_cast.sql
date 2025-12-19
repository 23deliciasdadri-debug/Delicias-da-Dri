-- Migration: Fix token type mismatch in approve_quote_via_token
-- The column public_link_token is UUID but we receive text, need to cast
DROP FUNCTION IF EXISTS approve_quote_via_token(text);
DROP FUNCTION IF EXISTS approve_quote_via_token(uuid);
CREATE OR REPLACE FUNCTION approve_quote_via_token(input_token text) RETURNS quotes LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE target_quote quotes %ROWTYPE;
new_order_id uuid;
delivery_date_value date;
token_uuid uuid;
BEGIN -- Try to cast input_token to uuid
BEGIN token_uuid := input_token::uuid;
EXCEPTION
WHEN OTHERS THEN RAISE EXCEPTION 'Token inválido.';
END;
-- Find the quote by token
SELECT * INTO target_quote
FROM quotes
WHERE public_link_token = token_uuid
    AND (
        public_link_token_expires_at IS NULL
        OR public_link_token_expires_at > now()
    );
-- If not found, raise error
IF target_quote.id IS NULL THEN RAISE EXCEPTION 'Token inválido ou expirado.';
END IF;
-- If already approved, just return the quote
IF target_quote.status = 'Aprovado' THEN RETURN target_quote;
END IF;
-- Update the quote status to Aprovado
UPDATE quotes
SET status = 'Aprovado',
    approved_at = now(),
    updated_at = now()
WHERE id = target_quote.id
RETURNING * INTO target_quote;
-- Check if an order already exists for this quote
IF NOT EXISTS (
    SELECT 1
    FROM orders
    WHERE quote_id = target_quote.id
) THEN -- Determine delivery date (use event_date or today)
delivery_date_value := COALESCE(target_quote.event_date, CURRENT_DATE);
-- Create the order
INSERT INTO orders (
        client_id,
        quote_id,
        status,
        total_amount,
        delivery_date,
        delivery_details
    )
VALUES (
        target_quote.client_id,
        target_quote.id,
        'Aprovado',
        target_quote.total_amount,
        delivery_date_value,
        target_quote.notes
    )
RETURNING id INTO new_order_id;
END IF;
RETURN target_quote;
END;
$$;
-- Grant permissions
GRANT EXECUTE ON FUNCTION approve_quote_via_token(text) TO anon;
GRANT EXECUTE ON FUNCTION approve_quote_via_token(text) TO authenticated;