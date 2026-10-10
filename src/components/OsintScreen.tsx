import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  ShieldAlert,
  Radio,
  Sliders,
  Play,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Database,
  Lock,
  ChevronDown
} from 'lucide-react';

interface CountryCodeOption {
  code: string;
  country: string;
  standard: string;
}

const ITU_COUNTRY_CODES: CountryCodeOption[] = [
  { code: '+1', country: 'United States / Canada', standard: 'ITU-T E.164 (NANP)' },
  { code: '+91', country: 'India', standard: 'ITU-T E.164 (DoT/TRAI)' },
  { code: '+44', country: 'United Kingdom', standard: 'ITU-T E.164 (OFCOM)' },
  { code: '+49', country: 'Germany', standard: 'ITU-T E.164 (BNetzA)' },
  { code: '+81', country: 'Japan', standard: 'ITU-T E.164 (MIC)' },
  { code: '+61', country: 'Australia', standard: 'ITU-T E.164 (ACMA)' },
  { code: '+33', country: 'France', standard: 'ITU-T E.164 (ARCEP)' },
  { code: '+86', country: 'China', standard: 'ITU-T E.164 (MIIT)' },
  { code: '+971', country: 'United Arab Emirates', standard: 'ITU-T E.164 (TDRA)' },
];

export const OsintScreen: React.FC = () => {
  const [selectedCountryCode, setSelectedCountryCode] = useState('+1');
  const [targetNumber, setTargetNumber] = useState('415 555 0192');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // Intelligence Vector Toggles
  const [enableHlrVlr, setEnableHlrVlr] = useState(true);
  const [enableSs7, setEnableSs7] = useState(true);
  const [enableDataLeaks, setEnableDataLeaks] = useState(true);

  // Monospace Terminal Log Lines
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '[!] Terminal ready. Select intelligence vectors and commence deep scan.',
    '[*] Target reconnaissance engine loaded: ITU-T E.164 Parser v4.19',
    '[*] Ready for cryptographic target probe...',
  ]);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal on new line
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  const handleStartScan = () => {
    if (isScanning) return;

    const fullNumber = `${selectedCountryCode} ${targetNumber.trim()}`;
    setIsScanning(true);
    setScanProgress(0);

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];

    const newLogs: string[] = [
      `[+] [${timeStr}] Initializing Secure Node: RECON-SIG-77 (AES-256-GCM Handshake OK)...`,
      `[+] Target: ${fullNumber} [ITU-T E.164 Standard Specification Verified]`,
    ];

    setTerminalLogs(newLogs);

    // Dynamic sequence of log outputs based on selected vectors
    const plannedEvents: { delay: number; log: string; progress: number }[] = [
      {
        delay: 450,
        log: `[+] Resolving Carrier MCC/MNC Prefix Routing Table (E.212 Identity Mapping)...`,
        progress: 15,
      },
      {
        delay: 950,
        log: `[+] Querying Carrier Database: Global Telco Routing Node [Port 443 TLS 1.3]...`,
        progress: 30,
      },
    ];

    if (enableHlrVlr) {
      plannedEvents.push(
        {
          delay: 1450,
          log: `[+] [HLR/VLR Registry] Querying Home Location Register for subscriber attachment...`,
          progress: 45,
        },
        {
          delay: 1900,
          log: `[+] HLR Response: IMSI Range 310-410xxxxxxxxx | Status: ATTACHED / ACTIVE_VOICE`,
          progress: 55,
        },
        {
          delay: 2300,
          log: `[!] Warning: Number ported on 2023-11-14 (MNP Routing Flag: DONOR -> RECIPIENT_CARRIER)`,
          progress: 65,
        }
      );
    }

    if (enableSs7) {
      plannedEvents.push(
        {
          delay: 2750,
          log: `[+] [SS7 Routing Tables] Interrogating MAP_SEND_ROUTING_INFO_FOR_SM (SRI)...`,
          progress: 75,
        },
        {
          delay: 3200,
          log: `[+] SS7 Global Title: GT-US-SBC-408-9 | MSC/VLR ID: 0x4B21 | VoNR Roaming: ENABLED`,
          progress: 85,
        }
      );
    }

    if (enableDataLeaks) {
      plannedEvents.push(
        {
          delay: 3600,
          log: `[+] [Public Data Leaks] Cross-referencing 14 breached credential datasets & public caller books...`,
          progress: 92,
        },
        {
          delay: 4000,
          log: `[+] Match Found: Corporate Directory / Apex Innovations Registry (Verified Contact)`,
          progress: 97,
        }
      );
    }

    plannedEvents.push({
      delay: 4400,
      log: `[✓] Deep Reconnaissance Completed: Target node analyzed. Digital ledger entry generated.`,
      progress: 100,
    });

    // Schedule log events
    plannedEvents.forEach((item, index) => {
      setTimeout(() => {
        setTerminalLogs((prev) => [...prev, item.log]);
        setScanProgress(item.progress);
        if (index === plannedEvents.length - 1) {
          setIsScanning(false);
        }
      }, item.delay);
    });
  };

  const handleClearTerminal = () => {
    setTerminalLogs([
      '[*] Terminal cleared by operator.',
      '[*] Reconnaissance node RECON-SIG-77 standing by.',
    ]);
    setScanProgress(0);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0b0f17] text-slate-100 overflow-y-auto select-none">
      {/* Cybersecurity Reconnaissance Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-gradient-to-b from-[#111827] to-[#0b0f17] relative shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-emerald-400">
              Active Reconnaissance Node · RECON-SIG-77
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            SECURE PORT 443
          </span>
        </div>

        <h1 className="text-lg font-bold text-white tracking-tight mt-1.5 flex items-center gap-2 font-sans">
          Target Reconnaissance Terminal
        </h1>
        <p className="text-xs text-slate-400 mt-0.5 font-mono">
          Deep telecom queries, carrier signaling routing tables & public intelligence resolution
        </p>
      </div>

      <div className="p-4 space-y-4 max-w-2xl mx-auto w-full">
        {/* Module 1: Target Number Input Module (ITU-T E.164) */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between text-xs font-mono border-b border-slate-800/80 pb-2">
            <span className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-[#0087FF]" />
              Target Number Input (ITU-T E.164)
            </span>
            <span className="text-[10px] text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800/50">
              E.164 Standard
            </span>
          </div>

          <div className="space-y-2.5">
            {/* International Dialing Code Dropdown & Number Field */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              {/* Country Code Dropdown */}
              <div className="sm:col-span-5 relative">
                <label className="block text-[10px] font-mono text-slate-400 mb-1 uppercase">
                  Country Code
                </label>
                <div className="relative">
                  <select
                    value={selectedCountryCode}
                    onChange={(e) => setSelectedCountryCode(e.target.value)}
                    disabled={isScanning}
                    className="w-full h-11 px-3 pr-8 rounded-xl bg-slate-950 border border-slate-700/80 text-white font-mono text-xs focus:outline-none focus:border-[#0087FF] focus:ring-1 focus:ring-[#0087FF] appearance-none cursor-pointer"
                  >
                    {ITU_COUNTRY_CODES.map((item) => (
                      <option key={item.code} value={item.code} className="bg-slate-900 text-white">
                        {item.code} · {item.country}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              {/* Target Phone Digits */}
              <div className="sm:col-span-7">
                <label className="block text-[10px] font-mono text-slate-400 mb-1 uppercase">
                  Subscriber MSISDN Number
                </label>
                <input
                  type="text"
                  value={targetNumber}
                  onChange={(e) => setTargetNumber(e.target.value)}
                  disabled={isScanning}
                  placeholder="e.g. 415 555 0192"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-950 border border-slate-700/80 text-white font-mono text-sm tracking-wider focus:outline-none focus:border-[#0087FF] focus:ring-1 focus:ring-[#0087FF]"
                />
              </div>
            </div>

            {/* Quick Target Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-mono text-slate-400">
              <span className="text-slate-500 text-[10px] shrink-0">Presets:</span>
              {[
                { label: 'Alex Rivers', code: '+1', num: '415 555 0192' },
                { label: 'Sarah J.', code: '+1', num: '212 555 8391' },
                { label: 'Dr. Vance', code: '+1', num: '312 555 4402' },
                { label: 'Unknown Caller', code: '+1', num: '800 555 9922' },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setSelectedCountryCode(preset.code);
                    setTargetNumber(preset.num);
                  }}
                  className="px-2 py-0.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition shrink-0"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Highly Styled "Commence Deep Scan" Action Button */}
            <button
              type="button"
              onClick={handleStartScan}
              disabled={isScanning || !targetNumber.trim()}
              className={`w-full h-12 rounded-xl font-bold font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-lg transition-all active:scale-[0.99] ${
                isScanning
                  ? 'bg-blue-600/50 text-sky-200 cursor-not-allowed border border-blue-500/40'
                  : 'bg-gradient-to-r from-[#0087FF] to-blue-600 hover:from-blue-500 hover:to-blue-600 text-white border border-blue-400/40 shadow-blue-500/20 hover:shadow-blue-500/30'
              }`}
            >
              {isScanning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Scanning Vectors ({scanProgress}%)...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Commence Deep Scan</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Module 2: Intelligence Vector Toggle Switches */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between text-xs font-mono border-b border-slate-800/80 pb-2">
            <span className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              Intelligence Vectors
            </span>
            <span className="text-[10px] text-purple-400 font-mono">
              3 Vectors Available
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* 1. HLR/VLR Registry */}
            <div
              onClick={() => !isScanning && setEnableHlrVlr(!enableHlrVlr)}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                enableHlrVlr
                  ? 'bg-slate-950 border-emerald-500/40 shadow-sm shadow-emerald-500/5'
                  : 'bg-slate-950/50 border-slate-800/60 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold font-mono text-white">HLR/VLR Registry</span>
                <div
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                    enableHlrVlr ? 'bg-emerald-500' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      enableHlrVlr ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
              <p className="text-[10.5px] text-slate-400 font-mono leading-tight">
                Home/Visitor Location Register lookup for subscriber state & roaming.
              </p>
            </div>

            {/* 2. SS7 Routing Tables */}
            <div
              onClick={() => !isScanning && setEnableSs7(!enableSs7)}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                enableSs7
                  ? 'bg-slate-950 border-[#0087FF]/50 shadow-sm shadow-blue-500/5'
                  : 'bg-slate-950/50 border-slate-800/60 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold font-mono text-white">SS7 Routing Tables</span>
                <div
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                    enableSs7 ? 'bg-[#0087FF]' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      enableSs7 ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
              <p className="text-[10.5px] text-slate-400 font-mono leading-tight">
                Signaling System No. 7 Global Title translation & interconnect routing.
              </p>
            </div>

            {/* 3. Public Data Leaks */}
            <div
              onClick={() => !isScanning && setEnableDataLeaks(!enableDataLeaks)}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                enableDataLeaks
                  ? 'bg-slate-950 border-purple-500/50 shadow-sm shadow-purple-500/5'
                  : 'bg-slate-950/50 border-slate-800/60 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold font-mono text-white">Public Data Leaks</span>
                <div
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                    enableDataLeaks ? 'bg-purple-600' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      enableDataLeaks ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
              <p className="text-[10.5px] text-slate-400 font-mono leading-tight">
                Cross-references leaked caller registries & breach databases.
              </p>
            </div>
          </div>
        </div>

        {/* Module 3: Monospace Terminal Window Block */}
        <div className="bg-[#05080f] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          {/* Terminal Window Chrome / Header */}
          <div className="h-9 px-3.5 bg-slate-950 border-b border-slate-800/90 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
              </div>
              <span className="text-[11px] font-mono text-slate-400 ml-2 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-sky-400" />
                recon-terminal@sigint-shell:~ deep_scan.log
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-[9.5px] font-mono px-2 py-0.5 rounded font-bold ${
                  isScanning
                    ? 'bg-blue-900/60 text-sky-300 animate-pulse border border-blue-700/50'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                {isScanning ? 'SCANNING ACTIVE' : 'STANDBY'}
              </span>
              <button
                type="button"
                onClick={handleClearTerminal}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
                title="Clear Terminal Output"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Terminal Output Body */}
          <div className="p-3.5 sm:p-4 font-mono text-xs text-slate-300 h-64 overflow-y-auto space-y-1.5 bg-black/90">
            {terminalLogs.map((line, idx) => {
              const isWarning = line.includes('[!]');
              const isSuccess = line.includes('[✓]');
              const isInfo = line.includes('[+]');
              const isInit = line.includes('[*]');

              return (
                <div
                  key={idx}
                  className={`leading-relaxed break-all ${
                    isWarning
                      ? 'text-amber-400 font-semibold'
                      : isSuccess
                      ? 'text-emerald-400 font-semibold'
                      : isInfo
                      ? 'text-sky-300'
                      : isInit
                      ? 'text-slate-400'
                      : 'text-slate-300'
                  }`}
                >
                  {line}
                </div>
              );
            })}
            {isScanning && (
              <div className="flex items-center gap-1.5 text-sky-400 animate-pulse pt-1">
                <span className="w-2 h-3.5 bg-sky-400 inline-block" />
                <span>Interrogating telecommunication gateway nodes...</span>
              </div>
            )}
            <div ref={terminalEndRef} />
          </div>

          {/* Terminal Footer Bar */}
          <div className="px-3.5 py-2 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>TLS 1.3 / E.164 Strict Mode</span>
            </div>
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-[#0087FF]" />
              <span>Vectors: {enableHlrVlr ? 'HLR ' : ''}{enableSs7 ? 'SS7 ' : ''}{enableDataLeaks ? 'LEAKS' : ''}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
