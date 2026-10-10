import React, { useState } from 'react';
import {
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  PhoneOff,
  CheckCircle2,
  Phone,
  Flame,
  Clock,
  Radio
} from 'lucide-react';
import { CallLogEntry, ContactItem, ManualOverride } from '../types';

interface RecentsScreenProps {
  callLogs: CallLogEntry[];
  shadowOverrides: Record<string, ManualOverride>;
  searchQuery: string;
  contacts?: ContactItem[];
  onSelectEntry: (entry: CallLogEntry) => void;
}

export const RecentsScreen: React.FC<RecentsScreenProps> = ({
  callLogs,
  shadowOverrides,
  searchQuery,
  contacts = [],
  onSelectEntry,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'missed' | 'incoming' | 'outgoing' | 'busy'>('all');

  // Filter logs based on search query and category
  const filtered = callLogs.filter((log) => {
    const override = shadowOverrides[log.number.trim()];
    const displayName = override?.custom_name || log.name || log.number;
    const matchesSearch =
      displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (override?.talking_to && override.talking_to.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterType === 'all') return true;
    if (filterType === 'busy') return override?.is_busy === true;
    if (filterType === 'missed') return log.type === 'missed' || log.type === 'rejected';
    if (filterType === 'incoming') return log.type === 'incoming';
    if (filterType === 'outgoing') return log.type === 'outgoing';
    return true;
  });

  const formatTimestamp = (ts: number): string => {
    const date = new Date(ts);
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getDayGroup = (ts: number): string => {
    const date = new Date(ts);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) return 'Today';

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const renderCallTypeIcon = (type: string) => {
    switch (type) {
      case 'incoming':
        return <PhoneIncoming className="w-3.5 h-3.5 text-[#0087FF]" />;
      case 'outgoing':
        return <PhoneOutgoing className="w-3.5 h-3.5 text-emerald-600" />;
      case 'missed':
        return <PhoneMissed className="w-3.5 h-3.5 text-[#EB3349]" />;
      case 'rejected':
        return <PhoneOff className="w-3.5 h-3.5 text-[#EB3349]" />;
      default:
        return <PhoneIncoming className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  // Group filtered calls by day
  const groupedCalls: Record<string, CallLogEntry[]> = {};
  filtered.forEach((log) => {
    const group = getDayGroup(log.timestamp);
    if (!groupedCalls[group]) groupedCalls[group] = [];
    groupedCalls[group].push(log);
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Material 3 Segmented Filter Tabs (Modern unboxed tactile pills) */}
      <div className="px-4 py-2.5 flex items-center gap-1.5 overflow-x-auto border-b border-slate-100 scrollbar-none shrink-0 bg-white">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            filterType === 'all'
              ? 'bg-[#0087FF] text-white shadow-xs'
              : 'bg-[#F4F7F9] text-slate-600 hover:bg-slate-200/80'
          }`}
        >
          All Calls ({callLogs.length})
        </button>
        <button
          onClick={() => setFilterType('busy')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            filterType === 'busy'
              ? 'bg-[#EB3349] text-white shadow-xs'
              : 'bg-rose-50 text-[#EB3349] hover:bg-rose-100/70'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          In Call
        </button>
        <button
          onClick={() => setFilterType('missed')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            filterType === 'missed'
              ? 'bg-[#EB3349] text-white shadow-xs'
              : 'bg-[#F4F7F9] text-slate-600 hover:bg-slate-200/80'
          }`}
        >
          Missed
        </button>
        <button
          onClick={() => setFilterType('incoming')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            filterType === 'incoming'
              ? 'bg-[#0087FF] text-white shadow-xs'
              : 'bg-[#F4F7F9] text-slate-600 hover:bg-slate-200/80'
          }`}
        >
          Incoming
        </button>
        <button
          onClick={() => setFilterType('outgoing')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            filterType === 'outgoing'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-[#F4F7F9] text-slate-600 hover:bg-slate-200/80'
          }`}
        >
          Outgoing
        </button>
      </div>

      {/* Recents Call List with clean day dividers */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center p-6 text-center text-slate-400">
            <Clock className="w-10 h-10 mb-2 stroke-[1.5] text-slate-300" />
            <div className="font-semibold text-slate-700 text-sm">No Recent Calls</div>
            <div className="text-xs text-slate-400 mt-1 max-w-xs">
              {searchQuery
                ? 'No calls match your search.'
                : 'Your call history from native Android call logs will appear here.'}
            </div>
          </div>
        ) : (
          Object.entries(groupedCalls).map(([dayLabel, logs]) => (
            <div key={dayLabel} className="border-b border-slate-100 last:border-b-0">
              {/* Day Section Header */}
              <div className="px-4 py-2 bg-slate-50/70 border-y border-slate-100/60 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {dayLabel}
              </div>

              <div className="divide-y divide-slate-100/70">
                {logs.map((log) => {
                  const override = shadowOverrides[log.number.trim()];
                  const isBusy = override?.is_busy ?? false;
                  const talkingTo = override?.talking_to ?? '';
                  const matchedContact = contacts.find(
                    (c) => c.number.trim() === log.number.trim()
                  );
                  // Smart verification badging: auto-verified IF saved in actual device contacts
                  const isVerified = !!matchedContact;
                  const displayName = override?.custom_name || matchedContact?.name || log.name || log.number;
                  const initial = (displayName[0] || '?').toUpperCase();
                  const avatarSrc = override?.avatar_url || matchedContact?.avatarUrl;

                  return (
                    <div
                      key={log.id}
                      onClick={() => onSelectEntry(log)}
                      className="px-4 py-3 hover:bg-slate-50 active:bg-slate-100/80 transition flex items-center gap-3.5 cursor-pointer group"
                    >
                      {/* Avatar with Status Dot (dots kept on home screen) */}
                      <div className="relative shrink-0">
                        {avatarSrc ? (
                          <img
                            src={avatarSrc}
                            alt={displayName}
                            className="w-11 h-11 rounded-2xl object-cover shadow-xs transition-transform group-hover:scale-102 border border-slate-100"
                          />
                        ) : (
                          <div
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-base shadow-xs transition-transform group-hover:scale-102 ${
                              override?.tag === 'vip'
                                ? 'bg-amber-500'
                                : 'bg-[#0087FF]'
                            }`}
                          >
                            {initial}
                          </div>
                        )}

                        {/* Availability Dot */}
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                            isBusy ? 'bg-[#EB3349]' : 'bg-[#10B981]'
                          }`}
                          title={isBusy ? 'In a Call' : 'Available'}
                        />
                      </div>

                      {/* Caller Information */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-bold text-[14.5px] truncate ${
                              isBusy ? 'text-[#EB3349]' : 'text-slate-900'
                            }`}
                          >
                            {displayName}
                          </span>

                          {/* Blue Verified Tick */}
                          {isVerified && (
                            <span title="Verified" className="inline-flex shrink-0">
                              <CheckCircle2 className="w-4 h-4 text-[#0087FF] fill-[#0087FF] stroke-white" />
                            </span>
                          )}

                          {override?.is_blocked && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded ml-0.5 border border-rose-200">
                              Blocked
                            </span>
                          )}
                        </div>

                        {/* Subtitle: Status / Available */}
                        <div className="flex items-center gap-1.5 text-xs mt-0.5 truncate">
                          {isBusy ? (
                            <span className="text-[#EB3349] font-medium flex items-center gap-1 truncate">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#EB3349] shrink-0" />
                              In a call with{' '}
                              <strong className="underline underline-offset-2">
                                {talkingTo || 'another caller'}
                              </strong>
                            </span>
                          ) : (
                            <span className="text-slate-500 flex items-center gap-1.5 truncate">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] shrink-0" />
                              <span className="text-emerald-700 font-medium">Available</span>
                              <span className="text-slate-300">·</span>
                              <span className="flex items-center gap-1 text-slate-500 font-mono text-[11px]">
                                {renderCallTypeIcon(log.type)}
                                {formatTimestamp(log.timestamp)}
                              </span>
                            </span>
                          )}
                        </div>

                        {/* Real Device SIM & Duration Info (Taken directly from hardware log, not guessed) */}
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5 truncate font-mono">
                          <Radio className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="text-slate-600 font-medium">{log.sim}</span>
                          {log.duration > 0 && (
                            <>
                              <span className="text-slate-300">·</span>
                              <span>{Math.floor(log.duration / 60)}m {log.duration % 60}s</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Trailing Direct Call Button (Routes directly to native phone dialer) */}
                      <a
                        href={`tel:${log.number.replace(/[^\d+*#]/g, '')}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          const cleanNum = log.number.replace(/[^\d+*#]/g, '');
                          window.location.href = `tel:${cleanNum}`;
                        }}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-[#0087FF] hover:bg-blue-50/80 active:bg-blue-100 transition active:scale-95 shrink-0"
                        title={`Call ${displayName} on device dialer (${log.number})`}
                      >
                        <Phone className="w-[18px] h-[18px] stroke-[2.2]" />
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
