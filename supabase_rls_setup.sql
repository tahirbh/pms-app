-- Supabase Row Level Security (RLS) Configuration Script
-- Instructions: Run this script sequentially in your Supabase SQL Editor.

-- 1. Enable RLS on all tables
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies (if any exist) to ensure clean slate
DROP POLICY IF EXISTS "Users can view and manage their own properties" ON properties;
DROP POLICY IF EXISTS "Users can view and manage their own tenants" ON tenants;
DROP POLICY IF EXISTS "Users can view and manage their own ledgers" ON contract_ledger;
DROP POLICY IF EXISTS "Users can view and manage their own expenses" ON expenses;
DROP POLICY IF EXISTS "Invitations policy" ON invitations;

-- 3. Create unified access policies including Team Access.
-- Users should access a row if they own it OR if they accepted an invite from the owner.

-- Properties Policy
CREATE POLICY "Property Access Policy" ON properties FOR ALL USING (
  user_id = auth.uid() OR 
  auth.uid() IN (
    SELECT invitee_id FROM invitations 
    WHERE inviter_id = properties.user_id AND status = 'accepted'
  )
);

-- Tenants Policy
CREATE POLICY "Tenant Access Policy" ON tenants FOR ALL USING (
  user_id = auth.uid() OR 
  auth.uid() IN (
    SELECT invitee_id FROM invitations 
    WHERE inviter_id = tenants.user_id AND status = 'accepted'
  )
);

-- Contract Ledger Policy 
CREATE POLICY "Ledger Access Policy" ON contract_ledger FOR ALL USING (
  user_id = auth.uid() OR 
  auth.uid() IN (
    SELECT invitee_id FROM invitations 
    WHERE inviter_id = contract_ledger.user_id AND status = 'accepted'
  )
);

-- Expenses Policy
CREATE POLICY "Expense Access Policy" ON expenses FOR ALL USING (
  user_id = auth.uid() OR 
  auth.uid() IN (
    SELECT invitee_id FROM invitations 
    WHERE inviter_id = expenses.user_id AND status = 'accepted'
  )
);

-- Invitations Policy
-- Users can see invitations they authored, OR invitations sent to their email/account.
CREATE POLICY "Invitations Access Policy" ON invitations FOR ALL USING (
  inviter_id = auth.uid() OR 
  invitee_id = auth.uid() OR 
  invitee_email = auth.jwt() ->> 'email'
);
