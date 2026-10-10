import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Signal } from 'lucide-react';

interface AndroidFrameProps {
  children: React.ReactNode;
  isFramed?: boolean;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({ children, isFramed = true }) => {
  const [currentTime, setCurrentTime] = useState<string>('9:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  if (!isFramed) {
    return <div className="w-full h-full flex flex-col bg-white overflow-hidden">{children}</div>;
  }

  return (
    <div className="relative mx-auto my-auto w-full max-w-[430px] h-[860px] bg-slate-900 rounded-[48px] p-[10px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.1)] flex flex-col transition-all">
      {/* Outer Phone Bezel & Hardware Buttons */}
      <div className="absolute -left-[3px] top-[140px] w-[3px] h-[36px] bg-slate-700 rounded-l-sm" />
      <div className="absolute -left-[3px] top-[190px] w-[3px] h-[54px] bg-slate-700 rounded-l-sm" />
      <div className="absolute -left-[3px] top-[255px] w-[3px] h-[54px] bg-slate-700 rounded-l-sm" />
      <div className="absolute -right-[3px] top-[170px] w-[3px] h-[64px] bg-slate-700 rounded-r-sm" />

      {/* Screen Area */}
      <div className="relative w-full h-full bg-white rounded-[38px] overflow-hidden flex flex-col shadow-inner select-none">
        {/* Android Status Bar */}
        <div className="h-10 w-full px-6 bg-white flex items-center justify-between z-30 shrink-0 text-slate-800 font-medium text-xs tracking-tight">
          <span className="font-semibold text-[13px]">{currentTime}</span>

          {/* Front Camera Cutout */}
          <div className="w-3.5 h-3.5 rounded-full bg-slate-900/90 border border-slate-700 shadow-inner -ml-3" />

          <div className="flex items-center gap-1.5 text-slate-700">
            <Signal className="w-3.5 h-3.5 stroke-[2.2]" />
            <span className="text-[10px] font-bold tracking-tighter">5G</span>
            <Wifi className="w-3.5 h-3.5 stroke-[2.2]" />
            <div className="flex items-center gap-0.5">
              <span className="text-[10px] font-bold">94%</span>
              <Battery className="w-4 h-4 stroke-[2.2] fill-slate-700" />
            </div>
          </div>
        </div>

        {/* Dynamic App Content */}
        <div className="flex-1 overflow-hidden flex flex-col relative bg-white">
          {children}
        </div>

        {/* Android Gesture Pill Bar */}
        <div className="h-5 w-full bg-white flex items-center justify-center shrink-0 z-30">
          <div className="w-28 h-1 bg-slate-300 rounded-full" />
        </div>
      </div>
    </div>
  );
};
