-- Migration: Add function to get business contact phone (admin phone)
-- This is used in public quote preview so clients can contact the business
CREATE OR REPLACE FUNCTION get_business_contact_phone() RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE admin_phone text;
BEGIN -- Get the phone from the first admin profile
SELECT phone INTO admin_phone
FROM profiles
WHERE role = 'admin'
    AND phone IS NOT NULL
ORDER BY created_at ASC
LIMIT 1;
RETURN admin_phone;
END;
$$;
-- Grant execute permission to anonymous users (for public pages)
GRANT EXECUTE ON FUNCTION get_business_contact_phone() TO anon;
GRANT EXECUTE ON FUNCTION get_business_contact_phone() TO authenticated;