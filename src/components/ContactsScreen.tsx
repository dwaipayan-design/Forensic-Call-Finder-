import React, { useState } from 'react';
import {
  Users,
  Phone,
  Flame,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Search,
} from 'lucide-react';
import { ContactItem, ManualOverride } from '../types';

interface ContactsScreenProps {
  contacts: ContactItem[];
  shadowOverrides: Record<string, ManualOverride>;
  onSelectContact: (contact: ContactItem) => void;
  searchQuery: string;
  permissionStatus?: 'granted' | 'denied' | 'prompt';
  onRequestPermission?: () => void;
  onOpenSettings?: () => void;
  isSyncing?: boolean;
}

export const ContactsScreen: React.FC<ContactsScreenProps> = ({
  contacts,
  shadowOverrides,
  onSelectContact,
  searchQuery,
  permissionStatus = 'granted',
  onRequestPermission,
  onOpenSettings,
  isSyncing = false,
}) => {
  const [filter, setFilter] = useState<'all' | 'overridden'>('all');

  const filtered = contacts.filter((c) => {
    const override = shadowOverrides[c.number.trim()];
    const displayName = override?.custom_name || c.name;
    const match =
      displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.number.includes(searchQuery) ||
      (c.company && c.company.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!match) return false;
    if (filter === 'overridden') return !!override;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Top Filter Bar */}
      <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-white shrink-0">
        <span className="font-semibold text-slate-700">Device Contacts ({contacts.length})</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilter('all')}
            className={`min-h-[36px] px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              filter === 'all'
                ? 'bg-[#007AFF] text-white shadow-xs'
                : 'bg-[#F2F2F7] text-slate-600 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('overridden')}
            className={`min-h-[36px] px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              filter === 'overridden'
                ? 'bg-[#007AFF] text-white shadow-xs'
                : 'bg-[#F2F2F7] text-slate-600 hover:bg-slate-200'
            }`}
          >
            With Overrides
          </button>
        </div>
      </div>

      {/* Contacts List or Empty State */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100/70">
        {filtered.length === 0 ? (
          <div className="min-h-[360px] flex flex-col items-center justify-center p-6 text-center">
            {searchQuery ? (
              <div className="max-w-xs space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <Search className="w-6 h-6 stroke-[1.5]" />
                </div>
                <div className="font-semibold text-slate-800 text-sm">No Matching Contacts</div>
                <div className="text-xs text-slate-400">
                  No contacts found matching "{searchQuery}".
                </div>
              </div>
            ) : permissionStatus === 'denied' ? (
              <div className="max-w-sm w-full bg-[#F2F2F7] p-5 rounded-2xl flex flex-col items-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-[#FF3B30]">
                  <ShieldAlert className="w-6 h-6 stroke-[2]" />
                </div>
                <div className="font-bold text-slate-900 text-sm">Contacts Permission Required</div>
                <div className="text-xs text-slate-500 leading-relaxed">
                  The app accesses your genuine Android device contacts to display your real address book. Please allow Contacts permission in Android Settings.
                </div>
                {onOpenSettings ? (
                  <button
                    onClick={onOpenSettings}
                    className="min-h-[44px] px-5 py-2.5 bg-[#007AFF] text-white text-xs font-semibold rounded-xl active:scale-95 transition shadow-sm w-full"
                  >
                    Open Android Settings
                  </button>
                ) : onRequestPermission ? (
                  <button
                    onClick={onRequestPermission}
                    className="min-h-[44px] px-5 py-2.5 bg-[#007AFF] text-white text-xs font-semibold rounded-xl active:scale-95 transition shadow-sm w-full"
                  >
                    Grant Contacts Permission
                  </button>
                ) : null}
              </div>
            ) : permissionStatus === 'prompt' ? (
              <div className="max-w-sm w-full bg-[#F2F2F7] p-5 rounded-2xl flex flex-col items-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-[#007AFF]">
                  <ShieldCheck className="w-6 h-6 stroke-[2]" />
                </div>
                <div className="font-bold text-slate-900 text-sm">Connect Real Android Contacts</div>
                <div className="text-xs text-slate-500 leading-relaxed">
                  Synchronize your real address book from Android Contacts Provider without any hardcoded mock data.
                </div>
                {onRequestPermission && (
                  <button
                    onClick={onRequestPermission}
                    disabled={isSyncing}
                    className="min-h-[44px] px-5 py-2.5 bg-[#007AFF] text-white text-xs font-semibold rounded-xl active:scale-95 transition shadow-sm w-full flex items-center justify-center gap-2"
                  >
                    {isSyncing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Synchronizing Contacts...</span>
                      </>
                    ) : (
                      <span>Allow Contacts Access</span>
                    )}
                  </button>
                )}
              </div>
            ) : (
              <div className="max-w-xs space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <Users className="w-6 h-6 stroke-[1.5]" />
                </div>
                <div className="font-semibold text-slate-800 text-sm">No Contacts on Device</div>
                <div className="text-xs text-slate-400 leading-relaxed">
                  Your address book is empty. Any new contacts added to your Android phone will appear here.
                </div>
                {onRequestPermission && (
                  <button
                    onClick={onRequestPermission}
                    disabled={isSyncing}
                    className="min-h-[44px] px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium rounded-xl active:scale-95 transition inline-flex items-center gap-2"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#007AFF]' : ''}`} />
                    <span>Check Device Contacts</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          filtered.map((contact) => {
            const override = shadowOverrides[contact.number.trim()];
            const isBusy = override?.is_busy ?? false;
            const displayName = override?.custom_name || contact.name;
            const initial = displayName[0]?.toUpperCase() || '?';
            const avatarSrc = override?.avatar_url || contact.avatarUrl;

            return (
              <div
                key={contact.id}
                onClick={() => onSelectContact(contact)}
                className="px-4 py-3 flex items-center gap-3.5 hover:bg-slate-50 active:bg-slate-100 transition cursor-pointer group min-h-[56px]"
              >
                {/* Contact Avatar */}
                <div className="relative shrink-0">
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt={displayName}
                      className="w-11 h-11 rounded-full object-cover shadow-xs border border-slate-100"
                    />
                  ) : (
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base shadow-sm"
                      style={{ backgroundColor: contact.avatarColor || '#007AFF' }}
                    >
                      {initial}
                    </div>
                  )}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                      isBusy ? 'bg-[#FF3B30]' : 'bg-[#34C759]'
                    }`}
                    title={isBusy ? 'In a Call' : 'Available'}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`font-semibold text-sm truncate ${
                        isBusy ? 'text-[#FF3B30]' : 'text-slate-800'
                      }`}
                    >
                      {displayName}
                    </span>

                    {/* Subtle minimalist indicator for overridden entries */}
                    {override && (
                      <span
                        title="Local override active"
                        className="inline-flex items-center text-slate-400 hover:text-slate-600 transition"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 mt-0.5">
                    {contact.number}
                    {contact.company && <span className="text-slate-400"> · {contact.company}</span>}
                  </div>

                  {isBusy && (
                    <div className="text-[11px] text-[#FF3B30] font-medium flex items-center gap-1 mt-0.5">
                      <Flame className="w-3 h-3" />
                      In a call with {override.talking_to || 'Someone'}
                    </div>
                  )}
                </div>

                {/* Direct Call Button (Routes directly to native phone dialer) */}
                <a
                  href={`tel:${contact.number.replace(/[^\d+*#]/g, '')}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    const clean = contact.number.replace(/[^\d+*#]/g, '');
                    window.location.href = `tel:${clean}`;
                  }}
                  className="min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center text-slate-400 hover:text-[#007AFF] hover:bg-blue-50/80 active:bg-blue-100 transition shrink-0 active:scale-95"
                  title={`Direct Call ${displayName} (${contact.number})`}
                >
                  <Phone className="w-[18px] h-[18px] stroke-[2.2]" />
                </a>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
