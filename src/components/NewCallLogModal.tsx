import React, { useState } from 'react';
import { X, PhoneCall, Plus, UserCheck, Calendar, Clock } from 'lucide-react';
import { CallType, ContactItem } from '../types';
import { NativeAndroidService } from '../lib/nativeAndroidService';

interface NewCallLogModalProps {
  onClose: () => void;
  onAdded: () => void;
  contacts?: ContactItem[];
  defaultSim?: string;
}

export const NewCallLogModal: React.FC<NewCallLogModalProps> = ({
  onClose,
  onAdded,
  contacts = [],
  defaultSim,
}) => {
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<CallType>('incoming');
  const [duration, setDuration] = useState('45');
  const [sim, setSim] = useState(defaultSim || 'SIM 1 (Primary)');

  // Date and Time picker state
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const [callDate, setCallDate] = useState(dateStr);
  const [callTime, setCallTime] = useState(timeStr);

  const handleContactSelect = (contactId: string) => {
    setSelectedContactId(contactId);
    if (!contactId) return;

    const found = contacts.find((c) => c.id === contactId);
    if (found) {
      setNumber(found.number);
      setName(found.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!number.trim()) return;

    // Construct epoch timestamp from date and time
    let timestamp = Date.now();
    try {
      if (callDate && callTime) {
        const parsed = new Date(`${callDate}T${callTime}:00`);
        if (!isNaN(parsed.getTime())) {
          timestamp = parsed.getTime();
        }
      }
    } catch (err) {
      // fallback to Date.now()
    }

    await NativeAndroidService.insertCallLog({
      number: number.trim(),
      name: name.trim() ? name.trim() : null,
      timestamp,
      duration: parseInt(duration, 10) || 0,
      type,
      sim,
    });

    onAdded();
    onClose();
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-in fade-in">
      <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 animate-in slide-in-from-bottom duration-200 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#0087FF]/10 text-[#0087FF] flex items-center justify-center">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Inject Call Log Entry</h3>
              <p className="text-[11px] text-slate-400">Writes to Call History & Android Provider</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {/* Contact Picker from Real Device Address Book */}
          {contacts.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-[#0087FF]" />
                Select from Device Contacts (Optional)
              </label>
              <select
                value={selectedContactId}
                onChange={(e) => handleContactSelect(e.target.value)}
                className="w-full h-10 px-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0087FF]/30"
              >
                <option value="">-- Choose an existing contact or enter manually --</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.number})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Phone Number
            </label>
            <input
              type="text"
              required
              value={number}
              onChange={(e) => {
                setNumber(e.target.value);
                if (selectedContactId) setSelectedContactId('');
              }}
              placeholder="+91 98301 00000"
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0087FF]/30 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Caller Name (Optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. David Miller"
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0087FF]/30"
            />
          </div>

          {/* Date & Time Picker */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Date
              </label>
              <input
                type="date"
                required
                value={callDate}
                onChange={(e) => setCallDate(e.target.value)}
                className="w-full h-10 px-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0087FF]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Time
              </label>
              <input
                type="time"
                required
                value={callTime}
                onChange={(e) => setCallTime(e.target.value)}
                className="w-full h-10 px-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0087FF]/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Call Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as CallType)}
                className="w-full h-10 px-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0087FF]/30"
              >
                <option value="incoming">Incoming</option>
                <option value="outgoing">Outgoing</option>
                <option value="missed">Missed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Duration (sec)
              </label>
              <input
                type="number"
                min="0"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0087FF]/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              SIM Slot
            </label>
            <select
              value={sim}
              onChange={(e) => setSim(e.target.value)}
              className="w-full h-10 px-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0087FF]/30"
            >
              <option value="SIM 1 (Active)">SIM 1 (Active)</option>
              <option value="SIM 2 (Active)">SIM 2 (Active)</option>
              <option value="SIM 1 (Primary eSIM)">SIM 1 (Primary eSIM)</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full h-11 mt-4 rounded-xl bg-[#0087FF] hover:bg-[#0073D9] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-98"
          >
            <Plus className="w-4 h-4" />
            Append to Call Log
          </button>
        </form>
      </div>
    </div>
  );
};
