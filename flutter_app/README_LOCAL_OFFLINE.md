# Truecaller Local Caller ID & Status Simulator

A Flutter Android application built with Material 3 that mimics Truecaller's signature UI while operating completely offline with zero internet access.

## Key Design Principles

1. **100% Offline & Private:**
   - `AndroidManifest.xml` omits `android.permission.INTERNET`.
   - The OS hardware cannot transmit any telemetry, numbers, or logs to remote servers.

2. **Real Call Log Integration:**
   - Reads the Android device's native SQLite call history via the `call_log` package.
   - Requires runtime `Permission.phone` approval on first launch.

3. **Shadow SQLite Database (`sqflite`):**
   - The database file `true_local_shadow.db` stores manual overrides mapped to phone numbers.
   - Overrides include:
     - `is_busy` (INTEGER 1/0): Toggles red "In a Call" state vs green "Available" state.
     - `talking_to` (TEXT): Shows the custom target the contact is in a call with.
     - `is_verified` (INTEGER 1/0): Displays Truecaller's signature blue verified tick badge.
     - `custom_name` (TEXT): Local override for contact name.

## Running on Android

```bash
# 1. Install dependencies
flutter pub get

# 2. Connect an Android device or launch emulator
flutter devices

# 3. Run the application
flutter run
```
