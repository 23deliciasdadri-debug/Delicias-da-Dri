-- Migration: Add phone column to profiles
-- The table was missing the phone column
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
        AND column_name = 'phone'
) THEN
ALTER TABLE profiles
ADD COLUMN phone TEXT;
END IF;
END $$;