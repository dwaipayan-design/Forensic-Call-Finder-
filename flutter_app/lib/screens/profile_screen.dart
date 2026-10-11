import 'package:flutter/material.dart';
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
              _isBusy ? 'In a Call with ${_talkingToController.text}' : 'Available',
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
                    subtitle: const Text('Today, 2:15 PM • SIM 1 (Jio)', style: TextStyle(fontSize: 12)),
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
                    subtitle: const Text('Yesterday, 6:40 PM • SIM 1 (Jio)', style: TextStyle(fontSize: 12)),
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
