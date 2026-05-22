-- ============================================================
-- Furnify: Migration v3 — Automatic Stock Decrement on Orders
-- Run this in the Supabase SQL Editor (Database > SQL Editor)
-- ============================================================

-- 1. Create stock decrement function
CREATE OR REPLACE FUNCTION public.decrement_stock_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with owner privileges to bypass RLS on furniture
SET search_path = public
AS $$
DECLARE
  item_rec jsonb;
  f_id uuid;
  qty int;
  available_stock int;
  item_name text;
BEGIN
  -- Check if items JSONB is a valid array
  IF jsonb_typeof(NEW.items) = 'array' THEN
    FOR item_rec IN SELECT * FROM jsonb_array_elements(NEW.items) LOOP
      f_id := (item_rec->>'furniture_id')::uuid;
      qty := (item_rec->>'quantity')::int;
      item_name := item_rec->>'name';
      
      IF f_id IS NOT NULL AND qty IS NOT NULL THEN
        -- Get current stock
        SELECT stock_quantity INTO available_stock
        FROM public.furniture
        WHERE id = f_id;
        
        -- Prevent decrementing if stock is already 0, but enforce positive decrement
        UPDATE public.furniture
        SET stock_quantity = GREATEST(0, stock_quantity - qty)
        WHERE id = f_id;
        
        RAISE NOTICE 'Decremented stock for item % by % (Previous: %, New: %)', 
          item_name, qty, available_stock, GREATEST(0, available_stock - qty);
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

-- 2. Create the AFTER INSERT trigger on public.orders
DROP TRIGGER IF EXISTS trg_decrement_stock_on_order ON public.orders;
CREATE TRIGGER trg_decrement_stock_on_order
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE PROCEDURE public.decrement_stock_on_order();

-- ============================================================
-- Done! Copy and paste this script in your Supabase SQL Editor.
-- ============================================================
