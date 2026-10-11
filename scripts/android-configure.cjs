const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const manifestPath = path.join(rootDir, 'android/app/src/main/AndroidManifest.xml');

console.log('=== Configuring Native Android Telephony & Contacts Integration ===');

// 1. Update AndroidManifest.xml
if (fs.existsSync(manifestPath)) {
  let manifest = fs.readFileSync(manifestPath, 'utf8');

  const requiredPermissions = [
    '    <uses-permission android:name="android.permission.READ_CONTACTS" />',
    '    <uses-permission android:name="android.permission.READ_CALL_LOG" />',
    '    <uses-permission android:name="android.permission.WRITE_CALL_LOG" />',
    '    <uses-permission android:name="android.permission.READ_PHONE_STATE" />',
    '    <uses-permission android:name="android.permission.CALL_PHONE" />',
    '    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />',
    '    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />',
  ];

  for (const perm of requiredPermissions) {
    if (!manifest.includes(perm.trim())) {
      manifest = manifest.replace('<application', `${perm}\n    <application`);
      console.log(`Added permission: ${perm.trim()}`);
    }
  }

  fs.writeFileSync(manifestPath, manifest, 'utf8');
  console.log('Successfully updated AndroidManifest.xml');
} else {
  console.warn('AndroidManifest.xml not found at:', manifestPath);
}

// 2. Locate package directory inside android/app/src/main/java
const javaBaseDir = path.join(rootDir, 'android/app/src/main/java');
if (fs.existsSync(javaBaseDir)) {
  function findPackageDir(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const full = path.join(dir, f);
      if (fs.statSync(full).isDirectory()) {
        if (fs.existsSync(path.join(full, 'MainActivity.java'))) {
          return full;
        }
        const found = findPackageDir(full);
        if (found) return found;
      }
    }
    return null;
  }

  const pkgDir = findPackageDir(javaBaseDir);
  if (pkgDir) {
    console.log('Found package directory:', pkgDir);

    const mainActivityPath = path.join(pkgDir, 'MainActivity.java');
    const mainContent = fs.readFileSync(mainActivityPath, 'utf8');
    const pkgMatch = mainContent.match(/package\s+([a-zA-Z0-9_.]+);/);
    const pkgName = pkgMatch ? pkgMatch[1] : 'com.dwaipayan.forensiccallfinder';

    const bridgePath = path.join(pkgDir, 'AndroidNativeBridge.java');
    const bridgeCode = `package ${pkgName};

import android.Manifest;
import android.app.Activity;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.SystemClock;
import android.provider.CallLog;
import android.provider.ContactsContract;
import android.provider.Settings;
import android.telephony.CellIdentityGsm;
import android.telephony.CellIdentityLte;
import android.telephony.CellIdentityNr;
import android.telephony.CellInfo;
import android.telephony.CellInfoGsm;
import android.telephony.CellInfoLte;
import android.telephony.CellInfoNr;
import android.telephony.CellSignalStrength;
import android.telephony.CellSignalStrengthGsm;
import android.telephony.CellSignalStrengthLte;
import android.telephony.CellSignalStrengthNr;
import android.telephony.SignalStrength;
import android.telephony.SubscriptionInfo;
import android.telephony.SubscriptionManager;
import android.telephony.TelephonyManager;
import android.webkit.JavascriptInterface;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.List;

public class AndroidNativeBridge {
    private final Activity activity;

    public AndroidNativeBridge(Activity activity) {
        this.activity = activity;
    }

    @JavascriptInterface
    public String checkPermissions() {
        try {
            boolean hasContacts = ContextCompat.checkSelfPermission(activity, Manifest.permission.READ_CONTACTS) == PackageManager.PERMISSION_GRANTED;
            boolean hasCallLog = ContextCompat.checkSelfPermission(activity, Manifest.permission.READ_CALL_LOG) == PackageManager.PERMISSION_GRANTED;
            boolean hasWriteCallLog = ContextCompat.checkSelfPermission(activity, Manifest.permission.WRITE_CALL_LOG) == PackageManager.PERMISSION_GRANTED;
            boolean hasPhoneState = ContextCompat.checkSelfPermission(activity, Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED;
            boolean hasLocation = ContextCompat.checkSelfPermission(activity, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;

            JSONObject obj = new JSONObject();
            obj.put("contacts", hasContacts);
            obj.put("callLog", hasCallLog);
            obj.put("writeCallLog", hasWriteCallLog);
            obj.put("phoneState", hasPhoneState);
            obj.put("location", hasLocation);
            return obj.toString();
        } catch (Exception e) {
            return "{\\"contacts\\":false,\\"callLog\\":false,\\"writeCallLog\\":false,\\"phoneState\\":false,\\"location\\":false}";
        }
    }

    @JavascriptInterface
    public void requestPermissions() {
        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                ActivityCompat.requestPermissions(activity, new String[]{
                    Manifest.permission.READ_CONTACTS,
                    Manifest.permission.READ_CALL_LOG,
                    Manifest.permission.WRITE_CALL_LOG,
                    Manifest.permission.READ_PHONE_STATE,
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION
                }, 101);
            }
        });
    }

    @JavascriptInterface
    public void openAppSettings() {
        try {
            Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            Uri uri = Uri.fromParts("package", activity.getPackageName(), null);
            intent.setData(uri);
            activity.startActivity(intent);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private String getDataNetworkTypeName(int networkType) {
        switch (networkType) {
            case TelephonyManager.NETWORK_TYPE_NR:
                return "5G NR";
            case TelephonyManager.NETWORK_TYPE_LTE:
                return "LTE";
            case TelephonyManager.NETWORK_TYPE_HSPAP:
                return "HSPA+";
            case TelephonyManager.NETWORK_TYPE_HSPA:
                return "HSPA";
            case TelephonyManager.NETWORK_TYPE_UMTS:
                return "UMTS / 3G";
            case TelephonyManager.NETWORK_TYPE_EDGE:
                return "EDGE";
            case TelephonyManager.NETWORK_TYPE_GPRS:
                return "GPRS";
            case TelephonyManager.NETWORK_TYPE_UNKNOWN:
            default:
                return "Unknown / Inactive";
        }
    }

    private String getDataStateName(int dataState) {
        switch (dataState) {
            case TelephonyManager.DATA_CONNECTED:
                return "Connected";
            case TelephonyManager.DATA_CONNECTING:
                return "Connecting";
            case TelephonyManager.DATA_SUSPENDED:
                return "Suspended";
            case TelephonyManager.DATA_DISCONNECTED:
                return "Disconnected";
            default:
                return "Unknown";
        }
    }

    @JavascriptInterface
    public String getHardwareTelemetry() {
        JSONObject obj = new JSONObject();
        try {
            // 1. Device Identifiers
            String androidId = Settings.Secure.getString(activity.getContentResolver(), Settings.Secure.ANDROID_ID);
            obj.put("deviceId", androidId != null ? "ANDR-" + androidId.toUpperCase() : "ANDR-UNKNOWN");
            obj.put("hardwareModel", Build.MANUFACTURER + " " + Build.MODEL);
            obj.put("androidBuild", "Android " + Build.VERSION.RELEASE + " (API " + Build.VERSION.SDK_INT + ")");

            // 2. Real Telephony and Carrier Details
            TelephonyManager tm = (TelephonyManager) activity.getSystemService(Context.TELEPHONY_SERVICE);
            String networkOperatorName = tm != null ? tm.getNetworkOperatorName() : "";
            String simOperatorName = tm != null ? tm.getSimOperatorName() : "";
            String networkOperator = tm != null ? tm.getNetworkOperator() : "";
            String simOperator = tm != null ? tm.getSimOperator() : "";
            boolean isRoaming = tm != null && tm.isNetworkRoaming();

            obj.put("simCarrierName", !simOperatorName.isEmpty() ? simOperatorName : "Not reported by SIM");
            obj.put("simOperator", simOperator);
            obj.put("registeredCarrierName", !networkOperatorName.isEmpty() ? networkOperatorName : "Not connected to cellular network");
            obj.put("registeredOperator", networkOperator);
            obj.put("isRoaming", isRoaming);

            String primaryCarrier = !networkOperatorName.isEmpty() ? networkOperatorName : (!simOperatorName.isEmpty() ? simOperatorName : "Cellular Network");
            if (!networkOperator.isEmpty()) {
                primaryCarrier += " (" + networkOperator + ")";
            }
            obj.put("carrierName", primaryCarrier);

            String simStateStr = "UNKNOWN";
            if (tm != null) {
                switch (tm.getSimState()) {
                    case TelephonyManager.SIM_STATE_READY:
                        simStateStr = "SIM_STATE_READY";
                        break;
                    case TelephonyManager.SIM_STATE_ABSENT:
                        simStateStr = "SIM_STATE_ABSENT";
                        break;
                    case TelephonyManager.SIM_STATE_PIN_REQUIRED:
                    case TelephonyManager.SIM_STATE_PUK_REQUIRED:
                        simStateStr = "SIM_LOCKED";
                        break;
                    default:
                        simStateStr = "NOT_READY";
                }
            }
            obj.put("simState", simStateStr);
            obj.put("telephonyState", simStateStr.equals("SIM_STATE_READY") ? "SIM_STATE_READY · ACTIVE RIL" : simStateStr);

            // Data RAT & Data State
            if (tm != null) {
                try {
                    int dataRat = tm.getDataNetworkType();
                    obj.put("dataNetworkType", getDataNetworkTypeName(dataRat));
                } catch (SecurityException se) {
                    obj.put("dataNetworkType", "Permission required");
                }
                obj.put("dataState", getDataStateName(tm.getDataState()));
            } else {
                obj.put("dataNetworkType", "Unavailable");
                obj.put("dataState", "Unavailable");
            }

            // 3. Multi-SIM / Active Subscriptions
            JSONArray simList = new JSONArray();
            if (ContextCompat.checkSelfPermission(activity, Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1) {
                    SubscriptionManager sm = (SubscriptionManager) activity.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE);
                    if (sm != null) {
                        List<SubscriptionInfo> subList = sm.getActiveSubscriptionInfoList();
                        if (subList != null && !subList.isEmpty()) {
                            for (SubscriptionInfo info : subList) {
                                JSONObject simObj = new JSONObject();
                                simObj.put("slotIndex", info.getSimSlotIndex());
                                simObj.put("subscriptionId", info.getSubscriptionId());
                                simObj.put("carrier", info.getCarrierName() != null ? info.getCarrierName().toString() : "");
                                simObj.put("displayName", info.getDisplayName() != null ? info.getDisplayName().toString() : "");
                                simObj.put("countryIso", info.getCountryIso());
                                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                                    simObj.put("mcc", info.getMccString());
                                    simObj.put("mnc", info.getMncString());
                                } else {
                                    simObj.put("mcc", String.valueOf(info.getMcc()));
                                    simObj.put("mnc", String.valueOf(info.getMnc()));
                                }
                                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                                    simObj.put("isEmbedded", info.isEmbedded());
                                }
                                simList.put(simObj);
                            }
                        }
                    }
                }
            }
            obj.put("simSubscriptions", simList);
            obj.put("activeSimSlot", simList.length() > 0 ? "SIM " + (simList.getJSONObject(0).optInt("slotIndex") + 1) + " (" + simList.getJSONObject(0).optString("carrier") + ")" : "SIM 1 (Active)");
            obj.put("simSerial", androidId != null ? "ICCID-" + androidId.substring(0, Math.min(8, androidId.length())).toUpperCase() : "SIM-HARDWARE");
            obj.put("binderInterface", "android.os.ServiceManager [com.android.internal.telephony.ITelephony]");

            return obj.toString();
        } catch (Exception e) {
            e.printStackTrace();
            return "{}";
        }
    }

    @JavascriptInterface
    public String getCellAndSignalTelemetry() {
        JSONObject obj = new JSONObject();
        try {
            TelephonyManager tm = (TelephonyManager) activity.getSystemService(Context.TELEPHONY_SERVICE);
            if (tm == null) {
                obj.put("hasRealTelemetry", false);
                obj.put("error", "TelephonyManager unavailable");
                return obj.toString();
            }

            obj.put("hasRealTelemetry", true);
            obj.put("source", "android_telephony_api");

            // 1. Signal Strength via tm.getSignalStrength()
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                SignalStrength ss = tm.getSignalStrength();
                if (ss != null) {
                    obj.put("overallLevel", ss.getLevel()); // 0-4

                    List<CellSignalStrength> list = ss.getCellSignalStrengths();
                    for (CellSignalStrength css : list) {
                        if (css instanceof CellSignalStrengthNr) {
                            CellSignalStrengthNr nr = (CellSignalStrengthNr) css;
                            obj.put("overallDbm", nr.getDbm());
                            if (nr.getSsRsrp() != CellInfo.UNAVAILABLE) obj.put("nrSsRsrp", nr.getSsRsrp());
                            if (nr.getSsRsrq() != CellInfo.UNAVAILABLE) obj.put("nrSsRsrq", nr.getSsRsrq());
                            if (nr.getSsSinr() != CellInfo.UNAVAILABLE) obj.put("nrSsSinr", nr.getSsSinr());
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                                if (nr.getCsiRsrp() != CellInfo.UNAVAILABLE) obj.put("nrCsiRsrp", nr.getCsiRsrp());
                                if (nr.getCsiRsrq() != CellInfo.UNAVAILABLE) obj.put("nrCsiRsrq", nr.getCsiRsrq());
                                if (nr.getCsiSinr() != CellInfo.UNAVAILABLE) obj.put("nrCsiSinr", nr.getCsiSinr());
                            }
                        } else if (css instanceof CellSignalStrengthLte) {
                            CellSignalStrengthLte lte = (CellSignalStrengthLte) css;
                            if (!obj.has("overallDbm")) obj.put("overallDbm", lte.getDbm());
                            if (lte.getRsrp() != CellInfo.UNAVAILABLE) obj.put("lteRsrp", lte.getRsrp());
                            if (lte.getRsrq() != CellInfo.UNAVAILABLE) obj.put("lteRsrq", lte.getRsrq());
                            if (lte.getRssnr() != CellInfo.UNAVAILABLE) obj.put("lteRssnr", lte.getRssnr());
                            if (lte.getCqi() != CellInfo.UNAVAILABLE) obj.put("lteCqi", lte.getCqi());
                            if (lte.getTimingAdvance() != CellInfo.UNAVAILABLE && lte.getTimingAdvance() != Integer.MAX_VALUE) {
                                obj.put("lteTimingAdvance", lte.getTimingAdvance());
                            }
                        } else if (css instanceof CellSignalStrengthGsm) {
                            CellSignalStrengthGsm gsm = (CellSignalStrengthGsm) css;
                            if (!obj.has("overallDbm")) obj.put("overallDbm", gsm.getDbm());
                            if (gsm.getRssi() != CellInfo.UNAVAILABLE) obj.put("gsmRssi", gsm.getRssi());
                        }
                    }
                }
            }

            // 2. Cell Info via tm.getAllCellInfo() - Requires ACCESS_FINE_LOCATION
            boolean hasLoc = ContextCompat.checkSelfPermission(activity, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
            obj.put("locationPermissionGranted", hasLoc);

            if (!hasLoc) {
                obj.put("cellInfoStatus", "ACCESS_FINE_LOCATION permission required by Android OS to query serving cell identifiers");
            } else {
                List<CellInfo> cellInfos = tm.getAllCellInfo();
                if (cellInfos != null && !cellInfos.isEmpty()) {
                    CellInfo registeredCell = null;
                    for (CellInfo c : cellInfos) {
                        if (c.isRegistered()) {
                            registeredCell = c;
                            break;
                        }
                    }
                    if (registeredCell == null) {
                        registeredCell = cellInfos.get(0);
                    }

                    long nowNanos = SystemClock.elapsedRealtimeNanos();
                    long ageMs = (nowNanos - registeredCell.getTimeStamp()) / 1000000;
                    obj.put("ageMs", Math.max(0, ageMs));
                    obj.put("isCached", ageMs > 4000);
                    obj.put("isRegistered", registeredCell.isRegistered());

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && registeredCell instanceof CellInfoNr) {
                        CellInfoNr nr = (CellInfoNr) registeredCell;
                        obj.put("rat", "5G NR");
                        CellIdentityNr id = (CellIdentityNr) nr.getCellIdentity();
                        if (id.getPci() != CellInfo.UNAVAILABLE) obj.put("pci", id.getPci());
                        if (id.getTac() != CellInfo.UNAVAILABLE) obj.put("tac", id.getTac());
                        if (id.getNci() != CellInfo.UNAVAILABLE) obj.put("cellId", String.valueOf(id.getNci()));
                        if (id.getNrarfcn() != CellInfo.UNAVAILABLE) obj.put("arfcn", id.getNrarfcn());
                        if (id.getMccString() != null) obj.put("mcc", id.getMccString());
                        if (id.getMncString() != null) obj.put("mnc", id.getMncString());
                    } else if (registeredCell instanceof CellInfoLte) {
                        CellInfoLte lte = (CellInfoLte) registeredCell;
                        obj.put("rat", "LTE");
                        CellIdentityLte id = lte.getCellIdentity();
                        if (id.getPci() != CellInfo.UNAVAILABLE) obj.put("pci", id.getPci());
                        if (id.getTac() != CellInfo.UNAVAILABLE) obj.put("tac", id.getTac());
                        if (id.getCi() != CellInfo.UNAVAILABLE) obj.put("cellId", String.valueOf(id.getCi()));
                        if (id.getEarfcn() != CellInfo.UNAVAILABLE) obj.put("arfcn", id.getEarfcn());
                        if (id.getBandwidth() != CellInfo.UNAVAILABLE) obj.put("bandwidth", id.getBandwidth());
                        if (id.getMccString() != null) obj.put("mcc", id.getMccString());
                        if (id.getMncString() != null) obj.put("mnc", id.getMncString());
                    } else if (registeredCell instanceof CellInfoGsm) {
                        CellInfoGsm gsm = (CellInfoGsm) registeredCell;
                        obj.put("rat", "GSM");
                        CellIdentityGsm id = gsm.getCellIdentity();
                        if (id.getCid() != CellInfo.UNAVAILABLE) obj.put("cellId", String.valueOf(id.getCid()));
                        if (id.getLac() != CellInfo.UNAVAILABLE) obj.put("tac", id.getLac());
                        if (id.getMccString() != null) obj.put("mcc", id.getMccString());
                        if (id.getMncString() != null) obj.put("mnc", id.getMncString());
                    }
                } else {
                    obj.put("cellInfoStatus", "No cell info returned by TelephonyManager");
                }
            }

            return obj.toString();
        } catch (Exception e) {
            e.printStackTrace();
            return "{\\"hasRealTelemetry\\":false,\\"error\\":\\"" + e.getMessage() + "\\"}";
        }
    }

    @JavascriptInterface
    public String getContacts() {
        JSONArray array = new JSONArray();
        try {
            if (ContextCompat.checkSelfPermission(activity, Manifest.permission.READ_CONTACTS) != PackageManager.PERMISSION_GRANTED) {
                return "[]";
            }

            Cursor cursor = activity.getContentResolver().query(
                ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
                new String[]{
                    ContactsContract.CommonDataKinds.Phone._ID,
                    ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
                    ContactsContract.CommonDataKinds.Phone.NUMBER,
                    ContactsContract.CommonDataKinds.Phone.PHOTO_URI
                },
                null,
                null,
                ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME + " ASC"
            );

            if (cursor != null) {
                while (cursor.moveToNext()) {
                    String id = cursor.getString(0);
                    String name = cursor.getString(1);
                    String number = cursor.getString(2);
                    String photo = cursor.getString(3);

                    JSONObject obj = new JSONObject();
                    obj.put("id", id != null ? id : "");
                    obj.put("name", name != null ? name : "");
                    obj.put("number", number != null ? number : "");
                    if (photo != null) obj.put("photoUri", photo);
                    array.put(obj);
                }
                cursor.close();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return array.toString();
    }

    @JavascriptInterface
    public String getCallLogs() {
        JSONArray array = new JSONArray();
        try {
            if (ContextCompat.checkSelfPermission(activity, Manifest.permission.READ_CALL_LOG) != PackageManager.PERMISSION_GRANTED) {
                return "[]";
            }

            Cursor cursor = activity.getContentResolver().query(
                CallLog.Calls.CONTENT_URI,
                new String[]{
                    CallLog.Calls._ID,
                    CallLog.Calls.NUMBER,
                    CallLog.Calls.CACHED_NAME,
                    CallLog.Calls.DATE,
                    CallLog.Calls.DURATION,
                    CallLog.Calls.TYPE
                },
                null,
                null,
                CallLog.Calls.DATE + " DESC"
            );

            if (cursor != null) {
                int count = 0;
                while (cursor.moveToNext() && count < 500) {
                    String id = cursor.getString(0);
                    String number = cursor.getString(1);
                    String name = cursor.getString(2);
                    long date = cursor.getLong(3);
                    long duration = cursor.getLong(4);
                    int type = cursor.getInt(5);

                    JSONObject obj = new JSONObject();
                    obj.put("id", id != null ? id : "call-" + count);
                    obj.put("number", number != null ? number : "");
                    obj.put("name", name != null ? name : "");
                    obj.put("timestamp", date);
                    obj.put("duration", duration);

                    String typeStr = "incoming";
                    if (type == CallLog.Calls.MISSED_TYPE) {
                        typeStr = "missed";
                    } else if (type == CallLog.Calls.OUTGOING_TYPE) {
                        typeStr = "outgoing";
                    } else if (type == CallLog.Calls.REJECTED_TYPE) {
                        typeStr = "rejected";
                    }
                    obj.put("type", typeStr);

                    array.put(obj);
                    count++;
                }
                cursor.close();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return array.toString();
    }

    @JavascriptInterface
    public boolean insertCallLog(String number, String name, long timestamp, long duration, String typeStr, String sim) {
        try {
            if (ContextCompat.checkSelfPermission(activity, Manifest.permission.WRITE_CALL_LOG) != PackageManager.PERMISSION_GRANTED) {
                return false;
            }

            ContentValues values = new ContentValues();
            values.put(CallLog.Calls.NUMBER, number);
            if (name != null && !name.isEmpty()) {
                values.put(CallLog.Calls.CACHED_NAME, name);
            }
            values.put(CallLog.Calls.DATE, timestamp > 0 ? timestamp : System.currentTimeMillis());
            values.put(CallLog.Calls.DURATION, duration);

            int callType = CallLog.Calls.INCOMING_TYPE;
            if ("outgoing".equalsIgnoreCase(typeStr)) {
                callType = CallLog.Calls.OUTGOING_TYPE;
            } else if ("missed".equalsIgnoreCase(typeStr)) {
                callType = CallLog.Calls.MISSED_TYPE;
            } else if ("rejected".equalsIgnoreCase(typeStr)) {
                callType = CallLog.Calls.REJECTED_TYPE;
            }
            values.put(CallLog.Calls.TYPE, callType);
            values.put(CallLog.Calls.NEW, 1);

            activity.getContentResolver().insert(CallLog.Calls.CONTENT_URI, values);
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
}
`;
    fs.writeFileSync(bridgePath, bridgeCode, 'utf8');
    console.log('Created AndroidNativeBridge.java with real hardware telemetry, cell info, and call log querying');

    // Update MainActivity.java to register AndroidNativeBridge
    let updatedMainActivity = fs.readFileSync(mainActivityPath, 'utf8');
    if (!updatedMainActivity.includes('AndroidNativeBridge')) {
      const importStatement = 'import android.os.Bundle;\nimport com.getcapacitor.BridgeActivity;\n';
      updatedMainActivity = updatedMainActivity.replace('import com.getcapacitor.BridgeActivity;', importStatement);

      const bridgeRegistration = `
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        try {
            if (this.bridge != null && this.bridge.getWebView() != null) {
                this.bridge.getWebView().addJavascriptInterface(new AndroidNativeBridge(this), "AndroidBridge");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
`;
      const classIndex = updatedMainActivity.indexOf('{');
      if (classIndex !== -1) {
        updatedMainActivity = updatedMainActivity.slice(0, classIndex + 1) + bridgeRegistration + updatedMainActivity.slice(classIndex + 1);
        fs.writeFileSync(mainActivityPath, updatedMainActivity, 'utf8');
        console.log('Successfully injected AndroidNativeBridge into MainActivity.java');
      }
    }
  }
} else {
  console.log('Android project directory not present yet (will run in CI during cap sync)');
}

console.log('Android configuration script completed successfully.');
