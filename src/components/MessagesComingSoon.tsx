import React from 'react';
import { MessageSquare, ShieldCheck, Sparkles, Inbox } from 'lucide-react';

export const MessagesComingSoon: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
      {/* Signature Truecaller-styled Circular Icon */}
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-full bg-[#0087FF]/10 flex items-center justify-center text-[#0087FF] shadow-sm">
          <MessageSquare className="w-11 h-11 stroke-[1.8]" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#0087FF] text-white flex items-center justify-center shadow-md">
          <Sparkles className="w-4 h-4 fill-white" />
        </div>
      </div>

      {/* Main Material 3 Heading */}
      <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-2">
        Messages Coming Soon!
      </h2>

      {/* Description */}
      <p className="text-sm text-slate-500 max-w-[280px] leading-relaxed mb-6">
        Local smart categorization, spam SMS shielding, and OTP protection will appear here — operating strictly offline with no cloud uploads.
      </p>

      {/* Material 3 Card detailing Local Privacy */}
      <div className="w-full max-w-[320px] bg-[#F4F7F9] rounded-2xl p-4 text-left border border-slate-100/80">
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-800">100% On-Device SMS Engine</div>
            <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
              Android messages stay encrypted on your phone. No INTERNET permission is ever granted.
            </div>
          </div>
        </div>
      </div>

      {/* Simulated category tabs preview */}
      <div className="flex items-center gap-2 mt-6">
        <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 flex items-center gap-1.5">
          <Inbox className="w-3 h-3" /> Inbox
        </span>
        <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500">
          Promotions
        </span>
        <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-red-50 text-[#EB3349]">
          Spam Shield
        </span>
      </div>
    </div>
  );
};
