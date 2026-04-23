import { supabase } from './supabase';

// Helper — get the current logged-in user's ID
export const getCurrentUserId = async (): Promise<string | null> => {
  if (localStorage.getItem('is_guest') === 'true') return 'guest-user';
  
  // Check for impersonation (for admin verification)
  const impersonated = localStorage.getItem('impersonated_user_id');
  
  const { data: { user } } = await supabase.auth.getUser();
  const actualId = user?.id ?? null;

  if (impersonated) {
    console.log('[DEBUG] Impersonating:', impersonated, '| Actual User:', actualId);
    return impersonated;
  }

  return actualId;
};

/** Get the ACTUAL logged in user (ignoring impersonation) */
export const getActualUserId = async (): Promise<string | null> => {
  if (localStorage.getItem('is_guest') === 'true') return 'guest-user';
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
};

export const ADMIN_ID = 'be641cfa-a6d2-4e92-bd52-22668655bb2a';

export const isAuthorizedAdmin = async (): Promise<boolean> => {
  const actualId = await getActualUserId();
  return actualId === ADMIN_ID;
};

export const setImpersonation = (userId: string | null) => {
  if (userId) localStorage.setItem('impersonated_user_id', userId);
  else localStorage.removeItem('impersonated_user_id');
};

export const getImpersonatedId = (): string | null => {
  return localStorage.getItem('impersonated_user_id');
};

const isGuest = () => localStorage.getItem('is_guest') === 'true';

const localDB = {
  get: (key: string) => JSON.parse(localStorage.getItem(`guest_${key}`) || '[]'),
  save: (key: string, data: any) => localStorage.setItem(`guest_${key}`, JSON.stringify(data)),
  add: (key: string, item: any) => {
    const list = localDB.get(key);
    const newItem = { 
      ...item, 
      id: Math.random().toString(36).substr(2, 9), 
      created_at: new Date().toISOString() 
    };
    list.unshift(newItem);
    localDB.save(key, list);
    return newItem;
  },
  update: (key: string, updated: any) => {
    const list = localDB.get(key);
    const idx = list.findIndex((x: any) => x.id === updated.id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updated };
      localDB.save(key, list);
    }
    return updated;
  },
  delete: (key: string, id: string) => {
    const list = localDB.get(key);
    localDB.save(key, list.filter((x: any) => x.id !== id));
    return true;
  }
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
  iqamaNumber?: string;
  sponsorName?: string;
  mobileNumber?: string;
  annualRent?: number;
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
  if (isGuest()) return localDB.get('properties');
  const userId = await getCurrentUserId();
  let query = supabase.from('properties').select('*');
  if (userId) query = query.eq('user_id', userId);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) { 
    console.error('Error fetching properties', error); 
    alert(`DB Error (properties): ${error.message || JSON.stringify(error)}`);
    return []; 
  }
  return data as Property[];
};

export const saveProperty = async (prop: Omit<Property, 'id' | 'created_at' | 'user_id'>): Promise<Property | null> => {
  if (isGuest()) return localDB.add('properties', prop);
  const userId = await getCurrentUserId();
  const { data, error } = await supabase.from('properties').insert([{ ...prop, user_id: userId }]).select().single();
  if (error) { console.error('Error saving property', error); return null; }
  return data;
};

export const updateProperty = async (updated: Property): Promise<Property | null> => {
  if (isGuest()) return localDB.update('properties', updated);
  const { data, error } = await supabase.from('properties').update(updated).eq('id', updated.id).select().single();
  if (error) { console.error('Error updating property', error); return null; }
  return data;
};

export const deleteProperty = async (id: string): Promise<boolean> => {
  if (isGuest()) return localDB.delete('properties', id);
  const { error } = await supabase.from('properties').delete().eq('id', id);
  if (error) { console.error('Error deleting property', error); return false; }
  return true;
};

// --- TENANTS ---
export const getTenants = async (): Promise<TenantContract[]> => {
  if (isGuest()) return localDB.get('tenants');
  const userId = await getCurrentUserId();
  let query = supabase.from('tenants').select('*');
  if (userId) query = query.eq('user_id', userId);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) { 
    console.error('Error fetching tenants', error); 
    alert(`DB Error (tenants): ${error.message || JSON.stringify(error)}`);
    return []; 
  }
  return data as TenantContract[];
};

export const saveTenant = async (tenant: Omit<TenantContract, 'id' | 'created_at' | 'user_id'>): Promise<TenantContract | null> => {
  if (isGuest()) return localDB.add('tenants', tenant);
  const userId = await getCurrentUserId();
  const { data, error } = await supabase.from('tenants').insert([{ ...tenant, user_id: userId }]).select().single();
  if (error) { console.error('Error saving tenant', error); return null; }
  return data;
};

export const updateTenant = async (updated: TenantContract): Promise<TenantContract | null> => {
  if (isGuest()) return localDB.update('tenants', updated);
  const { data, error } = await supabase.from('tenants').update(updated).eq('id', updated.id).select().single();
  if (error) { console.error('Error updating tenant', error); return null; }
  return data;
};

export const deleteTenant = async (id: string): Promise<boolean> => {
  if (isGuest()) return localDB.delete('tenants', id);
  const { error } = await supabase.from('tenants').delete().eq('id', id);
  if (error) { console.error('Error deleting tenant', error); return false; }
  return true;
};

export const endTenantContract = async (id: string, leaveDate: string): Promise<boolean> => {
  if (isGuest()) {
    const list = localDB.get('tenants');
    const idx = list.findIndex((x: any) => x.id === id);
    if (idx !== -1) {
      list[idx].endDate = leaveDate;
      list[idx].isActive = false;
      localDB.save('tenants', list);
    }
    return true;
  }
  const { error } = await supabase.from('tenants').update({ endDate: leaveDate, isActive: false }).eq('id', id);
  if (error) { console.error('Error ending tenant contract', error); return false; }
  return true;
};

// --- CONTRACT LEDGERS ---
export const getLedgersByTenant = async (tenantId: string): Promise<ContractLedger[]> => {
  if (isGuest()) return localDB.get('contract_ledger').filter((x: any) => x.tenantId === tenantId);
  const userId = await getCurrentUserId();
  let query = supabase.from('contract_ledger').select('*').eq('tenantId', tenantId);
  if (userId) query = query.eq('user_id', userId);

  const { data, error } = await query.order('dueDate', { ascending: true });
  if (error) { 
    console.error('Error fetching ledgers', error); 
    alert(`DB Error (ledgers): ${error.code} - ${error.message} - ${error.details || ''}`);
    return []; 
  }
  return data || [];
};

export const getAllLedgers = async (): Promise<ContractLedger[]> => {
  if (isGuest()) return localDB.get('contract_ledger');
  const userId = await getCurrentUserId();
  let query = supabase.from('contract_ledger').select('*');
  if (userId) query = query.eq('user_id', userId);

  const { data, error } = await query.order('dueDate', { ascending: true });
  if (error) { 
    console.error('Error fetching all ledgers', error); 
    alert(`DB Error (all ledgers): ${error.code} - ${error.message} - ${error.details || ''}`);
    return []; 
  }
  return data || [];
};

export const saveLedgers = async (ledgers: Omit<ContractLedger, 'id' | 'created_at'>[]): Promise<boolean> => {
  if (ledgers.length === 0) return true;
  if (isGuest()) {
    const list = localDB.get('contract_ledger');
    const newItems = ledgers.map(l => ({ ...l, id: Math.random().toString(36).substr(2, 9), created_at: new Date().toISOString() }));
    localDB.save('contract_ledger', [...newItems, ...list]);
    return true;
  }
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
  if (isGuest()) {
    const list = localDB.get('contract_ledger');
    const idx = list.findIndex((x: any) => x.id === ledgerId);
    if (idx !== -1) {
      list[idx] = { ...list[idx], status, paymentMode, paidDate };
      localDB.save('contract_ledger', list);
    }
    return true;
  }
  const { error } = await supabase.from('contract_ledger').update({ status, paymentMode, paidDate }).eq('id', ledgerId);
  if (error) { console.error('Error updating ledger', error); return false; }
  return true;
};

export const updateLedger = async (id: string, updates: Partial<ContractLedger>): Promise<boolean> => {
  if (isGuest()) {
    const list = localDB.get('contract_ledger');
    const idx = list.findIndex((x: any) => x.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      localDB.save('contract_ledger', list);
    }
    return true;
  }
  const { error } = await supabase.from('contract_ledger').update(updates).eq('id', id);
  if (error) { console.error('Error updating ledger', error); return false; }
  return true;
};

export const deleteLedger = async (id: string): Promise<boolean> => {
  if (isGuest()) return localDB.delete('contract_ledger', id);
  const { error } = await supabase.from('contract_ledger').delete().eq('id', id);
  if (error) {
    console.error('Error deleting ledger', error);
    alert('Database Error: ' + error.message);
    return false;
  }
  return true;
};

export const deleteLedgersByTenant = async (tenantId: string): Promise<boolean> => {
  if (isGuest()) {
    const list = localDB.get('contract_ledger');
    localDB.save('contract_ledger', list.filter((x: any) => x.tenantId !== tenantId));
    return true;
  }
  const { error } = await supabase.from('contract_ledger').delete().eq('tenantId', tenantId);
  if (error) { console.error('Error deleting tenant ledgers', error); return false; }
  return true;
};

// --- EXPENSES ---
export const getExpenses = async (): Promise<Expense[]> => {
  if (isGuest()) return localDB.get('expenses');
  const userId = await getCurrentUserId();
  let query = supabase.from('expenses').select('*');
  if (userId) query = query.eq('user_id', userId);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) { console.error('Error fetching expenses', error); return []; }
  return data as Expense[];
};

export const saveExpense = async (expense: Omit<Expense, 'id' | 'created_at' | 'user_id'>): Promise<Expense | null> => {
  if (isGuest()) return localDB.add('expenses', expense);
  const userId = await getCurrentUserId();
  const { data, error } = await supabase.from('expenses').insert([{ ...expense, user_id: userId }]).select().single();
  if (error) { console.error('Error saving expense', error); return null; }
  return data;
};

export const updateExpense = async (updated: Expense): Promise<Expense | null> => {
  if (isGuest()) return localDB.update('expenses', updated);
  const { data, error } = await supabase.from('expenses').update(updated).eq('id', updated.id).select().single();
  if (error) { console.error('Error updating expense', error); return null; }
  return data;
};

export const deleteExpense = async (id: string): Promise<boolean> => {
  if (isGuest()) return localDB.delete('expenses', id);
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) { console.error('Error deleting expense', error); return false; }
  return true;
};

// --- IMPORT (bulk insert with user_id override) ---
export const importProperties = async (rows: Omit<Property, 'id' | 'created_at' | 'user_id'>[]): Promise<number> => {
  if (isGuest()) {
    const list = localDB.get('properties');
    const newItems = rows.map(r => ({ ...r, id: Math.random().toString(36).substr(2, 9), created_at: new Date().toISOString() }));
    localDB.save('properties', [...newItems, ...list]);
    return newItems.length;
  }
  const userId = await getCurrentUserId();
  const withUser = rows.map(r => ({ ...r, user_id: userId }));
  const { data, error } = await supabase.from('properties').insert(withUser).select();
  if (error) { console.error('Error importing properties', error); return 0; }
  return data?.length ?? 0;
};

export const importTenants = async (rows: Omit<TenantContract, 'id' | 'created_at' | 'user_id'>[]): Promise<number> => {
  if (isGuest()) {
    const list = localDB.get('tenants');
    const newItems = rows.map(r => ({ ...r, id: Math.random().toString(36).substr(2, 9), created_at: new Date().toISOString() }));
    localDB.save('tenants', [...newItems, ...list]);
    return newItems.length;
  }
  const userId = await getCurrentUserId();
  const withUser = rows.map(r => ({ ...r, user_id: userId }));
  const { data, error } = await supabase.from('tenants').insert(withUser).select();
  if (error) { console.error('Error importing tenants', error); return 0; }
  return data?.length ?? 0;
};

export const importExpenses = async (rows: Omit<Expense, 'id' | 'created_at' | 'user_id'>[]): Promise<number> => {
  if (isGuest()) {
    const list = localDB.get('expenses');
    const newItems = rows.map(r => ({ ...r, id: Math.random().toString(36).substr(2, 9), created_at: new Date().toISOString() }));
    localDB.save('expenses', [...newItems, ...list]);
    return newItems.length;
  }
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
  if (isGuest()) return { ok: false, error: 'Invitations are not available in Guest mode.' };
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: 'Not logged in' };
  // ... rest of logic

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
  if (isGuest()) return [];
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
  if (isGuest()) return false;
  const { error } = await supabase.from('invitations').update({ status: 'revoked' }).eq('id', id);
  if (error) { console.error('Error revoking invitation', error); return false; }
  return true;
};

/** Call this after a user logs in — links any pending invitations for their email to their user ID */
export const acceptPendingInvitations = async (): Promise<void> => {
  if (isGuest()) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return;
  await supabase
    .from('invitations')
    .update({ invitee_id: user.id, status: 'accepted' })
    .eq('invitee_email', user.email)
    .eq('status', 'pending');
};

