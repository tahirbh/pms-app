export interface NotificationState {
  status: 'unread' | 'read' | 'deleted';
  lastReadAt?: string;
}

const STORAGE_PREFIX = 'pms_notifications_state_';

export const getStoredNotificationStates = (userId: string): Record<string, NotificationState> => {
  if (!userId) return {};
  try {
    const data = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    console.error('Failed to parse notifications state', e);
    return {};
  }
};

export const saveStoredNotificationStates = (userId: string, states: Record<string, NotificationState>): void => {
  if (!userId) return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(states));
  } catch (e) {
    console.error('Failed to save notifications state', e);
  }
};

/**
 * Filters, deduplicates, and schedules/reschedules notifications.
 * Unpaid notifications that were read > 24 hours ago are set back to 'unread'.
 */
export const processAndRescheduleNotifications = (
  rawNotifs: { id: string; tenantId: string; name: string; type: 'overdue' | 'upcoming'; amount: number; date: string }[],
  userId: string
): { id: string; tenantId: string; name: string; type: 'overdue' | 'upcoming'; amount: number; date: string; status: 'unread' | 'read' }[] => {
  if (!userId) return [];

  const states = getStoredNotificationStates(userId);
  let stateChanged = false;
  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  // Deduplicate raw notifications by ledger ID just to be safe
  const uniqueRawMap = new Map<string, typeof rawNotifs[0]>();
  rawNotifs.forEach(n => {
    if (!uniqueRawMap.has(n.id)) {
      uniqueRawMap.set(n.id, n);
    }
  });

  const processed: any[] = [];

  uniqueRawMap.forEach((n, id) => {
    let state = states[id];

    if (!state) {
      state = { status: 'unread' };
      states[id] = state;
      stateChanged = true;
    } else if (state.status === 'read' && state.lastReadAt) {
      const timeSinceRead = now - new Date(state.lastReadAt).getTime();
      if (timeSinceRead >= ONE_DAY_MS) {
        // Reschedule to 'unread' on schedule routine
        state.status = 'unread';
        delete state.lastReadAt;
        states[id] = state;
        stateChanged = true;
        console.log(`Rescheduled notification ${id} to unread after 24h routine.`);
      }
    }

    // Skip deleted notifications
    if (state.status === 'deleted') {
      return;
    }

    processed.push({
      ...n,
      status: state.status
    });
  });

  if (stateChanged) {
    saveStoredNotificationStates(userId, states);
  }

  return processed;
};

export const markNotificationAsRead = (id: string, userId: string): void => {
  if (!userId) return;
  const states = getStoredNotificationStates(userId);
  states[id] = {
    status: 'read',
    lastReadAt: new Date().toISOString()
  };
  saveStoredNotificationStates(userId, states);
};

export const markNotificationAsDeleted = (id: string, userId: string): void => {
  if (!userId) return;
  const states = getStoredNotificationStates(userId);
  states[id] = {
    status: 'deleted'
  };
  saveStoredNotificationStates(userId, states);
};

export const deleteReadNotifications = (userId: string, activeIds: string[]): void => {
  if (!userId) return;
  const states = getStoredNotificationStates(userId);
  let changed = false;

  activeIds.forEach(id => {
    if (states[id] && states[id].status === 'read') {
      states[id] = { status: 'deleted' };
      changed = true;
    }
  });

  if (changed) {
    saveStoredNotificationStates(userId, states);
  }
};
