import React, { useState } from 'react';
import { X, PhoneCall, Plus, UserCheck, Calendar, Clock, ChevronDown } from 'lucide-react';
import { CallType, ContactItem } from '../types';
import { NativeAndroidService } from '../lib/nativeAndroidService';
import { SelectContactModal } from './SelectContactModal';
import { CountryCodeSelectorModal } from './CountryCodeSelectorModal';
import { ALL_COUNTRY_CODES, CountryCode } from '../data/countryCodes';

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
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ContactItem | null>(null);

  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(
    ALL_COUNTRY_CODES.find((c) => c.code === '+1' && c.iso === 'US') || ALL_COUNTRY_CODES[0]
  );
  const [showCountryModal, setShowCountryModal] = useState(false);

  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<CallType>('incoming');
  const [duration, setDuration] = useState('45');
  const [sim, setSim] = useState(defaultSim || 'SIM 1 (Active)');

  // Date and Time picker state
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const [callDate, setCallDate] = useState(dateStr);
  const [callTime, setCallTime] = useState(timeStr);

  const handleContactSelect = (contact: ContactItem) => {
    setSelectedContact(contact);
    setNumber(contact.number);
    setName(contact.name);
  };

  const handleClearSelectedContact = () => {
    setSelectedContact(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!number.trim()) return;

    // Format phone number with country code if not already formatted with a leading +
    let formattedNumber = number.trim();
    if (!formattedNumber.startsWith('+')) {
      formattedNumber = `${selectedCountry.code} ${formattedNumber}`;
    }

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
      number: formattedNumber,
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
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 animate-in fade-in">
        <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 animate-in slide-in-from-bottom duration-200 max-h-[92vh] overflow-y-auto">
          {/* Header */}
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
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            {/* Contact Picker from Real Device Address Book */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-[#0087FF]" />
                Select from Device Contacts
              </label>

              {selectedContact ? (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {selectedContact.avatarUrl ? (
                      <img
                        src={selectedContact.avatarUrl}
                        alt={selectedContact.name}
                        className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200"
                      />
                    ) : (
                      <div
                        className="w-9 h-9 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs"
                        style={{ backgroundColor: selectedContact.avatarColor || '#0087FF' }}
                      >
                        {(selectedContact.name[0] || '?').toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {selectedContact.name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 truncate">
                        {selectedContact.number}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowContactPicker(true)}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#0087FF] text-xs font-semibold hover:bg-blue-100 transition cursor-pointer"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={handleClearSelectedContact}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowContactPicker(true)}
                  className="w-full h-11 px-3 rounded-xl border border-dashed border-slate-300 hover:border-[#0087FF] text-xs font-semibold text-slate-600 hover:text-[#0087FF] bg-slate-50 hover:bg-blue-50/50 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <UserCheck className="w-4 h-4 text-[#0087FF]" />
                  <span>Select from Device Contacts...</span>
                </button>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Phone Number
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {selectedCountry.country} ({selectedCountry.code})
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCountryModal(true)}
                  className="h-10 px-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center gap-1.5 text-xs font-medium text-slate-800 transition shrink-0 cursor-pointer"
                  title={`${selectedCountry.country} (${selectedCountry.code})`}
                >
                  <span className="text-base leading-none">{selectedCountry.flag}</span>
                  <span className="font-mono font-bold text-slate-700">{selectedCountry.code}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <input
                  type="text"
                  required
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="98301 00000"
                  className="flex-1 h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0087FF]/30 font-mono"
                />
              </div>
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
              className="w-full h-11 mt-4 rounded-xl bg-[#0087FF] hover:bg-[#0073D9] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-98 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Append to Call Log
            </button>
          </form>
        </div>
      </div>

      {/* Reusable Select Contact Modal */}
      <SelectContactModal
        isOpen={showContactPicker}
        onClose={() => setShowContactPicker(false)}
        contacts={contacts}
        onSelect={handleContactSelect}
        title="Select Contact"
      />

      {/* 240+ International Country Directory Selector Modal */}
      <CountryCodeSelectorModal
        isOpen={showCountryModal}
        onClose={() => setShowCountryModal(false)}
        selectedCode={selectedCountry.code}
        onSelect={(country) => setSelectedCountry(country)}
      />
    </>
  );
};
