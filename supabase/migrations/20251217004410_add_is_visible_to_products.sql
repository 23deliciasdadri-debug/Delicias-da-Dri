-- Add is_visible column to products table
-- This allows hiding products from the public menu without deleting them
ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;
-- Add comment to explain the column purpose
COMMENT ON COLUMN products.is_visible IS 'Whether the product is visible on the public menu';
-- Create index for faster filtering by visibility
CREATE INDEX IF NOT EXISTS idx_products_is_visible ON products (is_visible)
WHERE is_visible = true;