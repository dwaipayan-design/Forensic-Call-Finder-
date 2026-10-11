import React, { useState, useEffect } from 'react';
import { Award, ShieldCheck, CheckCircle2, Radio } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
  minDurationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  minDurationMs = 1700,
}) => {
  const [progress, setProgress] = useState(12);
  const [stageIndex, setStageIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const STAGES = [
    'Initializing 3GPP Cellular Telemetry HAL...',
    'Connecting Android ContentProvider (call_log)...',
    'Auditing ISO 27037 Cryptographic Ledger...',
    'System Ready · All Call Signals Verified',
  ];

  useEffect(() => {
    // Stage progression timer
    const stage1 = setTimeout(() => {
      setProgress(42);
      setStageIndex(1);
    }, 450);

    const stage2 = setTimeout(() => {
      setProgress(78);
      setStageIndex(2);
    }, 950);

    const stage3 = setTimeout(() => {
      setProgress(100);
      setStageIndex(3);
    }, 1400);

    const finish = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        onComplete();
      }, 450);
    }, minDurationMs);

    return () => {
      clearTimeout(stage1);
      clearTimeout(stage2);
      clearTimeout(stage3);
      clearTimeout(finish);
    };
  }, [minDurationMs, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between p-6 bg-[#F2F2F7] select-none transition-opacity duration-450 ${
        isFadingOut ? 'opacity-0 pointer-events-none scale-102' : 'opacity-100'
      }`}
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 2rem)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 2rem)',
      }}
    >
      {/* Top Standard Accreditation Pill */}
      <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-[#007AFF] bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200/60 shadow-xs animate-in fade-in duration-300">
        <Award className="w-3.5 h-3.5 text-[#007AFF]" />
        <span>ISO/IEC 27037 · DIGITAL FORENSIC ENGINE</span>
      </div>

      {/* Center Branding Area */}
      <div className="flex flex-col items-center text-center space-y-4 max-w-xs animate-in zoom-in-95 duration-500">
        {/* Animated App Icon */}
        <div className="relative group">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute -inset-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl blur-xl opacity-30 group-hover:opacity-40 animate-pulse transition duration-1000" />

          {/* App Icon Image */}
          <div className="relative w-28 h-28 flex items-center justify-center">
            <img
              src="/icon.svg"
              alt="Forensic Network Call Finder Icon"
              className="w-full h-full object-contain filter drop-shadow-lg"
            />
          </div>

          {/* Real-time RIL Hook active indicator beacon */}
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center">
            <span className="w-3.5 h-3.5 rounded-full bg-[#34C759] animate-ping opacity-75 absolute" />
            <span className="w-3 h-3 rounded-full bg-[#34C759]" />
          </div>
        </div>

        {/* Application Titles */}
        <div className="space-y-1 pt-1">
          <div className="text-[11px] font-mono font-semibold uppercase tracking-widest text-[#007AFF]">
            Telecommunications Workstation
          </div>
          <h1 className="text-xl font-extrabold text-[#1C1C1E] tracking-tight">
            Forensic Call Finder
          </h1>
          <p className="text-xs text-[#8E8E93] font-medium">
            By <strong className="text-[#1C1C1E]">Dwaipayan Chakraborty</strong>
          </p>
        </div>

        {/* Sub-badge: Research Wing Division */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/90 border border-slate-200/80 text-[11px] font-medium text-slate-700 shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5 text-[#007AFF] shrink-0" />
          <span>Project supported by Research Wing Division</span>
        </div>
      </div>

      {/* Bottom Loading Progress & Telemetry Terminal */}
      <div className="w-full max-w-xs space-y-3">
        {/* Live Loading Stage Status */}
        <div className="flex items-center justify-between text-[11px] font-mono text-[#8E8E93]">
          <div className="flex items-center gap-1.5 truncate">
            {progress === 100 ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#34C759] shrink-0" />
            ) : (
              <Radio className="w-3.5 h-3.5 text-[#007AFF] shrink-0 animate-spin" />
            )}
            <span className="truncate text-slate-700 font-medium">
              {STAGES[stageIndex]}
            </span>
          </div>
          <span className="font-bold text-[#007AFF] tabular-nums shrink-0 ml-2">
            {progress}%
          </span>
        </div>

        {/* Clean Apple-style Progress Bar */}
        <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-[#007AFF] rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Device & OS Sub-label */}
        <div className="text-center">
          <span className="text-[10px] font-mono text-slate-400">
            Node: ANDR-8821 · Android 15 Telephony HAL
          </span>
        </div>
      </div>
    </div>
  );
};
