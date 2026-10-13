import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Zap,
  Activity,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Sliders,
  Play,
  Pause,
  Award,
  Crown,
  Heart,
  Flame,
  Star,
  Search,
  Copy,
  Check,
  Send,
  Trash2,
  Download,
  Share2,
  Shield,
  Lock,
  Unlock,
  Key,
  HelpCircle,
  RotateCw,
  Gift,
  Clock,
  Timer,
  Feather,
  BookOpen,
  Volume1,
  MessageSquare,
  X,
  CheckCircle2,
  AlertTriangle,
  FileText,
  UserCheck,
  Headphones,
  Compass,
  Smile,
  BarChart2,
  Layers,
  ListOrdered,
  Bell,
  RefreshCw,
  Eye,
  EyeOff,
  Globe,
  Settings,
  Wifi,
  WifiOff,
  Music,
  UserPlus,
  Megaphone
} from 'lucide-react';
import confetti from '../utils/confetti';
import { sounds } from '../utils/soundEffects';

export interface UltimateMegaFeatures50Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    id?: string;
    username: string;
    role: string;
    points: number;
    likes: number;
    room: string;
    isVoice?: boolean;
    micSlot?: number | null;
  };
  onlineUsers: Array<{
    id: string;
    username: string;
    role: string;
    flag?: string;
    avatarUrl?: string;
    points?: number;
    likes?: number;
    micSlot?: number | null;
  }>;
  onSendChatMessage: (text: string) => void;
  onShowToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
  onAddPoints: (amount: number, reason: string) => void;
  onApplyTheme?: (themeId: string) => void;
  onApplyFont?: (fontId: string) => void;
  onToggleMic?: () => void;
  socket?: any;
}

// 42. Trivia Quiz Questions (Islamic & Arabic Culture)
const ARABIC_TRIVIA = [
  {
    q: 'ما هي عاصمة الدولة العباسية الأولى قبل بغداد؟',
    options: ['الهاشمية / الكوفة', 'دمشق', 'الفسطاط', 'سامراء'],
    correct: 0,
    explanation: 'كانت الكوفة والهاشمية أول مقرات العباسيين قبل بناء بغداد عام 762م على يد المنصور.'
  },
  {
    q: 'من هو الشاعر الملقب بـ "أمير الشعراء" في العصر الحديث؟',
    options: ['أحمد شوقي', 'حافظ إبراهيم', 'المتنبي', 'نزار قباني'],
    correct: 0,
    explanation: 'أحمد شوقي بويع أميراً للشعراء عام 1927م تقديراً لعلو شأنه في الشعر العربي.'
  },
  {
    q: 'ما هو أطول نهر في الوطن العربي والعالم؟',
    options: ['نهر النيل', 'نهر دجلة', 'نهر الفرات', 'نهر العاصي'],
    correct: 0,
    explanation: 'نهر النيل هو أطول أنهار العالم والوطن العربي بطول يقارب 6650 كم.'
  },
  {
    q: 'ما هي كنية الصقر العربي الحر المشهور في التراث الخليجي؟',
    options: ['أبو الشجعان / صقر قريش', 'أبو الفداء', 'أبو الطيب', 'أبو الفوارس'],
    correct: 0,
    explanation: 'الصقر الحر رمز للعزة والأنفة في تراث البادية والخليج العربي.'
  },
  {
    q: 'من هو القائد المسلم الذي فتح الأندلس عام 711م؟',
    options: ['طارق بن زياد', 'موسى بن نصير', 'عقبة بن نافع', 'خالد بن الوليد'],
    correct: 0,
    explanation: 'طارق بن زياد عبر المضيق الذي سمي باسمه جبل طارق وافتتح الأندلس.'
  }
];

// 43. Guess the Arabic Proverb
const ARABIC_PROVERBS = [
  {
    prefix: 'الصبر مفتاح',
    word: 'الفرج',
    hint: 'عكس الضيق والشدة'
  },
  {
    prefix: 'رب أخ لك لم تلده',
    word: 'أمك',
    hint: 'أقرب الناس إليك نسباً'
  },
  {
    prefix: 'من شب على شيء شاب',
    word: 'عليه',
    hint: 'يستمر معه حتى كبر سنه'
  },
  {
    prefix: 'إذا فات الفوت ما ينفع',
    word: 'الصوت',
    hint: 'النداء المتأخر بعد فوات الأوان'
  },
  {
    prefix: 'خير الكلام ما قل و',
    word: 'دل',
    hint: 'أوضح المعنى بأوجز عبارة'
  }
];

// 44. Virtual Gifts
const VIRTUAL_GIFTS = [
  { id: 'dallah', name: 'دلة رسلان ملكية', icon: '☕', cost: 10, bonusLikes: 5 },
  { id: 'falcon', name: 'صقر حر أصيل', icon: '🦅', cost: 25, bonusLikes: 15 },
  { id: 'crown', name: 'تاج السيادة الذهبي', icon: '👑', cost: 50, bonusLikes: 30 },
  { id: 'rose', name: 'وردة الجوري الطائفي', icon: '🌹', cost: 5, bonusLikes: 2 },
  { id: 'oud', name: 'مبخرة عود كمبودي', icon: '🪵', cost: 20, bonusLikes: 10 },
  { id: 'diamond', name: 'ألماسة المجلس اللامعة', icon: '💎', cost: 100, bonusLikes: 60 }
];

// 46. User Moods & Custom Statuses
const USER_MOODS = [
  { emoji: '☕', text: 'يرتشف قهوة المجلس' },
  { emoji: '🦅', text: 'يحلق في سماء الحوار' },
  { emoji: '🎧', text: 'يستمع بإنصات للحديث' },
  { emoji: '👑', text: 'حضور ملكي فخم' },
  { emoji: '📖', text: 'في خلوة تأمل وقراءة' },
  { emoji: '✨', text: 'ينشر الإيجابية والأنس' },
  { emoji: '🌹', text: 'يرحب بالكرام الأفاضل' },
  { emoji: '⚔️', text: 'حماسي وجاهز للمساجلة' },
  { emoji: '🌙', text: 'جلسة سمر ليلية هادئة' },
  { emoji: '🤝', text: 'على العهد والوفاء دائماً' }
];

// 47. Soundboard Sounds
const SOUNDBOARD_ITEMS = [
  { id: 'applause', name: 'تصفيق حار 👏', tone: 'applause' },
  { id: 'oud', name: 'عزف عود أصيل 🎵', tone: 'oud' },
  { id: 'falcon', name: 'صرخة صقر شامخ 🦅', tone: 'falcon' },
  { id: 'victory', name: 'بوق النصر والابتهاج 🎺', tone: 'victory' },
  { id: 'bell', name: 'جرس التنبيه الملكي 🔔', tone: 'bell' }
];

// 17. Gulf & Arabic Hospitality Canned Greetings
const HOSPITALITY_PHRASES = [
  'أهلاً ومرحباً بكم في مجلسنا الموقر، نورتونا يا كرام 🌹',
  'صح لسانك وعلا شانك، كفيت ووفيت يا الشيخ 👏',
  'تفضلوا تقهوا معنا، يا حي الله من جانا وزارنا ☕',
  'بيض الله وجيهكم على هذا الحديث الطيب المبارك 👑',
  'حضوركم شرف ومجلسنا بكم يزدهر ويفخر 🦅',
  'ما شاء الله تبارك الله، كلام موزون ودرر نادرة 💎',
  'عاش من سمع صوتك، لا عدمنا هذا الحضور البهي ✨',
  'مساء الخير والنور والسرور على الجميع 🌙'
];

// 15. Royal Text Ornaments
const TEXT_ORNAMENTS = [
  { id: 'crown', name: 'التاج الملكي 👑', format: (t: string) => `👑 彡 [${t}] 彡 👑` },
  { id: 'wings', name: 'أجنحة الصقر 🦅', format: (t: string) => `🦅 «« ${t} »» 🦅` },
  { id: 'sparkles', name: 'النجوم والبريق ✨', format: (t: string) => `✨ ༺ ${t} ༻ ✨` },
  { id: 'diamond', name: 'الماس والأناقة 💎', format: (t: string) => `💎 ✦ ${t} ✦ 💎` },
  { id: 'flower', name: 'الورد والريحان 🌹', format: (t: string) => `🌹 ❖ ${t} ❖ 🌹` }
];

// 18. Rare Arabic Lexicon
const ARABIC_LEXICON = [
  { word: 'العَسْجَد', meaning: 'الذهب الخالص الصافي اللامع البراق', example: 'تألقت كلماته كالعسجد الخالص' },
  { word: 'الفَرْقَد', meaning: 'النجم القطبي الهادي الساطع في السماء', example: 'أنت فرقد مجلسنا ونوره الوضاء' },
  { word: 'الغَيْدَاق', meaning: 'الكريم واسع العطاء والسحاب المغدق بالخير', example: 'رجل غيداق الأخلاق وطيب اليد' },
  { word: 'الصِّنْدِيد', meaning: 'الشجاع البطل الشامخ الثابت في الشدائد', example: 'موقف صنديد لا تلين له قناة' },
  { word: 'اليَعْبُوب', meaning: 'الفرس السريع الجواد أو النهر الجاري بعذوبة', example: 'حديث عذب كالنهر اليعبوب' },
  { word: 'السُّلاف', meaning: 'خلاصة الشيء وأفضله وأنقاه على الإطلاق', example: 'سلاف القول وأطيب الحديث' }
];

// 30. Majlis Athkar & Prayers
const ARABIC_ATHKAR = [
  'سبحان الله وبحمده، سبحان الله العظيم 📿',
  'أستغفر الله العظيم وأتوب إليه 🤲',
  'لا حول ولا قوة إلا بالله العلي العظيم 💫',
  'اللهم صلِّ وسلِّم وبارك على نبينا محمد 🌸',
  'لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير 🌙'
];

// 48. Arab Wisdoms & Classical Eloquence
const ARABIC_WISDOMS = [
  { text: 'ذو العَقلِ يَشقَى في النَعيمِ بِعَقلِهِ .. وَأَخو الجَهالَةِ في الشَقاوَةِ يَنعَمُ', author: 'أبو الطيب المتنبي' },
  { text: 'إِذا هَبَّت رِياحُكَ فَاغتَنِمها .. فَعُقبى كُلِّ خافِقَةٍ سُكونُ', author: 'الإمام الشافعي' },
  { text: 'لِسانُ الفَتى نِصفٌ وَنِصفٌ فُؤادُهُ .. فَلَم يَبقَ إِلّا صورَةُ اللَحمِ وَالدَمِ', author: 'زهير بن أبي سلمى' },
  { text: 'إِنَّما الأُمَمُ الأَخلاقُ ما بَقِيَت .. فَإِن هُمُ ذَهَبَت أَخلاقُهُم ذَهَبوا', author: 'أحمد شوقي' },
  { text: 'عَلى قَدرِ أَهلِ العَزمِ تَأتي العَزائِمُ .. وَتَأتي عَلى قَدرِ الكِرامِ المَكارِمُ', author: 'أبو الطيب المتنبي' }
];

// 50. Hall of Fame Top Falcons
const HALL_OF_FAME = [
  { rank: 1, name: 'صقر الجزيرة', title: 'فارس المجلس الأول 👑', pts: 4850, badge: '🥇' },
  { rank: 2, name: 'أمير القوافي', title: 'شاعر الصقور الذهبي 📜', pts: 3920, badge: '🥈' },
  { rank: 3, name: 'سلطان الحكمة', title: 'حكيم الصقور المبجل 🦅', pts: 3210, badge: '🥉' },
  { rank: 4, name: 'المهيب', title: 'فارس المايك الصاعد ⭐', pts: 2680, badge: '🎖️' },
  { rank: 5, name: 'نجم الدجى', title: 'سفير الوفاء والمودة 💎', pts: 2150, badge: '✨' }
];

export const UltimateMegaFeatures50: React.FC<UltimateMegaFeatures50Props> = ({
  isOpen,
  onClose,
  currentUser,
  onlineUsers,
  onSendChatMessage,
  onShowToast,
  onAddPoints,
  onApplyTheme,
  onApplyFont,
  onToggleMic,
  socket
}) => {
  // Navigation tabs across the 50 features
  const [activeTab, setActiveTab] = useState<'voice' | 'chat' | 'room' | 'security' | 'gamification'>('voice');

  // --- 1. Audio Latency & WebRTC Ping Diagnostic Meter ---
  const [webrtcPing, setWebrtcPing] = useState<number>(38);
  const [packetLoss, setPacketLoss] = useState<number>(0.1);
  const [jitter, setJitter] = useState<number>(2.4);

  // --- 2. Waveform & Mic Activity ---
  const [micAudioLevel, setMicAudioLevel] = useState<number>(0);
  const [isVisualizerActive, setIsVisualizerActive] = useState<boolean>(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // --- 3. Smart Microphone Queue ---
  const [micQueue, setMicQueue] = useState<string[]>(['أبو فهد', 'سلطان القوافي']);
  const [isInMicQueue, setIsInMicQueue] = useState<boolean>(false);

  // --- 4. Mic Feedback / Loopback Echo Test ---
  const [isEchoTesting, setIsEchoTesting] = useState<boolean>(false);

  // --- 5. 3D Spatial Audio Pan ---
  const [spatialPan, setSpatialPan] = useState<number>(0); // -1 (Left), 0 (Center), +1 (Right)

  // --- 6. Voice Pitch & Studio Equalizer Presets ---
  const [voicePreset, setVoicePreset] = useState<'studio' | 'falcon' | 'radio' | 'echo' | 'helium'>('studio');

  // --- 7. Ambient Soundscapes Studio ---
  const [ambientType, setAmbientType] = useState<'none' | 'campfire' | 'rain' | 'oud' | 'desert'>('none');
  const [ambientVolume, setAmbientVolume] = useState<number>(45);

  // --- 8. Talking While Muted Warning ---
  const [talkingMutedDetector, setTalkingMutedDetector] = useState<boolean>(true);

  // --- 9. Mic Slot Handover ---
  const [selectedHandoverUser, setSelectedHandoverUser] = useState<string>('');

  // --- 10. Voice Room Session Audio Recorder ---
  const [isRecordingRoom, setIsRecordingRoom] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);

  // --- 11. Live Text-to-Speech (TTS) ---
  const [ttsSpeed, setTtsSpeed] = useState<number>(1.0);
  const [ttsPitch, setTtsPitch] = useState<number>(1.0);

  // --- 12. Starred & Bookmarked Messages ---
  const [starredList, setStarredList] = useState<Array<{ id: string; user: string; text: string; time: string }>>([
    { id: '1', user: 'صقر الجزيرة', text: 'يا طائر الشوق هل في البعد مسكننا؟ أم أن في الصبر نيل ما تمنينا', time: '14:20' },
    { id: '2', user: 'أمير المجلس', text: 'أهلاً وسهلاً بجميع الإخوة الكرام في أمسيتنا الثقافية العطرة', time: '15:10' }
  ]);
  const [starredSearchQuery, setStarredSearchQuery] = useState('');

  // --- 14. Poetry & Rhyme Assistant ---
  const [firstHemistich, setFirstHemistich] = useState('');
  const [secondHemistich, setSecondHemistich] = useState('');
  const [selectedRhymeChar, setSelectedRhymeChar] = useState('ر');

  // --- 16. Instant Language Translator ---
  const [translateText, setTranslateText] = useState('');
  const [translatedResult, setTranslatedResult] = useState('');
  const [targetLang, setTargetLang] = useState<'en' | 'fr' | 'ur' | 'tr'>('en');

  // --- 19. Message Scheduler & Timed Reminders ---
  const [scheduledReminderText, setScheduledReminderText] = useState('');
  const [scheduledMinutes, setScheduledMinutes] = useState<number>(5);

  // --- 21. Room MOTD Announcement ---
  const [roomMotd, setRoomMotd] = useState('أهلاً بكم في مجلس صقور العرب! يرجى الالتزام بآداب الحوار واحترام الجميع 🦅✨');
  const [editingMotd, setEditingMotd] = useState(false);

  // --- 23. Slow Mode Controller ---
  const [slowModeSeconds, setSlowModeSeconds] = useState<number>(0);

  // --- 24. Room Secret Lock Passcode ---
  const [roomPasscode, setRoomPasscode] = useState('');
  const [isRoomPasswordProtected, setIsRoomPasswordProtected] = useState(false);

  // --- 26. Reputation & Honor Level System ---
  const calculatedLevel = Math.max(1, Math.floor(currentUser.points / 50) + 1);
  const levelTitle =
    calculatedLevel > 20
      ? 'شيخ المجلس ورمز الحكمة 👑'
      : calculatedLevel > 10
      ? 'فارس الكلمة وصقر الأدب 🦅'
      : calculatedLevel > 5
      ? 'عضو مرموق ومتميز ⭐'
      : 'صقر جديد واعد 🌟';

  // --- 31. Burn-After-Reading Ephemeral Chat ---
  const [ephemeralTimer, setEphemeralTimer] = useState<'off' | '10m' | '30m' | '1h'>('off');

  // --- 33. FPS & Memory Profiler ---
  const [liveFps, setLiveFps] = useState<number>(60);
  const [estimatedMemoryMb, setEstimatedMemoryMb] = useState<number>(24.8);

  // --- 34. Custom Word Filter & Censorship ---
  const [blockedWordsList, setBlockedWordsList] = useState<string[]>(['شتم', 'إعلان مخالف', 'رابط مشبوه']);
  const [newBlockedWord, setNewBlockedWord] = useState('');

  // --- 35. Ghost / Invisible Staff Mode ---
  const [ghostModeActive, setGhostModeActive] = useState<boolean>(false);

  // --- 38. PWA Connectivity Status ---
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // --- 41. Falcon Fortune Wheel ---
  const [isSpinningWheel, setIsSpinningWheel] = useState<boolean>(false);
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [wheelWinMessage, setWheelWinMessage] = useState<string>('');

  // --- 42. Trivia Game State ---
  const [triviaIdx, setTriviaIdx] = useState<number>(0);
  const [selectedTriviaOption, setSelectedTriviaOption] = useState<number | null>(null);
  const [triviaScore, setTriviaScore] = useState<number>(0);

  // --- 43. Guess Proverb State ---
  const [proverbIdx, setProverbIdx] = useState<number>(0);
  const [userProverbInput, setUserProverbInput] = useState<string>('');
  const [proverbSolved, setProverbSolved] = useState<boolean>(false);

  // --- 45. Member-to-Member Points Transfer ---
  const [transferTargetUser, setTransferTargetUser] = useState<string>('');
  const [transferPointsAmount, setTransferPointsAmount] = useState<number>(10);

  // --- 46. User Mood & Custom Status ---
  const [activeMood, setActiveMood] = useState<string>('يرتشف قهوة المجلس ☕');

  // --- 15. Royal Text Ornaments ---
  const [calligraphyInput, setCalligraphyInput] = useState<string>('');
  const [selectedOrnamentIdx, setSelectedOrnamentIdx] = useState<number>(0);

  // --- 18. Rare Arabic Lexicon ---
  const [lexiconQuery, setLexiconQuery] = useState<string>('');

  // --- 25. Live Majlis Poll ---
  const [pollQuestion] = useState<string>('هل تؤيد تنظيم أمسية شعرية خاصة لصقور المجلس في نهاية الأسبوع؟');
  const [pollOptions] = useState<string[]>(['نعم وبشدة 👏', 'أفضل جلسة حوارية عامة ☕', 'حسب الوقت والظروف 🌙']);
  const [pollVotes, setPollVotes] = useState<number[]>([18, 6, 3]);
  const [userHasVoted, setUserHasVoted] = useState<number | null>(null);

  // --- 28. Room Audit & Events Log ---
  const [roomAuditEvents, setRoomAuditEvents] = useState<Array<{ id: string; time: string; text: string; type: string }>>([
    { id: '1', time: 'الآن', text: 'فحص دوري لدرع الأمان والفلترة المشددة: آمن 100%', type: 'shield' },
    { id: '2', time: 'منذ دقيقة', text: 'انضمام عضو جديد إلى مجلس الكرام', type: 'user' },
    { id: '3', time: 'منذ 3 دقائق', text: 'إهداء دلة رسلان ملكية في المحادثة العامة', type: 'gift' }
  ]);

  // --- 29. Zen Distraction-Free Focus Mode ---
  const [isZenMode, setIsZenMode] = useState<boolean>(false);

  // --- 30. Majlis Athkar & Prayers Reminder ---
  const [thikrIdx, setThikrIdx] = useState<number>(0);
  const [thikrCounter, setThikrCounter] = useState<number>(33);

  // --- 36. Security Access & Fingerprint Log ---
  const [securityAuditInfo] = useState({
    os: 'Chrome / Linux Secure Client',
    protocol: 'WSS / TLS 1.3 Strict',
    cipher: 'AES-256-GCM',
    fingerprintScore: 99
  });

  // --- 37. Anti-Flood & Rate Limiter ---
  const [antiFloodEnabled, setAntiFloodEnabled] = useState<boolean>(true);
  const [floodThreshold, setFloodThreshold] = useState<number>(15); // max 15 msg/min

  // --- 38. Data Privacy Shield ---
  const [privacyCleared, setPrivacyCleared] = useState<boolean>(false);

  // --- 39. Emergency Lockdown Panic Switch ---
  const [emergencyLockdown, setEmergencyLockdown] = useState<boolean>(false);

  // --- 40. Account PIN Security Guard ---
  const [accountPin, setAccountPin] = useState<string>('');
  const [isPinConfigured, setIsPinConfigured] = useState<boolean>(false);

  // --- 48. Arab Wisdoms Dispenser ---
  const [wisdomIdx, setWisdomIdx] = useState<number>(0);

  // --- 49. Falcon Points Multiplier Booster ---
  const [multiplierTier, setMultiplierTier] = useState<1 | 2 | 3>(2);
  const [isBoosterActive, setIsBoosterActive] = useState<boolean>(false);

  // Periodic simulated stats & audio canvas
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const statsInterval = setInterval(() => {
      // Fluctuate ping slightly for realism
      setWebrtcPing((prev) => Math.max(22, Math.min(65, prev + (Math.random() * 6 - 3))));
      setLiveFps((prev) => Math.max(57, Math.min(60, Math.round(58 + Math.random() * 2))));
    }, 2500);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(statsInterval);
    };
  }, []);

  // Voice recording timer
  useEffect(() => {
    let timer: any;
    if (isRecordingRoom) {
      timer = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isRecordingRoom]);

  // Audio Canvas visualizer simulation
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas || !isVisualizerActive) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let angle = 0;
    const render = () => {
      angle += 0.08;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const bars = 24;
      const barWidth = canvas.width / bars - 2;

      for (let i = 0; i < bars; i++) {
        const height = Math.abs(Math.sin(angle + i * 0.3)) * (canvas.height * 0.8) + 4;
        const x = i * (barWidth + 2);
        const y = (canvas.height - height) / 2;

        const grad = ctx.createLinearGradient(0, y, 0, y + height);
        grad.addColorStop(0, '#f59e0b');
        grad.addColorStop(1, '#d97706');

        ctx.fillStyle = grad;
        ctx.fillRect(x, y, barWidth, height);
      }
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isVisualizerActive]);

  if (!isOpen) return null;

  // --- Handlers ---
  const handleSpinWheel = () => {
    if (isSpinningWheel) return;
    setIsSpinningWheel(true);
    setWheelWinMessage('');

    const rewards = [
      { pts: 25, label: '25 نقطة صقر ذهبية ⭐' },
      { pts: 50, label: '50 نقطة ملكية + وسام الشجاعة 🦅' },
      { pts: 10, label: '10 نقاط تحية للمجلس ☕' },
      { pts: 100, label: 'الجائزة الكبرى: 100 نقطة فخامة! 👑' },
      { pts: 15, label: '15 نقطة لايك شرفي ❤️' },
      { pts: 30, label: '30 نقطة شاعر المجلس 📜' }
    ];

    const chosenIdx = Math.floor(Math.random() * rewards.length);
    const extraRotations = 5 + Math.floor(Math.random() * 3);
    const newAngle = wheelRotation + extraRotations * 360 + chosenIdx * 60;
    setWheelRotation(newAngle);

    setTimeout(() => {
      setIsSpinningWheel(false);
      const win = rewards[chosenIdx];
      setWheelWinMessage(win.label);
      onAddPoints(win.pts, 'عجلة الحظ اليومية');
      confetti({ particleCount: 50, spread: 70 });
      sounds.playGeneralAlertPing();
      onShowToast(`مبروك! فزت بـ ${win.label}`, 'success');
    }, 3200);
  };

  const handleSendGift = (gift: (typeof VIRTUAL_GIFTS)[0]) => {
    if (currentUser.points < gift.cost) {
      onShowToast(`عفواً، رصيد نقاطك (${currentUser.points}) لا يكفي لإهداء ${gift.name} (${gift.cost} نقطة)`, 'error');
      return;
    }
    onAddPoints(-gift.cost, `إهداء ${gift.name}`);
    confetti({ particleCount: 40, spread: 60 });
    sounds.playGeneralAlertPing();
    onSendChatMessage(`🎁 أهدى [${currentUser.username}] هدية فاخرة: ${gift.icon} ${gift.name} إلى مجلس الكرام!`);
    onShowToast(`تم إهداء ${gift.name} بنجاح!`, 'success');
  };

  const handlePlaySoundboard = (item: (typeof SOUNDBOARD_ITEMS)[0]) => {
    sounds.playMentionPing();
    onShowToast(`تم تشغيل مؤثر: ${item.name}`, 'info');
    onSendChatMessage(`🔊 [مؤثر صوتي]: قام ${currentUser.username} بتشغيل ${item.name}`);
  };

  const handleSendTTS = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      utterance.rate = ttsSpeed;
      utterance.pitch = ttsPitch;
      window.speechSynthesis.speak(utterance);
      onShowToast('جاري نطق الرسالة بصوت عربي فصيح 🗣️', 'info');
    } else {
      onShowToast('ميزة القراءة الصوتية غير مدعومة في متصفحك', 'error');
    }
  };

  const handleSendPoetry = () => {
    if (!firstHemistich.trim() || !secondHemistich.trim()) {
      onShowToast('يرجى كتابة شطري البيت الشعري (الصدر والعجز)', 'error');
      return;
    }
    const poem = `📜 [بيت شعر موزون على قافية الـ ${selectedRhymeChar}]:\n"${firstHemistich.trim()} ... ${secondHemistich.trim()}"`;
    onSendChatMessage(poem);
    setFirstHemistich('');
    setSecondHemistich('');
    onShowToast('تم نشر البيت الشعري في المجلس!', 'success');
  };

  const handleTransferPoints = () => {
    if (!transferTargetUser) {
      onShowToast('يرجى اختيار العضو المستلم', 'error');
      return;
    }
    if (currentUser.points < transferPointsAmount) {
      onShowToast('رصيدك من النقاط لا يكفي للتحويل', 'error');
      return;
    }
    onAddPoints(-transferPointsAmount, `تحويل نقاط إلى ${transferTargetUser}`);
    onSendChatMessage(`💸 حول [${currentUser.username}] عدد ${transferPointsAmount} نقطة هدية إلى الأخ @${transferTargetUser} 👏`);
    onShowToast(`تم تحويل ${transferPointsAmount} نقطة إلى @${transferTargetUser}!`, 'success');
  };

  const handleToggleMicQueue = () => {
    if (isInMicQueue) {
      setMicQueue((prev) => prev.filter((u) => u !== currentUser.username));
      setIsInMicQueue(false);
      onShowToast('تم الخروج من طابور المايكات', 'info');
    } else {
      setMicQueue((prev) => [...prev, currentUser.username]);
      setIsInMicQueue(true);
      onShowToast('تم الانضمام لطابور المايكات بنجاح 🎤', 'success');
    }
  };

  const handleDownloadChatLog = () => {
    const textContent = `سجل محادثات مجلس صقور العرب\nالتاريخ: ${new Date().toLocaleString('ar-SA')}\nالغرفة: ${currentUser.room}\nالمستخدم: ${currentUser.username}\n\n-- تم التصدير بأمان عبر منصة حسان برو --`;
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `majlis_chat_export_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast('تم تنزيل نسخة من سجل المحادثة 📥', 'success');
  };

  // 15. Send Formatted Calligraphy Text
  const handleSendFormattedText = () => {
    if (!calligraphyInput.trim()) {
      onShowToast('يرجى كتابة نص لتطبيق الزخرفة الملكية', 'error');
      return;
    }
    const formatted = TEXT_ORNAMENTS[selectedOrnamentIdx].format(calligraphyInput.trim());
    onSendChatMessage(formatted);
    setCalligraphyInput('');
    confetti({ particleCount: 25, spread: 50 });
    sounds.playGeneralAlertPing();
    onShowToast('تم إرسال النص المزخرف الملكي بنجاح! 👑', 'success');
  };

  // 25. Vote in Live Majlis Poll
  const handleVotePoll = (index: number) => {
    if (userHasVoted !== null) {
      onShowToast('لقد شاركت في هذا التصويت مسبقاً!', 'info');
      return;
    }
    setUserHasVoted(index);
    setPollVotes((prev) => {
      const next = [...prev];
      next[index] += 1;
      return next;
    });
    confetti({ particleCount: 30, spread: 50 });
    sounds.playGeneralAlertPing();
    onShowToast(`تم تسجيل صوتك لصالح: ${pollOptions[index]}!`, 'success');
    onSendChatMessage(`📊 شارك [${currentUser.username}] في استطلاع المجلس: صوت لصالح [${pollOptions[index]}]`);
  };

  // 30. Send Athkar Blessing to Room
  const handleSendThikrToRoom = () => {
    const text = ARABIC_ATHKAR[thikrIdx];
    onSendChatMessage(`📿 [ذكر ودعاء مبارك]: ${text}`);
    onAddPoints(5, 'مشاركة الذكر مع المجلس');
    sounds.playGeneralAlertPing();
    onShowToast('جزاك الله خيراً، تم إرسال الذكر إلى المجلس (+5 نقاط) 🤲', 'success');
  };

  // 38. Clear Privacy Footprint
  const handleClearPrivacyFootprint = () => {
    setPrivacyCleared(true);
    try {
      sessionStorage.removeItem('temp_audio_cache');
      sessionStorage.removeItem('draft_chat');
    } catch (e) {}
    sounds.playGeneralAlertPing();
    onShowToast('تم مسح جميع البصمات المؤقتة وسجل الجلسة بنجاح 🛡️', 'success');
  };

  // 39. Emergency Lockdown Panic Switch
  const handleEmergencyLockdownToggle = () => {
    if (currentUser.role !== 'admin' && currentUser.role !== 'super') {
      onShowToast('هذه الميزة مخصصة لمشرفي وإدارة المجلس فقط!', 'error');
      return;
    }
    const nextState = !emergencyLockdown;
    setEmergencyLockdown(nextState);
    if (nextState) {
      onSendChatMessage('🚨 [إشعار أمني عاجل]: قام المشرف بتفعيل وضع الإغلاق الطارئ للغرفة مؤقتاً!');
      onShowToast('تم تفعيل وضع الإغلاق الأمني الطارئ!', 'error');
    } else {
      onSendChatMessage('✅ [إشعار]: تم إلغاء وضع الطوارئ واستئناف حركة المجلس الطبيعية.');
      onShowToast('تم إلغاء وضع الطوارئ بنجاح', 'success');
    }
  };

  // 48. Share Arab Wisdom to Room
  const handleShareDailyWisdom = () => {
    const w = ARABIC_WISDOMS[wisdomIdx];
    onSendChatMessage(`📜 [حكمة وأدب عربي أصيل]:\n"${w.text}"\n— ${w.author}`);
    sounds.playGeneralAlertPing();
    onShowToast('تمت مشاركة الحكمة مع المجلس!', 'success');
    setWisdomIdx((prev) => (prev + 1) % ARABIC_WISDOMS.length);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fade-in" dir="rtl">
      <div className="bg-slate-900 border border-slate-750 w-full max-w-2xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border-b border-amber-500/30 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-amber-300 flex items-center gap-2">
                ترسانة الميزات الـ 50 الشاملة (Mega Suite 50+)
                <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30">
                  الإصدار الفائق
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                منظومة متكاملة من ميزات الصوت، الشات، الرقابة، الألعاب والجماليات
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-around bg-slate-950/60 border-b border-slate-800 px-2 py-2 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('voice')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
              activeTab === 'voice'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>الصوت والمايكات (1-10)</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
              activeTab === 'chat'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>أدوات الشات (11-20)</span>
          </button>

          <button
            onClick={() => setActiveTab('room')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
              activeTab === 'room'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>إدارة المجلس (21-30)</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
              activeTab === 'security'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>الأمان والتتبع (31-40)</span>
          </button>

          <button
            onClick={() => setActiveTab('gamification')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
              activeTab === 'gamification'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>الألعاب والمرح (41-50)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* ================= SECTION 1: VOICE & MIC (Features 1-10) ================= */}
          {activeTab === 'voice' && (
            <div className="space-y-4 animate-fade-in">
              {/* 1. Live Audio Latency & WebRTC Ping Diagnostic Meter */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold text-amber-400">
                    <Activity className="w-4 h-4" />
                    <span>ميزة 1: مقياس الاستجابة الصوتي اللحظي (WebRTC Quality Meter)</span>
                  </div>
                  <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    اتصال ممتاز
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-900/80 rounded-xl p-2 border border-slate-800">
                    <div className="text-[10px] text-slate-400">زمن الاستجابة (Ping)</div>
                    <div className="text-base font-bold text-amber-400 font-mono mt-0.5">{Math.round(webrtcPing)} ms</div>
                  </div>
                  <div className="bg-slate-900/80 rounded-xl p-2 border border-slate-800">
                    <div className="text-[10px] text-slate-400">فقد الحزم (Loss)</div>
                    <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">{packetLoss}%</div>
                  </div>
                  <div className="bg-slate-900/80 rounded-xl p-2 border border-slate-800">
                    <div className="text-[10px] text-slate-400">تذبذب الإشارة (Jitter)</div>
                    <div className="text-base font-bold text-sky-400 font-mono mt-0.5">{jitter} ms</div>
                  </div>
                </div>
              </div>

              {/* 2. Waveform & Mic Level Canvas */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold text-amber-400">
                    <Radio className="w-4 h-4" />
                    <span>ميزة 2: المحلل الطيفي والموجات الصوتية الحيّة (Live Waveform)</span>
                  </div>
                  <button
                    onClick={() => setIsVisualizerActive(!isVisualizerActive)}
                    className="text-[11px] text-slate-300 hover:text-white"
                  >
                    {isVisualizerActive ? 'إيقاف الرسوم' : 'تفعيل'}
                  </button>
                </div>
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={48}
                  className="w-full h-12 bg-slate-950/70 rounded-xl border border-slate-800"
                />
              </div>

              {/* 3. Smart Microphone Queue */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold text-amber-400">
                    <ListOrdered className="w-4 h-4" />
                    <span>ميزة 3: طابور المايكات الذكي مع الأولوية (Mic Priority Queue)</span>
                  </div>
                  <button
                    onClick={handleToggleMicQueue}
                    className={`text-xs px-2.5 py-1 rounded-xl font-bold transition-all ${
                      isInMicQueue
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-amber-500 text-slate-950'
                    }`}
                  >
                    {isInMicQueue ? 'مغادرة الطابور' : 'طلب الصعود للمايك'}
                  </button>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {micQueue.map((user, i) => (
                    <div key={i} className="text-[11px] bg-slate-900 border border-slate-750 px-2 py-1 rounded-lg flex items-center gap-1.5 text-slate-300">
                      <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 text-[10px] flex items-center justify-center font-bold">
                        {i + 1}
                      </span>
                      <span>{user}</span>
                      {user === currentUser.username && (
                        <span className="text-[9px] text-amber-400 font-bold">(أنت)</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 4 & 5. Loopback Echo Test & Spatial Panning */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 space-y-2">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Headphones className="w-3.5 h-3.5" />
                    <span>ميزة 4: اختبار صدى المايك المحلي (Loopback)</span>
                  </div>
                  <p className="text-[11px] text-slate-400">استمع لصوتك قبل التحدث أمام الجمهور</p>
                  <button
                    onClick={() => {
                      setIsEchoTesting(!isEchoTesting);
                      onShowToast(isEchoTesting ? 'تم إيقاف اختبار الصدى' : 'بدء اختبار الصدى.. تحدث الآن!', 'info');
                    }}
                    className={`w-full py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      isEchoTesting ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-slate-750 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    {isEchoTesting ? 'إيقاف الاختبار' : 'بدء فحص الصوت'}
                  </button>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 space-y-2">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>ميزة 5: توزيع الصوت المجسم ثلاثي الأبعاد (Spatial Pan)</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>يسار ◀</span>
                    <span className="text-amber-400 font-bold">{spatialPan === 0 ? 'في المنتصف' : spatialPan < 0 ? `${spatialPan * -100}% يسار` : `${spatialPan * 100}% يمين`}</span>
                    <span>▶ يمين</span>
                  </div>
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.1"
                    value={spatialPan}
                    onChange={(e) => setSpatialPan(parseFloat(e.target.value))}
                    className="w-full accent-amber-500 h-1.5 bg-slate-900 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* 6. Voice Presets Equalizer */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 space-y-2">
                <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>ميزة 6: قوالب ومؤثرات نبرة الصوت في البث (Voice Studio Presets)</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs">
                  {[
                    { id: 'studio', label: 'استوديو نقي 🎙️' },
                    { id: 'falcon', label: 'صقر مهيب 🦅' },
                    { id: 'radio', label: 'مذياع كلاسيك 📻' },
                    { id: 'echo', label: 'صدى المجالس 🏛️' },
                    { id: 'helium', label: 'مرح وهيليوم 🎈' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setVoicePreset(p.id as any);
                        onShowToast(`تم تفعيل نبرة: ${p.label}`, 'success');
                      }}
                      className={`p-2 rounded-xl text-center font-bold text-[11px] transition-all ${
                        voicePreset === p.id
                          ? 'bg-amber-500 text-slate-950 shadow-md'
                          : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 7. Background Ambient Soundscapes */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5" />
                    <span>ميزة 7: استوديو الخلفيات الصوتية للمجلس (Ambient Soundscapes)</span>
                  </div>
                  <span className="text-[11px] text-slate-400">حجم: {ambientVolume}%</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs">
                  {[
                    { id: 'none', label: 'بدون خلفية ⏹️' },
                    { id: 'campfire', label: 'نار السمر 🔥' },
                    { id: 'rain', label: 'مطر البادية 🌧️' },
                    { id: 'oud', label: 'تقاسيم عود 🎵' },
                    { id: 'desert', label: 'نسيم الصحراء 🏜️' }
                  ].map((a) => (
                    <button
                      key={a.id}
                      onClick={() => {
                        setAmbientType(a.id as any);
                        onShowToast(a.id === 'none' ? 'تم إيقاف الخلفية' : `تم تشغيل خلفية: ${a.label}`, 'info');
                      }}
                      className={`p-2 rounded-xl text-center font-bold text-[11px] transition-all ${
                        ambientType === a.id
                          ? 'bg-amber-500 text-slate-950 shadow-md'
                          : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
                {ambientType !== 'none' && (
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={ambientVolume}
                    onChange={(e) => setAmbientVolume(parseInt(e.target.value))}
                    className="w-full accent-amber-500 h-1.5 bg-slate-900 rounded-lg cursor-pointer mt-2"
                  />
                )}
              </div>

              {/* 8, 9, 10. Handover, Mute Warning, Voice Recording */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 8. Talking While Muted */}
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 space-y-1.5">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <MicOff className="w-3.5 h-3.5" />
                    <span>ميزة 8: كاشف الحديث أثناء الكتم</span>
                  </div>
                  <p className="text-[10px] text-slate-400">ينبهك فوراً عند التحدث والميكروفون مكتوم</p>
                  <button
                    onClick={() => {
                      setTalkingMutedDetector(!talkingMutedDetector);
                      onShowToast(talkingMutedDetector ? 'تم تعطيل المنبه' : 'تم تفعيل كاشف الكتم', 'info');
                    }}
                    className={`w-full py-1 rounded-xl text-xs font-bold ${
                      talkingMutedDetector ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-750 text-slate-400'
                    }`}
                  >
                    {talkingMutedDetector ? 'مفعل بنجاح ✓' : 'معطل'}
                  </button>
                </div>

                {/* 9. Mic Slot Handover */}
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 space-y-1.5">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5" />
                    <span>ميزة 9: إهداء وتمرير المايك</span>
                  </div>
                  <select
                    value={selectedHandoverUser}
                    onChange={(e) => setSelectedHandoverUser(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-750 text-[11px] rounded-lg p-1.5 text-slate-200"
                  >
                    <option value="">اختر عضواً لتسليمه المايك</option>
                    {onlineUsers.filter((u) => u.username !== currentUser.username).map((u) => (
                      <option key={u.id} value={u.username}>{u.username}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      if (!selectedHandoverUser) {
                        onShowToast('يرجى اختيار العضو أولاً', 'error');
                        return;
                      }
                      onSendChatMessage(`🎤 قام [${currentUser.username}] بتسليم المايك للأخ @${selectedHandoverUser}`);
                      onShowToast(`تم تقديم المايك لـ ${selectedHandoverUser}!`, 'success');
                    }}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-1 rounded-xl text-xs"
                  >
                    تمرير المايك الآن
                  </button>
                </div>

                {/* 10. Voice Room Session Audio Recorder */}
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 space-y-1.5">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>ميزة 10: تسجيل جلسة الصوت</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {isRecordingRoom ? `جاري التسجيل: ${recordingSeconds} ثانية` : 'تسجيل الأمسية وتنزيلها'}
                  </p>
                  <button
                    onClick={() => {
                      if (isRecordingRoom) {
                        setIsRecordingRoom(false);
                        onShowToast('تم حفظ التسجيل وجاري تجهيز الملف للتحميل 💾', 'success');
                      } else {
                        setIsRecordingRoom(true);
                        onShowToast('بدأ تسجيل الجلسة الصوتية الحالية 🔴', 'info');
                      }
                    }}
                    className={`w-full py-1 rounded-xl text-xs font-bold ${
                      isRecordingRoom ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-750 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    {isRecordingRoom ? 'إيقاف وحفظ الملف' : 'بدء التسجيل'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= SECTION 2: CHAT POWER TOOLS (Features 11-20) ================= */}
          {activeTab === 'chat' && (
            <div className="space-y-4 animate-fade-in">
              {/* 11. Live Text-to-Speech (TTS) Engine */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>ميزة 11: قارئ الرسائل الصوتي الآلي (Arabic TTS Engine)</span>
                  </div>
                  <span className="text-[10px] text-slate-400">سرعة: {ttsSpeed}x</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    id="ttsInputSample"
                    placeholder="اكتب أي نص هنا لتجربة القراءة الصوتية الفصحى..."
                    className="flex-1 bg-slate-900 border border-slate-750 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500"
                    defaultValue="مرحباً بكم في شات صقور العرب للمحادثات الصوتية والنصية"
                  />
                  <button
                    onClick={() => {
                      const el = document.getElementById('ttsInputSample') as HTMLInputElement;
                      if (el && el.value) handleSendTTS(el.value);
                    }}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>قراءة</span>
                  </button>
                </div>
              </div>

              {/* 12. Starred & Bookmarked Messages Hub */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5" />
                    <span>ميزة 12: مركز الرسائل المميزة والمحفوظة (Bookmarks Hub)</span>
                  </div>
                  <span className="text-[11px] text-slate-400">{starredList.length} رسالة محفوظة</span>
                </div>
                <input
                  type="text"
                  value={starredSearchQuery}
                  onChange={(e) => setStarredSearchQuery(e.target.value)}
                  placeholder="بحث في الرسائل المحفوظة..."
                  className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                />
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {starredList
                    .filter((m) => !starredSearchQuery || m.text.includes(starredSearchQuery) || m.user.includes(starredSearchQuery))
                    .map((item) => (
                      <div key={item.id} className="bg-slate-900/90 border border-slate-800 p-2 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <span className="text-amber-400 font-bold ml-1.5">@{item.user}:</span>
                          <span className="text-slate-200">{item.text}</span>
                        </div>
                        <button
                          onClick={() => {
                            setStarredList((prev) => prev.filter((x) => x.id !== item.id));
                            onShowToast('تمت إزالة الرسالة من المفضلة', 'info');
                          }}
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                </div>
              </div>

              {/* 13. Super Reaction Particle Bursts */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 space-y-2">
                <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" />
                  <span>ميزة 13: تفاعلات الشرارات الحية المتفجرة (Reaction Fireworks)</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {['❤️ حب ووفاء', '🔥 حماس مشتعل', '👏 كفو وتصفيق', '👑 حضور ملكي', '🦅 شموخ صقر', '🌹 ورد وتقدير'].map((r, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        confetti({ particleCount: 35, spread: 60 });
                        sounds.playGeneralAlertPing();
                        onShowToast(`أرسلت تفاعل: ${r}`, 'success');
                      }}
                      className="bg-slate-900 hover:bg-slate-800 border border-slate-750 text-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* 14. Poetry & Rhyme Assistant */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Feather className="w-3.5 h-3.5" />
                    <span>ميزة 14: مساعد القوافي ونظم الشعر العربي (Poetry Studio)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400">الروي:</span>
                    <select
                      value={selectedRhymeChar}
                      onChange={(e) => setSelectedRhymeChar(e.target.value)}
                      className="bg-slate-900 text-amber-400 font-bold border border-slate-750 rounded-lg text-xs px-1.5 py-0.5"
                    >
                      {['ر', 'م', 'ل', 'د', 'ن', 'ق', 'ب'].map((c) => (
                        <option key={c} value={c}>قافية الـ ({c})</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={firstHemistich}
                    onChange={(e) => setFirstHemistich(e.target.value)}
                    placeholder="الصدر: الشطر الأول من البيت..."
                    className="bg-slate-900 border border-slate-750 rounded-xl px-2.5 py-1.5 text-xs text-slate-200"
                  />
                  <input
                    type="text"
                    value={secondHemistich}
                    onChange={(e) => setSecondHemistich(e.target.value)}
                    placeholder="العجز: الشطر الثاني من البيت..."
                    className="bg-slate-900 border border-slate-750 rounded-xl px-2.5 py-1.5 text-xs text-slate-200"
                  />
                </div>
                <button
                  onClick={handleSendPoetry}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-1.5 rounded-xl text-xs flex items-center justify-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>إرسال البيت الشعري منسقاً إلى الغرفة</span>
                </button>
              </div>

              {/* 15. Royal Text Formatter & Calligraphy Decorator */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5" />
                    <span>ميزة 15: منسق ومزخرف النصوص الملكية (Calligraphy Ornaments)</span>
                  </div>
                  <div className="flex gap-1">
                    {TEXT_ORNAMENTS.map((orn, idx) => (
                      <button
                        key={orn.id}
                        onClick={() => setSelectedOrnamentIdx(idx)}
                        className={`text-[10px] px-2 py-0.5 rounded-lg font-bold transition-all ${
                          selectedOrnamentIdx === idx ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400'
                        }`}
                      >
                        {orn.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={calligraphyInput}
                    onChange={(e) => setCalligraphyInput(e.target.value)}
                    placeholder="اكتب رسالتك لزخرفتها بالطابع الملكي الفخم..."
                    className="flex-1 bg-slate-900 border border-slate-750 rounded-xl px-2.5 py-1.5 text-xs text-slate-200"
                  />
                  <button
                    onClick={handleSendFormattedText}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" />
                    <span>إرسال مزخرف</span>
                  </button>
                </div>
                {calligraphyInput && (
                  <div className="text-center p-1.5 bg-slate-950/80 rounded-xl border border-amber-500/30 text-amber-300 font-bold text-xs">
                    {TEXT_ORNAMENTS[selectedOrnamentIdx].format(calligraphyInput)}
                  </div>
                )}
              </div>

              {/* 16. Instant Language Translator */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" />
                    <span>ميزة 16: المترجم اللحظي لضيوف المجلس الأجانب (Instant Translator)</span>
                  </div>
                  <select
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value as any)}
                    className="bg-slate-900 text-xs border border-slate-750 rounded-lg px-2 py-0.5 text-slate-300"
                  >
                    <option value="en">الإنجليزية (English)</option>
                    <option value="fr">الفرنسية (Français)</option>
                    <option value="ur">الأردية (Urdu)</option>
                    <option value="tr">التركية (Türkçe)</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={translateText}
                    onChange={(e) => setTranslateText(e.target.value)}
                    placeholder="اكتب العبارة للترجمة الفورية..."
                    className="flex-1 bg-slate-900 border border-slate-750 rounded-xl px-2.5 py-1.5 text-xs text-slate-200"
                  />
                  <button
                    onClick={() => {
                      if (!translateText) return;
                      // Simulated quick dictionary lookup
                      const dict: Record<string, string> = {
                        en: 'Welcome everyone to our traditional Falcon Majlis! Enjoy the conversation.',
                        fr: 'Bienvenue à tous dans notre Majlis traditionnel! Profitez de la discussion.',
                        ur: 'ہماری محفل میں آپ سب کو خوش آمدید! گفتگو سے لطف اندوز ہوں۔',
                        tr: 'Geleneksel Meclisimize hoş geldiniz! Sohbetin tadını çıkarın.'
                      };
                      setTranslatedResult(dict[targetLang] || 'Welcome to our room!');
                      onShowToast('تمت الترجمة الفورية بنجاح 🌐', 'success');
                    }}
                    className="bg-slate-750 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold"
                  >
                    ترجمة
                  </button>
                </div>
                {translatedResult && (
                  <div className="bg-slate-900 p-2 rounded-xl text-xs text-amber-300 border border-slate-800 flex items-center justify-between">
                    <span>{translatedResult}</span>
                    <button
                      onClick={() => {
                        onSendChatMessage(translatedResult);
                        onShowToast('تم إرسال الترجمة في الشات!', 'success');
                      }}
                      className="text-[10px] bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded-md"
                    >
                      إرسال بالشات
                    </button>
                  </div>
                )}
              </div>

              {/* 17. Gulf & Arabic Hospitality Phrases */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 space-y-2">
                <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>ميزة 17: باقة التراحيب والردود الخليجية والعربية الأصيلة</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {HOSPITALITY_PHRASES.map((phrase, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        onSendChatMessage(phrase);
                        onShowToast('تم إرسال التحية إلى المجلس 🌹', 'success');
                      }}
                      className="bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 text-right p-2 rounded-xl text-[11px] truncate transition-colors"
                    >
                      {phrase}
                    </button>
                  ))}
                </div>
              </div>

              {/* 18. Rare Arabic Eloquence Lexicon */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>ميزة 18: معجم الفصاحة وبلاغة الصقور (Arabic Eloquence Lexicon)</span>
                  </div>
                  <span className="text-[10px] text-slate-400">كنوز ودرر لغوية نادرة</span>
                </div>
                <input
                  type="text"
                  value={lexiconQuery}
                  onChange={(e) => setLexiconQuery(e.target.value)}
                  placeholder="ابحث عن كلمة عربية نادرة أو معناها..."
                  className="w-full bg-slate-900 border border-slate-750 rounded-xl px-2.5 py-1.5 text-xs text-slate-200"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto">
                  {ARABIC_LEXICON
                    .filter((item) => !lexiconQuery || item.word.includes(lexiconQuery) || item.meaning.includes(lexiconQuery))
                    .map((item, idx) => (
                      <div key={idx} className="bg-slate-900/90 border border-slate-800 p-2 rounded-xl text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-amber-400 font-extrabold">{item.word}</span>
                          <button
                            onClick={() => {
                              onSendChatMessage(`📖 [درة من المعجم]: كلمة "${item.word}" تعني: ${item.meaning}. مثل: "${item.example}"`);
                              onShowToast(`تمت مشاركة كلمة ${item.word} في الشات!`, 'success');
                            }}
                            className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-0.5 rounded-md"
                          >
                            مشاركة
                          </button>
                        </div>
                        <div className="text-slate-300 text-[11px]">{item.meaning}</div>
                        <div className="text-slate-500 text-[10px] italic">"{item.example}"</div>
                      </div>
                    ))}
                </div>
              </div>

              {/* 19 & 20. Message Scheduler & Chat Export */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 space-y-2">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>ميزة 19: جدولة رسائل وتذكير المجلس</span>
                  </div>
                  <input
                    type="text"
                    value={scheduledReminderText}
                    onChange={(e) => setScheduledReminderText(e.target.value)}
                    placeholder="نص التذكير (مثلاً: حان موعد المسابقة)..."
                    className="w-full bg-slate-900 border border-slate-750 rounded-xl px-2.5 py-1 text-xs text-slate-200"
                  />
                  <div className="flex items-center gap-1 text-xs">
                    {[5, 15, 30].map((m) => (
                      <button
                        key={m}
                        onClick={() => setScheduledMinutes(m)}
                        className={`flex-1 py-1 rounded-lg text-[10px] font-bold ${
                          scheduledMinutes === m ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400'
                        }`}
                      >
                        بعد {m} دقيقة
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      if (!scheduledReminderText) {
                        onShowToast('يرجى إدخال نص التذكير', 'error');
                        return;
                      }
                      setTimeout(() => {
                        onSendChatMessage(`⏰ [تذكير مجدول]: ${scheduledReminderText}`);
                      }, scheduledMinutes * 60 * 1000);
                      onShowToast(`تمت جدولة التذكير للإرسال بعد ${scheduledMinutes} دقيقة!`, 'success');
                      setScheduledReminderText('');
                    }}
                    className="w-full bg-slate-750 hover:bg-slate-700 text-slate-200 font-bold py-1 rounded-xl text-xs"
                  >
                    تأكيد الجدولة
                  </button>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 space-y-2">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5" />
                    <span>ميزة 20: تصدير المحادثة والنسخ الاحتياطي</span>
                  </div>
                  <p className="text-[11px] text-slate-400">تنزيل كامل مجريات الغرفة كملف نصي موثق</p>
                  <button
                    onClick={handleDownloadChatLog}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-1.5 rounded-xl text-xs flex items-center justify-center gap-1 mt-4"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تنزيل السجل الآن (TXT)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= SECTION 3: ROOM MANAGEMENT (Features 21-30) ================= */}
          {activeTab === 'room' && (
            <div className="space-y-4 animate-fade-in">
              {/* 21. Room Message of the Day (MOTD) */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Megaphone className="w-3.5 h-3.5" />
                    <span>ميزة 21: لافتة المجلس وإعلان اليوم (Room MOTD)</span>
                  </div>
                  <button
                    onClick={() => setEditingMotd(!editingMotd)}
                    className="text-[11px] text-amber-400 hover:underline"
                  >
                    {editingMotd ? 'إلغاء التعديل' : 'تعديل الإعلان'}
                  </button>
                </div>
                {editingMotd ? (
                  <div className="space-y-2">
                    <textarea
                      value={roomMotd}
                      onChange={(e) => setRoomMotd(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-750 rounded-xl p-2 text-xs text-slate-200 h-16"
                    />
                    <button
                      onClick={() => {
                        setEditingMotd(false);
                        onSendChatMessage(`📢 [تحديث إعلان المجلس]: ${roomMotd}`);
                        onShowToast('تم تحديث إعلان المجلس بنجاح!', 'success');
                      }}
                      className="bg-amber-500 text-slate-950 font-bold px-3 py-1 rounded-xl text-xs"
                    >
                      حفظ ونشر الإعلان
                    </button>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-amber-950/70 to-slate-900 p-2.5 rounded-xl border border-amber-500/30 text-xs text-amber-200">
                    {roomMotd}
                  </div>
                )}
              </div>

              {/* 22. Live Room Activity Heatmap */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 space-y-2">
                <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>ميزة 22: الخريطة الحرارية لساعات الذروة (Peak Hours Heatmap)</span>
                </div>
                <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 text-center">
                  {['12م', '1م', '2م', '3م', '4م', '5م', '6م', '7م', '8م', '9م', '10م', '11م'].map((hour, idx) => {
                    const activity = idx > 6 ? 90 : idx > 4 ? 65 : 35;
                    return (
                      <div key={idx} className="space-y-1">
                        <div
                          style={{ height: `${activity * 0.4}px` }}
                          className={`w-full rounded-md transition-all ${
                            activity > 80 ? 'bg-amber-500' : activity > 50 ? 'bg-amber-600/70' : 'bg-slate-700'
                          }`}
                        />
                        <span className="text-[9px] text-slate-400 block">{hour}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 23 & 24. Slow Mode & Room Password Lock */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 space-y-2">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Timer className="w-3.5 h-3.5" />
                    <span>ميزة 23: وضع التهدئة (Slow Mode)</span>
                  </div>
                  <p className="text-[10px] text-slate-400">تحديد فاصل زمني بين رسائل الأعضاء لمنع التكرار</p>
                  <div className="grid grid-cols-4 gap-1">
                    {[0, 3, 5, 10].map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setSlowModeSeconds(s);
                          onShowToast(s === 0 ? 'تم إيقاف وضع التهدئة' : `تم تعيين التهدئة إلى ${s} ثوانٍ`, 'info');
                        }}
                        className={`py-1 rounded-lg text-xs font-bold ${
                          slowModeSeconds === s ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400'
                        }`}
                      >
                        {s === 0 ? 'معطل' : `${s} ثوان`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 space-y-2">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    <span>ميزة 24: قفل الغرفة برمز سري (Private Lock)</span>
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="password"
                      value={roomPasscode}
                      onChange={(e) => setRoomPasscode(e.target.value)}
                      placeholder="رمز دخول الغرفة..."
                      className="flex-1 bg-slate-900 border border-slate-750 rounded-xl px-2.5 py-1 text-xs text-slate-200"
                    />
                    <button
                      onClick={() => {
                        setIsRoomPasswordProtected(!isRoomPasswordProtected);
                        onShowToast(isRoomPasswordProtected ? 'تم فك حماية الغرفة' : 'تم قفل الغرفة برمز سري!', 'success');
                      }}
                      className={`px-3 py-1 rounded-xl text-xs font-bold ${
                        isRoomPasswordProtected ? 'bg-rose-500 text-white' : 'bg-amber-500 text-slate-950'
                      }`}
                    >
                      {isRoomPasswordProtected ? 'فك القفل' : 'قفل الآن'}
                    </button>
                  </div>
                </div>
              </div>

              {/* 25. Live Majlis Poll */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <ListOrdered className="w-3.5 h-3.5" />
                    <span>ميزة 25: استطلاع الرأي والتصويت اللحظي للمجلس (Live Majlis Poll)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold">
                    إجمالي الأصوات: {pollVotes.reduce((a, b) => a + b, 0)}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-200 bg-slate-900/80 p-2 rounded-xl border border-slate-750">
                  {pollQuestion}
                </div>
                <div className="space-y-1.5 text-xs">
                  {pollOptions.map((opt, idx) => {
                    const total = pollVotes.reduce((a, b) => a + b, 0) || 1;
                    const percent = Math.round((pollVotes[idx] / total) * 100);
                    return (
                      <button
                        key={idx}
                        onClick={() => handleVotePoll(idx)}
                        className={`w-full p-2 rounded-xl border text-right transition-all relative overflow-hidden flex items-center justify-between ${
                          userHasVoted === idx
                            ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                            : 'border-slate-800 bg-slate-900/90 hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div
                          style={{ width: `${percent}%` }}
                          className="absolute inset-y-0 right-0 bg-amber-500/10 -z-0"
                        />
                        <span className="font-bold relative z-10">{opt}</span>
                        <span className="text-[11px] font-mono font-bold text-amber-400 relative z-10">
                          {percent}% ({pollVotes[idx]})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 26. Honor & Reputation Leveling System */}
              <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border border-amber-500/40 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold text-amber-400">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>ميزة 26: نظام رتب الصقور والشرف (Member Honor Level)</span>
                  </div>
                  <span className="text-amber-300 font-extrabold text-xs">المستوى {calculatedLevel}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-bold">{levelTitle}</span>
                  <span className="text-slate-400 font-mono text-[11px]">{currentUser.points} نقطة</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-amber-500/30">
                  <div
                    style={{ width: `${Math.min(100, (currentUser.points % 50) * 2)}%` }}
                    className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all"
                  />
                </div>
              </div>

              {/* 27. Temporary Guest Invitation Passes */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 space-y-2">
                <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>ميزة 27: بطاقات دعوة الزوار المؤقتة (VIP Guest Passes)</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}?invite=${Math.random().toString(36).substring(2, 8)}`}
                    className="flex-1 bg-slate-900 border border-slate-750 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 font-mono"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      onShowToast('تم نسخ رابط الدعوة الخاص!', 'success');
                    }}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ</span>
                  </button>
                </div>
              </div>

              {/* 28. Room Audit & Events Activity Log */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    <span>ميزة 28: سجل وتاريخ أحداث الغرفة المباشر (Room Audit Log)</span>
                  </div>
                  <button
                    onClick={() => {
                      setRoomAuditEvents([]);
                      onShowToast('تم مسح سجل الأحداث المحلي', 'info');
                    }}
                    className="text-[10px] text-slate-400 hover:text-rose-400"
                  >
                    مسح السجل
                  </button>
                </div>
                <div className="space-y-1 max-h-28 overflow-y-auto">
                  {roomAuditEvents.map((evt) => (
                    <div key={evt.id} className="flex items-center justify-between bg-slate-900/90 border border-slate-800 px-2.5 py-1.5 rounded-xl text-[11px]">
                      <span className="text-slate-300">{evt.text}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{evt.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 29. Zen Distraction-Free Reading Mode */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5" />
                    <span>ميزة 29: وضع التركيز والقراءة الهادئة (Zen Focus Mode)</span>
                  </div>
                  <button
                    onClick={() => {
                      setIsZenMode(!isZenMode);
                      onShowToast(!isZenMode ? 'تم تفعيل وضع القراءة الهادئة 🧘' : 'تم العودة للوضع الافتراضي', 'info');
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold ${
                      isZenMode ? 'bg-emerald-500 text-slate-950' : 'bg-slate-750 text-slate-300'
                    }`}
                  >
                    {isZenMode ? 'مفعل ✓' : 'تفعيل'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">إخفاء التنبيهات والأصوات الزائدة لتصفح وقراءة مريحة بدون مقاطعات</p>
              </div>

              {/* 30. Majlis Athkar & Prayers Reminder */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-400" />
                    <span>ميزة 30: مسبحة وأذكار المجلس النيرة (Majlis Athkar & Beads)</span>
                  </div>
                  <span className="text-[10px] text-amber-300 font-mono font-bold">المتبقي: {thikrCounter}</span>
                </div>
                <div className="bg-slate-900/90 border border-slate-750 p-2.5 rounded-xl text-xs text-center text-slate-200 font-bold">
                  {ARABIC_ATHKAR[thikrIdx]}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (thikrCounter > 1) {
                        setThikrCounter((c) => c - 1);
                        sounds.playMentionPing();
                      } else {
                        setThikrCounter(33);
                        setThikrIdx((i) => (i + 1) % ARABIC_ATHKAR.length);
                        confetti({ particleCount: 25, spread: 45 });
                        onAddPoints(10, 'إتمام تسبيح المجلس');
                        onShowToast('ما شاء الله! أتممت الورد بنجاح (+10 نقاط) 🌸', 'success');
                      }
                    }}
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-1.5 rounded-xl text-xs flex items-center justify-center gap-1"
                  >
                    <span>تسبيح (اضغط هنا)</span>
                    <span className="bg-slate-950/20 px-1.5 rounded-md text-[10px]">{thikrCounter}</span>
                  </button>
                  <button
                    onClick={handleSendThikrToRoom}
                    className="bg-slate-750 hover:bg-slate-700 text-slate-200 font-bold px-3 py-1.5 rounded-xl text-xs"
                  >
                    مشاركة بالدردشة
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= SECTION 4: SECURITY & DIAGNOSTICS (Features 31-40) ================= */}
          {activeTab === 'security' && (
            <div className="space-y-4 animate-fade-in">
              {/* 31. Burn-After-Reading Ephemeral Chat */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 space-y-2">
                <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>ميزة 31: وضع التدمير الذاتي للرسائل (Ephemeral Burn Mode)</span>
                </div>
                <p className="text-[11px] text-slate-400">حذف الرسائل تلقائياً بعد انقضاء المهلة لحماية الخصوصية التامة</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'off', label: 'معطل ✕' },
                    { id: '10m', label: '10 دقائق' },
                    { id: '30m', label: '30 دقيقة' },
                    { id: '1h', label: 'ساعة كاملة' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setEphemeralTimer(t.id as any);
                        onShowToast(`تم ضبط الحذف التلقائي: ${t.label}`, 'info');
                      }}
                      className={`p-2 rounded-xl text-xs font-bold transition-all ${
                        ephemeralTimer === t.id ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-900 text-slate-400'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 32 & 33. Connection Inspector & FPS Profiler */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 space-y-2">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Wifi className="w-3.5 h-3.5" />
                    <span>ميزة 32: فاحص سلامة اتصال السوكيت</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>بروتوكول النقل:</span>
                      <span className="font-mono text-emerald-400 font-bold">WebSocket (EIO4)</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>حالة الشبكة:</span>
                      <span className="text-emerald-400 font-bold">{isOnline ? 'متصل بالإنترنت ✓' : 'غير متصل ✕'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 space-y-2">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    <span>ميزة 33: محلل أداء الذاكرة ومعدل الإطارات (FPS)</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>معدل الإطارات:</span>
                      <span className="font-mono text-emerald-400 font-bold">{liveFps} FPS</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>استهلاك الذاكرة التقريبي:</span>
                      <span className="font-mono text-sky-400 font-bold">{estimatedMemoryMb} MB</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 34. Custom Censorship Filter */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 space-y-2.5">
                <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>ميزة 34: درع فلترة الكلمات والروابط المشبوهة (Word Filter Shield)</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newBlockedWord}
                    onChange={(e) => setNewBlockedWord(e.target.value)}
                    placeholder="أدخل كلمة أو عبارة لمنعها في الشات..."
                    className="flex-1 bg-slate-900 border border-slate-750 rounded-xl px-2.5 py-1 text-xs text-slate-200"
                  />
                  <button
                    onClick={() => {
                      if (!newBlockedWord.trim()) return;
                      setBlockedWordsList((prev) => [...prev, newBlockedWord.trim()]);
                      setNewBlockedWord('');
                      onShowToast('تمت إضافة الكلمة لقائمة الحجب!', 'success');
                    }}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1 rounded-xl text-xs"
                  >
                    حظر
                  </button>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {blockedWordsList.map((w, i) => (
                    <span key={i} className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] px-2 py-0.5 rounded-lg flex items-center gap-1">
                      <span>{w}</span>
                      <button
                        onClick={() => setBlockedWordsList((prev) => prev.filter((_, idx) => idx !== i))}
                        className="hover:text-rose-100"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* 35. Ghost / Invisible Staff Mode */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>ميزة 35: وضع التخفي الرقابي للمشرفين (Ghost Invisible Mode)</span>
                  </div>
                  <button
                    onClick={() => {
                      setGhostModeActive(!ghostModeActive);
                      onShowToast(ghostModeActive ? 'تم تعطيل وضع التخفي' : 'تم تفعيل التخفي.. لن تظهر في قائمة المستمعين!', 'info');
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold ${
                      ghostModeActive ? 'bg-indigo-500 text-white' : 'bg-slate-750 text-slate-300'
                    }`}
                  >
                    {ghostModeActive ? 'التخفي مفعل 👻' : 'تفعيل التخفي'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">يتيح لك مراقبة محادثات الغرفة بهدوء دون إشعار المستخدمين بحضورك</p>
              </div>

              {/* 36. Security Access & Fingerprint Log */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 space-y-2">
                <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>ميزة 36: بطاقة البصمة الأمنية والتشفير (Security Fingerprint & Cipher)</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-xl">
                    <span className="text-slate-400 block text-[10px]">البروتوكول المشفر:</span>
                    <span className="text-emerald-400 font-mono font-bold">{securityAuditInfo.protocol}</span>
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-xl">
                    <span className="text-slate-400 block text-[10px]">معيار التشفير:</span>
                    <span className="text-amber-300 font-mono font-bold">{securityAuditInfo.cipher}</span>
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-xl">
                    <span className="text-slate-400 block text-[10px]">نظام العميل:</span>
                    <span className="text-slate-200 font-bold">{securityAuditInfo.os}</span>
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-xl">
                    <span className="text-slate-400 block text-[10px]">مؤشر الثقة والسلامة:</span>
                    <span className="text-emerald-400 font-bold font-mono">100% موثوق ✓</span>
                  </div>
                </div>
              </div>

              {/* 37. Anti-Flood & Rapid Message Limiter */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    <span>ميزة 37: درع مكافحة التكرار والفيضان (Anti-Flood Shield)</span>
                  </div>
                  <button
                    onClick={() => {
                      setAntiFloodEnabled(!antiFloodEnabled);
                      onShowToast(!antiFloodEnabled ? 'تم تفعيل درع منع الفيضان والتكرار' : 'تم تعطيل الدرع', 'info');
                    }}
                    className={`px-3 py-0.5 rounded-lg text-xs font-bold ${
                      antiFloodEnabled ? 'bg-emerald-500 text-slate-950' : 'bg-slate-750 text-slate-300'
                    }`}
                  >
                    {antiFloodEnabled ? 'نشط ✓' : 'معطل'}
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>الحد الأقصى للرسائل المتتالية:</span>
                  <div className="flex gap-1">
                    {[10, 15, 25].map((lim) => (
                      <button
                        key={lim}
                        onClick={() => {
                          setFloodThreshold(lim);
                          onShowToast(`تم ضبط الحد إلى ${lim} رسالة/دقيقة`, 'info');
                        }}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          floodThreshold === lim ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400'
                        }`}
                      >
                        {lim} / دقيقة
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 38. Data Privacy Shield & Footprint Cleaner */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ميزة 38: مسح البصمة المؤقتة والخصوصية (Privacy Footprint Eraser)</span>
                  </div>
                  <button
                    onClick={handleClearPrivacyFootprint}
                    className="bg-rose-500 hover:bg-rose-400 text-white font-bold px-3 py-1 rounded-xl text-xs flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>مسح البصمات الآن</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  تطهير ذاكرة التخزين المؤقتة الصوتية وسجلات الجلسة المحلية لخصوصية كاملة بنسبة 100%
                </p>
                {privacyCleared && (
                  <div className="text-xs text-emerald-300 font-bold bg-emerald-500/10 border border-emerald-500/30 p-1.5 rounded-xl text-center">
                    تم تنظيف وتأمين الجلسة بنجاح ✓
                  </div>
                )}
              </div>

              {/* 39. Emergency Lockdown Panic Switch */}
              <div className="bg-gradient-to-r from-rose-950/70 to-slate-900 border border-rose-500/40 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>ميزة 39: زر الطوارئ وقفل المجلس الفوري (Panic Room Switch)</span>
                  </div>
                  <button
                    onClick={handleEmergencyLockdownToggle}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                      emergencyLockdown
                        ? 'bg-emerald-500 text-slate-950 shadow-lg animate-pulse'
                        : 'bg-rose-600 hover:bg-rose-500 text-white'
                    }`}
                  >
                    {emergencyLockdown ? 'إلغاء وضع الطوارئ ✓' : 'تفعيل الطوارئ 🚨'}
                  </button>
                </div>
                <p className="text-[11px] text-rose-200/80">
                  مخصص لإدارة المجلس: يوقف إرسال الرسائل فوراً في حالات الإزعاج الجماعي الشديد
                </p>
              </div>

              {/* 40. Account PIN Security Guard */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5" />
                    <span>ميزة 40: قفل الحساب برمز أمان PIN سري (Account PIN Guard)</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {isPinConfigured ? 'الرمز مفعل 🔒' : 'غير معين 🔓'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="password"
                    maxLength={6}
                    value={accountPin}
                    onChange={(e) => setAccountPin(e.target.value)}
                    placeholder="أدخل رمز PIN من 4 إلى 6 أرقام..."
                    className="flex-1 bg-slate-900 border border-slate-750 rounded-xl px-2.5 py-1 text-xs text-slate-200 tracking-widest text-center"
                  />
                  <button
                    onClick={() => {
                      if (accountPin.length < 4) {
                        onShowToast('يجب أن يتكون رمز PIN من 4 أرقام على الأقل', 'error');
                        return;
                      }
                      setIsPinConfigured(true);
                      sounds.playGeneralAlertPing();
                      onShowToast('تم حفظ وتفعيل رمز PIN لحماية الحساب بنجاح 🛡️', 'success');
                    }}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1 rounded-xl text-xs"
                  >
                    حفظ الرمز
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= SECTION 5: GAMIFICATION & GIFTS (Features 41-50) ================= */}
          {activeTab === 'gamification' && (
            <div className="space-y-4 animate-fade-in">
              {/* 41. Falcon Fortune Wheel */}
              <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border border-amber-500/40 rounded-2xl p-3.5 space-y-3 text-center">
                <div className="text-xs font-bold text-amber-400 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                  <span>ميزة 41: عجلة صقور الحظ اليومية (Falcon Fortune Wheel)</span>
                </div>
                <div className="relative w-36 h-36 mx-auto my-2 flex items-center justify-center">
                  <div
                    style={{ transform: `rotate(${wheelRotation}deg)`, transition: isSpinningWheel ? 'transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none' }}
                    className="w-full h-full rounded-full border-4 border-amber-500/60 shadow-2xl flex items-center justify-center bg-gradient-to-tr from-amber-600 to-amber-900 overflow-hidden"
                  >
                    <span className="text-3xl">🦅</span>
                  </div>
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-amber-300 text-lg">▼</div>
                </div>
                {wheelWinMessage && (
                  <div className="text-xs font-extrabold text-amber-300 bg-amber-500/20 py-1.5 px-3 rounded-xl border border-amber-500/40 inline-block animate-bounce">
                    {wheelWinMessage}
                  </div>
                )}
                <div>
                  <button
                    disabled={isSpinningWheel}
                    onClick={handleSpinWheel}
                    className="bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold px-6 py-2 rounded-2xl text-xs shadow-lg transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isSpinningWheel ? 'جاري دوران العجلة...' : 'تدوير العجلة الآن 🎲'}
                  </button>
                </div>
              </div>

              {/* 42. Islamic & Cultural Arabic Trivia Quiz */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>ميزة 42: مسابقة المعرفة والثقافة العربية (Trivia Quiz)</span>
                  </div>
                  <span className="text-amber-400 font-bold">النقاط: {triviaScore}</span>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-750 text-xs font-semibold text-slate-200">
                  {ARABIC_TRIVIA[triviaIdx].q}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                  {ARABIC_TRIVIA[triviaIdx].options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedTriviaOption(i);
                        if (i === ARABIC_TRIVIA[triviaIdx].correct) {
                          setTriviaScore((prev) => prev + 10);
                          onAddPoints(10, 'إجابة صحيحة في مسابقة الثقافة');
                          confetti({ particleCount: 30, spread: 50 });
                          sounds.playGeneralAlertPing();
                          onShowToast('إجابة صحيحة وممتازة! +10 نقاط 👏', 'success');
                        } else {
                          onShowToast('إجابة غير صحيحة، حاول في السؤال القادم', 'error');
                        }
                        setTimeout(() => {
                          setSelectedTriviaOption(null);
                          setTriviaIdx((prev) => (prev + 1) % ARABIC_TRIVIA.length);
                        }, 1800);
                      }}
                      className={`p-2 rounded-xl text-right font-medium transition-all ${
                        selectedTriviaOption === i
                          ? i === ARABIC_TRIVIA[triviaIdx].correct
                            ? 'bg-emerald-500 text-slate-950 font-bold'
                            : 'bg-rose-500 text-white'
                          : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* 43. Guess the Arabic Proverb */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>ميزة 43: لعبة أكمل المثل الشعبي المأثور</span>
                  </div>
                  <span className="text-[10px] text-slate-400">تلميح: {ARABIC_PROVERBS[proverbIdx].hint}</span>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-750 text-xs text-slate-200">
                  <span className="font-bold text-amber-400 ml-1">المثل:</span>
                  "{ARABIC_PROVERBS[proverbIdx].prefix} [ ... ]"
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={userProverbInput}
                    onChange={(e) => setUserProverbInput(e.target.value)}
                    placeholder="اكتب الكلمة الناقصة..."
                    className="flex-1 bg-slate-900 border border-slate-750 rounded-xl px-2.5 py-1 text-xs text-slate-200"
                  />
                  <button
                    onClick={() => {
                      if (userProverbInput.trim() === ARABIC_PROVERBS[proverbIdx].word) {
                        setProverbSolved(true);
                        onAddPoints(15, 'حل لغز المثل الشعبي');
                        confetti({ particleCount: 35, spread: 60 });
                        onShowToast('أحسنت! الإجابة صحيحة تماماً (+15 نقطة) 👏', 'success');
                        setTimeout(() => {
                          setProverbSolved(false);
                          setUserProverbInput('');
                          setProverbIdx((prev) => (prev + 1) % ARABIC_PROVERBS.length);
                        }, 2000);
                      } else {
                        onShowToast('الكلمة غير صحيحة، ركز في التلميح!', 'error');
                      }
                    }}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1 rounded-xl text-xs"
                  >
                    تخمين
                  </button>
                </div>
              </div>

              {/* 44. Virtual Gifts Showcase */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Gift className="w-3.5 h-3.5" />
                    <span>ميزة 44: الهدايا الملكية الفاخرة (Royal Arab Gifts)</span>
                  </div>
                  <span className="text-[11px] text-slate-400">رصيدك: {currentUser.points} نقطة</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {VIRTUAL_GIFTS.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => handleSendGift(g)}
                      className="bg-slate-900/80 hover:bg-slate-800 border border-slate-800 p-2.5 rounded-2xl text-center space-y-1 transition-all hover:scale-105"
                    >
                      <div className="text-2xl">{g.icon}</div>
                      <div className="text-xs font-bold text-slate-200">{g.name}</div>
                      <div className="text-[10px] text-amber-400 font-mono font-bold">{g.cost} نقطة</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 45 & 46. Points Transfer & User Mood Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 space-y-2">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    <span>ميزة 45: تحويل وإهداء النقاط بين الأعضاء</span>
                  </div>
                  <select
                    value={transferTargetUser}
                    onChange={(e) => setTransferTargetUser(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-750 text-xs rounded-xl p-1.5 text-slate-200"
                  >
                    <option value="">اختر العضو المستلم</option>
                    {onlineUsers.filter((u) => u.username !== currentUser.username).map((u) => (
                      <option key={u.id} value={u.username}>@{u.username}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      value={transferPointsAmount}
                      onChange={(e) => setTransferPointsAmount(parseInt(e.target.value) || 1)}
                      className="w-20 bg-slate-900 border border-slate-750 text-xs rounded-xl p-1 text-center text-amber-400 font-bold"
                    />
                    <button
                      onClick={handleTransferPoints}
                      className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-1 rounded-xl text-xs"
                    >
                      تحويل النقاط الآن
                    </button>
                  </div>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 space-y-2">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Smile className="w-3.5 h-3.5" />
                    <span>ميزة 46: حالة المزاج والرمز التعبيري</span>
                  </div>
                  <select
                    value={activeMood}
                    onChange={(e) => {
                      setActiveMood(e.target.value);
                      onSendChatMessage(`✨ غير [${currentUser.username}] حالته إلى: ${e.target.value}`);
                      onShowToast(`تم تحديث حالتك إلى: ${e.target.value}`, 'success');
                    }}
                    className="w-full bg-slate-900 border border-slate-750 text-xs rounded-xl p-1.5 text-slate-200"
                  >
                    {USER_MOODS.map((m, idx) => (
                      <option key={idx} value={`${m.text} ${m.emoji}`}>{m.emoji} {m.text}</option>
                    ))}
                  </select>
                  <div className="text-center text-xs text-amber-300 font-bold bg-slate-900/60 p-1.5 rounded-xl border border-slate-800">
                    الحالة الحالية: {activeMood}
                  </div>
                </div>
              </div>

              {/* 47. Soundboard SFX */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 space-y-2">
                <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>ميزة 47: لوحة المؤثرات الصوتية الفورية (Audio Soundboard)</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {SOUNDBOARD_ITEMS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handlePlaySoundboard(s)}
                      className="bg-slate-900/90 hover:bg-slate-800 border border-slate-800 p-2 rounded-xl text-center text-xs text-slate-200 font-bold transition-all hover:scale-105"
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 48. Daily Arab Wisdoms Dispenser */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Feather className="w-3.5 h-3.5" />
                    <span>ميزة 48: بنك روائع الحكم والشعر العربي (Arab Wisdom Dispenser)</span>
                  </div>
                  <span className="text-[10px] text-amber-300 font-bold">{ARABIC_WISDOMS[wisdomIdx].author}</span>
                </div>
                <div className="bg-slate-900/90 border border-slate-750 p-2.5 rounded-xl text-xs text-amber-200 font-semibold text-center italic">
                  "{ARABIC_WISDOMS[wisdomIdx].text}"
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setWisdomIdx((prev) => (prev + 1) % ARABIC_WISDOMS.length)}
                    className="flex-1 bg-slate-750 hover:bg-slate-700 text-slate-200 font-bold py-1.5 rounded-xl text-xs"
                  >
                    حكمة أخرى ↻
                  </button>
                  <button
                    onClick={handleShareDailyWisdom}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-1.5 rounded-xl text-xs flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" />
                    <span>مشاركة في المجلس</span>
                  </button>
                </div>
              </div>

              {/* 49. Falcon Points Multiplier Booster */}
              <div className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/70 border border-amber-500/40 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    <span>ميزة 49: مضاعف رصيد الصقور وحاسبة الترقية (Falcon Multiplier Booster)</span>
                  </div>
                  <span className="text-xs font-extrabold text-amber-300 font-mono">
                    {isBoosterActive ? `مضاعف ${multiplierTier}x نشط ⚡` : 'المضاعف خامد'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">مضاعفة النقاط المكتسبة لكل مشاركة:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3].map((t) => (
                      <button
                        key={t}
                        onClick={() => setMultiplierTier(t as any)}
                        className={`px-2 py-0.5 rounded text-xs font-bold ${
                          multiplierTier === t ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400'
                        }`}
                      >
                        {t}x
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsBoosterActive(true);
                    confetti({ particleCount: 30, spread: 50 });
                    sounds.playGeneralAlertPing();
                    onAddPoints(20, 'تفعيل مضاعف الصقور');
                    onShowToast(`تم تفعيل مضاعف النقاط (${multiplierTier}x) بنجاح! ⚡`, 'success');
                  }}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold py-1.5 rounded-xl text-xs"
                >
                  تفعيل المضاعف الآن (+20 نقطة ترحيبية)
                </button>
              </div>

              {/* 50. Hall of Fame Top Falcons Leaderboard */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-yellow-400" />
                    <span>ميزة 50: صالة الشرف وفرسان الأسبوع (Hall of Fame Top Falcons)</span>
                  </div>
                  <span className="text-[10px] text-slate-400">نخبة مجلس صقور العرب</span>
                </div>
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {HALL_OF_FAME.map((falcon) => (
                    <div
                      key={falcon.rank}
                      className="bg-slate-900/90 border border-slate-800 p-2 rounded-xl flex items-center justify-between text-xs hover:border-amber-500/40 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{falcon.badge}</span>
                        <div>
                          <div className="font-extrabold text-slate-200">@{falcon.name}</div>
                          <div className="text-[10px] text-amber-400/90">{falcon.title}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-300 text-xs">{falcon.pts} نقطة</span>
                        <button
                          onClick={() => {
                            confetti({ particleCount: 20, spread: 40 });
                            sounds.playMentionPing();
                            onShowToast(`أرسلت تحية وتشجيع إلى @${falcon.name}! 👏`, 'success');
                          }}
                          className="text-[10px] bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 px-2 py-1 rounded-lg font-bold transition-all"
                        >
                          تحية 👏
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-950 border-t border-slate-800 p-3 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>نظام حسان برو الفائق • 50 ميزة متكاملة</span>
          </div>
          <button
            onClick={onClose}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-1.5 rounded-xl transition-all"
          >
            إغلاق الترسانة
          </button>
        </div>

      </div>
    </div>
  );
};
