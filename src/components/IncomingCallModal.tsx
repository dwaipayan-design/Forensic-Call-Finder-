import React, { useState, useEffect } from 'react';
import {
  Phone,
  PhoneOff,
  CheckCircle2,
  Shield,
  AlertCircle,
  Volume2,
  Mic,
  Grid,
  Bluetooth
} from 'lucide-react';
import { ManualOverride } from '../types';
import { LocalSqliteStorage } from '../lib/storage';
import { DeviceService } from '../lib/deviceService';

interface IncomingCallModalProps {
  number: string;
  name: string;
  override?: ManualOverride;
  onClose: () => void;
  onCallLogged: () => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  number,
  name,
  override,
  onClose,
  onCallLogged,
}) => {
  const [callState, setCallState] = useState<'ringing' | 'connected' | 'ended'>('ringing');
  const [duration, setDuration] = useState(0);

  const isBusy = override?.is_busy ?? false;
  const talkingTo = override?.talking_to ?? '';
  const isVerified = override?.is_verified ?? false;
  const displayName = override?.custom_name || name || number;
  const initial = (displayName[0] || '?').toUpperCase();

  useEffect(() => {
    let timer: any;
    if (callState === 'connected') {
      timer = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [callState]);

  const telemetry = DeviceService.getRealHardwareTelemetry();
  const activeSimLabel = telemetry.activeSimSlot || 'SIM 1 (Active)';

  const handleAccept = () => {
    setCallState('connected');
  };

  const handleDecline = () => {
    setCallState('ended');
    // Log as missed or rejected
    LocalSqliteStorage.addCallLog({
      number,
      name: displayName,
      timestamp: Date.now(),
      duration: 0,
      type: 'rejected',
      sim: activeSimLabel,
    });
    onCallLogged();
    setTimeout(onClose, 800);
  };

  const handleEndCall = () => {
    setCallState('ended');
    // Log completed incoming call
    LocalSqliteStorage.addCallLog({
      number,
      name: displayName,
      timestamp: Date.now() - duration * 1000,
      duration,
      type: 'incoming',
      sim: activeSimLabel,
    });
    onCallLogged();
    setTimeout(onClose, 800);
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="absolute inset-0 z-50 bg-slate-900 text-white flex flex-col justify-between p-6 animate-in fade-in duration-200">
      {/* Top Banner: Truecaller Caller ID identification */}
      <div className="w-full flex flex-col items-center pt-4">
        <div className="flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-medium text-slate-200 border border-white/10 mb-2">
          <Shield className="w-3.5 h-3.5 text-[#0087FF]" />
          <span>Truecaller Local Caller ID</span>
          <span className="text-white/40">·</span>
          <span className="text-emerald-400 font-semibold">Offline</span>
        </div>

        <span className="text-xs text-slate-400 tracking-wider uppercase font-semibold">
          {callState === 'ringing'
            ? 'Incoming Call...'
            : callState === 'connected'
            ? `In Call · ${formatSeconds(duration)}`
            : 'Call Ended'}
        </span>
      </div>

      {/* Center Caller Profile */}
      <div className="flex flex-col items-center text-center">
        {/* Pulsing Avatar */}
        <div className="relative mb-4">
          {callState === 'ringing' && (
            <div
              className={`absolute -inset-4 rounded-full opacity-30 animate-ping ${
                isBusy ? 'bg-[#EB3349]' : 'bg-[#0087FF]'
              }`}
            />
          )}

          <div
            className={`w-28 h-28 rounded-full flex items-center justify-center text-white font-bold text-4xl shadow-2xl relative z-10 transition-colors ${
              isBusy ? 'bg-[#EB3349]' : 'bg-[#0087FF]'
            }`}
          >
            {initial}
          </div>

          {isVerified && (
            <div className="absolute -bottom-1 -right-1 z-20 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-6 h-6 text-[#0087FF] fill-[#0087FF] stroke-white" />
            </div>
          )}
        </div>

        {/* Name & Badges */}
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {displayName}
          </h1>
          {isVerified && (
            <CheckCircle2 className="w-6 h-6 text-[#0087FF] fill-[#0087FF] stroke-white" />
          )}
        </div>

        <div className="text-sm text-slate-300 mt-1 tracking-wide">{number}</div>

        {/* Busy Overrides Warning Alert if applicable */}
        {isBusy ? (
          <div className="mt-4 px-4 py-2 rounded-xl bg-[#EB3349]/20 border border-[#EB3349]/40 flex items-center gap-2 text-rose-300 text-xs font-medium max-w-xs text-left animate-pulse">
            <AlertCircle className="w-4 h-4 text-[#EB3349] shrink-0" />
            <div>
              <span className="font-bold text-[#EB3349]">Manual Busy Status: </span>
              In a call with <strong className="text-white underline">{talkingTo || 'another person'}</strong>
            </div>
          </div>
        ) : (
          <div className="mt-3 text-xs text-emerald-400 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Available (Local Shadow DB)
          </div>
        )}

        <div className="text-[11px] text-slate-400 mt-2 font-mono">
          {telemetry.carrierName ? `Carrier: ${telemetry.carrierName}` : 'Cellular Network'}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="w-full pb-6">
        {callState === 'connected' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4 px-4 text-slate-300 text-xs text-center">
              <div className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  <Mic className="w-5 h-5" />
                </div>
                <span>Mute</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  <Grid className="w-5 h-5" />
                </div>
                <span>Keypad</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  <Volume2 className="w-5 h-5" />
                </div>
                <span>Speaker</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  <Bluetooth className="w-5 h-5" />
                </div>
                <span>Audio</span>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleEndCall}
                className="w-16 h-16 rounded-full bg-[#EB3349] hover:bg-rose-600 active:scale-95 text-white flex items-center justify-center shadow-lg transition"
                title="End Call"
              >
                <PhoneOff className="w-7 h-7" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-around px-8">
            {/* Decline Button */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleDecline}
                className="w-16 h-16 rounded-full bg-[#EB3349] hover:bg-rose-600 active:scale-95 text-white flex items-center justify-center shadow-lg transition"
                title="Decline Call"
              >
                <PhoneOff className="w-7 h-7" />
              </button>
              <span className="text-xs text-slate-300 font-medium">Decline</span>
            </div>

            {/* Accept Button */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleAccept}
                className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white flex items-center justify-center shadow-lg transition"
                title="Accept Call"
              >
                <Phone className="w-7 h-7 animate-bounce" />
              </button>
              <span className="text-xs text-slate-300 font-medium">Accept</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
