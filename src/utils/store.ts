import { supabase } from './supabase';

// Helper — get the current logged-in user's ID
export const getCurrentUserId = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
};

export type Property = {
  id: string;
  name: string;
  address: string;
  annualRent: number;
  imageUrl?: string;
  user_id?: string;
  created_at?: string;
};

export type TenantContract = {
  id: string;
  tenantName: string;
  propertyId: string;
  startDate: string;
  endDate: string;
  calendarMode: 'gregorian' | 'hijri';
  paymentPlan: 'Monthly' | '3 Month' | '6 Month' | 'Yearly';
  isActive: boolean;
  user_id?: string;
  created_at?: string;
};

export type ContractLedger = {
  id: string;
  tenantId: string;
  dueDate: string;
  amount: number;
  status: 'Pending' | 'Paid';
  paymentMode: 'Cash' | 'Bank' | 'Online' | null;
  paidDate: string | null;
  user_id?: string;
  created_at?: string;
};

export type Expense = {
  id: string;
  category: string;
  amount: number;
  paymentMode: 'Cash' | 'Bank' | 'Online';
  date: string;
  description: string;
  user_id?: string;
  created_at?: string;
};

// --- PROPERTIES ---
// SELECT: RLS automatically filters by auth.uid() = user_id once policies are enabled
export const getProperties = async (): Promise<Property[]> => {
  const { data, error } = await supabase.from('properties').select('*').order('created_at', { ascending: false });
  if (error) { console.error('Error fetching properties', error); return []; }
  return data as Property[];
};

export const saveProperty = async (prop: Omit<Property, 'id' | 'created_at' | 'user_id'>): Promise<Property | null> => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase.from('properties').insert([{ ...prop, user_id: userId }]).select().single();
  if (error) { console.error('Error saving property', error); return null; }
  return data;
};

export const updateProperty = async (updated: Property): Promise<Property | null> => {
  const { data, error } = await supabase.from('properties').update(updated).eq('id', updated.id).select().single();
  if (error) { console.error('Error updating property', error); return null; }
  return data;
};

export const deleteProperty = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from('properties').delete().eq('id', id);
  if (error) { console.error('Error deleting property', error); return false; }
  return true;
};

// --- TENANTS ---
export const getTenants = async (): Promise<TenantContract[]> => {
  const { data, error } = await supabase.from('tenants').select('*').order('created_at', { ascending: false });
  if (error) { console.error('Error fetching tenants', error); return []; }
  return data as TenantContract[];
};

export const saveTenant = async (tenant: Omit<TenantContract, 'id' | 'created_at' | 'user_id'>): Promise<TenantContract | null> => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase.from('tenants').insert([{ ...tenant, user_id: userId }]).select().single();
  if (error) { console.error('Error saving tenant', error); return null; }
  return data;
};

export const updateTenant = async (updated: TenantContract): Promise<TenantContract | null> => {
  const { data, error } = await supabase.from('tenants').update(updated).eq('id', updated.id).select().single();
  if (error) { console.error('Error updating tenant', error); return null; }
  return data;
};

export const deleteTenant = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from('tenants').delete().eq('id', id);
  if (error) { console.error('Error deleting tenant', error); return false; }
  return true;
};

export const endTenantContract = async (id: string, leaveDate: string): Promise<boolean> => {
  const { error } = await supabase.from('tenants').update({ endDate: leaveDate, isActive: false }).eq('id', id);
  if (error) { console.error('Error ending tenant contract', error); return false; }
  return true;
};

// --- CONTRACT LEDGERS ---
export const getLedgersByTenant = async (tenantId: string): Promise<ContractLedger[]> => {
  const { data, error } = await supabase.from('contract_ledger').select('*').eq('tenantId', tenantId).order('dueDate', { ascending: true });
  if (error) { console.error('Error fetching ledgers', error); return []; }
  return data || [];
};

export const getAllLedgers = async (): Promise<ContractLedger[]> => {
  const { data, error } = await supabase.from('contract_ledger').select('*').order('dueDate', { ascending: true });
  if (error) { console.error('Error fetching all ledgers', error); return []; }
  return data || [];
};

export const saveLedgers = async (ledgers: Omit<ContractLedger, 'id' | 'created_at'>[]): Promise<boolean> => {
  if (ledgers.length === 0) return true;
  const userId = await getCurrentUserId();
  const withUser = ledgers.map(l => ({ ...l, user_id: userId }));
  const { error } = await supabase.from('contract_ledger').insert(withUser);
  if (error) { console.error('Error saving ledgers', error); return false; }
  return true;
};

export const updateLedgerPaymentStatus = async (
  ledgerId: string,
  status: 'Pending' | 'Paid',
  paymentMode: 'Cash' | 'Bank' | 'Online' | null,
  paidDate: string | null
): Promise<boolean> => {
  const { error } = await supabase.from('contract_ledger').update({ status, paymentMode, paidDate }).eq('id', ledgerId);
  if (error) { console.error('Error updating ledger', error); return false; }
  return true;
};

export const deleteLedger = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from('contract_ledger').delete().eq('id', id);
  if (error) {
    console.error('Error deleting ledger', error);
    alert('Database Error: ' + error.message);
    return false;
  }
  return true;
};

// --- EXPENSES ---
export const getExpenses = async (): Promise<Expense[]> => {
  const { data, error } = await supabase.from('expenses').select('*').order('created_at', { ascending: false });
  if (error) { console.error('Error fetching expenses', error); return []; }
  return data as Expense[];
};

export const saveExpense = async (expense: Omit<Expense, 'id' | 'created_at' | 'user_id'>): Promise<Expense | null> => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase.from('expenses').insert([{ ...expense, user_id: userId }]).select().single();
  if (error) { console.error('Error saving expense', error); return null; }
  return data;
};

export const updateExpense = async (updated: Expense): Promise<Expense | null> => {
  const { data, error } = await supabase.from('expenses').update(updated).eq('id', updated.id).select().single();
  if (error) { console.error('Error updating expense', error); return null; }
  return data;
};

export const deleteExpense = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) { console.error('Error deleting expense', error); return false; }
  return true;
};

// --- IMPORT (bulk insert with user_id override) ---
export const importProperties = async (rows: Omit<Property, 'id' | 'created_at' | 'user_id'>[]): Promise<number> => {
  const userId = await getCurrentUserId();
  const withUser = rows.map(r => ({ ...r, user_id: userId }));
  const { data, error } = await supabase.from('properties').insert(withUser).select();
  if (error) { console.error('Error importing properties', error); return 0; }
  return data?.length ?? 0;
};

export const importTenants = async (rows: Omit<TenantContract, 'id' | 'created_at' | 'user_id'>[]): Promise<number> => {
  const userId = await getCurrentUserId();
  const withUser = rows.map(r => ({ ...r, user_id: userId }));
  const { data, error } = await supabase.from('tenants').insert(withUser).select();
  if (error) { console.error('Error importing tenants', error); return 0; }
  return data?.length ?? 0;
};

export const importExpenses = async (rows: Omit<Expense, 'id' | 'created_at' | 'user_id'>[]): Promise<number> => {
  const userId = await getCurrentUserId();
  const withUser = rows.map(r => ({ ...r, user_id: userId }));
  const { data, error } = await supabase.from('expenses').insert(withUser).select();
  if (error) { console.error('Error importing expenses', error); return 0; }
  return data?.length ?? 0;
};

// --- INVITATIONS ---
export type Invitation = {
  id: string;
  inviter_id: string;
  invitee_email: string;
  invitee_id: string | null;
  status: 'pending' | 'accepted' | 'revoked';
  created_at?: string;
};

export const sendInvitation = async (inviteeEmail: string): Promise<{ ok: boolean; error?: string }> => {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: 'Not logged in' };

  // Check if already invited
  const { data: existing } = await supabase
    .from('invitations')
    .select('id, status')
    .eq('inviter_id', userId)
    .eq('invitee_email', inviteeEmail)
    .single();

  if (existing && existing.status !== 'revoked') {
    return { ok: false, error: 'This email is already invited.' };
  }

  // Insert invitation record
  const { error } = await supabase.from('invitations').insert([{
    inviter_id: userId,
    invitee_email: inviteeEmail,
    status: 'pending',
  }]);
  if (error) return { ok: false, error: error.message };

  return { ok: true };
};

export const getMyInvitations = async (): Promise<Invitation[]> => {
  const userId = await getCurrentUserId();
  if (!userId) return [];
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('inviter_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error('Error fetching invitations', error); return []; }
  return data as Invitation[];
};

export const revokeInvitation = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from('invitations').update({ status: 'revoked' }).eq('id', id);
  if (error) { console.error('Error revoking invitation', error); return false; }
  return true;
};

/** Call this after a user logs in — links any pending invitations for their email to their user ID */
export const acceptPendingInvitations = async (): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return;
  await supabase
    .from('invitations')
    .update({ invitee_id: user.id, status: 'accepted' })
    .eq('invitee_email', user.email)
    .eq('status', 'pending');
};

