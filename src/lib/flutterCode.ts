import { FlutterCodeFile } from '../types';

export const FLUTTER_PROJECT_FILES: FlutterCodeFile[] = [
  {
    name: 'pubspec.yaml',
    path: 'pubspec.yaml',
    language: 'yaml',
    description: 'Flutter project dependencies configured for local SQLite, real call log reading, and Material 3 design.',
    code: `name: truecaller_local_simulator
description: "A Local-Only Caller ID and Status Simulator with Truecaller UI and SQLite shadow storage."
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter

  # Device Call Logs Reader
  call_log: ^4.0.0

  # Local Shadow SQLite Database
  sqflite: ^2.3.0

  # Filesystem Path Provider for SQLite Database
  path: ^1.8.3

  # Runtime Permission Handler for Android Phone & Call Log Permissions
  permission_handler: ^11.0.0

  # Date & Timestamp Formatting
  intl: ^0.19.0

  # Material Icons
  cupertino_icons: ^1.0.6

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true
`,
  },
  {
    name: 'AndroidManifest.xml',
    path: 'android/app/src/main/AndroidManifest.xml',
    language: 'xml',
    description: 'Android manifest with strict ZERO INTERNET permissions policy. Only local device call logs are accessed.',
    code: `<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.example.truecaller_local_simulator">

    <!-- 
      PRIVACY AUDIT VERIFICATION:
      - NO android.permission.INTERNET is requested.
      - NO android.permission.ACCESS_NETWORK_STATE is requested.
      - The app operates 100% locally and offline on device.
    -->

    <!-- Required solely for reading device call history locally -->
    <uses-permission android:name="android.permission.READ_CALL_LOG" />
    <uses-permission android:name="android.permission.READ_PHONE_STATE" />
    <uses-permission android:name="android.permission.READ_CONTACTS" />

    <application
        android:label="Truecaller Local"
        android:name="\${applicationName}"
        android:icon="@mipmap/ic_launcher"
        android:theme="@style/LaunchTheme">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTop"
            android:theme="@style/LaunchTheme"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|smallestScreenSize|locale|layoutDirection|fontScale|screenLayout|density|uiMode"
            android:hardwareAccelerated="true"
            android:windowSoftInputMode="adjustResize">
            
            <meta-data
              android:name="io.flutter.embedding.android.NormalTheme"
              android:resource="@style/NormalTheme" />
              
            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
        </activity>

        <meta-data
            android:name="flutterEmbedding"
            android:value="2" />
    </application>
</manifest>
`,
  },
  {
    name: 'main.dart',
    path: 'lib/main.dart',
    language: 'dart',
    description: 'Main entry point with Material 3 theme, Truecaller colors, Search bar, Recents call list, and Bottom Navigation.',
    code: `import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:call_log/call_log.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:intl/intl.dart';
import 'db/database_helper.dart';
import 'models/caller_profile.dart';
import 'screens/profile_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );
  runApp(const TrueLocalApp());
}

/// Signature Truecaller Color Palette
class TruecallerColors {
  static const Color primaryBlue = Color(0xFF0087FF);
  static const Color spamRed = Color(0xFFEB3349);
  static const Color availableGreen = Color(0xFF10B981);
  static const Color backgroundGrey = Color(0xFFF4F7F9);
  static const Color surfaceCard = Colors.white;
  static const Color textPrimary = Color(0xFF1E293B);
  static const Color textSecondary = Color(0xFF64748B);
  static const Color dividerColor = Color(0xFFE2E8F0);
}

class TrueLocalApp extends StatelessWidget {
  const TrueLocalApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Truecaller Local',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: TruecallerColors.primaryBlue,
          primary: TruecallerColors.primaryBlue,
          surface: TruecallerColors.surfaceCard,
        ),
        scaffoldBackgroundColor: Colors.white,
        fontFamily: 'Roboto',
      ),
      home: const MainNavigationScreen(),
    );
  }
}

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({Key? key}) : super(key: key);

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;
  List<CallLogEntry> _allLogs = [];
  List<CallLogEntry> _filteredLogs = [];
  Map<String, CallerProfile> _shadowSettings = {};
  bool _isLoading = true;
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchLogsAndOverrides();
  }

  Future<void> _fetchLogsAndOverrides() async {
    setState(() => _isLoading = true);

    // 1. Initialize SQLite Shadow Database
    await DatabaseHelper.instance.database;
    final overridesList = await DatabaseHelper.instance.getAllSettings();
    final Map<String, CallerProfile> overridesMap = {
      for (var item in overridesList) item.number: item,
    };

    // 2. Request Call Log Permissions
    var status = await Permission.phone.request();
    List<CallLogEntry> entries = [];

    if (status.isGranted) {
      try {
        final logsIterable = await CallLog.get();
        entries = logsIterable.toList();
      } catch (e) {
        debugPrint('Error fetching call logs: \$e');
      }
    }

    if (!mounted) return;
    setState(() {
      _allLogs = entries;
      _filteredLogs = entries;
      _shadowSettings = overridesMap;
      _isLoading = false;
    });
  }

  void _onSearchChanged(String query) {
    setState(() {
      _searchQuery = query;
      if (query.trim().isEmpty) {
        _filteredLogs = _allLogs;
      } else {
        final q = query.toLowerCase();
        _filteredLogs = _allLogs.where((log) {
          final nameMatch = (log.name ?? '').toLowerCase().contains(q);
          final numberMatch = (log.number ?? '').toLowerCase().contains(q);
          return nameMatch || numberMatch;
        }).toList();
      }
    });
  }

  void _openProfile(CallLogEntry entry) async {
    final updated = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (context) => ProfileScreen(
          entry: entry,
          initialProfile: _shadowSettings[entry.number ?? ''],
        ),
      ),
    );

    if (updated == true) {
      _fetchLogsAndOverrides();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(72),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                // Truecaller Styled Search Bar
                Expanded(
                  child: Container(
                    height: 48,
                    decoration: BoxDecoration(
                      color: TruecallerColors.backgroundGrey,
                      borderRadius: BorderRadius.circular(24),
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    child: Row(
                      children: [
                        const Icon(Icons.search, color: TruecallerColors.primaryBlue),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextField(
                            controller: _searchController,
                            onChanged: _onSearchChanged,
                            decoration: const InputDecoration(
                              hintText: 'Search numbers, names & more',
                              hintStyle: TextStyle(
                                color: TruecallerColors.textSecondary,
                                fontSize: 14,
                              ),
                              border: InputBorder.none,
                            ),
                          ),
                        ),
                        if (_searchQuery.isNotEmpty)
                          GestureDetector(
                            onTap: () {
                              _searchController.clear();
                              _onSearchChanged('');
                            },
                            child: const Icon(Icons.close, size: 18, color: Colors.grey),
                          ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                // Truecaller Profile Circle Avatar
                Container(
                  width: 40,
                  height: 40,
                  decoration: const BoxDecoration(
                    color: Color(0xFFF59E0B),
                    shape: BoxShape.circle,
                  ),
                  child: const Center(
                    child: Text(
                      'YOU',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      body: _buildCurrentTab(),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (idx) => setState(() => _currentIndex = idx),
        indicatorColor: TruecallerColors.primaryBlue.withOpacity(0.15),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.call_outlined),
            selectedIcon: Icon(Icons.call, color: TruecallerColors.primaryBlue),
            label: 'Calls',
          ),
          NavigationDestination(
            icon: Icon(Icons.message_outlined),
            selectedIcon: Icon(Icons.message, color: TruecallerColors.primaryBlue),
            label: 'Messages',
          ),
          NavigationDestination(
            icon: Icon(Icons.contacts_outlined),
            selectedIcon: Icon(Icons.contacts, color: TruecallerColors.primaryBlue),
            label: 'Contacts',
          ),
          NavigationDestination(
            icon: Icon(Icons.language_outlined),
            selectedIcon: Icon(Icons.language, color: TruecallerColors.primaryBlue),
            label: 'OSINT',
          ),
        ],
      ),
    );
  }

  Widget _buildCurrentTab() {
    if (_currentIndex == 0) {
      return _buildCallsList();
    } else if (_currentIndex == 1) {
      return const MessagesComingSoonScreen();
    } else if (_currentIndex == 2) {
      return const Center(
        child: Text('Device Phonebook Contacts', style: TextStyle(color: TruecallerColors.textSecondary)),
      );
    } else {
      return const OsintScreen();
    }
  }

  Widget _buildCallsList() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: TruecallerColors.primaryBlue));
    }

    if (_filteredLogs.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.phone_missed, size: 64, color: Colors.grey.shade400),
            const SizedBox(height: 12),
            const Text(
              'No Call Logs Found',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 4),
            const Text(
              'Ensure Call Log permission is granted on Android.',
              style: TextStyle(color: TruecallerColors.textSecondary, fontSize: 13),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _fetchLogsAndOverrides,
      color: TruecallerColors.primaryBlue,
      child: ListView.separated(
        itemCount: _filteredLogs.length,
        separatorBuilder: (_, __) => const Divider(
          height: 1,
          color: TruecallerColors.dividerColor,
          indent: 72,
        ),
        itemBuilder: (context, index) {
          final entry = _filteredLogs[index];
          final rawNumber = entry.number ?? 'Unknown';
          final profile = _shadowSettings[rawNumber];
          final isBusy = profile != null && profile.isBusy;
          final isVerified = profile != null && profile.isVerified;
          final displayName = profile?.customName ?? entry.name ?? rawNumber;

          // Format time
          String formattedTime = '';
          if (entry.timestamp != null) {
            final dt = DateTime.fromMillisecondsSinceEpoch(entry.timestamp!);
            formattedTime = DateFormat('jm').format(dt);
          }

          return ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            leading: Stack(
              children: [
                CircleAvatar(
                  radius: 22,
                  backgroundColor: isBusy ? TruecallerColors.spamRed : TruecallerColors.primaryBlue,
                  child: Text(
                    displayName.isNotEmpty ? displayName.substring(0, 1).toUpperCase() : '?',
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                ),
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: Container(
                    width: 13,
                    height: 13,
                    decoration: BoxDecoration(
                      color: isBusy ? TruecallerColors.spamRed : TruecallerColors.availableGreen,
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 2),
                    ),
                  ),
                ),
              ],
            ),
            title: Row(
              children: [
                Flexible(
                  child: Text(
                    displayName,
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 15,
                      color: isBusy ? TruecallerColors.spamRed : TruecallerColors.textPrimary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                if (isVerified) ...[
                  const SizedBox(width: 4),
                  const Icon(Icons.verified, size: 16, color: TruecallerColors.primaryBlue),
                ],
              ],
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 2),
                if (isBusy)
                  Text(
                    'On a call with \${profile.talkingTo.isNotEmpty ? profile.talkingTo : "someone else"}',
                    style: const TextStyle(
                      color: TruecallerColors.spamRed,
                      fontWeight: FontWeight.w500,
                      fontSize: 13,
                    ),
                  )
                else
                  Text(
                    'Available • \$formattedTime',
                    style: const TextStyle(
                      color: TruecallerColors.textSecondary,
                      fontSize: 13,
                    ),
                  ),
              ],
            ),
            trailing: IconButton(
              icon: const Icon(Icons.info_outline, color: TruecallerColors.textSecondary),
              onPressed: () => _openProfile(entry),
            ),
            onTap: () => _openProfile(entry),
          );
        },
      ),
    );
  }
}

/// Messages Coming Soon Tab adhering to Material 3 and Truecaller visual aesthetic
class MessagesComingSoonScreen extends StatelessWidget {
  const MessagesComingSoonScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 88,
              height: 88,
              decoration: BoxDecoration(
                color: TruecallerColors.primaryBlue.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.mark_chat_unread_outlined,
                size: 42,
                color: TruecallerColors.primaryBlue,
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Messages Coming Soon!',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: TruecallerColors.textPrimary,
                letterSpacing: -0.3,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 10),
            const Text(
              'Local spam filtering and smart categorization for SMS will be available here without any cloud transmission.',
              style: TextStyle(
                fontSize: 14,
                color: TruecallerColors.textSecondary,
                height: 1.45,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 28),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: TruecallerColors.backgroundGrey,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: TruecallerColors.dividerColor),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: const [
                  Icon(Icons.shield_outlined, size: 18, color: TruecallerColors.primaryBlue),
                  SizedBox(width: 8),
                  Text(
                    '100% Offline & Private',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: TruecallerColors.textPrimary,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// OSINT Intelligence Tab requested with internet logo and Access from OSINT headline
class OsintScreen extends StatelessWidget {
  const OsintScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 90,
              height: 90,
              decoration: BoxDecoration(
                color: TruecallerColors.primaryBlue.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.language,
                size: 46,
                color: TruecallerColors.primaryBlue,
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Access from OSINT',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: TruecallerColors.textPrimary,
                letterSpacing: -0.3,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 10),
            const Text(
              'Open Source Intelligence lookup gateway for verified caller directory identification.',
              style: TextStyle(
                fontSize: 14,
                color: TruecallerColors.textSecondary,
                height: 1.45,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: TruecallerColors.backgroundGrey,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: TruecallerColors.dividerColor),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: const [
                  Icon(Icons.lock_outline, size: 18, color: TruecallerColors.primaryBlue),
                  SizedBox(width: 8),
                  Text(
                    'OSINT Intelligence Gateway',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: TruecallerColors.textPrimary,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
`,
  },
  {
    name: 'database_helper.dart',
    path: 'lib/db/database_helper.dart',
    language: 'dart',
    description: 'Local SQLite helper implementing local shadow storage for manual statuses and overrides.',
    code: `import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import '../models/caller_profile.dart';

class DatabaseHelper {
  static const _databaseName = "true_local_shadow.db";
  static const _databaseVersion = 1;

  static const tableSettings = 'settings';
  static const columnNumber = 'number';
  static const columnIsBusy = 'is_busy';
  static const columnTalkingTo = 'talking_to';
  static const columnIsVerified = 'is_verified';
  static const columnCustomName = 'custom_name';
  static const columnUpdatedAt = 'updated_at';

  DatabaseHelper._privateConstructor();
  static final DatabaseHelper instance = DatabaseHelper._privateConstructor();

  static Database? _database;

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  Future<Database> _initDatabase() async {
    final databasesPath = await getDatabasesPath();
    final path = join(databasesPath, _databaseName);

    return await openDatabase(
      path,
      version: _databaseVersion,
      onCreate: _onCreate,
    );
  }

  Future _onCreate(Database db, int version) async {
    await db.execute('''
      CREATE TABLE \$tableSettings (
        \$columnNumber TEXT PRIMARY KEY,
        \$columnIsBusy INTEGER NOT NULL,
        \$columnTalkingTo TEXT,
        \$columnIsVerified INTEGER NOT NULL,
        \$columnCustomName TEXT,
        \$columnUpdatedAt INTEGER
      )
    ''');
  }

  /// Insert or replace a manual override row
  Future<int> upsertSetting(CallerProfile profile) async {
    final db = await database;
    return await db.insert(
      tableSettings,
      profile.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  /// Get single manual override by phone number
  Future<CallerProfile?> getSetting(String number) async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query(
      tableSettings,
      where: '\$columnNumber = ?',
      whereArgs: [number],
    );

    if (maps.isNotEmpty) {
      return CallerProfile.fromMap(maps.first);
    }
    return null;
  }

  /// Get all manual overrides
  Future<List<CallerProfile>> getAllSettings() async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query(tableSettings);
    return List.generate(maps.length, (i) => CallerProfile.fromMap(maps[i]));
  }

  /// Delete a manual override
  Future<int> deleteSetting(String number) async {
    final db = await database;
    return await db.delete(
      tableSettings,
      where: '\$columnNumber = ?',
      whereArgs: [number],
    );
  }
}
`,
  },
  {
    name: 'caller_profile.dart',
    path: 'lib/models/caller_profile.dart',
    language: 'dart',
    description: 'Data model mapping to SQLite columns: number, is_busy, talking_to, is_verified, and custom_name.',
    code: `class CallerProfile {
  final String number;
  final bool isBusy;
  final String talkingTo;
  final bool isVerified;
  final String? customName;
  final int updatedAt;

  CallerProfile({
    required this.number,
    this.isBusy = false,
    this.talkingTo = '',
    this.isVerified = false,
    this.customName,
    int? updatedAt,
  }) : updatedAt = updatedAt ?? DateTime.now().millisecondsSinceEpoch;

  Map<String, dynamic> toMap() {
    return {
      'number': number,
      'is_busy': isBusy ? 1 : 0,
      'talking_to': talkingTo,
      'is_verified': isVerified ? 1 : 0,
      'custom_name': customName,
      'updated_at': updatedAt,
    };
  }

  factory CallerProfile.fromMap(Map<String, dynamic> map) {
    return CallerProfile(
      number: map['number'] as String,
      isBusy: (map['is_busy'] as int) == 1,
      talkingTo: (map['talking_to'] as String?) ?? '',
      isVerified: (map['is_verified'] as int) == 1,
      customName: map['custom_name'] as String?,
      updatedAt: map['updated_at'] as int? ?? DateTime.now().millisecondsSinceEpoch,
    );
  }

  CallerProfile copyWith({
    String? number,
    bool? isBusy,
    String? talkingTo,
    bool? isVerified,
    String? customName,
    int? updatedAt,
  }) {
    return CallerProfile(
      number: number ?? this.number,
      isBusy: isBusy ?? this.isBusy,
      talkingTo: talkingTo ?? this.talkingTo,
      isVerified: isVerified ?? this.isVerified,
      customName: customName ?? this.customName,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
`,
  },
  {
    name: 'profile_screen.dart',
    path: 'lib/screens/profile_screen.dart',
    language: 'dart',
    description: 'Profile Detail screen with Material 3 components, Availability toggle, dynamic "Talking to" field, and Verified badge.',
    code: `import 'package:flutter/material.dart';
import 'package:call_log/call_log.dart';
import '../db/database_helper.dart';
import '../models/caller_profile.dart';

class ProfileScreen extends StatefulWidget {
  final CallLogEntry entry;
  final CallerProfile? initialProfile;

  const ProfileScreen({
    Key? key,
    required this.entry,
    this.initialProfile,
  }) : super(key: key);

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  static const Color primaryBlue = Color(0xFF0087FF);
  static const Color spamRed = Color(0xFFEB3349);
  static const Color backgroundGrey = Color(0xFFF4F7F9);

  bool _isBusy = false;
  bool _isVerified = false;
  late TextEditingController _talkingToController;
  late TextEditingController _customNameController;

  @override
  void initState() {
    super.initState();
    final p = widget.initialProfile;
    _isBusy = p?.isBusy ?? false;
    _isVerified = p?.isVerified ?? false;
    _talkingToController = TextEditingController(text: p?.talkingTo ?? '');
    _customNameController = TextEditingController(text: p?.customName ?? widget.entry.name ?? '');
  }

  @override
  void dispose() {
    _talkingToController.dispose();
    _customNameController.dispose();
    super.dispose();
  }

  Future<void> _saveOverrides() async {
    final number = widget.entry.number ?? 'Unknown';
    final profile = CallerProfile(
      number: number,
      isBusy: _isBusy,
      talkingTo: _isBusy ? _talkingToController.text.trim() : '',
      isVerified: _isVerified,
      customName: _customNameController.text.trim().isEmpty ? null : _customNameController.text.trim(),
    );

    await DatabaseHelper.instance.upsertSetting(profile);

    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Saved to Local SQLite Shadow Database'),
        backgroundColor: primaryBlue,
        behavior: SnackBarBehavior.floating,
      ),
    );
    Navigator.pop(context, true);
  }

  @override
  Widget build(BuildContext context) {
    final rawNumber = widget.entry.number ?? 'Unknown';
    final currentTitle = _customNameController.text.isNotEmpty 
        ? _customNameController.text 
        : (widget.entry.name ?? rawNumber);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Profile Details', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        elevation: 0,
        leading: const BackButton(color: Colors.black),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert, color: Colors.black),
            onSelected: (val) {
              if (val == 'edit') {
                _showEditStatusSheet();
              }
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'edit',
                child: Row(
                  children: [
                    Icon(Icons.edit_outlined, size: 18, color: TruecallerColors.primaryBlue),
                    SizedBox(width: 8),
                    Text('Edit Status & Info'),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            const SizedBox(height: 24),
            // Avatar with verified badge indicator
            Center(
              child: Stack(
                children: [
                  CircleAvatar(
                    radius: 52,
                    backgroundColor: _isBusy ? spamRed : primaryBlue,
                    child: Text(
                      currentTitle.isNotEmpty ? currentTitle.substring(0, 1).toUpperCase() : '?',
                      style: const TextStyle(fontSize: 42, color: Colors.white, fontWeight: FontWeight.bold),
                    ),
                  ),
                  if (_isVerified)
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: const BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.verified, color: primaryBlue, size: 28),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  currentTitle,
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                ),
                if (_isVerified) ...[
                  const SizedBox(width: 6),
                  const Icon(Icons.verified, color: primaryBlue, size: 20),
                ],
              ],
            ),
            Text(
              rawNumber,
              style: const TextStyle(color: Colors.grey, fontSize: 15),
            ),
            const SizedBox(height: 4),
            Text(
              _isBusy ? 'In a Call with \${_talkingToController.text}' : 'Available',
              style: TextStyle(
                color: _isBusy ? spamRed : Colors.green.shade700,
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),

            const SizedBox(height: 20),
            // Action Buttons: Call, Message, Block / Unblock
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _buildActionIcon(Icons.call, 'Call', primaryBlue),
                const SizedBox(width: 24),
                _buildActionIcon(Icons.message, 'Message', const Color(0xFF10B981)),
                const SizedBox(width: 24),
                _buildActionIcon(Icons.block, 'Block', spamRed),
              ],
            ),

            const SizedBox(height: 24),
            const Divider(thickness: 8, color: backgroundGrey),
            const SizedBox(height: 16),

            // CALL HISTORY WITH THIS CONTACT
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: const [
                      Icon(Icons.history, size: 18, color: primaryBlue),
                      SizedBox(width: 8),
                      Text(
                        'CALL HISTORY WITH CONTACT',
                        style: TextStyle(
                          color: Color(0xFF475569),
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.8,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: const CircleAvatar(
                      backgroundColor: backgroundGrey,
                      child: Icon(Icons.call_received, color: primaryBlue, size: 18),
                    ),
                    title: const Text('Incoming Call', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                    subtitle: const Text('Today, 2:15 PM • SIM 1 (Active)', style: TextStyle(fontSize: 12)),
                    trailing: const Text('2m 25s', style: TextStyle(color: Colors.grey, fontSize: 12)),
                  ),
                  const Divider(color: backgroundGrey),
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: CircleAvatar(
                      backgroundColor: Colors.red.shade50,
                      child: const Icon(Icons.call_missed, color: spamRed, size: 18),
                    ),
                    title: const Text('Missed Call', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                    subtitle: const Text('Yesterday, 6:40 PM • SIM 1 (Active)', style: TextStyle(fontSize: 12)),
                    trailing: const Text('0s', style: TextStyle(color: Colors.grey, fontSize: 12)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showEditStatusSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Edit Status & Overrides', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              SwitchListTile(
                title: const Text("Set Status to 'In a Call' (Red)"),
                value: _isBusy,
                onChanged: (v) {
                  setState(() => _isBusy = v);
                  setSheetState(() {});
                },
                activeColor: spamRed,
                contentPadding: EdgeInsets.zero,
              ),
              if (_isBusy) ...[
                TextField(
                  controller: _talkingToController,
                  decoration: const InputDecoration(
                    labelText: 'Who are they talking to?',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),
              ],
              SwitchListTile(
                title: const Text('Verified Profile Checkmark'),
                value: _isVerified,
                onChanged: (v) {
                  setState(() => _isVerified = v);
                  setSheetState(() {});
                },
                activeColor: primaryBlue,
                contentPadding: EdgeInsets.zero,
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: primaryBlue),
                  onPressed: () {
                    _saveOverrides();
                    Navigator.pop(ctx);
                  },
                  child: const Text('Apply Changes', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildActionIcon(IconData icon, String label, Color color) {
    return Column(
      children: [
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: color.withOpacity(0.12),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: color, size: 24),
        ),
        const SizedBox(height: 6),
        Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
      ],
    );
  }
}
`,
  },
  {
    name: 'README_LOCAL_OFFLINE.md',
    path: 'README_LOCAL_OFFLINE.md',
    language: 'markdown',
    description: 'Architecture documentation explaining the offline local SQLite shadow database and privacy guarantees.',
    code: `# Truecaller Local Caller ID & Status Simulator

A Flutter Android application built with Material 3 that mimics Truecaller's signature UI while operating completely offline with zero internet access.

## Key Design Principles

1. **100% Offline & Private:**
   - \`AndroidManifest.xml\` omits \`android.permission.INTERNET\`.
   - The OS hardware cannot transmit any telemetry, numbers, or logs to remote servers.

2. **Real Call Log Integration:**
   - Reads the Android device's native SQLite call history via the \`call_log\` package.
   - Requires runtime \`Permission.phone\` approval on first launch.

3. **Shadow SQLite Database (\`sqflite\`):**
   - The database file \`true_local_shadow.db\` stores manual overrides mapped to phone numbers.
   - Overrides include:
     - \`is_busy\` (INTEGER 1/0): Toggles red "In a Call" state vs green "Available" state.
     - \`talking_to\` (TEXT): Shows the custom target the contact is in a call with.
     - \`is_verified\` (INTEGER 1/0): Displays Truecaller's signature blue verified tick badge.
     - \`custom_name\` (TEXT): Local override for contact name.

## Running on Android

\`\`\`bash
# 1. Install dependencies
flutter pub get

# 2. Connect an Android device or launch emulator
flutter devices

# 3. Run the application
flutter run
\`\`\`
`,
  },
  {
    name: 'build_apk.yml',
    path: '.github/workflows/build_apk.yml',
    language: 'yaml',
    description: 'Free automated GitHub Actions workflow to build release APK without installing Flutter or Android Studio locally.',
    code: `name: Build Release APK

on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  build:
    name: Build Android APK
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Java JDK
        uses: actions/setup-java@v4
        with:
          distribution: 'zulu'
          java-version: '17'

      - name: Setup Flutter SDK
        uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.22.x'
          channel: 'stable'
          cache: true

      - name: Get Dependencies
        run: flutter pub get

      - name: Build Release APK
        run: flutter build apk --release

      - name: Upload APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: truecaller-local-release-apk
          path: build/app/outputs/flutter-apk/app-release.apk
`,
  },
];
