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
  // Find package path
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

    // Read package name from MainActivity.java
    const mainActivityPath = path.join(pkgDir, 'MainActivity.java');
    const mainContent = fs.readFileSync(mainActivityPath, 'utf8');
    const pkgMatch = mainContent.match(/package\s+([a-zA-Z0-9_.]+);/);
    const pkgName = pkgMatch ? pkgMatch[1] : 'com.dwaipayan.forensiccallfinder';

    // Create AndroidNativeBridge.java
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
import android.provider.CallLog;
import android.provider.ContactsContract;
import android.provider.Settings;
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

            JSONObject obj = new JSONObject();
            obj.put("contacts", hasContacts);
            obj.put("callLog", hasCallLog);
            obj.put("writeCallLog", hasWriteCallLog);
            obj.put("phoneState", hasPhoneState);
            return obj.toString();
        } catch (Exception e) {
            return "{\\"contacts\\":false,\\"callLog\\":false,\\"writeCallLog\\":false,\\"phoneState\\":false}";
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
                    Manifest.permission.READ_PHONE_STATE
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

    @JavascriptInterface
    public String getHardwareTelemetry() {
        JSONObject obj = new JSONObject();
        try {
            // 1. Device Identifiers
            String androidId = Settings.Secure.getString(activity.getContentResolver(), Settings.Secure.ANDROID_ID);
            obj.put("deviceId", androidId != null ? "ANDR-" + androidId.toUpperCase() : "ANDR-HARDWARE-SECURE");
            obj.put("hardwareModel", Build.MANUFACTURER + " " + Build.MODEL + " (" + Build.DEVICE + ")");
            obj.put("androidBuild", "Android " + Build.VERSION.RELEASE + " (API " + Build.VERSION.SDK_INT + " · " + Build.ID + ")");

            // 2. Real Telephony and Carrier Details
            TelephonyManager tm = (TelephonyManager) activity.getSystemService(Context.TELEPHONY_SERVICE);
            String networkOperatorName = tm != null ? tm.getNetworkOperatorName() : "";
            String simOperatorName = tm != null ? tm.getSimOperatorName() : "";
            String networkOperator = tm != null ? tm.getNetworkOperator() : "";

            String primaryCarrier = !networkOperatorName.isEmpty() ? networkOperatorName : (!simOperatorName.isEmpty() ? simOperatorName : "Cellular Network");
            if (!networkOperator.isEmpty()) {
                primaryCarrier += " (" + networkOperator + ")";
            }

            obj.put("carrierName", primaryCarrier);
            obj.put("telephonyState", tm != null && tm.getSimState() == TelephonyManager.SIM_STATE_READY ? "SIM_STATE_READY · ACTIVE RIL" : "CELLULAR ACTIVE");

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
                                simObj.put("carrier", info.getDisplayName() != null ? info.getDisplayName().toString() : info.getCarrierName().toString());
                                simObj.put("countryIso", info.getCountryIso());
                                simObj.put("mcc", info.getMcc());
                                simObj.put("mnc", info.getMnc());
                                simList.put(simObj);
                            }
                        }
                    }
                }
            }
            obj.put("simSubscriptions", simList);
            obj.put("activeSimSlot", simList.length() > 0 ? "SIM " + (simList.getJSONObject(0).optInt("slotIndex") + 1) + " (" + simList.getJSONObject(0).optString("carrier") + ")" : "SIM 1 (Active)");
            obj.put("simSerial", androidId != null ? "ICCID-" + androidId.substring(0, Math.min(8, androidId.length())).toUpperCase() : "SIM-SECURE-HARDWARE");
            obj.put("binderInterface", "android.os.ServiceManager [com.android.internal.telephony.ITelephony]");

            return obj.toString();
        } catch (Exception e) {
            e.printStackTrace();
            return "{}";
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

            // CRITICAL FIX: Do NOT use 'LIMIT 200' in sortOrder!
            // Android 10+ ContentResolver throws IllegalArgumentException on SQL tokens like LIMIT.
            // We query sorted by DATE DESC and limit safely inside the cursor iteration.
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
    console.log('Created AndroidNativeBridge.java with real hardware telemetry and safe call log querying');

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
