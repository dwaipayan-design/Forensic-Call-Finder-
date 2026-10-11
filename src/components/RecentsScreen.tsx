import React, { useState } from 'react';
import {
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  PhoneOff,
  CheckCircle2,
  Phone,
  Flame,
  Radio,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  PhoneCall,
} from 'lucide-react';
import { CallLogEntry, ContactItem, ManualOverride } from '../types';

interface RecentsScreenProps {
  callLogs: CallLogEntry[];
  shadowOverrides: Record<string, ManualOverride>;
  searchQuery: string;
  contacts?: ContactItem[];
  onSelectEntry: (entry: CallLogEntry) => void;
  permissionStatus?: 'granted' | 'denied' | 'prompt';
  onRequestPermission?: () => void;
  onOpenSettings?: () => void;
  isSyncing?: boolean;
}

export const RecentsScreen: React.FC<RecentsScreenProps> = ({
  callLogs,
  shadowOverrides,
  searchQuery,
  contacts = [],
  onSelectEntry,
  permissionStatus = 'granted',
  onRequestPermission,
  onOpenSettings,
  isSyncing = false,
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
        return <PhoneIncoming className="w-3.5 h-3.5 text-[#007AFF]" />;
      case 'outgoing':
        return <PhoneOutgoing className="w-3.5 h-3.5 text-[#34C759]" />;
      case 'missed':
        return <PhoneMissed className="w-3.5 h-3.5 text-[#FF3B30]" />;
      case 'rejected':
        return <PhoneOff className="w-3.5 h-3.5 text-[#FF3B30]" />;
      default:
        return <PhoneIncoming className="w-3.5 h-3.5 text-[#8E8E93]" />;
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
      {/* Material 3 / iOS Segmented Filter Tabs */}
      <div className="px-4 py-2 flex items-center gap-1.5 overflow-x-auto border-b border-slate-100 scrollbar-none shrink-0 bg-white">
        <button
          onClick={() => setFilterType('all')}
          className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            filterType === 'all'
              ? 'bg-[#007AFF] text-white shadow-xs'
              : 'bg-[#F2F2F7] text-slate-600 hover:bg-slate-200/80'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilterType('busy')}
          className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            filterType === 'busy'
              ? 'bg-[#FF9500] text-white shadow-xs'
              : 'bg-[#F2F2F7] text-slate-600 hover:bg-slate-200/80'
          }`}
        >
          In a Call
        </button>
        <button
          onClick={() => setFilterType('missed')}
          className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            filterType === 'missed'
              ? 'bg-[#FF3B30] text-white shadow-xs'
              : 'bg-[#F2F2F7] text-slate-600 hover:bg-slate-200/80'
          }`}
        >
          Missed
        </button>
        <button
          onClick={() => setFilterType('incoming')}
          className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            filterType === 'incoming'
              ? 'bg-[#007AFF] text-white shadow-xs'
              : 'bg-[#F2F2F7] text-slate-600 hover:bg-slate-200/80'
          }`}
        >
          Incoming
        </button>
        <button
          onClick={() => setFilterType('outgoing')}
          className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            filterType === 'outgoing'
              ? 'bg-[#34C759] text-white shadow-xs'
              : 'bg-[#F2F2F7] text-slate-600 hover:bg-slate-200/80'
          }`}
        >
          Outgoing
        </button>
      </div>

      {/* Recents Call List with clean day dividers */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="min-h-[360px] flex flex-col items-center justify-center p-6 text-center">
            {searchQuery ? (
              <div className="max-w-xs space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <PhoneCall className="w-6 h-6 stroke-[1.5]" />
                </div>
                <div className="font-semibold text-slate-800 text-sm">No Matching Calls</div>
                <div className="text-xs text-slate-400">No recent call records matched your search query "{searchQuery}".</div>
              </div>
            ) : permissionStatus === 'denied' ? (
              <div className="max-w-sm w-full bg-[#F2F2F7] p-5 rounded-2xl flex flex-col items-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-[#FF3B30]">
                  <ShieldAlert className="w-6 h-6 stroke-[2]" />
                </div>
                <div className="font-bold text-slate-900 text-sm">Android Call Log Permission Required</div>
                <div className="text-xs text-slate-500 leading-relaxed">
                  The app is configured to read genuine Android device call logs instead of showing mock records. Please allow Call Log permission in Android Settings.
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
                    Grant Call Log Permission
                  </button>
                ) : null}
              </div>
            ) : permissionStatus === 'prompt' ? (
              <div className="max-w-sm w-full bg-[#F2F2F7] p-5 rounded-2xl flex flex-col items-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-[#007AFF]">
                  <ShieldCheck className="w-6 h-6 stroke-[2]" />
                </div>
                <div className="font-bold text-slate-900 text-sm">Connect Real Android Call Logs</div>
                <div className="text-xs text-slate-500 leading-relaxed">
                  Allow access to synchronize genuine incoming, outgoing, and missed call history directly from your device telephony hardware.
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
                        <span>Synchronizing Calls...</span>
                      </>
                    ) : (
                      <span>Allow Call Log Access</span>
                    )}
                  </button>
                )}
              </div>
            ) : (
              <div className="max-w-xs space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <PhoneCall className="w-6 h-6 stroke-[1.5]" />
                </div>
                <div className="font-semibold text-slate-800 text-sm">No Recent Calls Recorded</div>
                <div className="text-xs text-slate-400 leading-relaxed">
                  Genuine device call history is active. Incoming and outgoing calls will appear here automatically.
                </div>
                {onRequestPermission && (
                  <button
                    onClick={onRequestPermission}
                    disabled={isSyncing}
                    className="min-h-[44px] px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium rounded-xl active:scale-95 transition inline-flex items-center gap-2"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#007AFF]' : ''}`} />
                    <span>Check for New Calls</span>
                  </button>
                )}
              </div>
            )}
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
                      className="px-4 py-3 hover:bg-slate-50 active:bg-slate-100/80 transition flex items-center gap-3.5 cursor-pointer group min-h-[56px]"
                    >
                      {/* Avatar with Status Dot */}
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
                                : 'bg-[#007AFF]'
                            }`}
                          >
                            {initial}
                          </div>
                        )}

                        {/* Availability Dot */}
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                            isBusy ? 'bg-[#FF3B30]' : 'bg-[#34C759]'
                          }`}
                          title={isBusy ? 'In a Call' : 'Available'}
                        />
                      </div>

                      {/* Caller Information */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-bold text-[14.5px] truncate ${
                              isBusy ? 'text-[#FF3B30]' : 'text-slate-900'
                            }`}
                          >
                            {displayName}
                          </span>

                          {/* Blue Verified Tick */}
                          {isVerified && (
                            <span title="Verified in device contacts" className="inline-flex shrink-0">
                              <CheckCircle2 className="w-4 h-4 text-[#007AFF] fill-[#007AFF] stroke-white" />
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
                            <span className="text-[#FF3B30] font-medium flex items-center gap-1 truncate">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#FF3B30] shrink-0" />
                              In a call with{' '}
                              <strong className="underline underline-offset-2">
                                {talkingTo || 'another caller'}
                              </strong>
                            </span>
                          ) : (
                            <span className="text-slate-500 flex items-center gap-1.5 truncate">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] shrink-0" />
                              <span className="text-emerald-700 font-medium">Available</span>
                              <span className="text-slate-300">·</span>
                              <span className="flex items-center gap-1 text-slate-500 font-mono text-[11px]">
                                {renderCallTypeIcon(log.type)}
                                {formatTimestamp(log.timestamp)}
                              </span>
                            </span>
                          )}
                        </div>

                        {/* Real Device SIM & Duration Info */}
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
                        className="min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center text-slate-400 hover:text-[#007AFF] hover:bg-blue-50/80 active:bg-blue-100 transition active:scale-95 shrink-0"
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
