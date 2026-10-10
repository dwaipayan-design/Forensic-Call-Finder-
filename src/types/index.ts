export type CallType = 'incoming' | 'outgoing' | 'missed' | 'rejected';

export interface CallLogEntry {
  id: string;
  number: string;
  name: string | null;
  timestamp: number;
  duration: number; // in seconds
  type: CallType;
  sim: string;
  cachedMatchedNumber?: string;
}

export interface ManualOverride {
  number: string;
  is_busy: boolean; // 1 or 0 in sqlite
  talking_to: string; // text in sqlite
  talking_to_number?: string; // linked contact phone number
  talking_to_id?: string; // linked contact id
  is_custom_caller?: boolean; // true if custom/fake entry (not linked to a device contact)
  busy_expires_at?: number; // timestamp when busy status auto-expires (5-15 mins)
  is_verified: boolean; // 1 or 0 in sqlite
  custom_name?: string;
  avatar_url?: string;
  notes?: string;
  tag?: 'personal' | 'work' | 'spam' | 'vip' | 'delivery';
  is_blocked?: boolean;
  updated_at: number;
}

export interface ContactItem {
  id: string;
  name: string;
  number: string;
  avatarColor: string;
  avatarUrl?: string;
  company?: string;
}

export interface SmsMessage {
  id: string;
  senderNumber: string;
  senderName?: string;
  content: string;
  timestamp: number;
  category: 'inbox' | 'promotions' | 'spam';
  unread: boolean;
}

export type ActiveTab = 'calls' | 'messages' | 'contacts' | 'osint' | 'forensic';

export interface UserProfile {
  name: string;
  phoneNumber: string;
  bio: string;
  avatarColor: string;
  deviceId: string;
  activeSim: string;
  simOperator: string;
}

export interface FlutterCodeFile {
  name: string;
  path: string;
  language: string;
  description: string;
  code: string;
}
