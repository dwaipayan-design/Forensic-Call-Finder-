import 'package:flutter/material.dart';
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
        debugPrint('Error fetching call logs: $e');
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
                    'On a call with ${profile.talkingTo.isNotEmpty ? profile.talkingTo : "someone else"}',
                    style: const TextStyle(
                      color: TruecallerColors.spamRed,
                      fontWeight: FontWeight.w500,
                      fontSize: 13,
                    ),
                  )
                else
                  Text(
                    'Available • $formattedTime',
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
