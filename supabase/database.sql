-- ============================================================
-- Writers Block - Complete Database Schema
--
-- Idempotent: safe to re-run in Supabase SQL Editor (adds missing
-- columns, IF NOT EXISTS indexes/constraints, replaces functions).
--
-- Objects: profiles, master_admin_users, subscriptions, projects, documents, usage_logs,
-- razorpay_payments, storage bucket `documents`, helper functions
-- (apply_subscription_payment, admin_subscription_group_counts).
-- ============================================================

-- =========================
-- 1) EXTENSIONS
-- =========================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- Reserved for future fuzzy search / pg_trgm indexes on titles, etc.
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =========================
-- 2) TABLES (dependency order)
-- =========================

-- profiles: extends auth.users with public display fields
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email       TEXT        NOT NULL,
  full_name   TEXT,
  avatar_url  TEXT,
  bio         TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Platform operators: /master-admin and /dashboard/admin (auth still uses auth.users; privileges are isolated here).
-- Grant/revoke workflow and env notes: docs/admin-operators.md (repo root).
-- Grant access: INSERT INTO public.master_admin_users (user_id) VALUES ('<auth.users.id>');
CREATE TABLE IF NOT EXISTS public.master_admin_users (
  user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  note        TEXT
);

-- subscriptions: one row per user, plan, Razorpay ids (billing_cycle + expiry added in §2a for legacy compatibility)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                    UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan                  TEXT        CHECK (plan IN ('free', 'pro', 'premium')) DEFAULT 'free' NOT NULL,
  projects_limit        INTEGER     DEFAULT 5 NOT NULL,
  status                TEXT        CHECK (status IN ('active', 'cancelled', 'expired')) DEFAULT 'active' NOT NULL,
  current_period_start  TIMESTAMPTZ DEFAULT NOW(),
  current_period_end    TIMESTAMPTZ,
  razorpay_order_id     TEXT,
  razorpay_payment_id   TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at            TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- projects: screenplays
CREATE TABLE IF NOT EXISTS public.projects (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title       TEXT        NOT NULL,
  description TEXT,
  genre       TEXT,
  characters  TEXT,
  location    TEXT,
  mood        TEXT,
  content     TEXT        DEFAULT '',
  status      TEXT        CHECK (status IN ('draft', 'in_progress', 'completed')) DEFAULT 'draft' NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- documents: file attachments in Supabase Storage
CREATE TABLE IF NOT EXISTS public.documents (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id    UUID        REFERENCES public.projects(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  type          TEXT        NOT NULL,
  size          INTEGER,
  storage_path  TEXT        NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- usage_logs: AI endpoint audit (anon client inserts with JWT; RLS enforces own user_id)
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  endpoint    TEXT        NOT NULL,
  plan        TEXT        DEFAULT 'free' NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- razorpay_payments: payment ledger; apply_subscription_payment extends subscription
CREATE TABLE IF NOT EXISTS public.razorpay_payments (
  id                  UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  razorpay_payment_id TEXT        NOT NULL,
  razorpay_order_id   TEXT        NOT NULL,
  amount              INTEGER,
  plan                TEXT        NOT NULL CHECK (plan IN ('pro', 'premium')),
  billing_cycle       TEXT        NOT NULL CHECK (billing_cycle IN ('monthly', 'annual')),
  created_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT razorpay_payments_payment_id_key UNIQUE (razorpay_payment_id)
);

-- 2a) Subscriptions: billing + expiry (idempotent; safe on existing DBs)
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT
  DEFAULT 'monthly'
  CHECK (billing_cycle IN ('monthly', 'annual'));

-- Unique on razorpay_payment_id (fails if duplicate non-null values exist; NULLs are allowed, multiple NULLs in PG)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_razorpay_payment_id'
  ) THEN
    ALTER TABLE public.subscriptions
      ADD CONSTRAINT unique_razorpay_payment_id UNIQUE (razorpay_payment_id);
  END IF;
END $$;

-- Pre-check: SELECT razorpay_payment_id, COUNT(*) FROM public.subscriptions GROUP BY 1 HAVING COUNT(*) > 1;

-- Cron email deduplication; cleared on renewal (verify / webhook)
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS expiry_warning_sent_at TIMESTAMPTZ;

-- =========================
-- 3) INDEXES
-- ============================
DROP INDEX IF EXISTS projects_user_id_idx;
DROP INDEX IF EXISTS projects_updated_at_idx;
DROP INDEX IF EXISTS documents_user_id_idx;
DROP INDEX IF EXISTS documents_project_id_idx;

CREATE INDEX IF NOT EXISTS projects_user_updated_idx
  ON public.projects(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS projects_user_status_idx
  ON public.projects(user_id, status);

CREATE INDEX IF NOT EXISTS projects_active_idx
  ON public.projects(user_id, updated_at DESC)
  WHERE status IN ('draft', 'in_progress');

CREATE INDEX IF NOT EXISTS projects_search_idx
  ON public.projects
  USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

CREATE INDEX IF NOT EXISTS subscriptions_user_plan_idx
  ON public.subscriptions(user_id, plan);

CREATE INDEX IF NOT EXISTS documents_project_lookup_idx
  ON public.documents(project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS profiles_email_idx
  ON public.profiles(email);

CREATE INDEX IF NOT EXISTS usage_logs_user_date_idx
  ON public.usage_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS usage_logs_endpoint_date_idx
  ON public.usage_logs(endpoint, created_at DESC);

-- Time-range admin / analytics scans on large usage_logs
CREATE INDEX IF NOT EXISTS usage_logs_created_at_idx
  ON public.usage_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS razorpay_payments_user_created_idx
  ON public.razorpay_payments(user_id, created_at DESC);

-- =========================
-- 4) FUNCTIONS
-- =========================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.enforce_project_limit_before_insert()
RETURNS TRIGGER AS $$
DECLARE
  lim int;
  cnt int;
  sub_status text;
  sub_limit int;
BEGIN
  SELECT status, projects_limit INTO sub_status, sub_limit
  FROM public.subscriptions
  WHERE user_id = NEW.user_id;

  IF NOT FOUND THEN
    lim := 5;
  ELSIF sub_status IS DISTINCT FROM 'active' THEN
    lim := 5;
  ELSE
    lim := COALESCE(sub_limit, 5);
  END IF;

  SELECT COUNT(*)::int INTO cnt FROM public.projects WHERE user_id = NEW.user_id;
  IF cnt >= lim THEN
    RAISE EXCEPTION 'project_limit_reached';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.subscriptions (user_id, plan, projects_limit)
  VALUES (NEW.id, 'free', 5)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.apply_subscription_payment(
  p_user_id UUID,
  p_payment_id TEXT,
  p_order_id TEXT,
  p_plan TEXT,
  p_billing_cycle TEXT,
  p_amount INTEGER
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_id UUID;
  v_days INTEGER;
  v_existing_end TIMESTAMPTZ;
  v_new_end TIMESTAMPTZ;
  v_base TIMESTAMPTZ;
  v_projects_limit INTEGER;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  IF p_plan IS NULL OR p_plan NOT IN ('pro', 'premium')
     OR p_billing_cycle IS NULL OR p_billing_cycle NOT IN ('monthly', 'annual') THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'invalid plan or billing_cycle');
  END IF;

  INSERT INTO public.razorpay_payments (
    user_id, razorpay_payment_id, razorpay_order_id, amount, plan, billing_cycle
  )
  VALUES (p_user_id, p_payment_id, p_order_id, p_amount, p_plan, p_billing_cycle)
  ON CONFLICT (razorpay_payment_id) DO NOTHING
  RETURNING id INTO v_new_id;

  IF v_new_id IS NULL THEN
    RETURN jsonb_build_object('status', 'duplicate');
  END IF;

  v_days := CASE WHEN p_billing_cycle = 'annual' THEN 365 ELSE 30 END;
  v_projects_limit := CASE p_plan WHEN 'pro' THEN 25 WHEN 'premium' THEN 999999 ELSE 5 END;

  SELECT current_period_end INTO v_existing_end
  FROM public.subscriptions
  WHERE user_id = p_user_id;

  v_base := GREATEST(COALESCE(v_existing_end, v_now), v_now);
  v_new_end := v_base + (v_days * INTERVAL '1 day');

  UPDATE public.subscriptions
  SET
    plan = p_plan,
    projects_limit = v_projects_limit,
    status = 'active',
    billing_cycle = p_billing_cycle,
    current_period_start = v_now,
    current_period_end = v_new_end,
    razorpay_order_id = p_order_id,
    razorpay_payment_id = p_payment_id,
    expiry_warning_sent_at = NULL,
    updated_at = v_now
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'subscription row missing for user %', p_user_id;
  END IF;

  RETURN jsonb_build_object(
    'status', 'applied',
    'current_period_end', v_new_end,
    'plan', p_plan,
    'billing_cycle', p_billing_cycle
  );
END;
$$;

REVOKE ALL ON FUNCTION public.apply_subscription_payment(UUID, TEXT, TEXT, TEXT, TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_subscription_payment(UUID, TEXT, TEXT, TEXT, TEXT, INTEGER) TO service_role;

CREATE OR REPLACE FUNCTION public.admin_subscription_group_counts()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'plan', g.plan,
        'status', g.status,
        'billing_cycle', g.billing_cycle,
        'cnt', g.cnt
      )
    ),
    '[]'::jsonb
  )
  FROM (
    SELECT
      plan::text,
      status::text,
      COALESCE(billing_cycle, 'monthly')::text AS billing_cycle,
      COUNT(*)::bigint AS cnt
    FROM public.subscriptions
    GROUP BY plan, status, COALESCE(billing_cycle, 'monthly')
  ) g;
$$;

REVOKE ALL ON FUNCTION public.admin_subscription_group_counts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_subscription_group_counts() TO service_role;

-- =========================
-- 5) TRIGGERS
-- =========================

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_projects_updated_at ON public.projects;
CREATE TRIGGER set_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS enforce_project_limit_on_insert ON public.projects;
CREATE TRIGGER enforce_project_limit_on_insert
  BEFORE INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.enforce_project_limit_before_insert();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================
-- 6) ROW LEVEL SECURITY
-- =========================

ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.razorpay_payments ENABLE ROW LEVEL SECURITY;

-- profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- master_admin_users: no client policies — only service_role (bypasses RLS) may read/write.

-- subscriptions
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscriptions;
CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- projects
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;
CREATE POLICY "Users can view their own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

-- documents
DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can upload their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON public.documents;
CREATE POLICY "Users can view their own documents"
  ON public.documents FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can upload their own documents"
  ON public.documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own documents"
  ON public.documents FOR DELETE
  USING (auth.uid() = user_id);

-- usage_logs: users read own rows; inserts must be their own user_id (no spoofing)
DROP POLICY IF EXISTS "Users can view own usage" ON public.usage_logs;
DROP POLICY IF EXISTS "Service can insert usage" ON public.usage_logs;
DROP POLICY IF EXISTS "Users can insert own usage logs" ON public.usage_logs;
CREATE POLICY "Users can view own usage"
  ON public.usage_logs FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own usage logs"
  ON public.usage_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- razorpay_payments
DROP POLICY IF EXISTS "Users can view own razorpay payments" ON public.razorpay_payments;
CREATE POLICY "Users can view own razorpay payments"
  ON public.razorpay_payments FOR SELECT
  USING (auth.uid() = user_id);

-- =========================
-- 7) STORAGE
-- =========================
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;

CREATE POLICY "Users can upload their own documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read their own documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- =========================
-- 8) STATISTICS
-- =========================
ANALYZE public.profiles;
ANALYZE public.master_admin_users;
ANALYZE public.subscriptions;
ANALYZE public.projects;
ANALYZE public.documents;
ANALYZE public.usage_logs;
ANALYZE public.razorpay_payments;

SELECT 'Database schema created successfully!' AS status;
