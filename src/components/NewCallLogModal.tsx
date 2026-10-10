import React, { useState } from 'react';
import { X, PhoneCall, Plus } from 'lucide-react';
import { CallType } from '../types';
import { LocalSqliteStorage } from '../lib/storage';

interface NewCallLogModalProps {
  onClose: () => void;
  onAdded: () => void;
}

export const NewCallLogModal: React.FC<NewCallLogModalProps> = ({ onClose, onAdded }) => {
  const [number, setNumber] = useState('+1 ');
  const [name, setName] = useState('');
  const [type, setType] = useState<CallType>('incoming');
  const [duration, setDuration] = useState('45');
  const [sim, setSim] = useState('SIM 1 (Jio)');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!number.trim()) return;

    LocalSqliteStorage.addCallLog({
      number: number.trim(),
      name: name.trim() ? name.trim() : null,
      timestamp: Date.now(),
      duration: parseInt(duration, 10) || 0,
      type,
      sim,
    });

    onAdded();
    onClose();
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-in fade-in">
      <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#0087FF]/10 text-[#0087FF] flex items-center justify-center">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Inject Call Log Entry</h3>
              <p className="text-[11px] text-slate-400">Simulates Android CallLog.get()</p>
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
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Phone Number
            </label>
            <input
              type="text"
              required
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="+1 555 0192"
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0087FF]/30"
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
              <option value="SIM 1 (Jio)">SIM 1 (Jio)</option>
              <option value="SIM 2 (Airtel)">SIM 2 (Airtel)</option>
              <option value="SIM 1 (Verizon)">SIM 1 (Verizon)</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full h-11 mt-4 rounded-xl bg-[#0087FF] hover:bg-[#0073D9] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Append to Call Log
          </button>
        </form>
      </div>
    </div>
  );
};
