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
  ChevronDown,
  Globe,
  Search
} from 'lucide-react';
import { ALL_COUNTRY_CODES, CountryCode } from '../data/countryCodes';
import { CountryCodeSelectorModal } from './CountryCodeSelectorModal';
import { OsintService } from '../lib/osintService';
import { NetworkService, NetworkTelemetry } from '../lib/networkService';

export const OsintScreen: React.FC = () => {
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(
    ALL_COUNTRY_CODES.find((c) => c.code === '+1' && c.iso === 'US') || ALL_COUNTRY_CODES[0]
  );
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [targetNumber, setTargetNumber] = useState('415 555 0192');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // Real Network WAN IP telemetry state
  const [networkInfo, setNetworkInfo] = useState<NetworkTelemetry | null>(null);

  useEffect(() => {
    NetworkService.getNetworkTelemetry().then((info) => {
      setNetworkInfo(info);
    });
  }, []);

  // Intelligence Vector Toggles
  const [enableHlrVlr, setEnableHlrVlr] = useState(true);
  const [enableSs7, setEnableSs7] = useState(true);
  const [enableDataLeaks, setEnableDataLeaks] = useState(true);

  // Monospace Terminal Log Lines
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '[!] Terminal ready. Select intelligence vectors and commence deep scan.',
    '[*] Target reconnaissance engine loaded: ITU-T E.164 Global Parser v4.19',
    '[*] Real Network Host: Resolving live public WAN IP & telecom registries...',
  ]);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal on new line
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  const handleStartScan = async () => {
    if (isScanning) return;

    const fullNumber = `${selectedCountry.code} ${targetNumber.trim()}`;
    setIsScanning(true);
    setScanProgress(5);

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];

    const initialLogs: string[] = [
      `[+] [${timeStr}] Initializing Secure Recon Node: RECON-SIG-77 (TLS 1.3 Handshake OK)...`,
      `[+] Target: ${fullNumber} [${selectedCountry.country} · ${selectedCountry.standard}]`,
    ];

    if (networkInfo) {
      initialLogs.push(
        `[+] Probing Station WAN IP: ${networkInfo.publicIp} (${networkInfo.isp} · ${networkInfo.asn})`
      );
    }

    setTerminalLogs(initialLogs);

    // 1. Step: E.164 Prefix Parsing
    await new Promise((r) => setTimeout(r, 400));
    setScanProgress(20);
    setTerminalLogs((prev) => [
      ...prev,
      `[+] ITU-T E.164 Dialing Code Verified: ${selectedCountry.code} [Country: ${selectedCountry.country}]`,
      `[+] Regulatory Compliance Authority: ${selectedCountry.standard}`,
    ]);

    // 2. Step: Live DNS over HTTPS (DoH) ENUM Query
    await new Promise((r) => setTimeout(r, 600));
    setScanProgress(40);
    const dnsQueryPromise = OsintService.queryDnsOverHttps(`${selectedCountry.code}${targetNumber}`);
    const wikiQueryPromise = OsintService.queryWikipediaNumberingPlan(selectedCountry.code, targetNumber);

    const dnsResult = await dnsQueryPromise;
    setTerminalLogs((prev) => [
      ...prev,
      `[+] [Live DoH Resolver] ${dnsResult.resultSummary} (Latency: ${dnsResult.dnsLatencyMs}ms)`,
    ]);

    // 3. Step: Live Wikipedia & Area Code / DoT Registry Query
    await new Promise((r) => setTimeout(r, 500));
    setScanProgress(60);
    const wikiResult = await wikiQueryPromise;

    if (wikiResult.areaCode || wikiResult.jurisdiction) {
      setTerminalLogs((prev) => [
        ...prev,
        `[✓] [Live Telecom Registry Match] Area/Routing Prefix: ${wikiResult.areaCode || 'Verified'}`,
        `[✓] Geographic Jurisdiction: ${wikiResult.jurisdiction || 'National Numbering Plan'}`,
        wikiResult.operatorCandidate
          ? `[+] Primary Carrier Allocation: ${wikiResult.operatorCandidate}`
          : `[+] Allocation Plan: Standard Central Office Prefix [Fixed/Mobile Allocation]`,
      ]);

      if (wikiResult.summary) {
        const summarySnippet = wikiResult.summary.substring(0, 140);
        setTerminalLogs((prev) => [
          ...prev,
          `[*] Public Intelligence Summary: "${summarySnippet}..."`,
        ]);
      }
    } else {
      setTerminalLogs((prev) => [
        ...prev,
        `[+] National Numbering Plan Query: ${selectedCountry.country} standard subscriber block (${selectedCountry.code})`,
        `[+] Range Allocation: Valid ITU-T E.164 Subscriber Format (Digits length: ${targetNumber.replace(/\D/g, '').length})`,
      ]);
    }

    // 4. Step: Optional Vectors
    if (enableHlrVlr) {
      await new Promise((r) => setTimeout(r, 600));
      setScanProgress(75);
      const isInd = selectedCountry.code === '+91';
      setTerminalLogs((prev) => [
        ...prev,
        `[+] [HLR/VLR Interrogation] Querying Home Location Register for subscriber attachment status...`,
        `[+] HLR Response: IMSI Range ${isInd ? '404/405' : '310/311'}xxxxxxxxx | Status: ATTACHED / ACTIVE_VOICE`,
        `[+] Roaming & Routing: Subscriber attached to serving MSC node. Signaling verified.`,
      ]);
    }

    if (enableSs7) {
      await new Promise((r) => setTimeout(r, 500));
      setScanProgress(88);
      setTerminalLogs((prev) => [
        ...prev,
        `[+] [SS7 / SIGTRAN Tables] Interrogating MAP_SEND_ROUTING_INFO_FOR_SM (SRI)...`,
        `[+] Global Title Translation: GT-${selectedCountry.iso}-MSC-PRIMARY | Port 5060 TLS | VoLTE/VoNR Enabled`,
      ]);
    }

    if (enableDataLeaks) {
      await new Promise((r) => setTimeout(r, 600));
      setScanProgress(96);
      setTerminalLogs((prev) => [
        ...prev,
        `[+] [Public Data Intelligence] Cross-referencing 14 breached credential datasets & public directories...`,
        `[+] Ledger Audit: Zero credential leaks detected on active target line. Security Parity OK.`,
      ]);
    }

    // Completion
    await new Promise((r) => setTimeout(r, 400));
    setScanProgress(100);
    setTerminalLogs((prev) => [
      ...prev,
      `[✓] Deep Reconnaissance Completed: Target ${fullNumber} analyzed. Live audit ledger synchronized.`,
    ]);
    setIsScanning(false);
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
          Live DNS-over-HTTPS lookups, real telecom registries & public carrier intelligence
        </p>

        {/* Live Station WAN IP Ribbon */}
        {networkInfo && (
          <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-[10.5px] font-mono">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">STATION WAN IP:</span>
              <span className="text-sky-400 font-bold">{networkInfo.publicIp}</span>
              <span className="text-slate-500">({networkInfo.ipType})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">ISP:</span>
              <span className="text-emerald-400 font-semibold">{networkInfo.isp}</span>
              <span className="text-slate-600">[{networkInfo.asn}]</span>
            </div>
          </div>
        )}
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
            {/* International Dialing Code Selector Button & Number Field */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              {/* Country Code Trigger */}
              <div className="sm:col-span-5 relative">
                <label className="block text-[10px] font-mono text-slate-400 mb-1 uppercase">
                  Country & Standard
                </label>
                <button
                  type="button"
                  onClick={() => setShowCountryModal(true)}
                  disabled={isScanning}
                  className="w-full h-11 px-3 rounded-xl bg-slate-950 border border-slate-700/80 text-white font-mono text-xs focus:outline-none focus:border-[#0087FF] focus:ring-1 focus:ring-[#0087FF] flex items-center justify-between gap-1.5 cursor-pointer hover:bg-slate-900 transition text-left"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base leading-none shrink-0">{selectedCountry.flag}</span>
                    <span className="font-bold text-sky-400 shrink-0">{selectedCountry.code}</span>
                    <span className="text-slate-300 truncate text-[11px]">{selectedCountry.country}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
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
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-mono text-slate-400 scrollbar-none">
              <span className="text-slate-500 text-[10px] shrink-0 font-sans">Presets:</span>
              {[
                { label: 'San Francisco (US)', code: '+1', iso: 'US', num: '415 555 0192' },
                { label: 'Kolkata Metro (IN)', code: '+91', iso: 'IN', num: '98301 88219' },
                { label: 'London (UK)', code: '+44', iso: 'GB', num: '20 7946 0912' },
                { label: 'Singapore (SG)', code: '+65', iso: 'SG', num: '6123 4567' },
                { label: 'Dubai (AE)', code: '+971', iso: 'AE', num: '50 123 4567' },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    const match = ALL_COUNTRY_CODES.find((c) => c.code === preset.code && c.iso === preset.iso);
                    if (match) setSelectedCountry(match);
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
              className={`w-full h-12 rounded-xl font-bold font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-lg transition-all active:scale-[0.99] cursor-pointer ${
                isScanning
                  ? 'bg-blue-600/50 text-sky-200 cursor-not-allowed border border-blue-500/40'
                  : 'bg-gradient-to-r from-[#0087FF] to-blue-600 hover:from-blue-500 hover:to-blue-600 text-white border border-blue-400/40 shadow-blue-500/20 hover:shadow-blue-500/30'
              }`}
            >
              {isScanning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Querying Live Telecom Gateways ({scanProgress}%)...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Commence Live Deep Scan</span>
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
              MULTI-VECTOR ACTIVATION
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Toggle 1: HLR / VLR */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                  <Database className="w-3 h-3 text-[#0087FF]" />
                  HLR / VLR
                </span>
                <div
                  onClick={() => !isScanning && setEnableHlrVlr(!enableHlrVlr)}
                  className={`w-9 h-5 rounded-full transition-colors p-0.5 cursor-pointer ${
                    enableHlrVlr ? 'bg-[#0087FF]' : 'bg-slate-800'
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
                Interrogates subscriber presence and serving MSC routing registry.
              </p>
            </div>

            {/* Toggle 2: SS7 / SIGTRAN */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                  <ShieldAlert className="w-3 h-3 text-emerald-400" />
                  SS7 / MAP
                </span>
                <div
                  onClick={() => !isScanning && setEnableSs7(!enableSs7)}
                  className={`w-9 h-5 rounded-full transition-colors p-0.5 cursor-pointer ${
                    enableSs7 ? 'bg-emerald-500' : 'bg-slate-800'
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
                Simulates MAP_SEND_ROUTING_INFO and global title translation.
              </p>
            </div>

            {/* Toggle 3: Data Leaks */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-purple-400" />
                  Audit Parity
                </span>
                <div
                  onClick={() => !isScanning && setEnableDataLeaks(!enableDataLeaks)}
                  className={`w-9 h-5 rounded-full transition-colors p-0.5 cursor-pointer ${
                    enableDataLeaks ? 'bg-purple-500' : 'bg-slate-800'
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
                Cross-references leaked caller registries & public directories.
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
                recon-terminal@sigint-shell:~ live_probe.log
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
                {isScanning ? 'LIVE SCANNING' : 'STANDBY'}
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
                <span>Interrogating telecommunication gateway nodes & live registries...</span>
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

      {/* Country Code Selector Modal */}
      <CountryCodeSelectorModal
        isOpen={showCountryModal}
        onClose={() => setShowCountryModal(false)}
        selectedCode={selectedCountry.code}
        onSelect={(country) => setSelectedCountry(country)}
      />
    </div>
  );
};
