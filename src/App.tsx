import React, { useState, useEffect } from 'react';
import {
  Phone,
  MessageSquare,
  Users,
  Terminal,
  Fingerprint,
} from 'lucide-react';
import { CallLogEntry, ContactItem, ManualOverride, ActiveTab } from './types';
import { LocalSqliteStorage } from './lib/storage';
import { TruecallerHeader } from './components/TruecallerHeader';
import { RecentsScreen } from './components/RecentsScreen';
import { MessagesComingSoon } from './components/MessagesComingSoon';
import { ContactsScreen } from './components/ContactsScreen';
import { ProfileEditorModal } from './components/ProfileEditorModal';
import { NewCallLogModal } from './components/NewCallLogModal';
import { OsintScreen } from './components/OsintScreen';
import { ForensicScreen } from './components/ForensicScreen';
import { UserProfileDrawer } from './components/UserProfileDrawer';
import { SplashScreen } from './components/SplashScreen';
import { OnboardingModal } from './components/OnboardingModal';
import { DeviceService } from './lib/deviceService';
import { NativeAndroidService, PermissionStatus } from './lib/nativeAndroidService';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userProfile, setUserProfile] = useState(() => DeviceService.getUserProfile());
  const [activeTab, setActiveTab] = useState<ActiveTab>('calls');
  const [searchQuery, setSearchQuery] = useState('');
  const [callLogs, setCallLogs] = useState<CallLogEntry[]>([]);
  const [shadowOverrides, setShadowOverrides] = useState<Record<string, ManualOverride>>({});
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>({
    contacts: 'prompt',
    callLog: 'prompt',
  });

  // Modals & Overlays
  const [selectedEntryForProfile, setSelectedEntryForProfile] = useState<
    CallLogEntry | { number: string; name: string | null } | null
  >(null);
  const [showUserProfileDrawer, setShowUserProfileDrawer] = useState(false);
  const [showNewLogModal, setShowNewLogModal] = useState(false);
  const [isEditingOverrides, setIsEditingOverrides] = useState(false);

  const refreshData = () => {
    setCallLogs(LocalSqliteStorage.getCallLogs());
    setShadowOverrides(LocalSqliteStorage.getSettingsMap());
    setContacts(LocalSqliteStorage.getContacts());
    setUserProfile(DeviceService.getUserProfile());
  };

  // Trigger sync with native Android providers
  const triggerDeviceSync = async () => {
    setIsSyncing(true);
    try {
      const perms = await NativeAndroidService.checkPermissions();
      setPermissionStatus(perms);
      await NativeAndroidService.syncDeviceData();
      refreshData();
    } catch (e) {
      console.error('Device sync failed', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRequestPermissions = async () => {
    setIsSyncing(true);
    try {
      const perms = await NativeAndroidService.requestPermissions();
      setPermissionStatus(perms);
      await NativeAndroidService.syncDeviceData();
      refreshData();
    } catch (e) {
      console.error('Request permissions failed', e);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    refreshData();
    const unsubscribe = LocalSqliteStorage.subscribe(() => {
      refreshData();
    });

    // Auto-sync on initial launch
    triggerDeviceSync();

    // Auto-sync on app resume / window focus (e.g. returning from phone settings or dialer)
    const handleFocus = () => {
      triggerDeviceSync();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        triggerDeviceSync();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Background TTL check interval: runs every 5 seconds to automatically expire call statuses
    const ttlInterval = setInterval(() => {
      LocalSqliteStorage.checkAndExpireBusyStatuses();
    }, 5000);

    return () => {
      unsubscribe();
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(ttlInterval);
    };
  }, []);

  // Bottom navigation tab click handler:
  // Dismisses any open contact or user profile so tabs switch immediately from any screen
  const handleTabSelect = (tab: ActiveTab) => {
    setSelectedEntryForProfile(null);
    setShowUserProfileDrawer(false);
    setIsEditingOverrides(false);
    setActiveTab(tab);
  };

  // Material 3 Truecaller Bottom Navigation Bar
  const renderBottomNav = () => (
    <nav className="h-16 bg-white flex items-center justify-around px-2 shrink-0 z-50 shadow-xs relative">
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
            ? 'text-[#007AFF]'
            : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <div
          className={`px-4 py-1 rounded-full transition ${
            activeTab === 'forensic'
              ? 'bg-[#007AFF]/15'
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
            permissionStatus={permissionStatus.callLog}
            onRequestPermission={handleRequestPermissions}
            onOpenSettings={() => NativeAndroidService.openSettings()}
            isSyncing={isSyncing}
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
            permissionStatus={permissionStatus.contacts}
            onRequestPermission={handleRequestPermissions}
            onOpenSettings={() => NativeAndroidService.openSettings()}
            isSyncing={isSyncing}
          />
        );

      case 'osint':
        return <OsintScreen />;

      case 'forensic':
        return (
          <ForensicScreen
            callLogs={callLogs}
            onOpenUserProfile={() => setShowUserProfileDrawer(true)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full h-[100dvh] flex flex-col bg-white overflow-hidden text-[#1C1C1E] font-sans select-none">
      {/* Top Safe Area Inset Spacer for edge-to-edge Android displays */}
      <div className="pt-[env(safe-area-inset-top,0px)] bg-white shrink-0" />

      {/* 
        Standard Top Search Header (Calls, Messages, Contacts):
        Hidden when visiting a profile or the User Profile drawer
      */}
      {!selectedEntryForProfile &&
        !showUserProfileDrawer &&
        activeTab !== 'forensic' &&
        activeTab !== 'osint' && (
          <TruecallerHeader
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onOpenUserProfile={() => setShowUserProfileDrawer(true)}
            isSyncing={isSyncing}
            onSync={triggerDeviceSync}
            userInitials={userProfile.name ? userProfile.name.trim().charAt(0).toUpperCase() : 'U'}
          />
        )}

      {/* Main Full-Screen Application View */}
      <main className="flex-1 overflow-hidden flex flex-col relative bg-white">
        {renderPhoneContent()}

        {/* User Profile Screen */}
        {showUserProfileDrawer && (
          <UserProfileDrawer
            onClose={() => setShowUserProfileDrawer(false)}
            onOpenAddLog={() => setShowNewLogModal(true)}
            onRefreshData={refreshData}
          />
        )}

        {/* Contact Profile Screen */}
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

        {/* New Call Log Injection Modal (Unlocked only with 3329) */}
        {showNewLogModal && (
          <NewCallLogModal
            contacts={contacts}
            defaultSim={DeviceService.getRealHardwareTelemetry().activeSimSlot}
            onClose={() => setShowNewLogModal(false)}
            onAdded={() => {
              refreshData();
              triggerDeviceSync();
            }}
          />
        )}
      </main>

      {/* Fixed Bottom Navigation Bar with Safe Area Handling */}
      {!isEditingOverrides && (
        <div className="shrink-0 pb-[env(safe-area-inset-bottom,0px)] bg-white border-t border-slate-100 z-50">
          {renderBottomNav()}
        </div>
      )}

      {/* Full-Screen Native Boot Splash Screen */}
      {showSplash && (
        <SplashScreen
          onComplete={() => {
            setShowSplash(false);
            // Prompt permissions immediately after splash screen
            handleRequestPermissions();
            // Check if profile needs first-time onboarding
            if (!DeviceService.isProfileConfigured()) {
              setShowOnboarding(true);
            }
          }}
        />
      )}

      {/* First-Time User Profile Setup Onboarding */}
      {showOnboarding && !showSplash && (
        <OnboardingModal
          detectedCarrier={DeviceService.getRealHardwareTelemetry().carrierName}
          onComplete={() => {
            setShowOnboarding(false);
            refreshData();
          }}
        />
      )}
    </div>
  );
}
