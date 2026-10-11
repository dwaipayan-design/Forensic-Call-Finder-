import React, { useState } from 'react';
import { Users, X, Search, Check } from 'lucide-react';
import { ContactItem } from '../types';

interface SelectContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: ContactItem[];
  onSelect: (contact: ContactItem) => void;
  excludeNumber?: string;
  title?: string;
}

export const SelectContactModal: React.FC<SelectContactModalProps> = ({
  isOpen,
  onClose,
  contacts,
  onSelect,
  excludeNumber,
  title = 'Select Contact',
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const rawClean = excludeNumber ? excludeNumber.replace(/\D/g, '') : '';

  const filteredContacts = contacts
    .filter((c) => {
      if (!rawClean) return true;
      const cClean = c.number.replace(/\D/g, '');
      return cClean !== rawClean && c.number.trim() !== excludeNumber?.trim();
    })
    .filter((c) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      const cClean = c.number.replace(/\D/g, '');
      const qClean = q.replace(/\D/g, '');
      return (
        c.name.toLowerCase().includes(q) ||
        c.number.includes(q) ||
        (qClean && cClean.includes(qClean))
      );
    });

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#0087FF]/10 text-[#0087FF] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{title}</h3>
              <p className="text-[11px] text-slate-400">Device Phone Book</p>
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

        {/* Search Input */}
        <div className="pt-3 pb-2 shrink-0">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts..."
              autoFocus
              className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0087FF]/30"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100/80 -mx-1 px-1 mt-1">
          {filteredContacts.map((contact) => (
            <button
              key={contact.id}
              type="button"
              onClick={() => {
                onSelect(contact);
                onClose();
              }}
              className="w-full py-2.5 px-2 flex items-center gap-3 hover:bg-slate-50 rounded-xl transition text-left cursor-pointer group"
            >
              {contact.avatarUrl ? (
                <img
                  src={contact.avatarUrl}
                  alt={contact.name}
                  className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-100"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-full text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs"
                  style={{ backgroundColor: contact.avatarColor }}
                >
                  {(contact.name[0] || '?').toUpperCase()}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-900 group-hover:text-[#0087FF] transition truncate">
                  {contact.name}
                </div>
                <div className="text-[11px] font-mono text-slate-400 truncate">
                  {contact.number}
                  {contact.company && ` · ${contact.company}`}
                </div>
              </div>

              <div className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:border-[#0087FF] group-hover:text-[#0087FF] group-hover:bg-blue-50 transition shrink-0">
                <Check className="w-3.5 h-3.5" />
              </div>
            </button>
          ))}

          {filteredContacts.length === 0 && (
            <div className="py-8 text-center text-slate-400 text-xs">
              {search ? `No contacts matching "${search}"` : 'No contacts found in device.'}
            </div>
          )}
        </div>

        {/* Cancel Button */}
        <div className="pt-3 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-9 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
          >
            Close Picker
          </button>
        </div>
      </div>
    </div>
  );
};
