import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  Play,
  RotateCcw,
  Globe,
  ChevronDown,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  Info,
  Server
} from 'lucide-react';
import { ALL_COUNTRY_CODES, CountryCode } from '../data/countryCodes';
import { CountryCodeSelectorModal } from './CountryCodeSelectorModal';
import { OsintService, OsintCompleteResult, OsintLookupEvent } from '../lib/osintService';
import { NetworkService, NetworkTelemetry } from '../lib/networkService';

export const OsintScreen: React.FC = () => {
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(
    ALL_COUNTRY_CODES.find((c) => c.code === '+1' && c.iso === 'US') || ALL_COUNTRY_CODES[0]
  );
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [targetNumber, setTargetNumber] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [lookupResult, setLookupResult] = useState<OsintCompleteResult | null>(null);

  // Real Network WAN IP of the user's current device connection
  const [stationNetwork, setStationNetwork] = useState<NetworkTelemetry | null>(null);

  useEffect(() => {
    NetworkService.getNetworkTelemetry().then((info) => {
      setStationNetwork(info);
    });
  }, []);

  // Event-driven terminal logs
  const [terminalLogs, setTerminalLogs] = useState<OsintLookupEvent[]>([
    {
      level: 'info',
      message: '[*] Target Reconnaissance Terminal initialized. E.164 ITU-T validation engine active.',
      timestamp: new Date().toTimeString().split(' ')[0],
    },
    {
      level: 'info',
      message: '[*] Enter a phone number with country selection to execute genuine metadata lookups.',
      timestamp: new Date().toTimeString().split(' ')[0],
    },
  ]);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  const handleStartScan = async () => {
    if (isScanning || !targetNumber.trim()) return;

    setIsScanning(true);
    setLookupResult(null);

    // Append initial scan trigger event
    const now = new Date().toTimeString().split(' ')[0];
    setTerminalLogs((prev) => [
      ...prev,
      {
        level: 'info',
        message: `------------------------------------------------------------`,
        timestamp: now,
      },
      {
        level: 'info',
        message: `[+] Commencing genuine lookup for "${targetNumber.trim()}" (Region: ${selectedCountry.iso} / ${selectedCountry.code})...`,
        timestamp: now,
      },
    ]);

    try {
      const result = await OsintService.runLookup(
        targetNumber.trim(),
        selectedCountry.iso,
        (event) => {
          setTerminalLogs((prev) => [...prev, event]);
        }
      );

      setLookupResult(result);
    } catch (err: any) {
      setTerminalLogs((prev) => [
        ...prev,
        {
          level: 'error',
          message: `[!] Fatal lookup error: ${err?.message || 'Unknown exception'}`,
          timestamp: new Date().toTimeString().split(' ')[0],
        },
      ]);
    } finally {
      setIsScanning(false);
    }
  };

  const handleClearTerminal = () => {
    setTerminalLogs([
      {
        level: 'info',
        message: '[*] Terminal logs cleared by operator.',
        timestamp: new Date().toTimeString().split(' ')[0],
      },
      {
        level: 'info',
        message: '[*] Standing by for verified phone number queries.',
        timestamp: new Date().toTimeString().split(' ')[0],
      },
    ]);
    setLookupResult(null);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0b0f17] text-slate-100 overflow-y-auto select-none">
      {/* Cybersecurity Reconnaissance Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-gradient-to-b from-[#111827] to-[#0b0f17] relative shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-emerald-400">
              Verified OSINT Reconnaissance Node
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            TLS 1.3 / E.164 PARSER
          </span>
        </div>

        <h1 className="text-lg font-bold text-white tracking-tight mt-1.5 flex items-center gap-2 font-sans">
          Target Reconnaissance Terminal
        </h1>
        <p className="text-xs text-slate-400 mt-0.5 font-mono">
          Genuine ITU-T E.164 parsing, live DNS-over-HTTPS (DoH) ENUM resolution & national numbering plan directories
        </p>

        {/* Live Station WAN IP of the user's internet connection (clearly labeled to prevent confusion) */}
        {stationNetwork && (
          <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-[10.5px] font-mono">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">YOUR STATION INTERNET WAN:</span>
              <span className="text-sky-400 font-bold">{stationNetwork.publicIp}</span>
              <span className="text-slate-500">({stationNetwork.ipType})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">ISP:</span>
              <span className="text-emerald-400 font-semibold">{stationNetwork.isp}</span>
              <span className="text-slate-600">[{stationNetwork.asn}]</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 space-y-4 max-w-2xl mx-auto w-full">
        {/* Module 1: Target Number Input Module (ITU-T E.164) */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between text-xs font-mono border-b border-slate-800/80 pb-2">
            <span className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#0087FF]" />
              Target Number Input (ITU-T E.164)
            </span>
            <span className="text-[10px] text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800/50">
              Real Metadata Engine
            </span>
          </div>

          <div className="space-y-3">
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

              {/* Target Phone Digits (Starts empty, no hardcoded presets) */}
              <div className="sm:col-span-7">
                <label className="block text-[10px] font-mono text-slate-400 mb-1 uppercase">
                  Subscriber Phone Number
                </label>
                <input
                  type="tel"
                  value={targetNumber}
                  onChange={(e) => setTargetNumber(e.target.value)}
                  disabled={isScanning}
                  placeholder="Enter phone number (e.g. 98301 00000)"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-950 border border-slate-700/80 text-white font-mono text-sm tracking-wider focus:outline-none focus:border-[#0087FF] focus:ring-1 focus:ring-[#0087FF] placeholder:text-slate-600"
                  autoFocus
                />
              </div>
            </div>

            {/* Action Button: Honest Indeterminate Loading State */}
            <button
              type="button"
              onClick={handleStartScan}
              disabled={isScanning || !targetNumber.trim()}
              className={`w-full h-12 rounded-xl font-bold font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-lg transition-all active:scale-[0.99] cursor-pointer ${
                isScanning
                  ? 'bg-blue-600/50 text-sky-200 cursor-not-allowed border border-blue-500/40'
                  : !targetNumber.trim()
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#0087FF] to-blue-600 hover:from-blue-500 hover:to-blue-600 text-white border border-blue-400/40 shadow-blue-500/20 hover:shadow-blue-500/30'
              }`}
            >
              {isScanning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Performing Verified Lookups...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Execute Verified Reconnaissance Scan</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Module 2: Structured Verified Findings Card (Rendered only from genuine results) */}
        {lookupResult && (
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-xl space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs font-mono border-b border-slate-800/80 pb-2">
              <span className="text-white font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Verified Investigation Findings
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Source: libphonenumber & live DoH
              </span>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              {/* Validation Status */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">ITU-T Format Validity</span>
                  <span className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                    {lookupResult.validation.isValid ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">Valid E.164 Number</span>
                      </>
                    ) : lookupResult.validation.isPossible ? (
                      <>
                        <HelpCircle className="w-4 h-4 text-amber-400" />
                        <span className="text-amber-400">Possible Length (Unassigned Pattern)</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                        <span className="text-rose-400">Invalid Number Format</span>
                      </>
                    )}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block uppercase">Line Type</span>
                  <span className="text-xs font-semibold text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/40 inline-block mt-0.5">
                    {lookupResult.validation.numberType}
                  </span>
                </div>
              </div>

              {/* Formatted Standards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">International (E.164)</span>
                  <span className="text-xs font-bold text-sky-300">
                    {lookupResult.validation.formattedE164 || 'N/A'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">National Dialing Format</span>
                  <span className="text-xs font-bold text-slate-200">
                    {lookupResult.validation.formattedNational || 'N/A'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Allocated Region (ISO)</span>
                  <span className="text-xs font-bold text-slate-200">
                    {lookupResult.validation.countryIso || 'International'} ({lookupResult.validation.countryCallingCode || 'N/A'})
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">RFC 3966 URI</span>
                  <span className="text-xs font-bold text-purple-300 truncate block">
                    {lookupResult.validation.rfc3966Uri || 'N/A'}
                  </span>
                </div>
              </div>

              {/* DNS ENUM Query Result */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1.5 font-bold">
                    <Server className="w-3.5 h-3.5 text-sky-400" />
                    RFC 3761 ENUM Resolution (e164.arpa)
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {lookupResult.dnsEnum.source} ({lookupResult.dnsEnum.latencyMs}ms)
                  </span>
                </div>
                <div className="text-xs text-slate-300 pt-0.5">
                  <span className="text-slate-500">Status: </span>
                  <strong className="text-sky-300">{lookupResult.dnsEnum.dnsStatusName}</strong>
                </div>
                <p className="text-[11px] text-slate-400">
                  {lookupResult.dnsEnum.summary}
                </p>
                {lookupResult.dnsEnum.hasNaptr && (
                  <div className="mt-1 pt-1 border-t border-slate-800 space-y-1">
                    {lookupResult.dnsEnum.naptrRecords.map((rec, i) => (
                      <div key={i} className="text-[10px] text-emerald-400 bg-emerald-950/40 p-1.5 rounded border border-emerald-900/40 break-all">
                        NAPTR #{i + 1}: {rec}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Public Numbering Plan Registry Match */}
              {lookupResult.publicRegistry.queried && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-bold">
                      National Numbering Plan Directory
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Wikipedia Public Registry
                    </span>
                  </div>
                  {lookupResult.publicRegistry.title ? (
                    <div>
                      <div className="text-xs font-bold text-sky-400">
                        {lookupResult.publicRegistry.title}
                      </div>
                      {lookupResult.publicRegistry.snippet && (
                        <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                          "{lookupResult.publicRegistry.snippet}..."
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400">
                      {lookupResult.publicRegistry.summary}
                    </p>
                  )}
                </div>
              )}

              {/* Honest Carrier Disclaimers & Limitations */}
              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 text-[11px] text-amber-300/90 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-300">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>Carrier & Subscriber Status Limitation</span>
                </div>
                <p className="text-slate-400 leading-relaxed text-[10.5px]">
                  Real-time subscriber presence, active IMSI assignment, and MSC routing require authorized access to private carrier HLR/VLR signalling (SS7/Diameter). Ordinary client applications do not have direct access to operator infrastructure.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Module 3: Monospace Terminal Window Block */}
        <div className="bg-[#05080f] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          {/* Terminal Window Header */}
          <div className="h-9 px-3.5 bg-slate-950 border-b border-slate-800/90 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
              </div>
              <span className="text-[11px] font-mono text-slate-400 ml-2 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-sky-400" />
                recon-terminal@sigint-shell:~ genuine_probe.log
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
                {isScanning ? 'LIVE LOOKUP' : 'STANDBY'}
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

          {/* Terminal Output Body (All logs originate from real JavaScript events) */}
          <div className="p-3.5 sm:p-4 font-mono text-xs text-slate-300 h-64 overflow-y-auto space-y-1.5 bg-black/90">
            {terminalLogs.map((log, idx) => (
              <div
                key={idx}
                className={`leading-relaxed break-all ${
                  log.level === 'error'
                    ? 'text-rose-400 font-semibold'
                    : log.level === 'warning'
                    ? 'text-amber-400'
                    : log.level === 'success'
                    ? 'text-emerald-400 font-semibold'
                    : 'text-sky-300'
                }`}
              >
                <span className="text-slate-500 mr-2 text-[10px]">[{log.timestamp}]</span>
                {log.message}
              </div>
            ))}
            {isScanning && (
              <div className="flex items-center gap-1.5 text-sky-400 animate-pulse pt-1">
                <span className="w-2 h-3.5 bg-sky-400 inline-block" />
                <span>Executing authentic ITU-T validation & DNS-over-HTTPS query...</span>
              </div>
            )}
            <div ref={terminalEndRef} />
          </div>

          {/* Terminal Footer Bar */}
          <div className="px-3.5 py-2 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>libphonenumber-js / RFC 3761 ENUM</span>
            </div>
            <span className="text-slate-500 text-[10px]">
              {terminalLogs.length} events logged
            </span>
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
