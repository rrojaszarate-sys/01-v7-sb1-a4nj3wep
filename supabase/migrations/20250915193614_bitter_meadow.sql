/*
  # Fix RLS policies for clients table with proper role validation

  1. Security Changes
    - Drop all existing conflicting policies on clients table
    - Create new policies that properly validate user roles from public.users table
    - Allow INSERT/UPDATE for Administrador and Ejecutivo roles
    - Allow SELECT for all authenticated users
    - Restrict DELETE to Administrador role only

  2. Policy Structure
    - Uses EXISTS clause to check user role in public.users table
    - Matches auth.uid() with users.id for proper authentication
    - Validates role against allowed values ('Administrador', 'Ejecutivo')
*/

-- Drop all existing policies on clients table to avoid conflicts
DROP POLICY IF EXISTS "administrators_can_delete_clients" ON clients;
DROP POLICY IF EXISTS "authenticated_users_can_insert_clients" ON clients;
DROP POLICY IF EXISTS "authenticated_users_can_select_clients" ON clients;
DROP POLICY IF EXISTS "authenticated_users_can_update_clients" ON clients;
DROP POLICY IF EXISTS "Allow authenticated users to read clients" ON clients;
DROP POLICY IF EXISTS "Allow authenticated users to insert clients" ON clients;
DROP POLICY IF EXISTS "Allow authenticated users to update clients" ON clients;
DROP POLICY IF EXISTS "Allow administrators to delete clients" ON clients;

-- Create new policies with proper role validation

-- Allow all authenticated users to read clients
CREATE POLICY "authenticated_users_can_read_clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('Administrador', 'Ejecutivo')
    )
  );

-- Allow users with proper roles to insert clients
CREATE POLICY "role_based_insert_clients"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('Administrador', 'Ejecutivo')
    )
  );

-- Allow users with proper roles to update clients
CREATE POLICY "role_based_update_clients"
  ON clients
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('Administrador', 'Ejecutivo')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('Administrador', 'Ejecutivo')
    )
  );

-- Only administrators can delete clients
CREATE POLICY "administrators_can_delete_clients"
  ON clients
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'Administrador'
    )
  );