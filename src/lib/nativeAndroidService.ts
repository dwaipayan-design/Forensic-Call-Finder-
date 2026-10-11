import { CallLogEntry, ContactItem } from '../types';
import { LocalSqliteStorage } from './storage';

export interface PermissionStatus {
  contacts: 'granted' | 'denied' | 'prompt';
  callLog: 'granted' | 'denied' | 'prompt';
}

export interface SyncResult {
  success: boolean;
  contactsCount: number;
  callLogsCount: number;
  error?: string;
  isNative: boolean;
}

// Generate consistent avatar colors for contacts
const AVATAR_COLORS = [
  '#007AFF', // System Blue
  '#34C759', // System Green
  '#5856D6', // System Indigo
  '#AF52DE', // System Purple
  '#FF9500', // System Orange
  '#FF2D55', // System Pink
  '#00C7BE', // System Teal
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export class NativeAndroidService {
  /**
   * Determine if the app is currently running inside a native Android APK shell
   */
  static isAndroidNative(): boolean {
    if (typeof window === 'undefined') return false;

    // Check for custom Android JavaScript bridge
    if ((window as any).AndroidBridge || (window as any).AndroidNative) {
      return true;
    }

    // Check for Capacitor native Android runtime
    const cap = (window as any).Capacitor;
    if (cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform()) {
      return cap.getPlatform ? cap.getPlatform() === 'android' : true;
    }

    // Check user agent
    const ua = navigator.userAgent || '';
    const isAndroid = /Android/i.test(ua);
    const isCapacitor = !!(window as any).Capacitor;

    return isAndroid && isCapacitor;
  }

  /**
   * Query Android runtime permissions for Contacts and Call Logs
   */
  static async checkPermissions(): Promise<PermissionStatus> {
    if (typeof window === 'undefined') {
      return { contacts: 'prompt', callLog: 'prompt' };
    }

    // 1. Check custom AndroidBridge
    const bridge = (window as any).AndroidBridge || (window as any).AndroidNative;
    if (bridge && typeof bridge.checkPermissions === 'function') {
      try {
        const result = bridge.checkPermissions();
        const parsed = typeof result === 'string' ? JSON.parse(result) : result;
        return {
          contacts: parsed.contacts ? 'granted' : 'denied',
          callLog: parsed.callLog ? 'granted' : 'denied',
        };
      } catch (e) {
        console.warn('Bridge checkPermissions error:', e);
      }
    }

    // 2. Check Capacitor permissions
    const cap = (window as any).Capacitor;
    if (cap?.Plugins?.Permissions) {
      try {
        const res = await cap.Plugins.Permissions.query({ name: 'contacts' });
        return {
          contacts: res.state === 'granted' ? 'granted' : 'prompt',
          callLog: res.state === 'granted' ? 'granted' : 'prompt',
        };
      } catch (e) {
        // ignore
      }
    }

    // If running in browser preview, check persisted user preference
    const saved = localStorage.getItem('android_permissions_state');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }

    return { contacts: 'prompt', callLog: 'prompt' };
  }

  /**
   * Request native runtime permissions for READ_CONTACTS and READ_CALL_LOG
   */
  static async requestPermissions(): Promise<PermissionStatus> {
    const bridge = (window as any).AndroidBridge || (window as any).AndroidNative;
    if (bridge && typeof bridge.requestPermissions === 'function') {
      try {
        const res = bridge.requestPermissions();
        const parsed = typeof res === 'string' ? JSON.parse(res) : res;
        const status: PermissionStatus = {
          contacts: parsed.contacts ? 'granted' : 'denied',
          callLog: parsed.callLog ? 'granted' : 'denied',
        };
        localStorage.setItem('android_permissions_state', JSON.stringify(status));
        return status;
      } catch (e) {
        console.warn('Failed bridge requestPermissions:', e);
      }
    }

    // In web environment, mark as prompted and allow the user to test empty/active flows
    const status: PermissionStatus = {
      contacts: 'granted',
      callLog: 'granted',
    };
    localStorage.setItem('android_permissions_state', JSON.stringify(status));
    return status;
  }

  /**
   * Open Android App Details Settings page so user can grant permissions if blocked
   */
  static openSettings(): void {
    const bridge = (window as any).AndroidBridge || (window as any).AndroidNative;
    if (bridge && typeof bridge.openAppSettings === 'function') {
      try {
        bridge.openAppSettings();
        return;
      } catch (e) {
        console.warn('Failed openAppSettings via bridge:', e);
      }
    }
    console.info('Settings open requested');
  }

  /**
   * Fetch genuine Contacts from Android Contacts Provider (ContactsContract)
   */
  static async fetchContacts(): Promise<ContactItem[]> {
    const bridge = (window as any).AndroidBridge || (window as any).AndroidNative;
    if (bridge && typeof bridge.getContacts === 'function') {
      try {
        const raw = bridge.getContacts();
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (Array.isArray(parsed)) {
          return parsed.map((item: any, idx: number) => ({
            id: item.id || `contact-${idx}-${Date.now()}`,
            name: item.name || item.displayName || 'Unknown Contact',
            number: item.number || item.phoneNumber || '',
            avatarColor: item.avatarColor || getAvatarColor(item.name || ''),
            company: item.company || undefined,
            avatarUrl: item.photoUri || item.avatarUrl || undefined,
          }));
        }
      } catch (e) {
        console.error('Failed reading contacts from native Android bridge:', e);
      }
    }

    // Capacitor community contacts plugin fallback
    const cap = (window as any).Capacitor;
    if (cap?.Plugins?.Contacts?.getContacts) {
      try {
        const res = await cap.Plugins.Contacts.getContacts({ projection: { name: true, phones: true } });
        if (res?.contacts) {
          return res.contacts.map((c: any, idx: number) => {
            const phone = c.phones?.[0]?.number || '';
            const displayName = c.name?.display || c.name?.given || phone || 'Unknown';
            return {
              id: c.id || `c-${idx}`,
              name: displayName,
              number: phone,
              avatarColor: getAvatarColor(displayName),
            };
          });
        }
      } catch (e) {
        console.warn('Capacitor contacts error:', e);
      }
    }

    // In web preview or empty device: return local SQLite storage
    return LocalSqliteStorage.getContacts();
  }

  /**
   * Fetch genuine Call History from Android Call Log Provider (CallLog.Calls)
   */
  static async fetchCallLogs(contacts: ContactItem[] = []): Promise<CallLogEntry[]> {
    const bridge = (window as any).AndroidBridge || (window as any).AndroidNative;
    if (bridge && typeof bridge.getCallLogs === 'function') {
      try {
        const raw = bridge.getCallLogs();
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (Array.isArray(parsed)) {
          const contactMap = new Map<string, string>();
          contacts.forEach((c) => {
            contactMap.set(LocalSqliteStorage.normalizeNumber(c.number), c.name);
          });

          return parsed.map((log: any, idx: number) => {
            const normNumber = LocalSqliteStorage.normalizeNumber(log.number || '');
            const resolvedName = log.name || contactMap.get(normNumber) || null;

            let logType: 'incoming' | 'outgoing' | 'missed' | 'rejected' = 'incoming';
            const rawType = String(log.type).toLowerCase();
            if (rawType.includes('miss') || rawType === '3') {
              logType = 'missed';
            } else if (rawType.includes('out') || rawType === '2') {
              logType = 'outgoing';
            } else if (rawType.includes('reject') || rawType === '5') {
              logType = 'rejected';
            } else {
              logType = 'incoming';
            }

            return {
              id: log.id || `native-log-${idx}-${Date.now()}`,
              number: log.number || 'Unknown Number',
              name: resolvedName,
              timestamp: Number(log.date || log.timestamp || Date.now()),
              duration: Number(log.duration || 0),
              type: logType,
              sim: log.sim || (log.subscriptionId === 1 ? 'SIM 2' : 'SIM 1 (Primary)'),
            };
          });
        }
      } catch (e) {
        console.error('Failed reading call logs from native Android bridge:', e);
      }
    }

    // In web preview or empty device: return local SQLite storage
    return LocalSqliteStorage.getCallLogs();
  }

  /**
   * Perform a full synchronization from Android native providers into the app's SQLite storage
   */
  static async syncDeviceData(): Promise<SyncResult> {
    const isNative = this.isAndroidNative();

    try {
      const contacts = await this.fetchContacts();
      const logs = await this.fetchCallLogs(contacts);

      // Save real device records in LocalSqliteStorage
      LocalSqliteStorage.syncDeviceData(contacts, logs);

      return {
        success: true,
        contactsCount: contacts.length,
        callLogsCount: logs.length,
        isNative,
      };
    } catch (err: any) {
      console.error('Failed device sync:', err);
      return {
        success: false,
        contactsCount: 0,
        callLogsCount: 0,
        error: err?.message || 'Unknown synchronization error',
        isNative,
      };
    }
  }
}
