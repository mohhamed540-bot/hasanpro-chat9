// Client-side automatic country & flag detection based on Timezone & Locale

export interface DetectedCountry {
  flag: string;
  name: string;
  code: string;
}

export function detectRealCountry(): DetectedCountry {
  try {
    const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || '').toLowerCase();
    const lang = (navigator.language || '').toLowerCase();

    // 1. Timezone-based exact detection
    if (tz.includes('riyadh')) return { flag: '🇸🇦', name: 'المملكة العربية السعودية', code: 'SA' };
    if (tz.includes('cairo')) return { flag: '🇪🇬', name: 'جمهورية مصر العربية', code: 'EG' };
    if (tz.includes('baghdad')) return { flag: '🇮🇶', name: 'جمهورية العراق', code: 'IQ' };
    if (tz.includes('damascus')) return { flag: '🇸🇾', name: 'الجمهورية العربية السورية', code: 'SY' };
    if (tz.includes('aden') || tz.includes('sanaa')) return { flag: '🇾🇪', name: 'الجمهورية اليمنية', code: 'YE' };
    if (tz.includes('kuwait')) return { flag: '🇰🇼', name: 'دولة الكويت', code: 'KW' };
    if (tz.includes('dubai') || tz.includes('abu_dhabi')) return { flag: '🇦🇪', name: 'الإمارات العربية المتحدة', code: 'AE' };
    if (tz.includes('algiers')) return { flag: '🇩🇿', name: 'الجمهورية الجزائرية', code: 'DZ' };
    if (tz.includes('casablanca')) return { flag: '🇲🇦', name: 'المملكة المغربية', code: 'MA' };
    if (tz.includes('amman')) return { flag: '🇯🇴', name: 'المملكة الأردنية الهاشمية', code: 'JO' };
    if (tz.includes('muscat')) return { flag: '🇴🇲', name: 'سلطنة عمان', code: 'OM' };
    if (tz.includes('qatar')) return { flag: '🇶🇦', name: 'دولة قطر', code: 'QA' };
    if (tz.includes('bahrain')) return { flag: '🇧🇭', name: 'مملكة البحرين', code: 'BH' };
    if (tz.includes('tunis')) return { flag: '🇹🇳', name: 'الجمهورية التونسية', code: 'TN' };
    if (tz.includes('tripoli')) return { flag: '🇱🇾', name: 'دولة ليبيا', code: 'LY' };
    if (tz.includes('khartoum')) return { flag: '🇸🇩', name: 'جمهورية السودان', code: 'SD' };
    if (tz.includes('beirut')) return { flag: '🇱🇧', name: 'الجمهورية اللبنانية', code: 'LB' };
    if (tz.includes('gaza') || tz.includes('hebron') || tz.includes('jerusalem')) return { flag: '🇵🇸', name: 'دولة فلسطين', code: 'PS' };
    if (tz.includes('london')) return { flag: '🇬🇧', name: 'المملكة المتحدة', code: 'GB' };
    if (tz.includes('new_york') || tz.includes('chicago') || tz.includes('los_angeles')) return { flag: '🇺🇸', name: 'الولايات المتحدة الأمريكية', code: 'US' };
    if (tz.includes('toronto') || tz.includes('vancouver')) return { flag: '🇨🇦', name: 'كندا', code: 'CA' };
    if (tz.includes('istanbul')) return { flag: '🇹🇷', name: 'تركيا', code: 'TR' };
    if (tz.includes('berlin')) return { flag: '🇩🇪', name: 'ألمانيا', code: 'DE' };
    if (tz.includes('paris')) return { flag: '🇫🇷', name: 'فرنسا', code: 'FR' };

    // 2. Language/Locale match
    if (lang.includes('sa')) return { flag: '🇸🇦', name: 'المملكة العربية السعودية', code: 'SA' };
    if (lang.includes('eg')) return { flag: '🇪🇬', name: 'مصر', code: 'EG' };
    if (lang.includes('iq')) return { flag: '🇮🇶', name: 'العراق', code: 'IQ' };
    if (lang.includes('sy')) return { flag: '🇸🇾', name: 'سوريا', code: 'SY' };
    if (lang.includes('ye')) return { flag: '🇾🇪', name: 'اليمن', code: 'YE' };
    if (lang.includes('kw')) return { flag: '🇰🇼', name: 'الكويت', code: 'KW' };
    if (lang.includes('ae')) return { flag: '🇦🇪', name: 'الإمارات', code: 'AE' };
    if (lang.includes('dz')) return { flag: '🇩🇿', name: 'الجزائر', code: 'DZ' };
    if (lang.includes('ma')) return { flag: '🇲🇦', name: 'المغرب', code: 'MA' };
    if (lang.includes('jo')) return { flag: '🇯🇴', name: 'الأردن', code: 'JO' };
    if (lang.includes('om')) return { flag: '🇴🇲', name: 'عمان', code: 'OM' };
    if (lang.includes('qa')) return { flag: '🇶🇦', name: 'قطر', code: 'QA' };
    if (lang.includes('bh')) return { flag: '🇧🇭', name: 'البحرين', code: 'BH' };
    if (lang.includes('tn')) return { flag: '🇹🇳', name: 'تونس', code: 'TN' };
    if (lang.includes('ly')) return { flag: '🇱🇾', name: 'ليبيا', code: 'LY' };
    if (lang.includes('sd')) return { flag: '🇸🇩', name: 'السودان', code: 'SD' };
    if (lang.includes('lb')) return { flag: '🇱🇧', name: 'لبنان', code: 'LB' };

    return { flag: '🇸🇦', name: 'المملكة العربية السعودية', code: 'SA' };
  } catch {
    return { flag: '🇸🇦', name: 'المملكة العربية السعودية', code: 'SA' };
  }
}

// Arabic country name resolver from flag
export function getCountryNameFromFlag(flag?: string): string {
  if (!flag) return '';
  const clean = flag.trim();
  const map: Record<string, string> = {
    '🇸🇦': 'السعودية',
    '🇪🇬': 'مصر',
    '🇾🇪': 'اليمن',
    '🇮🇶': 'العراق',
    '🇸🇾': 'سوريا',
    '🇩🇿': 'الجزائر',
    '🇲🇦': 'المغرب',
    '🇦🇪': 'الإمارات',
    '🇰🇼': 'الكويت',
    '🇯🇴': 'الأردن',
    '🇴🇲': 'عمان',
    '🇶🇦': 'قطر',
    '🇧🇭': 'البحرين',
    '🇹🇳': 'تونس',
    '🇱🇾': 'ليبيا',
    '🇸🇩': 'السودان',
    '🇱🇧': 'لبنان',
    '🇵🇸': 'فلسطين',
    '🇹🇷': 'تركيا',
    '🇬🇧': 'بريطانيا',
    '🇺🇸': 'أمريكا',
    '🇩🇪': 'ألمانيا',
    '🇫🇷': 'فرنسا',
    '🇨🇦': 'كندا',
    '👑': 'الإدارة',
    '🦅': 'الصقور',
    '⭐': 'VIP'
  };
  return map[clean] || '';
}

// Generate unique device/phone hardware fingerprint (بصمة الهاتف والجهاز)
export function generateDeviceFingerprint(): {
  fingerprintId: string;
  hardwareString: string;
  osType: string;
} {
  try {
    let savedFp = localStorage.getItem('soqoor_phone_fp_id');
    const ua = navigator.userAgent || '';
    const screenRes = `${window.screen?.width || 360}x${window.screen?.height || 640}@${window.screen?.colorDepth || 24}`;
    const touchPoints = navigator.maxTouchPoints || 0;
    const memory = (navigator as any).deviceMemory || 'auto';
    const cores = navigator.hardwareConcurrency || 4;
    const platform = navigator.platform || 'Linux/ARM';
    const lang = navigator.language || 'ar';
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Riyadh';

    let osType = 'هاتف ذكي';
    const lowerUa = ua.toLowerCase();
    if (lowerUa.includes('iphone')) osType = 'iPhone (iOS)';
    else if (lowerUa.includes('ipad')) osType = 'iPad (iPadOS)';
    else if (lowerUa.includes('samsung')) osType = 'Samsung Galaxy (Android)';
    else if (lowerUa.includes('xiaomi') || lowerUa.includes('redmi')) osType = 'Xiaomi (Android)';
    else if (lowerUa.includes('huawei') || lowerUa.includes('honor')) osType = 'Huawei (Android)';
    else if (lowerUa.includes('android')) osType = 'هاتف أندرويد (Android)';
    else if (lowerUa.includes('windows')) osType = 'كمبيوتر (Windows)';
    else if (lowerUa.includes('mac')) osType = 'ماك (Macintosh)';
    else if (lowerUa.includes('linux')) osType = 'لينكس (Linux)';

    if (!savedFp) {
      // Deterministic hash based on hardware parameters
      const seedStr = `${screenRes}-${touchPoints}-${cores}-${memory}-${platform}-${lang}-${tz}-${ua.slice(0, 40)}`;
      let hash = 0;
      for (let i = 0; i < seedStr.length; i++) {
        hash = (hash << 5) - hash + seedStr.charCodeAt(i);
        hash |= 0;
      }
      const hexPart = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
      const randomTail = Math.random().toString(36).substring(2, 6).toUpperCase();
      savedFp = `FP-${hexPart.slice(0, 4)}-${hexPart.slice(4, 8)}-${randomTail}`;
      localStorage.setItem('soqoor_phone_fp_id', savedFp);
    }

    const hardwareString = `${osType} • الشاشة: ${screenRes} • اللمس: ${touchPoints > 0 ? 'نعم' : 'لا'} • معالج: ${cores} نوى`;
    return {
      fingerprintId: savedFp,
      hardwareString,
      osType
    };
  } catch {
    const fallback = 'FP-DEV-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    return {
      fingerprintId: fallback,
      hardwareString: 'هاتف ذكي',
      osType: 'هاتف ذكي'
    };
  }
}
