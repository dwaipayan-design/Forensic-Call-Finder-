import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Phone,
  MessageSquare,
  Ban,
  Share2,
  MoreVertical,
  Clock,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  PhoneOff,
  Edit3,
  X,
  Check,
  Save,
  Trash2,
  Globe,
  Search,
  ExternalLink,
  ShieldAlert,
  Flame,
  Radio,
  Camera,
  Upload,
  UserCheck,
  Building,
  Pencil,
  Users,
  UserPlus
} from 'lucide-react';
import { CallLogEntry, ContactItem, ManualOverride } from '../types';
import { LocalSqliteStorage } from '../lib/storage';

interface ProfileEditorModalProps {
  entry: CallLogEntry | { number: string; name: string | null };
  initialOverride?: ManualOverride;
  allCallLogs: CallLogEntry[];
  contacts?: ContactItem[];
  onSelectContact?: (contact: ContactItem) => void;
  onUpdateEntry?: (entry: { number: string; name: string | null }) => void;
  onClose: () => void;
  onSaved: () => void;
  onEditingStateChange?: (isEditing: boolean) => void;
}

export const ProfileEditorModal: React.FC<ProfileEditorModalProps> = ({
  entry,
  initialOverride,
  allCallLogs,
  contacts = [],
  onSelectContact,
  onUpdateEntry,
  onClose,
  onSaved,
  onEditingStateChange,
}) => {
  const [currentNumber, setCurrentNumber] = useState<string>(entry.number.trim());
  const rawNumber = currentNumber;

  const matchedContact = contacts.find(
    (c) => LocalSqliteStorage.normalizeNumber(c.number) === LocalSqliteStorage.normalizeNumber(currentNumber)
  );

  // Smart verification badging (Requirement 3):
  // Blue verified badge is automatically shown IF number is saved in actual device contacts!
  const isVerified = !!matchedContact;

  const [isBusy, setIsBusy] = useState<boolean>(initialOverride?.is_busy ?? false);
  const [talkingTo, setTalkingTo] = useState<string>(initialOverride?.talking_to ?? '');
  const [talkingToNumber, setTalkingToNumber] = useState<string>(
    initialOverride?.talking_to_number ?? ''
  );
  const [talkingToId, setTalkingToId] = useState<string>(
    initialOverride?.talking_to_id ?? ''
  );
  // Dual-mode caller selection (Requirement 2: Device Contact vs Custom Entry)
  const [callerMode, setCallerMode] = useState<'contact' | 'custom'>(
    initialOverride?.is_custom_caller ? 'custom' : 'contact'
  );
  const [fakeName, setFakeName] = useState<string>(
    initialOverride?.is_custom_caller ? (initialOverride.talking_to || '') : ''
  );
  const [fakeNumber, setFakeNumber] = useState<string>(
    initialOverride?.is_custom_caller ? (initialOverride.talking_to_number || '') : ''
  );
  const [isCustomCaller, setIsCustomCaller] = useState<boolean>(
    initialOverride?.is_custom_caller ?? false
  );
  // Custom local name override should ONLY be what is explicitly typed in override, NOT entry.name
  const [customName, setCustomName] = useState<string>(
    initialOverride?.custom_name || ''
  );
  const [isBlocked, setIsBlocked] = useState<boolean>(initialOverride?.is_blocked ?? false);

  // Initial avatar resolution: override avatar takes priority, then device contact avatar, else empty
  const [avatarUrl, setAvatarUrl] = useState<string>(
    initialOverride?.avatar_url || matchedContact?.avatarUrl || ''
  );

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // 3-dots menu & edit modal states
  const [showMenu, setShowMenu] = useState(false);
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [showEditContactModal, setShowEditContactModal] = useState(false);
  const [showContactPicker, setShowContactPicker] = useState(false); // Requirement 1: Native contact picker modal
  const [contactPickerSearch, setContactPickerSearch] = useState('');
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [showDeviceToast, setShowDeviceToast] = useState(false);

  // Edit Device Contact Form State (Direct device contact book: Name first, then editable Phone number)
  const [deviceContactName, setDeviceContactName] = useState<string>(
    matchedContact?.name || entry.name || ''
  );
  const [deviceContactNumber, setDeviceContactNumber] = useState<string>(
    entry.number.trim()
  );
  const [deviceCompany, setDeviceCompany] = useState<string>(
    matchedContact?.company || ''
  );

  // Sync editing state with parent to hide bottom navigation bar while active
  useEffect(() => {
    onEditingStateChange?.(showEditSheet || showEditContactModal || showContactPicker);
  }, [showEditSheet, showEditContactModal, showContactPicker, onEditingStateChange]);

  useEffect(() => {
    return () => {
      onEditingStateChange?.(false);
    };
  }, [onEditingStateChange]);

  // Synchronize state when entry or overrides change (fixes profile picture and name staying the same when switching contacts)
  useEffect(() => {
    const raw = entry.number.trim();
    setCurrentNumber(raw);

    const matched = contacts.find(
      (c) => LocalSqliteStorage.normalizeNumber(c.number) === LocalSqliteStorage.normalizeNumber(raw)
    );

    // Profile picture MUST update dynamically when switching between contacts
    const effectiveAvatar = initialOverride?.avatar_url || matched?.avatarUrl || '';
    setAvatarUrl(effectiveAvatar);

    if (initialOverride) {
      setIsBusy(initialOverride.is_busy);
      setIsCustomCaller(initialOverride.is_custom_caller ?? false);
      if (initialOverride.is_custom_caller) {
        setCallerMode('custom');
        setFakeName(initialOverride.talking_to || '');
        setFakeNumber(initialOverride.talking_to_number || '');
        setTalkingTo(initialOverride.talking_to || '');
        setTalkingToNumber(initialOverride.talking_to_number || '');
        setTalkingToId('');
      } else {
        setCallerMode('contact');
        setTalkingTo(initialOverride.talking_to || '');
        setTalkingToNumber(initialOverride.talking_to_number || '');
        setTalkingToId(initialOverride.talking_to_id || '');
        setFakeName('');
        setFakeNumber('');
      }
      setCustomName(initialOverride.custom_name || '');
      setIsBlocked(initialOverride?.is_blocked ?? false);
    } else {
      setIsBusy(false);
      setIsCustomCaller(false);
      setCallerMode('contact');
      setTalkingTo('');
      setTalkingToNumber('');
      setTalkingToId('');
      setFakeName('');
      setFakeNumber('');
      setCustomName('');
      setIsBlocked(false);
    }

    if (matched) {
      setDeviceContactName(matched.name);
      setDeviceContactNumber(matched.number);
      setDeviceCompany(matched.company || '');
    } else {
      setDeviceContactName(entry.name || '');
      setDeviceContactNumber(raw);
      setDeviceCompany('');
    }
  }, [initialOverride, entry, contacts]);

  const effectiveDisplayName = (customName.trim() ? customName.trim() : null) || matchedContact?.name || entry.name || rawNumber;
  const initial = (effectiveDisplayName[0] || '?').toUpperCase();

  // Find all call logs between me and this specific contact
  const contactHistory = allCallLogs.filter(
    (log) => log.number.trim() === rawNumber
  );

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setAvatarUrl(base64);
        const override: ManualOverride = {
          number: rawNumber,
          is_busy: isBusy,
          talking_to: isBusy ? talkingTo.trim() : '',
          is_verified: isVerified,
          custom_name: customName.trim() ? customName.trim() : undefined,
          avatar_url: base64,
          is_blocked: isBlocked,
          updated_at: Date.now(),
        };
        LocalSqliteStorage.saveSetting(override);
        onSaved();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl('');
    const override: ManualOverride = {
      number: rawNumber,
      is_busy: isBusy,
      talking_to: isBusy ? talkingTo.trim() : '',
      is_verified: isVerified,
      custom_name: customName.trim() ? customName.trim() : undefined,
      avatar_url: '',
      is_blocked: isBlocked,
      updated_at: Date.now(),
    };
    LocalSqliteStorage.saveSetting(override);
    onSaved();
  };

  const handleSaveOverrides = () => {
    if (isBusy) {
      if (callerMode === 'custom' && fakeName.trim()) {
        // Option B (Custom Entry): Fake Name & Fake Number - unlinked, no ghost profile
        LocalSqliteStorage.setCustomCallStatus(
          rawNumber,
          fakeName.trim(),
          fakeNumber.trim() || undefined
        );
        setTalkingTo(fakeName.trim());
        setTalkingToNumber(fakeNumber.trim());
        setIsCustomCaller(true);
      } else if (callerMode === 'contact' && talkingTo.trim()) {
        // Option A (Device Contact): Real device contact with bidirectional link
        if (talkingToNumber) {
          LocalSqliteStorage.setBidirectionalCallStatus(
            rawNumber,
            effectiveDisplayName,
            talkingToNumber,
            talkingTo.trim(),
            talkingToId,
            matchedContact?.id
          );
          setIsCustomCaller(false);
        } else {
          LocalSqliteStorage.setCustomCallStatus(
            rawNumber,
            talkingTo.trim(),
            undefined
          );
          setIsCustomCaller(true);
        }
      } else {
        LocalSqliteStorage.setCustomCallStatus(
          rawNumber,
          'Someone',
          undefined
        );
        setIsCustomCaller(true);
      }
    } else {
      // Revert / Clear call status bidirectionally (Requirement 4: zeroes ghost calls)
      LocalSqliteStorage.clearCallStatus(rawNumber);
      const override: ManualOverride = {
        number: rawNumber,
        is_busy: false,
        talking_to: '',
        talking_to_number: undefined,
        talking_to_id: undefined,
        is_custom_caller: false,
        busy_expires_at: undefined,
        is_verified: isVerified,
        custom_name: customName.trim() ? customName.trim() : undefined,
        avatar_url: avatarUrl || undefined,
        is_blocked: isBlocked,
        updated_at: Date.now(),
      };
      LocalSqliteStorage.saveSetting(override);
      setTalkingTo('');
      setTalkingToNumber('');
      setTalkingToId('');
      setIsCustomCaller(false);
    }

    setShowSavedToast(true);
    setTimeout(() => {
      setShowSavedToast(false);
      setShowEditSheet(false);
      onSaved();
    }, 300);
  };

  // Really edits the device contact (persisted in phone contact book and synced with device call logs and settings)
  const handleSaveDeviceContact = () => {
    const trimmedName = deviceContactName.trim() || deviceContactNumber.trim() || currentNumber;
    const trimmedNumber = deviceContactNumber.trim() || currentNumber;

    LocalSqliteStorage.updateDeviceContact(currentNumber, {
      name: trimmedName,
      number: trimmedNumber,
      company: deviceCompany.trim() || undefined,
      avatarUrl: avatarUrl || undefined,
    });

    setCurrentNumber(trimmedNumber);
    setCustomName(''); // Clear custom override name so the newly edited device contact name shows up immediately!
    onUpdateEntry?.({
      number: trimmedNumber,
      name: trimmedName,
    });

    setShowDeviceToast(true);
    setTimeout(() => {
      setShowDeviceToast(false);
      setShowEditContactModal(false);
      onSaved();
    }, 400);
  };

  const handleToggleBlock = () => {
    const nextBlocked = !isBlocked;
    setIsBlocked(nextBlocked);
    const override: ManualOverride = {
      number: rawNumber,
      is_busy: isBusy,
      talking_to: talkingTo,
      is_verified: isVerified,
      custom_name: customName.trim() ? customName.trim() : undefined,
      is_blocked: nextBlocked,
      updated_at: Date.now(),
    };
    LocalSqliteStorage.saveSetting(override);
    onSaved();
  };

  const handleShareContact = async () => {
    setShowMenu(false);
    const text = `${effectiveDisplayName}\nPhone: ${rawNumber}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: effectiveDisplayName, text });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    navigator.clipboard.writeText(text);
    alert(`Contact copied to clipboard:\n${text}`);
  };

  const handleSearchWeb = () => {
    setShowMenu(false);
    window.open(`https://www.google.com/search?q=${encodeURIComponent(rawNumber)}`, '_blank');
  };

  const handleTruecallerSearch = () => {
    setShowMenu(false);
    const cleanDigits = rawNumber.replace(/[^\d]/g, '');
    window.open(`https://www.truecaller.com/search/in/${cleanDigits}`, '_blank');
  };

  const handleOsintSearch = () => {
    setShowMenu(false);
    window.open(`https://epieos.com/?q=${encodeURIComponent(rawNumber)}`, '_blank');
  };

  const handlePublicSearch = () => {
    setShowMenu(false);
    window.open(`https://www.numlookup.com/`, '_blank');
  };

  const handleDeleteContact = () => {
    setShowMenu(false);
    if (window.confirm(`Delete contact ${effectiveDisplayName} (${rawNumber})? This will delete all call logs, device contact, and local overrides.`)) {
      LocalSqliteStorage.deleteSetting(rawNumber);
      LocalSqliteStorage.deleteCallsForNumber(rawNumber);
      LocalSqliteStorage.deleteContact(rawNumber);
      onSaved();
      onClose();
    }
  };

  const handleDeleteOverride = () => {
    LocalSqliteStorage.deleteSetting(rawNumber);
    setShowMenu(false);
    setShowEditSheet(false);
    onSaved();
    onClose();
  };

  const formatLogDate = (ts: number) => {
    const d = new Date(ts);
    const hours = d.getHours() % 12 || 12;
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = d.getHours() >= 12 ? 'PM' : 'AM';
    return `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${hours}:${minutes} ${ampm}`;
  };

  const formatDuration = (sec: number) => {
    if (sec <= 0) return 'Missed / 0s';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  const renderCallIcon = (type: string) => {
    switch (type) {
      case 'incoming':
        return <PhoneIncoming className="w-3.5 h-3.5 text-[#0087FF]" />;
      case 'outgoing':
        return <PhoneOutgoing className="w-3.5 h-3.5 text-emerald-600" />;
      case 'missed':
        return <PhoneMissed className="w-3.5 h-3.5 text-[#EB3349]" />;
      case 'rejected':
        return <PhoneOff className="w-3.5 h-3.5 text-[#EB3349]" />;
      default:
        return <Phone className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="absolute inset-0 z-40 bg-white flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
      {/* Top App Bar with Back and 3-Dots Menu */}
      <div className="h-14 px-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
        <button
          onClick={onClose}
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-700 transition"
          title="Back to Recents"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="font-semibold text-slate-900 text-sm">Profile Details</div>

        {/* 3-DOTS MENU (Where status & info are edited) */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 -mr-2 rounded-full hover:bg-slate-100 text-slate-700 transition"
            title="Options"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-10 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 p-1.5 z-40 text-left text-xs animate-in fade-in duration-150 divide-y divide-slate-100">
                <div className="space-y-0.5 pb-1">
                  {/* 1. Share contact */}
                  <button
                    onClick={handleShareContact}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 transition font-medium"
                  >
                    <Share2 className="w-4 h-4 text-slate-400" />
                    <span>Share contact</span>
                  </button>

                  {/* 2. Search web */}
                  <button
                    onClick={handleSearchWeb}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 transition font-medium"
                  >
                    <Globe className="w-4 h-4 text-[#0087FF]" />
                    <span>Search web</span>
                  </button>

                  {/* 3. Truecaller search */}
                  <button
                    onClick={handleTruecallerSearch}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 transition font-medium"
                  >
                    <Search className="w-4 h-4 text-[#0087FF]" />
                    <span>Truecaller search</span>
                  </button>

                  {/* 4. Ocient search */}
                  <button
                    onClick={handleOsintSearch}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 transition font-medium"
                  >
                    <Radio className="w-4 h-4 text-indigo-500" />
                    <span>Ocient search</span>
                  </button>

                  {/* 5. Public search */}
                  <button
                    onClick={handlePublicSearch}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 transition font-medium"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                    <span>Public search</span>
                  </button>

                  {/* Edit Contact (Really edits device contact) */}
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setDeviceContactName(matchedContact?.name || entry.name || '');
                      setDeviceContactNumber(currentNumber);
                      setDeviceCompany(matchedContact?.company || '');
                      setShowEditContactModal(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-blue-50/80 hover:text-[#0087FF] transition font-medium"
                  >
                    <Pencil className="w-4 h-4 text-[#0087FF]" />
                    <span>Edit contact</span>
                  </button>
                </div>

                <div className="space-y-0.5 pt-1">
                  {/* 6. Edit Status & Info (hidden behind "Block Contact" so pressing this edits status info as requested) */}
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowEditSheet(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-rose-50/80 hover:text-[#EB3349] transition font-medium"
                    title="Block Contact"
                  >
                    <Ban className="w-4 h-4 text-[#EB3349]" />
                    <span>Block Contact</span>
                  </button>

                  {/* 7. Delete contact */}
                  <button
                    onClick={handleDeleteContact}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 transition font-medium"
                  >
                    <Trash2 className="w-4 h-4 text-rose-500" />
                    <span>Delete contact</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Profile Body */}
      <div className="flex-1 overflow-y-auto pb-8">
        {/* Profile Hero Header */}
        <div className="pt-6 pb-4 px-6 flex flex-col items-center text-center bg-gradient-to-b from-slate-50 to-white">
          {/* Avatar with Instagram story-like red/green gradient stroke ring */}
          <div className="relative mb-3 group">
            <div
              className={`p-[3.5px] rounded-full transition-all duration-300 shadow-md ${
                isBusy
                  ? 'bg-[#EB3349] ring-2 ring-red-200/70'
                  : 'bg-[#10B981] ring-2 ring-emerald-200/60'
              }`}
            >
              <div className="p-[2.5px] bg-white rounded-full">
                <div
                  className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-3xl shadow-inner select-none cursor-pointer"
                  style={{ backgroundColor: matchedContact?.avatarColor || '#0087FF' }}
                  onClick={() => fileInputRef.current?.click()}
                  title="Click to edit or upload profile photo"
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={effectiveDisplayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{initial}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Camera / Edit Profile Picture Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-slate-900/90 hover:bg-[#0087FF] text-white flex items-center justify-center shadow-lg border-2 border-white transition active:scale-95 cursor-pointer"
              title="Add or update profile picture"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>

          <div className="flex items-center gap-1.5 justify-center">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {effectiveDisplayName}
            </h2>
            {isVerified && (
              <CheckCircle2 className="w-5 h-5 text-[#0087FF] fill-[#0087FF] stroke-white shrink-0" />
            )}
          </div>

          <div className="text-sm font-medium text-slate-500 mt-0.5 tracking-wide">
            {rawNumber}
          </div>

          {/* Subtitle status (Bidirectional navigation: clicking the linked contact name navigates directly to their profile with synced picture) */}
          <div className="mt-1 flex items-center gap-2 text-xs">
            <span className="text-slate-400">Mobile · United States</span>
            <span className="text-slate-300">·</span>
            {isBusy ? (
              <span className="font-semibold text-[#EB3349] flex items-center gap-1.5">
                <span>In a Call with</span>
                {talkingTo ? (
                  (() => {
                    const isCustom = initialOverride?.is_custom_caller || isCustomCaller || !talkingToNumber;

                    if (isCustom) {
                      // Option B (Custom Entry): NOT clickable / tappable, no ghost profile navigation!
                      return (
                        <span className="font-bold text-[#EB3349]">{talkingTo}</span>
                      );
                    }

                    // Option A (Device Contact): Clickable link that navigates to their profile
                    const partnerContact = contacts.find(
                      (c) =>
                        (talkingToNumber && LocalSqliteStorage.normalizeNumber(c.number) === LocalSqliteStorage.normalizeNumber(talkingToNumber)) ||
                        c.name.toLowerCase() === talkingTo.toLowerCase()
                    );
                    const partnerOverride = talkingToNumber ? LocalSqliteStorage.getSetting(talkingToNumber) : undefined;
                    const partnerAvatar = partnerOverride?.avatar_url || partnerContact?.avatarUrl;

                    return (
                      <button
                        type="button"
                        onClick={() => {
                          // Navigate to linked profile (Requirement 4)
                          const targetNumber = talkingToNumber || partnerContact?.number || contacts.find((c) => c.name.toLowerCase() === talkingTo.toLowerCase())?.number;
                          if (targetNumber && onSelectContact) {
                            const targetContact = contacts.find((c) => LocalSqliteStorage.normalizeNumber(c.number) === LocalSqliteStorage.normalizeNumber(targetNumber)) || {
                              id: talkingToId || `c-${Date.now()}`,
                              name: talkingTo,
                              number: targetNumber,
                              avatarColor: partnerContact?.avatarColor || '#0087FF',
                              avatarUrl: partnerAvatar,
                            };
                            onSelectContact(targetContact);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 underline font-bold text-[#EB3349] hover:text-rose-700 cursor-pointer decoration-rose-300 hover:decoration-rose-500 transition"
                        title={`View ${talkingTo}'s profile`}
                      >
                        {partnerAvatar ? (
                          <img
                            src={partnerAvatar}
                            alt={talkingTo}
                            className="w-4 h-4 rounded-full object-cover border border-rose-300 inline-block shrink-0 shadow-2xs"
                          />
                        ) : (
                          <span
                            className="w-4 h-4 rounded-full text-white text-[9px] font-bold inline-flex items-center justify-center shrink-0 shadow-2xs"
                            style={{ backgroundColor: partnerContact?.avatarColor || '#EB3349' }}
                          >
                            {(talkingTo[0] || '?').toUpperCase()}
                          </span>
                        )}
                        <span>{talkingTo}</span>
                      </button>
                    );
                  })()
                ) : (
                  <span>Someone</span>
                )}
              </span>
            ) : (
              <span className="font-semibold text-[#10B981]">Available</span>
            )}
          </div>

          {/* Action Buttons: Call, Message, Block / Unblock, Share */}
          <div className="flex items-center gap-6 mt-6">
            {/* Real device Phone Dialer */}
            <a
              href={`tel:${rawNumber.replace(/[^\d+*#]/g, '')}`}
              onClick={(e) => {
                const clean = rawNumber.replace(/[^\d+*#]/g, '');
                window.location.href = `tel:${clean}`;
              }}
              className="flex flex-col items-center gap-1 text-slate-700 hover:text-[#0087FF] transition group cursor-pointer"
              title={`Call ${effectiveDisplayName} via device phone caller`}
            >
              <div className="w-11 h-11 rounded-full bg-[#0087FF]/10 text-[#0087FF] flex items-center justify-center shadow-xs group-hover:bg-[#0087FF] group-hover:text-white transition">
                <Phone className="w-5 h-5 fill-current/15" />
              </div>
              <span className="text-xs font-medium">Call</span>
            </a>

            {/* Real device SMS Messenger */}
            <a
              href={`sms:${rawNumber.replace(/[^\d+*#]/g, '')}`}
              onClick={(e) => {
                const clean = rawNumber.replace(/[^\d+*#]/g, '');
                window.location.href = `sms:${clean}`;
              }}
              className="flex flex-col items-center gap-1 text-slate-700 hover:text-emerald-600 transition group cursor-pointer"
              title={`Message ${effectiveDisplayName} via device SMS`}
            >
              <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs group-hover:bg-emerald-600 group-hover:text-white transition">
                <MessageSquare className="w-5 h-5 fill-current/15" />
              </div>
              <span className="text-xs font-medium">Message</span>
            </a>

            {/* Block Button (Pure UI button: toggles visual state only, does nothing else) */}
            <button
              onClick={() => setIsBlocked((prev) => !prev)}
              className={`flex flex-col items-center gap-1 transition ${
                isBlocked ? 'text-[#EB3349]' : 'text-slate-700 hover:text-[#EB3349]'
              }`}
              type="button"
              title={isBlocked ? 'Unblock' : 'Block'}
            >
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center shadow-xs transition ${
                  isBlocked
                    ? 'bg-[#EB3349] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-[#EB3349]'
                }`}
              >
                <Ban className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium">
                {isBlocked ? 'Unblock' : 'Block'}
              </span>
            </button>

            {/* Share contact */}
            <button
              onClick={handleShareContact}
              className="flex flex-col items-center gap-1 text-slate-700 hover:text-slate-900 transition"
              title="Share contact details"
            >
              <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200/80 flex items-center justify-center shadow-xs transition">
                <Share2 className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium">Share</span>
            </button>
          </div>
        </div>

        {/* CALL HISTORY SECTION (Requested to fill this part with call history!) */}
        <div className="mx-4 mt-4 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#0087FF]/10 text-[#0087FF] flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Call History with Contact
              </div>
            </div>
            <span className="text-[11px] font-medium text-slate-400">
              {contactHistory.length} recorded
            </span>
          </div>

          {contactHistory.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <Clock className="w-8 h-8 mx-auto mb-1 stroke-1 text-slate-300" />
              <div className="text-xs font-semibold text-slate-600">No Prior Calls Found</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Calls with this number from device call logs will appear here.
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {contactHistory.map((log) => (
                <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-full bg-slate-100 shrink-0">
                      {renderCallIcon(log.type)}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800 capitalize">
                        {log.type} Call
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {formatLogDate(log.timestamp)} · {log.sim}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-medium text-slate-600">
                      {formatDuration(log.duration)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL / SHEET ACCESSIBLE ONLY VIA 3-DOTS MENU TO EDIT STATUS & INFO */}
      {/* MODAL / SHEET ACCESSIBLE ONLY VIA 3-DOTS MENU TO EDIT STATUS & INFO */}
      {showEditSheet && (
        <div
          onClick={(e) => {
            // Auto-Save on Dismiss (Implicit Save - Requirement 3)
            if (e.target === e.currentTarget) handleSaveOverrides();
          }}
          className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 animate-in fade-in"
        >
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Edit Contact Overrides</h3>
                <p className="text-[11px] text-slate-400 font-mono">{rawNumber}</p>
              </div>
              <button
                onClick={handleSaveOverrides}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Save and close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* 1. Availability Switch */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <span>Status: {isBusy ? "In a Call" : "Available"}</span>
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isBusy ? 'bg-[#EB3349]' : 'bg-[#10B981]'
                      }`}
                    />
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {isBusy ? "Shows Red 'In a call' indicator" : "Shows Green 'Available' indicator"}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsBusy(!isBusy)}
                  className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out flex items-center ${
                    isBusy ? 'bg-[#EB3349]' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                      isBusy ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* 2. Dual-Mode Caller Selection (Device Contact vs Custom Entry) */}
              {isBusy && (
                <div className="p-3.5 bg-slate-50/80 rounded-2xl space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-[#1C1C1E]">
                      In a call with
                    </label>
                    <span className="text-[10px] font-mono font-medium text-[#8E8E93]">
                      {callerMode === 'contact' ? 'Linked Profile' : 'Custom / Unlinked'}
                    </span>
                  </div>

                  {/* Dual Mode Switcher Tabs */}
                  <div className="flex rounded-xl bg-slate-200/70 p-1 text-xs font-semibold gap-1">
                    <button
                      type="button"
                      onClick={() => setCallerMode('contact')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        callerMode === 'contact'
                          ? 'bg-white text-[#1C1C1E] shadow-xs'
                          : 'text-[#8E8E93] hover:text-[#1C1C1E]'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5 text-[#007AFF]" />
                      <span>Device Contact</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCallerMode('custom')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        callerMode === 'custom'
                          ? 'bg-white text-[#1C1C1E] shadow-xs'
                          : 'text-[#8E8E93] hover:text-[#1C1C1E]'
                      }`}
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#EB3349]" />
                      <span>Custom Entry</span>
                    </button>
                  </div>

                  {/* Option A: Device Contact */}
                  {callerMode === 'contact' && (
                    <div className="space-y-2">
                      {talkingTo && !isCustomCaller ? (
                        <div className="flex items-center justify-between p-2.5 bg-white rounded-xl shadow-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-[#007AFF] text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {(talkingTo[0] || '?').toUpperCase()}
                            </div>
                            <div className="min-w-0 truncate">
                              <div className="font-bold text-xs text-[#1C1C1E] truncate">
                                {talkingTo}
                              </div>
                              <div className="text-[10.5px] font-mono text-[#8E8E93] truncate">
                                {talkingToNumber || 'Device Contact'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setShowContactPicker(true)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-[#007AFF] bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                            >
                              Change
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setTalkingTo('');
                                setTalkingToNumber('');
                                setTalkingToId('');
                              }}
                              className="p-1 text-slate-400 hover:text-rose-500 rounded-lg transition"
                              title="Clear selection"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowContactPicker(true)}
                          className="w-full h-11 px-3 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold text-[#007AFF] flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
                        >
                          <Users className="w-4 h-4 text-[#007AFF]" />
                          <span>Select from Device Contacts...</span>
                        </button>
                      )}
                      <p className="text-[10.5px] text-[#8E8E93] leading-tight">
                        Option A: Creates an interconnected, clickable profile link with two-way status sync.
                      </p>
                    </div>
                  )}

                  {/* Option B: Custom Entry (Fake Name & Fake Number) */}
                  {callerMode === 'custom' && (
                    <div className="space-y-2.5 bg-white p-3 rounded-xl shadow-xs">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Fake Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={fakeName}
                          onChange={(e) => setFakeName(e.target.value)}
                          placeholder="e.g. Boss, Mom, Dr. Vance"
                          className="w-full h-9 px-3 bg-slate-50 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Fake Number <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={fakeNumber}
                          onChange={(e) => setFakeNumber(e.target.value)}
                          placeholder="e.g. +1 800 555 0199"
                          className="w-full h-9 px-3 bg-slate-50 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                        />
                      </div>

                      <p className="text-[10.5px] text-[#8E8E93] leading-tight">
                        Option B: Displays in call logs as "In a call with {fakeName || '[Fake Name]'}". Will <strong>NOT</strong> be clickable and will not attempt to link to a device profile.
                      </p>
                    </div>
                  )}

                  <div className="text-[10.5px] text-[#8E8E93] leading-tight pt-1">
                    ⏱ Auto-expires in <strong>5 to 15 minutes</strong> via background TTL timer.
                  </div>
                </div>
              )}

              {/* Requirement 3: Smart Verification Badging Info (Automatic, manual toggle removed) */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    className={`w-4 h-4 ${
                      isVerified
                        ? 'text-[#0087FF] fill-[#0087FF] stroke-white'
                        : 'text-slate-300 stroke-slate-400'
                    }`}
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span>Smart Verified Badge</span>
                      <span
                        className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded ${
                          isVerified
                            ? 'bg-blue-100 text-[#0087FF]'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {isVerified ? 'AUTO-VERIFIED' : 'UNSAVED NUMBER'}
                      </span>
                    </div>
                    <div className="text-[10.5px] text-slate-500 mt-0.5">
                      {isVerified
                        ? 'Automatically active because number is saved in device contacts'
                        : 'Only numbers saved in device contacts receive verified badge'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button (Implicit save on backdrop / dismiss also works) */}
              <button
                onClick={handleSaveOverrides}
                className="w-full h-11 mt-2 rounded-xl bg-[#0087FF] hover:bg-[#0073D9] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
              >
                {showSavedToast ? (
                  <>
                    <Check className="w-4 h-4" />
                    Saved Overrides!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Apply Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* REAL DEVICE CONTACT EDITOR MODAL (Really edits device contact) */}
      {showEditContactModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowEditContactModal(false);
          }}
          className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 animate-in fade-in"
        >
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#0087FF]/10 text-[#0087FF] flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Edit Device Contact</h3>
                  <p className="text-[11px] text-slate-400 font-mono">Real Device Contact Book</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditContactModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5">
              {/* Contact Name (Name should be first as requested) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={deviceContactName}
                  onChange={(e) => setDeviceContactName(e.target.value)}
                  placeholder="Enter contact name"
                  autoFocus
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0087FF]/30 focus:border-[#0087FF]"
                />
                <p className="text-[10.5px] text-slate-400 mt-1">
                  Updates the real contact name across call logs, contacts book, and dialer.
                </p>
              </div>

              {/* Phone Number (Editable: Name is first, then phone number) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  value={deviceContactNumber}
                  onChange={(e) => setDeviceContactNumber(e.target.value)}
                  placeholder="Enter phone number"
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0087FF]/30 focus:border-[#0087FF]"
                />
                <p className="text-[10.5px] text-slate-400 mt-1">
                  Updates phone number in device contact book and all associated call records.
                </p>
              </div>

              {/* Company / Organization (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Company / Organization <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={deviceCompany}
                    onChange={(e) => setDeviceCompany(e.target.value)}
                    placeholder="e.g. Apex Innovations, Work"
                    className="w-full h-10 pl-8 pr-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0087FF]/30 focus:border-[#0087FF]"
                  />
                  <Building className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                </div>
              </div>

              {/* Device Notice */}
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-start gap-2.5">
                <UserCheck className="w-4 h-4 text-[#0087FF] shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Saving will write directly to device contact storage and synchronize this person's name across all existing call records.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditContactModal(false)}
                  className="flex-1 h-10 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveDeviceContact}
                  className="flex-1 h-10 rounded-xl bg-[#0087FF] hover:bg-[#0073D9] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  {showDeviceToast ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Updated Contact!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save to Device</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NATIVE DEVICE CONTACT PICKER (Requirement 1: Opens device contact picker to select contact to assign to In a call with) */}
      {showContactPicker && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowContactPicker(false);
          }}
          className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 animate-in fade-in"
        >
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#0087FF]/10 text-[#0087FF] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Select Contact</h3>
                  <p className="text-[11px] text-slate-400">Device Phone Book</p>
                </div>
              </div>
              <button
                onClick={() => setShowContactPicker(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="pt-3 pb-2 shrink-0">
              <div className="relative">
                <input
                  type="text"
                  value={contactPickerSearch}
                  onChange={(e) => setContactPickerSearch(e.target.value)}
                  placeholder="Search contacts..."
                  autoFocus
                  className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0087FF]/30"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Contacts List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100/80 -mx-1 px-1 mt-1">
              {contacts
                .filter((c) => c.number.trim() !== rawNumber) // Exclude current profile self-selection
                .filter((c) =>
                  c.name.toLowerCase().includes(contactPickerSearch.toLowerCase()) ||
                  c.number.includes(contactPickerSearch)
                )
                .map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => {
                      setTalkingTo(contact.name);
                      setTalkingToNumber(contact.number);
                      setTalkingToId(contact.id);
                      setShowContactPicker(false);
                    }}
                    className="w-full py-2.5 px-2 flex items-center gap-3 hover:bg-slate-50 rounded-xl transition text-left cursor-pointer group"
                  >
                    {contact.avatarUrl ? (
                      <img
                        src={contact.avatarUrl}
                        alt={contact.name}
                        className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-100"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs"
                        style={{ backgroundColor: contact.avatarColor }}
                      >
                        {(contact.name[0] || '?').toUpperCase()}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 group-hover:text-[#0087FF] transition truncate">
                        {contact.name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 truncate">
                        {contact.number}
                        {contact.company && ` · ${contact.company}`}
                      </div>
                    </div>

                    <div className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:border-[#0087FF] group-hover:text-[#0087FF] group-hover:bg-blue-50 transition shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  </button>
                ))}

              {contacts.filter((c) => c.number.trim() !== rawNumber).length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No other contacts found in device.
                </div>
              )}
            </div>

            {/* Cancel Button */}
            <div className="pt-3 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setShowContactPicker(false)}
                className="w-full h-9 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Close Picker
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
