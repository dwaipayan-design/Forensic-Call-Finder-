import React from 'react';
import { Search, X } from 'lucide-react';

interface TruecallerHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenUserProfile: () => void;
}

export const TruecallerHeader: React.FC<TruecallerHeaderProps> = ({
  searchQuery,
  onSearchChange,
  onOpenUserProfile,
}) => {
  return (
    <header className="px-4 py-3 bg-white border-b border-slate-100 shrink-0 z-20">
      {/* Top Search Bar Row */}
      <div className="flex items-center gap-2.5">
        <div className="flex-1 h-11 bg-[#F4F7F9] hover:bg-[#EEF2F6] transition-colors rounded-full flex items-center px-3.5 gap-2.5 border border-transparent focus-within:border-[#0087FF]/40 focus-within:bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <Search className="w-4 h-4 text-[#0087FF] shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search numbers, names & more"
            className="w-full bg-transparent border-none text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* User Avatar - opens User Profile */}
        <button
          onClick={onOpenUserProfile}
          className="w-10 h-10 rounded-full bg-[#0087FF] text-white font-bold text-xs flex items-center justify-center shadow-sm hover:ring-2 hover:ring-[#0087FF]/40 transition shrink-0 active:scale-95"
          title="Network Forensics by Dwaipayan"
        >
          DC
        </button>
      </div>
    </header>
  );
};
