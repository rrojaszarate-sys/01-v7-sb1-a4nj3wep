/*
  # Remove All Security Restrictions for Demo

  **WARNING: FOR DEMONSTRATION PURPOSES ONLY**
  This migration removes all security restrictions to simplify demo access.
  NEVER apply this to production systems.

  1. Security Changes
     - Disable RLS on all tables
     - Drop all RLS policies
     - Remove authentication requirements

  2. Access Changes
     - Enable public access to all tables
     - Remove role-based restrictions
     - Simplify data access patterns

  3. Tables Affected
     - users (disable RLS, drop policies)
     - clients (disable RLS, drop policies)
     - events (disable RLS, drop policies)
     - expenses (disable RLS, drop policies)
     - incomes (disable RLS, drop policies)
     - activity_log (disable RLS, drop policies)
*/

-- Step 1: Drop all existing RLS policies
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Get all policies and drop them
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      policy_record.policyname, 
                      policy_record.schemaname, 
                      policy_record.tablename);
    END LOOP;
END $$;

-- Step 2: Disable RLS on all tables
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.incomes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.activity_log DISABLE ROW LEVEL SECURITY;

-- Step 3: Grant full public access to all tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Step 4: Create simple public access policies (if needed for Supabase compatibility)
-- These allow unrestricted access for demo purposes

-- Users table - full public access
CREATE POLICY "demo_users_all_access" ON public.users
    FOR ALL TO public
    USING (true)
    WITH CHECK (true);

-- Clients table - full public access
CREATE POLICY "demo_clients_all_access" ON public.clients
    FOR ALL TO public
    USING (true)
    WITH CHECK (true);

-- Events table - full public access
CREATE POLICY "demo_events_all_access" ON public.events
    FOR ALL TO public
    USING (true)
    WITH CHECK (true);

-- Expenses table - full public access
CREATE POLICY "demo_expenses_all_access" ON public.expenses
    FOR ALL TO public
    USING (true)
    WITH CHECK (true);

-- Incomes table - full public access
CREATE POLICY "demo_incomes_all_access" ON public.incomes
    FOR ALL TO public
    USING (true)
    WITH CHECK (true);

-- Activity log table - full public access
CREATE POLICY "demo_activity_log_all_access" ON public.activity_log
    FOR ALL TO public
    USING (true)
    WITH CHECK (true);

-- Step 5: Re-enable RLS with permissive policies
-- This ensures Supabase compatibility while allowing unrestricted access
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;