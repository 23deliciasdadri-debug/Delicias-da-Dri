-- Migration: Add notify columns to profiles (fix for missing columns)
-- This is a separate migration to ensure columns exist
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
        AND column_name = 'notify_new_orders'
) THEN
ALTER TABLE profiles
ADD COLUMN notify_new_orders BOOLEAN DEFAULT true;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
        AND column_name = 'notify_approved_quotes'
) THEN
ALTER TABLE profiles
ADD COLUMN notify_approved_quotes BOOLEAN DEFAULT true;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
        AND column_name = 'notify_delivery_reminder'
) THEN
ALTER TABLE profiles
ADD COLUMN notify_delivery_reminder BOOLEAN DEFAULT true;
END IF;
END $$;