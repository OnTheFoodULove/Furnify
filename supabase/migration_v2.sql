-- ============================================================
-- Furnify: Migration v2 — Stock, Discounts, Variants, Orders
-- Run this in Supabase SQL Editor (Database > SQL Editor)
-- ============================================================

-- ─── Users table additions ───────────────────────────────────
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS has_seen_onboarding boolean DEFAULT false;

-- ─── Furniture table additions ───────────────────────────────
ALTER TABLE public.furniture ADD COLUMN IF NOT EXISTS stock_quantity int NOT NULL DEFAULT 0;
ALTER TABLE public.furniture ADD COLUMN IF NOT EXISTS discount_percent numeric(5,2) DEFAULT 0
  CHECK (discount_percent >= 0 AND discount_percent <= 100);
ALTER TABLE public.furniture ADD COLUMN IF NOT EXISTS variants jsonb DEFAULT '[]'::jsonb;

-- ─── Orders table (NEW) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  items           jsonb NOT NULL,
  total           numeric(10,2) NOT NULL,
  delivery_address text NOT NULL,
  contact_phone   text NOT NULL,
  payment_method  text NOT NULL CHECK (payment_method IN ('COD', 'GCash', 'Bank Transfer')),
  status          text NOT NULL DEFAULT 'pending',
  created_at      timestamptz DEFAULT now()
);

-- ─── RLS for Orders ──────────────────────────────────────────
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
CREATE POLICY "Users can insert their own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  USING (public.is_admin());

-- ─── Storage: allow authenticated users to upload avatars ────
DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
CREATE POLICY "Users can upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'furniture-images'
    AND auth.uid() IS NOT NULL
  );

-- ─── Done! ───────────────────────────────────────────────────
