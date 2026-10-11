import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Edit3,
  Check,
  Cpu,
  Radio,
  FileText,
  Lock,
  Unlock,
  KeyRound,
  Plus,
  RefreshCw,
  AlertCircle,
  Save,
  Phone,
  User,
  ShieldCheck,
  SlidersHorizontal
} from 'lucide-react';
import { UserProfile } from '../types';
import { DeviceService, DeviceHardwareTelemetry } from '../lib/deviceService';
import { LocalSqliteStorage } from '../lib/storage';
import { NetworkService, NetworkTelemetry } from '../lib/networkService';

interface UserProfileDrawerProps {
  onClose: () => void;
  onOpenAddLog: () => void;
  onRefreshData: () => void;
}

export const UserProfileDrawer: React.FC<UserProfileDrawerProps> = ({
  onClose,
  onOpenAddLog,
  onRefreshData,
}) => {
  const [profile, setProfile] = useState<UserProfile>(DeviceService.getUserProfile());
  const [telemetry, setTelemetry] = useState<DeviceHardwareTelemetry>(DeviceService.getRealHardwareTelemetry());
  const [networkInfo, setNetworkInfo] = useState<NetworkTelemetry | null>(null);

  // Editing mode states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [editPhone, setEditPhone] = useState(profile.phoneNumber);
  const [editBio, setEditBio] = useState(profile.bio);

  // Hidden More Details PIN (3329) states
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  // Feature locked/hidden state: if wrong PIN is entered, silently hide the entire section until app restart
  const [isFeatureLockedOut, setIsFeatureLockedOut] = useState(() => {
    return sessionStorage.getItem('adv_device_ctrl_locked') === 'true';
  });

  useEffect(() => {
    const p = DeviceService.getUserProfile();
    const t = DeviceService.getRealHardwareTelemetry();
    setProfile(p);
    setTelemetry(t);
    setEditName(p.name);
    setEditPhone(p.phoneNumber);
    setEditBio(p.bio);

    NetworkService.getNetworkTelemetry().then((net) => {
      setNetworkInfo(net);
    });
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = DeviceService.saveUserProfile({
      name: editName.trim(),
      phoneNumber: editPhone.trim(),
      bio: editBio.trim() || 'Telephony Analysis',
    });
    setProfile(updated);
    setIsEditingProfile(false);
    onRefreshData();
  };

  const handleUnlockPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === '3329') {
      setIsUnlocked(true);
    } else {
      // If someone puts wrong password: don't tell real password, lock feature until app restart, make tab disappear silently
      setIsFeatureLockedOut(true);
      sessionStorage.setItem('adv_device_ctrl_locked', 'true');
      setShowPinPrompt(false);
      setPinInput('');
    }
  };

  const handleResetData = () => {
    if (window.confirm('Reset local device call history and overrides back to defaults?')) {
      LocalSqliteStorage.resetDatabase();
      onRefreshData();
    }
  };

  return (
    <div className="absolute inset-0 z-40 bg-white flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
      {/* Top Navigation Bar */}
      <div className="h-14 px-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
        <button
          onClick={onClose}
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-700 transition"
          title="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <span className="text-xs font-bold text-slate-700 tracking-wide uppercase">
          {isEditingProfile ? 'Edit Profile' : 'User Identity & Hardware'}
        </span>

        <div className="w-8" />
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* KICKER HEADER (Requested: cleanly placed ABOVE the profile section) */}
        <div className="border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#0087FF]" />
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              Network Forensics & Profile
            </h1>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 ml-4">
            Device-level caller telemetry & hardware binding subsystem
          </p>
        </div>

        {/* PROFILE SECTION: NOT centered, left-aligned with clean Material 3 card */}
        {!isEditingProfile ? (
          <div className="bg-[#F8FAFC] border border-slate-200/80 rounded-2xl p-4 shadow-sm">
            <div className="flex items-start gap-4">
              {/* Profile Icon / Avatar */}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-md shrink-0 transition-transform active:scale-95"
                style={{ backgroundColor: profile.avatarColor || '#0087FF' }}
              >
                {profile.name ? profile.name[0]?.toUpperCase() : 'U'}
              </div>

              {/* Identity & Inline Pen Icon */}
              <div className="flex-1 min-w-0">
                <div
                  onClick={() => setIsEditingProfile(true)}
                  className="group flex items-center gap-2 cursor-pointer inline-flex max-w-full"
                  title="Click to edit your profile"
                >
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight truncate group-hover:text-[#0087FF] transition-colors">
                    {profile.name || 'Setup Profile'}
                  </h2>
                  <div className="p-1 rounded-md text-slate-400 group-hover:text-[#0087FF] group-hover:bg-[#0087FF]/10 transition-colors shrink-0">
                    <Edit3 className="w-4 h-4" />
                  </div>
                </div>

                <div className="text-xs font-mono text-slate-600 mt-0.5">
                  {profile.phoneNumber || 'Tap to add phone number'}
                </div>

                <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                  {profile.bio || 'Device User'}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsEditingProfile(true)}
              className="mt-3.5 w-full py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:border-[#0087FF] hover:text-[#0087FF] transition flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Profile Information
            </button>
          </div>
        ) : (
          /* EDIT PROFILE SECTION */
          <form
            onSubmit={handleSaveProfile}
            className="bg-white border border-[#0087FF]/30 rounded-2xl p-4 shadow-sm space-y-3.5 animate-in fade-in duration-150"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#0087FF]" />
                Update Profile Details
              </span>
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Cancel
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Display Name
              </label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Your full name"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0087FF]/40 bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Registered Phone Number
              </label>
              <input
                type="text"
                required
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="+91 98301 88219"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0087FF]/40 bg-slate-50 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Status / Bio
              </label>
              <textarea
                rows={2}
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="About you..."
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0087FF]/40 bg-slate-50 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full h-10 rounded-xl bg-[#0087FF] hover:bg-[#0073D9] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
            >
              <Save className="w-3.5 h-3.5" />
              Save Profile Changes
            </button>
          </form>
        )}

        {/* APP ICON & SYSTEM BRANDING PREVIEW */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 shrink-0 flex items-center justify-center">
              <img src="/icon.svg" alt="App Icon" className="w-full h-full object-contain filter drop-shadow-sm" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Forensic Call Finder</div>
              <div className="text-[11px] text-slate-500">Official Android Package & Signal Engine</div>
            </div>
          </div>
          <span className="text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200/60">
            {telemetry.isNative ? 'ANDROID APK' : 'WEB CLIENT'}
          </span>
        </div>

        {/* DEVICE HARDWARE TELEMETRY SECTION (Real data detected from device, not guessed) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-slate-700" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Hardware Device Binding
              </span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {telemetry.isNative ? 'Native Telephony API' : 'Device Telemetry'}
            </span>
          </div>

          {/* Device ID (Direct hardware query) */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
            <div>
              <span className="text-[11px] text-slate-400 block">Device ID (Hardware ANDROID_ID)</span>
              <span className="font-mono font-bold text-slate-900">{telemetry.deviceId}</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
              Build.ID
            </span>
          </div>

          {/* Active SIM Slot (Direct hardware telephony query) */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
            <div>
              <span className="text-[11px] text-slate-400 block">Active SIM Slot & Carrier</span>
              <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-[#0087FF]" />
                {telemetry.activeSimSlot} · {telemetry.carrierName}
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
              Active Network
            </span>
          </div>

          {/* Real Public WAN IP & ISP */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
            <div>
              <span className="text-[11px] text-slate-400 block">Public WAN IP & ISP</span>
              <span className="font-mono font-bold text-slate-900">
                {networkInfo ? `${networkInfo.publicIp} (${networkInfo.isp})` : 'Resolving network...'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-sky-600 bg-sky-50 px-2 py-1 rounded border border-sky-200">
              {networkInfo?.asn || 'WAN'}
            </span>
          </div>

          {/* Local LAN IP */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
            <div>
              <span className="text-[11px] text-slate-400 block">Local Device Subnet IP</span>
              <span className="font-mono text-slate-800">
                {networkInfo?.localIp || '127.0.0.1'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
              LAN
            </span>
          </div>

          {/* Call Logging Architecture */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
            <div>
              <span className="text-[11px] text-slate-400 block">Call Logging Source</span>
              <span className="font-semibold text-slate-900 flex items-center gap-1">
                <FileText className="w-3 h-3 text-purple-600" />
                Original Phone Logs (call_log SDK)
              </span>
            </div>
            <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-2 py-1 rounded border border-purple-200">
              Offline Binder
            </span>
          </div>

          <div className="pt-1 text-[11px] text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span>Hardware Model: <strong className="text-slate-800">{telemetry.hardwareModel}</strong></span>
            <span className="font-mono text-[10px] text-slate-500">{telemetry.androidBuild}</span>
          </div>
        </div>

        {/* MORE DETAILS SECTION (Locked behind passcode 3329 - disappears silently if wrong password entered) */}
        {!isFeatureLockedOut && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
            {!showPinPrompt ? (
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Advanced Device Controls</span>
                  <span className="text-[11px] text-slate-500">Security-gated manual logging diagnostics</span>
                </div>
                <button
                  onClick={() => setShowPinPrompt(true)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:border-[#0087FF] hover:text-[#0087FF] transition flex items-center gap-1.5 shadow-xs"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  ( More Details )
                </button>
              </div>
            ) : !isUnlocked ? (
              <form onSubmit={handleUnlockPin} className="space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#0087FF]" />
                    Enter Passcode for More Details
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPinPrompt(false);
                      setPinInput('');
                    }}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Close
                  </button>
                </div>

                <input
                  type="password"
                  maxLength={6}
                  autoFocus
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                  }}
                  placeholder="Enter Passcode"
                  className="w-full h-10 px-3 text-center tracking-widest font-mono text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0087FF]/40"
                />

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPinPrompt(false)}
                    className="flex-1 h-9 rounded-xl bg-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-9 rounded-xl bg-[#0087FF] text-white text-xs font-semibold hover:bg-[#0073D9] transition"
                  >
                    Unlock Diagnostics
                  </button>
                </div>
              </form>
            ) : (
            <div className="space-y-3 animate-in fade-in duration-200 text-left">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                  <Unlock className="w-4 h-4 text-emerald-600" />
                  Diagnostic Tools Unlocked
                </div>
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                  PIN 3329 VERIFIED
                </span>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed">
                Developer tools enabled. You can manually inject a simulated device log or reset local SQLite state.
              </p>

              <div className="pt-1 flex flex-col gap-2">
                <button
                  onClick={() => {
                    onClose();
                    onOpenAddLog();
                  }}
                  className="w-full h-10 rounded-xl bg-[#0087FF] hover:bg-[#0073D9] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  Inject Call Log Entry
                </button>

                <button
                  onClick={handleResetData}
                  className="w-full h-8 rounded-xl text-rose-600 hover:bg-rose-100/60 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset Stored Logs & Overrides
                </button>
              </div>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
};
