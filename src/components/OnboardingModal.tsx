import React, { useState } from 'react';
import { User, Phone, ShieldCheck, ArrowRight } from 'lucide-react';
import { DeviceService } from '../lib/deviceService';

interface OnboardingModalProps {
  onComplete: () => void;
  detectedCarrier?: string;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  onComplete,
  detectedCarrier,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    DeviceService.saveUserProfile({
      name: name.trim(),
      phoneNumber: phone.trim(),
      bio: 'Device User · Telephony Forensics',
      isConfigured: true,
    });

    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col space-y-4 animate-in zoom-in-95 duration-200">
        <div className="text-center space-y-1.5">
          <div className="w-14 h-14 rounded-2xl bg-[#0087FF]/10 text-[#0087FF] mx-auto flex items-center justify-center shadow-xs">
            <User className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
            Welcome to Forensic Call Finder
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Please enter your name and contact number to initialize your local on-device identity.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Your Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0087FF]/30 placeholder:text-slate-400 font-medium"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Phone Number
            </label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98300 00000"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0087FF]/30 placeholder:text-slate-400 font-mono"
              />
            </div>
            {detectedCarrier && (
              <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Detected network: {detectedCarrier}
              </p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full h-12 rounded-xl bg-[#0087FF] hover:bg-[#0073D9] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50 active:scale-98 cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="pt-1 flex items-center justify-center gap-1 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>100% Offline · Stored locally on device</span>
        </div>
      </div>
    </div>
  );
};
