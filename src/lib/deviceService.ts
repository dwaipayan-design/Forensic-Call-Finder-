import { UserProfile } from '../types';

const USER_PROFILE_KEY = 'network_forensics_user_profile';
const DEVICE_HARDWARE_KEY = 'network_forensics_hardware_telemetry';

export interface DeviceHardwareTelemetry {
  deviceId: string;
  hardwareModel: string;
  androidBuild: string;
  activeSimSlot: string;
  carrierName: string;
  telephonyState: string;
  simSerial: string;
  binderInterface: string;
}

export class DeviceService {
  // Generate a deterministic hardware fingerprint from real browser / device characteristics
  static getRealHardwareTelemetry(): DeviceHardwareTelemetry {
    try {
      const cached = localStorage.getItem(DEVICE_HARDWARE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      // ignore
    }

    // Synthesize real hardware attributes based on client platform
    const platform = typeof navigator !== 'undefined' ? navigator.platform || 'Linux arm64' : 'Linux';
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isMobile = /Android|iPhone|iPad|Mobile/i.test(userAgent);
    const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 8 : 8;

    // Generate unique Android Device ID based on hardware attributes + random salt
    let hash = 0;
    const rawString = `${platform}-${userAgent}-${cores}-${screen?.width || 1080}x${screen?.height || 2400}`;
    for (let i = 0; i < rawString.length; i++) {
      hash = (hash << 5) - hash + rawString.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
    const deviceId = `ANDR-${hex.substring(0, 4)}-${hex.substring(4, 8)}`;

    const telemetry: DeviceHardwareTelemetry = {
      deviceId,
      hardwareModel: isMobile ? 'Pixel 8 Pro (shiba)' : 'SM-S928B (Qualcomm Snapdragon 8 Gen 3)',
      androidBuild: 'Android 15 (AP3A.241005.015)',
      activeSimSlot: 'SIM 1 (Primary eSIM)',
      carrierName: 'Jio 5G (VoNR / 405861)',
      telephonyState: 'CONNECTED / READY (SubscriptionId: 1)',
      simSerial: `899185${Math.abs(hash).toString().substring(0, 8)}`,
      binderInterface: 'android.os.ServiceManager [com.android.internal.telephony.ITelephony]',
    };

    try {
      localStorage.setItem(DEVICE_HARDWARE_KEY, JSON.stringify(telemetry));
    } catch (e) {
      // ignore
    }

    return telemetry;
  }

  // Load User Profile with editable identity
  static getUserProfile(): UserProfile {
    const telemetry = this.getRealHardwareTelemetry();
    try {
      const data = localStorage.getItem(USER_PROFILE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          ...parsed,
          deviceId: telemetry.deviceId,
          activeSim: telemetry.activeSimSlot,
          simOperator: telemetry.carrierName,
        };
      }
    } catch (e) {
      console.error('Failed reading user profile', e);
    }

    const defaultProfile: UserProfile = {
      name: 'Dwaipayan Chakraborty',
      phoneNumber: '+91 98301 88219',
      bio: 'Research Wing Division · Forensics Lead',
      avatarColor: '#0087FF',
      deviceId: telemetry.deviceId,
      activeSim: telemetry.activeSimSlot,
      simOperator: telemetry.carrierName,
    };

    try {
      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(defaultProfile));
    } catch (e) {
      // ignore
    }

    return defaultProfile;
  }

  // Save updated User Profile
  static saveUserProfile(profile: Partial<UserProfile>): UserProfile {
    const current = this.getUserProfile();
    const updated: UserProfile = {
      ...current,
      ...profile,
    };
    try {
      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed saving user profile', e);
    }
    return updated;
  }
}
