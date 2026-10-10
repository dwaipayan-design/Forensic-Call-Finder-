import React, { useState, useEffect } from 'react';
import {
  Phone,
  MessageSquare,
  Users,
  Globe,
  Terminal,
  Fingerprint,
  Smartphone,
  Columns,
  Download,
  ShieldCheck,
} from 'lucide-react';
import { CallLogEntry, ContactItem, ManualOverride, ActiveTab } from './types';
import { LocalSqliteStorage } from './lib/storage';
import { INITIAL_CONTACTS } from './lib/mockData';
import { AndroidFrame } from './components/AndroidFrame';
import { TruecallerHeader } from './components/TruecallerHeader';
import { RecentsScreen } from './components/RecentsScreen';
import { MessagesComingSoon } from './components/MessagesComingSoon';
import { ContactsScreen } from './components/ContactsScreen';
import { ProfileEditorModal } from './components/ProfileEditorModal';
import { NewCallLogModal } from './components/NewCallLogModal';
import { OsintScreen } from './components/OsintScreen';
import { ForensicScreen } from './components/ForensicScreen';
import { DownloadApkModal } from './components/DownloadApkModal';
import { UserProfileDrawer } from './components/UserProfileDrawer';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('calls');
  const [searchQuery, setSearchQuery] = useState('');
  const [callLogs, setCallLogs] = useState<CallLogEntry[]>([]);
  const [shadowOverrides, setShadowOverrides] = useState<Record<string, ManualOverride>>({});
  const [contacts, setContacts] = useState<ContactItem[]>([]);

  // Modals & Overlays
  const [selectedEntryForProfile, setSelectedEntryForProfile] = useState<
    CallLogEntry | { number: string; name: string | null } | null
  >(null);
  const [showUserProfileDrawer, setShowUserProfileDrawer] = useState(false);
  const [showNewLogModal, setShowNewLogModal] = useState(false);
  const [showDownloadApkModal, setShowDownloadApkModal] = useState(false);
  const [isEditingOverrides, setIsEditingOverrides] = useState(false);

  // Desktop view mode: 'mobile' (phone frame), 'split' (side-by-side with Forensic Panel)
  const [viewMode, setViewMode] = useState<'mobile' | 'split'>('split');
  const [sidePanel, setSidePanel] = useState<'forensic' | 'osint'>('forensic');

  const refreshData = () => {
    setCallLogs(LocalSqliteStorage.getCallLogs());
    setShadowOverrides(LocalSqliteStorage.getSettingsMap());
    setContacts(LocalSqliteStorage.getContacts());
  };

  useEffect(() => {
    refreshData();
    const unsubscribe = LocalSqliteStorage.subscribe(() => {
      refreshData();
    });

    // Background TTL check interval: runs every 5 seconds to automatically expire call statuses
    const ttlInterval = setInterval(() => {
      LocalSqliteStorage.checkAndExpireBusyStatuses();
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(ttlInterval);
    };
  }, []);

  // Bottom navigation tab click handler:
  // Dismisses any open contact or user profile so tabs work immediately from any screen!
  const handleTabSelect = (tab: ActiveTab) => {
    setSelectedEntryForProfile(null);
    setShowUserProfileDrawer(false);
    setIsEditingOverrides(false);
    setActiveTab(tab);
  };

  // Material 3 Truecaller Bottom Navigation Bar
  const renderBottomNav = () => (
    <nav className="h-16 bg-white border-t border-slate-100 flex items-center justify-around px-2 shrink-0 z-50 shadow-xs relative">
      {/* 1. Calls */}
      <button
        onClick={() => handleTabSelect('calls')}
        className={`flex-1 flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
          activeTab === 'calls'
            ? 'text-[#0087FF]'
            : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <div
          className={`px-4 py-1 rounded-full transition ${
            activeTab === 'calls'
              ? 'bg-[#0087FF]/15'
              : ''
          }`}
        >
          <Phone className={`w-5 h-5 ${activeTab === 'calls' ? 'stroke-[2.5]' : ''}`} />
        </div>
        <span className="text-[10px] font-semibold">Calls</span>
      </button>

      {/* 2. Messages */}
      <button
        onClick={() => handleTabSelect('messages')}
        className={`flex-1 flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
          activeTab === 'messages'
            ? 'text-[#0087FF]'
            : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <div
          className={`px-4 py-1 rounded-full transition ${
            activeTab === 'messages'
              ? 'bg-[#0087FF]/15'
              : ''
          }`}
        >
          <MessageSquare
            className={`w-5 h-5 ${activeTab === 'messages' ? 'stroke-[2.5]' : ''}`}
          />
        </div>
        <span className="text-[10px] font-semibold">Messages</span>
      </button>

      {/* 3. Contacts */}
      <button
        onClick={() => handleTabSelect('contacts')}
        className={`flex-1 flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
          activeTab === 'contacts'
            ? 'text-[#0087FF]'
            : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <div
          className={`px-4 py-1 rounded-full transition ${
            activeTab === 'contacts'
              ? 'bg-[#0087FF]/15'
              : ''
          }`}
        >
          <Users className={`w-5 h-5 ${activeTab === 'contacts' ? 'stroke-[2.5]' : ''}`} />
        </div>
        <span className="text-[10px] font-semibold">Contacts</span>
      </button>

      {/* 4. OSINT */}
      <button
        onClick={() => handleTabSelect('osint')}
        className={`flex-1 flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
          activeTab === 'osint'
            ? 'text-[#0087FF]'
            : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <div
          className={`px-4 py-1 rounded-full transition ${
            activeTab === 'osint'
              ? 'bg-[#0087FF]/15'
              : ''
          }`}
        >
          <Terminal className={`w-5 h-5 ${activeTab === 'osint' ? 'stroke-[2.5]' : ''}`} />
        </div>
        <span className="text-[10px] font-semibold">OSINT</span>
      </button>

      {/* 5. Forensic */}
      <button
        onClick={() => handleTabSelect('forensic')}
        className={`flex-1 flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
          activeTab === 'forensic'
            ? 'text-[#0087FF]'
            : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <div
          className={`px-4 py-1 rounded-full transition ${
            activeTab === 'forensic'
              ? 'bg-[#0087FF]/15'
              : ''
          }`}
        >
          <Fingerprint
            className={`w-5 h-5 ${activeTab === 'forensic' ? 'stroke-[2.5]' : ''}`}
          />
        </div>
        <span className="text-[10px] font-semibold">Forensic</span>
      </button>
    </nav>
  );

  // Phone screen contents based on activeTab
  const renderPhoneContent = () => {
    switch (activeTab) {
      case 'calls':
        return (
          <RecentsScreen
            callLogs={callLogs}
            shadowOverrides={shadowOverrides}
            searchQuery={searchQuery}
            contacts={contacts}
            onSelectEntry={(entry) => setSelectedEntryForProfile(entry)}
          />
        );

      case 'messages':
        return <MessagesComingSoon />;

      case 'contacts':
        return (
          <ContactsScreen
            contacts={contacts}
            shadowOverrides={shadowOverrides}
            searchQuery={searchQuery}
            onSelectContact={(c) =>
              setSelectedEntryForProfile({ number: c.number, name: c.name })
            }
          />
        );

      case 'osint':
        return <OsintScreen />;

      case 'forensic':
        return <ForensicScreen callLogs={callLogs} />;

      default:
        return null;
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Application Studio Header */}
      <header className="h-14 px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#0087FF] text-white flex items-center justify-center font-bold text-sm shadow-sm">
            N
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              Forensic Network Call Finder by Dwaipayan Chakraborty
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold bg-blue-500/20 text-[#0087FF] px-2 py-0.5 rounded-full border border-[#0087FF]/30">
                <ShieldCheck className="w-3 h-3" />
                Research Wing Division
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 hidden md:block">
              Project supported by Research Wing Division · Baseband Telemetry & Cryptographic Call Audit
            </p>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-2">
          {/* Download APK Button */}
          <button
            onClick={() => setShowDownloadApkModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
            title="Download or Build Android APK"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download APK</span>
          </button>

          {/* View Mode Toggle */}
          <div className="hidden lg:flex items-center bg-slate-800 rounded-xl p-0.5 border border-slate-700">
            <button
              onClick={() => setViewMode('mobile')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === 'mobile'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Phone Only
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === 'split'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              Split Studio
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left / Center Phone Mockup */}
        <div
          className={`flex-1 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto ${
            viewMode === 'split' ? 'lg:max-w-[480px] xl:max-w-[500px]' : ''
          }`}
        >
          <AndroidFrame isFramed={true}>
            {/* 
              USER REQUIREMENT:
              "also hide search and my profile when i visit someone's profile"
              So header is hidden when selectedEntryForProfile or showUserProfileDrawer is active!
            */}
            {!selectedEntryForProfile &&
              !showUserProfileDrawer &&
              activeTab !== 'forensic' &&
              activeTab !== 'osint' && (
                <TruecallerHeader
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onOpenUserProfile={() => setShowUserProfileDrawer(true)}
                />
              )}

            {/* Main Phone Content Screen */}
            <div className="flex-1 overflow-hidden flex flex-col relative bg-white">
              {renderPhoneContent()}

              {/* User Profile Screen (Network Forensics by Dwaipayan with PIN 3329) */}
              {showUserProfileDrawer && (
                <UserProfileDrawer
                  onClose={() => setShowUserProfileDrawer(false)}
                  onOpenAddLog={() => setShowNewLogModal(true)}
                  onRefreshData={refreshData}
                />
              )}

              {/* Contact Profile Screen (Overlaid on phone) */}
              {selectedEntryForProfile && (
                <ProfileEditorModal
                  key={selectedEntryForProfile.number.trim()}
                  entry={selectedEntryForProfile}
                  initialOverride={shadowOverrides[selectedEntryForProfile.number.trim()]}
                  allCallLogs={callLogs}
                  contacts={contacts}
                  onSelectContact={(contact) => {
                    setSelectedEntryForProfile({
                      number: contact.number,
                      name: contact.name,
                    });
                  }}
                  onUpdateEntry={(updated) => {
                    setSelectedEntryForProfile(updated);
                  }}
                  onClose={() => {
                    setSelectedEntryForProfile(null);
                    setIsEditingOverrides(false);
                  }}
                  onSaved={refreshData}
                  onEditingStateChange={setIsEditingOverrides}
                />
              )}
            </div>

            {/* Bottom Navigation Bar (Hidden when 'Edit Contact Overrides' modal overlay is active to keep entire focus on editing screen) */}
            {!isEditingOverrides && renderBottomNav()}
          </AndroidFrame>
        </div>

        {/* Right Studio Panel (Visible in Split Mode on wide screens) */}
        {viewMode === 'split' && (
          <div className="hidden lg:flex flex-1 flex-col border-l border-slate-800 bg-slate-900 overflow-hidden">
            {/* Studio Panel Switcher */}
            <div className="h-11 px-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSidePanel('forensic')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    sidePanel === 'forensic'
                      ? 'bg-[#0087FF]/20 text-[#0087FF]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Fingerprint className="w-3.5 h-3.5" />
                  Forensic Telemetry & Cryptographic Audit
                </button>
                <button
                  onClick={() => setSidePanel('osint')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    sidePanel === 'osint'
                      ? 'bg-[#0087FF]/20 text-[#0087FF]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  Target Reconnaissance (OSINT)
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Baseband Live Hook Active</span>
              </div>
            </div>

            {/* Side Panel Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {sidePanel === 'forensic' ? (
                <ForensicScreen callLogs={callLogs} />
              ) : (
                <OsintScreen />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Hidden New Call Log Injection Modal (Unlocked only with 3329) */}
      {showNewLogModal && (
        <NewCallLogModal
          onClose={() => setShowNewLogModal(false)}
          onAdded={refreshData}
        />
      )}

      {/* Download / Build APK Guide Modal */}
      {showDownloadApkModal && (
        <DownloadApkModal onClose={() => setShowDownloadApkModal(false)} />
      )}
    </div>
  );
}
