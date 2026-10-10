import React, { useState } from 'react';
import { CheckCircle2, Phone, Flame } from 'lucide-react';
import { ContactItem, ManualOverride } from '../types';

interface ContactsScreenProps {
  contacts: ContactItem[];
  shadowOverrides: Record<string, ManualOverride>;
  onSelectContact: (contact: ContactItem) => void;
  searchQuery: string;
}

export const ContactsScreen: React.FC<ContactsScreenProps> = ({
  contacts,
  shadowOverrides,
  onSelectContact,
  searchQuery,
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
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
              filter === 'all'
                ? 'bg-[#0087FF] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('overridden')}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
              filter === 'overridden'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            With SQLite Overrides
          </button>
        </div>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100/70">
        {filtered.map((contact) => {
          const override = shadowOverrides[contact.number.trim()];
          const isBusy = override?.is_busy ?? false;
          // Smart verification: saved in user's actual device contacts
          const isVerified = true;
          const displayName = override?.custom_name || contact.name;
          const initial = displayName[0]?.toUpperCase() || '?';

          const avatarSrc = override?.avatar_url || contact.avatarUrl;

          return (
            <div
              key={contact.id}
              onClick={() => onSelectContact(contact)}
              className="px-4 py-3 flex items-center gap-3.5 hover:bg-slate-50 active:bg-slate-100 transition cursor-pointer group"
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
                    style={{ backgroundColor: contact.avatarColor }}
                  >
                    {initial}
                  </div>
                )}
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                    isBusy ? 'bg-[#EB3349]' : 'bg-[#10B981]'
                  }`}
                  title={isBusy ? 'In a Call' : 'Available'}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-semibold text-sm truncate ${
                      isBusy ? 'text-[#EB3349]' : 'text-slate-800'
                    }`}
                  >
                    {displayName}
                  </span>
                  {isVerified && (
                    <CheckCircle2 className="w-4 h-4 text-[#0087FF] fill-[#0087FF] stroke-white shrink-0" />
                  )}
                  {override && (
                    <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                      Shadow DB
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-500 mt-0.5">
                  {contact.number}
                  {contact.company && <span className="text-slate-400"> · {contact.company}</span>}
                </div>

                {isBusy && (
                  <div className="text-[11px] text-[#EB3349] font-medium flex items-center gap-1 mt-0.5">
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
                className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-[#0087FF] hover:bg-blue-50/80 active:bg-blue-100 transition shrink-0 active:scale-95"
                title={`Direct Call ${displayName} (${contact.number})`}
              >
                <Phone className="w-[18px] h-[18px] stroke-[2.2]" />
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
};
