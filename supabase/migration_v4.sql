-- ============================================================
-- Furnify: Migration v4 — Cart Items Variants Support
-- Run this in the Supabase SQL Editor (Database > SQL Editor)
-- ============================================================

-- 1. Add selected_variant column to cart_items table
ALTER TABLE public.cart_items ADD COLUMN IF NOT EXISTS selected_variant jsonb DEFAULT NULL;

-- 2. Drop the unique constraint (user_id, furniture_id) to allow multiple variants of the same product
ALTER TABLE public.cart_items DROP CONSTRAINT IF EXISTS cart_items_user_id_furniture_id_key;
