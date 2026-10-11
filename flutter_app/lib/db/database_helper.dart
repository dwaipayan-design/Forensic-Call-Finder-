import 'package:sqflite/sqflite.dart';
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
      CREATE TABLE $tableSettings (
        $columnNumber TEXT PRIMARY KEY,
        $columnIsBusy INTEGER NOT NULL,
        $columnTalkingTo TEXT,
        $columnIsVerified INTEGER NOT NULL,
        $columnCustomName TEXT,
        $columnUpdatedAt INTEGER
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
      where: '$columnNumber = ?',
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
      where: '$columnNumber = ?',
      whereArgs: [number],
    );
  }
}
