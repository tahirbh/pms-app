-- Supabase RLS Fix: Eradicate Rogue Policies & Use Security Definer
-- Instructions: Run this script sequentially in your Supabase SQL Editor.

-- 1. Ensure basic schema and table permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 2. Dynamically drop ALL existing policies on our core tables to remove any hidden rogue policies
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('properties', 'tenants', 'contract_ledger', 'expenses', 'invitations')) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 3. Enable RLS on core tables
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- 4. Create a SECURITY DEFINER function to safely check invitations 
-- This runs as the admin, bypassing any "permission denied" errors when joining or querying nested tables!
CREATE OR REPLACE FUNCTION get_accepted_inviters_text()
RETURNS SETOF text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT inviter_id::text FROM invitations WHERE invitee_id::text = auth.uid()::text AND status = 'accepted';
$$;

-- 5. Create fresh, bulletproof policies using the new function
-- ADMIN ID: be641cfa-a6d2-4e92-bd52-22668655bb2a

CREATE POLICY "Property Access Policy" ON properties FOR ALL USING (
  user_id::text = auth.uid()::text OR 
  auth.uid()::text = 'be641cfa-a6d2-4e92-bd52-22668655bb2a' OR
  user_id::text IN (SELECT get_accepted_inviters_text())
);

CREATE POLICY "Tenant Access Policy" ON tenants FOR ALL USING (
  user_id::text = auth.uid()::text OR 
  auth.uid()::text = 'be641cfa-a6d2-4e92-bd52-22668655bb2a' OR
  user_id::text IN (SELECT get_accepted_inviters_text())
);

CREATE POLICY "Ledger Access Policy" ON contract_ledger FOR ALL USING (
  user_id::text = auth.uid()::text OR 
  auth.uid()::text = 'be641cfa-a6d2-4e92-bd52-22668655bb2a' OR
  user_id::text IN (SELECT get_accepted_inviters_text())
);

CREATE POLICY "Expense Access Policy" ON expenses FOR ALL USING (
  user_id::text = auth.uid()::text OR 
  auth.uid()::text = 'be641cfa-a6d2-4e92-bd52-22668655bb2a' OR
  user_id::text IN (SELECT get_accepted_inviters_text())
);

CREATE POLICY "Invitation Access Policy" ON invitations FOR ALL USING (
  inviter_id::text = auth.uid()::text OR 
  invitee_id::text = auth.uid()::text OR
  auth.uid()::text = 'be641cfa-a6d2-4e92-bd52-22668655bb2a'
);


