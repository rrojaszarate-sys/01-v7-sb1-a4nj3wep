/*
  # Fix RLS policies for clients table

  1. Security Changes
    - Drop existing conflicting policies
    - Create simplified policies for authenticated users
    - Allow INSERT, SELECT, UPDATE for authenticated users
    - Allow DELETE only for administrators

  2. Policy Details
    - `authenticated_users_can_select_clients`: Allow SELECT for all authenticated users
    - `authenticated_users_can_insert_clients`: Allow INSERT for all authenticated users
    - `authenticated_users_can_update_clients`: Allow UPDATE for all authenticated users
    - `administrators_can_delete_clients`: Allow DELETE only for administrators
*/

-- Drop all existing policies for clients table
DROP POLICY IF EXISTS "administrators_can_delete_clients" ON clients;
DROP POLICY IF EXISTS "authenticated_users_can_insert_clients" ON clients;
DROP POLICY IF EXISTS "authenticated_users_can_read_clients" ON clients;
DROP POLICY IF EXISTS "authenticated_users_can_update_clients" ON clients;

-- Create new simplified policies
CREATE POLICY "authenticated_users_can_select_clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_users_can_insert_clients"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated_users_can_update_clients"
  ON clients
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "administrators_can_delete_clients"
  ON clients
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'Administrador'
    )
  );