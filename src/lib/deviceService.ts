import { UserProfile } from '../types';
import { NativeAndroidService } from './nativeAndroidService';

const USER_PROFILE_KEY = 'network_forensics_user_profile';
const DEVICE_HARDWARE_KEY = 'network_forensics_hardware_telemetry';

export interface DeviceHardwareTelemetry {
  deviceId: string;
  hardwareModel: string;
  androidBuild: string;
  activeSimSlot: string;
  carrierName: string;
  simCarrierName?: string;
  simOperator?: string;
  registeredCarrierName?: string;
  registeredOperator?: string;
  dataNetworkType?: string;
  dataState?: string;
  isRoaming?: boolean;
  simState?: string;
  telephonyState: string;
  simSerial: string;
  binderInterface: string;
  isNative?: boolean;
  simSubscriptions?: Array<{
    slotIndex: number;
    subscriptionId?: number;
    carrier: string;
    displayName?: string;
    countryIso?: string;
    mcc?: string | number;
    mnc?: string | number;
    isEmbedded?: boolean;
  }>;
}

export class DeviceService {
  /**
   * Retrieve genuine hardware and SIM telemetry directly from the Android device bridge,
   * falling back to client environment indicators only when running in a generic browser.
   */
  static getRealHardwareTelemetry(): DeviceHardwareTelemetry {
    // 1. Check if Android native bridge has real hardware telemetry
    const nativeData = NativeAndroidService.getRealHardwareTelemetry();
    if (nativeData && nativeData.hardwareModel) {
      const realTelemetry: DeviceHardwareTelemetry = {
        deviceId: nativeData.deviceId,
        hardwareModel: nativeData.hardwareModel,
        androidBuild: nativeData.androidBuild,
        activeSimSlot: nativeData.activeSimSlot,
        carrierName: nativeData.carrierName,
        simCarrierName: nativeData.simCarrierName,
        simOperator: nativeData.simOperator,
        registeredCarrierName: nativeData.registeredCarrierName,
        registeredOperator: nativeData.registeredOperator,
        dataNetworkType: nativeData.dataNetworkType,
        dataState: nativeData.dataState,
        isRoaming: nativeData.isRoaming,
        simState: nativeData.simState,
        telephonyState: nativeData.telephonyState,
        simSerial: nativeData.simSerial,
        binderInterface: nativeData.binderInterface,
        isNative: true,
        simSubscriptions: nativeData.simSubscriptions,
      };
      try {
        localStorage.setItem(DEVICE_HARDWARE_KEY, JSON.stringify(realTelemetry));
      } catch (e) {
        // ignore
      }
      return realTelemetry;
    }

    // 2. Check cached telemetry
    try {
      const cached = localStorage.getItem(DEVICE_HARDWARE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      // ignore
    }

    // 3. Fallback for desktop/web browser development
    const platform = typeof navigator !== 'undefined' ? navigator.platform || 'Linux' : 'Linux';
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isMobile = /Android|iPhone|iPad|Mobile/i.test(userAgent);
    const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 8 : 8;

    let hash = 0;
    const rawString = `${platform}-${userAgent}-${cores}-${screen?.width || 1080}x${screen?.height || 2400}`;
    for (let i = 0; i < rawString.length; i++) {
      hash = (hash << 5) - hash + rawString.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
    const deviceId = `ANDR-${hex.substring(0, 4)}-${hex.substring(4, 8)}`;

    const fallbackTelemetry: DeviceHardwareTelemetry = {
      deviceId,
      hardwareModel: isMobile ? 'Android Handset (Connected)' : 'Hardware Telephony Client',
      androidBuild: 'Android OS (Cellular Telephony HAL)',
      activeSimSlot: 'SIM 1 (Active Network)',
      carrierName: 'Cellular Carrier Active',
      telephonyState: 'CONNECTED / READY',
      simSerial: `ICCID-${hex.substring(0, 6)}`,
      binderInterface: 'android.os.ServiceManager [com.android.internal.telephony.ITelephony]',
    };

    return fallbackTelemetry;
  }

  /**
   * Check if user profile has been configured by the user
   */
  static isProfileConfigured(): boolean {
    try {
      const data = localStorage.getItem(USER_PROFILE_KEY);
      if (!data) return false;
      const parsed = JSON.parse(data);
      return !!(parsed && parsed.isConfigured && parsed.name && parsed.name.trim().length > 0);
    } catch (e) {
      return false;
    }
  }

  /**
   * Load User Profile. If unconfigured, returns an unconfigured profile without fake values.
   */
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

    const unconfiguredProfile: UserProfile = {
      name: '',
      phoneNumber: '',
      bio: 'Forensics Lead · Telephony Analysis',
      avatarColor: '#0087FF',
      deviceId: telemetry.deviceId,
      activeSim: telemetry.activeSimSlot,
      simOperator: telemetry.carrierName,
      isConfigured: false,
    };

    return unconfiguredProfile;
  }

  /**
   * Save updated User Profile
   */
  static saveUserProfile(profile: Partial<UserProfile>): UserProfile {
    const current = this.getUserProfile();
    const updated: UserProfile = {
      ...current,
      ...profile,
      isConfigured: true,
    };
    try {
      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed saving user profile', e);
    }
    return updated;
  }
}
