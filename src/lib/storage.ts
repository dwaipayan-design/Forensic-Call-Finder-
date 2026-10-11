import { CallLogEntry, ContactItem, ManualOverride } from '../types';
import { INITIAL_CALL_LOGS, INITIAL_CONTACTS, INITIAL_OVERWRITES } from './mockData';

const SETTINGS_KEY = 'truecaller_local_sqlite_settings';
const LOGS_KEY = 'truecaller_local_call_logs';
const CONTACTS_KEY = 'truecaller_local_device_contacts';

export class LocalSqliteStorage {
  private static subscribers: (() => void)[] = [];

  static subscribe(callback: () => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback);
    };
  }

  private static notify() {
    this.subscribers.forEach((cb) => cb());
  }

  // Check and automatically expire any TTL timers that elapsed (Requirement 2)
  static checkAndExpireBusyStatuses(): boolean {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      if (!data) return false;
      const map: Record<string, ManualOverride> = JSON.parse(data);
      const now = Date.now();
      let changed = false;

      Object.keys(map).forEach((num) => {
        const item = map[num];
        if (item.is_busy && item.busy_expires_at && now >= item.busy_expires_at) {
          item.is_busy = false;
          item.talking_to = '';
          const linkedNum = item.talking_to_number;
          item.talking_to_number = undefined;
          item.talking_to_id = undefined;
          item.busy_expires_at = undefined;
          item.updated_at = now;
          changed = true;

          // Also clear reciprocal linked contact if they were linked to this caller
          if (linkedNum && map[this.normalizeNumber(linkedNum)]) {
            const partner = map[this.normalizeNumber(linkedNum)];
            if (partner.is_busy && partner.talking_to_number === num) {
              partner.is_busy = false;
              partner.talking_to = '';
              partner.talking_to_number = undefined;
              partner.talking_to_id = undefined;
              partner.busy_expires_at = undefined;
              partner.updated_at = now;
            }
          }
        }
      });

      if (changed) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(map));
        this.notify();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error checking TTL expiration', e);
      return false;
    }
  }

  // Clean phone number: strips spaces, dashes, brackets, and periods
  static cleanPhone(num: string): string {
    if (!num) return '';
    return num.replace(/[\s\-\(\)\.]/g, '').trim();
  }

  // Robust comparison between two phone numbers:
  // Handles leading zeros, country code prefixes (e.g. +91 vs local 10 digits), and format variations
  static matchNumbers(numA: string, numB: string): boolean {
    if (!numA || !numB) return false;
    const a = this.cleanPhone(numA);
    const b = this.cleanPhone(numB);
    if (a === b) return true;
    const digitsA = a.replace(/\D/g, '');
    const digitsB = b.replace(/\D/g, '');
    if (!digitsA || !digitsB) return false;
    if (digitsA === digitsB) return true;
    // Check if the last 10 digits match (standard mobile number length in India and North America)
    if (digitsA.length >= 10 && digitsB.length >= 10) {
      return digitsA.slice(-10) === digitsB.slice(-10);
    }
    return false;
  }

  // Normalize phone number for consistent map keying
  static normalizeNumber(num: string): string {
    return this.cleanPhone(num);
  }

  // Load shadow settings map from local storage (simulating sqflite table 'settings')
  static getSettingsMap(): Record<string, ManualOverride> {
    try {
      this.purgeLegacyMockData();
      this.checkAndExpireBusyStatuses();
      const data = localStorage.getItem(SETTINGS_KEY);
      if (!data) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify({}));
        return {};
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed reading SQLite shadow settings', e);
      return {};
    }
  }

  // Query a single setting by phone number with fuzzy digit parity
  static getSetting(number: string): ManualOverride | undefined {
    if (!number) return undefined;
    const map = this.getSettingsMap();
    const clean = this.normalizeNumber(number);
    if (map[clean]) return map[clean];

    // Check if any key in map matches the number
    const matchedKey = Object.keys(map).find((k) => this.matchNumbers(k, number));
    return matchedKey ? map[matchedKey] : undefined;
  }

  // Save / replace a manual override row
  static saveSetting(override: ManualOverride): void {
    const map = this.getSettingsMap();
    const normalized = this.normalizeNumber(override.number);

    // Remove any previous keys that matched the same number under a different formatting
    Object.keys(map).forEach((k) => {
      if (k !== normalized && this.matchNumbers(k, normalized)) {
        delete map[k];
      }
    });

    map[normalized] = {
      ...override,
      number: normalized,
      updated_at: Date.now(),
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(map));
    this.notify();
  }

  /**
   * Bidirectional Call Status Link (Requirement 4 & Requirement 2):
   * Sets caller A and contact B to "In a Call" with each other,
   * assigning an automated TTL expiry timer between 5 and 15 minutes.
   */
  static setBidirectionalCallStatus(
    callerNumber: string,
    callerName: string,
    partnerNumber: string,
    partnerName: string,
    partnerId?: string,
    callerId?: string
  ): void {
    const map = this.getSettingsMap();
    const normA = this.normalizeNumber(callerNumber);
    const normB = this.normalizeNumber(partnerNumber);

    // Random TTL between 5 to 15 minutes (in ms)
    const randomMinutes = Math.floor(Math.random() * (15 - 5 + 1)) + 5;
    const expiresAt = Date.now() + randomMinutes * 60 * 1000;

    const existingA = this.getSetting(callerNumber) || {
      number: normA,
      is_busy: false,
      talking_to: '',
      is_verified: false,
      updated_at: Date.now(),
    };

    const existingB = this.getSetting(partnerNumber) || {
      number: normB,
      is_busy: false,
      talking_to: '',
      is_verified: false,
      updated_at: Date.now(),
    };

    // Fix State Sync / Ghost Call Bug (Requirement 4):
    // 1. Break any pre-existing links for Person A (if A was already in a call with C)
    if (existingA.talking_to_number && !this.matchNumbers(existingA.talking_to_number, normB)) {
      const oldPartnerA = this.getSetting(existingA.talking_to_number);
      if (oldPartnerA) {
        oldPartnerA.is_busy = false;
        oldPartnerA.talking_to = '';
        oldPartnerA.talking_to_number = undefined;
        oldPartnerA.talking_to_id = undefined;
        oldPartnerA.is_custom_caller = false;
        oldPartnerA.busy_expires_at = undefined;
        oldPartnerA.updated_at = Date.now();
        map[this.normalizeNumber(oldPartnerA.number)] = oldPartnerA;
      }
    }

    // 2. Break any pre-existing links for Person B (if B was already in a call with D)
    if (existingB.talking_to_number && !this.matchNumbers(existingB.talking_to_number, normA)) {
      const oldPartnerB = this.getSetting(existingB.talking_to_number);
      if (oldPartnerB) {
        oldPartnerB.is_busy = false;
        oldPartnerB.talking_to = '';
        oldPartnerB.talking_to_number = undefined;
        oldPartnerB.talking_to_id = undefined;
        oldPartnerB.is_custom_caller = false;
        oldPartnerB.busy_expires_at = undefined;
        oldPartnerB.updated_at = Date.now();
        map[this.normalizeNumber(oldPartnerB.number)] = oldPartnerB;
      }
    }

    // 3. Clear any third-party contact in map that pointed to normA or normB
    Object.keys(map).forEach((key) => {
      if (!this.matchNumbers(key, normA) && !this.matchNumbers(key, normB)) {
        const item = map[key];
        if (
          item.talking_to_number &&
          (this.matchNumbers(item.talking_to_number, normA) ||
            this.matchNumbers(item.talking_to_number, normB))
        ) {
          item.is_busy = false;
          item.talking_to = '';
          item.talking_to_number = undefined;
          item.talking_to_id = undefined;
          item.is_custom_caller = false;
          item.busy_expires_at = undefined;
          item.updated_at = Date.now();
        }
      }
    });

    const allContacts = this.getContacts();
    const contactA = allContacts.find((c) => this.matchNumbers(c.number, normA));
    const contactB = allContacts.find((c) => this.matchNumbers(c.number, normB));

    const avatarA = existingA.avatar_url || contactA?.avatarUrl || undefined;
    const avatarB = existingB.avatar_url || contactB?.avatarUrl || undefined;

    // Caller A -> talking to partner B
    map[normA] = {
      ...existingA,
      number: normA,
      is_busy: true,
      talking_to: partnerName,
      talking_to_number: normB,
      talking_to_id: partnerId,
      is_custom_caller: false,
      avatar_url: avatarA,
      busy_expires_at: expiresAt,
      updated_at: Date.now(),
    };

    // Partner B -> talking to caller A
    map[normB] = {
      ...existingB,
      number: normB,
      is_busy: true,
      talking_to: callerName,
      talking_to_number: normA,
      talking_to_id: callerId,
      is_custom_caller: false,
      avatar_url: avatarB,
      busy_expires_at: expiresAt,
      updated_at: Date.now(),
    };

    localStorage.setItem(SETTINGS_KEY, JSON.stringify(map));
    this.notify();
  }

  /**
   * Set Custom / Fake Caller Call Status (Option B):
   * Sets caller to "In a Call" with manual fake name/number without linking to a real profile.
   * Cleans up any prior call caller was in so no ghost call remains.
   */
  static setCustomCallStatus(
    callerNumber: string,
    fakeName: string,
    fakeNumber?: string
  ): void {
    const map = this.getSettingsMap();
    const normA = this.normalizeNumber(callerNumber);
    const existingA = map[normA];

    // Clear any prior call Person A was in
    if (existingA?.talking_to_number) {
      const oldPartner = map[this.normalizeNumber(existingA.talking_to_number)];
      if (oldPartner) {
        oldPartner.is_busy = false;
        oldPartner.talking_to = '';
        oldPartner.talking_to_number = undefined;
        oldPartner.talking_to_id = undefined;
        oldPartner.is_custom_caller = false;
        oldPartner.busy_expires_at = undefined;
        oldPartner.updated_at = Date.now();
      }
    }

    // Sweep any contact in map pointing to normA
    Object.keys(map).forEach((key) => {
      if (key !== normA) {
        const item = map[key];
        if (item.talking_to_number && this.normalizeNumber(item.talking_to_number) === normA) {
          item.is_busy = false;
          item.talking_to = '';
          item.talking_to_number = undefined;
          item.talking_to_id = undefined;
          item.is_custom_caller = false;
          item.busy_expires_at = undefined;
          item.updated_at = Date.now();
        }
      }
    });

    const randomMinutes = Math.floor(Math.random() * (15 - 5 + 1)) + 5;
    const expiresAt = Date.now() + randomMinutes * 60 * 1000;

    map[normA] = {
      ...(existingA || {
        number: normA,
        is_verified: false,
      }),
      number: normA,
      is_busy: true,
      talking_to: fakeName.trim(),
      talking_to_number: fakeNumber?.trim() || undefined,
      talking_to_id: undefined,
      is_custom_caller: true,
      busy_expires_at: expiresAt,
      updated_at: Date.now(),
    };

    localStorage.setItem(SETTINGS_KEY, JSON.stringify(map));
    this.notify();
  }

  /**
   * Clear Call Status Bidirectionally (Fix ghost calls):
   * When caller A's call status is turned off / cleared, also clears partner B's call status,
   * and sweeps any ghost references.
   */
  static clearCallStatus(callerNumber: string): void {
    const map = this.getSettingsMap();
    const normA = this.normalizeNumber(callerNumber);
    const itemA = map[normA];

    if (itemA) {
      const partnerNumber = itemA.talking_to_number;
      itemA.is_busy = false;
      itemA.talking_to = '';
      itemA.talking_to_number = undefined;
      itemA.talking_to_id = undefined;
      itemA.is_custom_caller = false;
      itemA.busy_expires_at = undefined;
      itemA.updated_at = Date.now();

      // Clear partner if linked to caller A
      if (partnerNumber && map[this.normalizeNumber(partnerNumber)]) {
        const itemB = map[this.normalizeNumber(partnerNumber)];
        itemB.is_busy = false;
        itemB.talking_to = '';
        itemB.talking_to_number = undefined;
        itemB.talking_to_id = undefined;
        itemB.is_custom_caller = false;
        itemB.busy_expires_at = undefined;
        itemB.updated_at = Date.now();
      }
    }

    // Sweep any other contacts in map that might have been referencing normA
    Object.keys(map).forEach((key) => {
      const item = map[key];
      if (item.talking_to_number && this.normalizeNumber(item.talking_to_number) === normA) {
        item.is_busy = false;
        item.talking_to = '';
        item.talking_to_number = undefined;
        item.talking_to_id = undefined;
        item.is_custom_caller = false;
        item.busy_expires_at = undefined;
        item.updated_at = Date.now();
      }
    });

    localStorage.setItem(SETTINGS_KEY, JSON.stringify(map));
    this.notify();
  }

  // Delete a setting from local SQLite
  static deleteSetting(number: string): void {
    const map = this.getSettingsMap();
    const normalized = this.normalizeNumber(number);
    delete map[normalized];
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(map));
    this.notify();
  }

  // Purge any residual or legacy mock data so device storage remains authentic
  static purgeLegacyMockData(): void {
    try {
      const logsRaw = localStorage.getItem(LOGS_KEY);
      if (logsRaw) {
        const logs: CallLogEntry[] = JSON.parse(logsRaw);
        const legacyMockIds = new Set(['log-1', 'log-2', 'log-3', 'log-4', 'log-5', 'log-6', 'log-7', 'log-8']);
        const filteredLogs = logs.filter(
          (l) => !legacyMockIds.has(l.id) && !l.number?.includes('555 0192') && !l.number?.includes('555 8391')
        );
        if (filteredLogs.length !== logs.length) {
          localStorage.setItem(LOGS_KEY, JSON.stringify(filteredLogs));
        }
      }

      const contactsRaw = localStorage.getItem(CONTACTS_KEY);
      if (contactsRaw) {
        const contacts: ContactItem[] = JSON.parse(contactsRaw);
        const legacyContactIds = new Set(['c-1', 'c-2', 'c-3', 'c-4', 'c-5', 'c-6', 'c-7', 'c-8']);
        const filteredContacts = contacts.filter(
          (c) => !legacyContactIds.has(c.id) && !c.number?.includes('555 0192') && !c.number?.includes('555 8391')
        );
        if (filteredContacts.length !== contacts.length) {
          localStorage.setItem(CONTACTS_KEY, JSON.stringify(filteredContacts));
        }
      }

      const settingsRaw = localStorage.getItem(SETTINGS_KEY);
      if (settingsRaw) {
        const settings = JSON.parse(settingsRaw);
        let changed = false;
        ['+1 415 555 0192', '+1 212 555 8391', '+1 312 555 4402', '+1 800 555 9922'].forEach((num) => {
          if (settings[num]) {
            delete settings[num];
            changed = true;
          }
        });
        if (changed) {
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        }
      }
    } catch (e) {
      console.warn('Error purging legacy mock data', e);
    }
  }

  // Reset database back to default empty state
  static resetDatabase(): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({}));
    localStorage.setItem(LOGS_KEY, JSON.stringify([]));
    localStorage.setItem(CONTACTS_KEY, JSON.stringify([]));
    this.notify();
  }

  // Set real synchronized device contacts
  static setContacts(contacts: ContactItem[]): void {
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
    this.notify();
  }

  // Get device contacts (persisted in local device storage)
  static getContacts(): ContactItem[] {
    try {
      this.purgeLegacyMockData();
      const data = localStorage.getItem(CONTACTS_KEY);
      if (!data) {
        localStorage.setItem(CONTACTS_KEY, JSON.stringify([]));
        return [];
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed reading device contacts', e);
      return [];
    }
  }

  // Update or save a device contact (really edits device contact)
  static saveContact(contact: ContactItem): void {
    const contacts = this.getContacts();
    const index = contacts.findIndex(
      (c) => c.id === contact.id || this.normalizeNumber(c.number) === this.normalizeNumber(contact.number)
    );
    if (index >= 0) {
      contacts[index] = { ...contacts[index], ...contact };
    } else {
      contacts.unshift(contact);
    }
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));

    // Also sync call logs that have this number so the displayed caller name reflects device update immediately
    const logs = this.getCallLogs();
    let logsChanged = false;
    const norm = this.normalizeNumber(contact.number);
    const updatedLogs = logs.map((log) => {
      if (this.normalizeNumber(log.number) === norm) {
        logsChanged = true;
        return { ...log, name: contact.name };
      }
      return log;
    });
    if (logsChanged) {
      localStorage.setItem(LOGS_KEY, JSON.stringify(updatedLogs));
    }

    this.notify();
  }

  // Update device contact name by phone number (really edits the device contact book)
  static updateContactName(number: string, newName: string): void {
    const contacts = this.getContacts();
    const norm = this.normalizeNumber(number);
    const existing = contacts.find((c) => this.normalizeNumber(c.number) === norm);
    if (existing) {
      existing.name = newName;
    } else {
      // Create new device contact if it was just a raw number
      contacts.push({
        id: `contact-${Date.now()}`,
        name: newName,
        number: number,
        avatarColor: '#0087FF',
      });
    }
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));

    // Update in call logs as well
    const logs = this.getCallLogs();
    const updatedLogs = logs.map((log) => {
      if (this.normalizeNumber(log.number) === norm) {
        return { ...log, name: newName };
      }
      return log;
    });
    localStorage.setItem(LOGS_KEY, JSON.stringify(updatedLogs));

    this.notify();
  }

  // Comprehensive device contact update (updates name, number, company, avatarUrl across contacts, call logs, and settings)
  static updateDeviceContact(
    oldNumber: string,
    updatedData: {
      name: string;
      number: string;
      company?: string;
      avatarUrl?: string;
    }
  ): { updatedContact: ContactItem; oldNumber: string; newNumber: string } {
    const normOld = this.normalizeNumber(oldNumber);
    const normNew = this.normalizeNumber(updatedData.number);
    const newTrimmedNumber = updatedData.number.trim();
    const newTrimmedName = updatedData.name.trim() || newTrimmedNumber;

    // 1. Update or create in Contacts list
    const contacts = this.getContacts();
    let contactIndex = contacts.findIndex(
      (c) => this.normalizeNumber(c.number) === normOld || this.normalizeNumber(c.number) === normNew
    );
    let updatedContact: ContactItem;
    if (contactIndex >= 0) {
      updatedContact = {
        ...contacts[contactIndex],
        name: newTrimmedName,
        number: newTrimmedNumber,
        company: updatedData.company !== undefined ? updatedData.company.trim() || undefined : contacts[contactIndex].company,
        avatarUrl: updatedData.avatarUrl !== undefined ? updatedData.avatarUrl : contacts[contactIndex].avatarUrl,
      };
      contacts[contactIndex] = updatedContact;
    } else {
      updatedContact = {
        id: `contact-${Date.now()}`,
        name: newTrimmedName,
        number: newTrimmedNumber,
        company: updatedData.company?.trim() || undefined,
        avatarColor: '#0087FF',
        avatarUrl: updatedData.avatarUrl,
      };
      contacts.unshift(updatedContact);
    }
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));

    // 2. Update all Call Logs: matching normOld or normNew
    const logs = this.getCallLogs();
    let logsChanged = false;
    const updatedLogs = logs.map((log) => {
      const logNorm = this.normalizeNumber(log.number);
      if (logNorm === normOld || logNorm === normNew) {
        logsChanged = true;
        return {
          ...log,
          number: newTrimmedNumber,
          name: newTrimmedName,
        };
      }
      return log;
    });
    if (logsChanged) {
      localStorage.setItem(LOGS_KEY, JSON.stringify(updatedLogs));
    }

    // 3. Update Manual Overrides / Settings map
    const settings = this.getSettingsMap();
    let existingOverride = settings[normOld];
    if (normOld !== normNew && existingOverride) {
      delete settings[normOld];
    }
    if (!existingOverride && settings[normNew]) {
      existingOverride = settings[normNew];
    }
    if (existingOverride) {
      existingOverride = {
        ...existingOverride,
        number: newTrimmedNumber,
        custom_name: undefined, // Clear override custom_name so device contact name shines through!
        avatar_url: updatedData.avatarUrl !== undefined ? updatedData.avatarUrl : existingOverride.avatar_url,
        updated_at: Date.now(),
      };
      settings[normNew] = existingOverride;
    }

    // 4. Update any linked contact referencing the old number in talking_to_number
    Object.keys(settings).forEach((key) => {
      const item = settings[key];
      if (item.talking_to_number && this.normalizeNumber(item.talking_to_number) === normOld) {
        item.talking_to_number = newTrimmedNumber;
        item.talking_to = newTrimmedName;
      }
    });
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

    this.notify();
    return { updatedContact, oldNumber: normOld, newNumber: normNew };
  }

  // Delete a contact from device book, call logs, and settings
  static deleteContact(number: string): void {
    const norm = this.normalizeNumber(number);
    const contacts = this.getContacts();
    const updated = contacts.filter((c) => this.normalizeNumber(c.number) !== norm);
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(updated));
    this.deleteCallsForNumber(number);
    this.deleteSetting(number);
    this.notify();
  }

  // Set real synchronized device call logs
  static setCallLogs(logs: CallLogEntry[]): void {
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
    this.notify();
  }

  // Synchronize both device contacts and call logs
  static syncDeviceData(contacts: ContactItem[], logs: CallLogEntry[]): void {
    // Retain any user-injected calls so entries added by the user are never wiped during device sync
    const currentLogs = this.getCallLogs();
    const userInjected = currentLogs.filter((l) => l.id.startsWith('user-injected-'));
    const incomingIds = new Set(logs.map((l) => l.id));
    const mergedInjected = userInjected.filter((l) => !incomingIds.has(l.id));
    const finalLogs = [...mergedInjected, ...logs];
    finalLogs.sort((a, b) => b.timestamp - a.timestamp);

    localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
    localStorage.setItem(LOGS_KEY, JSON.stringify(finalLogs));
    this.notify();
  }

  // Get call logs (retrieves real device logs or empty list)
  static getCallLogs(): CallLogEntry[] {
    try {
      this.purgeLegacyMockData();
      const data = localStorage.getItem(LOGS_KEY);
      if (!data) {
        localStorage.setItem(LOGS_KEY, JSON.stringify([]));
        return [];
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed reading call logs', e);
      return [];
    }
  }

  // Add a new call log entry (simulating a fresh incoming/outgoing call or user injected record)
  static addCallLog(entry: Omit<CallLogEntry, 'id'>): CallLogEntry {
    const logs = this.getCallLogs();
    const newEntry: CallLogEntry = {
      ...entry,
      id: `user-injected-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    const updated = [newEntry, ...logs];
    // Keep sorted by timestamp descending
    updated.sort((a, b) => b.timestamp - a.timestamp);
    localStorage.setItem(LOGS_KEY, JSON.stringify(updated));
    this.notify();
    return newEntry;
  }

  // Delete call logs for a specific number
  static deleteCallsForNumber(number: string): void {
    const normalized = this.normalizeNumber(number);
    const logs = this.getCallLogs();
    const updated = logs.filter((l) => this.normalizeNumber(l.number) !== normalized);
    localStorage.setItem(LOGS_KEY, JSON.stringify(updated));
    this.notify();
  }

  // Clear call logs
  static clearCallLogs(): void {
    localStorage.setItem(LOGS_KEY, JSON.stringify([]));
    this.notify();
  }

  // Execute simulated SQLite query for the interactive SQLite console
  static executeSql(queryText: string): { success: boolean; rows?: any[]; message: string; rowsAffected?: number } {
    const trimmed = queryText.trim();
    const lower = trimmed.toLowerCase();
    const map = this.getSettingsMap();
    const rows = Object.values(map);

    try {
      if (lower.startsWith('select')) {
        // Simple mock parser for SELECT queries
        let result = rows;
        if (lower.includes('where')) {
          if (lower.includes('is_busy = 1') || lower.includes('is_busy=1')) {
            result = result.filter((r) => r.is_busy);
          } else if (lower.includes('is_verified = 1') || lower.includes('is_verified=1')) {
            result = result.filter((r) => r.is_verified);
          } else if (lower.includes('number =')) {
            const match = trimmed.match(/number\s*=\s*['"]([^'"]+)['"]/i);
            if (match) {
              const num = this.normalizeNumber(match[1]);
              result = result.filter((r) => this.normalizeNumber(r.number) === num);
            }
          }
        }
        return {
          success: true,
          rows: result.map((r) => ({
            number: r.number,
            is_busy: r.is_busy ? 1 : 0,
            talking_to: r.talking_to || '',
            is_verified: r.is_verified ? 1 : 0,
            custom_name: r.custom_name || '',
            updated_at: r.updated_at,
          })),
          message: `Query OK. Retrieved ${result.length} row(s).`,
        };
      }

      if (lower.startsWith('delete')) {
        if (lower.includes('where number =')) {
          const match = trimmed.match(/number\s*=\s*['"]([^'"]+)['"]/i);
          if (match) {
            this.deleteSetting(match[1]);
            return { success: true, message: `1 row deleted from settings.`, rowsAffected: 1 };
          }
        }
        if (lower.trim() === 'delete from settings' || lower.trim() === 'delete from settings;') {
          localStorage.setItem(SETTINGS_KEY, JSON.stringify({}));
          this.notify();
          return { success: true, message: `All rows deleted from settings.`, rowsAffected: rows.length };
        }
      }

      if (lower.startsWith('insert into settings')) {
        // Example: INSERT INTO settings (number, is_busy, talking_to, is_verified) VALUES ('+1 555 1234', 1, 'Support', 1);
        const match = trimmed.match(/values\s*\(([^)]+)\)/i);
        if (match) {
          const parts = match[1].split(',').map((p) => p.trim().replace(/^['"]|['"]$/g, ''));
          const [number, is_busy, talking_to, is_verified] = parts;
          if (number) {
            this.saveSetting({
              number: this.normalizeNumber(number),
              is_busy: is_busy === '1' || is_busy === 'true',
              talking_to: talking_to || '',
              is_verified: is_verified === '1' || is_verified === 'true',
              updated_at: Date.now(),
            });
            return { success: true, message: `1 row inserted into settings.`, rowsAffected: 1 };
          }
        }
      }

      return {
        success: false,
        message: 'Unsupported syntax in simulated SQLite engine. Supported: SELECT * FROM settings, INSERT INTO settings (...), DELETE FROM settings WHERE number = ...',
      };
    } catch (e: any) {
      return {
        success: false,
        message: `SQLite Error: ${e.message}`,
      };
    }
  }
}
