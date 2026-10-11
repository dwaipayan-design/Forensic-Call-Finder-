class CallerProfile {
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
