import React, { useState } from 'react';
import { User, Phone, ShieldCheck, ArrowRight, ChevronDown } from 'lucide-react';
import { DeviceService } from '../lib/deviceService';
import { ALL_COUNTRY_CODES, CountryCode } from '../data/countryCodes';
import { CountryCodeSelectorModal } from './CountryCodeSelectorModal';

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
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(
    ALL_COUNTRY_CODES.find((c) => c.code === '+1' && c.iso === 'US') || ALL_COUNTRY_CODES[0]
  );
  const [showCountryModal, setShowCountryModal] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let formattedPhone = phone.trim();
    if (formattedPhone && !formattedPhone.startsWith('+')) {
      formattedPhone = `${selectedCountry.code} ${formattedPhone}`;
    }

    DeviceService.saveUserProfile({
      name: name.trim(),
      phoneNumber: formattedPhone,
      bio: 'Device User · Telephony Forensics',
      isConfigured: true,
    });

    onComplete();
  };

  return (
    <>
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Phone Number
                </label>
                <span className="text-[10px] text-slate-500 font-medium">
                  {selectedCountry.country} ({selectedCountry.code})
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCountryModal(true)}
                  className="h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center gap-1.5 text-xs font-medium text-slate-800 transition shrink-0 cursor-pointer"
                  title={`${selectedCountry.country} (${selectedCountry.code})`}
                >
                  <span className="text-base leading-none">{selectedCountry.flag}</span>
                  <span className="font-mono font-bold text-slate-700">{selectedCountry.code}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="98300 00000"
                  className="flex-1 h-11 px-3.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0087FF]/30 placeholder:text-slate-400 font-mono"
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
