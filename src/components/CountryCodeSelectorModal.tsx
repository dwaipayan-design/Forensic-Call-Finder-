import React, { useState, useMemo } from 'react';
import { Search, X, Check, Globe } from 'lucide-react';
import { ALL_COUNTRY_CODES, CountryCode } from '../data/countryCodes';

interface CountryCodeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCode: string;
  onSelect: (country: CountryCode) => void;
}

export const CountryCodeSelectorModal: React.FC<CountryCodeSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedCode,
  onSelect,
}) => {
  const [search, setSearch] = useState('');

  const filteredCountries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ALL_COUNTRY_CODES;
    return ALL_COUNTRY_CODES.filter(
      (c) =>
        c.country.toLowerCase().includes(q) ||
        c.code.includes(q) ||
        c.iso.toLowerCase().includes(q)
    );
  }, [search]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-white animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#0087FF]" />
            <h3 className="font-bold text-sm tracking-tight text-white font-sans">
              Select International Country Code
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search input */}
        <div className="p-3 border-b border-slate-800 bg-slate-950/50">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by country name, +code, or ISO (e.g. India, +91, US)..."
              className="w-full h-9 pl-9 pr-8 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#0087FF] font-sans"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Popular Quick-Select Jurisdictions */}
        {!search && (
          <div className="px-3 py-2 border-b border-slate-800/80 bg-slate-900/40 flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono scrollbar-none">
            <span className="text-slate-500 text-[10px] shrink-0 font-sans">Popular:</span>
            {[
              { code: '+1', country: 'USA' },
              { code: '+91', country: 'India' },
              { code: '+44', country: 'UK' },
              { code: '+971', country: 'UAE' },
              { code: '+65', country: 'Singapore' },
              { code: '+49', country: 'Germany' },
              { code: '+81', country: 'Japan' },
            ].map((p) => (
              <button
                key={p.country}
                type="button"
                onClick={() => {
                  const match = ALL_COUNTRY_CODES.find((c) => c.code === p.code);
                  if (match) {
                    onSelect(match);
                    onClose();
                  }
                }}
                className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition shrink-0"
              >
                {p.code} {p.country}
              </button>
            ))}
          </div>
        )}

        {/* Country List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50 p-1 font-sans">
          {filteredCountries.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No matching countries found for "{search}"
            </div>
          ) : (
            filteredCountries.map((item) => {
              const isSelected = selectedCode === item.code;
              return (
                <button
                  key={`${item.iso}-${item.code}-${item.country}`}
                  type="button"
                  onClick={() => {
                    onSelect(item);
                    onClose();
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl flex items-center justify-between text-left transition ${
                    isSelected
                      ? 'bg-[#0087FF]/15 text-white'
                      : 'hover:bg-slate-800/60 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-lg leading-none shrink-0">{item.flag}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate flex items-center gap-1.5">
                        <span>{item.country}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({item.iso})</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">
                        {item.standard}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-xs font-bold text-[#0087FF]">
                      {item.code}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#0087FF]" />}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
