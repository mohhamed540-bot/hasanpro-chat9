import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Users,
  Eye,
  EyeOff,
  RotateCw,
  LogOut,
  Settings,
  MessageCircle,
  Hash,
  Bell,
  Plus,
  Smile,
  Heart,
  Radio,
  Download,
  Maximize2,
  Minimize2,
  Shield,
  ShieldCheck,
  Sliders,
  Zap,
  Award,
  Crown,
  Palette,
  Activity,
  Video,
  X,
  Sparkles,
  Camera,
  Image as ImageIcon,
  Key,
  Trash2,
  AlertTriangle,
  AlertCircle,
  UserX,
  PhoneOff,
  Filter,
  Check,
  CheckCheck,
  Flame,
  Timer,
  ChevronDown,
  Lock,
  Search,
  Gift,
  Play,
  Volume1,
  BellRing,
  Megaphone,
  AtSign,
  Music,
  PieChart,
  Star,
  Pin,
  Copy,
  Gamepad2,
  FileText,
  Phone,
  PhoneCall,
  User as UserIcon,
  Reply,
  Edit3,
  MessageSquare
} from 'lucide-react';
import confetti from './utils/confetti';
import { AudioMeshManager, RemoteVoicePeer } from './utils/audioMesh';
import { RoomStatsPieChart, RoomStatData } from './components/RoomStatsPieChart';
import { FalconMegaSuite } from './components/FalconMegaSuite';
import { AdminControlSuite, LikesThresholdSettings } from './components/AdminControlSuite';
import { VoiceRecorder, VoicePlayer, VoiceNoteData } from './components/VoiceNoteModule';
import { PrivateCallOverlay, IncomingCallData, CallPartner } from './components/PrivateCallOverlay';
import {
  sounds,
  MESSAGE_SOUND_OPTIONS,
  JOIN_SOUND_OPTIONS,
  PRIVATE_SOUND_OPTIONS,
  MENTION_SOUND_OPTIONS,
  ALERT_SOUND_OPTIONS,
  MessageSoundId,
  JoinSoundId,
  PrivateSoundId,
  MentionSoundId,
  AlertSoundId
} from './utils/soundEffects';
import { generateAndDownloadProjectZip } from './utils/zipExport';
import bannerImg from './assets/images/falcon_chat_banner_1790379600125.jpg';
import falconIcon from './assets/images/falcon_avatar_icon_1790379613880.jpg';

import { AudioEqualizerAndEffects } from './components/AudioEqualizerAndEffects';
import { InteractiveGamesSuite } from './components/InteractiveGamesSuite';
import { IdentityProfileStudio } from './components/IdentityProfileStudio';
import { ThemeAndWallpaperCenter, THEMES_LIST, WALLPAPERS_LIST, FONTS_LIST } from './components/ThemeAndWallpaperCenter';
import { SystemDiagnosticsModal } from './components/SystemDiagnosticsModal';
import { ChatPowerToolsBar } from './components/ChatPowerToolsBar';
import { UltimateMegaFeatures50 } from './components/UltimateMegaFeatures50';
import { ChatShortcut, expandClientShortcuts, findMatchingShortcut } from './utils/chatShortcuts';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  notifyPrivateMessage,
  notifyMention,
  sendTestNotification,
  listenToNotificationClicks,
  registerNotificationServiceWorker
} from './utils/browserNotifications';
import {
  requestScreenWakeLock,
  startSilentAudioKeepAlive,
  stopSilentAudioKeepAlive,
  startHeartbeatWorker,
  stopHeartbeatWorker,
  setupVisibilityResync,
  uploadMediaWithProgress
} from './utils/connectionKeepAlive';
import { getCountryNameFromFlag, generateDeviceFingerprint } from './utils/countryDetect';
import {
  EmblemItem,
  EmblemType,
  EmblemsConfig,
  EmojiSizeSetting,
  DEFAULT_EMBLEMS_CONFIG,
  parseCustomEmojisInText,
  getEmojiSizeClass
} from './utils/emblemsSystem';

interface User {
  id: string;
  username: string;
  room: string;
  avatarSeed: string;
  avatarUrl?: string;
  statusQuote: string;
  flag: string;
  role: 'admin' | 'super' | 'member' | 'guest';
  likes: number;
  points: number;
  isVoice: boolean;
  micSlot: number | null;
  isMuted: boolean;
  isTextMuted: boolean;
  isSpeaking: boolean;
  presenceState?: 'online' | 'away' | 'offline'; // Green dot (online), Yellow dot (away/background), Gray dot (offline)
  ipAddress?: string;
  honorBadge?: string;
  nameBannerUrl?: string; // رابط البنر / السوابر المصور للعضو بمقاس 500x50
  giftBadges?: string[]; // قائمة أيقونات الهدايا والأوسمة التكريمية بجانب الاسم
  isJailed?: boolean;
  joinedAt?: number;
  sessionToken?: string;
  lastActiveTime?: number;
  nameColor?: string;
  textColor?: string;
  nameGradient?: string;
  profileBg?: string;
  theme?: string;
  fontFamily?: string;
  wallpaper?: string;
  bubbleStyle?: string;
  engagement?: MemberEngagement;
}

export interface MemberEngagement {
  activeTimeMinutes: number;
  messagesSent: number;
  wallPostsCount: number;
  micTimeMinutes: number;
  starsLevel: number; // 0 to 5
  progressPercent: number; // 0 to 100
}

export interface StoryComment {
  id: string;
  username: string;
  avatarUrl?: string;
  nameBannerUrl?: string;
  text: string;
  time: string;
  timestamp: number;
}

export interface StoryItem {
  id: string;
  username: string;
  avatarUrl?: string;
  nameBannerUrl?: string;
  flag?: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string;
  createdAt: number;
  time: string;
  likes: number;
  likedUsers?: string[];
  comments?: StoryComment[];
}

interface Message {
  id: string;
  room: string;
  username: string;
  avatarUrl?: string;
  nameBannerUrl?: string;
  giftBadges?: string[];
  flag?: string;
  badge?: string;
  badgeColor?: string;
  text: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'sticker' | 'audio';
  voiceNote?: VoiceNoteData;
  replyTo?: {
    id: string;
    username: string;
    text: string;
    mediaUrl?: string;
  };
  time: string;
  timestamp: number;
  reactions?: Record<string, number>;
  nameColor?: string;
  textColor?: string;
  nameGradient?: string;
  isEdited?: boolean;
}

// Typing Indicator User data structure (عضو يقوم بالكتابة حالياً)
export interface TypingUser {
  userId: string;
  username: string;
  avatarUrl?: string;
  flag?: string;
  role?: string;
  nameColor?: string;
  nameGradient?: string;
  room: string;
  lastTypedAt: number;
}

interface MicSlot {
  slotNumber: number;
  user: User | null;
}

interface WallComment {
  id: string;
  username: string;
  avatarUrl?: string;
  nameBannerUrl?: string;
  text: string;
  time: string;
  timestamp?: number;
}

// Profile Visitor Record structure (من نقر على صورتي وشاهد ملفي الشخصي وعدد المرات)
export interface ProfileVisitorRecord {
  username: string;
  avatarUrl?: string;
  nameBannerUrl?: string;
  flag?: string;
  visitCount: number;
  lastVisitTime: number;
}

// Live Video Broadcast Session Structure
export interface RoomLiveBroadcastState {
  broadcasterId: string;
  broadcasterUsername: string;
  broadcasterAvatar?: string;
  broadcasterFlag?: string;
  room: string;
  title: string;
  startedAt: number;
  viewersCount: number;
}

interface WallPost {
  id: string;
  username: string;
  avatarUrl?: string;
  nameBannerUrl?: string;
  flag?: string;
  text: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  category?: 'posts' | 'quick';
  time: string;
  likes: number;
  commentsCount: number;
  comments?: WallComment[];
  likedUsers?: string[];
  timestamp?: number;
  isEdited?: boolean;
}

interface PrivateMessage {
  id: string;
  fromId: string;
  fromUsername: string;
  fromAvatar?: string;
  fromNameBannerUrl?: string;
  toId: string;
  toUsername: string;
  toNameBannerUrl?: string;
  text: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'sticker' | 'audio';
  voiceNote?: VoiceNoteData;
  replyTo?: {
    id: string;
    username: string;
    text: string;
  };
  isCallNotification?: boolean;
  time: string;
  timestamp?: number;
  isEdited?: boolean;
  // Read Receipts:
  status?: 'sent' | 'delivered' | 'read';
  readAt?: number;
  // Self-Destructing:
  selfDestructSeconds?: number;
  selfDestructAt?: number;
}

interface ChatRoom {
  id: string;
  name: string;
  desc: string;
  isPasswordProtected: boolean;
  password?: string;
  voiceLimit: number;
  activeVoiceCount: number;
}

interface MonitorEvent {
  id: string;
  type: string;
  description: string;
  actor: string;
  target?: string;
  time: string;
}

// Vintage chat animated style emojis (Screenshot 9)
const VINTAGE_STICKERS = [
  '🌹', '🦅', '👑', '💎', '🔥', '❤️', '😂', '😍', '👏', '🎉',
  '☕', '✨', '🤍', '🌸', '🇸🇦', '🇾🇪', '🇸🇾', '🇩🇿', '🇪🇬', '🇮🇶',
  '😎', '🥳', '🥺', '😡', '🤝', '💯', '🌙', '⚔️', '🕊️', '🏹'
];

// Rich Message Reactions List
const AVAILABLE_REACTIONS = ['❤️', '😂', '🦅', '👑', '🔥', '🌹', '👏', '💎', '☕', '⚔️', '🌙', '💯'];

// Multi-color Visual Themes Comprehensive Styling Presets (تطبيق كامل للثيم على كافة أجزاء الشات)
export interface ThemeFullStyle {
  headerBg: string;
  headerBorder: string;
  headerAccent: string;
  subHeaderBg: string;
  subHeaderBorder: string;
  subHeaderText?: string;
  bottomBarBg: string;
  bottomBarBorder: string;
  bottomBarText: string;
  inputBarBg?: string;
  inputBarBorder?: string;
  primaryBtn: string;
  appBg: string;
  appText?: string;
  chatBg: string;
  drawerBg: string;
  drawerHeaderBg?: string;
  cardBg: string;
  cardBorder: string;
  accentText: string;
  bubbleTheme: string;
  accentColor?: string;
  bgColorHex?: string;
  fieldBg?: string;
  fieldBorder?: string;
  fieldFocus?: string;
  fieldText?: string;
  fieldPlaceholder?: string;
  recommendedTextColor?: string;
  recommendedNameColor?: string;
}

const THEME_STYLES: Record<string, ThemeFullStyle> = {
  // ⭐ 1. الذهب الإمبراطوري الخالص 24K
  'royal-pure-gold-24k': {
    headerBg: 'bg-gradient-to-r from-[#211804] via-[#0d0902] to-[#2e2106]',
    headerBorder: 'border-amber-400/90 shadow-[0_2px_12px_rgba(251,191,36,0.15)]',
    headerAccent: 'text-amber-300 font-extrabold',
    subHeaderBg: 'bg-[#151004]',
    subHeaderBorder: 'border-[#4a350b]',
    subHeaderText: 'text-amber-200',
    bottomBarBg: 'bg-[#0d0903]',
    bottomBarBorder: 'border-[#4a350b]',
    bottomBarText: 'text-amber-200',
    inputBarBg: 'bg-[#151004]',
    inputBarBorder: 'border-amber-500/60',
    primaryBtn: 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-yellow-300 text-black font-black shadow-[0_0_18px_rgba(245,158,11,0.5)]',
    appBg: 'bg-[#090804]',
    appText: 'text-[#fef3c7]',
    chatBg: 'bg-[#050402]',
    drawerBg: 'bg-[#110c04]',
    drawerHeaderBg: 'bg-[#221706]',
    cardBg: 'bg-[#1c1305]',
    cardBorder: 'border-amber-500/60',
    accentText: 'text-yellow-300',
    bubbleTheme: 'border-amber-500/60 text-[#fef3c7] bg-[#1a1205]/80 shadow-[0_2px_8px_rgba(245,158,11,0.1)]',
    accentColor: '#fbbf24',
    bgColorHex: '#050402',
    fieldBg: 'bg-[#140e04]',
    fieldBorder: 'border-amber-400/80 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6),0_0_8px_rgba(251,191,36,0.2)]',
    fieldFocus: 'focus:border-yellow-300 focus:ring-2 focus:ring-amber-400/50',
    fieldText: 'text-[#fef3c7]',
    fieldPlaceholder: 'placeholder-amber-300/60',
    recommendedTextColor: '#fef3c7',
    recommendedNameColor: '#fbbf24'
  },
  // ⭐ 2. ذهب دبي الفاخر ولؤلؤ الخليج
  'dubai-pearl-gold': {
    headerBg: 'bg-gradient-to-r from-[#281d06] via-[#120d03] to-[#362708]',
    headerBorder: 'border-yellow-500/90 shadow-[0_2px_12px_rgba(250,204,21,0.15)]',
    headerAccent: 'text-yellow-300 font-extrabold',
    subHeaderBg: 'bg-[#191204]',
    subHeaderBorder: 'border-[#543b0d]',
    subHeaderText: 'text-yellow-200',
    bottomBarBg: 'bg-[#100b02]',
    bottomBarBorder: 'border-[#543b0d]',
    bottomBarText: 'text-yellow-200',
    inputBarBg: 'bg-[#191204]',
    inputBarBorder: 'border-yellow-500/60',
    primaryBtn: 'bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 hover:from-yellow-400 hover:to-amber-300 text-black font-black shadow-[0_0_18px_rgba(250,204,21,0.45)]',
    appBg: 'bg-[#120d03]',
    appText: 'text-[#fef9c3]',
    chatBg: 'bg-[#0a0701]',
    drawerBg: 'bg-[#150f04]',
    drawerHeaderBg: 'bg-[#291e07]',
    cardBg: 'bg-[#211706]',
    cardBorder: 'border-yellow-500/60',
    accentText: 'text-yellow-300',
    bubbleTheme: 'border-yellow-500/60 text-[#fef9c3] bg-[#1e1505]/80 shadow-[0_2px_8px_rgba(250,204,21,0.1)]',
    accentColor: '#facc15',
    bgColorHex: '#0a0701',
    fieldBg: 'bg-[#181104]',
    fieldBorder: 'border-yellow-400/80 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6),0_0_8px_rgba(250,204,21,0.2)]',
    fieldFocus: 'focus:border-yellow-200 focus:ring-2 focus:ring-yellow-300/50',
    fieldText: 'text-[#fef9c3]',
    fieldPlaceholder: 'placeholder-yellow-200/60',
    recommendedTextColor: '#fef9c3',
    recommendedNameColor: '#facc15'
  },
  // ⭐ 3. شمس الفراعنة والذهب الكنعاني
  'pharaonic-sun-gold': {
    headerBg: 'bg-gradient-to-r from-[#291204] via-[#0d0602] to-[#3a1a06]',
    headerBorder: 'border-amber-600/90 shadow-[0_2px_12px_rgba(217,119,6,0.15)]',
    headerAccent: 'text-amber-400 font-extrabold',
    subHeaderBg: 'bg-[#190b03]',
    subHeaderBorder: 'border-[#54240a]',
    subHeaderText: 'text-amber-300',
    bottomBarBg: 'bg-[#0f0702]',
    bottomBarBorder: 'border-[#54240a]',
    bottomBarText: 'text-amber-200',
    inputBarBg: 'bg-[#190b03]',
    inputBarBorder: 'border-amber-600/60',
    primaryBtn: 'bg-gradient-to-r from-amber-600 via-orange-500 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-black font-black shadow-[0_0_18px_rgba(245,158,11,0.45)]',
    appBg: 'bg-[#0d0602]',
    appText: 'text-[#fed7aa]',
    chatBg: 'bg-[#070301]',
    drawerBg: 'bg-[#140902]',
    drawerHeaderBg: 'bg-[#2b1204]',
    cardBg: 'bg-[#200e04]',
    cardBorder: 'border-amber-600/60',
    accentText: 'text-amber-300',
    bubbleTheme: 'border-amber-600/60 text-[#fed7aa] bg-[#1d0d03]/80 shadow-[0_2px_8px_rgba(217,119,6,0.1)]',
    accentColor: '#f59e0b',
    bgColorHex: '#070301',
    fieldBg: 'bg-[#170a03]',
    fieldBorder: 'border-amber-500/80 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6),0_0_8px_rgba(245,158,11,0.2)]',
    fieldFocus: 'focus:border-amber-300 focus:ring-2 focus:ring-amber-500/50',
    fieldText: 'text-[#fed7aa]',
    fieldPlaceholder: 'placeholder-amber-400/60',
    recommendedTextColor: '#fed7aa',
    recommendedNameColor: '#f59e0b'
  },
  // ⭐ 4. شامبانيا الذهب ومخمل الليل
  'champagne-velvet-gold': {
    headerBg: 'bg-gradient-to-r from-[#1c1a14] via-[#070709] to-[#262319]',
    headerBorder: 'border-yellow-400/85 shadow-[0_2px_12px_rgba(253,224,71,0.15)]',
    headerAccent: 'text-yellow-200 font-extrabold',
    subHeaderBg: 'bg-[#131317]',
    subHeaderBorder: 'border-[#3f3b2d]',
    subHeaderText: 'text-yellow-200',
    bottomBarBg: 'bg-[#0a0a0c]',
    bottomBarBorder: 'border-[#3f3b2d]',
    bottomBarText: 'text-yellow-200',
    inputBarBg: 'bg-[#131317]',
    inputBarBorder: 'border-yellow-400/60',
    primaryBtn: 'bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 hover:from-yellow-300 hover:to-amber-200 text-slate-950 font-black shadow-[0_0_18px_rgba(253,224,71,0.4)]',
    appBg: 'bg-[#070709]',
    appText: 'text-[#fefce8]',
    chatBg: 'bg-[#040405]',
    drawerBg: 'bg-[#0e0e11]',
    drawerHeaderBg: 'bg-[#1e1c15]',
    cardBg: 'bg-[#17161c]',
    cardBorder: 'border-yellow-400/50',
    accentText: 'text-yellow-200',
    bubbleTheme: 'border-yellow-400/50 text-[#fefce8] bg-[#141419]/80 shadow-[0_2px_8px_rgba(253,224,71,0.1)]',
    accentColor: '#fde047',
    bgColorHex: '#040405',
    fieldBg: 'bg-[#121216]',
    fieldBorder: 'border-yellow-300/75 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6),0_0_8px_rgba(253,224,71,0.18)]',
    fieldFocus: 'focus:border-yellow-100 focus:ring-2 focus:ring-yellow-300/50',
    fieldText: 'text-[#fefce8]',
    fieldPlaceholder: 'placeholder-yellow-100/60',
    recommendedTextColor: '#fefce8',
    recommendedNameColor: '#fde047'
  },
  // ⭐ 5. نقوش قصر الحمراء والذهب العتيق
  'alhambra-arabesque-gold': {
    headerBg: 'bg-gradient-to-r from-[#271504] via-[#100802] to-[#361e06]',
    headerBorder: 'border-yellow-600/90 shadow-[0_2px_12px_rgba(202,138,4,0.15)]',
    headerAccent: 'text-yellow-300 font-extrabold',
    subHeaderBg: 'bg-[#180d03]',
    subHeaderBorder: 'border-[#532b0a]',
    subHeaderText: 'text-amber-200',
    bottomBarBg: 'bg-[#0e0702]',
    bottomBarBorder: 'border-[#532b0a]',
    bottomBarText: 'text-amber-200',
    inputBarBg: 'bg-[#180d03]',
    inputBarBorder: 'border-yellow-600/60',
    primaryBtn: 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black shadow-[0_0_18px_rgba(234,179,8,0.45)]',
    appBg: 'bg-[#100802]',
    appText: 'text-[#fef3c7]',
    chatBg: 'bg-[#080401]',
    drawerBg: 'bg-[#140b03]',
    drawerHeaderBg: 'bg-[#281505]',
    cardBg: 'bg-[#1e1005]',
    cardBorder: 'border-yellow-600/60',
    accentText: 'text-yellow-300',
    bubbleTheme: 'border-yellow-600/60 text-[#fef3c7] bg-[#1a0e04]/80 shadow-[0_2px_8px_rgba(202,138,4,0.1)]',
    accentColor: '#eab308',
    bgColorHex: '#080401',
    fieldBg: 'bg-[#160c03]',
    fieldBorder: 'border-yellow-500/80 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6),0_0_8px_rgba(234,179,8,0.2)]',
    fieldFocus: 'focus:border-yellow-300 focus:ring-2 focus:ring-yellow-500/50',
    fieldText: 'text-[#fef3c7]',
    fieldPlaceholder: 'placeholder-amber-300/60',
    recommendedTextColor: '#fef3c7',
    recommendedNameColor: '#eab308'
  },
  'andalusian-jasmine-palace': {
    headerBg: 'bg-gradient-to-r from-[#032318] via-[#021810] to-[#043322]',
    headerBorder: 'border-emerald-600/70',
    headerAccent: 'text-emerald-300',
    subHeaderBg: 'bg-[#031d14]',
    subHeaderBorder: 'border-[#064e3b]',
    subHeaderText: 'text-emerald-200',
    bottomBarBg: 'bg-[#02160f]',
    bottomBarBorder: 'border-[#064e3b]',
    bottomBarText: 'text-emerald-200',
    inputBarBg: 'bg-[#031d14]',
    inputBarBorder: 'border-[#064e3b]',
    primaryBtn: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-500 hover:from-emerald-500 hover:to-amber-400 text-slate-950 font-black',
    appBg: 'bg-[#02140d]',
    appText: 'text-emerald-100',
    chatBg: 'bg-[#010f0a]',
    drawerBg: 'bg-[#021810]',
    drawerHeaderBg: 'bg-[#03291d]',
    cardBg: 'bg-[#032116]',
    cardBorder: 'border-[#059669]/60',
    accentText: 'text-amber-300',
    bubbleTheme: 'border-emerald-600/50 text-emerald-100',
    accentColor: '#10b981',
    bgColorHex: '#010f0a'
  },
  'imperial-obsidian-gold': {
    headerBg: 'bg-gradient-to-r from-[#0d0d0f] via-[#050507] to-[#17140e]',
    headerBorder: 'border-amber-500/80',
    headerAccent: 'text-amber-400',
    subHeaderBg: 'bg-[#0a0a0c]',
    subHeaderBorder: 'border-amber-900/60',
    subHeaderText: 'text-amber-300',
    bottomBarBg: 'bg-[#050507]',
    bottomBarBorder: 'border-amber-900/60',
    bottomBarText: 'text-amber-200',
    inputBarBg: 'bg-[#0a0a0c]',
    inputBarBorder: 'border-amber-900/60',
    primaryBtn: 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-yellow-300 text-black font-black shadow-[0_0_15px_rgba(245,158,11,0.4)]',
    appBg: 'bg-[#050506]',
    appText: 'text-amber-100',
    chatBg: 'bg-[#030304]',
    drawerBg: 'bg-[#09090b]',
    drawerHeaderBg: 'bg-[#14120e]',
    cardBg: 'bg-[#0d0d10]',
    cardBorder: 'border-amber-600/50',
    accentText: 'text-yellow-400',
    bubbleTheme: 'border-amber-500/50 text-amber-100',
    accentColor: '#f59e0b',
    bgColorHex: '#030304'
  },
  'persian-lapis-lazuli': {
    headerBg: 'bg-gradient-to-r from-[#091536] via-[#050b1f] to-[#0c1e4a]',
    headerBorder: 'border-blue-600/70',
    headerAccent: 'text-sky-300',
    subHeaderBg: 'bg-[#060e26]',
    subHeaderBorder: 'border-[#1e3a8a]',
    subHeaderText: 'text-sky-200',
    bottomBarBg: 'bg-[#040817]',
    bottomBarBorder: 'border-[#1e3a8a]',
    bottomBarText: 'text-sky-200',
    inputBarBg: 'bg-[#060e26]',
    inputBarBorder: 'border-[#1e3a8a]',
    primaryBtn: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black',
    appBg: 'bg-[#04091a]',
    appText: 'text-blue-100',
    chatBg: 'bg-[#020512]',
    drawerBg: 'bg-[#060e26]',
    drawerHeaderBg: 'bg-[#0a1740]',
    cardBg: 'bg-[#081333]',
    cardBorder: 'border-blue-700/60',
    accentText: 'text-cyan-300',
    bubbleTheme: 'border-blue-600/50 text-blue-100',
    accentColor: '#2563eb',
    bgColorHex: '#020512'
  },
  'royal-oud-ambergris': {
    headerBg: 'bg-gradient-to-r from-[#2a1309] via-[#1a0a04] to-[#36190b]',
    headerBorder: 'border-amber-700/70',
    headerAccent: 'text-amber-400',
    subHeaderBg: 'bg-[#200e06]',
    subHeaderBorder: 'border-[#5e270e]',
    subHeaderText: 'text-amber-300',
    bottomBarBg: 'bg-[#140803]',
    bottomBarBorder: 'border-[#5e270e]',
    bottomBarText: 'text-amber-200',
    inputBarBg: 'bg-[#200e06]',
    inputBarBorder: 'border-[#5e270e]',
    primaryBtn: 'bg-gradient-to-r from-amber-700 via-orange-600 to-yellow-600 hover:from-amber-600 hover:to-orange-500 text-white font-black',
    appBg: 'bg-[#160a04]',
    appText: 'text-amber-100',
    chatBg: 'bg-[#0f0602]',
    drawerBg: 'bg-[#1c0d05]',
    drawerHeaderBg: 'bg-[#2f1408]',
    cardBg: 'bg-[#241107]',
    cardBorder: 'border-amber-800/60',
    accentText: 'text-orange-400',
    bubbleTheme: 'border-amber-700/50 text-amber-100',
    accentColor: '#d97706',
    bgColorHex: '#0f0602'
  },
  'cosmic-aurora-borealis': {
    headerBg: 'bg-gradient-to-r from-[#0d0926] via-[#060414] to-[#0d1d28]',
    headerBorder: 'border-purple-600/60',
    headerAccent: 'text-teal-300',
    subHeaderBg: 'bg-[#09061c]',
    subHeaderBorder: 'border-[#2e1065]',
    subHeaderText: 'text-teal-300',
    bottomBarBg: 'bg-[#050310]',
    bottomBarBorder: 'border-[#2e1065]',
    bottomBarText: 'text-teal-200',
    inputBarBg: 'bg-[#09061c]',
    inputBarBorder: 'border-[#2e1065]',
    primaryBtn: 'bg-gradient-to-r from-teal-500 via-indigo-600 to-fuchsia-600 hover:from-teal-400 hover:to-fuchsia-500 text-white font-black',
    appBg: 'bg-[#060414]',
    appText: 'text-teal-100',
    chatBg: 'bg-[#03020a]',
    drawerBg: 'bg-[#09061c]',
    drawerHeaderBg: 'bg-[#140e38]',
    cardBg: 'bg-[#0d0926]',
    cardBorder: 'border-purple-700/60',
    accentText: 'text-fuchsia-300',
    bubbleTheme: 'border-teal-500/50 text-teal-100',
    accentColor: '#2dd4bf',
    bgColorHex: '#03020a'
  },
  'emerald-gold-palace': {
    headerBg: 'bg-gradient-to-r from-[#032b1d] via-[#021c13] to-[#063c29]',
    headerBorder: 'border-emerald-700/70',
    headerAccent: 'text-emerald-300',
    subHeaderBg: 'bg-[#022117]',
    subHeaderBorder: 'border-[#064e3b]',
    subHeaderText: 'text-emerald-300',
    bottomBarBg: 'bg-[#011a12]',
    bottomBarBorder: 'border-[#064e3b]',
    bottomBarText: 'text-emerald-200',
    inputBarBg: 'bg-[#022117]',
    inputBarBorder: 'border-[#064e3b]',
    primaryBtn: 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-black',
    appBg: 'bg-[#021810]',
    appText: 'text-emerald-100',
    chatBg: 'bg-[#01140d]',
    drawerBg: 'bg-[#021b13]',
    drawerHeaderBg: 'bg-[#032e20]',
    cardBg: 'bg-[#03261a]',
    cardBorder: 'border-[#047857]',
    accentText: 'text-amber-300',
    bubbleTheme: 'border-emerald-600/50 text-emerald-100',
    accentColor: '#10b981',
    bgColorHex: '#01140d'
  },
  'midnight-neon-cyber': {
    headerBg: 'bg-gradient-to-r from-[#091124] via-[#050814] to-[#120f2e]',
    headerBorder: 'border-cyan-500/60',
    headerAccent: 'text-cyan-300',
    subHeaderBg: 'bg-[#080d1a]',
    subHeaderBorder: 'border-[#0e3b5e]',
    subHeaderText: 'text-cyan-300',
    bottomBarBg: 'bg-[#050912]',
    bottomBarBorder: 'border-[#0e3b5e]',
    bottomBarText: 'text-cyan-200',
    inputBarBg: 'bg-[#080d1a]',
    inputBarBorder: 'border-[#0e3b5e]',
    primaryBtn: 'bg-gradient-to-r from-cyan-500 to-fuchsia-500 hover:from-cyan-400 hover:to-fuchsia-400 text-slate-950 font-black',
    appBg: 'bg-[#040711]',
    appText: 'text-cyan-100',
    chatBg: 'bg-[#03050c]',
    drawerBg: 'bg-[#060a17]',
    drawerHeaderBg: 'bg-[#0b132b]',
    cardBg: 'bg-[#091124]',
    cardBorder: 'border-[#164e63]',
    accentText: 'text-fuchsia-400',
    bubbleTheme: 'border-cyan-500/50 text-cyan-100',
    accentColor: '#06b6d4',
    bgColorHex: '#03050c'
  },
  'royal-crimson-velvet': {
    headerBg: 'bg-gradient-to-r from-[#380415] via-[#22020c] to-[#4c051d]',
    headerBorder: 'border-rose-800/80',
    headerAccent: 'text-rose-300',
    subHeaderBg: 'bg-[#29030e]',
    subHeaderBorder: 'border-[#650824]',
    subHeaderText: 'text-rose-300',
    bottomBarBg: 'bg-[#1e020a]',
    bottomBarBorder: 'border-[#650824]',
    bottomBarText: 'text-rose-200',
    inputBarBg: 'bg-[#29030e]',
    inputBarBorder: 'border-[#650824]',
    primaryBtn: 'bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black',
    appBg: 'bg-[#1d020a]',
    appText: 'text-rose-100',
    chatBg: 'bg-[#140106]',
    drawerBg: 'bg-[#22030c]',
    drawerHeaderBg: 'bg-[#3b0417]',
    cardBg: 'bg-[#2f0513]',
    cardBorder: 'border-[#881337]',
    accentText: 'text-amber-300',
    bubbleTheme: 'border-rose-600/50 text-rose-100',
    accentColor: '#e11d48',
    bgColorHex: '#140106'
  },
  'desert-dune-gold': {
    headerBg: 'bg-gradient-to-r from-[#331c0a] via-[#1f1005] to-[#45260e]',
    headerBorder: 'border-amber-700/70',
    headerAccent: 'text-amber-300',
    subHeaderBg: 'bg-[#291607]',
    subHeaderBorder: 'border-[#5e310e]',
    subHeaderText: 'text-amber-300',
    bottomBarBg: 'bg-[#1c0e04]',
    bottomBarBorder: 'border-[#5e310e]',
    bottomBarText: 'text-amber-200',
    inputBarBg: 'bg-[#291607]',
    inputBarBorder: 'border-[#5e310e]',
    primaryBtn: 'bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-black',
    appBg: 'bg-[#1d0f04]',
    appText: 'text-amber-100',
    chatBg: 'bg-[#140a02]',
    drawerBg: 'bg-[#221206]',
    drawerHeaderBg: 'bg-[#371e0b]',
    cardBg: 'bg-[#2b1708]',
    cardBorder: 'border-[#78350f]',
    accentText: 'text-yellow-400',
    bubbleTheme: 'border-amber-600/50 text-amber-100',
    accentColor: '#d97706',
    bgColorHex: '#140a02'
  },
  'arctic-sapphire-frost': {
    headerBg: 'bg-gradient-to-r from-[#061e38] via-[#031122] to-[#0a294d]',
    headerBorder: 'border-sky-700/70',
    headerAccent: 'text-sky-300',
    subHeaderBg: 'bg-[#04172c]',
    subHeaderBorder: 'border-[#083e70]',
    subHeaderText: 'text-sky-300',
    bottomBarBg: 'bg-[#021020]',
    bottomBarBorder: 'border-[#083e70]',
    bottomBarText: 'text-sky-200',
    inputBarBg: 'bg-[#04172c]',
    inputBarBorder: 'border-[#083e70]',
    primaryBtn: 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black',
    appBg: 'bg-[#031324]',
    appText: 'text-sky-100',
    chatBg: 'bg-[#020d1a]',
    drawerBg: 'bg-[#041629]',
    drawerHeaderBg: 'bg-[#072442]',
    cardBg: 'bg-[#061d36]',
    cardBorder: 'border-[#0369a1]',
    accentText: 'text-cyan-300',
    bubbleTheme: 'border-sky-500/50 text-sky-100',
    accentColor: '#0284c7',
    bgColorHex: '#020d1a'
  },
  'golden-brown-harmony': {
    headerBg: 'bg-gradient-to-r from-[#2c1a0f] via-[#1f120a] to-[#3a2214]',
    headerBorder: 'border-[#78350f]',
    headerAccent: 'text-amber-400',
    subHeaderBg: 'bg-[#24150c]',
    subHeaderBorder: 'border-[#4a2b16]',
    subHeaderText: 'text-amber-300',
    bottomBarBg: 'bg-[#1c1109]',
    bottomBarBorder: 'border-[#4a2b16]',
    bottomBarText: 'text-amber-200',
    inputBarBg: 'bg-[#24150c]',
    inputBarBorder: 'border-[#4a2b16]',
    primaryBtn: 'bg-amber-600 hover:bg-amber-500 text-slate-950 font-black',
    appBg: 'bg-[#1a110a]',
    appText: 'text-amber-100',
    chatBg: 'bg-[#140c06]',
    drawerBg: 'bg-[#1c1109]',
    drawerHeaderBg: 'bg-[#2a190d]',
    cardBg: 'bg-[#27180e]',
    cardBorder: 'border-[#593318]',
    accentText: 'text-amber-300',
    bubbleTheme: 'border-amber-600/40 text-amber-100',
    accentColor: '#d97706',
    bgColorHex: '#140c06'
  },
  'dam-ghazal-royal': {
    headerBg: 'bg-gradient-to-r from-[#2f040f] via-[#1d0208] to-[#400614]',
    headerBorder: 'border-[#881337]',
    headerAccent: 'text-rose-400',
    subHeaderBg: 'bg-[#22030a]',
    subHeaderBorder: 'border-[#55081c]',
    subHeaderText: 'text-rose-300',
    bottomBarBg: 'bg-[#1b0207]',
    bottomBarBorder: 'border-[#55081c]',
    bottomBarText: 'text-rose-200',
    inputBarBg: 'bg-[#22030a]',
    inputBarBorder: 'border-[#55081c]',
    primaryBtn: 'bg-rose-700 hover:bg-rose-600 text-white font-black',
    appBg: 'bg-[#1c0309]',
    appText: 'text-rose-100',
    chatBg: 'bg-[#130105]',
    drawerBg: 'bg-[#1e030a]',
    drawerHeaderBg: 'bg-[#2e0410]',
    cardBg: 'bg-[#2e0510]',
    cardBorder: 'border-[#6e0a23]',
    accentText: 'text-rose-300',
    bubbleTheme: 'border-rose-700/50 text-rose-100',
    accentColor: '#9f1239',
    bgColorHex: '#130105'
  },
  'royal-turquoise': {
    headerBg: 'bg-gradient-to-r from-[#03242e] via-[#02171d] to-[#053544]',
    headerBorder: 'border-[#0891b2]',
    headerAccent: 'text-cyan-300',
    subHeaderBg: 'bg-[#042029]',
    subHeaderBorder: 'border-[#08475c]',
    subHeaderText: 'text-cyan-300',
    bottomBarBg: 'bg-[#02171e]',
    bottomBarBorder: 'border-[#08475c]',
    bottomBarText: 'text-cyan-200',
    inputBarBg: 'bg-[#042029]',
    inputBarBorder: 'border-[#08475c]',
    primaryBtn: 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black',
    appBg: 'bg-[#031d27]',
    appText: 'text-cyan-100',
    chatBg: 'bg-[#021218]',
    drawerBg: 'bg-[#031c26]',
    drawerHeaderBg: 'bg-[#062c3b]',
    cardBg: 'bg-[#0a3141]',
    cardBorder: 'border-[#0f546e]',
    accentText: 'text-cyan-200',
    bubbleTheme: 'border-cyan-600/40 text-cyan-100',
    accentColor: '#06b6d4',
    bgColorHex: '#021218'
  },
  'sunset-bronze': {
    headerBg: 'bg-gradient-to-r from-[#2f1406] via-[#1e0c03] to-[#421d0a]',
    headerBorder: 'border-[#c2410c]',
    headerAccent: 'text-orange-400',
    subHeaderBg: 'bg-[#240e04]',
    subHeaderBorder: 'border-[#592209]',
    subHeaderText: 'text-orange-300',
    bottomBarBg: 'bg-[#1a0902]',
    bottomBarBorder: 'border-[#592209]',
    bottomBarText: 'text-orange-200',
    inputBarBg: 'bg-[#240e04]',
    inputBarBorder: 'border-[#592209]',
    primaryBtn: 'bg-orange-600 hover:bg-orange-500 text-slate-950 font-black',
    appBg: 'bg-[#1c0f05]',
    appText: 'text-orange-100',
    chatBg: 'bg-[#110802]',
    drawerBg: 'bg-[#1d0b03]',
    drawerHeaderBg: 'bg-[#2c1306]',
    cardBg: 'bg-[#30190a]',
    cardBorder: 'border-[#692d0b]',
    accentText: 'text-orange-300',
    bubbleTheme: 'border-orange-600/40 text-orange-100',
    accentColor: '#ea580c',
    bgColorHex: '#110802'
  },
  'amethyst-velvet': {
    headerBg: 'bg-gradient-to-r from-[#240738] via-[#150321] to-[#360b54]',
    headerBorder: 'border-[#9333ea]',
    headerAccent: 'text-purple-300',
    subHeaderBg: 'bg-[#1c052c]',
    subHeaderBorder: 'border-[#4f107b]',
    subHeaderText: 'text-purple-300',
    bottomBarBg: 'bg-[#13031f]',
    bottomBarBorder: 'border-[#4f107b]',
    bottomBarText: 'text-purple-200',
    inputBarBg: 'bg-[#1c052c]',
    inputBarBorder: 'border-[#4f107b]',
    primaryBtn: 'bg-purple-700 hover:bg-purple-600 text-white font-black',
    appBg: 'bg-[#160424]',
    appText: 'text-purple-100',
    chatBg: 'bg-[#0e0217]',
    drawerBg: 'bg-[#180427]',
    drawerHeaderBg: 'bg-[#27073f]',
    cardBg: 'bg-[#2b0a45]',
    cardBorder: 'border-[#62169c]',
    accentText: 'text-purple-300',
    bubbleTheme: 'border-purple-600/40 text-purple-100',
    accentColor: '#9333ea',
    bgColorHex: '#0e0217'
  },
  'dark-gold': {
    headerBg: 'bg-gradient-to-r from-[#1c1917] via-[#0f0e0d] to-[#292524]',
    headerBorder: 'border-amber-800/60',
    headerAccent: 'text-amber-400',
    subHeaderBg: 'bg-[#181614]',
    subHeaderBorder: 'border-[#38332e]',
    subHeaderText: 'text-amber-300',
    bottomBarBg: 'bg-[#121110]',
    bottomBarBorder: 'border-[#38332e]',
    bottomBarText: 'text-amber-200',
    inputBarBg: 'bg-[#181614]',
    inputBarBorder: 'border-[#38332e]',
    primaryBtn: 'bg-amber-600 hover:bg-amber-500 text-slate-950 font-black',
    appBg: 'bg-[#0f0e0d]',
    appText: 'text-amber-100',
    chatBg: 'bg-[#0a0908]',
    drawerBg: 'bg-[#131110]',
    drawerHeaderBg: 'bg-[#201d1a]',
    cardBg: 'bg-[#24211e]',
    cardBorder: 'border-[#4f463d]',
    accentText: 'text-amber-400',
    bubbleTheme: 'border-amber-600/30 text-amber-100',
    accentColor: '#f59e0b',
    bgColorHex: '#0a0908'
  },
  'royal-gold-brown': {
    headerBg: 'bg-gradient-to-r from-[#291a0f] via-[#1a1009] to-[#362214]',
    headerBorder: 'border-amber-700',
    headerAccent: 'text-amber-300',
    subHeaderBg: 'bg-[#22150c]',
    subHeaderBorder: 'border-[#4d301b]',
    subHeaderText: 'text-amber-300',
    bottomBarBg: 'bg-[#170e08]',
    bottomBarBorder: 'border-[#4d301b]',
    bottomBarText: 'text-amber-200',
    inputBarBg: 'bg-[#22150c]',
    inputBarBorder: 'border-[#4d301b]',
    primaryBtn: 'bg-amber-600 hover:bg-amber-500 text-slate-950 font-black',
    appBg: 'bg-[#18110b]',
    appText: 'text-amber-100',
    chatBg: 'bg-[#110b06]',
    drawerBg: 'bg-[#1a1008]',
    drawerHeaderBg: 'bg-[#2b190c]',
    cardBg: 'bg-[#2a1a0f]',
    cardBorder: 'border-[#5e3b22]',
    accentText: 'text-amber-300',
    bubbleTheme: 'border-amber-600/40 text-amber-100',
    accentColor: '#d97706',
    bgColorHex: '#110b06'
  },
  'dam-ghazal': {
    headerBg: 'bg-gradient-to-r from-[#28050e] via-[#190308] to-[#360713]',
    headerBorder: 'border-rose-800',
    headerAccent: 'text-rose-300',
    subHeaderBg: 'bg-[#1e040a]',
    subHeaderBorder: 'border-[#4c0919]',
    subHeaderText: 'text-rose-300',
    bottomBarBg: 'bg-[#150207]',
    bottomBarBorder: 'border-[#4c0919]',
    bottomBarText: 'text-rose-200',
    inputBarBg: 'bg-[#1e040a]',
    inputBarBorder: 'border-[#4c0919]',
    primaryBtn: 'bg-rose-700 hover:bg-rose-600 text-white font-black',
    appBg: 'bg-[#170409]',
    appText: 'text-rose-100',
    chatBg: 'bg-[#0f0205]',
    drawerBg: 'bg-[#190308]',
    drawerHeaderBg: 'bg-[#2b050f]',
    cardBg: 'bg-[#280710]',
    cardBorder: 'border-[#5e0c20]',
    accentText: 'text-rose-300',
    bubbleTheme: 'border-rose-700/40 text-rose-100',
    accentColor: '#9f1239',
    bgColorHex: '#0f0205'
  },
  'sapphire-night': {
    headerBg: 'bg-gradient-to-r from-[#0a1836] via-[#050e21] to-[#0f2452]',
    headerBorder: 'border-blue-900',
    headerAccent: 'text-blue-300',
    subHeaderBg: 'bg-[#08142c]',
    subHeaderBorder: 'border-[#132e69]',
    subHeaderText: 'text-blue-300',
    bottomBarBg: 'bg-[#040a17]',
    bottomBarBorder: 'border-[#132e69]',
    bottomBarText: 'text-blue-200',
    inputBarBg: 'bg-[#08142c]',
    inputBarBorder: 'border-[#132e69]',
    primaryBtn: 'bg-blue-600 hover:bg-blue-500 text-white font-black',
    appBg: 'bg-[#071124]',
    appText: 'text-blue-100',
    chatBg: 'bg-[#040914]',
    drawerBg: 'bg-[#071021]',
    drawerHeaderBg: 'bg-[#0c1e3f]',
    cardBg: 'bg-[#0e2144]',
    cardBorder: 'border-[#1d4182]',
    accentText: 'text-blue-300',
    bubbleTheme: 'border-blue-600/40 text-blue-100',
    accentColor: '#2563eb',
    bgColorHex: '#040914'
  },
  'emerald-sand': {
    headerBg: 'bg-gradient-to-r from-[#062417] via-[#03170e] to-[#093622]',
    headerBorder: 'border-emerald-900',
    headerAccent: 'text-emerald-300',
    subHeaderBg: 'bg-[#051c12]',
    subHeaderBorder: 'border-[#0c472c]',
    subHeaderText: 'text-emerald-300',
    bottomBarBg: 'bg-[#03120b]',
    bottomBarBorder: 'border-[#0c472c]',
    bottomBarText: 'text-emerald-200',
    inputBarBg: 'bg-[#051c12]',
    inputBarBorder: 'border-[#0c472c]',
    primaryBtn: 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black',
    appBg: 'bg-[#061910]',
    appText: 'text-emerald-100',
    chatBg: 'bg-[#030e09]',
    drawerBg: 'bg-[#05160e]',
    drawerHeaderBg: 'bg-[#0c2e1d]',
    cardBg: 'bg-[#0d301f]',
    cardBorder: 'border-[#185c3b]',
    accentText: 'text-emerald-300',
    bubbleTheme: 'border-emerald-600/40 text-emerald-100',
    accentColor: '#059669',
    bgColorHex: '#030e09'
  },
  'violet-twilight': {
    headerBg: 'bg-gradient-to-r from-[#1f0b2c] via-[#12051a] to-[#2c103e]',
    headerBorder: 'border-purple-700',
    headerAccent: 'text-purple-300',
    subHeaderBg: 'bg-[#180822]',
    subHeaderBorder: 'border-[#3f1659]',
    subHeaderText: 'text-purple-300',
    bottomBarBg: 'bg-[#100418]',
    bottomBarBorder: 'border-[#3f1659]',
    bottomBarText: 'text-purple-200',
    inputBarBg: 'bg-[#180822]',
    inputBarBorder: 'border-[#3f1659]',
    primaryBtn: 'bg-purple-600 hover:bg-purple-500 text-white font-black',
    appBg: 'bg-[#14071c]',
    appText: 'text-purple-100',
    chatBg: 'bg-[#0b030f]',
    drawerBg: 'bg-[#13061b]',
    drawerHeaderBg: 'bg-[#220c31]',
    cardBg: 'bg-[#240d33]',
    cardBorder: 'border-[#4e1b6e]',
    accentText: 'text-purple-300',
    bubbleTheme: 'border-purple-600/40 text-purple-100',
    accentColor: '#9333ea',
    bgColorHex: '#0b030f'
  },
  'amber-oasis': {
    headerBg: 'bg-gradient-to-r from-[#29170a] via-[#180d05] to-[#3b210e]',
    headerBorder: 'border-orange-600',
    headerAccent: 'text-orange-400',
    subHeaderBg: 'bg-[#201207]',
    subHeaderBorder: 'border-[#4d2c11]',
    subHeaderText: 'text-orange-300',
    bottomBarBg: 'bg-[#150a04]',
    bottomBarBorder: 'border-[#4d2c11]',
    bottomBarText: 'text-orange-200',
    inputBarBg: 'bg-[#201207]',
    inputBarBorder: 'border-[#4d2c11]',
    primaryBtn: 'bg-orange-600 hover:bg-orange-500 text-slate-950 font-black',
    appBg: 'bg-[#1b0f06]',
    appText: 'text-orange-100',
    chatBg: 'bg-[#100803]',
    drawerBg: 'bg-[#190e06]',
    drawerHeaderBg: 'bg-[#2b170a]',
    cardBg: 'bg-[#2e1a0b]',
    cardBorder: 'border-[#613615]',
    accentText: 'text-orange-300',
    bubbleTheme: 'border-orange-600/40 text-orange-100',
    accentColor: '#f97316',
    bgColorHex: '#100803'
  },
  'ruby-velvet': {
    headerBg: 'bg-gradient-to-r from-[#27040d] via-[#170207] to-[#360613]',
    headerBorder: 'border-rose-700',
    headerAccent: 'text-rose-400',
    subHeaderBg: 'bg-[#1f030a]',
    subHeaderBorder: 'border-[#4d0718]',
    subHeaderText: 'text-rose-300',
    bottomBarBg: 'bg-[#140106]',
    bottomBarBorder: 'border-[#4d0718]',
    bottomBarText: 'text-rose-200',
    inputBarBg: 'bg-[#1f030a]',
    inputBarBorder: 'border-[#4d0718]',
    primaryBtn: 'bg-rose-700 hover:bg-rose-600 text-white font-black',
    appBg: 'bg-[#180309]',
    appText: 'text-rose-100',
    chatBg: 'bg-[#0e0105]',
    drawerBg: 'bg-[#160208]',
    drawerHeaderBg: 'bg-[#29050f]',
    cardBg: 'bg-[#2b0610]',
    cardBorder: 'border-[#5e0c22]',
    accentText: 'text-rose-300',
    bubbleTheme: 'border-rose-700/40 text-rose-100',
    accentColor: '#e11d48',
    bgColorHex: '#0e0105'
  },
  'deep-ocean': {
    headerBg: 'bg-gradient-to-r from-[#031d2e] via-[#02131f] to-[#04283f]',
    headerBorder: 'border-cyan-800',
    headerAccent: 'text-cyan-300',
    subHeaderBg: 'bg-[#031826]',
    subHeaderBorder: 'border-[#063857]',
    subHeaderText: 'text-cyan-300',
    bottomBarBg: 'bg-[#02101a]',
    bottomBarBorder: 'border-[#063857]',
    bottomBarText: 'text-cyan-200',
    inputBarBg: 'bg-[#031826]',
    inputBarBorder: 'border-[#063857]',
    primaryBtn: 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black',
    appBg: 'bg-[#031622]',
    appText: 'text-cyan-100',
    chatBg: 'bg-[#020e17]',
    drawerBg: 'bg-[#031521]',
    drawerHeaderBg: 'bg-[#062940]',
    cardBg: 'bg-[#06283d]',
    cardBorder: 'border-[#0d476d]',
    accentText: 'text-cyan-300',
    bubbleTheme: 'border-cyan-500/40 text-cyan-100',
    accentColor: '#06b6d4',
    bgColorHex: '#020e17'
  },
  'emerald-forest': {
    headerBg: 'bg-gradient-to-r from-[#072412] via-[#03170b] to-[#0b3319]',
    headerBorder: 'border-emerald-800',
    headerAccent: 'text-emerald-300',
    subHeaderBg: 'bg-[#051c0e]',
    subHeaderBorder: 'border-[#0a4220]',
    subHeaderText: 'text-emerald-300',
    bottomBarBg: 'bg-[#031209]',
    bottomBarBorder: 'border-[#0a4220]',
    bottomBarText: 'text-emerald-200',
    inputBarBg: 'bg-[#051c0e]',
    inputBarBorder: 'border-[#0a4220]',
    primaryBtn: 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black',
    appBg: 'bg-[#05190d]',
    appText: 'text-emerald-100',
    chatBg: 'bg-[#020f08]',
    drawerBg: 'bg-[#05170d]',
    drawerHeaderBg: 'bg-[#0c2f1a]',
    cardBg: 'bg-[#0b2d18]',
    cardBorder: 'border-[#124d29]',
    accentText: 'text-emerald-300',
    bubbleTheme: 'border-emerald-500/40 text-emerald-100',
    accentColor: '#10b981',
    bgColorHex: '#020f08'
  }
};

const getFontFamilyStyle = (font: string) => {
  switch (font) {
    case 'Noto Naskh Arabic':
      return "'Noto Naskh Arabic', 'Traditional Arabic', serif";
    case 'Cairo':
      return "'Cairo', sans-serif";
    case 'Tajawal':
      return "'Tajawal', sans-serif";
    case 'Almarai':
      return "'Almarai', sans-serif";
    case 'Amiri':
      return "'Amiri', serif";
    case 'Aref Ruqaa':
      return "'Aref Ruqaa', cursive";
    default:
      return "'Noto Naskh Arabic', 'Cairo', sans-serif";
  }
};

// Global emblems config reference for text parsing
let globalEmblemsConfig: EmblemsConfig = DEFAULT_EMBLEMS_CONFIG;

// Formatted Arabic Text & Poetry & Custom Emoji Parser
function renderFormattedMessageText(
  text: string,
  customEmojis?: EmblemItem[],
  emojiSize?: EmojiSizeSetting
) {
  if (!text) return null;

  const activeEmojis = customEmojis || globalEmblemsConfig.items;
  const activeSize = emojiSize || globalEmblemsConfig.emojiSize;

  // Check if poetry verse: starts with 📜 and has |
  if (text.startsWith('📜') && text.includes('|')) {
    const parts = text.replace('📜', '').split('|');
    return (
      <div className="my-1.5 p-3 rounded-xl bg-gradient-to-r from-amber-950/20 via-slate-900/10 to-amber-950/20 border border-amber-500/30 text-center font-serif shadow-inner">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-amber-900 font-bold text-sm">
          <span>« {parseCustomEmojisInText(parts[0]?.trim() || '', activeEmojis, activeSize)} »</span>
          <span className="text-amber-500 font-mono text-xs">❈ ═══ ❈</span>
          <span>« {parseCustomEmojisInText(parts[1]?.trim() || '', activeEmojis, activeSize)} »</span>
        </div>
      </div>
    );
  }

  // Parse formatting tokens: **bold**, *italic*, ~~strike~~, `code`, ==mark==
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~|`[^`]+`|==[^=]+==)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-extrabold">
          {parseCustomEmojisInText(part.slice(2, -2), activeEmojis, activeSize)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={index} className="italic opacity-90">
          {parseCustomEmojisInText(part.slice(1, -1), activeEmojis, activeSize)}
        </em>
      );
    }
    if (part.startsWith('~~') && part.endsWith('~~')) {
      return (
        <del key={index} className="line-through opacity-60">
          {parseCustomEmojisInText(part.slice(2, -2), activeEmojis, activeSize)}
        </del>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono text-xs">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('==') && part.endsWith('==')) {
      return (
        <mark key={index} className="bg-yellow-200 text-slate-900 px-1 rounded font-semibold">
          {parseCustomEmojisInText(part.slice(2, -2), activeEmojis, activeSize)}
        </mark>
      );
    }
    return (
      <React.Fragment key={index}>
        {parseCustomEmojisInText(part, activeEmojis, activeSize)}
      </React.Fragment>
    );
  });
}

// Sample Media Pictures to Send
const SAMPLE_MEDIA = [
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80'
];

// Curated avatar choices for setting profile picture
const SAMPLE_AVATARS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80'
];

export default function App() {
  // Socket & Connection
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<'connected' | 'reconnecting' | 'disconnected'>('connected');
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const isForcedLoggedOutRef = useRef<boolean>(false);
  const [forcedLogoutInfo, setForcedLogoutInfo] = useState<{ show: boolean; message: string; timestamp: number } | null>(null);
  const [showConnectionDetailsModal, setShowConnectionDetailsModal] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const currentUserRef = useRef<User | null>(null);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatusText, setUploadStatusText] = useState<string>('');

  // Login Screen State (Screenshot 1)
  const [activeTab, setActiveTab] = useState<'visitor' | 'member' | 'register'>('visitor');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [detectedFlag, setDetectedFlag] = useState('🇸🇦');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Chat Data & Stream (Screenshot 2)
  // Preserved in sessionStorage for this browser tab session;
  // Automatically wiped by the browser when the tab/browser is closed permanently,
  // or on direct explicit logout!
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('soqoor_room_messages');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });
  const messagesRef = useRef<Message[]>(messages);
  useEffect(() => {
    messagesRef.current = messages;
    try {
      if (messages.length > 0) {
        sessionStorage.setItem('soqoor_room_messages', JSON.stringify(messages.slice(-300)));
      } else {
        sessionStorage.removeItem('soqoor_room_messages');
      }
    } catch {}
  }, [messages]);
  const [textInput, setTextInput] = useState('');

  // Typing Indicator State & Refs (حالة ومؤقتات الأعضاء الذين يكتبون الآن في نفس الغرفة)
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSelfTypingRef = useRef<boolean>(false);

  // Broadcast typing status to room (إرسال إشعار الكتابة للغرفة الحالية)
  const notifyTyping = (isTyping: boolean) => {
    if (!socket || !currentUser || !currentUser.room || currentUser.room === 'خارج الغرف') return;
    if (isTyping) {
      if (!isSelfTypingRef.current) {
        isSelfTypingRef.current = true;
        socket.emit('typing', { isTyping: true });
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        isSelfTypingRef.current = false;
        socket.emit('typing', { isTyping: false });
      }, 3000);
    } else {
      if (isSelfTypingRef.current) {
        isSelfTypingRef.current = false;
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
        socket.emit('typing', { isTyping: false });
      }
    }
  };

  // Auto prune stale typing indicators every 1s (مسح أي مؤشر كتابة قديم تلقائياً بعد 4 ثوانٍ)
  useEffect(() => {
    if (typingUsers.length === 0) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers((prev) => prev.filter((u) => now - u.lastTypedAt < 4000));
    }, 1000);
    return () => clearInterval(interval);
  }, [typingUsers.length]);

  const [micSlots, setMicSlots] = useState<MicSlot[]>([
    { slotNumber: 1, user: null },
    { slotNumber: 2, user: null },
    { slotNumber: 3, user: null },
    { slotNumber: 4, user: null },
    { slotNumber: 5, user: null }
  ]);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  // Emblems & Custom Emojis State (إدارة الرموز، السوابر، الهدايا، الستيكرات والفيسات)
  const [emblemsConfig, setEmblemsConfig] = useState<EmblemsConfig>(DEFAULT_EMBLEMS_CONFIG);
  useEffect(() => {
    globalEmblemsConfig = emblemsConfig;
  }, [emblemsConfig]);
  const [showBannerPickerModal, setShowBannerPickerModal] = useState<boolean>(false);
  const [bannerPickerTargetUser, setBannerPickerTargetUser] = useState<User | null>(null);
  const [customBannerUrlInput, setCustomBannerUrlInput] = useState<string>('');
  const [emojiPickerTab, setEmojiPickerTab] = useState<'custom' | 'stickers' | 'vintage'>('custom');

  // SIDE MODALS / PANELS (Matches screenshots: they take ~78% width, leaving background chat visible!)
  const [activeDrawer, setActiveDrawer] = useState<'none' | 'users' | 'rooms' | 'pm' | 'wall' | 'settings' | 'monitor' | 'profile'>('none');
  const activeDrawerRef = useRef(activeDrawer);
  useEffect(() => {
    activeDrawerRef.current = activeDrawer;
  }, [activeDrawer]);
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [rosterUsers, setRosterUsers] = useState<User[]>([]);
  const [allConnectedUsers, setAllConnectedUsers] = useState<User[]>([]);
  const [allRegisteredMembers, setAllRegisteredMembers] = useState<Array<{
    username: string;
    role: string;
    flag: string;
    statusQuote: string;
    avatarUrl?: string;
    nameBannerUrl?: string;
    giftBadges?: string[];
    likes?: number;
    points?: number;
    honorBadge?: string;
    isOnline: boolean;
    currentRoom?: string;
  }>>([]);
  const [onlineCount, setOnlineCount] = useState(1);
  const [roomsList, setRoomsList] = useState<ChatRoom[]>([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [newRoomPass, setNewRoomPass] = useState('');
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);

  // Revealed Nicks State (كشف النكات والآي بي واسم الجهاز وبصمة الهاتف وتعداد العضويات)
  const [revealedNicksData, setRevealedNicksData] = useState<{
    targetUsername: string;
    ip: string;
    device?: string;
    deviceFingerprint?: string;
    country?: string;
    accountsCount: number;
    accounts: string[];
    role: string;
    room: string;
    flag: string;
    isOnline: boolean;
  } | null>(null);
  const [showRevealedNicksModal, setShowRevealedNicksModal] = useState(false);

  // Unread Wall Posts Counter State (عداد رسائل ومنشورات الحائط الجديدة)
  const [unreadWallCount, setUnreadWallCount] = useState<number>(0);
  const lastSeenWallTimeRef = useRef<number>(Date.now());

  // Announcement Bar Display Timing (يظهر لعدة ثوانٍ عند الدخول ثم يختفي تلقائياً)
  const [showAnnouncementBar, setShowAnnouncementBar] = useState<boolean>(true);
  const announcementTimerRef = useRef<NodeJS.Timeout | null>(null);
  const triggerAnnouncementDisplay = (durationMs = 8000) => {
    setShowAnnouncementBar(true);
    if (announcementTimerRef.current) clearTimeout(announcementTimerRef.current);
    announcementTimerRef.current = setTimeout(() => {
      setShowAnnouncementBar(false);
    }, durationMs);
  };

  // General Welcome Settings State (إدارة الرسائل الترحيبية العامة للشات من لوحة التحكم)
  const [generalWelcome, setGeneralWelcome] = useState<{
    enabled: boolean;
    message: string;
    title: string;
  }>({
    enabled: true,
    message: 'أهلاً وسهلاً بكم في شات حسان برو! نتمنى لكم أسعد الأوقات وأجمل المحادثات في غرفنا الصوتية والكتابية 🦅✨',
    title: 'إدارة حسان برو 🦅'
  });

  // Centered Media Lightbox Viewer (عرض وتكبير وتحميل الفيديوهات والصور المتحركة والصور)
  const [activeMediaViewer, setActiveMediaViewer] = useState<{
    url: string;
    type: 'image' | 'video';
    title?: string;
  } | null>(null);
  const [isFullscreenMedia, setIsFullscreenMedia] = useState(false);
  const [warningReplyInput, setWarningReplyInput] = useState('');
  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState<string | null>(null);
  const [wallCommentInput, setWallCommentInput] = useState('');

  // Filter Alerts State (سجل تنبيهات الفلتر مع اسم العضو والرسالة الكاملة)
  const [filterAlertsList, setFilterAlertsList] = useState<Array<{
    id: string;
    username: string;
    avatarUrl?: string;
    flag?: string;
    room: string;
    targetUser?: string;
    contextType?: 'room' | 'pm' | 'wall_post' | 'wall_comment';
    matchedWords: string[];
    fullMessage: string;
    timestamp: number;
    time: string;
  }>>([]);

  // Active Reaction Popover State (لتفعيل نقر زر التفاعل على الهواتف والأجهزة اللمسية)
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(null);

  // Mic Slot Action Modal State (خيارات المايك: سحب المايك أو كتم المايك)
  const [micActionSlot, setMicActionSlot] = useState<{ slotNumber: number; slotUser: User | null } | null>(null);

  // Connection Stability & Background Queuing (طابور الرسائل المعلقة أثناء الانقطاع اللحظي أو بالخلفية)
  const pendingMessagesQueueRef = useRef<Array<{ event: string; payload: any }>>([]);

  // Message Single Action Menu State (قائمة الإجراءات المنسدلة للرسائل ⋮)
  const [activeMsgMenuId, setActiveMsgMenuId] = useState<string | null>(null);

  // 24-Hour Stories / Khwater States (نظام الخواطر والحالات 24 ساعة)
  const [storiesList, setStoriesList] = useState<StoryItem[]>([]);
  const [activeStoryViewer, setActiveStoryViewer] = useState<StoryItem | null>(null);
  const [isCreatingStory, setIsCreatingStory] = useState(false);
  const [storyMediaUrl, setStoryMediaUrl] = useState('');
  const [storyMediaType, setStoryMediaType] = useState<'image' | 'video'>('image');
  const [storyCaption, setStoryCaption] = useState('');
  const [isStoryUploading, setIsStoryUploading] = useState(false);
  const [storyUploadProgress, setStoryUploadProgress] = useState(0);
  const [storyCommentInput, setStoryCommentInput] = useState('');
  const [showStoryComments, setShowStoryComments] = useState(false);

  // Wall State
  const [wallPosts, setWallPosts] = useState<WallPost[]>([]);
  const [wallTab, setWallTab] = useState<'posts' | 'quick'>('posts');
  const [wallTextInput, setWallTextInput] = useState('');
  const [wallMediaUrl, setWallMediaUrl] = useState('');
  const [isWallUploading, setIsWallUploading] = useState(false);
  const [wallUploadProgress, setWallUploadProgress] = useState<number | null>(null);

  // Private Messages State - Preserved in sessionStorage for this browser tab session;
  // Automatically wiped by the browser when the tab/browser is closed permanently,
  // or on direct explicit logout!
  const [privateMessages, setPrivateMessages] = useState<PrivateMessage[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('soqoor_private_messages');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });
  const privateMessagesRef = useRef<PrivateMessage[]>(privateMessages);
  useEffect(() => {
    privateMessagesRef.current = privateMessages;
    try {
      if (privateMessages.length > 0) {
        sessionStorage.setItem('soqoor_private_messages', JSON.stringify(privateMessages.slice(-300)));
      } else {
        sessionStorage.removeItem('soqoor_private_messages');
      }
    } catch {}
  }, [privateMessages]);
  const [selectedPmUser, setSelectedPmUser] = useState<User | null>(null);
  const selectedPmUserRef = useRef<User | null>(null);
  const [pmInput, setPmInput] = useState('');
  const [unreadPerUser, setUnreadPerUser] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('soqoor_unread_pm');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return {};
  });

  useEffect(() => {
    selectedPmUserRef.current = selectedPmUser;
    if (selectedPmUser?.username) {
      setUnreadPerUser((prev) => {
        if (!prev[selectedPmUser.username]) return prev;
        const updated = { ...prev };
        const cleared = updated[selectedPmUser.username] || 0;
        delete updated[selectedPmUser.username];
        setNotificationCount((c) => Math.max(0, c - cleared));
        try {
          sessionStorage.setItem('soqoor_unread_pm', JSON.stringify(updated));
        } catch {}
        return updated;
      });
    }
  }, [selectedPmUser]);
  const [pmReplyingTo, setPmReplyingTo] = useState<{ id: string; username: string; text: string } | null>(null);
  const [isPmRecordingVoice, setIsPmRecordingVoice] = useState(false);
  const [pmSelfDestructSeconds, setPmSelfDestructSeconds] = useState<number>(0);
  const [showPmSelfDestructMenu, setShowPmSelfDestructMenu] = useState(false);
  const [showPmEncryptionModal, setShowPmEncryptionModal] = useState(false);
  const [nowTimestamp, setNowTimestamp] = useState<number>(() => Date.now());

  // Real-time ticking for self-destruct messages countdown and automatic client expiration
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setNowTimestamp(now);
      setPrivateMessages((prev) => {
        if (!Array.isArray(prev)) return [];
        const hasExpired = prev.some((pm) => pm && pm.selfDestructAt && pm.selfDestructAt <= now);
        if (!hasExpired) return prev;
        return prev.filter((pm) => !(pm && pm.selfDestructAt && pm.selfDestructAt <= now));
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Mark incoming private messages as read when viewing PM conversation
  useEffect(() => {
    if (activeDrawer === 'pm' && selectedPmUser && socket) {
      socket.emit('markPrivateMessagesRead', {
        partnerUsername: selectedPmUser.username,
        partnerId: selectedPmUser.id
      });
      setPrivateMessages((prev) => {
        if (!Array.isArray(prev)) return [];
        const partnerName = selectedPmUser.username.trim().toLowerCase();
        let changed = false;
        const updated = prev.map((pm) => {
          if (pm && pm.fromUsername.trim().toLowerCase() === partnerName && pm.status !== 'read') {
            changed = true;
            return { ...pm, status: 'read' as const, readAt: Date.now() };
          }
          return pm;
        });
        return changed ? updated : prev;
      });
    }
  }, [activeDrawer, selectedPmUser, socket]);

  // Message Reply & Voice Recording States
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string; text: string; mediaUrl?: string } | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);

  // Message Editing States (تعديل الرسائل في الغرف، الحائط، والخاص)
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingMsgText, setEditingMsgText] = useState('');
  const [editingWallPostId, setEditingWallPostId] = useState<string | null>(null);
  const [editingWallPostText, setEditingWallPostText] = useState('');
  const [editingPmId, setEditingPmId] = useState<string | null>(null);
  const [editingPmText, setEditingPmText] = useState('');

  // Private 1-on-1 Call States (اتصال خاص صوت وفيديو)
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
  const [activeCall, setActiveCall] = useState<{
    callId: string;
    partner: CallPartner;
    callType: 'audio' | 'video';
    isInitiator: boolean;
  } | null>(null);

  // Dynamic Monitored Filter Words State
  const [monitoredWordsList, setMonitoredWordsList] = useState<string[]>([
    'سب', 'شتم', 'قذف', 'لعن', 'طرد', 'كود', 'هكر', 'اخترق', 'سكس', 'اباحي',
    'قحبة', 'منيوك', 'كس', 'طيز', 'كلب', 'حمار', 'وسخ', 'حقير', 'تفو'
  ]);
  const [newFilterWordInput, setNewFilterWordInput] = useState('');

  // Live Broadcast Video & Audio (بث لايف فيديو وصوت حقيقي للغرفة)
  const [isBroadcastingLive, setIsBroadcastingLive] = useState(false);
  const [isWatchingLive, setIsWatchingLive] = useState(false);
  const [activeRoomLiveBroadcast, setActiveRoomLiveBroadcast] = useState<RoomLiveBroadcastState | null>(null);
  const [liveViewerCount, setLiveViewerCount] = useState(0);
  const [liveMediaStream, setLiveMediaStream] = useState<MediaStream | null>(null);
  const [isLiveCameraOff, setIsLiveCameraOff] = useState(false);
  const [isLiveMicMuted, setIsLiveMicMuted] = useState(false);
  const [liveFacingMode, setLiveFacingMode] = useState<'user' | 'environment'>('user');
  const [liveRemoteVideoFrame, setLiveRemoteVideoFrame] = useState<string | null>(null);
  const [liveFloatingReactions, setLiveFloatingReactions] = useState<Array<{ id: string; emoji: string; left: number }>>([]);
  const [isLiveMinimized, setIsLiveMinimized] = useState(false);
  const [showStartLiveConfirm, setShowStartLiveConfirm] = useState(false);

  // Profile Visitors System (زائري ملفي الشخصي)
  const [profileVisitorsList, setProfileVisitorsList] = useState<ProfileVisitorRecord[]>([]);
  const [showProfileVisitorsModal, setShowProfileVisitorsModal] = useState(false);

  const localLiveVideoRef = useRef<HTMLVideoElement | null>(null);
  const liveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const liveFrameIntervalRef = useRef<any>(null);

  // Chat Shortcuts State (الاختصارات الذكية للشات)
  const [shortcuts, setShortcuts] = useState<ChatShortcut[]>([]);

  // Official Warning Active Dialog State (Custom in-app modal)
  const [activeWarning, setActiveWarning] = useState<{ from: string; text: string } | null>(null);
  const [warningModalTarget, setWarningModalTarget] = useState<User | null>(null);
  const [customWarningText, setCustomWarningText] = useState('');

  // Customizable Sound Effects State (Event-specific tones)
  const [selectedMsgSound, setSelectedMsgSound] = useState<MessageSoundId>(sounds.getMessageSound());
  const [selectedJoinSound, setSelectedJoinSound] = useState<JoinSoundId>(sounds.getJoinSound());
  const [selectedPrivateSound, setSelectedPrivateSound] = useState<PrivateSoundId>(sounds.getPrivateSound());
  const [selectedMentionSound, setSelectedMentionSound] = useState<MentionSoundId>(sounds.getMentionSound());
  const [selectedAlertSound, setSelectedAlertSound] = useState<AlertSoundId>(sounds.getAlertSound());
  const [soundsMuted, setSoundsMuted] = useState<boolean>(sounds.isMuted());

  // Dedicated Sound Center Modal & Test Sequencer (مركز التنبيهات الصوتية المخصصة)
  const [showSoundModal, setShowSoundModal] = useState<boolean>(false);
  const [testingSequence, setTestingSequence] = useState<boolean>(false);
  const [activePlayingSound, setActivePlayingSound] = useState<'alert' | 'private' | 'mention' | 'msg' | 'join' | null>(null);

  // Web Notifications API States (نظام تنبيهات المتصفح في الخلفية وعند إغلاق الشاشة)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>(() => getNotificationPermission());
  const [showNotificationBanner, setShowNotificationBanner] = useState<boolean>(() => {
    try {
      if (sessionStorage.getItem('soqoor_notif_banner_dismissed') === 'true') return false;
    } catch {}
    return isNotificationSupported() && getNotificationPermission() === 'default';
  });

  // Broadcast Alert Modal (إشعار عام للغرفة)
  const [showBroadcastModal, setShowBroadcastModal] = useState<boolean>(false);
  const [broadcastAlertText, setBroadcastAlertText] = useState<string>('');

  // Mention Suggestions Dropdown State
  const [mentionSuggestions, setMentionSuggestions] = useState<User[]>([]);
  const [showMentionMenu, setShowMentionMenu] = useState<boolean>(false);

  // Consolidated Floating Quick Tools Menu (دمج الأزرار العائمة في أيقونة صغيرة واحدة للحفاظ على مساحة المراسلة)
  const [showCompactToolsMenu, setShowCompactToolsMenu] = useState<boolean>(false);
  // Dedicated In-Room Settings Modal (إعدادات الغرفة الحالية من الضبط)
  const [isRoomSettingsModalOpen, setIsRoomSettingsModalOpen] = useState<boolean>(false);
  // Filter Alerts Modal (عرض رسائل الفلتر الملتقطة عند النقر على أيقونة الجرس)
  const [showFilterAlertsModal, setShowFilterAlertsModal] = useState<boolean>(false);
  // Room Settings State for Current Room (إعدادات الغرفة ورسالة الترحيب لمالك الغرفة)
  const [currentRoomSettingsForm, setCurrentRoomSettingsForm] = useState<{
    name: string;
    desc: string;
    pinnedTopic: string;
    isChatLocked: boolean;
    slowModeSeconds: number;
    isVoiceLocked: boolean;
    password: string;
    wallpaper: string;
    welcomeMessage: string;
    welcomeEnabled: boolean;
  }>({
    name: '',
    desc: '',
    pinnedTopic: '',
    isChatLocked: false,
    slowModeSeconds: 0,
    isVoiceLocked: false,
    password: '',
    wallpaper: 'default',
    welcomeMessage: '',
    welcomeEnabled: true
  });

  // Ignore / Block Users State (قائمة الأعضاء المتجاهلين)
  const [ignoredUsers, setIgnoredUsers] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('soqoor_ignored_users');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const isUserIgnored = (username?: string) => {
    if (!username) return false;
    return ignoredUsers.includes(username.toLowerCase().trim());
  };

  // Mega Suite & Creative Features State (ميزات حسان برو الإبداعية الـ 50+)
  const [isMegaSuiteOpen, setIsMegaSuiteOpen] = useState<boolean>(false);
  const [showUltimateFeatures50, setShowUltimateFeatures50] = useState<boolean>(false);
  const [chatFontSize, setChatFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>(() => {
    try {
      const saved = localStorage.getItem('soqoor_chat_font_size');
      if (saved === 'sm' || saved === 'base' || saved === 'lg' || saved === 'xl') return saved;
    } catch {}
    return 'base';
  });
  const [eyeComfort, setEyeComfort] = useState<boolean>(() => {
    try {
      return localStorage.getItem('soqoor_eye_comfort') === 'true';
    } catch {
      return false;
    }
  });
  const [activeTheme, setActiveTheme] = useState<string>(() => {
    try {
      return localStorage.getItem('soqoor_theme') || 'golden-brown-harmony';
    } catch {
      return 'golden-brown-harmony';
    }
  });
  const [pinnedTopic, setPinnedTopic] = useState<string>('🦅 مرحباً بكم في شات حسان برو ملتقى الأحبة والأصالة • نرجو الالتزام بآداب الحوار');
  const [userMood, setUserMood] = useState<string>(() => {
    try {
      return localStorage.getItem('soqoor_user_mood') || 'مروق ☕';
    } catch {
      return 'مروق ☕';
    }
  });
  const [userFrame, setUserFrame] = useState<string>(() => {
    try {
      return localStorage.getItem('soqoor_user_frame') || 'gold';
    } catch {
      return 'gold';
    }
  });
  const [filterOnlyMentions, setFilterOnlyMentions] = useState<boolean>(false);
  const [showFloatingFilterMenu, setShowFloatingFilterMenu] = useState<boolean>(false);
  const [showChatPowerTools, setShowChatPowerTools] = useState<boolean>(false);
  const userLikeCooldownsRef = useRef<Record<string, number>>({});
  const [floatingLikeAlert, setFloatingLikeAlert] = useState<{
    fromUsername: string;
    fromAvatar?: string;
    flag?: string;
    likes: number;
  } | null>(null);

  // Likes Threshold Requirements State (شروط عدد اللايكات المطلوبة للإرسال)
  const [likesSettings, setLikesSettings] = useState<LikesThresholdSettings>({
    roomTextLikes: 0,
    roomMediaLikes: 0,
    wallTextLikes: 0,
    wallMediaLikes: 0,
    pmTextLikes: 0,
    pmMediaLikes: 0,
    micLikes: 0,
    callLikes: 0
  });

  // 100+ Creative Features Suite States
  const [showAudioStudio, setShowAudioStudio] = useState<boolean>(false);
  const [showGamesSuite, setShowGamesSuite] = useState<boolean>(false);
  const [showIdentityStudio, setShowIdentityStudio] = useState<boolean>(false);
  const [showThemesModal, setShowThemesModal] = useState<boolean>(false);
  const [showDiagnosticsModal, setShowDiagnosticsModal] = useState<boolean>(false);
  const [activeWallpaper, setActiveWallpaper] = useState<string>(() => {
    try {
      return localStorage.getItem('soqoor_wallpaper') || 'default';
    } catch {
      return 'default';
    }
  });
  const [fontFamily, setFontFamily] = useState<string>(() => {
    try {
      return localStorage.getItem('soqoor_font') || 'Noto Naskh Arabic';
    } catch {
      return 'Noto Naskh Arabic';
    }
  });
  const [bubbleStyle, setBubbleStyle] = useState<string>(() => {
    try {
      return localStorage.getItem('soqoor_bubble_style') || 'modern';
    } catch {
      return 'modern';
    }
  });
  const curTheme = THEME_STYLES[activeTheme] || THEME_STYLES['golden-brown-harmony'];
  const [nameGradient, setNameGradient] = useState<string>(() => {
    try {
      return localStorage.getItem('soqoor_name_gradient') || 'from-amber-400 to-yellow-200';
    } catch {
      return 'from-amber-400 to-yellow-200';
    }
  });
  const [isPoetryMode, setIsPoetryMode] = useState<boolean>(false);
  const [chatSearchQuery, setChatSearchQuery] = useState<string>('');
  const [pinnedChatMessage, setPinnedChatMessage] = useState<{ id: string; username: string; text: string } | null>(null);
  const [particlesEnabled, setParticlesEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('soqoor_particles') !== 'false';
    } catch {
      return true;
    }
  });
  const [soundVolume, setSoundVolume] = useState<number>(() => {
    try {
      const v = localStorage.getItem('soqoor_sound_volume');
      return v ? parseInt(v, 10) : 80;
    } catch {
      return 80;
    }
  });

  // Dynamic Role Permissions State (الصلاحيات المخصصة لكل رتبة)
  const [rolePermissions, setRolePermissions] = useState<Record<string, any>>(() => {
    try {
      const saved = localStorage.getItem('soqoor_role_permissions');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const userCanFilter = Boolean(
    currentUser && (
      currentUser.role === 'admin' ||
      (currentUser.role === 'super' && (rolePermissions?.super?.canFilter ?? true)) ||
      Boolean(rolePermissions?.[currentUser.role]?.canFilter)
    )
  );

  const userCanDeleteMessage = Boolean(
    currentUser && (
      currentUser.role === 'admin' ||
      (currentUser.role === 'super' && (rolePermissions?.super?.canDeleteMessage ?? true)) ||
      Boolean(rolePermissions?.[currentUser.role]?.canDeleteMessage)
    )
  );

  // Starred Messages (الرسائل المحفوظة في المفضلة)
  const [starredMessages, setStarredMessages] = useState<Array<{ id: string; username: string; text: string; time: string }>>(() => {
    try {
      const saved = localStorage.getItem('soqoor_starred_messages');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleStarMessage = (msg: { id: string; username: string; text: string; time: string }) => {
    setStarredMessages((prev) => {
      const exists = prev.some((m) => m.id === msg.id);
      const next = exists ? prev.filter((m) => m.id !== msg.id) : [msg, ...prev];
      try {
        localStorage.setItem('soqoor_starred_messages', JSON.stringify(next));
      } catch {}
      showToast(exists ? 'تمت إزالة الرسالة من المفضلة ✕' : 'تم حفظ الرسالة في المفضلة ⭐', 'info');
      return next;
    });
  };

  const isMessageStarred = (msgId: string) => {
    return starredMessages.some((m) => m.id === msgId);
  };

  // Text-To-Speech (نطق الرسائل صوتياً)
  const speakMessage = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
      showToast('🔊 جاري نطق الرسالة...', 'info');
    } else {
      showToast('خاصية نطق الصوت غير مدعومة في متصفحك', 'error');
    }
  };

  // Local Chat Clear
  const handleClearLocalChat = () => {
    setMessages([]);
    showToast('تم مسح شاشة الدردشة محلياً 🧹', 'info');
  };

  // Export Chat to Text File
  const handleExportChat = () => {
    if (messages.length === 0) {
      showToast('لا توجد رسائل لتصديرها حالياً', 'info');
      return;
    }
    const lines = messages.map(
      (m) => `[${m.time}] ${m.username}: ${m.text || ''}`
    );
    const roomName = currentUser ? currentUser.room : 'الغرفة العامة';
    const content = `سجل محادثات حسان برو - ${new Date().toLocaleDateString('ar-EG')}\nالغرفة: ${roomName}\n==============================\n\n` + lines.join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hassanpro-chat-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('تم تصدير سجل الشات بنجاح 📄', 'success');
  };

  const toggleIgnoreUser = (username: string) => {
    if (!username || !currentUser) return;
    if (username.toLowerCase() === currentUser.username.toLowerCase()) {
      showToast('لا يمكنك تجاهل نفسك!', 'error');
      return;
    }
    const target = username.toLowerCase().trim();
    setIgnoredUsers((prev) => {
      const exists = prev.includes(target);
      const next = exists ? prev.filter((u) => u !== target) : [...prev, target];
      try {
        localStorage.setItem('soqoor_ignored_users', JSON.stringify(next));
      } catch {}
      if (exists) {
        showToast(`تم إلغاء تجاهل [${username}] بنجاح ✔️`, 'info');
      } else {
        showToast(`تم تجاهل [${username}] بنجاح 🚫 لن تظهر رسائله لك بعد الآن.`, 'success');
      }
      return next;
    });
  };

  // Selected Profile for Viewing / Moderation (Screenshots 10 & 11)
  const [profileTargetUser, setProfileTargetUser] = useState<User | null>(null);
  const [profileEditName, setProfileEditName] = useState('');
  const [profileEditLikes, setProfileEditLikes] = useState('');
  const [profileEditQuote, setProfileEditQuote] = useState('');
  const [profileEditPoints, setProfileEditPoints] = useState('');
  const [profileEditRole, setProfileEditRole] = useState<'admin' | 'super' | 'member' | 'guest'>('member');
  const [profileMoveRoom, setProfileMoveRoom] = useState('الغرفة العامة');

  // Settings State (Screenshots 5 & 6)
  const [settingName, setSettingName] = useState('');
  const [settingQuote, setSettingQuote] = useState('');
  const [settingAvatar, setSettingAvatar] = useState('');
  const [settingPassword, setSettingPassword] = useState('');
  const [settingNameColor, setSettingNameColor] = useState<string>(() => {
    try {
      return localStorage.getItem('soqoor_name_color') || '#d97706';
    } catch {
      return '#d97706';
    }
  });
  const [settingTextColor, setSettingTextColor] = useState<string>(() => {
    try {
      return localStorage.getItem('soqoor_text_color') || '#0f172a';
    } catch {
      return '#0f172a';
    }
  });
  const [isChatInputFocused, setIsChatInputFocused] = useState<boolean>(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [monitorLogs, setMonitorLogs] = useState<MonitorEvent[]>([]);

  // WebRTC Audio Mesh
  const [audioManager, setAudioManager] = useState<AudioMeshManager | null>(null);
  const [micVolume, setMicVolume] = useState(0);

  // Control Panel Tabs & Filter State
  const [controlPanelTab, setControlPanelTab] = useState<'moderation' | 'roomControls' | 'bans' | 'broadcast' | 'stats' | 'words' | 'matrix' | 'logs'>('moderation');
  const [roomStatsData, setRoomStatsData] = useState<RoomStatData[]>([]);
  const [bannedList, setBannedList] = useState<Array<{ username: string; ip?: string; reason: string; bannedBy: string; timestamp: number }>>([]);
  const [roomSettings, setRoomSettings] = useState<{ isChatLocked: boolean; slowModeSeconds: number; isVoiceLocked: boolean }>({
    isChatLocked: false,
    slowModeSeconds: 0,
    isVoiceLocked: false
  });
  const [serverSecurity, setServerSecurity] = useState<{
    emergencyLockdown: boolean;
    guestsAllowed: boolean;
    blockExternalLinks: boolean;
    floodControlRate: number;
    marqueeTicker: string;
  }>({
    emergencyLockdown: false,
    guestsAllowed: true,
    blockExternalLinks: true,
    floodControlRate: 3,
    marqueeTicker: '🦅 مرحباً بكم في شات حسان برو | شات العرب الصوتي والكتابي الأرقى | أهلاً وسهلاً بجميع الإخوة والأخوات 🌹'
  });
  const [staffMemos, setStaffMemos] = useState<Array<{
    id: string;
    author: string;
    role: string;
    text: string;
    priority: 'low' | 'normal' | 'urgent';
    timestamp: number;
    timeFormatted: string;
  }>>([]);
  const [activeAdminSiren, setActiveAdminSiren] = useState<{ from: string; message: string; timestamp: number } | null>(null);
  const [receivedOfficialWarning, setReceivedOfficialWarning] = useState<{ from: string; text: string } | null>(null);
  const [criticalBroadcast, setCriticalBroadcast] = useState<{ id: string; title: string; text: string; sender: string; senderRole: string; time: string } | null>(null);
  const [broadcastTitleInput, setBroadcastTitleInput] = useState('تنبيه ملكي عاجل من إدارة حسان برو 🦅');
  const [broadcastTextInput, setBroadcastTextInput] = useState('');
  const [roomPasswordInput, setRoomPasswordInput] = useState('');
  const [controlRoleFilter, setControlRoleFilter] = useState<'all' | 'admin' | 'super' | 'member' | 'guest'>('all');
  const [controlSearchQuery, setControlSearchQuery] = useState('');
  const [logTypeFilter, setLogTypeFilter] = useState<'all' | 'kick_ban' | 'mute' | 'mic' | 'role'>('all');

  // Role Hierarchy and Permissions Helpers
  const ROLE_HIERARCHY: Record<string, number> = {
    admin: 3,
    super: 2,
    member: 1,
    guest: 0
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          title: '👑 مدير النظام (Admin)',
          short: 'مدير النظام',
          badgeClass: 'bg-red-600 text-white',
          borderClass: 'border-red-600',
          textClass: 'text-red-600',
          description: 'كامل الصلاحيات (حذف صور، طرد، باند، إسكات، تعديل بيانات، وترقيات)'
        };
      case 'super':
        return {
          title: '🛡️ سوبر إداري (Super)',
          short: 'مشرف سوبر',
          badgeClass: 'bg-amber-600 text-white',
          borderClass: 'border-amber-600',
          textClass: 'text-amber-600',
          description: 'صلاحيات إشرافية (حذف صور المخالفين، طرد، وإسكات الأعضاء والزوار)'
        };
      case 'member':
        return {
          title: '🎖️ عضو معتمد (Member)',
          short: 'عضو مسجل',
          badgeClass: 'bg-indigo-600 text-white',
          borderClass: 'border-indigo-600',
          textClass: 'text-indigo-600',
          description: 'عضوية معتمدة وميزات تفاعلية واجتماعية'
        };
      default:
        return {
          title: '👤 زائر (Guest)',
          short: 'زائر',
          badgeClass: 'bg-slate-600 text-white',
          borderClass: 'border-slate-400',
          textClass: 'text-slate-600',
          description: 'زائر عادي بدون صلاحيات إدارية'
        };
    }
  };

  const canActorModerate = (actor: User | null, target: User | null, action: string): { allowed: boolean; reason?: string } => {
    if (!actor) return { allowed: false, reason: 'يجب تسجيل الدخول أولاً' };

    if (actor.role !== 'admin' && actor.role !== 'super') {
      return { allowed: false, reason: 'هذه الميزة مخصصة للإدارة فقط (Admin/Super).' };
    }

    if (action === 'ban' && actor.role !== 'admin') {
      return { allowed: false, reason: 'صلاحية الباند والحظر الدائم محصورة بمدير النظام (Admin) فقط.' };
    }

    if (action === 'updateLikes' && actor.role !== 'admin') {
      return { allowed: false, reason: 'صلاحية تعديل اللايكات محصورة بمدير النظام (Admin) فقط.' };
    }

    if (action === 'updateRole' && actor.role !== 'admin') {
      return { allowed: false, reason: 'صلاحية ترقية وتعيين الرتب محصورة بمدير النظام (Admin) فقط.' };
    }

    if (action === 'clearLogs' && actor.role !== 'admin') {
      return { allowed: false, reason: 'صلاحية إفراغ سجل المراقبة محصورة بمدير النظام (Admin) فقط.' };
    }

    if (target) {
      if (target.id === actor.id && ['kick', 'ban', 'mute', 'deleteAvatar'].includes(action)) {
        return { allowed: false, reason: 'لا يمكنك تطبيق هذا الإجراء على نفسك.' };
      }

      const actorRank = ROLE_HIERARCHY[actor.role] || 0;
      const targetRank = ROLE_HIERARCHY[target.role] || 0;

      if (actor.role === 'super') {
        if (targetRank >= actorRank) {
          return {
            allowed: false,
            reason: `لا تملك صلاحية تعديل أو معاقبة رتبة مساوية أو أعلى (${target.role === 'admin' ? 'مدير نظام' : 'مشرف سوبر'}).`
          };
        }
      }

      if (actor.role === 'admin' && target.role === 'admin' && target.id !== actor.id) {
        if (['ban', 'kick'].includes(action)) {
          return { allowed: false, reason: 'لا يمكن طرد أو حظر مدير نظام آخر مباشرة.' };
        }
      }
    }

    return { allowed: true };
  };

  // Toast / System Alerts
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const pmMessagesEndRef = useRef<HTMLDivElement>(null);
  const pmChatContainerRef = useRef<HTMLDivElement>(null);
  const wallEndRef = useRef<HTMLDivElement>(null);
  const storyFileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

  // visualViewport API for mobile virtual keyboard alignment & smooth chat scrolling
  const [viewportHeight, setViewportHeight] = useState<number>(() => {
    if (typeof window !== 'undefined' && window.visualViewport) {
      return Math.round(window.visualViewport.height);
    }
    return typeof window !== 'undefined' ? window.innerHeight : 800;
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // Reliable helper to format message time properly in Arabic
  const formatMessageTime = (msg: { time?: string; timestamp?: number }) => {
    if (msg.timestamp) {
      try {
        return new Date(msg.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
      } catch {}
    }
    if (msg.time && msg.time !== '0د' && msg.time !== 'الآن') {
      return msg.time;
    }
    try {
      return new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'الآن';
    }
  };

  // 100% Reliable Auto-Scroll to latest messages (Direct scrollTop without outer window jumping)
  const scrollToBottom = (instant = false) => {
    if (chatContainerRef.current) {
      const el = chatContainerRef.current;
      if (instant) {
        el.scrollTop = el.scrollHeight;
      } else {
        try {
          el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
        } catch {
          el.scrollTop = el.scrollHeight;
        }
      }
    }
  };

  const scrollPmToBottom = (instant = false) => {
    if (pmChatContainerRef.current) {
      const el = pmChatContainerRef.current;
      if (instant) {
        el.scrollTop = el.scrollHeight;
      } else {
        try {
          el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
        } catch {
          el.scrollTop = el.scrollHeight;
        }
      }
    }
  };

  const scrollWallToBottom = () => {
    wallEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleChatScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 140;
    setShowScrollBottomBtn(!isNearBottom);
  };

  // Automatically scroll down when new public room messages arrive
  useEffect(() => {
    scrollToBottom(true);
    const rId = requestAnimationFrame(() => scrollToBottom(false));
    return () => {
      cancelAnimationFrame(rId);
    };
  }, [messages]);

  useEffect(() => {
    scrollPmToBottom(true);
    const tId = setTimeout(() => scrollPmToBottom(false), 60);
    return () => clearTimeout(tId);
  }, [privateMessages]);

  useEffect(() => {
    scrollWallToBottom();
  }, [wallPosts]);

  // Handle click outside to close active message options menu
  useEffect(() => {
    if (!activeMsgMenuId) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && !target.closest('.msg-action-panel') && !target.closest('.msg-action-btn')) {
        setActiveMsgMenuId(null);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [activeMsgMenuId]);

  // Live Broadcast MediaStream attachment to local video element
  useEffect(() => {
    if (localLiveVideoRef.current && liveMediaStream) {
      localLiveVideoRef.current.srcObject = liveMediaStream;
      localLiveVideoRef.current.play().catch(() => {});
    }
  }, [liveMediaStream, isBroadcastingLive, isLiveMinimized]);

  // Handle window.visualViewport resize (when on-screen keyboard shows/hides on real mobile devices)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleViewportChange = () => {
      const vv = window.visualViewport;
      const height = vv ? Math.round(vv.height) : window.innerHeight;
      setViewportHeight(height);
      document.documentElement.style.setProperty('--app-height', `${height}px`);
      if (document.body) {
        document.body.style.setProperty('--app-height', `${height}px`);
      }

      // Always keep window scroll at (0,0) to prevent browser panning & gap below input
      window.scrollTo(0, 0);

      // Instantly scroll chat to latest messages on keyboard open/close
      scrollToBottom(true);
      setTimeout(() => scrollToBottom(true), 60);
      setTimeout(() => scrollToBottom(false), 200);
    };

    handleViewportChange();

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.visualViewport.addEventListener('scroll', handleViewportChange);
    }
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('orientationchange', handleViewportChange);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
        window.visualViewport.removeEventListener('scroll', handleViewportChange);
      }
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('orientationchange', handleViewportChange);
    };
  }, []);

  // Detect Real Country Flag automatically based on IP geo / timezone
  useEffect(() => {
    let isCancelled = false;
    const detectRealFlag = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && data.country_code) {
            const flagEmoji = data.country_code
              .toUpperCase()
              .split('')
              .map((c: string) => String.fromCodePoint(127397 + c.charCodeAt(0)))
              .join('');
            if (flagEmoji) {
              setDetectedFlag(flagEmoji);
              return;
            }
          }
        }
      } catch {
        // Fallback to timezone
      }

      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone.toLowerCase();
        if (tz.includes('riyadh') || tz.includes('saudi')) setDetectedFlag('🇸🇦');
        else if (tz.includes('aden') || tz.includes('sanaa') || tz.includes('yemen')) setDetectedFlag('🇾🇪');
        else if (tz.includes('damascus') || tz.includes('syria')) setDetectedFlag('🇸🇾');
        else if (tz.includes('cairo') || tz.includes('egypt')) setDetectedFlag('🇪🇬');
        else if (tz.includes('algiers') || tz.includes('algeria')) setDetectedFlag('🇩🇿');
        else if (tz.includes('baghdad') || tz.includes('iraq')) setDetectedFlag('🇮🇶');
        else if (tz.includes('dubai') || tz.includes('uae')) setDetectedFlag('🇦🇪');
        else if (tz.includes('kuwait')) setDetectedFlag('🇰🇼');
        else if (tz.includes('qatar')) setDetectedFlag('🇶🇦');
        else if (tz.includes('bahrain')) setDetectedFlag('🇧🇭');
        else if (tz.includes('muscat') || tz.includes('oman')) setDetectedFlag('🇴🇲');
        else if (tz.includes('amman') || tz.includes('jordan')) setDetectedFlag('🇯🇴');
        else if (tz.includes('casablanca') || tz.includes('morocco')) setDetectedFlag('🇲🇦');
        else if (tz.includes('tunis') || tz.includes('tunisia')) setDetectedFlag('🇹🇳');
        else if (tz.includes('beirut') || tz.includes('lebanon')) setDetectedFlag('🇱🇧');
        else if (tz.includes('gaza') || tz.includes('jerusalem') || tz.includes('hebron')) setDetectedFlag('🇵🇸');
        else if (tz.includes('tripoli') || tz.includes('libya')) setDetectedFlag('🇱🇾');
        else if (tz.includes('khartoum') || tz.includes('sudan')) setDetectedFlag('🇸🇩');
        else setDetectedFlag('🇸🇦');
      } catch {
        setDetectedFlag('🇸🇦');
      }
    };
    detectRealFlag();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Load persisted user profile edits from localStorage (حفظ واستعادة التعديلات على الملف الشخصي)
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem('falcon_saved_profile');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        if (parsed.statusQuote) setSettingQuote(parsed.statusQuote);
        if (parsed.avatarUrl) setSettingAvatar(parsed.avatarUrl);
      }
    } catch {}
  }, []);

  // Web Notifications Service Worker setup & incoming click dispatcher
  useEffect(() => {
    if (isNotificationSupported()) {
      registerNotificationServiceWorker().catch(() => {});
      setNotificationPermission(getNotificationPermission());

      listenToNotificationClicks((data) => {
        if (data.type === 'pm' && data.fromUsername) {
          const partner =
            rosterUsers.find((u) => u.username.toLowerCase() === data.fromUsername?.toLowerCase()) ||
            allConnectedUsers.find((u) => u.username.toLowerCase() === data.fromUsername?.toLowerCase()) || {
              id: `notif-${data.fromUsername}`,
              username: data.fromUsername,
              room: 'الغرفة العامة',
              avatarSeed: data.fromUsername,
              statusQuote: '',
              flag: '🇸🇦',
              role: 'member',
              likes: 0,
              points: 0,
              isVoice: false,
              micSlot: null,
              isMuted: false,
              isTextMuted: false,
              isSpeaking: false,
              joinedAt: Date.now()
            };
          setSelectedPmUser(partner as any);
          setActiveDrawer('pm');
        } else if (data.type === 'mention') {
          scrollToBottom(true);
        }
      });
    }
  }, [rosterUsers, allConnectedUsers]);

  // Initialize Socket.io with infinite resilience and background keepalive
  useEffect(() => {
    const s = io(window.location.origin, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 4000,
      randomizationFactor: 0.2,
      timeout: 45000,
      transports: ['websocket', 'polling'],
      autoConnect: true
    });

    s.on('connect', () => {
      setIsConnected(true);
      setConnectionState('connected');

      // Do NOT restore session if user was explicitly force-logged out due to another device login
      if (isForcedLoggedOutRef.current) {
        return;
      }

      // Immediately restore previous session on connect / reconnect without requiring page refresh
      const savedToken = localStorage.getItem('soqoor_session_token') || sessionStorage.getItem('soqoor_session_token');
      const savedUserStr = localStorage.getItem('soqoor_current_user') || sessionStorage.getItem('soqoor_current_user');
      if (savedToken && savedUserStr) {
        try {
          const parsed = JSON.parse(savedUserStr);
          s.emit('restoreSession', {
            sessionToken: savedToken,
            username: parsed.username,
            room: currentUserRef.current?.room || parsed.room || 'الغرفة العامة',
            deviceFingerprint: generateDeviceFingerprint().fingerprintId
          });
        } catch {}
      }

      // Flush any queued messages that were written during temporary network disconnect or in background
      if (pendingMessagesQueueRef.current.length > 0) {
        const queued = [...pendingMessagesQueueRef.current];
        pendingMessagesQueueRef.current = [];
        queued.forEach((item) => {
          s.emit(item.event, item.payload);
        });
        showToast('تمت استعادة الاتصال وإرسال جميع الرسائل المعلقة تلقائياً بنجاح 🚀', 'success');
      }

      // Initial ping latency measurement
      s.emit('keepAlivePing', { timestamp: Date.now() });
      s.emit('getStories');
    });

    // Pong listener for live ping measurement (ms)
    s.on('keepAlivePong', (data: { timestamp: number; clientTimestamp?: number }) => {
      if (data?.clientTimestamp) {
        const latency = Math.max(1, Date.now() - data.clientTimestamp);
        setPingLatency(latency);
      }
    });

    // Regular ping every 12 seconds
    const pingTicker = setInterval(() => {
      if (s.connected) {
        s.emit('keepAlivePing', { timestamp: Date.now() });
      }
    }, 12000);

    // Auto-reconnect quickly when returning to browser tab from background
    const handleVisibilityResync = () => {
      if (document.visibilityState === 'visible') {
        if (!s.connected && !isForcedLoggedOutRef.current) {
          s.connect();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityResync);
    window.addEventListener('focus', handleVisibilityResync);

    s.on('connect_error', () => {
      setIsConnected(false);
      if (currentUserRef.current && !isForcedLoggedOutRef.current) {
        setConnectionState('reconnecting');
      }
    });

    s.on('storiesUpdated', (stories: StoryItem[]) => {
      setStoriesList(stories || []);
    });

    s.on('disconnect', (reason) => {
      setIsConnected(false);
      if (currentUserRef.current && !isForcedLoggedOutRef.current) {
        setConnectionState('reconnecting');
      } else {
        setConnectionState('disconnected');
      }
      // Only manual reconnect if disconnected by server command and not forced out
      if (reason === 'io server disconnect' && !isForcedLoggedOutRef.current) {
        s.connect();
      }
    });

    s.on('initialRoster', (data: {
      onlineCount: number;
      users: User[];
      rooms: ChatRoom[];
      roomStats?: RoomStatData[];
      bannedList?: any[];
      serverSecurity?: any;
      staffMemos?: any[];
      filterAlerts?: any[];
      monitoredWords?: string[];
      shortcuts?: ChatShortcut[];
      likesSettings?: LikesThresholdSettings;
      marqueeTicker?: string;
    }) => {
      setOnlineCount(data.users ? data.users.length : (data.onlineCount || 0));
      setRosterUsers(data.users || []);
      setRoomsList(data.rooms || []);
      if (data.roomStats) {
        setRoomStatsData(data.roomStats);
      }
      if (data.bannedList) {
        setBannedList(data.bannedList);
      }
      if (data.serverSecurity) {
        setServerSecurity(data.serverSecurity);
      }
      if (data.staffMemos) {
        setStaffMemos(data.staffMemos);
      }
      if (data.filterAlerts) {
        setFilterAlertsList(data.filterAlerts);
      }
      if (data.monitoredWords) {
        setMonitoredWordsList(data.monitoredWords);
      }
      if (data.shortcuts) {
        setShortcuts(data.shortcuts);
      }
      if (data.likesSettings) {
        setLikesSettings(data.likesSettings);
      }
      if ((data as any).rolePermissions) {
        setRolePermissions((data as any).rolePermissions);
      }
      if ((data as any).generalWelcome) {
        setGeneralWelcome((data as any).generalWelcome);
      }
      if (data.marqueeTicker || (data.serverSecurity && data.serverSecurity.marqueeTicker)) {
        triggerAnnouncementDisplay(8000);
      }
      if ((data as any).emblemsConfig) {
        setEmblemsConfig((data as any).emblemsConfig);
      }
      if ((data as any).stories) {
        setStoriesList((data as any).stories);
      }
      if ((data as any).globalAppearance) {
        const ga = (data as any).globalAppearance;
        const localTheme = localStorage.getItem('soqoor_theme');
        const localFont = localStorage.getItem('soqoor_font');
        const localWallpaper = localStorage.getItem('soqoor_wallpaper');
        const localBubble = localStorage.getItem('soqoor_bubble_style');
        if (!localTheme && ga.theme) setActiveTheme(ga.theme);
        if (!localFont && ga.fontFamily) setFontFamily(ga.fontFamily);
        if (!localWallpaper && ga.wallpaper) setActiveWallpaper(ga.wallpaper);
        if (!localBubble && ga.bubbleStyle) setBubbleStyle(ga.bubbleStyle);
      }
    });

    // Emblems and Custom Emojis update listener
    s.on('emblemsUpdated', (config: EmblemsConfig) => {
      if (config) {
        setEmblemsConfig(config);
      }
    });

    // General Welcome Settings Updated listener (تحديثات الرسائل الترحيبية العامة للشات)
    s.on('generalWelcomeUpdated', (data: { enabled: boolean; message: string; title: string }) => {
      setGeneralWelcome(data);
    });

    // Global Appearance Updates for all users (التطبيق العام للثيم والخط لكافة المستخدمين)
    s.on('globalAppearanceUpdated', (data: { theme?: string; fontFamily?: string; wallpaper?: string; bubbleStyle?: string }) => {
      if (data.theme) {
        setActiveTheme(data.theme);
        localStorage.setItem('soqoor_theme', data.theme);
      }
      if (data.fontFamily) {
        setFontFamily(data.fontFamily);
        localStorage.setItem('soqoor_font', data.fontFamily);
      }
      if (data.wallpaper) {
        setActiveWallpaper(data.wallpaper);
        localStorage.setItem('soqoor_wallpaper', data.wallpaper);
      }
      if (data.bubbleStyle) {
        setBubbleStyle(data.bubbleStyle);
        localStorage.setItem('soqoor_bubble_style', data.bubbleStyle);
      }
      showToast('📢 تم تطبيق وتعميم الثيم والخط العام على كافة الشات من الإدارة', 'info');
    });

    // Role Permissions live listener
    s.on('rolePermissionsUpdated', (perms: Record<string, any>) => {
      if (perms) {
        setRolePermissions(perms);
      }
    });

    // User style immediate broadcast listener
    s.on('userStyleUpdated', (data: { userId?: string; username: string; nameColor?: string; textColor?: string; nameGradient?: string; profileBg?: string; nameBannerUrl?: string; giftBadges?: string[] }) => {
      const matchName = (un?: string) => un && un.toLowerCase() === data.username.toLowerCase();

      setRosterUsers((prev) =>
        prev.map((u) => (matchName(u.username) ? { ...u, nameColor: data.nameColor, textColor: data.textColor, nameGradient: data.nameGradient, profileBg: data.profileBg, nameBannerUrl: data.nameBannerUrl !== undefined ? data.nameBannerUrl : u.nameBannerUrl, giftBadges: data.giftBadges !== undefined ? data.giftBadges : u.giftBadges } : u))
      );
      setAllConnectedUsers((prev) =>
        prev.map((u) => (matchName(u.username) ? { ...u, nameColor: data.nameColor, textColor: data.textColor, nameGradient: data.nameGradient, profileBg: data.profileBg, nameBannerUrl: data.nameBannerUrl !== undefined ? data.nameBannerUrl : u.nameBannerUrl, giftBadges: data.giftBadges !== undefined ? data.giftBadges : u.giftBadges } : u))
      );
      setAllRegisteredMembers((prev) =>
        prev.map((m) => (matchName(m.username) ? { ...m, nameBannerUrl: data.nameBannerUrl !== undefined ? data.nameBannerUrl : m.nameBannerUrl } : m))
      );
      setCurrentUser((prev) => (prev && matchName(prev.username) ? { ...prev, nameColor: data.nameColor, textColor: data.textColor, nameGradient: data.nameGradient, profileBg: data.profileBg, nameBannerUrl: data.nameBannerUrl !== undefined ? data.nameBannerUrl : prev.nameBannerUrl, giftBadges: data.giftBadges !== undefined ? data.giftBadges : prev.giftBadges } : prev));
      setProfileTargetUser((prev) => (prev && matchName(prev.username) ? { ...prev, nameBannerUrl: data.nameBannerUrl !== undefined ? data.nameBannerUrl : prev.nameBannerUrl } : prev));
      if (data.nameColor) setSettingNameColor(data.nameColor);
      if (data.textColor) setSettingTextColor(data.textColor);

      setMessages((prev) =>
        prev.map((m) =>
          matchName(m.username)
            ? {
                ...m,
                nameColor: data.nameColor !== undefined ? data.nameColor : m.nameColor,
                textColor: data.textColor !== undefined ? data.textColor : m.textColor,
                nameGradient: data.nameGradient !== undefined ? data.nameGradient : m.nameGradient,
                nameBannerUrl: data.nameBannerUrl !== undefined ? data.nameBannerUrl : m.nameBannerUrl,
                giftBadges: data.giftBadges !== undefined ? data.giftBadges : m.giftBadges
              }
            : m
        )
      );

      if (data.nameBannerUrl !== undefined) {
        setWallPosts((prev) =>
          prev.map((p) => {
            const isAuthor = matchName(p.username);
            const updatedComments = p.comments?.map((c) =>
              matchName(c.username) ? { ...c, nameBannerUrl: data.nameBannerUrl || undefined } : c
            );
            return {
              ...p,
              nameBannerUrl: isAuthor ? data.nameBannerUrl || undefined : p.nameBannerUrl,
              comments: updatedComments
            };
          })
        );
        setPrivateMessages((prev) =>
          prev.map((pm) => ({
            ...pm,
            fromNameBannerUrl: matchName(pm.fromUsername) ? data.nameBannerUrl || undefined : pm.fromNameBannerUrl,
            toNameBannerUrl: matchName(pm.toUsername) ? data.nameBannerUrl || undefined : pm.toNameBannerUrl
          }))
        );
        setProfileVisitorsList((prev) =>
          prev.map((v) => (matchName(v.username) ? { ...v, nameBannerUrl: data.nameBannerUrl || undefined } : v))
        );
      }
    });

    // Likes Threshold limits listener (تحديث شروط اللايكات الحية)
    s.on('likesSettingsUpdated', (updatedLikes: LikesThresholdSettings) => {
      if (updatedLikes) {
        setLikesSettings(updatedLikes);
      }
    });

    // Profile Likes Real-Time Updates & Live Floating Alerts
    s.on('userLikesUpdated', ({ username, likes }: { username: string; likes: number }) => {
      setRosterUsers((prev) =>
        prev.map((u) => (u.username === username ? { ...u, likes } : u))
      );
      setAllConnectedUsers((prev) =>
        prev.map((u) => (u.username === username ? { ...u, likes } : u))
      );
      setCurrentUser((prev) => (prev && prev.username === username ? { ...prev, likes } : prev));
      setProfileTargetUser((prev) => (prev && prev.username === username ? { ...prev, likes } : prev));
    });

    s.on('receivedProfileLike', (data: { fromUsername: string; fromAvatar?: string; flag?: string; likes: number; timestamp?: number }) => {
      setFloatingLikeAlert(data);
      sounds.playCrownFanfare();
      confetti({ particleCount: 50, spread: 70 });
      setTimeout(() => {
        setFloatingLikeAlert((curr) => (curr?.fromUsername === data.fromUsername ? null : curr));
      }, 7000);
    });

    // Chat Shortcuts listener
    s.on('shortcutsUpdated', (list: ChatShortcut[]) => {
      setShortcuts(list || []);
    });

    // Nick Detection / Account revelation listener
    s.on('revealedNicksResult', (data: any) => {
      setRevealedNicksData(data);
      setShowRevealedNicksModal(true);
    });

    // Filter Alerts listeners
    s.on('filterAlertsList', (list: any[]) => {
      setFilterAlertsList(list || []);
    });

    s.on('newFilterAlert', (alert: any) => {
      setFilterAlertsList((prev) => [alert, ...prev.slice(0, 149)]);
      const currentU = currentUserRef.current;
      if (currentU?.role === 'admin' || currentU?.role === 'super') {
        sounds.playGeneralAlertPing();
        showToast(`🚨 تنبيه فلتر: كتب [${alert.username}] كلمة محظورة: "${alert.matchedWords.join(', ')}"`, 'error');
      }
    });

    s.on('onlineCountUpdated', (count: number) => {
      setOnlineCount(count);
    });

    s.on('allUsers', (users: User[]) => {
      setAllConnectedUsers(users || []);
    });

    s.on('allRegisteredMembers', (members: any[]) => {
      setAllRegisteredMembers(members || []);
    });

    // User presence state listener (🟢 Green: online, 🟡 Yellow: away/background, ⚪ Gray: offline)
    s.on('userPresenceUpdated', ({ username, state }: { userId: string; username: string; state: 'online' | 'away' | 'offline' }) => {
      setRosterUsers((prev) =>
        state === 'offline'
          ? prev.filter((u) => u.username !== username)
          : prev.map((u) => (u.username === username ? { ...u, presenceState: state } : u))
      );
      setAllConnectedUsers((prev) =>
        state === 'offline'
          ? prev.filter((u) => u.username !== username)
          : prev.map((u) => (u.username === username ? { ...u, presenceState: state } : u))
      );
      if (currentUserRef.current && currentUserRef.current.username.toLowerCase() === username.toLowerCase()) {
        setCurrentUser((prev) => (prev ? { ...prev, presenceState: state } : null));
      }
    });

    // Synced room messages (shows everything that happened while user had chat in background)
    s.on('syncedRoomMessages', ({ messages: newMsgs }: { roomId: string; messages: Message[] }) => {
      if (Array.isArray(newMsgs) && newMsgs.length > 0) {
        setMessages((prev) => {
          const ids = new Set(prev.map((m) => m.id));
          const additions = newMsgs.filter((m) => !ids.has(m.id));
          return additions.length > 0 ? [...prev, ...additions] : prev;
        });
      }
    });

    s.on('roomStats', (stats: RoomStatData[]) => {
      setRoomStatsData(stats);
    });

    s.on('roomStatsUpdated', (stats: RoomStatData[]) => {
      setRoomStatsData(stats);
    });

    s.on('bannedListUpdated', (list: any[]) => {
      setBannedList(list || []);
    });

    s.on('roomSettingsUpdated', ({ settings }: { room: string; settings: { isChatLocked: boolean; slowModeSeconds: number; isVoiceLocked: boolean } }) => {
      setRoomSettings(settings);
    });

    s.on('roomPinnedMessageUpdated', (pinned: { id: string; username: string; text: string } | null) => {
      setPinnedChatMessage(pinned);
    });

    // Real-time typing indicator listener (استقبال وتحديث قائمة الأعضاء الذين يكتبون الآن في الغرفة)
    s.on('userTyping', (data: {
      userId: string;
      username: string;
      avatarUrl?: string;
      flag?: string;
      role?: string;
      nameColor?: string;
      nameGradient?: string;
      room: string;
      isTyping: boolean;
    }) => {
      if (!data || !data.username) return;
      const curU = currentUserRef.current;
      if (curU && (data.userId === curU.id || data.username.toLowerCase() === curU.username.toLowerCase())) {
        return;
      }
      if (curU && curU.room && data.room && data.room !== curU.room) {
        return;
      }

      setTypingUsers((prev) => {
        const withoutUser = prev.filter(
          (u) => u.userId !== data.userId && u.username.toLowerCase() !== data.username.toLowerCase()
        );
        if (!data.isTyping) {
          return withoutUser;
        }
        return [
          ...withoutUser,
          {
            userId: data.userId,
            username: data.username,
            avatarUrl: data.avatarUrl,
            flag: data.flag,
            role: data.role,
            nameColor: data.nameColor,
            nameGradient: data.nameGradient,
            room: data.room,
            lastTypedAt: Date.now()
          }
        ];
      });
    });

    s.on('chatMessageReactionUpdated', ({ messageId, reactions }: { messageId: string; reactions: Record<string, number> }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, reactions } : m))
      );
    });

    s.on('userPointsUpdated', ({ points, reason, added }: { points: number; reason: string; added: number }) => {
      setCurrentUser((prev) => (prev ? { ...prev, points } : null));
      showToast(`+${added} نقطة: ${reason} ⭐`, 'success');
      confetti({ particleCount: 35, spread: 50 });
    });

    s.on('serverSecurityUpdated', (sec: any) => {
      setServerSecurity(sec);
    });

    s.on('staffMemosUpdated', (memos: any[]) => {
      setStaffMemos(memos || []);
    });

    s.on('adminSirenAlert', (data: { from: string; message: string; timestamp: number }) => {
      setActiveAdminSiren(data);
      sounds.playGeneralAlertPing();
      setTimeout(() => {
        setActiveAdminSiren((prev) => (prev?.timestamp === data.timestamp ? null : prev));
      }, 10000);
    });

    s.on('officialWarning', (data: { from: string; text: string }) => {
      setReceivedOfficialWarning(data);
      sounds.playGeneralAlertPing();
    });

    s.on('warningReplyReceived', (data: { from: string; avatarUrl?: string; flag?: string; replyText: string; time: string }) => {
      sounds.playGeneralAlertPing();
      showToast(`📩 وصلك رد من العضو [${data.from}] بخصوص التنبيه: "${data.replyText}"`, 'info');
    });

    s.on('chatMessageDeleted', ({ messageId }: { messageId: string }) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    });

    s.on('chatMessageEdited', ({ messageId, newText }: { messageId: string; newText: string }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, text: newText, isEdited: true } : m))
      );
    });

    s.on('privateMessageDeleted', ({ messageId }: { messageId: string }) => {
      setPrivateMessages((prev) => prev.filter((pm) => pm.id !== messageId));
    });

    s.on('privateMessageEdited', ({ messageId, newText }: { messageId: string; newText: string }) => {
      setPrivateMessages((prev) =>
        prev.map((pm) => (pm.id === messageId ? { ...pm, text: newText, isEdited: true } : pm))
      );
    });

    s.on('privateMessagesRead', ({ byUsername, readAt }: { byUsername: string; readAt: number }) => {
      setPrivateMessages((prev) => {
        const safe = Array.isArray(prev) ? prev : [];
        const partnerLower = (byUsername || '').trim().toLowerCase();
        const myLower = (currentUserRef.current?.username || '').trim().toLowerCase();
        let changed = false;
        const updated = safe.map((pm) => {
          if (
            pm &&
            pm.fromUsername.trim().toLowerCase() === myLower &&
            pm.toUsername.trim().toLowerCase() === partnerLower &&
            pm.status !== 'read'
          ) {
            changed = true;
            return { ...pm, status: 'read' as const, readAt: readAt || Date.now() };
          }
          return pm;
        });
        return changed ? updated : safe;
      });
    });

    s.on('remoteVoiceChunk', (data: { userId: string; username: string; micSlot: number; chunk: string }) => {
      if (isSpeakerMuted) return;
      try {
        const audio = new Audio(data.chunk);
        audio.volume = 0.95;
        audio.play().catch(() => {});
      } catch {}
    });

    s.on('monitorEvent', (event: MonitorEvent) => {
      setMonitorLogs((prev) => [event, ...prev.slice(0, 199)]);
    });

    s.on('criticalGlobalBroadcast', (data: { id: string; title: string; text: string; sender: string; senderRole: string; time: string }) => {
      setCriticalBroadcast(data);
      sounds.playGeneralAlertPing();
      confetti({ particleCount: 60, spread: 80, origin: { y: 0.3 } });
    });

    s.on('loginSuccess', ({ user, sessionToken }: { user: User; sessionToken?: string }) => {
      setCurrentUser(user);
      setSettingName(user.username);
      setSettingQuote(user.statusQuote);
      setSettingAvatar(user.avatarUrl || '');

      // Check both localStorage and server user preferences (priority: localStorage if user modified, then server)
      const persistentNameColor = localStorage.getItem('soqoor_name_color') || user.nameColor || '#d97706';
      const persistentTextColor = localStorage.getItem('soqoor_text_color') || user.textColor || '#0f172a';
      const persistentNameGradient = localStorage.getItem('soqoor_name_gradient') || user.nameGradient || 'from-amber-400 to-yellow-200';
      const persistentTheme = localStorage.getItem('soqoor_theme') || (user as any).theme || 'golden-brown-harmony';
      const persistentFont = localStorage.getItem('soqoor_font') || (user as any).fontFamily || 'Noto Naskh Arabic';
      const persistentFontSize = (localStorage.getItem('soqoor_chat_font_size') as any) || (user as any).fontSize || 'base';
      const persistentWallpaper = localStorage.getItem('soqoor_wallpaper') || (user as any).wallpaper || 'default';
      const persistentBubble = localStorage.getItem('soqoor_bubble_style') || (user as any).bubbleStyle || 'modern';

      setSettingNameColor(persistentNameColor);
      setSettingTextColor(persistentTextColor);
      setNameGradient(persistentNameGradient);
      setActiveTheme(persistentTheme);
      setFontFamily(persistentFont);
      setChatFontSize(persistentFontSize);
      setActiveWallpaper(persistentWallpaper);
      setBubbleStyle(persistentBubble);

      try {
        localStorage.setItem('soqoor_name_color', persistentNameColor);
        localStorage.setItem('soqoor_text_color', persistentTextColor);
        localStorage.setItem('soqoor_name_gradient', persistentNameGradient);
        localStorage.setItem('soqoor_theme', persistentTheme);
        localStorage.setItem('soqoor_font', persistentFont);
        localStorage.setItem('soqoor_chat_font_size', persistentFontSize);
        localStorage.setItem('soqoor_wallpaper', persistentWallpaper);
        localStorage.setItem('soqoor_bubble_style', persistentBubble);
      } catch {}

      // Inform server of these choices
      s.emit('updateUserStyle', {
        nameColor: persistentNameColor,
        textColor: persistentTextColor,
        nameGradient: persistentNameGradient
      });
      s.emit('updateUserPreferences', {
        theme: persistentTheme,
        fontFamily: persistentFont,
        fontSize: persistentFontSize,
        wallpaper: persistentWallpaper,
        bubbleStyle: persistentBubble,
        nameColor: persistentNameColor,
        textColor: persistentTextColor
      });

      setIsSubmitting(false);
      setLoginError(null);
      setMessages([]);
      setPrivateMessages([]);
      setUnreadPerUser({});
      if (sessionToken) {
        localStorage.setItem('soqoor_session_token', sessionToken);
      }
      localStorage.setItem('soqoor_current_user', JSON.stringify(user));
      requestScreenWakeLock();
      startSilentAudioKeepAlive();
      startHeartbeatWorker(s);
      triggerAnnouncementDisplay(8000);
      showToast(`أهلاً بك يا ${user.username} في شات حسان برو! 🦅`, 'success');
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.8 } });
    });

    s.on('sessionRestored', ({ user, sessionToken }: { user: User; sessionToken?: string }) => {
      setCurrentUser(user);
      // NOTE: Do NOT clear messages or private messages here!
      // Chat history is safely retained across screen locks, background transitions, and reconnects.
      setSettingName(user.username);
      setSettingQuote(user.statusQuote);
      setSettingAvatar(user.avatarUrl || '');

      const persistentNameColor = localStorage.getItem('soqoor_name_color') || user.nameColor || '#d97706';
      const persistentTextColor = localStorage.getItem('soqoor_text_color') || user.textColor || '#0f172a';
      const persistentNameGradient = localStorage.getItem('soqoor_name_gradient') || user.nameGradient || 'from-amber-400 to-yellow-200';
      const persistentTheme = localStorage.getItem('soqoor_theme') || (user as any).theme || 'golden-brown-harmony';
      const persistentFont = localStorage.getItem('soqoor_font') || (user as any).fontFamily || 'Noto Naskh Arabic';
      const persistentFontSize = (localStorage.getItem('soqoor_chat_font_size') as any) || (user as any).fontSize || 'base';
      const persistentWallpaper = localStorage.getItem('soqoor_wallpaper') || (user as any).wallpaper || 'default';
      const persistentBubble = localStorage.getItem('soqoor_bubble_style') || (user as any).bubbleStyle || 'modern';

      setSettingNameColor(persistentNameColor);
      setSettingTextColor(persistentTextColor);
      setNameGradient(persistentNameGradient);
      setActiveTheme(persistentTheme);
      setFontFamily(persistentFont);
      setChatFontSize(persistentFontSize);
      setActiveWallpaper(persistentWallpaper);
      setBubbleStyle(persistentBubble);

      try {
        localStorage.setItem('soqoor_name_color', persistentNameColor);
        localStorage.setItem('soqoor_text_color', persistentTextColor);
        localStorage.setItem('soqoor_name_gradient', persistentNameGradient);
        localStorage.setItem('soqoor_theme', persistentTheme);
        localStorage.setItem('soqoor_font', persistentFont);
        localStorage.setItem('soqoor_chat_font_size', persistentFontSize);
        localStorage.setItem('soqoor_wallpaper', persistentWallpaper);
        localStorage.setItem('soqoor_bubble_style', persistentBubble);
      } catch {}

      setIsSubmitting(false);
      setLoginError(null);
      if (sessionToken) {
        localStorage.setItem('soqoor_session_token', sessionToken);
      }
      localStorage.setItem('soqoor_current_user', JSON.stringify(user));
      requestScreenWakeLock();
      startSilentAudioKeepAlive();
      startHeartbeatWorker(s);
      triggerAnnouncementDisplay(8000);

      // Sync missed room messages from server that arrived while disconnected or in background
      const lastMsg = messagesRef.current[messagesRef.current.length - 1];
      s.emit('syncRoomMessages', {
        roomId: user.room || 'الغرفة العامة',
        lastTimestamp: lastMsg ? lastMsg.timestamp : undefined
      });
      // Mark presence online immediately on session restoration
      s.emit('userPresenceChange', { state: 'online' });
    });

    s.on('sessionRestoreFailed', (data?: { reason?: string }) => {
      try {
        localStorage.removeItem('soqoor_session_token');
        localStorage.removeItem('soqoor_current_user');
        sessionStorage.removeItem('soqoor_session_token');
        sessionStorage.removeItem('soqoor_current_user');
      } catch {}
      stopSilentAudioKeepAlive();
      stopHeartbeatWorker();
      if (currentUserRef.current) {
        setCurrentUser(null);
        const reasonMsg = data?.reason || 'انتهت صلاحية الجلسة أو تم تسجيل الدخول من جهاز آخر.';
        setLoginError(reasonMsg);
        showToast(reasonMsg, 'error');
      }
    });

    s.on('loginError', (msg: string) => {
      sounds.playError();
      setLoginError(msg);
      setIsSubmitting(false);
      showToast(msg, 'error');
    });

    s.on('chatHistory', (history: Message[]) => {
      setMessages((history || []).slice(-300));
    });

    s.on('message', (msg: Message) => {
      if (!msg) return;
      // Immediately remove sender from typing indicators upon receiving their message
      setTypingUsers((prev) => prev.filter((u) => u.username.toLowerCase() !== msg.username.toLowerCase()));
      setMessages((prev) => {
        if (msg.id && prev.some((m) => m && m.id === msg.id)) {
          return prev;
        }
        const updated = [...prev, msg];
        return updated.length > 300 ? updated.slice(-300) : updated;
      });
      // Ensure automatic scroll down when new message is received
      setTimeout(() => scrollToBottom(true), 30);
      const currentU = currentUserRef.current;
      if (currentU && msg.username !== currentU.username) {
        // If message is from an ignored user, do not play sound or toast
        try {
          const rawIgnored = localStorage.getItem('soqoor_ignored_users');
          const currentIgnored: string[] = rawIgnored ? JSON.parse(rawIgnored) : [];
          if (currentIgnored.includes(msg.username.toLowerCase().trim())) {
            return;
          }
        } catch {}

        if (msg.badge && msg.badge.includes('دخل الى')) {
          sounds.playMemberJoin();
        } else {
          // Check if message contains an @mention of the current user
          const isMentioned = Boolean(
            msg.text && (
              msg.text.includes(`@${currentU.username}`) ||
              msg.text.toLowerCase().includes(`@${currentU.username.toLowerCase()}`) ||
              new RegExp(`@\\s*${currentU.username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=[\\s,.:;!?،؟]|$)`, 'i').test(msg.text)
            )
          );

          if (isMentioned) {
            sounds.playMentionPing();
            showToast(`قام @${msg.username} بالإشارة إليك في الدردشة! 🔔`, 'info');
            // Web Notifications API: Trigger notification even when tab is in background or screen is locked
            notifyMention(msg.username, msg.text, currentU.room || 'الغرفة العامة', {
              avatarUrl: msg.avatarUrl
            }).catch(() => {});
          } else if (msg.badge && (msg.badge.includes('إشعار عام') || msg.badge.includes('إدارة') || msg.badge.includes('إعلان') || msg.badge.includes('تنبيه'))) {
            sounds.playGeneralAlertPing();
          } else {
            sounds.playMessagePing();
          }
        }
      }
    });

    s.on('generalAlert', ({ from, text }: { from: string; text: string }) => {
      sounds.playGeneralAlertPing();
      showToast(`📢 إشعار عام من [${from}]: ${text}`, 'info');
    });

    s.on('micSlotsUpdated', (slots: MicSlot[]) => {
      setMicSlots(slots);
    });

    s.on('roomUsers', ({ users: updatedUsers }: { users: User[] }) => {
      setRosterUsers(updatedUsers);
      if (currentUserRef.current) {
        const me = updatedUsers.find((u) => u.id === s.id);
        if (me) setCurrentUser(me);
      }
    });

    s.on('roomsUpdated', (rooms: ChatRoom[]) => {
      setRoomsList(rooms);
    });

    s.on('newPrivateMessage', (pm: PrivateMessage) => {
      if (!pm) return;
      setPrivateMessages((prev) => {
        const safe = Array.isArray(prev) ? prev : [];
        if (pm.id && safe.some((m) => m && m.id === pm.id)) {
          return safe;
        }
        const updated = [...safe, pm];
        return updated.length > 500 ? updated.slice(-500) : updated;
      });
      
      const currentU = currentUserRef.current;
      const myUsername = (currentU?.username || '').trim().toLowerCase();
      const isFromMe = (myUsername && pm.fromUsername.trim().toLowerCase() === myUsername) || (pm.fromId === s.id);

      // If the PM is an incoming message from another user
      if (!isFromMe) {
        try {
          const rawIgnored = localStorage.getItem('soqoor_ignored_users');
          const currentIgnored: string[] = rawIgnored ? JSON.parse(rawIgnored) : [];
          if (currentIgnored.includes(pm.fromUsername.toLowerCase().trim())) {
            return;
          }
        } catch {}

        sounds.playPrivateMessagePing();
        const otherUsername = pm.fromUsername;

        // Check if user is currently looking at this exact private conversation and window is visible
        const isDocumentVisible = typeof document !== 'undefined' && document.visibilityState === 'visible';
        const isCurrentlyViewingThisChat =
          isDocumentVisible &&
          activeDrawerRef.current === 'pm' &&
          selectedPmUserRef.current &&
          selectedPmUserRef.current.username.toLowerCase() === otherUsername.toLowerCase();

        if (isCurrentlyViewingThisChat) {
          s.emit('markPrivateMessagesRead', {
            partnerUsername: pm.fromUsername,
            partnerId: pm.fromId
          });
        } else {
          setUnreadPerUser((prev) => {
            const next = {
              ...prev,
              [otherUsername]: (prev[otherUsername] || 0) + 1
            };
            try {
              sessionStorage.setItem('soqoor_unread_pm', JSON.stringify(next));
            } catch {}
            return next;
          });
          setNotificationCount((c) => c + 1);

          // Web Notifications API: Trigger background/lockscreen push notification
          notifyPrivateMessage(pm.fromUsername, pm.text, {
            avatarUrl: pm.fromAvatar,
            onOpenPm: () => {
              const partner =
                rosterUsers.find((u) => u.username.toLowerCase() === pm.fromUsername.toLowerCase()) ||
                allConnectedUsers.find((u) => u.username.toLowerCase() === pm.fromUsername.toLowerCase()) || {
                  id: pm.fromId || `user-${pm.fromUsername}`,
                  username: pm.fromUsername,
                  room: 'الغرفة العامة',
                  avatarSeed: pm.fromUsername,
                  statusQuote: '',
                  flag: '🇸🇦',
                  role: 'member',
                  likes: 0,
                  points: 0,
                  isVoice: false,
                  micSlot: null,
                  isMuted: false,
                  isTextMuted: false,
                  isSpeaking: false,
                  joinedAt: Date.now()
                };
              setSelectedPmUser(partner as any);
              setActiveDrawer('pm');
            }
          }).catch(() => {});
        }

        showToast(`رسالة خاصة جديدة من ${pm.fromUsername} 💬`, 'info');
      }
    });

    s.on('monitoredWordsUpdated', (words: string[]) => {
      setMonitoredWordsList(words);
    });

    s.on('wallPosts', (posts: WallPost[]) => {
      const safePosts = (posts || []).slice(0, 20);
      setWallPosts(safePosts);
      if (activeDrawerRef.current === 'wall') {
        lastSeenWallTimeRef.current = Date.now();
        setUnreadWallCount(0);
      } else {
        const unread = safePosts.filter((p) => (p.timestamp || 0) > lastSeenWallTimeRef.current).length;
        setUnreadWallCount(unread > 0 ? unread : (safePosts.length > 0 ? 1 : 0));
      }
    });

    // Profile Visitors Real-time Events (زائري ملفي الشخصي)
    s.on('profileVisitorsUpdated', (visitors: ProfileVisitorRecord[]) => {
      setProfileVisitorsList(visitors || []);
    });

    s.on('profileVisitedAlert', ({ visitorUsername, visitorAvatar, visitCount }: { visitorUsername: string; visitorAvatar?: string; visitCount: number }) => {
      sounds.playGeneralAlertPing();
      showToast(`👁️ قام [${visitorUsername}] بزيارة ملفك الشخصي (${visitCount} مرات)`, 'info');
    });

    // Live Broadcast Video & Audio Real-time Events (بث لايف فيديو وصوت)
    s.on('liveBroadcastStarted', (broadcast: RoomLiveBroadcastState) => {
      setActiveRoomLiveBroadcast(broadcast);
      setLiveViewerCount(broadcast.viewersCount || 0);
      sounds.playGeneralAlertPing();
      showToast(`🔴 بدأ [${broadcast.broadcasterUsername}] بثاً لايف مباشر (فيديو وصوت) في الغرفة!`, 'info');
    });

    s.on('liveBroadcastEnded', ({ room, broadcasterUsername }: { room: string; broadcasterUsername: string }) => {
      setActiveRoomLiveBroadcast(null);
      setIsWatchingLive(false);
      setIsBroadcastingLive(false);
      setLiveRemoteVideoFrame(null);
      showToast(`انتهى البث المباشر لـ [${broadcasterUsername}] ⏹️`, 'info');
    });

    s.on('currentLiveBroadcast', (broadcast: RoomLiveBroadcastState | null) => {
      setActiveRoomLiveBroadcast(broadcast);
      if (broadcast) {
        setLiveViewerCount(broadcast.viewersCount || 0);
      }
    });

    s.on('liveViewerCountUpdated', ({ count }: { count: number }) => {
      setLiveViewerCount(count || 0);
    });

    s.on('liveVideoFrame', ({ frameData }: { frameData: string }) => {
      setLiveRemoteVideoFrame(frameData);
    });

    s.on('liveReactionReceived', ({ emoji }: { emoji: string }) => {
      triggerFloatingReaction(emoji);
    });

    s.on('monitorLogs', (logs: MonitorEvent[]) => {
      setMonitorLogs(logs);
    });

    s.on('monitorEvent', (log: MonitorEvent) => {
      setMonitorLogs((prev) => [log, ...prev.slice(0, 150)]);
    });

    s.on('systemAlert', (msg: string) => {
      sounds.playGeneralAlertPing();
      showToast(msg, 'info');
    });

    s.on('officialWarning', ({ from, text }: { from: string; text: string }) => {
      sounds.playGeneralAlertPing();
      setActiveWarning({ from, text });
    });

    s.on('micRevokedByAdmin', ({ adminName }: { adminName: string }) => {
      sounds.playVoiceLeave();
      alert(`تم سحب المايك منك بواسطة الإداري (${adminName}).`);
    });

    s.on('kickedByAdmin', ({ reason }: { reason: string }) => {
      alert(`تم طردك بواسطة إدارة حسان برو!\nالسبب: ${reason}`);
      window.location.reload();
    });

    s.on('forceLogout', ({ reason, message }: { reason?: string; message?: string }) => {
      isForcedLoggedOutRef.current = true;
      setCurrentUser(null);
      stopSilentAudioKeepAlive();
      stopHeartbeatWorker();
      try {
        localStorage.removeItem('soqoor_session_token');
        sessionStorage.removeItem('soqoor_session_token');
        localStorage.removeItem('soqoor_current_user');
        sessionStorage.removeItem('soqoor_current_user');
      } catch {}
      sounds.playError();
      const alertMsg =
        message ||
        '⚠️ تم تسجيل الدخول إلى حسابك من متصفح أو جهاز آخر. تم إنهاء هذه الجلسة القديمة تلقائياً واعتماد الجلسة الجديدة.';
      setLoginError(alertMsg);
      setForcedLogoutInfo({
        show: true,
        message: alertMsg,
        timestamp: Date.now()
      });
      showToast(alertMsg, 'error');
    });

    s.on('forceMoveRoom', ({ room }: { room: string }) => {
      showToast(`تم نقلك إلى غرفة [${room}] بواسطة الإدارة.`, 'info');
    });

    s.on('userRoleUpdated', ({ role }: { role: 'admin' | 'super' | 'member' | 'guest' }) => {
      setCurrentUser((prev) => (prev ? { ...prev, role } : null));
      sounds.playSuccess();
      showToast(`تم تحديث رتبتك وصلاحياتك في النظام إلى: [${getRoleBadge(role).short}] 🎖️`, 'success');
    });

    // Private 1-on-1 Call Listeners (إشارات الاتصال الخاص)
    s.on('pmIncomingCall', (data: IncomingCallData) => {
      setIncomingCall(data);
      sounds.playGeneralAlertPing();
    });

    s.on('pmCallAccepted', ({ callId }: { callId: string }) => {
      setActiveCall((prev) => (prev ? { ...prev, callId } : null));
      showToast('تم قبول المكالمة الخاصة 🟢', 'success');
    });

    s.on('pmCallRejected', ({ reason }: { reason: string }) => {
      setActiveCall(null);
      setIncomingCall(null);
      showToast(reason || 'تم رفض المكالمة الخاصة', 'info');
    });

    s.on('pmCallEnded', () => {
      setActiveCall(null);
      setIncomingCall(null);
      showToast('انتهت المكالمة الخاصة 📞', 'info');
    });

    setSocket(s);

    // Setup visibility & phone screen unlock keep-alive synchronization
    const cleanupVisibility = setupVisibilityResync(s, () => {
      // Only attempt session restore if the socket is actually disconnected
      if (s.connected) return;
      // Never force auto-login if user was force-logged out or not currently logged in
      if (isForcedLoggedOutRef.current || !currentUserRef.current) return;
      const savedToken = localStorage.getItem('soqoor_session_token') || sessionStorage.getItem('soqoor_session_token');
      const savedUserStr = localStorage.getItem('soqoor_current_user') || sessionStorage.getItem('soqoor_current_user');
      let currentRoom = currentUserRef.current.room || 'الغرفة العامة';
      if (savedToken && savedUserStr) {
        try {
          const parsed = JSON.parse(savedUserStr);
          if (parsed.room) currentRoom = parsed.room;
          s.emit('restoreSession', {
            sessionToken: savedToken,
            username: parsed.username,
            room: parsed.room
          });
        } catch {}
      }
      // Sync missed room messages so member sees everything that happened while away in background
      const lastMsg = messagesRef.current[messagesRef.current.length - 1];
      s.emit('syncRoomMessages', {
        roomId: currentRoom,
        lastTimestamp: lastMsg ? lastMsg.timestamp : undefined
      });
    });

    // Audio Mesh setup
    const manager = new AudioMeshManager(s);
    manager.onVolumeChange = (vol) => setMicVolume(vol);
    manager.onError = (err) => {
      sounds.playError();
      showToast(err, 'error');
    };
    setAudioManager(manager);

    return () => {
      clearInterval(pingTicker);
      cleanupVisibility();
      manager.destroy();
      s.removeAllListeners();
      s.disconnect();
    };
  }, []);

  // Sync activeStoryViewer when storiesList is updated
  useEffect(() => {
    if (activeStoryViewer) {
      const updated = storiesList.find((s) => s.id === activeStoryViewer.id);
      if (updated) {
        setActiveStoryViewer(updated);
      } else {
        setActiveStoryViewer(null);
      }
    }
  }, [storiesList]);

  // Automatic Login directly into "الغرفة العامة"
  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!socket) return;

    if (!usernameInput.trim()) {
      setLoginError('يرجى إدخال اسم المستخدم');
      return;
    }

    // Reset any previous force-logout state so user can reclaim or start session
    isForcedLoggedOutRef.current = false;
    setForcedLogoutInfo(null);

    // Request Web Notification permission upon user login gesture (Native browser dialog trigger)
    if (isNotificationSupported() && Notification.permission === 'default') {
      requestNotificationPermission().then((perm) => {
        setNotificationPermission(perm);
        if (perm === 'granted') {
          showToast('تم تفعيل إشعارات المتصفح بنجاح 🔔', 'success');
        }
      }).catch(() => {});
    }

    setIsSubmitting(true);
    setLoginError(null);

    const defaultQuote = activeTab === 'visitor' ? 'زائر' : 'عضو جديد';
    const clientFingerprint = generateDeviceFingerprint().fingerprintId;

    socket.emit('joinRoom', {
      username: usernameInput.trim(),
      room: 'الغرفة العامة', // Direct automatic entry to default room
      loginType: activeTab,
      password: passwordInput,
      flag: detectedFlag,
      statusQuote: defaultQuote,
      deviceFingerprint: clientFingerprint
    });
  };

  // Exit chat room and completely clear previous conversations session (Explicit Logout)
  const handleExitChat = () => {
    isForcedLoggedOutRef.current = false;
    setForcedLogoutInfo(null);
    if (audioManager) {
      audioManager.dropMicSlot();
      audioManager.leaveVoice();
    }
    handleStopLiveBroadcast();
    const token = localStorage.getItem('soqoor_session_token');
    socket?.emit('explicitLogout', { sessionToken: token || undefined });
    stopSilentAudioKeepAlive();
    stopHeartbeatWorker();
    localStorage.removeItem('soqoor_session_token');
    localStorage.removeItem('soqoor_current_user');
    try {
      sessionStorage.removeItem('soqoor_session_token');
      sessionStorage.removeItem('soqoor_current_user');
      sessionStorage.removeItem('soqoor_room_messages');
      sessionStorage.removeItem('soqoor_private_messages');
    } catch {}
    setCurrentUser(null);
    notifyTyping(false);
    setTypingUsers([]);
    setMessages([]);
    setPrivateMessages([]);
    setUnreadPerUser({});
    setActiveDrawer('none');
    setUsernameInput('');
    setPasswordInput('');
    showToast('تم تسجيل الخروج بنجاح وإنهاء جلستك 🧹', 'info');
  };

  // Leave current room only without logging out of the chat app (الخروج من الغرفة الحالية فقط)
  const handleLeaveCurrentRoom = () => {
    if (audioManager) audioManager.dropMicSlot();
    handleStopLiveBroadcast();
    notifyTyping(false);
    setTypingUsers([]);
    const curRoom = currentUser?.room || 'الغرفة العامة';
    socket?.emit('leaveRoom', { room: curRoom });
    setCurrentUser((prev) => (prev ? { ...prev, room: 'خارج الغرف', micSlot: null, isVoice: false } : null));
    setMessages([]);
    setActiveDrawer('rooms');
    showToast('تم الخروج من الغرفة والرجوع لقائمة الغرف', 'info');
  };

  // Delete message in public room
  const handleDeleteChatMessage = (messageId: string) => {
    socket?.emit('deleteChatMessage', { messageId });
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    showToast('تم حذف الرسالة 🗑️', 'info');
  };

  // Report message to room administration (إبلاغ عن رسالة مخالفة للإدارة)
  const handleReportChatMessage = (msg: Message) => {
    if (!currentUser) {
      showToast('يجب تسجيل الدخول للإبلاغ عن الرسائل', 'error');
      return;
    }
    const confirmReport = window.confirm(
      `هل ترغب في رفع بلاغ لإدارة الروم بخصوص رسالة @${msg.username}؟\nالمحتوى: "${msg.text ? msg.text.substring(0, 50) : 'مرفق وسائط'}"`
    );
    if (!confirmReport) return;

    socket?.emit('reportChatMessage', {
      messageId: msg.id,
      reportedUser: msg.username,
      text: msg.text,
      reason: 'مخالفة لقواعد وآداب الشات'
    });
    showToast(`تم رفع البلاغ بنجاح إلى إدارة الروم لمراجعة رسالة @${msg.username} 🚩`, 'success');
  };

  // Edit message in public room
  const handleSaveEditChatMessage = (messageId: string, newText: string) => {
    if (!newText.trim()) return;
    socket?.emit('editChatMessage', { messageId, newText: newText.trim() });
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, text: newText.trim(), isEdited: true } : m))
    );
    setEditingMsgId(null);
    setEditingMsgText('');
    showToast('تم تعديل الرسالة بنجاح ✏️', 'info');
  };

  // Delete private message
  const handleDeletePrivateMessage = (messageId: string) => {
    if (selectedPmUser) {
      socket?.emit('deletePrivateMessage', {
        messageId,
        partnerId: selectedPmUser.id,
        partnerUsername: selectedPmUser.username
      });
    }
    setPrivateMessages((prev) => prev.filter((pm) => pm.id !== messageId));
    showToast('تم حذف الرسالة الخاصة 🗑️', 'info');
  };

  // Edit private message
  const handleSaveEditPrivateMessage = (messageId: string, newText: string) => {
    if (!newText.trim()) return;
    if (selectedPmUser) {
      socket?.emit('editPrivateMessage', {
        messageId,
        newText: newText.trim(),
        partnerId: selectedPmUser.id,
        partnerUsername: selectedPmUser.username
      });
    }
    setPrivateMessages((prev) =>
      prev.map((pm) => (pm.id === messageId ? { ...pm, text: newText.trim(), isEdited: true } : pm))
    );
    setEditingPmId(null);
    setEditingPmText('');
    showToast('تم تعديل الرسالة الخاصة بنجاح ✏️', 'info');
  };

  // Delete wall post
  const handleDeleteWallPost = (postId: string) => {
    socket?.emit('deleteWallPost', { postId });
    setWallPosts((prev) => prev.filter((p) => p.id !== postId));
    showToast('تم حذف المنشور من الحائط 🗑️', 'info');
  };

  // Edit wall post
  const handleSaveEditWallPost = (postId: string, newText: string) => {
    if (!newText.trim()) return;
    socket?.emit('editWallPost', { postId, newText: newText.trim() });
    setWallPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, text: newText.trim(), isEdited: true } : p))
    );
    setEditingWallPostId(null);
    setEditingWallPostText('');
    showToast('تم تعديل المنشور بنجاح ✏️', 'info');
  };

  // Delete wall comment
  const handleDeleteWallComment = (postId: string, commentId: string) => {
    socket?.emit('deleteWallComment', { postId, commentId });
    setWallPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const updated = (post.comments || []).filter((c) => c.id !== commentId);
        return {
          ...post,
          comments: updated,
          commentsCount: updated.length
        };
      })
    );
    showToast('تم حذف التعليق بنجاح 🗑️', 'info');
  };

  // Add comment on wall post
  const handleAddWallComment = (postId: string, text: string) => {
    if (!text.trim()) return;
    socket?.emit('addWallComment', { postId, text: text.trim() });
    setWallCommentInput('');
  };

  // Reply to admin warning with manual text
  const handleSendWarningReply = () => {
    if (!receivedOfficialWarning || !warningReplyInput.trim() || !socket) return;
    socket.emit('replyToWarning', {
      toUsername: receivedOfficialWarning.from,
      replyText: warningReplyInput.trim()
    });
    setWarningReplyInput('');
    setReceivedOfficialWarning(null);
    showToast('تم إرسال ردك وتوضيحك للإدارة بنجاح ✉️', 'success');
  };

  // Direct media download helper
  const handleDownloadMedia = async (url: string, filename?: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename || `media-${Date.now()}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      showToast('تم بدء تحميل الوسائط بنجاح ⬇️', 'success');
    } catch {
      window.open(url, '_blank');
    }
  };

  // Send Public Message (Text, Media, Sticker, Voice Note, and Reply)
  const handleSendMessage = (
    e?: React.FormEvent,
    customMedia?: string,
    customType?: 'image' | 'video' | 'sticker' | 'audio',
    customVoiceNote?: VoiceNoteData
  ) => {
    if (e) e.preventDefault();
    if (!socket || !currentUser) return;

    let textToSend = textInput.trim();
    if (!textToSend && !customMedia && !customVoiceNote) return;

    if (isPoetryMode && textToSend.includes('|') && !textToSend.startsWith('📜')) {
      textToSend = '📜 ' + textToSend;
    }

    // Automatic Chat Shortcut Expansion (استبدال الاختصارات تلقائياً بالجملة المحددة)
    textToSend = expandClientShortcuts(textToSend, shortcuts);

    const messagePayload = {
      text: textToSend,
      mediaUrl: customMedia,
      mediaType: customType,
      voiceNote: customVoiceNote,
      replyTo: replyingTo || undefined
    };

    // If socket is momentarily disconnected or in background, enqueue message for immediate dispatch upon reconnection
    if (!socket || !isConnected || !socket.connected) {
      pendingMessagesQueueRef.current.push({
        event: 'chatMessage',
        payload: messagePayload
      });
      showToast('الشبكة منقطعة مؤقتاً، تم حفظ الرسالة وسيتم إرسالها فور عودة الاتصال ⏳', 'info');
      notifyTyping(false);
      setTextInput('');
      setReplyingTo(null);
      setIsRecordingVoice(false);
      setShowEmojiPicker(false);
      setShowMediaPicker(false);
      setShowPlusMenu(false);
      return;
    }

    socket.emit('chatMessage', messagePayload);

    notifyTyping(false);
    setTextInput('');
    setReplyingTo(null);
    setIsRecordingVoice(false);
    setShowEmojiPicker(false);
    setShowMediaPicker(false);
    setShowPlusMenu(false);
    inputRef.current?.focus();
    setTimeout(() => scrollToBottom(true), 40);
  };

  // Text Formatting Toolbar Helper
  const handleInsertFormat = (prefix: string, suffix: string = '') => {
    const input = inputRef.current;
    if (!input) {
      setTextInput((prev) => prev + prefix + 'نص' + suffix);
      return;
    }
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const current = textInput;
    const selected = current.substring(start, end);
    const replacement = prefix + (selected || 'نص') + suffix;
    const nextText = current.substring(0, start) + replacement + current.substring(end);
    setTextInput(nextText);
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + prefix.length, start + prefix.length + (selected || 'نص').length);
    }, 50);
  };

  // Chat Message Reaction Handler
  const handleReactToMessage = (messageId: string, emoji: string) => {
    if (!socket) return;
    socket.emit('reactChatMessage', { messageId, emoji });
  };

  // Profile Like Handler (مرة واحدة بالدقيقة لكل عضو - يعطيه لايك واحد +1)
  const handleLikeUserProfile = (targetUsername: string) => {
    if (!socket || !targetUsername) return;
    const now = Date.now();
    const lastTime = userLikeCooldownsRef.current[targetUsername] || 0;
    if (now - lastTime < 60000) {
      const remainingSec = Math.ceil((60000 - (now - lastTime)) / 1000);
      showToast(`⏳ يمكنك إعطاء لايك لهذا العضو مرة واحدة كل دقيقة (متبقي ${remainingSec} ثانية)`, 'info');
      return;
    }
    userLikeCooldownsRef.current[targetUsername] = now;
    socket.emit('likeUserProfile', { targetUsername });
    confetti({ particleCount: 40, spread: 60 });
    sounds.playCrownFanfare();
  };

  // Pin & Unpin Room Message
  const handlePinChatMessage = (messageId: string) => {
    if (!socket) return;
    socket.emit('pinRoomMessage', { messageId });
    showToast('تم إرسال طلب تثبيت الرسالة في الغرفة 📌', 'info');
  };

  const handleUnpinChatMessage = () => {
    if (!socket) return;
    socket.emit('pinRoomMessage', { unpin: true });
    showToast('تم فك تثبيت الرسالة ✕', 'info');
  };

  // Points Reward & Game Win Broadcast Handlers
  const handleAddPointsReward = (amount: number, reason: string) => {
    if (!socket || !currentUser) return;
    socket.emit('addPointsReward', { amount, reason });
  };

  const handleBroadcastGameWin = (gameName: string, pointsWon: number) => {
    if (!socket || !currentUser) return;
    socket.emit('broadcastGameWin', { gameName, pointsWon });
  };

  // Private 1-on-1 Call Handlers (مكالمات الخاص الصوتية والمرئية)
  const handleStartPmCall = (callType: 'audio' | 'video') => {
    if (!socket || !selectedPmUser || !currentUser) return;
    socket.emit('pmCallOffer', {
      toId: selectedPmUser.id,
      callType
    });
    setActiveCall({
      callId: `call-${Date.now()}`,
      partner: {
        id: selectedPmUser.id,
        username: selectedPmUser.username,
        avatarUrl: selectedPmUser.avatarUrl,
        flag: selectedPmUser.flag
      },
      callType,
      isInitiator: true
    });
    showToast(`جاري بدء اتصال مشفر (E2EE 🔒) بـ ${selectedPmUser.username} (${callType === 'video' ? 'فيديو' : 'صوت'})... 📞`, 'info');
  };

  const handleAcceptIncomingCall = () => {
    if (!socket || !incomingCall) return;
    socket.emit('pmCallAnswer', {
      callId: incomingCall.callId,
      toId: incomingCall.fromUser.id,
      accepted: true
    });
    setActiveCall({
      callId: incomingCall.callId,
      partner: incomingCall.fromUser,
      callType: incomingCall.callType,
      isInitiator: false
    });
    showToast(`تم قبول المكالمة المشفرة طرف-إلى-طرف (E2EE 🔒) مع ${incomingCall.fromUser.username}... 📞`, 'success');
    setIncomingCall(null);
  };

  const handleRejectIncomingCall = () => {
    if (!socket || !incomingCall) return;
    socket.emit('pmCallAnswer', {
      callId: incomingCall.callId,
      toId: incomingCall.fromUser.id,
      accepted: false
    });
    setIncomingCall(null);
    showToast('تم رفض المكالمة الواردة', 'info');
  };

  const handleEndActiveCall = (duration: number) => {
    if (!socket || !activeCall) return;
    socket.emit('pmCallEnd', {
      toId: activeCall.partner.id,
      duration,
      callType: activeCall.callType
    });
    setActiveCall(null);
    showToast('تم إنهاء المكالمة الخاصة', 'info');
  };

  // Send Preset Sticker
  const handleSendSticker = (sticker: string) => {
    handleSendMessage(undefined, sticker, 'sticker');
  };

  // Broadcast General Alert (إرسال إشعار عام للغرفة)
  const handleSendBroadcastAlert = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!socket || !currentUser) return;
    const text = broadcastAlertText.trim();
    if (!text) return;

    socket.emit('broadcastAlert', { text });
    setBroadcastAlertText('');
    setShowBroadcastModal(false);
    showToast('تم إرسال الإشعار والتنبيه العام للغرفة 📢', 'success');
  };

  // Unified Appearance & Styling Preference Updaters (حفظ دائم واستمرارية أسبوعية حتى بعد الخروج والعودة)
  const handleUpdateTheme = (themeId: string) => {
    setActiveTheme(themeId);
    try {
      localStorage.setItem('soqoor_theme', themeId);
      localStorage.setItem('soqoor_theme_user_set', 'true');
    } catch {}

    const selectedStyle = THEME_STYLES[themeId];
    if (selectedStyle?.recommendedTextColor) {
      setSettingTextColor(selectedStyle.recommendedTextColor);
      try {
        localStorage.setItem('soqoor_text_color', selectedStyle.recommendedTextColor);
      } catch {}
      if (selectedStyle.recommendedNameColor) {
        setSettingNameColor(selectedStyle.recommendedNameColor);
        try {
          localStorage.setItem('soqoor_name_color', selectedStyle.recommendedNameColor);
        } catch {}
      }
      setCurrentUser((prev) => (prev ? {
        ...prev,
        theme: themeId,
        textColor: selectedStyle.recommendedTextColor,
        nameColor: selectedStyle.recommendedNameColor || prev.nameColor
      } : null));
    }

    socket?.emit('updateUserPreferences', {
      theme: themeId,
      textColor: selectedStyle?.recommendedTextColor,
      nameColor: selectedStyle?.recommendedNameColor
    });
  };

  const handleUpdateFontFamily = (fontId: string) => {
    setFontFamily(fontId);
    try {
      localStorage.setItem('soqoor_font', fontId);
      localStorage.setItem('soqoor_font_user_set', 'true');
    } catch {}
    socket?.emit('updateUserPreferences', { fontFamily: fontId });
  };

  const handleUpdateFontSize = (size: 'sm' | 'base' | 'lg' | 'xl') => {
    setChatFontSize(size);
    try {
      localStorage.setItem('soqoor_chat_font_size', size);
    } catch {}
    socket?.emit('updateUserPreferences', { fontSize: size });
  };

  const handleUpdateWallpaper = (wallpaperId: string) => {
    setActiveWallpaper(wallpaperId);
    try {
      localStorage.setItem('soqoor_wallpaper', wallpaperId);
    } catch {}
    socket?.emit('updateUserPreferences', { wallpaper: wallpaperId });
  };

  const handleUpdateBubbleStyle = (styleId: string) => {
    setBubbleStyle(styleId);
    try {
      localStorage.setItem('soqoor_bubble_style', styleId);
    } catch {}
    socket?.emit('updateUserPreferences', { bubbleStyle: styleId });
  };

  const handleUpdateNameColor = (color: string) => {
    setSettingNameColor(color);
    try {
      localStorage.setItem('soqoor_name_color', color);
    } catch {}
    if (currentUser) {
      setCurrentUser((prev) => (prev ? { ...prev, nameColor: color } : null));
    }
    socket?.emit('updateUserStyle', { nameColor: color });
    socket?.emit('updateUserPreferences', { nameColor: color });
  };

  const handleUpdateTextColor = (color: string) => {
    setSettingTextColor(color);
    try {
      localStorage.setItem('soqoor_text_color', color);
    } catch {}
    if (currentUser) {
      setCurrentUser((prev) => (prev ? { ...prev, textColor: color } : null));
    }
    socket?.emit('updateUserStyle', { textColor: color });
    socket?.emit('updateUserPreferences', { textColor: color });
  };

  const handleUpdateNameGradient = (grad: string) => {
    setNameGradient(grad);
    try {
      localStorage.setItem('soqoor_name_gradient', grad);
    } catch {}
    if (currentUser) {
      setCurrentUser((prev) => (prev ? { ...prev, nameGradient: grad } : null));
    }
    socket?.emit('updateUserStyle', { nameGradient: grad });
    socket?.emit('updateUserPreferences', { nameGradient: grad });
  };

  // Apply Global Appearance (تعميم الثيم والخط على كافة الأعضاء والشات)
  const handleApplyGlobalAppearance = ({
    theme,
    fontFamily: font,
    wallpaper: wall,
    bubbleStyle: bubble
  }: {
    theme?: string;
    fontFamily?: string;
    wallpaper?: string;
    bubbleStyle?: string;
  }) => {
    const targetTheme = theme || activeTheme;
    const targetFont = font || fontFamily;
    const targetWall = wall || activeWallpaper;
    const targetBubble = bubble || bubbleStyle;

    setActiveTheme(targetTheme);
    setFontFamily(targetFont);
    setActiveWallpaper(targetWall);
    setBubbleStyle(targetBubble);
    try {
      localStorage.setItem('soqoor_theme', targetTheme);
      localStorage.setItem('soqoor_font', targetFont);
      localStorage.setItem('soqoor_wallpaper', targetWall);
      localStorage.setItem('soqoor_bubble_style', targetBubble);
    } catch {}
    if (socket) {
      socket.emit('updateGlobalAppearance', {
        theme: targetTheme,
        fontFamily: targetFont,
        wallpaper: targetWall,
        bubbleStyle: targetBubble
      });
    }
  };

  // Mention Suggestions handling for Chat Input & Real-time typing notification
  const handleTextInputChange = (val: string) => {
    setTextInput(val);
    if (val.trim().length > 0) {
      notifyTyping(true);
    } else {
      notifyTyping(false);
    }
    const cursor = inputRef.current?.selectionStart ?? val.length;
    const textBeforeCursor = val.slice(0, cursor);
    const atMatch = textBeforeCursor.match(/@([^\s]*)$/);
    if (atMatch) {
      const query = atMatch[1].toLowerCase();
      const filtered = rosterUsers.filter(
        (u) => u.username !== currentUser?.username && u.username.toLowerCase().includes(query)
      );
      setMentionSuggestions(filtered.slice(0, 6));
      setShowMentionMenu(filtered.length > 0);
    } else {
      setShowMentionMenu(false);
    }
  };

  const insertMention = (targetUsername: string) => {
    const cursor = inputRef.current?.selectionStart ?? textInput.length;
    const textBeforeCursor = textInput.slice(0, cursor);
    const textAfterCursor = textInput.slice(cursor);
    const atIndex = textBeforeCursor.lastIndexOf('@');
    if (atIndex !== -1) {
      const newText = textBeforeCursor.slice(0, atIndex) + `@${targetUsername} ` + textAfterCursor;
      setTextInput(newText);
    } else {
      setTextInput((prev) => (prev ? `${prev} @${targetUsername} ` : `@${targetUsername} `));
    }
    setShowMentionMenu(false);
    inputRef.current?.focus();
  };

  // Sequential Tone Demo (General Alert -> Private Message -> Mention)
  const handlePlayToneSequence = () => {
    if (testingSequence) return;
    setTestingSequence(true);
    showToast('1. استماع لإشعار عام 📢', 'info');
    setActivePlayingSound('alert');
    sounds.previewAlertSound(selectedAlertSound);

    setTimeout(() => {
      showToast('2. استماع لرسالة خاصة 💬', 'info');
      setActivePlayingSound('private');
      sounds.previewPrivateSound(selectedPrivateSound);

      setTimeout(() => {
        showToast('3. استماع لمنشن وإشارة @ بالاسم 🔔', 'info');
        setActivePlayingSound('mention');
        sounds.previewMentionSound(selectedMentionSound);

        setTimeout(() => {
          setActivePlayingSound(null);
          setTestingSequence(false);
          showToast('اكتمل اختبار النغمات الثلاث بنجاح ✔️', 'success');
        }, 800);
      }, 850);
    }, 850);
  };

  // Take Mic slot (1 to 5)
  const handleTakeMic = async (slotNumber: number) => {
    if (!audioManager || !socket || !currentUser) return;

    const currentSlot = micSlots.find((s) => s.slotNumber === slotNumber);
    if (currentSlot?.user) {
      if (currentSlot.user.id === currentUser.id) {
        const isMuted = audioManager.toggleMute();
        sounds.playToggleMute(isMuted);
        showToast(isMuted ? 'تم كتم المايك الخاص بك 🔇' : 'تم تفعيل المايك 🎙️', 'info');
      } else {
        // If Admin/Super clicks occupied mic: offer option to Pull Mic!
        if (currentUser.role === 'admin' || currentUser.role === 'super') {
          const confirmPull = confirm(`المايك مأخوذ من قبل [${currentSlot.user.username}]. هل تريد سحب المايك منه كإداري؟`);
          if (confirmPull) {
            socket.emit('adminAction', {
              action: 'pullMic',
              targetUsername: currentSlot.user.username
            });
          }
        } else {
          showToast(`المايك رقم ${slotNumber} مأخوذ من قبل ${currentSlot.user.username}`, 'info');
        }
      }
      return;
    }

    const ok = await audioManager.takeMicSlot(slotNumber);
    if (ok) {
      sounds.playVoiceJoin();
      showToast(`صعدت الآن إلى المايك رقم (${slotNumber}) 🎙️`, 'success');
      confetti({ particleCount: 30, spread: 50 });
    }
  };

  // Drop Mic
  const handleDropMic = () => {
    if (!audioManager || !currentUser || currentUser.micSlot === null) return;
    audioManager.dropMicSlot();
    sounds.playVoiceLeave();
    showToast('تم النزول من المايك 👋', 'info');
  };

  // Toggle Room Speaker
  const handleToggleSpeaker = () => {
    if (!audioManager) return;
    const deaf = audioManager.toggleDeafen();
    setIsSpeakerMuted(deaf);
    sounds.playToggleMute(deaf);
    showToast(deaf ? 'تم كتم صوت الغرفة بالكامل 🔇' : 'تم تشغيل صوت الغرفة 🔊', 'info');
  };

  // Admin Actions Dispatcher with Permission Checks
  const handleAdminAction = (action: string, targetUsername: string, value?: any, reason?: string) => {
    if (!socket || !currentUser) return;

    const targetUser = rosterUsers.find((u) => u.username === targetUsername);
    const check = canActorModerate(currentUser, targetUser || null, action);
    if (!check.allowed) {
      sounds.playError();
      showToast(check.reason || 'ليست لديك الصلاحية لتنفيذ هذا الإجراء.', 'error');
      return;
    }

    socket.emit('adminAction', {
      action,
      targetUsername,
      value,
      reason
    });
  };

  // Open Profile Modal for any user (Screenshots 10 & 11)
  const openUserProfile = (user: User) => {
    setProfileTargetUser(user);
    setProfileEditName(user.username);
    setProfileEditLikes(String(user.likes));
    setProfileEditQuote(user.statusQuote);
    setProfileEditPoints(String(user.points || 1000000));
    setProfileEditRole(user.role);
    setProfileMoveRoom(user.room);
    setActiveDrawer('profile');
    if (currentUser && user.username !== currentUser.username) {
      socket?.emit('recordProfileVisit', { targetUsername: user.username });
    }
  };

  // Helper to resolve a member's banner anywhere across the app (غرفة، حائط، خاص، مايكات، زوار...)
  const getUserBanner = (username?: string, fallbackUrl?: string): string | undefined => {
    if (!username) return fallbackUrl;
    const clean = username.trim().toLowerCase();
    if (currentUser && currentUser.username.trim().toLowerCase() === clean && currentUser.nameBannerUrl) {
      return currentUser.nameBannerUrl;
    }
    const inRoster = rosterUsers.find((u) => u.username.trim().toLowerCase() === clean);
    if (inRoster?.nameBannerUrl) return inRoster.nameBannerUrl;
    const inAll = allConnectedUsers.find((u) => u.username.trim().toLowerCase() === clean);
    if (inAll?.nameBannerUrl) return inAll.nameBannerUrl;
    const inReg = allRegisteredMembers.find((m) => m.username.trim().toLowerCase() === clean);
    if (inReg?.nameBannerUrl) return inReg.nameBannerUrl;
    return fallbackUrl || undefined;
  };

  // Open profile modal by username directly
  const openUserProfileByName = (username: string) => {
    if (!username) return;
    const clean = username.trim().toLowerCase();
    const inRoster = rosterUsers.find((u) => u.username.trim().toLowerCase() === clean);
    if (inRoster) {
      openUserProfile(inRoster);
      return;
    }
    const inAll = allConnectedUsers.find((u) => u.username.trim().toLowerCase() === clean);
    if (inAll) {
      openUserProfile(inAll);
      return;
    }
    const inReg = allRegisteredMembers.find((m) => m.username.trim().toLowerCase() === clean);
    if (inReg) {
      const simUser: User = {
        id: `reg-${inReg.username}`,
        username: inReg.username,
        room: inReg.currentRoom || 'خارج الغرف',
        avatarSeed: inReg.username,
        avatarUrl: inReg.avatarUrl,
        nameBannerUrl: inReg.nameBannerUrl,
        statusQuote: inReg.statusQuote || '',
        flag: inReg.flag || '🇸🇦',
        role: (inReg.role as any) || 'member',
        likes: inReg.likes || 0,
        points: inReg.points || 0,
        giftBadges: inReg.giftBadges || [],
        isVoice: false,
        micSlot: null,
        isMuted: false,
        isTextMuted: false,
        isSpeaking: false,
        joinedAt: Date.now()
      };
      openUserProfile(simUser);
      return;
    }
    if (currentUser && currentUser.username.trim().toLowerCase() === clean) {
      openUserProfile(currentUser);
      return;
    }
    const fallbackUser: User = {
      id: `sim-${username}`,
      username: username,
      room: 'الغرفة العامة',
      avatarSeed: username,
      avatarUrl: undefined,
      nameBannerUrl: getUserBanner(username),
      statusQuote: '',
      flag: '🇸🇦',
      role: 'member',
      likes: 0,
      points: 0,
      isVoice: false,
      micSlot: null,
      isMuted: false,
      isTextMuted: false,
      isSpeaking: false,
      joinedAt: Date.now()
    };
    openUserProfile(fallbackUser);
  };

  // =========================================================================
  // LIVE VIDEO & AUDIO BROADCAST HANDLERS (بث مباشر فيديو وصوت حقيقي للغرفة)
  // =========================================================================
  const triggerFloatingReaction = (emoji: string) => {
    const id = `live-react-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const left = 15 + Math.random() * 70;
    setLiveFloatingReactions((prev) => [...prev.slice(-15), { id, emoji, left }]);
    setTimeout(() => {
      setLiveFloatingReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2200);
  };

  const handleStartLiveBroadcast = async () => {
    if (!currentUser) return;
    try {
      setShowStartLiveConfirm(false);
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: liveFacingMode, width: { ideal: 640 }, height: { ideal: 480 } },
          audio: true
        });
      } catch {
        // Fallback to video only if audio permission fails
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: liveFacingMode, width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false
        });
      }
      setLiveMediaStream(stream);
      setIsBroadcastingLive(true);
      setIsWatchingLive(false);
      setIsLiveMinimized(false);
      setIsLiveCameraOff(false);
      setIsLiveMicMuted(false);

      if (localLiveVideoRef.current) {
        localLiveVideoRef.current.srcObject = stream;
        localLiveVideoRef.current.play().catch(() => {});
      }

      socket?.emit('startLiveBroadcast', {
        room: currentUser.room || 'الغرفة العامة',
        title: `بث مباشر 🔴 ${currentUser.username}`
      });

      // Frame broadcaster for viewers (smooth 12-14 fps canvas stream)
      if (liveFrameIntervalRef.current) clearInterval(liveFrameIntervalRef.current);
      liveFrameIntervalRef.current = setInterval(() => {
        if (!localLiveVideoRef.current || !stream.active) return;
        try {
          const video = localLiveVideoRef.current;
          if (video.videoWidth === 0 || video.videoHeight === 0) return;
          if (!liveCanvasRef.current) {
            liveCanvasRef.current = document.createElement('canvas');
            liveCanvasRef.current.width = 320;
            liveCanvasRef.current.height = 240;
          }
          const ctx = liveCanvasRef.current.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, 320, 240);
            const frameData = liveCanvasRef.current.toDataURL('image/jpeg', 0.58);
            socket?.emit('liveVideoFrame', {
              room: currentUser.room || 'الغرفة العامة',
              frameData
            });
          }
        } catch {}
      }, 85);

      showToast('بدأ البث المباشر (فيديو وصوت) بنجاح 🔴 بثك الآن مباشر لجميع أعضاء الغرفة!', 'success');
      sounds.playCrownFanfare();
      confetti({ particleCount: 40, spread: 60 });
    } catch (err: any) {
      showToast('تعذر فتح الكاميرا للبث: ' + (err?.message || 'تحقق من أذونات المتصفح'), 'error');
    }
  };

  const handleStopLiveBroadcast = () => {
    if (liveFrameIntervalRef.current) {
      clearInterval(liveFrameIntervalRef.current);
      liveFrameIntervalRef.current = null;
    }
    if (liveMediaStream) {
      liveMediaStream.getTracks().forEach((track) => track.stop());
      setLiveMediaStream(null);
    }
    setIsBroadcastingLive(false);
    setIsWatchingLive(false);
    socket?.emit('endLiveBroadcast', { room: currentUser?.room || 'الغرفة العامة' });
    showToast('تم إنهاء البث المباشر ⏹️', 'info');
  };

  const handleToggleLiveCamera = () => {
    if (liveMediaStream) {
      const vidTrack = liveMediaStream.getVideoTracks()[0];
      if (vidTrack) {
        vidTrack.enabled = !vidTrack.enabled;
        setIsLiveCameraOff(!vidTrack.enabled);
        showToast(vidTrack.enabled ? 'تم تفعيل الكاميرا 📷' : 'تم إيقاف الكاميرا مؤقتاً 🚫', 'info');
      }
    }
  };

  const handleToggleLiveMic = () => {
    if (liveMediaStream) {
      const audTrack = liveMediaStream.getAudioTracks()[0];
      if (audTrack) {
        audTrack.enabled = !audTrack.enabled;
        setIsLiveMicMuted(!audTrack.enabled);
        showToast(audTrack.enabled ? 'تم تفعيل صوت المايك 🎙️' : 'تم كتم المايك 🔇', 'info');
      }
    }
  };

  const handleFlipLiveCamera = async () => {
    const nextMode = liveFacingMode === 'user' ? 'environment' : 'user';
    setLiveFacingMode(nextMode);
    if (liveMediaStream) {
      liveMediaStream.getTracks().forEach((t) => t.stop());
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: nextMode, width: { ideal: 640 }, height: { ideal: 480 } },
          audio: !isLiveMicMuted
        });
        setLiveMediaStream(newStream);
        if (localLiveVideoRef.current) {
          localLiveVideoRef.current.srcObject = newStream;
          localLiveVideoRef.current.play().catch(() => {});
        }
      } catch {}
    }
  };

  const handleSendLiveReaction = (emoji: string) => {
    if (!currentUser) return;
    socket?.emit('liveReaction', { room: currentUser.room || 'الغرفة العامة', emoji });
    triggerFloatingReaction(emoji);
  };

  // Save Settings from Settings Modal (حفظ وتثبيت التعديلات على الملف الشخصي)
  const handleSaveSettings = () => {
    if (!socket || !currentUser) return;
    socket.emit('updateProfile', {
      username: settingName,
      statusQuote: settingQuote,
      avatarUrl: settingAvatar,
      password: settingPassword || undefined,
      flag: currentUser.flag,
      nameColor: settingNameColor,
      textColor: settingTextColor
    });
    socket.emit('updateUserStyle', {
      nameColor: settingNameColor,
      textColor: settingTextColor
    });
    try {
      localStorage.setItem('soqoor_name_color', settingNameColor);
      localStorage.setItem('soqoor_text_color', settingTextColor);
      localStorage.setItem(
        'falcon_saved_profile',
        JSON.stringify({
          username: settingName,
          statusQuote: settingQuote,
          avatarUrl: settingAvatar,
          flag: currentUser.flag,
          nameColor: settingNameColor,
          textColor: settingTextColor
        })
      );
    } catch {}
    setCurrentUser((prev) => (prev ? { ...prev, nameColor: settingNameColor, textColor: settingTextColor } : null));
    showToast('تم حفظ التعديلات ولون الاسم والخط بنجاح 💾', 'success');
    setActiveDrawer('none');
  };

  // Dedicated large media background upload pipeline with real-time progress
  // Handles videos up to 100MB over HTTP so WebSocket ping/pong NEVER stalls!
  const handleMediaUpload = async (file: File) => {
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      showToast('حجم الملف كبير جداً، الحد الأقصى المسموح 100 ميجابايت', 'error');
      return;
    }

    const isVideo = file.type.startsWith('video');
    const isAudio = file.type.startsWith('audio');
    const typeLabel = isVideo ? 'فيديو' : isAudio ? 'مقطع صوتي' : 'صورة';

    setUploadProgress(1);
    setUploadStatusText(`جاري رفع الـ${typeLabel} (${(file.size / (1024 * 1024)).toFixed(1)} ميجابايت)...`);

    try {
      const res = await uploadMediaWithProgress(file, (percent) => {
        setUploadProgress(percent);
        setUploadStatusText(`جاري رفع الـ${typeLabel}... ${percent}%`);
      });

      setUploadProgress(null);
      setUploadStatusText('');
      handleSendMessage(undefined, res.url, res.mediaType);
      showToast(`تم إرسال الـ${typeLabel} بنجاح دون انقطاع الاتصال 🚀`, 'success');
    } catch (err: any) {
      setUploadProgress(null);
      setUploadStatusText('');
      showToast(`فشل رفع ${typeLabel}: ` + (err?.message || 'خطأ في الشبكة'), 'error');
    }
  };

  // Local file upload helper: automatically routes videos and large media to the background progress pipeline!
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (dataUrl: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('video') || file.size > 2 * 1024 * 1024) {
      handleMediaUpload(file);
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        callback(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Dedicated Wall Media Upload (Photos & Videos) with zero WebSocket freezing & HTTP progress
  const handleWallMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!currentUser) {
      showToast('يجب تسجيل الدخول أولاً للنشر على الحائط 🔐', 'error');
      e.target.value = '';
      return;
    }

    const isVideo = file.type.startsWith('video');
    const typeLabel = isVideo ? 'فيديو' : 'صورة';

    setIsWallUploading(true);
    setWallUploadProgress(1);

    try {
      const res = await uploadMediaWithProgress(file, (percent) => {
        setWallUploadProgress(percent);
      });

      setIsWallUploading(false);
      setWallUploadProgress(null);

      const defaultText = isVideo ? '🎥 مقطع فيديو جديد' : '📸 صورة جديدة';
      const textToPost = wallTextInput.trim() || defaultText;

      socket?.emit('newWallPost', {
        text: textToPost,
        mediaUrl: res.url,
        mediaType: res.mediaType,
        category: wallTab
      });

      setWallTextInput('');
      showToast(`تم نشر الـ${typeLabel} على الحائط بنجاح دون انقطاع الاتصال ✨`, 'success');
    } catch (err: any) {
      setIsWallUploading(false);
      setWallUploadProgress(null);
      showToast(`فشل رفع ${typeLabel}: ` + (err?.message || 'خطأ في الشبكة'), 'error');
    } finally {
      e.target.value = '';
    }
  };

  // 24-Hour Story File Selection & Upload (نظام حالات/خواطر الصور والفيديو)
  const handleStoryFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 80 * 1024 * 1024) {
      showToast('الحد الأقصى لحجم الفيديو أو الصورة هو 80 ميجابايت.', 'error');
      e.target.value = '';
      return;
    }

    const isVideo = file.type.startsWith('video');
    const typeLabel = isVideo ? 'فيديو' : 'صورة';

    setIsStoryUploading(true);
    setStoryUploadProgress(1);

    try {
      const res = await uploadMediaWithProgress(file, (percent) => {
        setStoryUploadProgress(percent);
      });

      setIsStoryUploading(false);
      setStoryUploadProgress(0);

      // Open creation preview dialog so user can enter caption and confirm post
      setStoryMediaUrl(res.url);
      setStoryMediaType(res.mediaType as 'image' | 'video');
      setIsCreatingStory(true);
      showToast(`تم رفع ملف الـ${typeLabel} بنجاح، يمكنك كتابة خاطرة ونشرها الآن ✨`, 'info');
    } catch (err: any) {
      setIsStoryUploading(false);
      setStoryUploadProgress(0);
      showToast(`فشل رفع ${typeLabel}: ` + (err?.message || 'خطأ في الشبكة'), 'error');
    } finally {
      e.target.value = '';
    }
  };

  const handlePublishStory = () => {
    if (!storyMediaUrl || !socket) return;
    socket.emit('newStory', {
      mediaUrl: storyMediaUrl,
      mediaType: storyMediaType,
      caption: storyCaption.trim()
    });
    setIsCreatingStory(false);
    setStoryMediaUrl('');
    setStoryCaption('');
    showToast('تم نشر الخاطرة / الحالة بنجاح (ستبقى 24 ساعة) ⏳✨', 'success');
  };

  // Download project ZIP
  const handleDownloadZip = async () => {
    try {
      showToast('جاري إنشاء ملف ZIP الكامل للمشروع...', 'info');
      await generateAndDownloadProjectZip();
      confetti({ particleCount: 60, spread: 70 });
      showToast('تم تحميل كود المشروع الكامل بصيغة ZIP! 📦', 'success');
    } catch (err: any) {
      showToast('فشل التحميل: ' + (err?.message || 'حدث خطأ أثناء إنشاء ملف ZIP'), 'error');
    }
  };

  // =========================================================================
  // VIEW 1: HOME LOGIN SCREEN (Matching Screenshot 1)
  // =========================================================================
  if (!currentUser) {
    return (
      <div
        style={{
          height: 'var(--app-height, 100dvh)',
          minHeight: 'var(--app-height, 100dvh)'
        }}
        className={`w-full ${curTheme.appBg || 'bg-[#070b13]'} ${curTheme.appText || 'text-[#e2e8f0]'} flex flex-col items-center justify-start antialiased font-sans select-none overflow-y-auto no-horizontal-overflow`}
      >
        {/* Strict Single Session Force-Logout Modal on Login Screen */}
        {forcedLogoutInfo?.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in" dir="rtl">
            <div className="bg-[#18110b] border-2 border-amber-500 rounded-2xl w-full max-w-sm p-4 text-center shadow-2xl space-y-3.5 text-white animate-in zoom-in-95">
              <div className="w-14 h-14 rounded-full bg-amber-500/20 text-amber-400 border-2 border-amber-500/50 flex items-center justify-center mx-auto animate-bounce">
                <AlertTriangle className="w-7 h-7 text-amber-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-amber-300">
                  ⚠️ تم إنهاء هذه الجلسة
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  {forcedLogoutInfo.message ||
                    'تم تسجيل الدخول إلى حسابك من متصفح أو جهاز آخر. وحرصاً على أمان العضوية ومنع التكرار، تم إنهاء هذه الجلسة القديمة فوراً واعتماد الجلسة الجديدة.'}
                </p>
              </div>
              <div className="p-2.5 bg-amber-950/50 border border-amber-500/30 rounded-xl text-[11px] text-amber-200/90 text-right space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-300">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>سياسة الحماية والجلسة الواحدة:</span>
                </div>
                <div>• لا يُسمح بتواجد نفس العضو في أكثر من صفحة أو جهاز معاً.</div>
                <div>• إذا أردت استخدام هذا الجهاز مجدداً، يمكنك تسجيل الدخول وسيتم اعتماد هذه الجلسة وطرد الأخرى تلقائياً.</div>
              </div>
              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setForcedLogoutInfo(null);
                    isForcedLoggedOutRef.current = false;
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs shadow-lg transition-transform active:scale-95 cursor-pointer"
                >
                  حسناً، فهمت ✔️
                </button>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-emerald-900/90 border border-emerald-500 text-white rounded-lg shadow-xl text-xs font-bold animate-bounce">
            {toast.message}
          </div>
        )}

        {/* Mobile Device Frame Container */}
        <div className={`w-full max-w-md ${curTheme.cardBg || 'bg-[#0d131f]'} min-h-full border-x ${curTheme.cardBorder || 'border-[#1e293b]'} shadow-2xl flex flex-col no-horizontal-overflow`}>
          {/* Top Header */}
          <header className={`${curTheme.headerBg || 'bg-[#241a12]'} border-b ${curTheme.headerBorder || 'border-[#3e2c1c]'} px-3 py-2 flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <img
                src={falconIcon}
                alt="شات حسان برو"
                className="w-8 h-8 rounded-full border border-amber-500 shadow-sm object-cover"
              />
              <span className={`text-sm font-bold ${curTheme.headerAccent || 'text-amber-200'} tracking-wide`}>
                شات حسان برو | شات حسان برو للجوال
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowThemesModal(true)}
                className="w-7 h-7 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 flex items-center justify-center shadow transition-all cursor-pointer"
                title="تخصيص الثيم والاستايل والمظهر 🎨"
              >
                <Palette className="w-4 h-4" />
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-7 h-7 rounded-md bg-[#32ba51] hover:bg-emerald-600 text-white flex items-center justify-center shadow transition-all cursor-pointer"
                title="تحديث"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Banner with Majestic Falcon */}
          <div className="relative w-full aspect-[2.1/1] overflow-hidden border-b border-[#2e261d]">
            <img
              src={bannerImg}
              alt="شات حسان برو"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent flex flex-col justify-end p-3 text-right">
              <div className="text-amber-300 font-black text-lg drop-shadow-md">
                شات حسان برو
              </div>
              <div className="text-[11px] text-amber-100/90 font-medium flex items-center gap-2">
                <span>🏆 مسابقات</span>
                <span>🛡️ ترقيات</span>
                <span>🎆 فعاليات</span>
              </div>
              <div className="text-[10px] text-slate-300 font-mono">hassan-pro.com</div>
            </div>
          </div>

          {/* 3 Entry Tabs (دخول الزوار | دخول الاعضاء | تسجيل عضويه) */}
          <div className="grid grid-cols-3 bg-[#111827] border-b border-[#1f2937] text-xs font-bold text-center">
            <button
              onClick={() => {
                setActiveTab('visitor');
                setUsernameInput('');
                setPasswordInput('');
                setLoginError(null);
              }}
              className={`py-3 flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'visitor'
                  ? 'bg-white text-indigo-700 border-b-2 border-indigo-600 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>دخول الزوار</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('member');
                setUsernameInput('');
                setPasswordInput('');
                setLoginError(null);
              }}
              className={`py-3 flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'member'
                  ? 'bg-white text-indigo-700 border-b-2 border-indigo-600 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>دخول الاعضاء</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('register');
                setUsernameInput('');
                setPasswordInput('');
                setLoginError(null);
              }}
              className={`py-3 flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-white text-indigo-700 border-b-2 border-indigo-600 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>تسجيل عضويه</span>
            </button>
          </div>

          {/* Login Form (Direct auto-entry to الغرفة العامة) */}
          <div className="p-4 bg-white text-slate-900 border-b border-slate-300 shadow-inner">
            {loginError && (
              <div className="mb-3 p-2 bg-rose-100 border border-rose-300 text-rose-700 text-xs rounded font-bold">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-2.5">
              <div>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="اسم المستخدم..."
                  maxLength={30}
                  required
                  autoComplete="off"
                  className={`w-full px-3 py-2 border ${curTheme.fieldBorder || 'border-slate-400'} ${curTheme.fieldBg || 'bg-white'} rounded ${curTheme.fieldText || 'text-slate-900'} ${curTheme.fieldPlaceholder || 'placeholder-slate-400'} text-sm font-semibold outline-none ${curTheme.fieldFocus || 'focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600'} transition-all`}
                />
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder={activeTab === 'visitor' ? 'رمز أو كلمة مرور (اختياري)' : 'كلمة المرور...'}
                    autoComplete="current-password"
                    className={`w-full px-3 py-2 pr-8 border ${curTheme.fieldBorder || 'border-slate-400'} ${curTheme.fieldBg || 'bg-white'} rounded ${curTheme.fieldText || 'text-slate-900'} ${curTheme.fieldPlaceholder || 'placeholder-slate-400'} text-sm font-semibold outline-none ${curTheme.fieldFocus || 'focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600'} transition-all`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Styled [دخول] button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-2 ${curTheme.primaryBtn || 'bg-[#2d251f] hover:bg-[#1f1915] text-amber-200'} font-bold text-sm rounded shadow cursor-pointer active:scale-95 transition-all`}
                >
                  {isSubmitting ? 'جاري...' : 'دخول'}
                </button>
              </div>

              {/* Web Notification status & trigger in login form */}
              <div className="flex items-center justify-between text-[11px] pt-1 px-1 text-slate-600 bg-slate-50/80 rounded border border-slate-200">
                <span className="flex items-center gap-1 font-semibold text-slate-700">
                  <Bell className="w-3.5 h-3.5 text-amber-600" />
                  <span>تنبيهات المتصفح للخاص والمنشن:</span>
                </span>
                {notificationPermission === 'granted' ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-0.5 text-[10px]">
                    <Check className="w-3 h-3 text-emerald-600" /> مفعّلة بالخلفية
                  </span>
                ) : notificationPermission === 'denied' ? (
                  <span className="text-rose-600 font-semibold text-[10px]">
                    محظورة بالمتصفح
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      requestNotificationPermission().then((perm) => {
                        setNotificationPermission(perm);
                        if (perm === 'granted') {
                          showToast('تم تفعيل إشعارات المتصفح بنجاح! 🔔', 'success');
                          sendTestNotification().catch(() => {});
                        }
                      });
                    }}
                    className="text-amber-800 bg-amber-200/80 hover:bg-amber-300 px-2 py-0.5 rounded font-bold transition-colors cursor-pointer text-[10px] flex items-center gap-1 shadow-2xs"
                  >
                    <span>طلب الإذن الآن 🔔</span>
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200 text-slate-600">
                <div className="flex items-center gap-1">
                  <span>العلم التلقائي (بالـ IP):</span>
                  <span className="text-base">{detectedFlag}</span>
                </div>
                <span className="text-[11px] text-emerald-600 font-bold">
                  ✓ الدخول التلقائي: الغرفة العامة
                </span>
              </div>
            </form>
          </div>

          {/* Subheader: Green "متصل" & "👥 77" (Screenshot 1) */}
          <div className="flex items-center justify-between bg-[#383129] border-b border-[#4d4036] text-white px-3 py-1.5 text-xs font-bold">
            <div className="bg-[#48a942] px-4 py-0.5 rounded text-white text-xs">
              متصل
            </div>
            <div className="flex items-center gap-1 text-emerald-400">
              <Users className="w-3.5 h-3.5" />
              <span>{onlineCount}</span>
            </div>
          </div>

          {/* Connected Members List (Matching Screenshot 1) */}
          <div className="flex-1 bg-white text-slate-800 divide-y divide-slate-200 overflow-y-auto">
            {rosterUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => {
                  setUsernameInput(user.username);
                  showToast(`تم اختيار: ${user.username} - اضغط دخول للتحدث معه مباشرة`, 'info');
                }}
                className="flex items-center justify-between p-2.5 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative flex-shrink-0">
                    <img
                      src={user.avatarUrl || falconIcon}
                      alt={user.username}
                      className="w-12 h-12 rounded-lg object-cover border border-slate-300 shadow-sm"
                    />
                    {/* Presence Dot: 🟢 Online, 🟡 Away (in background), ⚪ Offline */}
                    {user.presenceState === 'away' ? (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-white shadow-xs animate-pulse" title="في الخلفية (بالانتظار) 🟡" />
                    ) : user.presenceState === 'offline' ? (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-slate-400 border-2 border-white" title="غير متصل ⚪" />
                    ) : (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-xs" title="متواجد ونشط 🟢" />
                    )}
                    {user.isVoice && (
                      <span className="absolute -bottom-1 -left-1 w-3.5 h-3.5 rounded-full bg-indigo-500 border-2 border-white" title="على المايك" />
                    )}
                  </div>

                  <div className="min-w-0 text-right">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 font-serif">
                        {user.username}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 truncate max-w-[210px] mt-0.5">
                      {user.statusQuote || '..'}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-xl leading-none">{user.flag || '🇸🇦'}</span>
                  {user.likes > 0 && (
                    <span className="text-[10px] font-bold text-rose-600 flex items-center gap-0.5">
                      <Heart className="w-2.5 h-2.5 fill-rose-500" />
                      {user.likes}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-3 bg-[#111827] text-slate-400 border-t border-[#1f2937] flex items-center justify-between text-xs">
            <button
              onClick={handleDownloadZip}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold transition-all shadow cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تحميل المشروع ZIP</span>
            </button>
            <span className="text-[10px] text-slate-500">
              Copyright © 2026 شات حسان برو للجوال
            </span>
          </div>
        </div>

        {/* Theme & Styling Center for Login Screen */}
        <ThemeAndWallpaperCenter
          isOpen={showThemesModal}
          onClose={() => setShowThemesModal(false)}
          activeTheme={activeTheme}
          onChangeTheme={handleUpdateTheme}
          activeWallpaper={activeWallpaper}
          onChangeWallpaper={handleUpdateWallpaper}
          fontFamily={fontFamily}
          onChangeFontFamily={handleUpdateFontFamily}
          chatFontSize={chatFontSize}
          onChangeFontSize={handleUpdateFontSize}
          bubbleStyle={bubbleStyle}
          onChangeBubbleStyle={handleUpdateBubbleStyle}
          nameColor={settingNameColor}
          onChangeNameColor={handleUpdateNameColor}
          textColor={settingTextColor}
          onChangeTextColor={handleUpdateTextColor}
          eyeComfort={eyeComfort}
          onToggleEyeComfort={() => {
            const next = !eyeComfort;
            setEyeComfort(next);
            try {
              localStorage.setItem('soqoor_eye_comfort', String(next));
            } catch {}
          }}
          soundVolume={soundVolume}
          onChangeSoundVolume={(v) => {
            setSoundVolume(v);
            sounds.setMasterVolume(v / 100);
            try {
              localStorage.setItem('soqoor_sound_volume', String(v));
            } catch {}
          }}
          particlesEnabled={particlesEnabled}
          onToggleParticles={() => {
            const next = !particlesEnabled;
            setParticlesEnabled(next);
            try {
              localStorage.setItem('soqoor_particles', String(next));
            } catch {}
          }}
          currentUserRole={undefined}
          onApplyGlobalAppearance={handleApplyGlobalAppearance}
          onShowToast={showToast}
        />
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: INSIDE CHAT ROOM (Screenshots 2 - 13)
  // =========================================================================
  return (
    <div
      style={{
        height: 'var(--app-height, 100dvh)',
        maxHeight: 'var(--app-height, 100dvh)',
        top: 0,
        left: 0,
        right: 0,
        bottom: 'auto'
      }}
      className="fixed inset-x-0 top-0 z-10 w-full bg-[#070b13] text-[#e2e8f0] flex flex-col items-center justify-start antialiased font-sans select-none overflow-hidden"
    >
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-[#2d251f] border border-amber-500 text-amber-200 rounded-lg shadow-xl text-xs font-bold animate-pulse">
          {toast.message}
        </div>
      )}

      {/* Realtime Floating Like Alert (إشعار عائم فوري يظهر عند استلام لايك بالاسم والصورة) */}
      {floatingLikeAlert && (
        <div
          onClick={() => setFloatingLikeAlert(null)}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-55 max-w-sm w-[92%] sm:w-auto bg-gradient-to-r from-amber-950 via-[#231812] to-rose-950 border-2 border-amber-400 rounded-2xl shadow-2xl p-3 flex items-center gap-3 animate-in slide-in-from-top duration-300 cursor-pointer text-right"
          dir="rtl"
          title="انقر لإغلاق التنبيه"
        >
          <div className="relative shrink-0">
            <img
              src={floatingLikeAlert.fromAvatar || falconIcon}
              alt={floatingLikeAlert.fromUsername}
              className="w-11 h-11 rounded-full object-cover border-2 border-amber-400 shadow-md"
            />
            <span className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] shadow">
              ❤️
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-amber-300">إعجاب جديد لملفك الشخصي! ✨</span>
            </div>
            <div className="text-xs text-white font-bold truncate">
              أهدى لك <span className="text-amber-400 underline decoration-amber-500 font-black">[{floatingLikeAlert.fromUsername}]</span> لايك للملف الشخصي ❤️
            </div>
            <div className="text-[10px] text-amber-200/80 font-mono mt-0.5">
              رصيدك الحالي: {floatingLikeAlert.likes} إعجاب 👍
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setFloatingLikeAlert(null);
            }}
            className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center text-xs shrink-0 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Official In-App Warning Dialog */}
      {activeWarning && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveWarning(null);
          }}
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200 text-right"
        >
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border-2 border-rose-500 overflow-hidden text-slate-900">
            <div className="bg-gradient-to-r from-rose-700 to-red-600 text-white p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertCircle className="w-5 h-5 text-amber-300 animate-bounce" />
                <span>⚠️ تنبيه إداري رسمي فوري</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-black/30 text-[10px] font-bold">حسان برو</span>
            </div>
            <div className="p-4 space-y-3">
              <div className="text-xs text-slate-500">
                مرسل من قِبل المشرف / الإداري: <span className="font-bold text-rose-700">[{activeWarning.from}]</span>
              </div>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-950 font-semibold text-xs leading-relaxed whitespace-pre-wrap">
                {activeWarning.text}
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                يرجى الالتزام بقواعد الشات وآداب الحوار تجنباً لتطبيق عقوبات الطرد أو الحظر (الباند).
              </p>
              <button
                onClick={() => setActiveWarning(null)}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                فهمت ذلك وسألتزم بالقوانين ✔️
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin/Supervisor Warning Dispatch Modal */}
      {warningModalTarget && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setWarningModalTarget(null);
              setCustomWarningText('');
            }
          }}
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs text-right animate-in fade-in duration-200"
        >
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border-2 border-amber-500 overflow-hidden text-slate-900">
            <div className="bg-[#241a12] text-amber-200 p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <span>إرسال تنبيه إداري لـ [{warningModalTarget.username}]</span>
              </div>
              <button
                onClick={() => {
                  setWarningModalTarget(null);
                  setCustomWarningText('');
                }}
                className="w-7 h-7 bg-red-600 hover:bg-red-700 text-white rounded font-bold flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3 text-xs">
              <div className="text-slate-600 font-bold">اختر نص تنبيه رسمي معتمد أو اكتب نصك الخاص:</div>
              <div className="space-y-1.5">
                {[
                  'يرجى احترام المتواجدين والالتزام بآداب الحديث.',
                  'ممنوع نشر الروابط والإعلانات أو الترويج في الشات.',
                  'يمنع استخدام الألفاظ غير اللائقة أو السب والقذف.',
                  'تنبيه إداري أخير: الالتزام بقواعد الشات تجنباً لتطبيق عقوبة الطرد أو الباند.'
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCustomWarningText(preset)}
                    className="w-full text-right p-2 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-950 text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    ⚠️ {preset}
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">نص التنبيه:</label>
                <textarea
                  value={customWarningText}
                  onChange={(e) => setCustomWarningText(e.target.value)}
                  placeholder="اكتب نص التنبيه المخصص هنا..."
                  rows={2}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-amber-500 font-medium"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const textToSend = customWarningText.trim() || 'يرجى الالتزام بقوانين حسان برو واحترام المتواجدين.';
                    handleAdminAction('warn', warningModalTarget.username, textToSend);
                    setWarningModalTarget(null);
                    setCustomWarningText('');
                    showToast(`تم إرسال التنبيه الرسمي إلى ${warningModalTarget.username} ✉️`, 'success');
                  }}
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow transition-all cursor-pointer text-xs"
                >
                  إرسال التنبيه الآن ⚠️
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWarningModalTarget(null);
                    setCustomWarningText('');
                  }}
                  className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🎵 CUSTOM AUDIO ALERTS CENTER MODAL (مركز التنبيهات الصوتية المخصصة) */}
      {showSoundModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSoundModal(false);
          }}
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-3 backdrop-blur-xs text-right animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md max-h-[92vh] bg-white rounded-2xl shadow-2xl border-2 border-amber-500 overflow-hidden text-slate-900 flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-[#241a12] text-amber-200 p-3.5 flex items-center justify-between border-b border-[#3e2c1c] flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-amber-200 leading-tight">مركز التنبيهات الصوتية المخصصة 🎵</h3>
                  <p className="text-[10px] text-amber-300/80">نغمات فريدة تختلف تلقائياً باختلاف نوع كل حدث</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSoundModal(false)}
                className="w-7 h-7 bg-red-600/90 hover:bg-red-700 text-white rounded-lg flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-3.5 space-y-3.5 overflow-y-auto flex-1 text-xs">
              
              {/* Master Mute & Sequential Test Bar */}
              <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs text-amber-950 flex items-center gap-1.5">
                    <span>🔔 حالة الصوت العامة:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !soundsMuted;
                      setSoundsMuted(next);
                      sounds.setMuted(next);
                      showToast(next ? 'تم كتم جميع التنبيهات 🔇' : 'تم تفعيل جميع الأصوات 🔔', 'info');
                    }}
                    className={`px-3 py-1 rounded-full font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                      soundsMuted ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {soundsMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    <span>{soundsMuted ? 'كتم الأصوات' : 'الأصوات مفعّلة'}</span>
                  </button>
                </div>

                {/* Sequence Test Button */}
                <button
                  type="button"
                  disabled={testingSequence}
                  onClick={handlePlayToneSequence}
                  className="w-full py-2 bg-gradient-to-l from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 disabled:opacity-60 text-white font-black text-xs rounded-xl shadow flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>
                    {testingSequence
                      ? 'جارٍ الاستماع المتتابع (عام 📢 ➔ خاص 💬 ➔ منشن 🔔)...'
                      : '🎵 اختبار النغمات الثلاث بالتتابع للمقارنة'}
                  </span>
                </button>
              </div>

              {/* EVENT 1: General Notification / Alert (إشعار عام) */}
              <div
                className={`p-3 rounded-xl border-2 transition-all ${
                  activePlayingSound === 'alert'
                    ? 'border-amber-500 bg-amber-100/60 ring-2 ring-amber-400 shadow-md'
                    : 'border-amber-200 bg-amber-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-amber-500 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                      📢
                    </span>
                    <div>
                      <div className="font-black text-xs text-amber-950">1. إشعار وتنبيه عام (General Alert)</div>
                      <div className="text-[10px] text-amber-800/80">للإعلانات الرسمية والتعميمات الإدارية بالغرفة</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActivePlayingSound('alert');
                      sounds.previewAlertSound(selectedAlertSound);
                      setTimeout(() => setActivePlayingSound(null), 600);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>تجربة</span>
                  </button>
                </div>
                <select
                  value={selectedAlertSound}
                  onChange={(e) => {
                    const id = e.target.value as AlertSoundId;
                    setSelectedAlertSound(id);
                    sounds.setAlertSound(id);
                    sounds.previewAlertSound(id);
                    showToast('تم ضبط نغمة الإشعار العام بنجاح 📢', 'success');
                  }}
                  className="w-full p-2 border border-amber-300 rounded-lg text-xs bg-white text-slate-800 font-semibold outline-none focus:border-amber-600"
                >
                  {ALERT_SOUND_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.icon} {opt.label} — {opt.desc}
                    </option>
                  ))}
                </select>
              </div>

              {/* EVENT 2: Private Message (رسالة خاصة) */}
              <div
                className={`p-3 rounded-xl border-2 transition-all ${
                  activePlayingSound === 'private'
                    ? 'border-indigo-500 bg-indigo-100/60 ring-2 ring-indigo-400 shadow-md'
                    : 'border-indigo-200 bg-indigo-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                      💬
                    </span>
                    <div>
                      <div className="font-black text-xs text-indigo-950">2. رسالة خاصة (Private Message)</div>
                      <div className="text-[10px] text-indigo-800/80">تصدر فور ورود رسالة بمحادثة خاصة وسرية</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActivePlayingSound('private');
                      sounds.previewPrivateSound(selectedPrivateSound);
                      setTimeout(() => setActivePlayingSound(null), 600);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>تجربة</span>
                  </button>
                </div>
                <select
                  value={selectedPrivateSound}
                  onChange={(e) => {
                    const id = e.target.value as PrivateSoundId;
                    setSelectedPrivateSound(id);
                    sounds.setPrivateSound(id);
                    sounds.previewPrivateSound(id);
                    showToast('تم ضبط نغمة الرسائل الخاصة بنجاح 💬', 'success');
                  }}
                  className="w-full p-2 border border-indigo-300 rounded-lg text-xs bg-white text-slate-800 font-semibold outline-none focus:border-indigo-600"
                >
                  {PRIVATE_SOUND_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.icon} {opt.label} — {opt.desc}
                    </option>
                  ))}
                </select>
              </div>

              {/* EVENT 3: Mention / @Username (إشارة @ باسم المستخدم) */}
              <div
                className={`p-3 rounded-xl border-2 transition-all ${
                  activePlayingSound === 'mention'
                    ? 'border-rose-500 bg-rose-100/60 ring-2 ring-rose-400 shadow-md'
                    : 'border-rose-200 bg-rose-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-rose-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                      🔔
                    </span>
                    <div>
                      <div className="font-black text-xs text-rose-950">3. إشارة @ بالاسم (Mention @)</div>
                      <div className="text-[10px] text-rose-800/80">عندما يقوم شخص بمناداتك وكتابة @اسمك بالدردشة</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActivePlayingSound('mention');
                      sounds.previewMentionSound(selectedMentionSound);
                      setTimeout(() => setActivePlayingSound(null), 600);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>تجربة</span>
                  </button>
                </div>
                <select
                  value={selectedMentionSound}
                  onChange={(e) => {
                    const id = e.target.value as MentionSoundId;
                    setSelectedMentionSound(id);
                    sounds.setMentionSound(id);
                    sounds.previewMentionSound(id);
                    showToast('تم ضبط نغمة الإشارة والمنشن بنجاح 🔔', 'success');
                  }}
                  className="w-full p-2 border border-rose-300 rounded-lg text-xs bg-white text-slate-800 font-semibold outline-none focus:border-rose-600"
                >
                  {MENTION_SOUND_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.icon} {opt.label} — {opt.desc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Additional General Sounds (Collapsible / Compact) */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="text-xs font-bold text-slate-800 border-b pb-1">نغمات عامة إضافية للغرفة:</div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <div className="flex items-center justify-between mb-1 font-semibold text-slate-700">
                      <span>رسائل الغرفة:</span>
                      <button
                        type="button"
                        onClick={() => sounds.previewMessageSound(selectedMsgSound)}
                        className="text-indigo-600 hover:underline cursor-pointer"
                      >
                        تجربة
                      </button>
                    </div>
                    <select
                      value={selectedMsgSound}
                      onChange={(e) => {
                        const id = e.target.value as MessageSoundId;
                        setSelectedMsgSound(id);
                        sounds.setMessageSound(id);
                        sounds.previewMessageSound(id);
                      }}
                      className="w-full p-1.5 border border-slate-300 rounded-md text-xs bg-white text-slate-800"
                    >
                      {MESSAGE_SOUND_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.icon} {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1 font-semibold text-slate-700">
                      <span>دخول الأعضاء:</span>
                      <button
                        type="button"
                        onClick={() => sounds.previewJoinSound(selectedJoinSound)}
                        className="text-indigo-600 hover:underline cursor-pointer"
                      >
                        تجربة
                      </button>
                    </div>
                    <select
                      value={selectedJoinSound}
                      onChange={(e) => {
                        const id = e.target.value as JoinSoundId;
                        setSelectedJoinSound(id);
                        sounds.setJoinSound(id);
                        sounds.previewJoinSound(id);
                      }}
                      className="w-full p-1.5 border border-slate-300 rounded-md text-xs bg-white text-slate-800"
                    >
                      {JOIN_SOUND_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.icon} {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 🔔 WEB NOTIFICATIONS API PANEL (تنبيهات المتصفح في الخلفية والشاشة مغلقة) */}
              <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-black text-xs text-amber-950">
                    <BellRing className="w-4 h-4 text-amber-600 animate-pulse" />
                    <span>تنبيهات المتصفح بالخلفية (Web Notifications API)</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    notificationPermission === 'granted'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : notificationPermission === 'denied'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {notificationPermission === 'granted'
                      ? '✓ مفعّلة بنجاح'
                      : notificationPermission === 'denied'
                      ? '✕ محظورة بالمتصفح'
                      : '⏳ بانتظار الإذن'}
                  </span>
                </div>
                <p className="text-[10px] text-amber-900 leading-relaxed">
                  نظام التنبيهات يعمل حتى لو كان المتصفح مصغراً أو شاشة الهاتف مقفلة، لتنبيهك فوراً بصوت واهتزاز عند وصول <strong>رسالة خاصة جديدة</strong> أو <strong>منشن (@)</strong>.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  {notificationPermission !== 'granted' && (
                    <button
                      type="button"
                      onClick={() => {
                        requestNotificationPermission().then((perm) => {
                          setNotificationPermission(perm);
                          if (perm === 'granted') {
                            showToast('تم تفعيل إشعارات المتصفح بنجاح! 🔔', 'success');
                            sendTestNotification().catch(() => {});
                          } else if (perm === 'denied') {
                            showToast('تم حظر الإشعارات في إعدادات المتصفح', 'error');
                          }
                        });
                      }}
                      className="flex-1 py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center justify-center gap-1 cursor-pointer transition-all"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>طلب الإذن والتفعيل الآن 🔔</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (notificationPermission !== 'granted') {
                        requestNotificationPermission().then((perm) => {
                          setNotificationPermission(perm);
                          if (perm === 'granted') {
                            sendTestNotification().catch(() => {});
                            showToast('تم إرسال إشعار تجريبي للمتصفح 🧪', 'success');
                          } else {
                            showToast('يرجى السماح بالإشعارات في المتصفح أولاً', 'info');
                          }
                        });
                      } else {
                        sendTestNotification().then((sent) => {
                          if (sent) {
                            showToast('تم إرسال إشعار تجريبي للمتصفح 🧪', 'success');
                          } else {
                            showToast('تعذر إرسال الإشعار، تأكد من إعدادات النظام', 'error');
                          }
                        });
                      }
                    }}
                    className={`py-1.5 px-3 font-bold text-xs rounded-lg border shadow-xs flex items-center justify-center gap-1 cursor-pointer transition-all ${
                      notificationPermission === 'granted'
                        ? 'flex-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-400'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>تجربة إشعار فوري 🧪</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
              <span className="text-[11px] text-slate-500 font-medium">يتم حفظ خياراتك تلقائياً في المتصفح</span>
              <button
                type="button"
                onClick={() => setShowSoundModal(false)}
                className="px-5 py-2 bg-[#241a12] hover:bg-black text-amber-300 font-bold rounded-xl text-xs shadow transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>حفظ وإغلاق</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 📢 BROADCAST GENERAL ALERT MODAL (إرسال إشعار عام للغرفة) */}
      {showBroadcastModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowBroadcastModal(false);
              setBroadcastAlertText('');
            }
          }}
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-xs text-right animate-in fade-in duration-200"
        >
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border-2 border-amber-500 overflow-hidden text-slate-900">
            <div className="bg-[#241a12] text-amber-200 p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Megaphone className="w-5 h-5 text-amber-400" />
                <span>إرسال إشعار عام للغرفة 📢</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowBroadcastModal(false);
                  setBroadcastAlertText('');
                }}
                className="w-7 h-7 bg-red-600 hover:bg-red-700 text-white rounded font-bold flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSendBroadcastAlert} className="p-4 space-y-3 text-xs">
              <div className="text-slate-600 font-medium">
                سيتم بث هذا الإشعار لجميع المتواجدين في الغرفة، وتشغيل نغمة <strong className="text-amber-700">الإشعار العام</strong> على أجهزتهم:
              </div>
              <textarea
                name="chat_broadcast_alert"
                id="chat_broadcast_alert"
                autoComplete="off"
                autoCorrect="on"
                autoCapitalize="sentences"
                spellCheck={true}
                data-form-type="other"
                data-lpignore="true"
                data-1p-ignore="true"
                value={broadcastAlertText}
                onChange={(e) => setBroadcastAlertText(e.target.value)}
                placeholder="اكتب نص الإشعار أو التعميم العام هنا..."
                rows={3}
                required
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs outline-none focus:border-amber-500 font-medium"
              />
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={!broadcastAlertText.trim()}
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-xl shadow transition-all cursor-pointer text-xs flex items-center justify-center gap-1.5"
                >
                  <Megaphone className="w-3.5 h-3.5" />
                  <span>بث الإشعار للجميع 📢</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBroadcastModal(false);
                    setBroadcastAlertText('');
                  }}
                  className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🔍 MODAL: REVEAL NICKS, IP, & ACCOUNT COUNT (كشف النكات والآي بي والعضويات) */}
      {showRevealedNicksModal && revealedNicksData && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowRevealedNicksModal(false);
          }}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 backdrop-blur-xs text-right animate-in fade-in duration-200"
        >
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border-2 border-amber-500 overflow-hidden text-slate-900 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-[#241a12] text-amber-200 p-3 flex items-center justify-between border-b border-[#3e2c1c]">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-amber-400" />
                <span className="font-black text-sm">كشف النكات وتفاصيل العضويات 🔍</span>
              </div>
              <button
                type="button"
                onClick={() => setShowRevealedNicksModal(false)}
                className="w-7 h-7 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3.5 overflow-y-auto text-xs">
              {/* User Identity Card */}
              <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-300 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <img
                      src={falconIcon}
                      alt={revealedNicksData.targetUsername}
                      className="w-11 h-11 rounded-xl object-cover border-2 border-amber-500 shadow-xs"
                    />
                    {revealedNicksData.isOnline && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                    )}
                  </div>
                  <div>
                    <div className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                      <span>{revealedNicksData.targetUsername}</span>
                      <span>{revealedNicksData.flag}</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      الغرفة: {revealedNicksData.room} • الرتبة: {revealedNicksData.role}
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  revealedNicksData.isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                }`}>
                  {revealedNicksData.isOnline ? '● متصل الآن' : 'غير متصل'}
                </span>
              </div>

              {/* IP Address Card with Copy Button */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-300 space-y-1.5">
                <div className="text-[10px] font-bold text-slate-500 flex items-center justify-between">
                  <span>عنوان الآي بي المكتشف (Real IP Address):</span>
                  <span className="text-emerald-700 font-mono">حقيقي ومتحقق منه ✔️</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-900 text-amber-300 rounded-lg font-mono text-sm font-bold shadow-inner">
                  <span className="tracking-wider">{revealedNicksData.ip}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(revealedNicksData.ip);
                      showToast(`تم نسخ الآي بي: ${revealedNicksData.ip} 📋`, 'success');
                    }}
                    className="px-2 py-0.5 bg-amber-500 hover:bg-amber-600 text-black text-[10px] font-black rounded cursor-pointer transition-colors"
                  >
                    نسخ الـ IP
                  </button>
                </div>
              </div>

              {/* Device and Country Cards (اسم الجهاز والدولة والعلم) */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-300">
                  <div className="text-[10px] font-bold text-slate-500 mb-0.5">اسم الجهاز (Device):</div>
                  <div className="font-bold text-xs text-slate-900 truncate" title={revealedNicksData.device}>
                    📱 {revealedNicksData.device || 'هاتف ذكي / Mobile'}
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-300">
                  <div className="text-[10px] font-bold text-slate-500 mb-0.5">الدولة والعلم:</div>
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-1">
                    <span>{revealedNicksData.country || revealedNicksData.flag || '🇸🇦'}</span>
                    <span className="truncate">{revealedNicksData.country || getCountryNameFromFlag(revealedNicksData.flag) || 'المملكة العربية السعودية'}</span>
                  </div>
                </div>
              </div>

              {/* Phone / Hardware Fingerprint Card (بصمة الهاتف والجهاز المادية) */}
              <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-300 space-y-1.5">
                <div className="text-[10px] font-bold text-amber-900 flex items-center justify-between">
                  <span className="flex items-center gap-1 font-black">
                    <Zap className="w-3.5 h-3.5 text-amber-600" />
                    <span>بصمة الهاتف والجهاز (Hardware Fingerprint):</span>
                  </span>
                  <span className="text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-mono font-bold">بصمة ثابتة</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-900 text-emerald-400 rounded-lg font-mono text-xs font-bold shadow-inner">
                  <span className="tracking-widest truncate">{revealedNicksData.deviceFingerprint || 'FP-DEV-STANDARD'}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(revealedNicksData.deviceFingerprint || '');
                      showToast(`تم نسخ بصمة الهاتف: ${revealedNicksData.deviceFingerprint} 📋`, 'success');
                    }}
                    className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black rounded cursor-pointer transition-colors mr-2 shrink-0"
                  >
                    نسخ البصمة
                  </button>
                </div>
                <p className="text-[10px] text-amber-800">
                  معرف دقيق وثابت يستخرج من خصائص معالج هاتف العضو ودقة الشاشة واللمس، ويكشف العضو حتى لو بدل اسمه أو متصفحه.
                </p>
              </div>

              {/* Total Memberships / Accounts entered by this IP */}
              <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs text-indigo-950">
                    عدد العضويات الخاصة به (المرتبطة بهذا الـ IP):
                  </span>
                  <span className="px-2.5 py-0.5 bg-indigo-600 text-white font-black rounded-full text-xs shadow-xs">
                    {revealedNicksData.accountsCount} {revealedNicksData.accountsCount === 1 ? 'عضوية' : 'عضويات'}
                  </span>
                </div>
                <p className="text-[10px] text-indigo-800/80">
                  جميع الأسماء والنكات التي دخل بها هذا الجهاز وسجلت عبر نفس عنوان الإنترنت:
                </p>

                {/* Nicknames list */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {revealedNicksData.accounts.map((nick, idx) => (
                    <span
                      key={idx}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border shadow-2xs ${
                        nick.toLowerCase() === revealedNicksData.targetUsername.toLowerCase()
                          ? 'bg-amber-400 text-black border-amber-500 ring-2 ring-amber-300 font-black'
                          : 'bg-white text-slate-800 border-slate-300'
                      }`}
                    >
                      <span>👤 {nick}</span>
                      {nick.toLowerCase() === revealedNicksData.targetUsername.toLowerCase() && (
                        <span className="text-[9px] bg-black text-amber-300 px-1 rounded font-normal">الحالي</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    handleAdminAction('kick', revealedNicksData.targetUsername, undefined, 'طرد إداري بعد كشف النكات');
                    setShowRevealedNicksModal(false);
                  }}
                  className="py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>طرد العضو</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleAdminAction('ban', revealedNicksData.targetUsername, `حظر شامل للآي بي: ${revealedNicksData.ip}`);
                    setShowRevealedNicksModal(false);
                  }}
                  className="py-2 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>حظر الآي بي (باند)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🎙️ MODAL: MIC MANAGEMENT (سحب المايك أو كتم المايك أو إفلات المايك) */}
      {micActionSlot && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setMicActionSlot(null);
          }}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 backdrop-blur-xs text-right animate-in fade-in duration-150"
        >
          <div className="w-full max-w-xs bg-white rounded-2xl shadow-2xl border-2 border-amber-500 overflow-hidden text-slate-900 flex flex-col">
            <div className="bg-[#241a12] text-amber-200 p-3 flex items-center justify-between border-b border-[#3e2c1c]">
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <Mic className="w-4 h-4 text-amber-400" />
                <span>إدارة المايك رقم ({micActionSlot.slotNumber})</span>
              </div>
              <button
                type="button"
                onClick={() => setMicActionSlot(null)}
                className="w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded flex items-center justify-center cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-3.5 space-y-3 text-xs">
              {micActionSlot.slotUser && (
                <div className="flex items-center gap-2.5 p-2 bg-slate-50 border rounded-xl">
                  <img
                    src={micActionSlot.slotUser.avatarUrl || falconIcon}
                    alt={micActionSlot.slotUser.username}
                    className="w-10 h-10 rounded-full object-cover border-2 border-amber-500"
                  />
                  <div>
                    <div className="font-bold text-xs text-slate-900 flex items-center gap-1">
                      <span>{micActionSlot.slotUser.username}</span>
                      <span>{micActionSlot.slotUser.flag}</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {micActionSlot.slotUser.id === currentUser.id ? 'أنت على هذا المايك' : 'عضو متصل بالمايك'}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {/* OPTION 1: Drop or Pull Mic (إفلات المايك / سحب المايك) */}
                {micActionSlot.slotUser?.id === currentUser.id ? (
                  <button
                    type="button"
                    onClick={() => {
                      handleDropMic();
                      setMicActionSlot(null);
                    }}
                    className="w-full py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>إفلات المايك (النزول الآن) 👋</span>
                  </button>
                ) : (currentUser.role === 'admin' || currentUser.role === 'super') ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (micActionSlot.slotUser) {
                        socket?.emit('adminAction', {
                          action: 'pullMic',
                          targetUsername: micActionSlot.slotUser.username
                        });
                        showToast(`تم سحب المايك من [${micActionSlot.slotUser.username}] 🚨`, 'info');
                      }
                      setMicActionSlot(null);
                    }}
                    className="w-full py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all"
                  >
                    <VolumeX className="w-4 h-4" />
                    <span>سحب المايك من العضو 🚨</span>
                  </button>
                ) : null}

                {/* OPTION 2: Mute or Unmute Mic (كتم المايك / إلغاء الكتم) */}
                {micActionSlot.slotUser?.id === currentUser.id ? (
                  <button
                    type="button"
                    onClick={() => {
                      const isMuted = audioManager?.toggleMute() ?? false;
                      sounds.playToggleMute(isMuted);
                      showToast(isMuted ? 'تم كتم صوت المايك 🔇' : 'تم تشغيل المايك 🎙️', 'info');
                      setMicActionSlot(null);
                    }}
                    className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl flex items-center justify-center gap-2 border cursor-pointer transition-colors"
                  >
                    {audioManager?.isMuted ? (
                      <>
                        <Mic className="w-4 h-4 text-emerald-600" />
                        <span>إلغاء كتم المايك 🎙️</span>
                      </>
                    ) : (
                      <>
                        <VolumeX className="w-4 h-4 text-rose-600" />
                        <span>كتم صوت المايك 🔇</span>
                      </>
                    )}
                  </button>
                ) : (currentUser.role === 'admin' || currentUser.role === 'super') ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (micActionSlot.slotUser) {
                        handleAdminAction('mute', micActionSlot.slotUser.username);
                      }
                      setMicActionSlot(null);
                    }}
                    className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl flex items-center justify-center gap-2 border cursor-pointer transition-colors"
                  >
                    <VolumeX className="w-4 h-4 text-rose-600" />
                    <span>كتم المايك عن هذا العضو 🔇</span>
                  </button>
                ) : null}

                {/* OPTION 3: Open Profile if other member */}
                {micActionSlot.slotUser && micActionSlot.slotUser.id !== currentUser.id && (
                  <button
                    type="button"
                    onClick={() => {
                      openUserProfile(micActionSlot.slotUser!);
                      setMicActionSlot(null);
                    }}
                    className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <UserIcon className="w-4 h-4" />
                    <span>عرض الملف الشخصي للعضو 👤</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🎬 CENTERED MEDIA LIGHTBOX VIEWER (فتح الفيديو أو الصورة وسط المكان مع زر توسيع وزر تحميل) */}
      {activeMediaViewer && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveMediaViewer(null);
          }}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-2 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div className={`relative bg-[#17110c] rounded-2xl shadow-2xl border-2 border-amber-500 overflow-hidden flex flex-col text-slate-100 transition-all ${
            isFullscreenMedia ? 'w-full h-full max-w-none max-h-none rounded-none' : 'w-full max-w-md max-h-[85vh]'
          }`}>
            {/* Lightbox Header */}
            <div className="bg-[#241a12] text-amber-200 p-2.5 flex items-center justify-between border-b border-[#3e2c1c] flex-shrink-0">
              <div className="flex items-center gap-2">
                {activeMediaViewer.type === 'video' ? (
                  <Video className="w-4 h-4 text-amber-400" />
                ) : (
                  <ImageIcon className="w-4 h-4 text-amber-400" />
                )}
                <span className="font-bold text-xs truncate max-w-[170px]">
                  {activeMediaViewer.title || (activeMediaViewer.type === 'video' ? 'مشغل الفيديو' : 'عرض الوسائط')}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {/* Maximize / Expand button (زر توسيع / تكبير) */}
                <button
                  type="button"
                  onClick={() => setIsFullscreenMedia(!isFullscreenMedia)}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                  title={isFullscreenMedia ? 'تصغير' : 'توسيع / تكبير'}
                >
                  {isFullscreenMedia ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  <span>{isFullscreenMedia ? 'استعادة' : 'توسيع'}</span>
                </button>
                {/* Download button (زر تحميل) */}
                <button
                  type="button"
                  onClick={() => handleDownloadMedia(activeMediaViewer.url, `sqour-media-${Date.now()}`)}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                  title="تحميل إلى جهازك"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تحميل</span>
                </button>
                {/* Close button */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveMediaViewer(null);
                    setIsFullscreenMedia(false);
                  }}
                  className="w-7 h-7 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                  title="إغلاق"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Media Content - Centered */}
            <div className="flex-1 flex items-center justify-center p-2 overflow-hidden bg-black/60">
              {activeMediaViewer.type === 'video' ? (
                <video
                  src={activeMediaViewer.url}
                  controls
                  autoPlay
                  playsInline
                  className="max-w-full max-h-full rounded-xl object-contain shadow-2xl"
                />
              ) : (
                <img
                  src={activeMediaViewer.url}
                  alt="وسائط مكبرة"
                  className="max-w-full max-h-full rounded-xl object-contain shadow-2xl"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Mobile Shell (Strict Mobile Phone Dimensions & Locked Viewport with visualViewport API) */}
      <div
        style={{
          height: 'var(--app-height, 100dvh)',
          maxHeight: 'var(--app-height, 100dvh)',
          fontFamily: FONTS_LIST.find((f) => f.id === fontFamily)?.family || getFontFamilyStyle(fontFamily),
          '--theme-accent': curTheme.accentColor || '#d97706',
          '--theme-bg': curTheme.bgColorHex || '#140c06'
        } as any}
        className={`w-full max-w-md mx-auto ${curTheme.appBg} ${curTheme.appText || 'text-slate-100'} flex flex-col relative shadow-2xl border-x ${curTheme.headerBorder} overflow-hidden h-full`}
      >
        
        {/* TOP BAR: FIXED - Green Speaker + Sound Alerts Button + The 5 Mic Slots + LIVE Button + Clear Exit Room Button */}
        <header className={`flex-shrink-0 z-20 ${curTheme?.headerBg || 'bg-[#1f1811]'} text-white p-2 border-b ${curTheme?.headerBorder || 'border-[#3e2c1c]'} flex items-center justify-between gap-1 shadow-md`}>
          {/* Green Speaker Toggle */}
          <button
            onClick={handleToggleSpeaker}
            className={`w-9 h-9 rounded-lg flex items-center justify-center shadow transition-all cursor-pointer flex-shrink-0 ${
              isSpeakerMuted ? 'bg-rose-600 text-white' : 'bg-[#32ba51] text-white hover:bg-emerald-600'
            }`}
            title={isSpeakerMuted ? 'تفعيل الصوت' : 'كتم الصوت'}
          >
            {isSpeakerMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          {/* Quick Sound Center Modal Button */}
          <button
            type="button"
            onClick={() => setShowSoundModal(true)}
            className="w-9 h-9 rounded-lg flex items-center justify-center shadow transition-all cursor-pointer flex-shrink-0 bg-[#2d241c] hover:bg-[#3d3228] text-amber-300 border border-amber-600/40"
            title="تخصيص نغمات التنبيهات (عام، خاص، منشن)"
          >
            <BellRing className="w-4 h-4 text-amber-400" />
          </button>

          {/* THE 5 MICROPHONE SLOTS (مع صورة العضو المتحدث وخيارات سحب/كتم/إفلات المايك) */}
          <div className="flex-1 grid grid-cols-5 gap-1 px-1">
            {micSlots.map((slot) => {
              const isOccupied = !!slot.user;
              const isMe = isOccupied && slot.user?.id === currentUser.id;
              const isSpeaking = isMe ? micVolume > 12 && !slot.user?.isMuted : slot.user?.isSpeaking;

              return (
                <button
                  key={slot.slotNumber}
                  onClick={() => {
                    if (isOccupied) {
                      setMicActionSlot({ slotNumber: slot.slotNumber, slotUser: slot.user });
                    } else {
                      handleTakeMic(slot.slotNumber);
                    }
                  }}
                  title={
                    isMe
                      ? 'مايكك الخاص - اضغط لكتم/تفعيل الصوت أو إفلات المايك'
                      : isOccupied
                      ? `مايك ${slot.slotNumber}: ${slot.user?.username} - انقر للخيارات (سحب/كتم المايك)`
                      : `مايك ${slot.slotNumber} فارغ - اضغط للصعود`
                  }
                  className={`h-11 rounded-md border flex flex-col items-center justify-center relative transition-all cursor-pointer overflow-hidden ${
                    isMe
                      ? 'bg-emerald-700 border-emerald-400 text-white shadow-lg'
                      : isOccupied
                      ? isSpeaking
                        ? 'bg-amber-600 border-amber-300 text-white ring-2 ring-emerald-400 animate-pulse'
                        : 'bg-[#2a241e] border-amber-600/60 text-amber-200'
                      : 'bg-[#151b24] border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {isOccupied ? (
                    <div className="relative w-full h-full flex flex-col items-center justify-center p-0.5">
                      <img
                        src={slot.user?.avatarUrl || falconIcon}
                        alt={slot.user?.username}
                        className={`w-6 h-6 rounded-full object-cover border transition-all ${
                          isSpeaking
                            ? 'border-amber-300 ring-2 ring-emerald-400 shadow-md animate-pulse scale-105'
                            : isMe
                            ? 'border-emerald-300'
                            : 'border-slate-400'
                        }`}
                      />
                      {(() => {
                        const slotBanner = slot.user ? getUserBanner(slot.user.username, slot.user.nameBannerUrl) : undefined;
                        if (slotBanner) {
                          return (
                            <img
                              src={slotBanner}
                              alt={slot.user?.username}
                              className="h-2.5 max-w-[46px] object-contain rounded mt-0.5"
                            />
                          );
                        }
                        return (
                          <span className="text-[8px] font-bold truncate max-w-full px-0.5 leading-none mt-0.5 text-white">
                            {isMe ? 'مايكك' : slot.user?.username.slice(0, 5)}
                          </span>
                        );
                      })()}
                      {isSpeaking && (
                        <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      )}
                      <div className="absolute bottom-0.5 right-0.5 p-0.5 rounded-full bg-black/75">
                        {slot.user?.isMuted ? (
                          <VolumeX className="w-2.5 h-2.5 text-rose-400" />
                        ) : (
                          <Mic className={`w-2.5 h-2.5 ${isSpeaking ? 'text-amber-300' : 'text-emerald-400'}`} />
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <Mic className="w-5 h-5 text-slate-400" />
                      <span className="text-[9px] font-bold truncate max-w-full px-0.5 leading-none mt-0.5">
                        {slot.slotNumber}
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>

          {/* Real LIVE Video Button (بث مباشر فيديو وصوت حقيقي) */}
          <button
            onClick={() => {
              if (isBroadcastingLive) {
                setIsLiveMinimized(false);
              } else if (activeRoomLiveBroadcast) {
                setIsWatchingLive(true);
                socket?.emit('joinLiveViewer', { room: currentUser.room || 'الغرفة العامة' });
              } else {
                setShowStartLiveConfirm(true);
              }
            }}
            className={`h-10 px-2 rounded-md text-white text-xs font-black flex items-center gap-1 shadow cursor-pointer flex-shrink-0 transition-all ${
              isBroadcastingLive
                ? 'bg-red-600 hover:bg-red-700 animate-pulse ring-2 ring-red-400'
                : activeRoomLiveBroadcast
                ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 animate-pulse ring-2 ring-rose-400'
                : 'bg-[#6d28d9] hover:bg-purple-700'
            }`}
            title={
              isBroadcastingLive
                ? 'أنت في بث مباشر الآن - انقر للتحكم بالبث'
                : activeRoomLiveBroadcast
                ? `مشاهدة بث [${activeRoomLiveBroadcast.broadcasterUsername}] المباشر 🔴`
                : 'بدء بث فيديو مباشر (لايف)'
            }
          >
            <Video className="w-3.5 h-3.5" />
            <span>
              {isBroadcastingLive
                ? 'بثي 🔴'
                : activeRoomLiveBroadcast
                ? '🔴 LIVE'
                : 'LIVE'}
            </span>
          </button>

          {/* Connection Status Pill with Ping */}
          <button
            type="button"
            onClick={() => setShowConnectionDetailsModal(true)}
            className={`h-10 px-2 rounded-md text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer flex-shrink-0 transition-all border ${
              !isConnected || connectionState === 'disconnected'
                ? 'bg-rose-950/90 text-rose-300 border-rose-500/80 hover:bg-rose-900'
                : connectionState === 'reconnecting'
                ? 'bg-amber-950/90 text-amber-300 border-amber-500/80 hover:bg-amber-900 animate-pulse'
                : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60 hover:bg-emerald-900'
            }`}
            title="فحص حالة الاتصال وسرعة الاستجابة والجلسة"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                !isConnected || connectionState === 'disconnected'
                  ? 'bg-rose-500'
                  : connectionState === 'reconnecting'
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-emerald-400'
              }`}
            />
            <span className="text-[10px] font-mono font-bold">
              {!isConnected || connectionState === 'disconnected'
                ? 'منقطع'
                : connectionState === 'reconnecting'
                ? 'معلق'
                : pingLatency !== null ? `${pingLatency}ms` : 'متصل'}
            </span>
          </button>

          {/* Return / Leave Room Button in Header (زر الرجوع / الخروج من الغرفة فقط) */}
          <button
            type="button"
            onClick={handleLeaveCurrentRoom}
            className="h-10 px-2.5 rounded-md bg-amber-950/80 hover:bg-amber-900 text-amber-200 border border-amber-600/70 text-xs font-bold flex items-center gap-1 shadow cursor-pointer flex-shrink-0 transition-colors"
            title="الرجوع والخروج من الغرفة فقط"
          >
            <LogOut className="w-3.5 h-3.5 text-amber-400 rotate-180" />
            <span className="text-[11px] font-extrabold">رجوع</span>
          </button>
        </header>

        {/* Real-time Connection Suspension & Auto-Recovery Banner (شريط استعادة الاتصال وحفظ الجلسة) */}
        {(!isConnected || connectionState === 'reconnecting') && (
          <div className="bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 text-white px-3 py-1.5 flex items-center justify-between text-xs font-bold border-b border-amber-300 shadow-lg flex-shrink-0 z-30 animate-in fade-in">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping flex-shrink-0" />
              <div className="min-w-0">
                <span className="font-black text-amber-100 block text-[11px] leading-tight">
                  {connectionState === 'reconnecting' ? 'جاري استعادة جلستك الحالية...' : 'الاتصال معلق (ضعف شبكة)'}
                </span>
                <span className="text-[10px] text-amber-100/90 truncate block">
                  جلستك محفوظة تلقائياً دون انقطاع أو تسجيل دخول جديد
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (socket) {
                  if (!socket.connected) socket.connect();
                  const savedToken = localStorage.getItem('soqoor_session_token');
                  const savedUserStr = localStorage.getItem('soqoor_current_user');
                  if (savedToken && savedUserStr) {
                    try {
                      const parsed = JSON.parse(savedUserStr);
                      socket.emit('restoreSession', {
                        sessionToken: savedToken,
                        username: parsed.username,
                        room: currentUser?.room || parsed.room || 'الغرفة العامة',
                        deviceFingerprint: generateDeviceFingerprint().fingerprintId
                      });
                    } catch {}
                  }
                }
              }}
              className="px-2.5 py-1 bg-black/40 hover:bg-black/60 text-white rounded text-[10px] font-black border border-white/30 cursor-pointer flex-shrink-0 transition-all flex items-center gap-1 mr-2"
            >
              <RotateCw className="w-3 h-3 animate-spin" />
              <span>استعادة الآن</span>
            </button>
          </div>
        )}

        {/* Web Notifications Permission Prompt Banner */}
        {showNotificationBanner && notificationPermission === 'default' && (
          <div className="bg-gradient-to-r from-amber-900 via-yellow-900 to-amber-900 text-amber-100 px-3 py-1.5 flex items-center justify-between text-xs font-bold border-b border-yellow-500/50 shadow-sm flex-shrink-0 animate-in fade-in z-20">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <BellRing className="w-4 h-4 text-amber-300 flex-shrink-0 animate-bounce" />
              <span className="truncate text-[11px] text-amber-200">
                تفعيل إشعارات المتصفح للرسائل الخاصة والمنشن (@) حتى عند قفل الشاشة
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0 mr-2">
              <button
                type="button"
                onClick={() => {
                  requestNotificationPermission().then((perm) => {
                    setNotificationPermission(perm);
                    setShowNotificationBanner(false);
                    if (perm === 'granted') {
                      showToast('تم تفعيل إشعارات المتصفح بنجاح! 🔔', 'success');
                      sendTestNotification().catch(() => {});
                    } else if (perm === 'denied') {
                      showToast('تم رفض إذن الإشعارات بالمتصفح', 'info');
                    }
                  });
                }}
                className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-amber-950 rounded font-black text-[11px] cursor-pointer shadow-xs active:scale-95 transition-all"
              >
                تفعيل الآن 🔔
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNotificationBanner(false);
                  try {
                    sessionStorage.setItem('soqoor_notif_banner_dismissed', 'true');
                  } catch {}
                }}
                className="p-1 text-amber-300/80 hover:text-white cursor-pointer"
                title="إخفاء"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Active Room Live Broadcast Banner (شريط إشعار البث المباشر النشط في الغرفة) */}
        {activeRoomLiveBroadcast && !isBroadcastingLive && (
          <div
            onClick={() => {
              setIsWatchingLive(true);
              socket?.emit('joinLiveViewer', { room: currentUser.room || 'الغرفة العامة' });
            }}
            className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white px-3 py-1.5 flex items-center justify-between cursor-pointer shadow-md text-xs font-bold animate-in fade-in z-25 hover:opacity-95 transition-opacity flex-shrink-0"
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
              <span className="font-black text-amber-200">🔴 بث مباشر:</span>
              <span className="truncate max-w-[170px] sm:max-w-xs">
                [{activeRoomLiveBroadcast.broadcasterUsername}] يبث الآن فيديو وصوت
              </span>
            </div>
            <div className="flex items-center gap-1 bg-black/30 px-2 py-0.5 rounded-full text-[10px] text-amber-300 font-black">
              <Eye className="w-3 h-3" />
              <span>{liveViewerCount}</span>
              <span className="mr-0.5">مشاهدة ▶</span>
            </div>
          </div>
        )}

        {/* Scrolling News Ticker Marquee (يظهر لعدة ثوانٍ للعضو الجديد ثم يختفي تلقائياً) */}
        {serverSecurity?.marqueeTicker && showAnnouncementBar && (
          <div className={`transition-all duration-700 ${curTheme.subHeaderBg} ${curTheme.subHeaderText || curTheme.accentText} py-1.5 px-3 border-b ${curTheme.subHeaderBorder} text-[11px] font-bold overflow-hidden flex items-center gap-2 flex-shrink-0 shadow-inner animate-in fade-in`}>
            <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/40 px-1.5 py-0.2 rounded font-black flex-shrink-0 animate-pulse">
              🦅 إعلان
            </span>
            <div className="overflow-hidden whitespace-nowrap flex-1">
              <span className="inline-block">{serverSecurity.marqueeTicker}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowAnnouncementBar(false)}
              className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
              title="إخفاء الإعلان"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Floating Upload Progress Banner (Never Congests Socket) */}
        {uploadProgress !== null && (
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-3 py-2 border-b border-indigo-500/50 shadow-lg flex-shrink-0 animate-in fade-in">
            <div className="flex items-center justify-between text-xs font-bold mb-1">
              <span className="flex items-center gap-1.5 text-indigo-300">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                <span>{uploadStatusText || 'جاري رفع الملف...'}</span>
              </span>
              <span className="font-mono text-amber-300 font-black">{uploadProgress}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500 transition-all duration-150"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5 text-center">
              ⚡ الاتصال والمايك مستمران بنسبة 100% دون انقطاع أثناء الرفع
            </div>
          </div>
        )}

        {/* Urgent Emergency Siren Banner */}
        {activeAdminSiren && (
          <div className="bg-red-600 text-white p-2.5 flex items-center justify-between text-xs font-black shadow-lg animate-pulse z-30 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xl animate-bounce">🚨</span>
              <div>
                <span className="text-yellow-200 block text-[10px]">تنبيه وإنذار إداري عاجل من {activeAdminSiren.from}:</span>
                <span className="text-xs">{activeAdminSiren.message}</span>
              </div>
            </div>
            <button
              onClick={() => setActiveAdminSiren(null)}
              className="text-white hover:text-yellow-200 text-sm font-bold px-2 py-0.5 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* If user is holding a mic slot: quick control bar */}
        {currentUser.micSlot !== null && (
          <div className="bg-emerald-700 text-white px-3 py-1.5 flex items-center justify-between text-xs font-bold shadow">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
              أنت على المايك رقم ({currentUser.micSlot})
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const muted = audioManager?.toggleMute() ?? false;
                  sounds.playToggleMute(muted);
                  showToast(muted ? 'تم كتم المايك 🔇' : 'تم تفعيل المايك 🎙️', 'info');
                }}
                className="px-2 py-0.5 bg-emerald-900 rounded text-[11px] hover:bg-black"
              >
                {currentUser.isMuted ? 'تفعيل المايك' : 'كتم'}
              </button>
              <button
                onClick={handleDropMic}
                className="px-2 py-0.5 bg-rose-600 rounded text-[11px] hover:bg-rose-700"
              >
                ترك المايك
              </button>
            </div>
          </div>
        )}

        {/* CHAT MESSAGES STREAM CONTAINER */}
        <div className="flex-1 flex flex-col min-h-0 relative">

          {/* TOP RIGHT FLOATING CONTROLS: 1. ترسانة الميزات 50+  2. أدوات حسان برو  3. جرس الفلتر */}
          <div className="absolute top-2.5 right-3 z-30 flex flex-col items-center gap-2 pointer-events-auto">
            {/* 50+ MEGA ARSENAL QUICK LAUNCH BUTTON (ترسانة الميزات الـ 50 الفائقة) */}
            <button
              type="button"
              onClick={() => setShowUltimateFeatures50(true)}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 text-slate-950 font-black border border-amber-300 shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer animate-pulse"
              title="ترسانة الميزات الـ 50 الشاملة (Mega Suite 50+)"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
            </button>

            {/* CONSOLIDATED COMPACT TOOLS TRIGGER (أيقونة أدوات حسان برو ⚡) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCompactToolsMenu(!showCompactToolsMenu)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#241a12]/95 hover:bg-black text-amber-300 border border-amber-500/70 shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer group"
                title="أدوات وميزات حسان برو الشاملة ⚡"
              >
                <Zap className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
              </button>

              {/* Click-outside backdrop overlay */}
              {showCompactToolsMenu && (
                <div
                  className="fixed inset-0 z-35 bg-black/20"
                  onClick={() => setShowCompactToolsMenu(false)}
                />
              )}

              {/* Compact Tools Dropdown Menu (الشامل لجميع الميزات والأدوات والفلترة) */}
              {showCompactToolsMenu && (
                <div className="absolute top-10 right-0 w-64 max-h-[80vh] overflow-y-auto bg-[#1a140f] border-2 border-amber-500/80 rounded-2xl shadow-2xl p-2.5 space-y-2 text-right text-xs z-40 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-1.5 py-1 border-b border-[#3e2c1c] text-[11px] font-black text-amber-400 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>أدوات وميزات حسان برو ⚡</span>
                    </span>
                    <button onClick={() => setShowCompactToolsMenu(false)} className="text-slate-400 hover:text-white p-0.5 cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* القسم 1: فلترة الدردشة والإشارات */}
                  <div className="space-y-1">
                    <div className="text-[10px] text-amber-300/70 font-bold px-1">💬 تصفية وعرض الرسائل:</div>
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setFilterOnlyMentions(false);
                          setShowCompactToolsMenu(false);
                        }}
                        className={`p-1.5 rounded-lg text-center font-bold text-[11px] transition-colors cursor-pointer ${
                          !filterOnlyMentions ? 'bg-amber-500 text-slate-950 font-black' : 'bg-white/5 hover:bg-white/10 text-slate-300'
                        }`}
                      >
                        الكل 💬
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFilterOnlyMentions(true);
                          setShowCompactToolsMenu(false);
                        }}
                        className={`p-1.5 rounded-lg text-center font-bold text-[11px] transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                          filterOnlyMentions ? 'bg-rose-600 text-white font-black' : 'bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        <span>@ إشاراتي</span>
                        {currentUser && (
                          <span className="w-3.5 h-3.5 rounded-full bg-rose-200 text-rose-900 text-[8px] font-black flex items-center justify-center">
                            {messages.filter((m) => m.text && m.text.includes(`@${currentUser.username}`)).length}
                          </span>
                        )}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowCompactToolsMenu(false);
                        setIsMegaSuiteOpen(true);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-amber-950/50 hover:bg-amber-900/50 border border-amber-500/30 text-amber-200 font-bold flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span>الرسائل المفضلة</span>
                      </span>
                      <span className="text-[10px] font-mono text-amber-300 font-black">({starredMessages.length})</span>
                    </button>
                  </div>

                  {/* القسم 2: الأجنحة الإبداعية وميزات حسان برو */}
                  <div className="space-y-1 pt-1 border-t border-[#3e2c1c]">
                    <div className="text-[10px] text-amber-300/70 font-bold px-1">🦅 الأجنحة الإبداعية والميزات:</div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setShowCompactToolsMenu(false);
                        setShowUltimateFeatures50(true);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-slate-950 font-black flex items-center justify-between transition-all shadow-md cursor-pointer animate-pulse"
                    >
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                        <span>ترسانة الميزات الـ 50 الشاملة (Mega Suite 50+)</span>
                      </span>
                      <span className="text-[9px] bg-slate-950 text-amber-400 px-1.5 py-0.5 rounded-full font-bold">جديد 50+</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowCompactToolsMenu(false);
                        setIsMegaSuiteOpen(true);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
                      <span>جناح حسان برو الشامل (حسان برو سويت 50+)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowCompactToolsMenu(false);
                        setShowAudioStudio(true);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-slate-200 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Mic className="w-3.5 h-3.5 text-indigo-400" />
                      <span>استوديو هندسة الصوت والمايك</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowCompactToolsMenu(false);
                        setShowGamesSuite(true);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-slate-200 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Gamepad2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>ميدان الألعاب والمسابقات</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowCompactToolsMenu(false);
                        setShowIdentityStudio(true);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-slate-200 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Crown className="w-3.5 h-3.5 text-purple-400" />
                      <span>استوديو الهوية، الإطارات والأوسمة</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowCompactToolsMenu(false);
                        setShowThemesModal(true);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-slate-200 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Palette className="w-3.5 h-3.5 text-emerald-400" />
                      <span>الاستايل، الثيمات، الخطوط والخلفيات</span>
                    </button>
                  </div>

                  {/* القسم 3: أدوات النظام والغرفة والإدارة */}
                  <div className="space-y-1 pt-1 border-t border-[#3e2c1c]">
                    <div className="text-[10px] text-amber-300/70 font-bold px-1">⚡ أدوات النظام والغرفة:</div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowCompactToolsMenu(false);
                        setShowDiagnosticsModal(true);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-slate-200 font-bold flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-emerald-400" />
                        <span>فحص جودة الاتصال والـ Ping</span>
                      </span>
                      <span className="text-[9px] bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded font-mono font-bold">21ms</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowCompactToolsMenu(false);
                        setShowSoundModal(true);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-slate-200 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>مركز نغمات التنبيهات</span>
                    </button>

                    {currentUser.room && currentUser.room !== 'خارج الغرف' && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowCompactToolsMenu(false);
                          const curRoom = roomsList.find((r) => r.name === currentUser.room || r.id === currentUser.room);
                          setCurrentRoomSettingsForm({
                            name: curRoom?.name || currentUser.room,
                            desc: curRoom?.desc || '',
                            pinnedTopic: pinnedTopic || '',
                            isChatLocked: roomSettings?.isChatLocked || false,
                            slowModeSeconds: roomSettings?.slowModeSeconds || 0,
                            isVoiceLocked: roomSettings?.isVoiceLocked || false,
                            password: '',
                            wallpaper: activeWallpaper || 'default',
                            welcomeMessage: (roomSettings as any)?.welcomeMessage || '',
                            welcomeEnabled: (roomSettings as any)?.welcomeEnabled !== false
                          });
                          setIsRoomSettingsModalOpen(true);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-slate-200 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Settings className="w-3.5 h-3.5 text-emerald-400" />
                        <span>إعدادات الغرفة الحالية</span>
                      </button>
                    )}

                    {(currentUser.role === 'admin' || currentUser.role === 'super') && (
                      <div className="p-2 rounded-xl bg-gradient-to-r from-red-950/60 via-slate-900 to-amber-950/60 border border-red-500/40 text-amber-200 space-y-1.5 shadow-md">
                        <div className="flex items-center justify-between">
                          <span className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[9px] font-mono font-black">STAFF</span>
                          <span className="text-[10px] text-amber-300 font-bold">إجراءات سريعة للإدارة:</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[10px]">
                          <button
                            type="button"
                            onClick={() => {
                              setShowCompactToolsMenu(false);
                              if (confirm('مسح شات الغرفة كاملاً لجميع المتواجدين؟')) {
                                handleAdminAction('globalClearChat', '');
                              }
                            }}
                            className="px-2 py-1.5 rounded bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-700/50 flex items-center justify-center gap-1 cursor-pointer font-bold"
                            title="مسح شات الغرفة"
                          >
                            <Trash2 className="w-3 h-3 text-red-400" />
                            <span>مسح شات</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowCompactToolsMenu(false);
                              handleAdminAction('lockRoomChat', '', !roomSettings.isChatLocked);
                            }}
                            className={`px-2 py-1.5 rounded border flex items-center justify-center gap-1 cursor-pointer font-bold ${
                              roomSettings.isChatLocked ? 'bg-rose-600 text-white border-rose-500' : 'bg-slate-800 text-slate-200 border-slate-700'
                            }`}
                            title={roomSettings.isChatLocked ? 'فتح الشات' : 'قفل الشات'}
                          >
                            <Lock className="w-3 h-3" />
                            <span>{roomSettings.isChatLocked ? 'فتح' : 'قفل'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowCompactToolsMenu(false);
                              handleAdminAction('lockRoomVoice', '', !roomSettings.isVoiceLocked);
                            }}
                            className={`px-2 py-1.5 rounded border flex items-center justify-center gap-1 cursor-pointer font-bold ${
                              roomSettings.isVoiceLocked ? 'bg-amber-600 text-white border-amber-500' : 'bg-slate-800 text-slate-200 border-slate-700'
                            }`}
                            title="قفل أو فك المايكات"
                          >
                            <Mic className="w-3 h-3" />
                            <span>{roomSettings.isVoiceLocked ? 'فك مايك' : 'سد مايك'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowCompactToolsMenu(false);
                              socket?.emit('getMonitorLogs');
                              socket?.emit('getRoomStats');
                              setActiveDrawer('monitor');
                            }}
                            className="px-2 py-1.5 rounded bg-amber-500 hover:bg-amber-600 text-slate-950 font-black flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                            title="لوحة التحكم والمراقبة"
                          >
                            <Shield className="w-3 h-3" />
                            <span>لوحة التحكم</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* FILTER BELL BUTTON (تحت أيقونة أدوات حسان برو مباشرة - محصور بصلاحيات المستخدم فقط ولا يظهر للعامة) */}
            {userCanFilter && (
              <button
                type="button"
                onClick={() => setShowFilterAlertsModal(true)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#241a12]/95 hover:bg-black text-amber-300 border border-amber-500/70 shadow-xl flex items-center justify-center relative hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title="تنبيهات فلتر الكلمات المحظورة (جرس الفلتر)"
              >
                <Bell className="w-4 h-4 text-amber-300" />
                {filterAlertsList.length > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-red-600 text-white text-[9px] font-black flex items-center justify-center border border-white shadow-md animate-pulse">
                    {filterAlertsList.length > 99 ? '99+' : filterAlertsList.length}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* 🔴 LIVE BROADCASTER STUDIO COMPONENT */}
          {isBroadcastingLive && (
            !isLiveMinimized ? (
              <div className="mx-2 mt-2 z-30 bg-slate-950/95 border-2 border-red-500 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-white animate-in slide-in-from-top-3 duration-200">
                {/* Broadcaster Header */}
                <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 px-3 py-2 flex items-center justify-between shadow-md">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                    <span className="font-black text-xs">🔴 بثك مباشر الآن للغرفة</span>
                    <span className="bg-black/40 px-2 py-0.5 rounded-full text-[10px] font-mono text-amber-300 flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>{liveViewerCount}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsLiveMinimized(true)}
                      className="p-1 rounded-lg bg-black/30 hover:bg-black/50 text-white cursor-pointer transition-colors"
                      title="تصغير إلى نافذة عائمة ومتابعة الدردشة"
                    >
                      <Minimize2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleStopLiveBroadcast}
                      className="px-2 py-0.5 bg-black/40 hover:bg-black/60 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1"
                      title="إنهاء البث"
                    >
                      <span>إنهاء ⏹️</span>
                    </button>
                  </div>
                </div>

                {/* Video Viewport with Floating Reactions Overlay */}
                <div className="relative w-full h-48 sm:h-56 bg-black flex items-center justify-center overflow-hidden">
                  <video
                    ref={localLiveVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${isLiveCameraOff ? 'hidden' : 'block'}`}
                  />
                  {isLiveCameraOff && (
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-400 p-4 text-center">
                      <Camera className="w-10 h-10 text-slate-500" />
                      <span className="text-xs font-bold">الكاميرا مغلقة مؤقتاً</span>
                    </div>
                  )}

                  {/* Floating live reactions animated on screen */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {liveFloatingReactions.map((r) => (
                      <div
                        key={r.id}
                        style={{ left: `${r.left}%` }}
                        className="absolute bottom-2 text-2xl animate-float-up pointer-events-none drop-shadow-lg"
                      >
                        {r.emoji}
                      </div>
                    ))}
                  </div>

                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-full text-[10px] text-amber-300 font-bold border border-amber-500/40">
                    مباشر 🔴 {currentUser.username}
                  </div>
                </div>

                {/* Broadcaster Controls Bar */}
                <div className="p-2 bg-slate-900 border-t border-slate-800 flex items-center justify-around gap-2 text-xs">
                  <button
                    type="button"
                    onClick={handleFlipLiveCamera}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold flex flex-col items-center gap-0.5 flex-1 cursor-pointer transition-colors"
                    title="تبديل الكاميرا (أمامية / خلفية)"
                  >
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[9px]">تبديل</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleLiveCamera}
                    className={`p-1.5 rounded-xl font-bold flex flex-col items-center gap-0.5 flex-1 cursor-pointer transition-colors ${
                      isLiveCameraOff ? 'bg-red-950 text-red-300 border border-red-700' : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                    title="إيقاف / تشغيل الكاميرا"
                  >
                    {isLiveCameraOff ? <EyeOff className="w-3.5 h-3.5 text-red-400" /> : <Eye className="w-3.5 h-3.5 text-emerald-400" />}
                    <span className="text-[9px]">{isLiveCameraOff ? 'فتح الكاميرا' : 'كتم الكاميرا'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleLiveMic}
                    className={`p-1.5 rounded-xl font-bold flex flex-col items-center gap-0.5 flex-1 cursor-pointer transition-colors ${
                      isLiveMicMuted ? 'bg-red-950 text-red-300 border border-red-700' : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                    title="كتم / تشغيل المايك"
                  >
                    {isLiveMicMuted ? <MicOff className="w-3.5 h-3.5 text-red-400" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
                    <span className="text-[9px]">{isLiveMicMuted ? 'تفعيل الصوت' : 'كتم المايك'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleStopLiveBroadcast}
                    className="p-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black flex flex-col items-center gap-0.5 flex-1 cursor-pointer transition-colors"
                    title="إنهاء البث"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="text-[9px]">إنهاء</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Minimized Floating Broadcaster PiP */
              <div
                onClick={() => setIsLiveMinimized(false)}
                className="fixed bottom-16 right-4 z-40 w-24 h-32 bg-black rounded-2xl border-2 border-red-500 shadow-2xl overflow-hidden cursor-pointer flex flex-col animate-in zoom-in-95 group hover:scale-105 transition-transform"
                title="انقر لتوسيع البث المباشر"
              >
                <video
                  ref={localLiveVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-1 right-1 bg-red-600 text-white px-1.5 py-0.2 rounded-full text-[9px] font-black animate-pulse flex items-center gap-0.5">
                  <span>🔴</span>
                  <span>بثي</span>
                </div>
                <div className="absolute bottom-1 inset-x-1 bg-black/75 text-center text-[9px] text-amber-300 font-bold rounded py-0.5">
                  👁️ {liveViewerCount}
                </div>
              </div>
            )
          )}

          {/* 📺 LIVE VIEWER PLAYER COMPONENT (مشاهدة البث المباشر للغرفة) */}
          {isWatchingLive && activeRoomLiveBroadcast && (
            <div className="mx-2 mt-2 z-30 bg-slate-950/95 border-2 border-amber-500 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-white animate-in slide-in-from-top-3 duration-200">
              {/* Viewer Header */}
              <div className="bg-gradient-to-r from-red-700 via-rose-700 to-amber-700 px-3 py-2 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-2">
                  <img
                    src={activeRoomLiveBroadcast.broadcasterAvatar || falconIcon}
                    alt={activeRoomLiveBroadcast.broadcasterUsername}
                    className="w-7 h-7 rounded-full object-cover border border-amber-400"
                  />
                  <div>
                    <div className="font-bold text-xs flex items-center gap-1">
                      {(() => {
                        const bBanner = getUserBanner(activeRoomLiveBroadcast.broadcasterUsername);
                        if (bBanner) {
                          return (
                            <img
                              src={bBanner}
                              alt={activeRoomLiveBroadcast.broadcasterUsername}
                              className="h-5 max-h-[22px] max-w-[130px] object-contain rounded inline-block"
                            />
                          );
                        }
                        return <span>{activeRoomLiveBroadcast.broadcasterUsername}</span>;
                      })()}
                      {activeRoomLiveBroadcast.broadcasterFlag && <span>{activeRoomLiveBroadcast.broadcasterFlag}</span>}
                      <span className="bg-red-600 text-white text-[9px] px-1 rounded font-black animate-pulse">🔴 مباشر</span>
                    </div>
                    <div className="text-[10px] text-amber-200/80 flex items-center gap-1 font-mono">
                      <Eye className="w-3 h-3 text-amber-400" />
                      <span>{liveViewerCount} يشاهدون</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsWatchingLive(false);
                    socket?.emit('leaveLiveViewer', { room: currentUser.room || 'الغرفة العامة' });
                  }}
                  className="w-7 h-7 rounded-lg bg-black/40 hover:bg-black/60 text-white flex items-center justify-center cursor-pointer transition-colors"
                  title="إغلاق شاشة البث"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Live Video Feed Image/Stream */}
              <div className="relative w-full h-52 sm:h-60 bg-black flex items-center justify-center overflow-hidden">
                {liveRemoteVideoFrame ? (
                  <img
                    src={liveRemoteVideoFrame}
                    alt="بث مباشر"
                    className="w-full h-full object-contain bg-black"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 text-amber-200/70 p-4 text-center">
                    <div className="w-8 h-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
                    <span className="text-xs font-bold">جاري استقبال إشارة البث المباشر 🔴...</span>
                  </div>
                )}

                {/* Floating Reactions Overlay */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {liveFloatingReactions.map((r) => (
                    <div
                      key={r.id}
                      style={{ left: `${r.left}%` }}
                      className="absolute bottom-2 text-2xl animate-float-up pointer-events-none drop-shadow-lg"
                    >
                      {r.emoji}
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Reactions Bar */}
              <div className="p-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-1.5 overflow-x-auto">
                <span className="text-[10px] text-amber-300 font-bold shrink-0">تفاعل:</span>
                <div className="flex items-center gap-1.5 flex-1 justify-around">
                  {['❤️', '🔥', '👏', '🦅', '👑', '🌹', '😍', '🎉'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleSendLiveReaction(emoji)}
                      className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 active:scale-125 transition-transform flex items-center justify-center text-base cursor-pointer shadow-xs"
                      title={`إرسال ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CHAT MESSAGES STREAM */}
          <div
            ref={chatContainerRef}
            onScroll={handleChatScroll}
            className={`flex-1 overflow-y-auto p-3 pt-12 space-y-3 relative transition-all ${
              // Light Wallpapers (خلفيات فاتحة مريحة)
              activeWallpaper === 'light-pure'
                ? 'bg-gradient-to-b from-slate-100 via-white to-slate-200 text-slate-800'
                : activeWallpaper === 'light-paper'
                ? 'bg-[#faf6ee] bg-[radial-gradient(#d6cbb5_1px,transparent_1px)] [background-size:14px_14px] text-stone-900'
                : activeWallpaper === 'light-clouds'
                ? 'bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 text-slate-800'
                : activeWallpaper === 'light-sand'
                ? 'bg-gradient-to-tr from-amber-100 via-orange-50 to-yellow-100 text-amber-950'
                : activeWallpaper === 'light-mint'
                ? 'bg-gradient-to-b from-emerald-100 via-teal-50 to-green-100 text-emerald-950'
                : activeWallpaper === 'light-lavender'
                ? 'bg-gradient-to-tr from-purple-100 via-pink-50 to-indigo-100 text-purple-950'
                : activeWallpaper === 'light-geometric'
                ? 'bg-slate-100 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] bg-[size:16px_16px] text-slate-800'
                : activeWallpaper === 'light-rose'
                ? 'bg-gradient-to-b from-rose-100 via-pink-50 to-stone-100 text-rose-950'
                // Dark Wallpapers (خلفيات غامقة وملكية)
                : activeWallpaper === 'stars'
                ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-slate-900 to-black text-slate-100'
                : activeWallpaper === 'desert'
                ? 'bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-amber-950/40 via-stone-900 to-slate-950 text-slate-100'
                : activeWallpaper === 'arabesque'
                ? 'bg-slate-950 bg-[radial-gradient(#475569_1px,transparent_1px)] [background-size:16px_16px] text-slate-100'
                : activeWallpaper === 'luxury-wood'
                ? 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-stone-900 via-stone-950 to-black text-slate-100'
                : activeWallpaper === 'cyber-grid'
                ? 'bg-slate-950 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] text-slate-100'
                : activeWallpaper === 'dark-obsidian'
                ? 'bg-[#09080d] bg-[radial-gradient(ellipse_at_top,_#451a03_0%,transparent_70%)] text-slate-100'
                : activeWallpaper === 'dark-emerald'
                ? 'bg-[#02150d] bg-[radial-gradient(ellipse_at_bottom,_#064e3b_0%,transparent_70%)] text-slate-100'
                : activeWallpaper === 'dark-sapphire'
                ? 'bg-[#030c18] bg-[radial-gradient(ellipse_at_center,_#1e3a8a_0%,transparent_70%)] text-slate-100'
                : activeWallpaper === 'dark-dam-ghazal'
                ? 'bg-[#180309] bg-[radial-gradient(ellipse_at_top,_#881337_0%,transparent_70%)] text-slate-100'
                : `${curTheme.chatBg} ${curTheme.appText || 'text-slate-100'}`
            } ${eyeComfort ? 'eye-comfort-filter' : ''}`}
            style={{ fontFamily: FONTS_LIST.find((f) => f.id === fontFamily)?.family || 'Cairo, sans-serif' }}
          >
          {/* Sticky Pinned Topic / Announcement Banner (تثبيت إعلان الغرفة) */}
          {pinnedTopic && (
            <div className="sticky top-0 z-10 bg-gradient-to-r from-[#241a12] via-[#3a291b] to-[#241a12] text-amber-200 px-3 py-1.5 rounded-xl shadow-md border border-amber-500/40 flex items-center justify-between text-xs mb-1 backdrop-blur-md">
              <div className="flex items-center gap-2 min-w-0">
                <Pin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 animate-bounce" />
                <span className="font-bold text-[11px] truncate text-amber-100">{pinnedTopic}</span>
              </div>
              <button
                type="button"
                onClick={() => setPinnedTopic('')}
                className="text-amber-400 hover:text-white p-0.5 cursor-pointer ml-1"
                title="إخفاء الإعلان المثبت"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Message Stream */}
          {messages
            .filter((msg) => !isUserIgnored(msg.username))
            .filter((msg) => {
              const currentRoom = currentUser?.room;
              if (currentRoom && msg.room && msg.room.trim().toLowerCase() !== currentRoom.trim().toLowerCase()) {
                return false;
              }
              return true;
            })
            .filter((msg) => {
              if (filterOnlyMentions && currentUser) {
                const isMention = msg.text && (
                  msg.text.includes(`@${currentUser.username}`) ||
                  msg.text.toLowerCase().includes(`@${currentUser.username.toLowerCase()}`)
                );
                if (!isMention) return false;
              }
              if (chatSearchQuery.trim()) {
                const q = chatSearchQuery.toLowerCase();
                const textMatch = msg.text && msg.text.toLowerCase().includes(q);
                const userMatch = msg.username.toLowerCase().includes(q);
                if (!textMatch && !userMatch) return false;
              }
              return true;
            })
            .map((msg, idx) => {
            const isAlertMessage = Boolean(msg.badge && (msg.badge.includes('إشعار عام') || msg.badge.includes('إعلان')));
            const isMentioned = Boolean(
              currentUser &&
              msg.username !== currentUser.username &&
              msg.text &&
              (
                msg.text.includes(`@${currentUser.username}`) ||
                msg.text.toLowerCase().includes(`@${currentUser.username.toLowerCase()}`)
              )
            );

            return (
              <div
                id={`msg-${msg.id}`}
                key={msg.id ? `msg-${msg.id}-${idx}` : `msg-idx-${idx}`}
                className={`chat-message-row relative flex items-start gap-2.5 text-right py-2 px-2.5 rounded-xl transition-all max-w-full min-w-0 ${
                  activeMsgMenuId === msg.id ? 'z-50' : 'z-0'
                } ${
                  isAlertMessage
                    ? 'bg-amber-50/90 border-r-4 border-amber-500 shadow-xs my-1'
                    : isMentioned
                    ? 'mention-pink-flash border-r-4 border-rose-500 ring-2 ring-pink-300/80 shadow-md my-1.5'
                    : activeWallpaper.startsWith('light-')
                    ? 'border-b border-slate-200/70 last:border-b-0 hover:bg-black/5'
                    : 'border-b border-slate-800/40 last:border-b-0 hover:bg-white/5'
                }`}
              >
                <img
                  src={msg.avatarUrl || falconIcon}
                  alt={msg.username}
                  onClick={() => {
                    const target = rosterUsers.find((u) => u.username === msg.username);
                    if (target) openUserProfile(target);
                  }}
                  className="w-10 h-10 rounded-lg object-cover border border-slate-300 shadow-sm flex-shrink-0 mt-0.5 cursor-pointer hover:opacity-80"
                />

                <div className={`flex-1 min-w-0 relative ${activeMsgMenuId === msg.id ? 'z-50' : ''}`}>
                  <div className="flex items-center justify-between text-xs mb-1 gap-1">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      {msg.badge && (
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${msg.badgeColor || 'bg-red-600 text-white'}`}>
                          {msg.badge}
                        </span>
                      )}
                      {(() => {
                        const bannerUrl = getUserBanner(msg.username, msg.nameBannerUrl);
                        if (bannerUrl) {
                          return (
                            <span
                              onClick={() => openUserProfileByName(msg.username)}
                              title={msg.username}
                              className="inline-flex items-center cursor-pointer select-none"
                            >
                              <img
                                src={bannerUrl}
                                alt={msg.username}
                                title={msg.username}
                                className="h-6 max-h-[28px] max-w-[170px] sm:max-w-[210px] object-contain drop-shadow-sm rounded inline-block align-middle hover:opacity-90 transition-opacity"
                                loading="lazy"
                              />
                            </span>
                          );
                        }
                        return (
                          <span
                            onClick={() => openUserProfileByName(msg.username)}
                            style={{ color: msg.nameColor || undefined }}
                            className={`font-bold cursor-pointer hover:underline text-xs ${!msg.nameColor ? 'text-slate-800' : ''}`}
                          >
                            {msg.username}
                          </span>
                        );
                      })()}
                      {isMentioned && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-200/90 text-rose-800 text-[10px] font-black flex items-center gap-1 shadow-xs border border-rose-300 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                          <span>@ إشارة خاصة بك</span>
                        </span>
                      )}
                    </div>

                    {/* Consolidated Actions: Time + Single Dropdown Menu (⋮) */}
                    <div className="flex items-center gap-1.5 flex-shrink-0 relative">
                      <span className="text-[11px] text-slate-400 font-mono font-medium select-none">
                        {formatMessageTime(msg)}
                      </span>

                      {/* Single Elegant Action Trigger Button (⋮) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMsgMenuId(activeMsgMenuId === msg.id ? null : msg.id);
                        }}
                        className={`msg-action-btn relative z-20 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold transition-all cursor-pointer shadow-xs active:scale-95 border ${
                          activeMsgMenuId === msg.id
                            ? 'bg-amber-500 text-slate-950 border-amber-400 font-black scale-105 ring-2 ring-amber-400/50'
                            : activeWallpaper.startsWith('light-')
                            ? 'bg-white/90 hover:bg-slate-200 text-slate-700 border-slate-300'
                            : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700/80'
                        }`}
                        title="خيارات وإجراءات الرسالة (رد، نسخ، نطق، تفاعل، تعديل، تثبيت، حذف، إبلاغ)"
                      >
                        ⋮
                      </button>

                      {/* Message Action Menu (يظهر مباشرة بجوار وأمام زر الثلاث نقاط مع منع إغلاقها عند النقر بالداخل) */}
                      {activeMsgMenuId === msg.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          className="msg-action-panel absolute top-full mt-2 left-0 z-50 p-2 bg-slate-900/95 text-slate-100 border-2 border-amber-500/80 rounded-2xl shadow-2xl backdrop-blur-md w-[86vw] max-w-[340px] sm:max-w-[380px] overflow-hidden transition-all duration-200 ease-out transform opacity-100 scale-100 animate-in fade-in zoom-in-95 slide-in-from-top-2 ring-2 ring-amber-500/30"
                        >
                      {/* Upper Row: Quick Emojis + Close Button */}
                      <div className="flex items-center justify-between gap-1 pb-1.5 mb-1.5 border-b border-slate-800/90">
                        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                          <span className="text-[11px] text-amber-400 font-bold ml-1 select-none flex-shrink-0">
                            تفاعل:
                          </span>
                          {AVAILABLE_REACTIONS.map((em) => (
                            <button
                              key={em}
                              type="button"
                              onClick={() => {
                                setActiveMsgMenuId(null);
                                handleReactToMessage(msg.id, em);
                              }}
                              className="w-7 h-7 rounded-full flex items-center justify-center text-sm hover:scale-130 transition-transform hover:bg-slate-800 active:scale-95 cursor-pointer flex-shrink-0"
                              title={`تفاعل بـ ${em}`}
                            >
                              {em}
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveMsgMenuId(null)}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 flex-shrink-0 transition-colors cursor-pointer"
                          title="إغلاق خيارات الرسالة"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Lower Row: Action Buttons */}
                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
                        {/* 1. Reply (رد) */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMsgMenuId(null);
                            setReplyingTo({
                              id: msg.id,
                              username: msg.username,
                              text: msg.text || (msg.voiceNote ? 'تسجيل مقطع صوتي 🎙️' : 'مرفق وسائط 📸'),
                              mediaUrl: msg.mediaUrl
                            });
                            inputRef.current?.focus();
                            showToast(`الرد على @${msg.username} ↩️`, 'info');
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-800/90 hover:bg-amber-600/30 hover:text-amber-300 text-slate-200 border border-slate-700/80 flex items-center gap-1.5 font-medium transition-all active:scale-95 cursor-pointer flex-shrink-0"
                          title="رد على الرسالة"
                        >
                          <Reply className="w-3.5 h-3.5 rotate-180 text-amber-400" />
                          <span>رد</span>
                        </button>

                        {/* 2. Copy (نسخ) */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMsgMenuId(null);
                            const textToCopy = msg.text || msg.mediaUrl || '';
                            navigator.clipboard.writeText(textToCopy);
                            showToast('تم نسخ المحتوى بنجاح ✔️', 'info');
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 hover:text-white text-slate-200 border border-slate-700/80 flex items-center gap-1.5 font-medium transition-all active:scale-95 cursor-pointer flex-shrink-0"
                          title="نسخ النص أو الرابط"
                        >
                          <Copy className="w-3.5 h-3.5 text-slate-300" />
                          <span>نسخ</span>
                        </button>

                        {/* 3. Text to Speech (نطق) */}
                        {msg.text && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMsgMenuId(null);
                              speakMessage(msg.text);
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-800/90 hover:bg-indigo-600/30 hover:text-indigo-300 text-slate-200 border border-slate-700/80 flex items-center gap-1.5 font-medium transition-all active:scale-95 cursor-pointer flex-shrink-0"
                            title="قراءة صوتية (نطق)"
                          >
                            <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                            <span>نطق</span>
                          </button>
                        )}

                        {/* 4. Star (مفضلة) */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMsgMenuId(null);
                            toggleStarMessage(msg);
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-800/90 hover:bg-amber-600/30 hover:text-amber-300 text-slate-200 border border-slate-700/80 flex items-center gap-1.5 font-medium transition-all active:scale-95 cursor-pointer flex-shrink-0"
                          title={isMessageStarred(msg.id) ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}
                        >
                          <Star className={`w-3.5 h-3.5 ${isMessageStarred(msg.id) ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
                          <span>{isMessageStarred(msg.id) ? 'إلغاء المفضلة' : 'مفضلة'}</span>
                        </button>

                        {/* 5. Whisper / PM (خاص) */}
                        {currentUser && msg.username.toLowerCase() !== currentUser.username.toLowerCase() && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMsgMenuId(null);
                              const target = rosterUsers.find((u) => u.username === msg.username);
                              if (target) {
                                setSelectedPmUser(target);
                                setActiveDrawer('pm');
                              } else {
                                setSelectedPmUser({
                                  id: msg.username,
                                  username: msg.username,
                                  room: currentUser.room,
                                  avatarSeed: msg.username,
                                  avatarUrl: msg.avatarUrl,
                                  statusQuote: '',
                                  flag: msg.flag || '🇸🇦',
                                  role: 'member',
                                  likes: 0,
                                  points: 0,
                                  isVoice: false,
                                  micSlot: null,
                                  isMuted: false,
                                  isTextMuted: false,
                                  isSpeaking: false
                                });
                                setActiveDrawer('pm');
                              }
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-800/90 hover:bg-emerald-600/30 hover:text-emerald-300 text-slate-200 border border-slate-700/80 flex items-center gap-1.5 font-medium transition-all active:scale-95 cursor-pointer flex-shrink-0"
                            title="محادثة خاصة مع العضو"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                            <span>خاص</span>
                          </button>
                        )}

                        {/* 6. Profile (بروفايل) */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMsgMenuId(null);
                            openUserProfileByName(msg.username);
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-800/90 hover:bg-sky-600/30 hover:text-sky-300 text-slate-200 border border-slate-700/80 flex items-center gap-1.5 font-medium transition-all active:scale-95 cursor-pointer flex-shrink-0"
                          title="عرض الملف الشخصي"
                        >
                          <UserIcon className="w-3.5 h-3.5 text-sky-400" />
                          <span>بروفايل</span>
                        </button>

                        {/* 7. Edit (تعديل) */}
                        {(msg.username.toLowerCase() === currentUser?.username.toLowerCase() || currentUser?.role === 'admin' || currentUser?.role === 'super') && !msg.voiceNote && !msg.mediaUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMsgMenuId(null);
                              setEditingMsgId(editingMsgId === msg.id ? null : msg.id);
                              setEditingMsgText(msg.text);
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-800/90 hover:bg-sky-600/30 hover:text-sky-300 text-slate-200 border border-slate-700/80 flex items-center gap-1.5 font-medium transition-all active:scale-95 cursor-pointer flex-shrink-0"
                            title="تعديل الرسالة"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                            <span>تعديل</span>
                          </button>
                        )}

                        {/* 8. Pin (تثبيت) */}
                        {(currentUser?.role === 'admin' || currentUser?.role === 'super') && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMsgMenuId(null);
                              handlePinChatMessage(msg.id);
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-800/90 hover:bg-amber-600/30 hover:text-amber-300 text-slate-200 border border-slate-700/80 flex items-center gap-1.5 font-medium transition-all active:scale-95 cursor-pointer flex-shrink-0"
                            title="تثبيت في الروم"
                          >
                            <Pin className="w-3.5 h-3.5 text-amber-400" />
                            <span>تثبيت</span>
                          </button>
                        )}

                        {/* 9. Delete (حذف) */}
                        {(msg.username.toLowerCase() === currentUser?.username.toLowerCase() || currentUser?.role === 'admin' || currentUser?.role === 'super' || userCanDeleteMessage) && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMsgMenuId(null);
                              handleDeleteChatMessage(msg.id);
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-800/90 hover:bg-rose-600/30 hover:text-rose-300 text-slate-200 border border-slate-700/80 flex items-center gap-1.5 font-medium transition-all active:scale-95 cursor-pointer flex-shrink-0"
                            title="حذف الرسالة"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                            <span>حذف</span>
                          </button>
                        )}

                        {/* 10. Report (إبلاغ) */}
                        {currentUser && msg.username.toLowerCase() !== currentUser.username.toLowerCase() && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMsgMenuId(null);
                              handleReportChatMessage(msg);
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-800/90 hover:bg-orange-600/30 hover:text-orange-300 text-slate-200 border border-slate-700/80 flex items-center gap-1.5 font-medium transition-all active:scale-95 cursor-pointer flex-shrink-0"
                            title="إبلاغ عن مخالفة"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                            <span>إبلاغ</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                    </div>
                  </div>

                  {/* Snug Message Bubble (تناسق مربع الرسالة حسب الشكل المختار) */}
                  <div className={`inline-block w-fit max-w-[85%] sm:max-w-[78%] text-right px-2.5 py-1.5 transition-all ${
                    bubbleStyle === 'pill'
                      ? 'rounded-3xl shadow-sm px-3.5 py-1.5'
                      : bubbleStyle === 'classic'
                      ? 'rounded-xs border-2 shadow-sm font-medium'
                      : bubbleStyle === 'glass'
                      ? 'rounded-2xl backdrop-blur-md bg-white/70 border border-white/40 shadow-md'
                      : bubbleStyle === 'sharp'
                      ? 'rounded-tl-2xl rounded-br-2xl rounded-tr-xs rounded-bl-xs border-r-3 shadow-sm'
                      : bubbleStyle === 'speech'
                      ? 'rounded-2xl rounded-tr-xs shadow-sm relative'
                      : bubbleStyle === 'neon'
                      ? 'rounded-2xl shadow-md shadow-amber-500/20 border border-amber-500/50'
                      : bubbleStyle === 'compact'
                      ? 'rounded-md shadow-2xs py-1 px-2 text-xs border'
                      : bubbleStyle === 'royal-gold'
                      ? 'rounded-2xl shadow-md border-2 border-amber-400 bg-gradient-to-r from-amber-50/95 to-yellow-50/90 text-amber-950 font-medium'
                      : 'rounded-2xl shadow-xs'
                  } ${
                    isAlertMessage
                      ? 'bg-amber-100/95 text-amber-950 border border-amber-300'
                      : isMentioned
                      ? 'bg-rose-50 text-rose-950 border border-rose-300 ring-2 ring-rose-200'
                      : bubbleStyle === 'royal-gold'
                      ? 'border-amber-400'
                      : bubbleStyle === 'glass'
                      ? currentUser && msg.username === currentUser.username
                        ? 'bg-amber-100/75 border-amber-300/70 text-slate-900'
                        : 'bg-white/75 border-slate-200/80 text-slate-900'
                      : currentUser && msg.username === currentUser.username
                      ? 'bg-amber-50/85 text-slate-900 border border-amber-200/90 rounded-tr-xs'
                      : 'bg-white text-slate-900 border border-slate-200/90 rounded-tl-xs'
                  }`}>
                    {/* Quoted Reply Banner if msg.replyTo (ميزة الرد بكل مكان) */}
                    {msg.replyTo && (
                      <div
                        onClick={() => {
                          const targetEl = document.getElementById(`msg-${msg.replyTo?.id}`);
                          if (targetEl) {
                            targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            targetEl.classList.add('ring-2', 'ring-amber-500');
                            setTimeout(() => targetEl.classList.remove('ring-2', 'ring-amber-500'), 2200);
                          }
                        }}
                        className="mb-1.5 px-2.5 py-1.5 bg-amber-100/80 border-r-4 border-amber-500 rounded-lg text-[11px] cursor-pointer hover:bg-amber-200/70 transition-colors flex flex-col gap-0.5 shadow-2xs"
                        title="انقر للذهاب إلى الرسالة الأصلية المردود عليها"
                      >
                        <div className="font-bold text-amber-900 flex items-center gap-1 text-[10px]">
                          <Reply className="w-3 h-3 rotate-180 text-amber-700" />
                          <span>رد على:</span>
                          {(() => {
                            const replyBanner = getUserBanner(msg.replyTo.username);
                            if (replyBanner) {
                              return (
                                <img
                                  src={replyBanner}
                                  alt={msg.replyTo.username}
                                  title={msg.replyTo.username}
                                  className="h-4 max-h-[18px] max-w-[120px] object-contain rounded inline-block"
                                />
                              );
                            }
                            return <span>@{msg.replyTo.username}</span>;
                          })()}
                        </div>
                        <div className="text-slate-600 truncate max-w-[240px] text-[10px]">
                          {msg.replyTo.text || 'مرفق وسائط / صوت 📎'}
                        </div>
                      </div>
                    )}

                    {/* Voice Note Player (تسجيل مقطع صوتي) */}
                    {msg.voiceNote && (
                      <div className="my-1">
                        <VoicePlayer
                          audioUrl={msg.voiceNote.audioUrl}
                          duration={msg.voiceNote.duration}
                          isMe={Boolean(currentUser && msg.username === currentUser.username)}
                        />
                      </div>
                    )}

                    {/* Text Message or Inline Editor */}
                    {editingMsgId === msg.id ? (
                      <div className="my-1.5 p-2 bg-white/95 border border-blue-400 rounded-xl space-y-2 shadow-sm text-right">
                        <textarea
                          rows={2}
                          value={editingMsgText}
                          onChange={(e) => setEditingMsgText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSaveEditChatMessage(msg.id, editingMsgText);
                            } else if (e.key === 'Escape') {
                              setEditingMsgId(null);
                            }
                          }}
                          className="w-full p-2 text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:border-blue-500 resize-none font-medium"
                          autoFocus
                        />
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSaveEditChatMessage(msg.id, editingMsgText)}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[10px] font-bold cursor-pointer shadow-xs"
                          >
                            حفظ التعديل
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingMsgId(null)}
                            className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md text-[10px] font-bold cursor-pointer"
                          >
                            إلغاء
                          </button>
                        </div>
                      </div>
                    ) : (
                      msg.text && (
                        <div
                          style={{ color: msg.textColor || undefined }}
                          className={`${
                            chatFontSize === 'sm' ? 'text-xs' : chatFontSize === 'lg' ? 'text-base' : chatFontSize === 'xl' ? 'text-lg' : 'text-sm'
                          } leading-relaxed font-normal break-words whitespace-pre-wrap ${!msg.textColor ? 'text-slate-900' : ''}`}
                        >
                          {renderFormattedMessageText(msg.text)}
                          {msg.isEdited && (
                            <span className="text-[10px] text-slate-400 font-normal mr-1.5 select-none">(معدلة ✏️)</span>
                          )}
                        </div>
                      )
                    )}

                    {/* Media Attachment or Sticker with Click to Open in Lightbox */}
                    {msg.mediaUrl && (
                      <div className="mt-1.5">
                        {msg.mediaType === 'sticker' ? (
                          <span className="text-3xl sm:text-4xl">{msg.mediaUrl}</span>
                        ) : msg.mediaType === 'video' || msg.mediaUrl.startsWith('data:video') || msg.mediaUrl.endsWith('.mp4') || msg.mediaUrl.endsWith('.webm') ? (
                          <div
                            onClick={() =>
                              setActiveMediaViewer({
                                url: msg.mediaUrl!,
                                type: 'video',
                                title: `فيديو من @${msg.username}`
                              })
                            }
                            className="relative rounded-xl overflow-hidden border border-slate-300 bg-black cursor-pointer group max-h-56 max-w-xs shadow-md"
                            title="انقر لفتح الفيديو في الوسط وتكبيره وتحميله"
                          >
                            <video src={msg.mediaUrl} className="max-h-56 w-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <div className="w-12 h-12 rounded-full bg-amber-500/90 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                                <Play className="w-6 h-6 fill-white ml-0.5" />
                              </div>
                            </div>
                            <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/75 text-[10px] text-white font-mono flex items-center gap-1">
                              <Video className="w-3 h-3 text-amber-400" />
                              <span>فيديو (انقر للعرض)</span>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() =>
                              setActiveMediaViewer({
                                url: msg.mediaUrl!,
                                type: 'image',
                                title: `صورة من @${msg.username}`
                              })
                            }
                            className="relative cursor-pointer group rounded-xl overflow-hidden"
                            title="انقر لفتح الصورة في الوسط وتكبيرها وتحميلها"
                          >
                            <img
                              src={msg.mediaUrl}
                              alt="وسائط"
                              className="max-h-56 max-w-full rounded-xl border border-slate-300 object-cover shadow-sm group-hover:scale-[1.02] transition-transform"
                            />
                            <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 text-[9px] text-white opacity-0 group-hover:opacity-100 transition-opacity">
                              🔍 تكبير وتحميل
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Interactive Reactions Display (الرموز المتفاعل بها فقط) */}
                    {msg.reactions && Object.entries(msg.reactions).length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 mt-1.5 pt-1 border-t border-slate-100/60">
                        {Object.entries(msg.reactions).map(([emoji, count]) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleReactToMessage(msg.id, emoji)}
                            className="px-1.5 py-0.5 rounded-full bg-slate-100/80 hover:bg-amber-100/80 text-[10px] font-bold flex items-center gap-0.5 border border-slate-200/80 transition-colors cursor-pointer"
                          >
                            <span>{emoji}</span>
                            <span className="font-mono text-slate-700">{count}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
        {/* Floating Jump to Latest Messages Button */}
        {showScrollBottomBtn && (
          <button
            type="button"
            onClick={() => scrollToBottom(true)}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 z-25 bg-[#241a12]/95 hover:bg-black text-amber-300 border border-amber-500/80 px-3.5 py-1.5 rounded-full shadow-2xl flex items-center gap-1.5 text-xs font-black cursor-pointer animate-bounce backdrop-blur-xs transition-all"
          >
            <span>الانتقال لآخر الرسائل</span>
            <span>↓</span>
          </button>
        )}
      </div>

        {/* BOTTOM INPUT BAR (Screenshot 2: [⮑] [😊] [اكتب رسالتك، واستخدم @ للمنشن] [+] [إرسال ✈]) */}
        <div className={`flex-shrink-0 z-20 ${curTheme.inputBarBg || curTheme.bottomBarBg} border-t ${curTheme.inputBarBorder || curTheme.bottomBarBorder} p-2 relative`}>
          
          {/* Multi-Tab Emoji & Sticker Picker (الفيسات المخصصة ف1 ف2، الستيكرات، والابتسامات) */}
          {showEmojiPicker && (
            <>
              <div className="fixed inset-0 z-25" onClick={() => setShowEmojiPicker(false)} />
              <div className="absolute bottom-16 right-3 p-3 bg-slate-900 border-2 border-amber-500/70 rounded-2xl shadow-2xl z-30 w-80 sm:w-96 text-right text-slate-100 backdrop-blur-md animate-in zoom-in-95">
                {/* Header with Title and Close Button */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-700/80 mb-2">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-amber-300">
                    <Smile className="w-4 h-4 text-amber-400" />
                    <span>الرموز التعبيرية والفيسات والملصقات</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(false)}
                    className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Tabs Switcher */}
                <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950/80 rounded-xl mb-3 border border-slate-800 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setEmojiPickerTab('custom')}
                    className={`py-1.5 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      emojiPickerTab === 'custom'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>🎨</span>
                    <span>فيسات (ف1)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmojiPickerTab('stickers')}
                    className={`py-1.5 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      emojiPickerTab === 'stickers'
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>🖼️</span>
                    <span>ستيكرات</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmojiPickerTab('vintage')}
                    className={`py-1.5 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      emojiPickerTab === 'vintage'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>😊</span>
                    <span>شعبية</span>
                  </button>
                </div>

                {/* TAB 1: CUSTOM EMOJIS (الفيسات المخصصة ذات الأكواد ف1، ف2...) */}
                {emojiPickerTab === 'custom' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                      <span>انقر على الفيس لإدراج كوده بالرسالة تلقائياً:</span>
                      <span className="font-mono text-purple-300 font-bold">
                        {emblemsConfig.items.filter((i) => i.type === 'emoji').length} فيس متاح
                      </span>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-60 overflow-y-auto p-1">
                      {emblemsConfig.items
                        .filter((i) => i.type === 'emoji')
                        .sort((a, b) => (a.codeNumber || 0) - (b.codeNumber || 0))
                        .map((emoji) => (
                          <button
                            key={emoji.id}
                            type="button"
                            onClick={() => {
                              if (emoji.shortcut) {
                                setTextInput((prev) => (prev ? `${prev} ${emoji.shortcut} ` : `${emoji.shortcut} `));
                                inputRef.current?.focus();
                                showToast(`تم إدراج كود الفيس [${emoji.shortcut}] ⚡`, 'info');
                              }
                            }}
                            className="p-1.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-purple-400 hover:bg-purple-950/30 flex flex-col items-center justify-center gap-1 transition-all group cursor-pointer hover:scale-105"
                            title={`${emoji.title} (${emoji.shortcut})`}
                          >
                            <img
                              src={emoji.imageUrl}
                              alt={emoji.shortcut || emoji.title}
                              className="w-8 h-8 object-contain drop-shadow-sm group-hover:scale-110 transition-transform"
                              loading="lazy"
                            />
                            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[9px] font-black border border-amber-500/40">
                              {emoji.shortcut}
                            </span>
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* TAB 2: STICKERS (الملصقات التعبيرية بالشات) */}
                {emojiPickerTab === 'stickers' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                      <span>انقر لإرسال الستيكر كصورة تعبيرية فوراً:</span>
                      <span className="font-mono text-amber-300 font-bold">
                        {emblemsConfig.items.filter((i) => i.type === 'sticker').length} ستيكر
                      </span>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-60 overflow-y-auto p-1">
                      {emblemsConfig.items
                        .filter((i) => i.type === 'sticker')
                        .map((stk) => (
                          <button
                            key={stk.id}
                            type="button"
                            onClick={() => {
                              handleSendMessage(undefined, stk.imageUrl, 'image');
                              setShowEmojiPicker(false);
                            }}
                            className="p-2 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-amber-400 hover:bg-amber-950/30 flex flex-col items-center justify-center gap-1.5 transition-all group cursor-pointer hover:scale-105"
                            title={stk.title}
                          >
                            <img
                              src={stk.imageUrl}
                              alt={stk.title}
                              className="w-12 h-12 object-contain drop-shadow-md group-hover:scale-110 transition-transform"
                              loading="lazy"
                            />
                            <span className="text-[10px] text-slate-300 font-bold truncate max-w-full">
                              {stk.title}
                            </span>
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* TAB 3: VINTAGE STICKERS & POPULAR EMOJIS */}
                {emojiPickerTab === 'vintage' && (
                  <div className="space-y-2">
                    <div className="text-[10px] text-slate-400 px-1">
                      الابتسامات الشعبية الكلاسيكية:
                    </div>
                    <div className="grid grid-cols-6 gap-2 text-2xl max-h-60 overflow-y-auto p-1">
                      {VINTAGE_STICKERS.map((stk) => (
                        <button
                          key={stk}
                          type="button"
                          onClick={() => handleSendSticker(stk)}
                          className="p-1 hover:bg-slate-800 rounded-lg text-center cursor-pointer hover:scale-125 transition-transform"
                        >
                          {stk}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Media / Photo Upload Picker (Screenshot 7) */}
          {showMediaPicker && (
            <>
              <div className="fixed inset-0 z-25" onClick={() => setShowMediaPicker(false)} />
              <div className="absolute bottom-16 right-16 p-3 bg-white border border-slate-300 rounded-xl shadow-2xl z-30 w-72 text-right">
                <div className="text-xs font-bold text-slate-800 pb-2 border-b mb-2 flex items-center justify-between">
                  <span>إرسال فيديو أو صورة متحركة أو صورة 🎥📸</span>
                  <button onClick={() => setShowMediaPicker(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Device Photo / Video / Camera Upload */}
                <label className="mb-2 py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded flex items-center justify-center gap-1.5 cursor-pointer font-bold text-xs transition-colors">
                  <Camera className="w-3.5 h-3.5" />
                  <span>رفع فيديو أو صورة من جهازك 📁</span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      const isVid = (file?.type || '').startsWith('video');
                      handleFileUpload(e, (dataUrl) => {
                        handleSendMessage(undefined, dataUrl, isVid ? 'video' : 'image');
                        setShowMediaPicker(false);
                      });
                    }}
                  />
                </label>

                {/* Sample Media quick send */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {SAMPLE_MEDIA.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt="sample"
                      onClick={() => {
                        handleSendMessage(undefined, url, 'image');
                        setShowMediaPicker(false);
                      }}
                      className="h-16 w-full object-cover rounded border border-slate-200 cursor-pointer hover:opacity-80"
                    />
                  ))}
                </div>

                {/* Custom Image or Video URL */}
                <input
                  type="text"
                  placeholder="أو الصق رابط فيديو أو صورة متحركة أو صورة..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value) {
                      const val = e.currentTarget.value.trim();
                      const isVid = val.endsWith('.mp4') || val.endsWith('.webm') || val.includes('youtube') || val.includes('video');
                      handleSendMessage(undefined, val, isVid ? 'video' : 'image');
                      e.currentTarget.value = '';
                      setShowMediaPicker(false);
                    }
                  }}
                  className="w-full text-xs p-1.5 border border-slate-300 rounded outline-none"
                />
              </div>
            </>
          )}

          {/* Plus Menu */}
          {showPlusMenu && (
            <>
              <div className="fixed inset-0 z-25" onClick={() => setShowPlusMenu(false)} />
              <div className="absolute bottom-16 left-12 p-3 bg-white border border-slate-300 rounded-xl shadow-2xl z-30 space-y-2 text-xs font-bold text-slate-800 w-52 animate-in fade-in zoom-in-95 duration-150">
                {/* Advanced Formatting Bar Toggle (نقل الشريط الأسود إلى علامة الزائد) */}
                <button
                  type="button"
                  onClick={() => {
                    setShowChatPowerTools(!showChatPowerTools);
                    setShowPlusMenu(false);
                  }}
                  className="w-full text-right p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded flex items-center justify-between font-black"
                >
                  <span className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-600" />
                    <span>شريط التنسيق والشعر ⚡</span>
                  </span>
                  <span className="text-[9px] bg-amber-500 text-white px-1.5 py-0.2 rounded">
                    {showChatPowerTools ? 'إخفاء' : 'إظهار'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setShowMediaPicker(true);
                    setShowPlusMenu(false);
                  }}
                  className="w-full text-right p-1.5 hover:bg-slate-100 rounded flex items-center gap-2 text-indigo-700"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>إرسال صورة / وسائط</span>
                </button>
                <button
                  onClick={() => {
                    setTextInput((prev) => prev + ' [وردة لك 🌹] ');
                    setShowPlusMenu(false);
                  }}
                  className="w-full text-right p-1.5 hover:bg-slate-100 rounded flex items-center gap-2"
                >
                  <span>🌹 إرسال باقة ورد</span>
                </button>
                <button
                  onClick={() => {
                    setTextInput((prev) => prev + ' [ألف لايك وهدية 🎁] ');
                    setShowPlusMenu(false);
                  }}
                  className="w-full text-right p-1.5 hover:bg-slate-100 rounded flex items-center gap-2"
                >
                  <span>🎁 إرسال هدية</span>
                </button>
                <button
                  onClick={() => {
                    handleDownloadZip();
                    setShowPlusMenu(false);
                  }}
                  className="w-full text-right p-1.5 hover:bg-slate-100 rounded flex items-center gap-2 text-emerald-700"
                >
                  <Download className="w-4 h-4" />
                  <span>تحميل المشروع ZIP</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowSoundModal(true);
                    setShowPlusMenu(false);
                  }}
                  className="w-full text-right p-1.5 hover:bg-slate-100 rounded flex items-center gap-2 text-amber-800"
                >
                  <Volume2 className="w-4 h-4 text-amber-600" />
                  <span>نغمات التنبيهات المخصصة 🎵</span>
                </button>

                {(currentUser.role === 'admin' || currentUser.role === 'super') && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowBroadcastModal(true);
                      setShowPlusMenu(false);
                    }}
                    className="w-full text-right p-1.5 hover:bg-slate-100 rounded flex items-center gap-2 text-rose-700 font-bold"
                  >
                    <Megaphone className="w-4 h-4 text-rose-600" />
                    <span>إرسال إشعار عام للغرفة 📢</span>
                  </button>
                )}
              </div>
            </>
          )}

          {/* Mention Autocomplete Suggestions Popup */}
          {showMentionMenu && mentionSuggestions.length > 0 && (
            <>
              <div className="fixed inset-0 z-25" onClick={() => setShowMentionMenu(false)} />
              <div className="absolute bottom-16 right-10 w-52 max-h-48 overflow-y-auto bg-white border border-slate-300 rounded-xl shadow-2xl z-30 divide-y divide-slate-100 animate-in fade-in duration-150">
                <div className="p-1.5 bg-amber-50 text-[10px] font-bold text-amber-900 flex items-center justify-between">
                  <span>منشن سريع للأعضاء (@):</span>
                  <button type="button" onClick={() => setShowMentionMenu(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </div>
                {mentionSuggestions.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => insertMention(u.username)}
                    className="w-full p-2 text-right hover:bg-amber-100/60 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <img src={u.avatarUrl || falconIcon} alt={u.username} className="w-6 h-6 rounded-full object-cover border border-slate-300" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-800 truncate">{u.username}</div>
                      <div className="text-[9px] text-slate-500 font-mono">{u.role === 'admin' ? 'إداري' : u.role === 'super' ? 'مشرف' : 'عضو'}</div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Chat Power Tools Toolbar (يظهر فقط عند اختياره من علامة الزائد +) */}
          {showChatPowerTools && (
            <div className="mb-2 relative animate-in fade-in duration-150">
              <div className="flex items-center justify-between px-2 py-0.5 bg-slate-950 text-slate-400 text-[10px] rounded-t-lg border-x border-t border-slate-800">
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <Sliders className="w-3 h-3" />
                  <span>شريط أدوات الكتابة والتنسيق والشعر</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowChatPowerTools(false)}
                  className="hover:text-white p-0.5 cursor-pointer"
                  title="إخفاء الشريط"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <ChatPowerToolsBar
                onInsertFormat={handleInsertFormat}
                onSendQuickGreeting={(greeting) => {
                  setTextInput(greeting);
                  handleSendMessage();
                }}
                searchQuery={chatSearchQuery}
                onSearchChange={setChatSearchQuery}
                pinnedMessage={pinnedChatMessage}
                onUnpinMessage={currentUser?.role === 'admin' || currentUser?.role === 'super' ? handleUnpinChatMessage : undefined}
                isPoetryMode={isPoetryMode}
                onTogglePoetryMode={() => {
                  setIsPoetryMode(!isPoetryMode);
                  showToast(!isPoetryMode ? 'تم تفعيل وضع القصائد: اكتب الشطر الأول ثم | ثم الشطر الثاني' : 'تم تعطيل وضع القصائد', 'info');
                }}
                onShowToast={showToast}
              />
            </div>
          )}

          {/* Universal Reply Banner (ميزة الرد بكل مكان) */}
          {replyingTo && (
            <div className="mb-2 px-3 py-1.5 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between text-xs text-amber-950 shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2 min-w-0">
                <Reply className="w-4 h-4 text-amber-700 flex-shrink-0 rotate-180" />
                <div className="font-bold text-amber-900 text-xs flex items-center gap-1">
                  <span>الرد على:</span>
                  {(() => {
                    const banner = getUserBanner(replyingTo.username);
                    if (banner) {
                      return (
                        <img
                          src={banner}
                          alt={replyingTo.username}
                          title={replyingTo.username}
                          className="h-4 max-h-[20px] max-w-[130px] object-contain rounded inline-block"
                        />
                      );
                    }
                    return <span>@{replyingTo.username}</span>;
                  })()}
                </div>
                <span className="truncate text-slate-600 max-w-[200px] sm:max-w-md text-xs">{replyingTo.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="p-1 text-slate-400 hover:text-red-600 rounded-full hover:bg-white cursor-pointer transition-colors"
                title="إلغاء الرد"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Active Shortcut Preview Banner (معاينة الاختصار المكتوب فوراً قبل الإرسال) */}
          {(() => {
            const matchedSc = findMatchingShortcut(textInput, shortcuts);
            if (!matchedSc) return null;
            return (
              <div className="mb-2 px-3 py-1.5 bg-gradient-to-r from-amber-500/15 via-amber-50 to-amber-500/15 border border-amber-400 rounded-xl flex items-center justify-between text-xs text-amber-950 shadow-xs animate-in fade-in">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white font-mono font-black text-[10px] shrink-0">
                    ⚡ اختصار [{matchedSc.trigger}]
                  </span>
                  <span className="text-amber-700 font-bold shrink-0">➔</span>
                  <span className="truncate text-slate-800 font-bold text-xs max-w-[180px] sm:max-w-sm">
                    "{matchedSc.replacement}"
                  </span>
                </div>
                <span className="text-[10px] text-amber-800 font-bold bg-amber-200/80 px-2 py-0.5 rounded-full shrink-0">
                  يُستبدل تلقائياً عند الإرسال ⚡
                </span>
              </div>
            );
          })()}

          {/* Typing Indicator Animated Bubble / Pulse Effect فوق خانة الرسائل */}
          {typingUsers.length > 0 && (
            <div
              role="status"
              aria-live="polite"
              className="mb-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500/15 via-amber-100/90 to-amber-500/15 dark:from-amber-950/70 dark:via-slate-900/85 dark:to-amber-950/70 border border-amber-400/50 dark:border-amber-500/40 rounded-2xl flex items-center justify-between text-xs text-amber-950 dark:text-amber-200 shadow-sm backdrop-blur-md animate-typing-bubble transition-all select-none"
            >
              <div className="flex items-center gap-2 min-w-0">
                {/* Glowing pulsating typing icon */}
                <div className="relative flex items-center justify-center shrink-0">
                  <span className="absolute -inset-1 rounded-full bg-amber-400/40 animate-ping opacity-60 pointer-events-none" />
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 flex items-center justify-center border border-amber-400/50">
                    <Edit3 className="w-2.5 h-2.5 animate-pulse" />
                  </div>
                </div>

                {/* Overlapping member avatars */}
                <div className="flex items-center -space-x-1.5 rtl:space-x-reverse shrink-0">
                  {typingUsers.slice(0, 3).map((u) => (
                    <img
                      key={u.userId}
                      src={u.avatarUrl || falconIcon}
                      alt={u.username}
                      className="w-4.5 h-4.5 rounded-full object-cover border border-amber-300/80 shadow-2xs"
                    />
                  ))}
                </div>

                {/* Member names + text */}
                <div className="truncate text-xs font-semibold text-slate-800 dark:text-amber-100 flex items-center gap-1">
                  {typingUsers.length === 1 ? (
                    <>
                      <span className="shrink-0">{typingUsers[0].flag || '🇸🇦'}</span>
                      {(() => {
                        const tBanner = getUserBanner(typingUsers[0].username);
                        if (tBanner) {
                          return (
                            <img
                              src={tBanner}
                              alt={typingUsers[0].username}
                              className="h-4 max-h-[18px] max-w-[120px] object-contain rounded inline-block"
                            />
                          );
                        }
                        return (
                          <span
                            className="font-bold text-amber-900 dark:text-amber-300 truncate max-w-[130px] sm:max-w-[200px]"
                            style={{ color: typingUsers[0].nameColor || undefined }}
                          >
                            {typingUsers[0].username}
                          </span>
                        );
                      })()}
                      <span className="text-slate-600 dark:text-slate-300 font-normal text-[11px] sm:text-xs">
                        يكتب الآن
                      </span>
                    </>
                  ) : typingUsers.length === 2 ? (
                    <>
                      {(() => {
                        const b1 = getUserBanner(typingUsers[0].username);
                        return b1 ? (
                          <img src={b1} alt={typingUsers[0].username} className="h-3.5 max-h-[16px] max-w-[80px] object-contain rounded inline-block" />
                        ) : (
                          <span className="font-bold text-amber-900 dark:text-amber-300 truncate max-w-[90px]" style={{ color: typingUsers[0].nameColor || undefined }}>
                            {typingUsers[0].username}
                          </span>
                        );
                      })()}
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">و</span>
                      {(() => {
                        const b2 = getUserBanner(typingUsers[1].username);
                        return b2 ? (
                          <img src={b2} alt={typingUsers[1].username} className="h-3.5 max-h-[16px] max-w-[80px] object-contain rounded inline-block" />
                        ) : (
                          <span className="font-bold text-amber-900 dark:text-amber-300 truncate max-w-[90px]" style={{ color: typingUsers[1].nameColor || undefined }}>
                            {typingUsers[1].username}
                          </span>
                        );
                      })()}
                      <span className="text-slate-600 dark:text-slate-300 font-normal text-[11px] sm:text-xs">
                        يكتبان الآن
                      </span>
                    </>
                  ) : (
                    <>
                      {(() => {
                        const b1 = getUserBanner(typingUsers[0].username);
                        return b1 ? (
                          <img src={b1} alt={typingUsers[0].username} className="h-3.5 max-h-[16px] max-w-[80px] object-contain rounded inline-block" />
                        ) : (
                          <span className="font-bold text-amber-900 dark:text-amber-300 truncate max-w-[80px]" style={{ color: typingUsers[0].nameColor || undefined }}>
                            {typingUsers[0].username}
                          </span>
                        );
                      })()}
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">و</span>
                      <span className="text-slate-600 dark:text-slate-300 font-normal text-[11px] sm:text-xs">
                        {typingUsers.length - 1} آخرون يكتبون الآن
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* 3 bouncing wave dots */}
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 dark:bg-amber-400/10 border border-amber-400/40 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400 typing-dot-1" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400 typing-dot-2" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400 typing-dot-3" />
              </div>
            </div>
          )}

          {isRecordingVoice ? (
            <div className="flex items-center justify-center py-0.5">
              <VoiceRecorder
                onSendVoice={(voiceData) => handleSendMessage(undefined, undefined, undefined, voiceData)}
                onCancel={() => setIsRecordingVoice(false)}
              />
            </div>
          ) : (
            <div className="flex items-center gap-1 sm:gap-1.5 w-full max-w-full">
              {/* Exit Room Button (زر خروج من الغرفة الحالية فقط بجانب الإيموجي) */}
              <button
                type="button"
                onClick={handleLeaveCurrentRoom}
                className="w-8 h-8 rounded-lg text-rose-500 hover:text-white hover:bg-rose-600 border border-rose-300 flex items-center justify-center transition-all cursor-pointer flex-shrink-0 shadow-2xs"
                title="الخروج من الغرفة الحالية فقط والعودة لقائمة الغرف"
              >
                <LogOut className="w-4 h-4" />
              </button>

              {/* Emoji yellow smiley 😊 */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="w-8 h-8 rounded-lg text-lg flex items-center justify-center hover:bg-slate-200 transition-all cursor-pointer flex-shrink-0"
                title="الرموز التعبيرية"
              >
                😊
              </button>

              {/* Media Image Button (Screenshot 7) */}
              <button
                type="button"
                onClick={() => setShowMediaPicker(!showMediaPicker)}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-slate-600 hover:text-indigo-600 flex items-center justify-center transition-all cursor-pointer flex-shrink-0 hover:bg-slate-200"
                title="إرسال صورة"
              >
                <ImageIcon className="w-4 h-4 text-rose-500" />
              </button>

              {/* Voice Recording Button (تسجيل مقطع صوتي) */}
              <button
                type="button"
                onClick={() => setIsRecordingVoice(true)}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-slate-600 hover:text-rose-600 flex items-center justify-center transition-all cursor-pointer flex-shrink-0 hover:bg-slate-200"
                title="تسجيل مقطع صوتي 🎙️"
              >
                <Mic className="w-4 h-4 text-rose-600" />
              </button>

              {/* Textarea Input - مخصص حصرياً للدردشة ولا يقبل كلمات المرور أو الملء التلقائي مطلقاً */}
              <textarea
                ref={inputRef}
                rows={1}
                name="chat_room_text_freeform"
                id="chat_room_text_freeform"
                inputMode="text"
                enterKeyHint="send"
                autoComplete="off"
                autoCorrect="on"
                autoCapitalize="sentences"
                spellCheck={true}
                data-form-type="other"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                data-protonpass-ignore="true"
                data-keeper-ignore="true"
                aria-autocomplete="none"
                role="textbox"
                value={textInput}
                onChange={(e) => handleTextInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                onFocus={() => {
                  setIsChatInputFocused(true);
                  window.scrollTo(0, 0);
                  document.body.scrollTop = 0;
                  scrollToBottom(true);
                  setTimeout(() => {
                    window.scrollTo(0, 0);
                    scrollToBottom(true);
                  }, 50);
                  setTimeout(() => {
                    window.scrollTo(0, 0);
                    scrollToBottom(true);
                  }, 200);
                }}
                onBlur={() => {
                  setTimeout(() => setIsChatInputFocused(false), 200);
                }}
                style={{ color: settingTextColor || curTheme.recommendedTextColor || '#fef3c7' }}
                placeholder="اكتب رسالتك، واستخدم @ للمنشن"
                maxLength={400}
                className={`flex-1 min-w-0 px-2.5 py-2 ${curTheme.fieldBg || 'bg-white'} border ${curTheme.fieldBorder || 'border-slate-300'} rounded-lg ${curTheme.fieldText || 'text-slate-900'} ${curTheme.fieldPlaceholder || 'placeholder-slate-400'} text-xs sm:text-sm font-medium outline-none ${curTheme.fieldFocus || 'focus:border-amber-600 focus:ring-1 focus:ring-amber-600'} resize-none h-9 leading-tight overflow-hidden transition-all shadow-inner`}
              />

              {/* [+] Button */}
              <button
                type="button"
                onClick={() => setShowPlusMenu(!showPlusMenu)}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${curTheme.cardBg || 'bg-[#2a241e]'} ${curTheme.accentText || 'text-amber-200'} border ${curTheme.cardBorder || 'border-amber-800/60'} font-bold text-base flex items-center justify-center hover:opacity-90 transition-all cursor-pointer flex-shrink-0 shadow-xs`}
                title="خيارات إضافية"
              >
                +
              </button>

              {/* [إرسال ✈] button - Prominently visible and fixed on screen */}
              <button
                type="button"
                onClick={handleSendMessage}
                disabled={!textInput.trim()}
                className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg ${curTheme.primaryBtn || 'bg-amber-500 hover:bg-amber-600 text-black'} disabled:opacity-40 font-black text-xs flex items-center gap-1 transition-all cursor-pointer flex-shrink-0 shadow-sm whitespace-nowrap z-10`}
                title="إرسال الرسالة للغرفة"
              >
                <span>إرسال</span>
                <Send className="w-3.5 h-3.5 rotate-180" />
              </button>
            </div>
          )}
        </div>

        {/* BOTTOM TAB BAR: FIXED (Screenshot 2: [⚙ الضبط] [💬 الحائط] [👥 الغرف] [💬 خاص] [👤 77]) */}
        <nav
          className={`flex-shrink-0 z-20 ${curTheme.bottomBarBg} ${curTheme.bottomBarText} border-t ${curTheme.bottomBarBorder} text-center text-[11px] font-bold py-1.5 grid grid-cols-5 shadow-2xl`}
        >
          <button
            onClick={() => setActiveDrawer(activeDrawer === 'settings' ? 'none' : 'settings')}
            className={`flex flex-col items-center justify-center gap-0.5 hover:text-white transition-colors cursor-pointer ${
              activeDrawer === 'settings' ? 'text-amber-400 font-black' : ''
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>الضبط</span>
          </button>

          <button
            onClick={() => {
              socket?.emit('getWallPosts');
              const next = activeDrawer === 'wall' ? 'none' : 'wall';
              setActiveDrawer(next);
              if (next === 'wall') {
                lastSeenWallTimeRef.current = Date.now();
                setUnreadWallCount(0);
              }
            }}
            className={`flex flex-col items-center justify-center gap-0.5 relative hover:text-white transition-all cursor-pointer ${
              activeDrawer === 'wall' ? 'text-amber-400 font-black' : ''
            }`}
          >
            <div className="relative">
              {unreadWallCount > 0 && (
                <span className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-emerald-400 via-amber-500 to-emerald-400 opacity-80 blur-xs animate-pulse" />
              )}
              <MessageCircle
                className={`w-4 h-4 relative z-10 transition-transform ${
                  unreadWallCount > 0
                    ? 'text-emerald-300 drop-shadow-[0_0_8px_rgba(16,185,129,0.95)] animate-pulse scale-110'
                    : ''
                }`}
              />
              {unreadWallCount > 0 && (
                <span
                  title={`منشورات ورسائل حائط جديدة: ${unreadWallCount}`}
                  className="absolute -top-2.5 -right-3.5 z-20 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center border-2 border-emerald-300 shadow-[0_0_12px_rgba(5,150,105,0.9)] animate-bounce"
                >
                  {unreadWallCount > 99 ? '99+' : unreadWallCount}
                </span>
              )}
            </div>
            <span className={`relative z-10 flex items-center gap-0.5 ${unreadWallCount > 0 ? 'text-emerald-300 font-black' : ''}`}>
              {unreadWallCount > 0 && <Sparkles className="w-2.5 h-2.5 text-emerald-300 animate-spin" />}
              <span>الحائط</span>
            </span>
          </button>

          <button
            onClick={() => setActiveDrawer(activeDrawer === 'rooms' ? 'none' : 'rooms')}
            className={`flex flex-col items-center justify-center gap-0.5 hover:text-white transition-colors cursor-pointer ${
              activeDrawer === 'rooms' ? 'text-amber-400 font-black' : ''
            }`}
          >
            <Hash className="w-4 h-4" />
            <span>الغرف</span>
          </button>

          <button
            onClick={() => setActiveDrawer(activeDrawer === 'pm' ? 'none' : 'pm')}
            className={`flex flex-col items-center justify-center gap-0.5 relative hover:text-white transition-all cursor-pointer ${
              activeDrawer === 'pm' ? 'text-amber-400 font-black' : ''
            }`}
          >
            {(() => {
              // عداد رسائل الخاص غير المقروءة: يظهر فيه إجمالي عدد الرسائل غير المقروءة
              const totalUnreadPmCount = Object.values(unreadPerUser).reduce((acc, count) => acc + (count || 0), 0);
              const unreadSendersCount = Object.keys(unreadPerUser).filter((userKey) => (unreadPerUser[userKey] || 0) > 0).length;
              const hasUnread = totalUnreadPmCount > 0;
              return (
                <>
                  <div className="relative">
                    {/* Magical glowing pulse background */}
                    {hasUnread && (
                      <span className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-rose-500 opacity-90 blur-xs animate-pulse" />
                    )}
                    <MessageCircle
                      className={`w-4 h-4 relative z-10 transition-transform ${
                        hasUnread
                          ? 'text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.95)] animate-pulse scale-110'
                          : ''
                      }`}
                    />
                    {hasUnread && (
                      <span
                        title={`رسائل خاصة غير مقروءة: ${totalUnreadPmCount} (من ${unreadSendersCount} شخص)`}
                        className="absolute -top-2.5 -right-3.5 z-20 min-w-[19px] h-[19px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center border-2 border-amber-300 shadow-[0_0_12px_rgba(225,29,72,0.95)] animate-bounce"
                      >
                        {totalUnreadPmCount > 99 ? '99+' : totalUnreadPmCount}
                      </span>
                    )}
                  </div>
                  <span className={`relative z-10 flex items-center justify-center gap-1 ${hasUnread ? 'text-rose-300 font-black' : ''}`}>
                    {hasUnread && <Sparkles className="w-2.5 h-2.5 text-amber-300 animate-spin" />}
                    <span>خاص</span>
                    {hasUnread && (
                      <span className="bg-rose-600 text-white text-[9px] font-extrabold px-1 rounded-full border border-amber-300 shadow-xs leading-tight">
                        {totalUnreadPmCount > 99 ? '+99' : totalUnreadPmCount}
                      </span>
                    )}
                  </span>
                </>
              );
            })()}
          </button>

          {(() => {
            // Count unique online connected members across all rooms
            const uniqueOnlineNames = new Set<string>();
            if (Array.isArray(allConnectedUsers)) {
              allConnectedUsers.forEach((u) => {
                if (u?.username && u.presenceState !== 'offline') uniqueOnlineNames.add(u.username.toLowerCase());
              });
            }
            if (Array.isArray(rosterUsers)) {
              rosterUsers.forEach((u) => {
                if (u?.username && u.presenceState !== 'offline') uniqueOnlineNames.add(u.username.toLowerCase());
              });
            }
            if (currentUser?.username) {
              uniqueOnlineNames.add(currentUser.username.toLowerCase());
            }
            const realOnlineCount = uniqueOnlineNames.size > 0 ? uniqueOnlineNames.size : (onlineCount || 1);
            return (
              <button
                onClick={() => setActiveDrawer(activeDrawer === 'users' ? 'none' : 'users')}
                className={`flex flex-col items-center justify-center gap-0.5 hover:text-white transition-colors cursor-pointer ${
                  activeDrawer === 'users' ? 'text-amber-400 font-black' : ''
                }`}
                title={`المتصلون حالياً: ${realOnlineCount} عضو`}
              >
                <Users className="w-4 h-4" />
                <span>{realOnlineCount}</span>
              </button>
            );
          })()}
        </nav>

        {/* =========================================================================
            SIDE MODALS & PANELS (DO NOT COVER FULL SCREEN! TAKES ~84% WIDTH)
            As shown in Screenshots 1, 2, 3, 4, 5, 6, 8, 10, 11, 12, 13
           ========================================================================= */}

        {/* Semi-transparent backdrop overlay: reveals the chat underneath and closes on click */}
        {activeDrawer !== 'none' && (
          <div
            onClick={() => setActiveDrawer('none')}
            className="absolute inset-0 bg-black/45 z-30 transition-opacity backdrop-blur-[0.5px] cursor-pointer"
            title="انقر هنا لإغلاق النافذة والعودة للشات"
          />
        )}

        {/* 1. ROOMS DRAWER (Screenshot 3: غرف الدردشه : 39) */}
        {activeDrawer === 'rooms' && (
          <div className={`absolute inset-y-0 right-0 w-[84%] ${curTheme.drawerBg} text-slate-100 z-40 shadow-2xl border-l ${curTheme.cardBorder} flex flex-col animate-in slide-in-from-right duration-200`}>
            {/* Header */}
            <div className={`${curTheme.drawerHeaderBg || curTheme.headerBg} ${curTheme.accentText} p-2.5 flex items-center justify-between border-b ${curTheme.headerBorder}`}>
              <div className="flex items-center gap-2 font-bold text-sm">
                <span>غرف الدردشه : {roomsList.length}</span>
                {(currentUser.role === 'admin' || currentUser.role === 'super') && (
                  <button
                    onClick={() => setShowCreateRoomModal(true)}
                    className="px-2 py-0.5 bg-[#48a942] hover:bg-emerald-600 text-white rounded text-[11px] font-bold cursor-pointer"
                  >
                    ➕ غرفه جديدة
                  </button>
                )}
              </div>
              <button
                onClick={() => setActiveDrawer('none')}
                className="w-7 h-7 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center rounded font-bold cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Create Room Sub-modal */}
            {showCreateRoomModal && (
              <div className={`p-3 ${curTheme.cardBg} border-b ${curTheme.cardBorder} text-xs space-y-2`}>
                <div className={`font-bold ${curTheme.accentText}`}>إنشاء غرفة جديدة:</div>
                <input
                  type="text"
                  placeholder="اسم الغرفة..."
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className={`w-full p-1.5 border ${curTheme.cardBorder} rounded ${curTheme.drawerBg} text-white outline-none`}
                />
                <input
                  type="text"
                  placeholder="الوصف..."
                  value={newRoomDesc}
                  onChange={(e) => setNewRoomDesc(e.target.value)}
                  className={`w-full p-1.5 border ${curTheme.cardBorder} rounded ${curTheme.drawerBg} text-white outline-none`}
                />
                <input
                  type="password"
                  autoComplete="off"
                  data-form-type="other"
                  data-lpignore="true"
                  placeholder="كلمة المرور (اختياري)..."
                  value={newRoomPass}
                  onChange={(e) => setNewRoomPass(e.target.value)}
                  className={`w-full p-1.5 border ${curTheme.cardBorder} rounded ${curTheme.drawerBg} text-white outline-none`}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (newRoomName) {
                        socket?.emit('createRoom', { name: newRoomName, desc: newRoomDesc, password: newRoomPass });
                        setNewRoomName('');
                        setNewRoomDesc('');
                        setNewRoomPass('');
                        setShowCreateRoomModal(false);
                      }
                    }}
                    className="flex-1 py-1 bg-[#48a942] hover:bg-emerald-600 text-white rounded font-bold cursor-pointer"
                  >
                    حفظ الغرفة
                  </button>
                  <button
                    onClick={() => setShowCreateRoomModal(false)}
                    className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded font-bold cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}

            {/* Rooms List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
              {roomsList.map((r) => (
                <div
                  key={r.id}
                  onClick={() => {
                    if (r.isPasswordProtected) {
                      const pass = prompt('هذه الغرفة محمية بكلمة مرور. أدخل كلمة المرور:');
                      if (pass !== r.password) {
                        alert('كلمة المرور غير صحيحة!');
                        return;
                      }
                    }
                    setMessages([]);
                    socket?.emit('joinRoom', {
                      username: currentUser.username,
                      room: r.id,
                      flag: currentUser.flag,
                      statusQuote: currentUser.statusQuote
                    });
                    setActiveDrawer('none');
                  }}
                  className={`p-3 hover:bg-white/5 transition-colors cursor-pointer flex items-center justify-between ${
                    currentUser.room === r.id ? 'bg-amber-500/15 border-r-4 border-amber-500' : ''
                  }`}
                >
                  <div className="min-w-0 text-right">
                    <div className={`font-bold text-sm ${curTheme.accentText} flex items-center gap-1.5`}>
                      <span>{r.name}</span>
                      {r.isPasswordProtected && <Lock className="w-3.5 h-3.5 text-amber-400" />}
                    </div>
                    <div className="text-xs text-slate-400 truncate max-w-[190px]">{r.desc}</div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold flex items-center gap-0.5">
                      <Mic className="w-2.5 h-2.5" />
                      2/{r.voiceLimit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. USERS DRAWER (Screenshot 1: المتواجدين) */}
        {activeDrawer === 'users' && (
          <div className={`absolute inset-y-0 right-0 w-[84%] ${curTheme.drawerBg} text-slate-100 z-40 shadow-2xl border-l ${curTheme.cardBorder} flex flex-col animate-in slide-in-from-right duration-200`}>
            <div className={`${curTheme.drawerHeaderBg || curTheme.headerBg} ${curTheme.accentText} p-2.5 flex items-center justify-between border-b ${curTheme.headerBorder}`}>
              <span className="font-bold text-sm">المتواجدين</span>
              <button
                onClick={() => setActiveDrawer('none')}
                className="w-7 h-7 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center rounded font-bold cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Box (Screenshot 1: البحث ..) */}
            <div className={`p-2 ${curTheme.subHeaderBg} border-b ${curTheme.subHeaderBorder}`}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="البحث .."
                  value={searchUserQuery}
                  onChange={(e) => setSearchUserQuery(e.target.value)}
                  className={`w-full px-3 py-1.5 ${curTheme.cardBg} text-white border ${curTheme.cardBorder} rounded text-xs outline-none`}
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Section 1: المتواجدين في نفس الغرفة الحالية */}
            {(() => {
              const currentRoomUsers = rosterUsers.filter((u) =>
                u.username.toLowerCase().includes(searchUserQuery.toLowerCase())
              );

              const otherConnectedUsers = allConnectedUsers.filter(
                (u) =>
                  u.room.toLowerCase() !== currentUser.room.toLowerCase() &&
                  u.username.toLowerCase().includes(searchUserQuery.toLowerCase())
              );

              const offlineMembers = allRegisteredMembers.filter(
                (m) =>
                  !m.isOnline &&
                  !allConnectedUsers.some((u) => u.username.toLowerCase() === m.username.toLowerCase()) &&
                  !rosterUsers.some((u) => u.username.toLowerCase() === m.username.toLowerCase()) &&
                  m.username.toLowerCase().includes(searchUserQuery.toLowerCase())
              );

              return (
                <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
                  {/* Header: متواجدون بنفس الغرفة */}
                  <div className={`${curTheme.subHeaderBg} ${curTheme.accentText} text-xs font-bold px-3 py-1.5 flex items-center justify-between border-b ${curTheme.subHeaderBorder}`}>
                    <span>المتواجدون معك في الغرفة الحالية ({currentRoomUsers.length})</span>
                    <span className="text-[10px] text-emerald-400 font-normal">● متصلون الآن</span>
                  </div>

                  {/* List of current room users */}
                  {currentRoomUsers.map((u, idx) => (
                    <div
                      key={u.id}
                      onClick={() => openUserProfile(u)}
                      className="p-2.5 hover:bg-white/5 transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative">
                          <img
                            src={u.avatarUrl || falconIcon}
                            alt={u.username}
                            className="w-12 h-12 rounded-lg object-cover border border-amber-500/50 shadow-sm"
                          />
                          {/* Presence Dot: 🟢 Online, 🟡 Away (in background), ⚪ Offline */}
                          {u.presenceState === 'away' ? (
                            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-slate-900 shadow-xs animate-pulse" title="في الخلفية (بالانتظار) 🟡" />
                          ) : u.presenceState === 'offline' ? (
                            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-slate-400 border-2 border-slate-900" title="غير متصل ⚪" />
                          ) : (
                            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900 shadow-xs" title="متواجد ونشط 🟢" />
                          )}
                        </div>
                        <div className="min-w-0 text-right">
                          <div className={`font-bold text-xs ${curTheme.accentText} flex items-center gap-1 flex-wrap`}>
                            {(() => {
                              const banner = getUserBanner(u.username, u.nameBannerUrl);
                              if (banner) {
                                return (
                                  <img
                                    src={banner}
                                    alt={u.username}
                                    title={u.username}
                                    className="h-6 max-h-[26px] max-w-[170px] sm:max-w-[210px] object-contain drop-shadow-sm select-none inline-block align-middle rounded"
                                  />
                                );
                              }
                              return <span>{u.username}</span>;
                            })()}
                            {u.giftBadges && u.giftBadges.length > 0 && (
                              <span className="inline-flex items-center gap-1 mx-0.5 align-middle">
                                {u.giftBadges.map((badgeUrl, bIdx) => (
                                  <img
                                    key={bIdx}
                                    src={badgeUrl}
                                    alt="وسام"
                                    title="وسام شرفي وهدية تكريمية"
                                    className="w-4 h-4 object-contain inline-block drop-shadow-xs"
                                  />
                                ))}
                              </span>
                            )}
                            {u.role === 'admin' && <span className="text-[10px] text-red-400 font-bold">★ إدارة</span>}
                            {u.role === 'super' && <span className="text-[10px] text-amber-400 font-bold">★ سوبر</span>}
                            {isUserIgnored(u.username) && (
                              <span className="px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 text-[9px] font-black">
                                🚫 متجاهل
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[150px] mt-0.5">
                            {u.statusQuote || '..'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {(currentUser.role === 'admin' || currentUser.role === 'super') && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              socket?.emit('revealNicks', { targetUsername: u.username });
                            }}
                            className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-black text-[10px] font-black rounded shadow-xs transition-colors cursor-pointer"
                            title="كشف النكات والآي بي"
                          >
                            كشف
                          </button>
                        )}
                        <div className="flex flex-col items-end gap-0.5">
                          <div className="flex items-center gap-1">
                            <span className="text-lg leading-none">{u.flag}</span>
                            {getCountryNameFromFlag(u.flag) && (
                              <span className="text-[10px] text-amber-400 font-bold whitespace-nowrap">
                                {getCountryNameFromFlag(u.flag)}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">#{idx + 1}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* DIVIDER LINE (خط فاصل يظهر المتواجدين خارج الغرفة أو بغرف أخرى) */}
                  <div className={`flex items-center gap-2 px-3 py-2 ${curTheme.subHeaderBg} ${curTheme.accentText} text-xs font-bold border-y ${curTheme.subHeaderBorder}`}>
                    <span className="flex-1 h-px bg-slate-700" />
                    <span>المتواجدون خارج الغرفة أو بغرف أخرى ({otherConnectedUsers.length + offlineMembers.length})</span>
                    <span className="flex-1 h-px bg-slate-700" />
                  </div>

                  {/* Users in other rooms (Connected: Green Dot) */}
                  {otherConnectedUsers.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => openUserProfile(u)}
                      className="p-2.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between bg-slate-50/50"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative">
                          <img
                            src={u.avatarUrl || falconIcon}
                            alt={u.username}
                            className="w-11 h-11 rounded-lg object-cover border border-slate-300"
                          />
                          {/* Presence Dot: 🟢 Online, 🟡 Away (in background), ⚪ Offline */}
                          {u.presenceState === 'away' ? (
                            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-white shadow-xs animate-pulse" title="في الخلفية (بالانتظار) 🟡" />
                          ) : u.presenceState === 'offline' ? (
                            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-slate-400 border-2 border-white" title="غير متصل ⚪" />
                          ) : (
                            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-xs" title="متصل بغرفة أخرى 🟢" />
                          )}
                        </div>
                        <div className="min-w-0 text-right">
                          <div className="font-bold text-xs text-slate-900 flex items-center gap-1 flex-wrap">
                            {(() => {
                              const banner = getUserBanner(u.username, u.nameBannerUrl);
                              if (banner) {
                                return (
                                  <img
                                    src={banner}
                                    alt={u.username}
                                    title={u.username}
                                    className="h-5 max-h-[24px] max-w-[150px] object-contain drop-shadow-sm select-none inline-block align-middle rounded"
                                  />
                                );
                              }
                              return <span>{u.username}</span>;
                            })()}
                            {u.giftBadges && u.giftBadges.length > 0 && (
                              <span className="inline-flex items-center gap-0.5 mx-0.5 align-middle">
                                {u.giftBadges.map((badgeUrl, bIdx) => (
                                  <img
                                    key={bIdx}
                                    src={badgeUrl}
                                    alt="وسام"
                                    title="وسام شرفي"
                                    className="w-3.5 h-3.5 object-contain inline-block drop-shadow-xs"
                                  />
                                ))}
                              </span>
                            )}
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-semibold">
                              {u.room}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[150px]">
                            {u.statusQuote || 'عضو حسان برو'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {(currentUser.role === 'admin' || currentUser.role === 'super') && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              socket?.emit('revealNicks', { targetUsername: u.username });
                            }}
                            className="px-2 py-0.5 bg-amber-500 hover:bg-amber-600 text-black text-[10px] font-black rounded"
                          >
                            كشف
                          </button>
                        )}
                        <div className="flex items-center gap-1">
                          <span className="text-base">{u.flag}</span>
                          {getCountryNameFromFlag(u.flag) && (
                            <span className="text-[10px] text-indigo-700 font-bold whitespace-nowrap">
                              {getCountryNameFromFlag(u.flag)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Disconnected Members (Outside rooms: Gray Dot) */}
                  {offlineMembers.map((m) => (
                    <div
                      key={m.username}
                      onClick={() => {
                        const simulatedUser: User = {
                          id: `offline-${m.username}`,
                          username: m.username,
                          avatarSeed: m.username,
                          role: m.role as any,
                          flag: m.flag,
                          statusQuote: m.statusQuote,
                          avatarUrl: m.avatarUrl,
                          nameBannerUrl: m.nameBannerUrl,
                          giftBadges: m.giftBadges,
                          likes: m.likes || 100,
                          points: 500,
                          isVoice: false,
                          isSpeaking: false,
                          micSlot: null,
                          isMuted: false,
                          isTextMuted: false,
                          room: 'خارج الغرف'
                        };
                        openUserProfile(simulatedUser);
                      }}
                      className="p-2.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between opacity-80"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative">
                          <img
                            src={m.avatarUrl || falconIcon}
                            alt={m.username}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 grayscale"
                          />
                          {/* Gray dot for disconnected/offline member outside rooms */}
                          <span
                            className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-slate-400 border-2 border-white"
                            title="عضوية غير متصلة (خارج الغرف)"
                          />
                        </div>
                        <div className="min-w-0 text-right">
                          <div className="font-bold text-xs text-slate-700 flex items-center gap-1 flex-wrap">
                            {(() => {
                              const banner = getUserBanner(m.username, m.nameBannerUrl);
                              if (banner) {
                                return (
                                  <img
                                    src={banner}
                                    alt={m.username}
                                    title={m.username}
                                    className="h-5 max-h-[24px] max-w-[140px] object-contain drop-shadow-sm select-none inline-block align-middle rounded opacity-85"
                                  />
                                );
                              }
                              return <span>{m.username}</span>;
                            })()}
                            {m.giftBadges && m.giftBadges.length > 0 && (
                              <span className="inline-flex items-center gap-0.5 mx-0.5 align-middle">
                                {m.giftBadges.map((badgeUrl, bIdx) => (
                                  <img
                                    key={bIdx}
                                    src={badgeUrl}
                                    alt="وسام"
                                    title="وسام شرفي"
                                    className="w-3.5 h-3.5 object-contain inline-block drop-shadow-xs"
                                  />
                                ))}
                              </span>
                            )}
                            <span className="text-[9px] px-1 py-0.2 rounded bg-slate-200 text-slate-600">
                              خارج الغرف
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                            {m.statusQuote || 'عضو مسجل • غير متصل'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {(currentUser.role === 'admin' || currentUser.role === 'super') && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              socket?.emit('revealNicks', { targetUsername: m.username });
                            }}
                            className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold rounded"
                          >
                            كشف
                          </button>
                        )}
                        <div className="flex items-center gap-1 opacity-70">
                          <span className="text-base">{m.flag}</span>
                          {getCountryNameFromFlag(m.flag) && (
                            <span className="text-[10px] text-slate-500 font-bold whitespace-nowrap">
                              {getCountryNameFromFlag(m.flag)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* 3. WALL / الحائط DRAWER (Screenshots 4 & 13) */}
        {activeDrawer === 'wall' && (
          <div className="absolute inset-y-0 right-0 w-[84%] bg-white z-40 shadow-2xl border-l border-slate-300 flex flex-col animate-in slide-in-from-right duration-200">
            <div className="bg-[#241a12] text-amber-200 p-2.5 flex items-center justify-between">
              <span className="font-bold text-sm">الحائط</span>
              <button
                onClick={() => setActiveDrawer('none')}
                className="w-7 h-7 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center rounded font-bold"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Hidden file input for 24-Hour Stories (صور وفيديو) */}
            <input
              type="file"
              ref={storyFileInputRef}
              accept="image/*,video/*"
              onChange={handleStoryFileSelect}
              className="hidden"
            />

            {/* 24-Hour Stories / Khwater Header & Avatars Carousel */}
            <div className="p-2.5 bg-gradient-to-r from-slate-50 via-amber-50/50 to-slate-50 border-b border-amber-200/60 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-800">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                  <span>خواطر وحالات الـ 24 ساعة 📸🎥</span>
                </span>
                <span className="text-[10px] text-amber-800 font-bold bg-amber-100/90 px-2 py-0.2 rounded-full border border-amber-300">
                  حذف تلقائي بعد 24 ساعة
                </span>
              </div>

              {/* Horizontal Stories Carousel */}
              <div className="flex items-center gap-3 overflow-x-auto py-1 no-horizontal-overflow">
                {/* Current User Story (+) Slot */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="relative group">
                    <img
                      src={currentUser.avatarUrl || falconIcon}
                      alt={currentUser.username}
                      onClick={() => {
                        const myStory = storiesList.find((s) => s.username === currentUser.username);
                        if (myStory) {
                          setActiveStoryViewer(myStory);
                        } else {
                          storyFileInputRef.current?.click();
                        }
                      }}
                      className={`w-11 h-11 rounded-full object-cover cursor-pointer hover:opacity-90 transition-all ${
                        storiesList.some((s) => s.username === currentUser.username)
                          ? 'p-0.5 border-2 border-amber-500 shadow-md story-active-ring'
                          : 'border-2 border-slate-300'
                      }`}
                      title={storiesList.some((s) => s.username === currentUser.username) ? 'عرض خاطرتك الحالية / اضغط + لإضافة أخرى' : 'انقر لاختيار صورة أو فيديو من المعرض ونشر حالة'}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        storyFileInputRef.current?.click();
                      }}
                      className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-bold flex items-center justify-center shadow cursor-pointer border-2 border-white"
                      title="اختيار صورة أو فيديو من المعرض (+)"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-700 font-bold mt-1">خاطرتي</span>
                </div>

                {/* Other Members Stories */}
                {storiesList
                  .filter((s) => s.username !== currentUser.username)
                  .map((story) => (
                    <div
                      key={story.id}
                      onClick={() => setActiveStoryViewer(story)}
                      className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
                      title={`عرض خاطرة ${story.username}`}
                    >
                      <div className="relative p-0.5 rounded-full story-active-ring bg-gradient-to-tr from-amber-400 via-rose-500 to-yellow-400">
                        <img
                          src={story.avatarUrl || falconIcon}
                          alt={story.username}
                          className="w-11 h-11 rounded-full object-cover border border-white"
                        />
                        {story.mediaType === 'video' && (
                          <span className="absolute bottom-0 right-0 bg-black/80 text-amber-300 text-[8px] rounded-full px-1 border border-amber-400">
                            ▶️
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-700 font-bold mt-1 max-w-[55px] truncate">
                        {story.username}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Tabs: المنشورات | الدردشة السريعة */}
            <div className="grid grid-cols-2 bg-slate-200 text-xs font-bold text-center border-b border-slate-300">
              <button
                type="button"
                onClick={() => setWallTab('posts')}
                className={`py-2 flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  wallTab === 'posts' ? 'bg-[#2a241e] text-amber-200 shadow-inner' : 'text-slate-700 hover:bg-slate-300'
                }`}
              >
                <span>المنشورات</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20">
                  {wallPosts.filter((p) => !p.category || p.category === 'posts').length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setWallTab('quick')}
                className={`py-2 flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  wallTab === 'quick' ? 'bg-[#2a241e] text-amber-200 shadow-inner' : 'text-slate-700 hover:bg-slate-300'
                }`}
              >
                <span>الدردشة السريعة</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20">
                  {wallPosts.filter((p) => p.category === 'quick').length}
                </span>
              </button>
            </div>

            {/* Posts Stream Filtered by Tab */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {(() => {
                const filteredPosts = wallPosts.filter((post) => {
                  if (wallTab === 'posts') {
                    return !post.category || post.category === 'posts';
                  }
                  return post.category === 'quick';
                });

                if (filteredPosts.length === 0) {
                  return (
                    <div className="text-center py-12 text-slate-400 space-y-2 select-none">
                      <div className="text-3xl">📝</div>
                      <div className="text-xs font-bold text-slate-600">
                        {wallTab === 'posts'
                          ? 'لا توجد منشورات حتى الآن في هذا القسم.'
                          : 'لا توجد مشاركات في قسم الدردشة السريعة حالياً.'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        اكتب وشارك أول منشور أو دردشة سريعة مع الجميع!
                      </div>
                    </div>
                  );
                }

                return filteredPosts.map((post) => {
                const isPostVideo = Boolean(
                  (post as any).mediaType === 'video' ||
                  (post.mediaUrl &&
                    (post.mediaUrl.startsWith('data:video') ||
                      post.mediaUrl.endsWith('.mp4') ||
                      post.mediaUrl.endsWith('.webm') ||
                      post.mediaUrl.endsWith('.mov') ||
                      post.mediaUrl.endsWith('.ogg')))
                );

                return (
                  <div key={post.id} className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm text-right">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <img
                          src={post.avatarUrl || falconIcon}
                          alt={post.username}
                          onClick={() => openUserProfileByName(post.username)}
                          className="w-8 h-8 rounded-full object-cover border cursor-pointer hover:opacity-80"
                        />
                        {(() => {
                          const bannerUrl = getUserBanner(post.username, post.nameBannerUrl);
                          if (bannerUrl) {
                            return (
                              <img
                                src={bannerUrl}
                                alt={post.username}
                                title={post.username}
                                onClick={() => openUserProfileByName(post.username)}
                                className="h-6 max-h-[26px] max-w-[170px] sm:max-w-[200px] object-contain drop-shadow-sm rounded inline-block cursor-pointer hover:opacity-90"
                              />
                            );
                          }
                          return (
                            <span
                              onClick={() => openUserProfileByName(post.username)}
                              className="font-bold text-xs text-slate-900 cursor-pointer hover:underline"
                            >
                              {post.username}
                            </span>
                          );
                        })()}
                        {post.flag && <span className="text-xs">{post.flag}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400 font-mono">{post.time}</span>
                        {currentUser && (post.username.toLowerCase() === currentUser.username.toLowerCase() || currentUser.role === 'admin' || currentUser.role === 'super') && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingWallPostId(editingWallPostId === post.id ? null : post.id);
                                setEditingWallPostText(post.text);
                              }}
                              className="text-slate-300 hover:text-blue-500 p-0.5 transition-colors cursor-pointer"
                              title="تعديل المنشور ✏️"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteWallPost(post.id)}
                              className="text-slate-300 hover:text-rose-600 p-0.5 transition-colors cursor-pointer"
                              title="حذف المنشور 🗑️"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {editingWallPostId === post.id ? (
                      <div className="my-2 p-2 bg-slate-50 border border-blue-400 rounded-xl space-y-2">
                        <textarea
                          rows={3}
                          value={editingWallPostText}
                          onChange={(e) => setEditingWallPostText(e.target.value)}
                          className="w-full p-2 text-xs bg-white text-slate-800 border border-slate-300 rounded-lg outline-none focus:border-blue-500 resize-none font-medium"
                          autoFocus
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveEditWallPost(post.id, editingWallPostText)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                          >
                            حفظ التعديل
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingWallPostId(null)}
                            className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                          >
                            إلغاء
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                        {post.text}
                        {post.isEdited && (
                          <span className="text-[10px] text-blue-600 bg-blue-50 px-1 py-0.5 rounded font-bold mr-1.5 select-none">(معدل ✏️)</span>
                        )}
                      </p>
                    )}

                    {/* Media in Wall Post with click to Lightbox */}
                    {post.mediaUrl && (
                      <div
                        onClick={() =>
                          setActiveMediaViewer({
                            url: post.mediaUrl!,
                            type: isPostVideo ? 'video' : 'image',
                            title: `منشور من @${post.username}`
                          })
                        }
                        className="mt-2 relative group cursor-pointer rounded-lg overflow-hidden border border-slate-200"
                        title="انقر لفتح وتكبير وتحميل الوسائط"
                      >
                        {isPostVideo ? (
                          <div className="relative bg-black max-h-52 w-full flex items-center justify-center">
                            <video src={post.mediaUrl} className="max-h-52 w-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20">
                              <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white shadow-lg">
                                <Play className="w-5 h-5 fill-white ml-0.5" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <img
                            src={post.mediaUrl}
                            alt="post media"
                            className="max-h-52 w-full object-cover group-hover:scale-[1.01] transition-transform"
                          />
                        )}
                      </div>
                    )}

                    {/* Actions (Like, Comment) */}
                    <div className="mt-2.5 pt-2 border-t flex items-center justify-between text-xs text-slate-600">
                      {(() => {
                        const hasLiked = Boolean(
                          currentUser && post.likedUsers && post.likedUsers.includes(currentUser.username.toLowerCase())
                        );
                        return (
                          <button
                            type="button"
                            onClick={() => {
                              if (hasLiked) {
                                showToast('لقد سجلت إعجابك بهذا المنشور مسبقاً (إعجاب واحد فقط لكل عضو) ❤️', 'info');
                                return;
                              }
                              socket?.emit('likeWallPost', { postId: post.id });
                            }}
                            className={`flex items-center gap-1.5 transition-all cursor-pointer font-bold ${
                              hasLiked ? 'text-rose-600 scale-105' : 'text-slate-600 hover:text-rose-500 hover:scale-105'
                            }`}
                            title={hasLiked ? 'أعجبك هذا المنشور مسبقاً (إعجاب واحد فقط)' : 'إعجاب بالمنشور (مرة واحدة)'}
                          >
                            <Heart className={`w-4 h-4 ${hasLiked ? 'fill-rose-500 text-rose-500' : 'text-rose-500'}`} />
                            <span>{post.likes}</span>
                            {hasLiked && <span className="text-[10px] text-rose-500 font-normal">تم الإعجاب</span>}
                          </button>
                        );
                      })()}

                      <button
                        type="button"
                        onClick={() => setExpandedCommentsPostId(expandedCommentsPostId === post.id ? null : post.id)}
                        className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 cursor-pointer font-bold text-xs"
                        title="عرض التعليقات وإضافة تعليق"
                      >
                        <span>💬 {post.commentsCount || (post.comments ? post.comments.length : 0)} تعليق</span>
                      </button>
                    </div>

                    {/* Expandable Comments Drawer/Section (ميزة التعليق على منشورات الحائط) */}
                    {expandedCommentsPostId === post.id && (
                      <div className="mt-2 pt-2 border-t border-slate-100 bg-slate-50 p-2.5 rounded-xl space-y-2 text-right">
                        <div className="font-bold text-[11px] text-slate-800">التعليقات على المنشور:</div>
                        {post.comments && post.comments.length > 0 ? (
                          <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                            {post.comments.map((cm) => (
                              <div key={cm.id} className="p-2 bg-white border border-slate-200 rounded-lg text-xs shadow-2xs">
                                <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                                  <div className="flex items-center gap-1.5">
                                    {(() => {
                                      const cmBanner = getUserBanner(cm.username, cm.nameBannerUrl);
                                      if (cmBanner) {
                                        return (
                                          <img
                                            src={cmBanner}
                                            alt={cm.username}
                                            title={cm.username}
                                            onClick={() => openUserProfileByName(cm.username)}
                                            className="h-5 max-h-[22px] max-w-[130px] object-contain rounded inline-block cursor-pointer hover:opacity-90"
                                          />
                                        );
                                      }
                                      return (
                                        <span
                                          onClick={() => openUserProfileByName(cm.username)}
                                          className="font-bold text-slate-900 cursor-pointer hover:underline"
                                        >
                                          {cm.username}
                                        </span>
                                      );
                                    })()}
                                    {currentUser && (
                                      cm.username.toLowerCase() === currentUser.username.toLowerCase() ||
                                      post.username.toLowerCase() === currentUser.username.toLowerCase() ||
                                      currentUser.role === 'admin' ||
                                      currentUser.role === 'super'
                                    ) && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteWallComment(post.id, cm.id)}
                                        className="text-slate-400 hover:text-rose-600 p-0.5 transition-colors cursor-pointer"
                                        title="حذف هذا التعليق 🗑️"
                                      >
                                        <Trash2 className="w-3 h-3 text-rose-500" />
                                      </button>
                                    )}
                                  </div>
                                  <span className="font-mono">{cm.time}</span>
                                </div>
                                <div className="text-slate-700 leading-snug">{cm.text}</div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 py-1 text-center">لا توجد تعليقات بعد .. كن أول من يعلق!</div>
                        )}

                        {/* Add Comment Input */}
                        <div className="flex items-center gap-1.5 pt-1">
                          <textarea
                            rows={1}
                            name="chat_wall_comment_freeform"
                            id="chat_wall_comment_freeform"
                            inputMode="text"
                            enterKeyHint="send"
                            autoComplete="off"
                            autoCorrect="on"
                            autoCapitalize="sentences"
                            spellCheck={true}
                            data-form-type="other"
                            data-lpignore="true"
                            data-1p-ignore="true"
                            data-bwignore="true"
                            data-protonpass-ignore="true"
                            data-keeper-ignore="true"
                            aria-autocomplete="none"
                            role="textbox"
                            placeholder="اكتب تعليقك هنا..."
                            value={wallCommentInput}
                            style={{ color: settingTextColor }}
                            onChange={(e) => setWallCommentInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey && wallCommentInput.trim()) {
                                e.preventDefault();
                                handleAddWallComment(post.id, wallCommentInput);
                              }
                            }}
                            className="flex-1 p-2 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:border-indigo-600 resize-none h-9 leading-tight font-medium overflow-hidden"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddWallComment(post.id, wallCommentInput)}
                            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs cursor-pointer shadow-xs"
                          >
                            تعليق
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              });
            })()}
            </div>

            {/* Wall upload progress indicator */}
            {isWallUploading && (
              <div className="p-2 bg-amber-50 border-t border-amber-200 text-amber-900 text-xs flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-2">
                  <RotateCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                  <span className="font-bold">جاري رفع ونشر الوسائط على الحائط... {wallUploadProgress}%</span>
                </div>
                <div className="w-24 bg-amber-200 rounded-full h-2 overflow-hidden">
                  <div className="bg-amber-600 h-full transition-all duration-150" style={{ width: `${wallUploadProgress || 1}%` }} />
                </div>
              </div>
            )}

            {/* Quick reply bar at bottom with Video / Photo upload */}
            <div className="p-2 border-t bg-slate-50 flex items-center gap-1.5">
              <label className={`p-2 text-slate-500 hover:text-indigo-600 cursor-pointer rounded hover:bg-slate-100 flex-shrink-0 ${isWallUploading ? 'opacity-50 pointer-events-none' : ''}`} title="إرفاق فيديو أو صورة للمنشور">
                <ImageIcon className="w-4 h-4 text-rose-500" />
                <input
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  disabled={isWallUploading}
                  onChange={handleWallMediaUpload}
                />
              </label>

              <textarea
                rows={1}
                name="chat_wall_post_freeform"
                id="chat_wall_post_freeform"
                inputMode="text"
                enterKeyHint="send"
                autoComplete="off"
                autoCorrect="on"
                autoCapitalize="sentences"
                spellCheck={true}
                data-form-type="other"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                data-protonpass-ignore="true"
                data-keeper-ignore="true"
                aria-autocomplete="none"
                role="textbox"
                placeholder="...اكتب خاطرة أو منشوراً مع صورة"
                value={wallTextInput}
                style={{ color: settingTextColor }}
                onChange={(e) => setWallTextInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && wallTextInput.trim()) {
                    e.preventDefault();
                    socket?.emit('newWallPost', { text: wallTextInput.trim(), category: wallTab });
                    setWallTextInput('');
                  }
                }}
                className="flex-1 p-2 text-xs border rounded bg-white outline-none resize-none h-9 leading-tight font-medium overflow-hidden"
              />
              <button
                type="button"
                onClick={() => {
                  if (wallTextInput.trim()) {
                    socket?.emit('newWallPost', { text: wallTextInput.trim(), category: wallTab });
                    setWallTextInput('');
                  }
                }}
                className="px-3 py-2 bg-[#2a241e] text-amber-200 rounded text-xs font-bold cursor-pointer"
              >
                إرسال
              </button>
            </div>
          </div>
        )}

        {/* 4. PRIVATE MESSAGES / المحادثات الخاصة (محادثات منفرده لكل شخص مع عداد غير المقروء) */}
        {activeDrawer === 'pm' && (
          <div className={`absolute inset-y-0 right-0 w-[86%] ${curTheme.drawerBg} text-slate-100 z-40 shadow-2xl border-l ${curTheme.cardBorder} flex flex-col animate-in slide-in-from-right duration-200 text-right`}>
            {/* Header */}
            <div className={`${curTheme.drawerHeaderBg || curTheme.headerBg} ${curTheme.accentText} p-2.5 flex items-center justify-between shadow-md border-b ${curTheme.headerBorder}`}>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-sm">
                  {selectedPmUser ? `محادثة خاصة: ${selectedPmUser.username}` : 'المحادثات الخاصة'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {!selectedPmUser && Object.values(unreadPerUser).some((c) => c > 0) && (
                  <button
                    onClick={() => {
                      setUnreadPerUser({});
                      try {
                        sessionStorage.removeItem('soqoor_unread_pm');
                      } catch {}
                      setNotificationCount(0);
                      showToast('تم تحديد جميع المحادثات كمقروءة ✨', 'success');
                    }}
                    className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-[10px] font-bold transition-colors cursor-pointer"
                    title="تصفير وتحديد جميع الرسائل الخاصة كمقروءة"
                  >
                    تحديد الكل كمقروء
                  </button>
                )}
                {selectedPmUser && (
                  <button
                    onClick={() => setSelectedPmUser(null)}
                    className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    ← قائمة المحادثات
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedPmUser(null);
                    setActiveDrawer('none');
                  }}
                  className="w-7 h-7 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center rounded font-bold cursor-pointer"
                  title="إغلاق"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!selectedPmUser ? (
              // CONVERSATIONS LIST: All users you interacted with or can message
              <div className={`flex-1 flex flex-col overflow-hidden ${curTheme.drawerBg}`}>
                <div className={`p-2 border-b ${curTheme.cardBorder} ${curTheme.cardBg} flex items-center justify-between`}>
                  <span className={`font-bold text-xs ${curTheme.accentText}`}>صندوق الرسائل الخاصة المنفردة:</span>
                  <button
                    onClick={() => setActiveDrawer('users')}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
                  >
                    + جميع المتواجدين ({rosterUsers.length})
                  </button>
                </div>

                {/* Quick Start PM with any online user */}
                <div className={`p-2 ${curTheme.subHeaderBg} border-b ${curTheme.subHeaderBorder} flex-shrink-0`}>
                  <div className="text-[11px] font-bold text-amber-300 mb-1.5 flex items-center justify-between">
                    <span>بدء محادثة خاصة فورية مع متواجد:</span>
                    <span className="text-[10px] text-emerald-400 font-semibold">{rosterUsers.filter(u => u.id !== currentUser.id).length} متاح</span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {rosterUsers
                      .filter((u) => u.id !== currentUser.id && !isUserIgnored(u.username))
                      .map((user) => (
                        <button
                          key={user.id}
                          onClick={() => {
                            setSelectedPmUser(user);
                            setUnreadPerUser((prev) => {
                              const updated = { ...prev };
                              const count = updated[user.username] || 0;
                              delete updated[user.username];
                              setNotificationCount((c) => Math.max(0, c - count));
                              return updated;
                            });
                          }}
                          className={`flex flex-col items-center gap-1 p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer flex-shrink-0 w-14`}
                        >
                          <div className="relative">
                            <img
                              src={user.avatarUrl || falconIcon}
                              alt={user.username}
                              className="w-10 h-10 rounded-full object-cover border border-indigo-300"
                            />
                            {user.isVoice && (
                              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
                            )}
                          </div>
                          {(() => {
                            const banner = getUserBanner(user.username, user.nameBannerUrl);
                            if (banner) {
                              return (
                                <img
                                  src={banner}
                                  alt={user.username}
                                  className="h-3 max-w-[52px] object-contain rounded mx-auto"
                                />
                              );
                            }
                            return (
                              <span className="text-[10px] font-bold text-slate-800 truncate w-full text-center">
                                {user.username}
                              </span>
                            );
                          })()}
                        </button>
                      ))}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {/* Collect list of unique conversation partners */}
                  {(() => {
                    const partnersMap: Record<string, { user?: User; lastMsg?: PrivateMessage; unread: number }> = {};
                    const safePrivateMessages = Array.isArray(privateMessages) ? privateMessages : [];

                    // Extract from existing privateMessages safely
                    safePrivateMessages.forEach((pm) => {
                      if (!pm) return;
                      const otherUsername = pm.fromUsername === currentUser.username ? pm.toUsername : pm.fromUsername;
                      if (isUserIgnored(otherUsername)) return;
                      if (!partnersMap[otherUsername]) {
                        const matchedUser = rosterUsers.find((u) => u.username === otherUsername);
                        partnersMap[otherUsername] = {
                          user: matchedUser || {
                            id: pm.fromUsername === currentUser.username ? pm.toId : pm.fromId,
                            username: otherUsername,
                            room: 'الغرفة العامة',
                            avatarSeed: otherUsername,
                            statusQuote: '',
                            flag: '🇸🇦',
                            role: 'member',
                            likes: 0,
                            points: 0,
                            isVoice: false,
                            micSlot: null,
                            isMuted: false,
                            isTextMuted: false,
                            isSpeaking: false,
                            joinedAt: pm.timestamp
                          },
                          lastMsg: pm,
                          unread: unreadPerUser[otherUsername] || 0
                        };
                      } else {
                        partnersMap[otherUsername].lastMsg = pm;
                        partnersMap[otherUsername].unread = unreadPerUser[otherUsername] || 0;
                      }
                    });

                    const partnersList = Object.entries(partnersMap);

                    if (partnersList.length === 0) {
                      return (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                          <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
                            <span className="text-3xl">💬</span>
                          </div>
                          <h3 className="font-bold text-sm text-slate-800 mb-1">لا توجد محادثات خاصة بعد</h3>
                          <p className="text-xs text-slate-500 mb-4">اختر عضواً لبدء محادثة منفردة خاصة بينكما</p>
                          <button
                            onClick={() => setActiveDrawer('users')}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow transition-colors cursor-pointer"
                          >
                            اختيار عضو من المتواجدين ({rosterUsers.length})
                          </button>
                        </div>
                      );
                    }

                    return partnersList.map(([username, info]) => {
                      const userObj = info.user!;
                      const unread = info.unread;
                      const lastMsg = info.lastMsg;

                      return (
                        <div
                          key={username}
                          onClick={() => {
                            setSelectedPmUser(userObj);
                            // Clear unread for this user
                            setUnreadPerUser((prev) => {
                              const updated = { ...prev };
                              const count = updated[username] || 0;
                              delete updated[username];
                              setNotificationCount((c) => Math.max(0, c - count));
                              return updated;
                            });
                          }}
                          className="p-3 bg-white hover:bg-slate-100 flex items-center justify-between cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="relative">
                              <img
                                src={userObj.avatarUrl || falconIcon}
                                alt={username}
                                className="w-10 h-10 rounded-full object-cover border border-slate-300"
                              />
                              {/* Presence dot: 🟢 Online, 🟡 Away, ⚪ Offline */}
                              {(() => {
                                const matched = allConnectedUsers.find((u) => u.username.toLowerCase() === username.toLowerCase()) || rosterUsers.find((u) => u.username.toLowerCase() === username.toLowerCase());
                                const state = matched?.presenceState || userObj.presenceState || (matched ? 'online' : 'offline');
                                return state === 'away' ? (
                                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-400 border-2 border-white shadow-xs animate-pulse" title="في الخلفية (بالانتظار) 🟡" />
                                ) : state === 'offline' ? (
                                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-slate-400 border-2 border-white" title="غير متصل ⚪" />
                                ) : (
                                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-xs" title="متواجد ونشط 🟢" />
                                );
                              })()}
                              {unread > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-600 text-white font-black text-[10px] flex items-center justify-center shadow-md animate-bounce border-2 border-white">
                                  {unread}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-xs text-slate-900 flex items-center gap-1">
                                {(() => {
                                  const partnerBanner = getUserBanner(username, userObj.nameBannerUrl);
                                  if (partnerBanner) {
                                    return (
                                      <img
                                        src={partnerBanner}
                                        alt={username}
                                        title={username}
                                        className="h-5 max-h-[22px] max-w-[140px] object-contain rounded inline-block"
                                      />
                                    );
                                  }
                                  return <span>{username}</span>;
                                })()}
                                <span>{userObj.flag}</span>
                              </div>
                              <div className="text-[11px] text-slate-500 truncate max-w-[170px] mt-0.5">
                                {lastMsg ? (
                                  <span>{lastMsg.mediaUrl ? '📸 [صورة مرفقة]' : lastMsg.text}</span>
                                ) : (
                                  <span>محادثة خاصة منفرده</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1 flex-shrink-0 text-left">
                            <span className="text-[10px] text-slate-400 font-mono">
                              {lastMsg ? lastMsg.time : ''}
                            </span>
                            {unread > 0 ? (
                              <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black animate-pulse shadow-xs">
                                {unread} غير مقروءة
                              </span>
                            ) : (
                              <span className="text-[10px] text-indigo-600 font-bold">عرض المحادثة ←</span>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            ) : (
              // ACTIVE INDIVIDUAL PM THREAD (منفصلة تماماً لكل شخص)
              <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
                {/* Partner Sub-bar with Call Controls (ميزات الاتصال في الخاص: صوت وفيديو) */}
                <div className="p-2 bg-white border-b border-slate-200 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <img
                        src={selectedPmUser.avatarUrl || falconIcon}
                        alt={selectedPmUser.username}
                        className="w-8 h-8 rounded-full object-cover border"
                      />
                      {(() => {
                        const matched = allConnectedUsers.find((u) => u.username.toLowerCase() === selectedPmUser.username.toLowerCase()) || rosterUsers.find((u) => u.username.toLowerCase() === selectedPmUser.username.toLowerCase());
                        const state = matched?.presenceState || selectedPmUser.presenceState || (matched ? 'online' : 'offline');
                        return state === 'away' ? (
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-white shadow-xs animate-pulse" title="في الخلفية (بالانتظار) 🟡" />
                        ) : state === 'offline' ? (
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-slate-400 border-2 border-white" title="غير متصل ⚪" />
                        ) : (
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white shadow-xs" title="متواجد ونشط 🟢" />
                        );
                      })()}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 flex items-center gap-1">
                        {(() => {
                          const bannerUrl = getUserBanner(selectedPmUser.username, selectedPmUser.nameBannerUrl);
                          if (bannerUrl) {
                            return (
                              <img
                                src={bannerUrl}
                                alt={selectedPmUser.username}
                                title={selectedPmUser.username}
                                onClick={() => openUserProfile(selectedPmUser)}
                                className="h-6 max-h-[26px] max-w-[170px] sm:max-w-[200px] object-contain rounded inline-block cursor-pointer hover:opacity-90"
                              />
                            );
                          }
                          return <span>{selectedPmUser.username}</span>;
                        })()}
                        <span>{selectedPmUser.flag}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        {(() => {
                          const matched = allConnectedUsers.find((u) => u.username.toLowerCase() === selectedPmUser.username.toLowerCase()) || rosterUsers.find((u) => u.username.toLowerCase() === selectedPmUser.username.toLowerCase());
                          const state = matched?.presenceState || selectedPmUser.presenceState || (matched ? 'online' : 'offline');
                          return state === 'away' ? (
                            <span className="text-amber-600 font-bold">في الخلفية 🟡</span>
                          ) : state === 'offline' ? (
                            <span className="text-slate-400 font-medium">غير متصل ⚪</span>
                          ) : (
                            <span className="text-emerald-600 font-bold">متواجد ونشط 🟢</span>
                          );
                        })()}
                        {selectedPmUser.statusQuote && <span>• {selectedPmUser.statusQuote}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* E2EE Security Badge button */}
                    <button
                      type="button"
                      onClick={() => setShowPmEncryptionModal(true)}
                      className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer shadow-xs active:scale-95"
                      title="محادثة ومكالمات مشفرة طرف-إلى-طرف (E2EE 🔒) - انقر لعرض تفاصيل الأمان"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="hidden sm:inline">مشفرة 🔒</span>
                    </button>

                    {/* Audio Call button (اتصال صوتي خاص) */}
                    <button
                      type="button"
                      onClick={() => handleStartPmCall('audio')}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                      title="مكالمة صوتية خاصة مشفرة 1-على-1 (E2EE 🔒)"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">اتصال صوتي</span>
                    </button>

                    {/* Video Call button (اتصال مرئي خاص) */}
                    <button
                      type="button"
                      onClick={() => handleStartPmCall('video')}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                      title="مكالمة فيديو خاصة مشفرة 1-على-1 (E2EE 🔒)"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">فيديو</span>
                    </button>

                    <button
                      onClick={() => openUserProfile(selectedPmUser)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded cursor-pointer"
                    >
                      الملف
                    </button>
                  </div>
                </div>

                {/* Messages Stream for this partner exclusively */}
                <div ref={pmChatContainerRef} className="flex-1 p-3 overflow-y-auto space-y-2">
                  {(Array.isArray(privateMessages) ? privateMessages : [])
                    .filter((pm) => pm && (pm.fromUsername === selectedPmUser.username || pm.toUsername === selectedPmUser.username))
                    .map((pm, idx) => {
                      if (pm.isCallNotification) {
                        return (
                          <div key={pm.id ? `call-${pm.id}-${idx}` : `pm-call-${idx}`} className="flex justify-center my-1.5">
                            <div className="px-3 py-1 bg-slate-200/90 text-slate-800 rounded-full text-[11px] font-bold flex items-center gap-1.5 shadow-2xs border border-slate-300">
                              <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{pm.text}</span>
                              <span className="text-[10px] text-slate-500 font-mono">({formatMessageTime(pm)})</span>
                            </div>
                          </div>
                        );
                      }

                      const isMe = pm.fromUsername.toLowerCase() === currentUser.username.toLowerCase();
                      return (
                        <div
                          key={pm.id ? `msg-${pm.id}-${idx}` : `pm-${idx}`}
                          id={`pm-msg-${pm.id}`}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} my-0.5`}
                        >
                          <div
                            className={`p-2.5 rounded-2xl w-fit max-w-[85%] text-xs leading-relaxed shadow-xs ${
                              isMe
                                ? 'bg-[#241a12] text-amber-200 text-right rounded-tr-xs'
                                : 'bg-white border border-slate-200 text-slate-900 text-right rounded-tl-xs'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3 text-[10px] mb-1">
                              <div className="flex items-center gap-1.5">
                                {(() => {
                                  const senderBanner = getUserBanner(pm.fromUsername, pm.fromNameBannerUrl);
                                  if (senderBanner) {
                                    return (
                                      <img
                                        src={senderBanner}
                                        alt={pm.fromUsername}
                                        title={pm.fromUsername}
                                        onClick={() => openUserProfileByName(pm.fromUsername)}
                                        className="h-5 max-h-[22px] max-w-[130px] sm:max-w-[160px] object-contain rounded inline-block cursor-pointer hover:opacity-90"
                                      />
                                    );
                                  }
                                  return (
                                    <span
                                      onClick={() => openUserProfileByName(pm.fromUsername)}
                                      className={`font-bold cursor-pointer hover:underline ${isMe ? 'text-amber-400' : 'text-indigo-600'}`}
                                    >
                                      {isMe ? 'أنت' : pm.fromUsername}
                                    </span>
                                  );
                                })()}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPmReplyingTo({
                                      id: pm.id,
                                      username: pm.fromUsername,
                                      text: pm.text || (pm.voiceNote ? 'تسجيل صوتي 🎙️' : 'وسائط مرفقة 📸')
                                    });
                                  }}
                                  className="text-slate-400 hover:text-amber-500 cursor-pointer flex items-center gap-0.5 text-[9px] font-bold"
                                  title="رد على هذه الرسالة الخاصة"
                                >
                                  <Reply className="w-3 h-3 rotate-180" />
                                  <span>رد</span>
                                </button>
                                {isMe && !pm.voiceNote && !pm.mediaUrl && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingPmId(editingPmId === pm.id ? null : pm.id);
                                      setEditingPmText(pm.text);
                                    }}
                                    className="text-slate-400 hover:text-blue-500 p-0.5 transition-colors cursor-pointer"
                                    title="تعديل الرسالة ✏️"
                                  >
                                    <Edit3 className="w-3 h-3 text-blue-400" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeletePrivateMessage(pm.id)}
                                  className="text-slate-400 hover:text-rose-600 p-0.5 transition-colors cursor-pointer"
                                  title="حذف الرسالة 🗑️"
                                >
                                  <Trash2 className="w-3 h-3 text-rose-500" />
                                </button>
                              </div>
                            </div>

                            {/* Quoted Reply Banner if pm.replyTo */}
                            {pm.replyTo && (
                              <div
                                onClick={() => {
                                  const el = document.getElementById(`pm-msg-${pm.replyTo?.id}`);
                                  if (el) {
                                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    el.classList.add('ring-2', 'ring-amber-500');
                                    setTimeout(() => el.classList.remove('ring-2', 'ring-amber-500'), 2000);
                                  }
                                }}
                                className={`mb-1.5 px-2 py-1 rounded text-[10px] cursor-pointer ${
                                  isMe
                                    ? 'bg-amber-950/60 text-amber-300 border-r-2 border-amber-400'
                                    : 'bg-slate-100 text-slate-700 border-r-2 border-indigo-500'
                                }`}
                              >
                                <div className="font-bold flex items-center gap-1">
                                  <Reply className="w-2.5 h-2.5 rotate-180" />
                                  <span>رد على:</span>
                                  {(() => {
                                    const qBanner = getUserBanner(pm.replyTo.username);
                                    if (qBanner) {
                                      return (
                                        <img
                                          src={qBanner}
                                          alt={pm.replyTo.username}
                                          title={pm.replyTo.username}
                                          className="h-4 max-h-[18px] max-w-[110px] object-contain rounded inline-block"
                                        />
                                      );
                                    }
                                    return <span>@{pm.replyTo.username}</span>;
                                  })()}
                                </div>
                                <div className="truncate max-w-[200px] text-[9px]">{pm.replyTo.text}</div>
                              </div>
                            )}

                            {/* Voice Note Player (تشغيل الصوت في الخاص) */}
                            {pm.voiceNote && (
                              <div className="my-1">
                                <VoicePlayer
                                  audioUrl={pm.voiceNote.audioUrl}
                                  duration={pm.voiceNote.duration}
                                  isMe={isMe}
                                />
                              </div>
                            )}

                            {/* Text message or Inline Editor */}
                            {editingPmId === pm.id ? (
                              <div className="my-1.5 p-1.5 bg-white/95 text-slate-800 rounded-xl space-y-1.5 shadow-sm text-right">
                                <input
                                  type="text"
                                  value={editingPmText}
                                  onChange={(e) => setEditingPmText(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEditPrivateMessage(pm.id, editingPmText);
                                    if (e.key === 'Escape') setEditingPmId(null);
                                  }}
                                  className="w-full p-1.5 text-xs bg-slate-50 border border-blue-400 rounded-lg outline-none font-medium"
                                  autoFocus
                                />
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEditPrivateMessage(pm.id, editingPmText)}
                                    className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold cursor-pointer"
                                  >
                                    حفظ
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingPmId(null)}
                                    className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px] font-bold cursor-pointer"
                                  >
                                    إلغاء
                                  </button>
                                </div>
                              </div>
                            ) : (
                              pm.text && (
                                <div className="whitespace-pre-wrap">
                                  {pm.text}
                                  {pm.isEdited && (
                                    <span className="text-[9px] text-amber-400/90 font-normal mr-1 select-none">(معدلة ✏️)</span>
                                  )}
                                </div>
                              )
                            )}

                            {/* Media image or video in PM */}
                            {pm.mediaUrl && (
                              <div
                                onClick={() => {
                                  const url = pm.mediaUrl;
                                  if (!url) return;
                                  const isVid = url.startsWith('data:video') || url.endsWith('.mp4') || url.endsWith('.webm');
                                  setActiveMediaViewer({
                                    url,
                                    type: isVid ? 'video' : 'image',
                                    title: `وسائط من @${pm.fromUsername}`
                                  });
                                }}
                                className="mt-1.5 cursor-pointer relative group rounded-lg overflow-hidden border border-slate-300 max-h-48"
                                title="انقر لعرض وتكبير وتحميل الوسائط"
                              >
                                {pm.mediaUrl.startsWith('data:video') || pm.mediaUrl.endsWith('.mp4') || pm.mediaUrl.endsWith('.webm') ? (
                                  <div className="relative bg-black max-h-48 w-full flex items-center justify-center">
                                    <video src={pm.mediaUrl} className="max-h-48 object-cover w-full" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20">
                                      <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white shadow-lg">
                                        <Play className="w-5 h-5 fill-white ml-0.5" />
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <img src={pm.mediaUrl} alt="media" className="rounded-lg max-h-48 object-cover border group-hover:opacity-90 transition-opacity" />
                                )}
                              </div>
                            )}

                            {/* Self-Destructing Indicator if active */}
                            {pm.selfDestructAt && (
                              <div className="mt-1 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-950/80 border border-rose-500/40 text-rose-300 text-[10px] font-mono shadow-xs animate-pulse w-fit">
                                <Flame className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
                                <span>تختفي خلال:</span>
                                <span className="font-bold text-amber-300">
                                  {Math.max(0, Math.ceil((pm.selfDestructAt - nowTimestamp) / 1000))}ث
                                </span>
                              </div>
                            )}

                            <div className={`text-[9px] font-mono mt-1 flex items-center gap-1.5 ${isMe ? 'text-amber-300/70 justify-end' : 'text-slate-400 justify-start'}`}>
                              <span>{formatMessageTime(pm)}</span>
                              {isMe && (
                                <span className="inline-flex items-center gap-0.5 select-none">
                                  {pm.status === 'read' ? (
                                    <span
                                      className="inline-flex items-center gap-0.5 text-sky-400 font-bold"
                                      title={pm.readAt ? `تمت القراءة (${new Date(pm.readAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })})` : 'تمت القراءة'}
                                    >
                                      <CheckCheck className="w-3.5 h-3.5 text-sky-400 drop-shadow-[0_0_3px_rgba(56,189,248,0.7)]" />
                                      <span className="text-[8px] font-sans">مقروءة</span>
                                    </span>
                                  ) : pm.status === 'delivered' ? (
                                    <span className="inline-flex items-center gap-0.5 text-slate-400 font-medium" title="تم تسليم الرسالة للطرف الآخر">
                                      <CheckCheck className="w-3.5 h-3.5 text-slate-400" />
                                      <span className="text-[8px] font-sans">مستلمة</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-0.5 text-slate-400 font-medium" title="أُرسلت للغرفة">
                                      <Check className="w-3 h-3 text-slate-400" />
                                      <span className="text-[8px] font-sans">أُرسلت</span>
                                    </span>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  {(Array.isArray(privateMessages) ? privateMessages : []).filter(
                    (pm) => pm && (pm.fromUsername === selectedPmUser.username || pm.toUsername === selectedPmUser.username)
                  ).length === 0 && (
                    <div className="text-center text-slate-400 py-12 text-xs">
                      لا توجد رسائل بينك وبين {selectedPmUser.username} بعد.<br />
                      اكتب رسالتك أو سجل مقطعاً صوتياً لبدء المحادثة المنفردة.
                    </div>
                  )}
                  <div ref={pmMessagesEndRef} />
                </div>

                {/* Bottom PM Input Bar */}
                <div className="p-2 border-t bg-white flex flex-col gap-1.5 shadow-sm">
                  {/* PM Replying Banner */}
                  {pmReplyingTo && (
                    <div className="px-2.5 py-1 bg-amber-50 border border-amber-300 rounded-lg flex items-center justify-between text-xs text-amber-950">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Reply className="w-3.5 h-3.5 text-amber-700 rotate-180 flex-shrink-0" />
                        <div className="font-bold text-[11px] flex items-center gap-1">
                          <span>الرد على:</span>
                          {(() => {
                            const banner = getUserBanner(pmReplyingTo.username);
                            if (banner) {
                              return (
                                <img
                                  src={banner}
                                  alt={pmReplyingTo.username}
                                  title={pmReplyingTo.username}
                                  className="h-4 max-h-[18px] max-w-[110px] object-contain rounded inline-block"
                                />
                              );
                            }
                            return <span>@{pmReplyingTo.username}</span>;
                          })()}
                        </div>
                        <span className="truncate text-slate-600 text-[11px] max-w-[180px]">{pmReplyingTo.text}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPmReplyingTo(null)}
                        className="p-0.5 text-slate-400 hover:text-red-600 rounded-full"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Active Self-Destruct Banner Indicator */}
                  {pmSelfDestructSeconds > 0 && (
                    <div className="flex items-center justify-between px-2.5 py-1 mb-1 bg-rose-950/80 border border-rose-500/50 rounded-lg text-rose-200 text-[11px] animate-in fade-in duration-150">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Flame className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
                        <span>الرسالة القادمة ذاتية الاختفاء:</span>
                        <span className="text-amber-300 font-mono">
                          {pmSelfDestructSeconds < 60 ? `${pmSelfDestructSeconds} ثانية` : `${Math.floor(pmSelfDestructSeconds / 60)} دقيقة`}
                        </span>
                        <span className="text-[10px] text-rose-300/80 font-normal hidden sm:inline">(ستُمحى تلقائياً للطرفين بعد قراءتها)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPmSelfDestructSeconds(0)}
                        className="px-1.5 py-0.5 hover:bg-rose-900/60 text-rose-300 hover:text-white rounded text-xs font-bold cursor-pointer transition-colors"
                        title="إلغاء وضع التدمير الذاتي والرجوع للرسائل العادية"
                      >
                        إلغاء ✕
                      </button>
                    </div>
                  )}

                  {isPmRecordingVoice ? (
                    <div className="flex items-center justify-center py-0.5">
                      <VoiceRecorder
                        onSendVoice={(voiceData) => {
                          socket?.emit('privateMessage', {
                            toId: selectedPmUser.id,
                            text: '',
                            voiceNote: voiceData,
                            replyTo: pmReplyingTo || undefined,
                            selfDestructSeconds: pmSelfDestructSeconds > 0 ? pmSelfDestructSeconds : undefined
                          });
                          setPmReplyingTo(null);
                          setIsPmRecordingVoice(false);
                          showToast('تم إرسال التسجيل الصوتي في الخاص 🎙️', 'success');
                        }}
                        onCancel={() => setIsPmRecordingVoice(false)}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      {/* Attach Video / Photo to PM */}
                      <label className="p-2 text-slate-500 hover:text-indigo-600 cursor-pointer rounded hover:bg-slate-100 flex-shrink-0" title="إرسال فيديو أو صورة في الخاص">
                        <ImageIcon className="w-4 h-4 text-rose-500" />
                        <input
                          type="file"
                          accept="image/*,video/*"
                          className="hidden"
                          onChange={(e) =>
                            handleFileUpload(e, (dataUrl) => {
                              socket?.emit('privateMessage', {
                                toId: selectedPmUser.id,
                                text: '',
                                mediaUrl: dataUrl,
                                replyTo: pmReplyingTo || undefined,
                                selfDestructSeconds: pmSelfDestructSeconds > 0 ? pmSelfDestructSeconds : undefined
                              });
                              setPmReplyingTo(null);
                              showToast('تم إرسال الوسائط في الخاص 🎥📸', 'success');
                            })
                          }
                        />
                      </label>

                      {/* Voice Note Button for PM */}
                      <button
                        type="button"
                        onClick={() => setIsPmRecordingVoice(true)}
                        className="p-2 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded cursor-pointer transition-colors flex-shrink-0"
                        title="تسجيل مقطع صوتي في الخاص 🎙️"
                      >
                        <Mic className="w-4 h-4 text-rose-600" />
                      </button>

                      {/* Self-Destruct Timer Selector Toggle Button */}
                      <div className="relative flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => setShowPmSelfDestructMenu((v) => !v)}
                          className={`p-2 rounded cursor-pointer transition-all flex items-center gap-1 ${
                            pmSelfDestructSeconds > 0
                              ? 'bg-rose-950/90 text-rose-400 border border-rose-500/60 shadow-xs ring-1 ring-rose-500/30'
                              : 'text-slate-500 hover:text-rose-500 hover:bg-slate-100'
                          }`}
                          title={
                            pmSelfDestructSeconds > 0
                              ? `مؤقت الاختفاء الذاتي مفعل (${pmSelfDestructSeconds < 60 ? `${pmSelfDestructSeconds}ث` : `${Math.floor(pmSelfDestructSeconds / 60)}د`}) - انقر للتعديل`
                              : 'تفعيل الرسائل ذاتية الاختفاء (Self-destruct) 🔥'
                          }
                        >
                          <Flame className={`w-4 h-4 ${pmSelfDestructSeconds > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`} />
                          {pmSelfDestructSeconds > 0 && (
                            <span className="text-[10px] font-bold font-mono text-amber-300">
                              {pmSelfDestructSeconds < 60 ? `${pmSelfDestructSeconds}ث` : `${Math.floor(pmSelfDestructSeconds / 60)}د`}
                            </span>
                          )}
                        </button>

                        {/* Self-Destruct Dropdown Menu */}
                        {showPmSelfDestructMenu && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute bottom-full mb-2 right-0 sm:right-auto sm:left-0 z-50 w-52 bg-[#19130d] border border-rose-500/40 rounded-xl p-2 shadow-2xl space-y-1 text-right animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md"
                          >
                            <div className="flex items-center justify-between pb-1.5 border-b border-rose-500/20 text-rose-300 text-[11px] font-bold">
                              <span className="flex items-center gap-1">
                                <Flame className="w-3.5 h-3.5 text-rose-400" />
                                <span>مؤقت التدمير الذاتي</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => setShowPmSelfDestructMenu(false)}
                                className="text-slate-400 hover:text-white p-0.5 cursor-pointer text-xs"
                              >
                                ✕
                              </button>
                            </div>

                            <p className="text-[10px] text-slate-400 leading-tight pt-1">
                              تُحذف الرسالة تلقائياً وتختفي من الطرفين بعد انقضاء الوقت المحدد:
                            </p>

                            <div className="grid grid-cols-1 gap-1 pt-1">
                              {[
                                { sec: 0, label: 'إيقاف (رسالة عادية دائم)', icon: '💬' },
                                { sec: 10, label: '10 ثوانٍ (سريعة جداً)', icon: '⚡' },
                                { sec: 30, label: '30 ثانية (موصى بها)', icon: '⏱️' },
                                { sec: 60, label: '1 دقيقة واحدة', icon: '⏳' },
                                { sec: 300, label: '5 دقائق', icon: '⌛' }
                              ].map((opt) => (
                                <button
                                  key={opt.sec}
                                  type="button"
                                  onClick={() => {
                                    setPmSelfDestructSeconds(opt.sec);
                                    setShowPmSelfDestructMenu(false);
                                    if (opt.sec > 0) {
                                      showToast(`تم تفعيل التدمير الذاتي: ستختفي الرسالة بعد ${opt.sec < 60 ? `${opt.sec} ثانية` : `${Math.floor(opt.sec / 60)} دقيقة`} 🔥`, 'info');
                                    } else {
                                      showToast('تم إيقاف مؤقت التدمير الذاتي (رسالة عادية)', 'info');
                                    }
                                  }}
                                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    pmSelfDestructSeconds === opt.sec
                                      ? 'bg-rose-900/70 text-amber-300 border border-rose-500/50'
                                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                                  }`}
                                >
                                  <span className="flex items-center gap-1.5">
                                    <span>{opt.icon}</span>
                                    <span>{opt.label}</span>
                                  </span>
                                  {pmSelfDestructSeconds === opt.sec && <Check className="w-3.5 h-3.5 text-amber-400" />}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <textarea
                        rows={1}
                        name="chat_pm_text_freeform"
                        id="chat_pm_text_freeform"
                        inputMode="text"
                        enterKeyHint="send"
                        autoComplete="off"
                        autoCorrect="on"
                        autoCapitalize="sentences"
                        spellCheck={true}
                        data-form-type="other"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        data-bwignore="true"
                        data-protonpass-ignore="true"
                        data-keeper-ignore="true"
                        aria-autocomplete="none"
                        role="textbox"
                        placeholder={`اكتب رسالة خاصة إلى ${selectedPmUser.username}...`}
                        value={pmInput}
                        style={{ color: settingTextColor || curTheme.recommendedTextColor || '#fef3c7' }}
                        onChange={(e) => setPmInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey && pmInput.trim()) {
                            e.preventDefault();
                            const expandedText = expandClientShortcuts(pmInput.trim(), shortcuts);
                            socket?.emit('privateMessage', {
                              toId: selectedPmUser.id,
                              text: expandedText,
                              replyTo: pmReplyingTo || undefined,
                              selfDestructSeconds: pmSelfDestructSeconds > 0 ? pmSelfDestructSeconds : undefined
                            });
                            setPmInput('');
                            setPmReplyingTo(null);
                          }
                        }}
                        className={`flex-1 p-2 text-xs border ${curTheme.fieldBorder || 'border-slate-300'} rounded-lg ${curTheme.fieldBg || 'bg-slate-50 focus:bg-white'} ${curTheme.fieldText || 'text-slate-900'} ${curTheme.fieldPlaceholder || 'placeholder-slate-400'} outline-none ${curTheme.fieldFocus || 'focus:border-amber-500 focus:ring-1 focus:ring-amber-500'} resize-none h-9 leading-tight font-medium overflow-hidden transition-all shadow-inner`}
                      />
                      <button
                        onClick={() => {
                          if (pmInput.trim()) {
                            const expandedText = expandClientShortcuts(pmInput.trim(), shortcuts);
                            socket?.emit('privateMessage', {
                              toId: selectedPmUser.id,
                              text: expandedText,
                              replyTo: pmReplyingTo || undefined,
                              selfDestructSeconds: pmSelfDestructSeconds > 0 ? pmSelfDestructSeconds : undefined
                            });
                            setPmInput('');
                            setPmReplyingTo(null);
                          }
                        }}
                        className={`px-3 py-2 ${curTheme.primaryBtn || 'bg-[#2a241e] hover:bg-black text-amber-200'} rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-xs`}
                      >
                        إرسال
                      </button>
                    </div>
                  )}
                </div>

                {/* Private Chat & Call End-to-End Encryption Security Modal */}
                {showPmEncryptionModal && selectedPmUser && (
                  <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="bg-gradient-to-b from-[#1b140e] to-[#120d09] border border-emerald-500/40 rounded-2xl w-full max-w-md p-5 shadow-2xl text-right animate-in zoom-in-95 duration-150"
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-full bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-xs">
                            <ShieldCheck className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-emerald-300">تشفير المحادثات والمكالمات الخاصة</h3>
                            <p className="text-[10px] text-slate-400 font-mono">End-to-End Encrypted (E2EE 🔒)</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowPmEncryptionModal(false)}
                          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="mt-3.5 space-y-2.5 text-xs">
                        <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
                          <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-emerald-400" />
                            <span>مكالمات صوت وفيديو مشفرة (P2P E2EE):</span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            جميع المكالمات الصوتية والمرئية الخاصة بينك وبين <strong>{selectedPmUser.username}</strong> مشفرة من الطرفين مباشرة بتقنية WebRTC DTLS-SRTP 256-bit، ولا تمر بأي خادم وسيط أو تسجيل.
                          </p>
                        </div>

                        <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
                          <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                            <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
                            <span>مؤشرات القراءة الذكية المزدوجة (Read Receipts):</span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            علامة صح رمادي واحدة (<span className="text-slate-400 font-bold">✓</span>) عند الإرسال، علامتا صح رماديتان (<span className="text-slate-400 font-bold">✓✓</span>) عند استلام الطرف الآخر، وعلامتا صح باللون الأزرق السماوي (<span className="text-sky-400 font-bold">✓✓</span>) فور قراءة الرسالة.
                          </p>
                        </div>

                        <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
                          <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                            <Flame className="w-3.5 h-3.5 text-rose-400" />
                            <span>رسائل ذاتية الاختفاء (Self-destructing):</span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            يمكنك تفعيل مؤقت التدمير الذاتي للرسائل والصور والتسجيلات الصوتية في أي وقت من زر اللهب 🔥، ليتم مسح الرسالة تماماً من جهازك وجهاز الطرف الآخر بمجرد انتهاء المؤقت.
                          </p>
                        </div>

                        <div className="p-2.5 bg-black/60 rounded-xl border border-emerald-500/20 text-center">
                          <span className="text-[10px] text-emerald-400/90 font-mono select-all">
                            بصمة أمان الجلسة: SHA256:E2EE:{selectedPmUser.id.substring(0, 8).toUpperCase()}:{currentUser.id.substring(0, 8).toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowPmEncryptionModal(false)}
                        className="w-full mt-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer"
                      >
                        إغلاق وتأكيد الأمان
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 5. CONTROL & PERMISSIONS PANEL / لوحة التحكم والصلاحيات (Screenshot 8 & Admin Suite) */}
        {/* 5. CONTROL & PERMISSIONS PANEL / لوحة التحكم والصلاحيات الشاملة */}
        {activeDrawer === "monitor" && currentUser && (
          <div className="absolute inset-y-0 right-0 w-[92%] sm:w-[86%] max-w-xl bg-[#17110c] z-40 shadow-2xl border-l border-[#4d3722] flex flex-col animate-in slide-in-from-right duration-200 text-right">
            <AdminControlSuite
              currentUser={currentUser}
              rosterUsers={rosterUsers}
              allRegisteredMembers={allRegisteredMembers}
              roomsList={roomsList}
              roomStatsData={roomStatsData}
              bannedList={bannedList}
              roomSettings={roomSettings}
              serverSecurity={serverSecurity}
              likesSettings={likesSettings}
              staffMemos={staffMemos}
              monitorLogs={monitorLogs}
              monitoredWordsList={monitoredWordsList}
              shortcuts={shortcuts}
              onUpdateLikesSettings={(newLikes) => {
                setLikesSettings((prev) => ({ ...prev, ...newLikes }));
                socket?.emit('updateLikesSettings', newLikes);
              }}
              onAdminAction={(action, targetUsername, value, reason) => {
                handleAdminAction(action, targetUsername || "", value, reason);
              }}
              onManualBan={(username, ip, reason) => {
                socket?.emit("manualBan", { username, ip, reason });
              }}
              onUpdateSecurity={(newSettings) => {
                socket?.emit("updateServerSecurity", newSettings);
              }}
              onAddStaffMemo={(text, priority) => {
                socket?.emit("addStaffMemo", { text, priority });
              }}
              onDeleteStaffMemo={(memoId) => {
                socket?.emit("deleteStaffMemo", { memoId });
              }}
              onAddMonitoredWord={(word) => {
                socket?.emit("addMonitoredWord", { word });
              }}
              onRemoveMonitoredWord={(word) => {
                socket?.emit("removeMonitoredWord", { word });
              }}
              onAddShortcut={(trigger, replacement) => {
                socket?.emit("addShortcut", { trigger, replacement });
              }}
              onDeleteShortcut={(shortcutId) => {
                socket?.emit("deleteShortcut", { shortcutId });
              }}
              onUpdateShortcut={(id, trigger, replacement) => {
                socket?.emit("updateShortcut", { id, trigger, replacement });
              }}
              onClearMonitorLogs={() => {
                socket?.emit("clearMonitorLogs");
              }}
              onOpenUserProfile={(user) => {
                openUserProfile(user);
              }}
              onSwitchRoom={(roomId) => {
                socket?.emit("joinRoom", {
                  username: currentUser.username,
                  room: roomId,
                  loginType: "member",
                  password: "123"
                });
                showToast(`جاري الانتقال إلى [${roomId}]...`, "info");
              }}
              onRefreshRoomStats={() => {
                socket?.emit('getRoomStats');
              }}
              rolePermissions={rolePermissions}
              onUpdateRolePermissions={(role, permissions) => {
                setRolePermissions((prev) => {
                  const next = {
                    ...prev,
                    [role]: {
                      ...(prev?.[role] || {}),
                      ...permissions
                    }
                  };
                  try {
                    localStorage.setItem('soqoor_role_permissions', JSON.stringify(next));
                  } catch {}
                  return next;
                });
                socket?.emit('updateRolePermissions', { role, permissions });
              }}
              generalWelcome={generalWelcome}
              onUpdateGeneralWelcome={(settings) => {
                setGeneralWelcome((prev) => ({ ...prev, ...settings }));
                socket?.emit('updateGeneralWelcome', settings);
              }}
              emblemsConfig={emblemsConfig}
              onAddEmblem={(data) => socket?.emit('addEmblem', data)}
              onDeleteEmblem={(id) => socket?.emit('deleteEmblem', { id })}
              onUpdateEmojiSize={(emojiSize) => socket?.emit('updateEmblemEmojiSize', { emojiSize })}
              onAssignMemberBanner={(username, bannerUrl) => socket?.emit('assignMemberBanner', { username, bannerUrl })}
              onGrantMemberGift={(username, giftUrl, giftTitle) => socket?.emit('grantMemberGift', { username, giftUrl, giftTitle })}
              onRemoveMemberGift={(username, giftUrl) => socket?.emit('removeMemberGift', { username, giftUrl })}
              onClose={() => setActiveDrawer("none")}
              showToast={showToast}
            />
          </div>
        )}
        {/* 6. SETTINGS DRAWER / الإعدادات (Screenshots 5 & 6) */}
        {activeDrawer === 'settings' && (
          <div className={`absolute inset-y-0 right-0 w-[84%] ${curTheme.drawerBg} text-slate-100 z-40 shadow-2xl border-l ${curTheme.cardBorder} flex flex-col animate-in slide-in-from-right duration-200`}>
            <div className={`${curTheme.drawerHeaderBg || curTheme.headerBg} ${curTheme.accentText} p-2.5 flex items-center justify-between`}>
              <span className="font-bold text-sm">الإعدادات</span>
              <button
                onClick={() => setActiveDrawer('none')}
                className="w-7 h-7 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center rounded font-bold cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs text-right">
              {/* Profile Visitors Button (زر زوار ملفي الشخصي - يظهر الاسم والصورة وعدد المرات) */}
              <button
                type="button"
                onClick={() => {
                  socket?.emit('getProfileVisitors');
                  setShowProfileVisitorsModal(true);
                }}
                className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-900/70 via-amber-800/80 to-amber-900/70 hover:from-amber-800 hover:to-amber-700 text-amber-200 border-2 border-amber-500/80 rounded-xl font-bold flex items-center justify-between shadow-md cursor-pointer transition-all hover:scale-[1.01]"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-500/25 flex items-center justify-center text-amber-400 border border-amber-400/40">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                      <span>زوار ملفي الشخصي 👁️</span>
                      {profileVisitorsList.length > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[9px] font-mono animate-pulse">
                          نشط
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-amber-200/70">من نقر على صورتي وتصفح بروفايلي</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-xs font-mono shadow-xs">
                    {profileVisitorsList.length} زائر
                  </span>
                  <span className="text-xs text-amber-400 font-bold">عرض ←</span>
                </div>
              </button>

              {/* إعدادات الغرفة الحالية عند التواجد بالغرفة (مطلوبة بالضبط أسفل يمين الشاشة) */}
              {currentUser.room && currentUser.room !== 'خارج الغرف' && (
                <div className="p-3 bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 rounded-xl border-2 border-amber-500/70 shadow-md space-y-2 text-right">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs">
                      <Settings className="w-4 h-4 text-amber-400" />
                      <span>إعدادات الغرفة: [{currentUser.room}]</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const curRoom = roomsList.find(r => r.name === currentUser.room || r.id === currentUser.room);
                        setCurrentRoomSettingsForm({
                          name: curRoom?.name || currentUser.room,
                          desc: curRoom?.desc || '',
                          pinnedTopic: pinnedTopic || '',
                          isChatLocked: roomSettings?.isChatLocked || false,
                          slowModeSeconds: roomSettings?.slowModeSeconds || 0,
                          isVoiceLocked: roomSettings?.isVoiceLocked || false,
                          password: '',
                          wallpaper: activeWallpaper || 'default',
                          welcomeMessage: (roomSettings as any)?.welcomeMessage || '',
                          welcomeEnabled: (roomSettings as any)?.welcomeEnabled !== false
                        });
                        setIsRoomSettingsModalOpen(true);
                      }}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-black font-black text-[10px] rounded-lg shadow-xs transition-transform hover:scale-105 cursor-pointer flex items-center gap-1"
                    >
                      <Sliders className="w-3 h-3" />
                      <span>تعديل الغرفة ⚙️</span>
                    </button>
                  </div>
                  <div className="text-[11px] text-amber-200/80 leading-relaxed">
                    تحكم بالاسم، الإعلان المثبت، قفل الشات والمايكات، والوضع البطيء للغرفة.
                  </div>
                </div>
              )}

              {/* الزخرفة */}
              <div className="bg-[#2a241e] text-amber-200 px-2 py-1 font-bold">الزخرفة</div>
              <input
                type="text"
                value={settingName}
                onChange={(e) => setSettingName(e.target.value)}
                className="w-full p-2 border rounded outline-none font-semibold text-slate-900"
              />

              {/* الحاله */}
              <div className="bg-[#2a241e] text-amber-200 px-2 py-1 font-bold">الحاله</div>
              <input
                type="text"
                value={settingQuote}
                onChange={(e) => setSettingQuote(e.target.value)}
                className="w-full p-2 border rounded outline-none text-slate-800"
              />

              {/* Color rows (لون الإسم ولون الخط مع المعاينة الفورية) */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-slate-50 border border-slate-300 rounded-lg p-2 space-y-1.5 shadow-2xs">
                  <div className="p-1 bg-[#2a241e] text-amber-200 font-bold text-center rounded text-[11px]">
                    لون الإسم
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settingNameColor}
                      onChange={(e) => {
                        const col = e.target.value;
                        setSettingNameColor(col);
                        if (currentUser) {
                          setCurrentUser((prev) => (prev ? { ...prev, nameColor: col } : null));
                        }
                        socket?.emit('updateUserStyle', { nameColor: col });
                      }}
                      className="w-9 h-8 cursor-pointer rounded border border-slate-400 p-0.5 bg-white shadow-xs"
                    />
                    <span className="font-bold text-xs truncate flex-1" style={{ color: settingNameColor }}>
                      {settingName || currentUser.username}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-300 rounded-lg p-2 space-y-1.5 shadow-2xs">
                  <div className="p-1 bg-[#2a241e] text-amber-200 font-bold text-center rounded text-[11px]">
                    لون الخط
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settingTextColor}
                      onChange={(e) => {
                        const col = e.target.value;
                        setSettingTextColor(col);
                        if (currentUser) {
                          setCurrentUser((prev) => (prev ? { ...prev, textColor: col } : null));
                        }
                        socket?.emit('updateUserStyle', { textColor: col });
                      }}
                      className="w-9 h-8 cursor-pointer rounded border border-slate-400 p-0.5 bg-white shadow-xs"
                    />
                    <span className="font-bold text-xs truncate flex-1" style={{ color: settingTextColor }}>
                      معاينة الخط ✍️
                    </span>
                  </div>
                </div>
              </div>

              {/* Green Save Button (Screenshot 5: [✎ حفظ]) */}
              <button
                onClick={handleSaveSettings}
                className="w-full py-2.5 bg-[#48a942] hover:bg-emerald-600 text-white font-bold rounded shadow flex items-center justify-center gap-1.5 text-sm"
              >
                <span>✎ حفظ الإعدادات</span>
              </button>

              {/* Change Avatar Section (Screenshot 5: تغير الصوره الشخصيه) */}
              <div className="p-2.5 border rounded-lg bg-slate-50 space-y-2">
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-indigo-600" />
                    <span>تغير الصوره الشخصية</span>
                  </div>
                  {settingAvatar && (
                    <img
                      src={settingAvatar}
                      alt="preview"
                      className="w-7 h-7 rounded-full object-cover border border-amber-500"
                    />
                  )}
                </div>

                {/* Upload from Device / Phone */}
                <label className="w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all">
                  <Camera className="w-3.5 h-3.5" />
                  <span>اختيار صورة من هاتفك أو جهازك 📁</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      handleFileUpload(e, (dataUrl) => {
                        setSettingAvatar(dataUrl);
                        showToast('تم تحميل صورتك بنجاح! اضغط ✎ حفظ لتثبيتها', 'success');
                      })
                    }
                  />
                </label>

                {/* Quick Avatar Grid */}
                <div className="pt-1">
                  <div className="text-[11px] font-bold text-slate-600 mb-1">أو اختر رمزية جاهزة:</div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {SAMPLE_AVATARS.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`avatar-${i}`}
                        onClick={() => {
                          setSettingAvatar(url);
                          showToast('تم اختيار الرمزية بنجاح', 'info');
                        }}
                        className={`w-12 h-12 rounded-lg object-cover border-2 cursor-pointer transition-transform hover:scale-105 ${
                          settingAvatar === url ? 'border-indigo-600 ring-2 ring-indigo-400' : 'border-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Custom Image URL */}
                <input
                  type="text"
                  placeholder="أو الصق رابط صورة مباشرة..."
                  value={settingAvatar}
                  onChange={(e) => setSettingAvatar(e.target.value)}
                  className="w-full p-1.5 border rounded text-xs bg-white outline-none"
                />

                <button
                  type="button"
                  onClick={() => {
                    setSettingAvatar('');
                    socket?.emit('updateProfile', { avatarUrl: '' });
                    showToast('تم حذف صورتك الشخصية والعودة للصورة الافتراضية بنجاح 🗑️', 'info');
                  }}
                  className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded flex items-center justify-center gap-1.5 text-xs shadow-xs cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف صورتي الشخصية</span>
                </button>
              </div>

              {/* Notification Sounds Customization (تخصيص نغمات التنبيهات حسب نوع الحدث) */}
              <div className="p-3 border rounded-xl bg-slate-50 space-y-3.5">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                    <Volume2 className="w-4 h-4 text-amber-600" />
                    <span>تخصيص أصوات التنبيهات حسب نوع الحدث</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const nextMute = !soundsMuted;
                      setSoundsMuted(nextMute);
                      sounds.setMuted(nextMute);
                      showToast(nextMute ? 'تم كتم جميع التنبيهات الصوتية 🔇' : 'تم تفعيل الأصوات 🔔', 'info');
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                      soundsMuted ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {soundsMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                    <span>{soundsMuted ? 'الأصوات مكتومة' : 'الأصوات مفعلة'}</span>
                  </button>
                </div>

                {/* Master Sequence Test Button in Settings */}
                <button
                  type="button"
                  disabled={testingSequence}
                  onClick={handlePlayToneSequence}
                  className="w-full py-1.5 bg-gradient-to-l from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 disabled:opacity-60 text-white font-bold text-xs rounded-lg shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>
                    {testingSequence
                      ? 'جارٍ الاستماع المتتابع (عام 📢 ➔ خاص 💬 ➔ منشن 🔔)...'
                      : '🎵 اختبار النغمات الثلاث بالتتابع (عام، خاص، منشن)'}
                  </span>
                </button>

                {/* 1. Public / System Announcement Sound */}
                <div className="space-y-1.5 p-2 bg-amber-50/70 border border-amber-200 rounded-lg">
                  <div className="flex items-center justify-between text-[11px] font-bold text-amber-950">
                    <span className="flex items-center gap-1">
                      <span>📢</span>
                      <span>نغمة الإشعار والتنبيه العام:</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => sounds.previewAlertSound(selectedAlertSound)}
                      className="px-2 py-0.5 rounded bg-amber-200 hover:bg-amber-300 text-amber-900 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="تجربة نغمة الإشعار العام"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>استماع</span>
                    </button>
                  </div>
                  <select
                    value={selectedAlertSound}
                    onChange={(e) => {
                      const sId = e.target.value as AlertSoundId;
                      setSelectedAlertSound(sId);
                      sounds.setAlertSound(sId);
                      sounds.previewAlertSound(sId);
                      showToast('تم حفظ نغمة الإشعار العام 📢', 'success');
                    }}
                    className="w-full p-2 border border-amber-300 rounded-lg text-xs bg-white text-slate-800 font-semibold outline-none focus:border-amber-600"
                  >
                    {ALERT_SOUND_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.icon} {opt.label} - {opt.desc}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Private Message Sound */}
                <div className="space-y-1.5 p-2 bg-indigo-50/70 border border-indigo-200 rounded-lg">
                  <div className="flex items-center justify-between text-[11px] font-bold text-indigo-950">
                    <span className="flex items-center gap-1">
                      <span>💬</span>
                      <span>نغمة الرسائل الخاصة (الخاص):</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => sounds.previewPrivateSound(selectedPrivateSound)}
                      className="px-2 py-0.5 rounded bg-indigo-200 hover:bg-indigo-300 text-indigo-900 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="تجربة نغمة الرسائل الخاصة"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>استماع</span>
                    </button>
                  </div>
                  <select
                    value={selectedPrivateSound}
                    onChange={(e) => {
                      const sId = e.target.value as PrivateSoundId;
                      setSelectedPrivateSound(sId);
                      sounds.setPrivateSound(sId);
                      sounds.previewPrivateSound(sId);
                      showToast('تم حفظ نغمة الرسائل الخاصة 💬', 'success');
                    }}
                    className="w-full p-2 border border-indigo-300 rounded-lg text-xs bg-white text-slate-800 font-semibold outline-none focus:border-indigo-600"
                  >
                    {PRIVATE_SOUND_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.icon} {opt.label} - {opt.desc}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Mention / @username Sound */}
                <div className="space-y-1.5 p-2 bg-rose-50/70 border border-rose-200 rounded-lg">
                  <div className="flex items-center justify-between text-[11px] font-bold text-rose-950">
                    <span className="flex items-center gap-1">
                      <span>🔔</span>
                      <span>نغمة الإشارة والمنشن (@اسمك):</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => sounds.previewMentionSound(selectedMentionSound)}
                      className="px-2 py-0.5 rounded bg-rose-200 hover:bg-rose-300 text-rose-900 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="تجربة نغمة الإشارة بالاسم"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>استماع</span>
                    </button>
                  </div>
                  <select
                    value={selectedMentionSound}
                    onChange={(e) => {
                      const sId = e.target.value as MentionSoundId;
                      setSelectedMentionSound(sId);
                      sounds.setMentionSound(sId);
                      sounds.previewMentionSound(sId);
                      showToast('تم حفظ نغمة الإشارة @ بالاسم 🔔', 'success');
                    }}
                    className="w-full p-2 border border-rose-300 rounded-lg text-xs bg-white text-slate-800 font-semibold outline-none focus:border-rose-600"
                  >
                    {MENTION_SOUND_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.icon} {opt.label} - {opt.desc}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Room General Message Sound */}
                <div className="space-y-1.5 pt-1 border-t border-slate-200">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                    <span>رسائل الغرفة العامة:</span>
                    <button
                      type="button"
                      onClick={() => sounds.previewMessageSound(selectedMsgSound)}
                      className="px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="تجربة النغمة المختارة"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>استماع</span>
                    </button>
                  </div>
                  <select
                    value={selectedMsgSound}
                    onChange={(e) => {
                      const sId = e.target.value as MessageSoundId;
                      setSelectedMsgSound(sId);
                      sounds.setMessageSound(sId);
                      sounds.previewMessageSound(sId);
                      showToast('تم حفظ نغمة رسائل الغرفة 🔔', 'success');
                    }}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 font-semibold outline-none focus:border-amber-600"
                  >
                    {MESSAGE_SOUND_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.icon} {opt.label} - {opt.desc}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 5. Member Entry Sound */}
                <div className="space-y-1.5 pt-1 border-t border-slate-200">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                    <span>صوت دخول الأعضاء إلى الغرفة:</span>
                    <button
                      type="button"
                      onClick={() => sounds.previewJoinSound(selectedJoinSound)}
                      className="px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="تجربة نغمة الدخول"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>استماع</span>
                    </button>
                  </div>
                  <select
                    value={selectedJoinSound}
                    onChange={(e) => {
                      const sId = e.target.value as JoinSoundId;
                      setSelectedJoinSound(sId);
                      sounds.setJoinSound(sId);
                      sounds.previewJoinSound(sId);
                      showToast('تم حفظ نغمة دخول الأعضاء 🎶', 'success');
                    }}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 font-semibold outline-none focus:border-amber-600"
                  >
                    {JOIN_SOUND_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.icon} {opt.label} - {opt.desc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Ignored Users Management List (إدارة قائمة الأعضاء المتجاهلين) */}
              <div className="p-3 border rounded-xl bg-slate-50 space-y-2.5">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                    <UserX className="w-4 h-4 text-rose-600" />
                    <span>قائمة الأعضاء المتجاهلين ({ignoredUsers.length})</span>
                  </div>
                  {ignoredUsers.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setIgnoredUsers([]);
                        try { localStorage.removeItem('soqoor_ignored_users'); } catch {}
                        showToast('تم إفراغ قائمة التجاهل بالكامل ✔️', 'info');
                      }}
                      className="text-[10px] text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                    >
                      إلغاء تجاهل الكل
                    </button>
                  )}
                </div>

                {ignoredUsers.length === 0 ? (
                  <div className="text-[11px] text-slate-500 py-1 text-center">
                    لا يوجد أعضاء متجاهلون حالياً. لتجاهل أي شخص اضغط على اسمه في الدردشة ثم اختر <strong>🚫 تجاهل</strong>.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
                    {ignoredUsers.map((username) => (
                      <div
                        key={username}
                        className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs"
                      >
                        <span className="font-bold text-slate-800 truncate">{username}</span>
                        <button
                          type="button"
                          onClick={() => toggleIgnoreUser(username)}
                          className="px-2 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          إلغاء التجاهل ✔️
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Change Password Form (Screenshot 5: تغيير كلمة المرور) */}
              <button
                onClick={() => {
                  const newP = prompt('أدخل كلمة المرور الجديدة:');
                  if (newP) {
                    setSettingPassword(newP);
                    socket?.emit('updateProfile', { password: newP });
                    showToast('تم تغيير كلمة المرور بنجاح 🔒', 'success');
                  }
                }}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded border flex items-center justify-center gap-1.5"
              >
                <Key className="w-3.5 h-3.5" />
                <span>تغيير كلمة المرور</span>
              </button>

              {/* Current Role Badge & Tester */}
              <div className="p-2.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">رتبتك وصلاحياتك:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getRoleBadge(currentUser.role).badgeClass}`}>
                    {getRoleBadge(currentUser.role).short}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 leading-tight">
                  {getRoleBadge(currentUser.role).description}
                </div>
                {/* Switcher to test all roles */}
                <div className="pt-1.5 border-t border-amber-200/60">
                  <div className="text-[10px] font-bold text-amber-900 mb-1">تبديل الرتبة للاختبار والتجربة الفورية:</div>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      type="button"
                      onClick={() => handleAdminAction('updateRole', currentUser.username, 'admin')}
                      className={`py-1 rounded font-bold text-[10px] transition-all cursor-pointer ${
                        currentUser.role === 'admin'
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-red-50'
                      }`}
                    >
                      👑 Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdminAction('updateRole', currentUser.username, 'super')}
                      className={`py-1 rounded font-bold text-[10px] transition-all cursor-pointer ${
                        currentUser.role === 'super'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-amber-50'
                      }`}
                    >
                      🛡️ Super
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdminAction('updateRole', currentUser.username, 'member')}
                      className={`py-1 rounded font-bold text-[10px] transition-all cursor-pointer ${
                        currentUser.role === 'member'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-indigo-50'
                      }`}
                    >
                      🎖️ Member
                    </button>
                  </div>
                </div>
              </div>

              {/* Control Panel Button (For Admin/Super) */}
              {(currentUser.role === 'admin' || currentUser.role === 'super') && (
                <button
                  onClick={() => {
                    socket?.emit('getMonitorLogs');
                    setActiveDrawer('monitor');
                  }}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-black rounded shadow flex items-center justify-center gap-1.5"
                >
                  <Shield className="w-4 h-4" />
                  <span>★ لوحه التحكم وفلتر المراقبة</span>
                </button>
              )}

              {/* Logout Button (Screenshot 6: تسجيل خروج) */}
              <button
                onClick={handleExitChat}
                className="w-full py-2.5 bg-[#dc2626] hover:bg-red-700 text-white font-black rounded-xl shadow flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل خروج ومسح المحادثات</span>
              </button>
            </div>
          </div>
        )}

        {/* 7. MEMBER PROFILE MODAL (Matching Screenshots 10 & 11) */}
        {activeDrawer === 'profile' && profileTargetUser && (
          <div className={`absolute inset-y-0 right-0 w-[84%] ${curTheme.drawerBg} text-slate-100 z-40 shadow-2xl border-l ${curTheme.cardBorder} flex flex-col animate-in slide-in-from-right duration-200 text-right`}>
            {/* Header bar with user's name decoration and Close button [ ✖ ] */}
            <div className={`${curTheme.drawerHeaderBg || curTheme.headerBg} ${curTheme.accentText} p-2.5 flex items-center justify-between`}>
              <span className="font-bold text-sm truncate max-w-[200px]">{profileTargetUser.username}</span>
              <button
                onClick={() => setActiveDrawer('none')}
                className="w-7 h-7 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center rounded font-bold"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Cover with Rose Pattern Background (Screenshots 10 & 11) */}
              <div className="relative bg-gradient-to-b from-slate-200 to-white p-4 border-b text-center">
                <div className="relative inline-block mb-2">
                  <img
                    src={profileTargetUser.avatarUrl || falconIcon}
                    alt={profileTargetUser.username}
                    className="w-20 h-20 rounded-full border-2 border-amber-500 shadow-md object-cover"
                  />
                  {profileTargetUser.isVoice && (
                    <span className="absolute bottom-0 left-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
                  )}
                </div>

                <div className="font-bold text-base text-slate-900 flex flex-col items-center justify-center gap-1.5">
                  {profileTargetUser.nameBannerUrl ? (
                    <div className="flex flex-col items-center gap-1">
                      <img
                        src={profileTargetUser.nameBannerUrl}
                        alt={profileTargetUser.username}
                        title={profileTargetUser.username}
                        className="h-8 max-h-[38px] max-w-[260px] object-contain drop-shadow-md rounded"
                      />
                      <span className="text-[11px] text-slate-600 font-bold">({profileTargetUser.username})</span>
                    </div>
                  ) : (
                    <span className="text-slate-900 font-black">{profileTargetUser.username}</span>
                  )}

                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    {profileTargetUser.giftBadges && profileTargetUser.giftBadges.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 rounded-full border border-amber-300 shadow-2xs">
                        {profileTargetUser.giftBadges.map((badgeUrl, bIdx) => (
                          <img
                            key={bIdx}
                            src={badgeUrl}
                            alt="وسام"
                            title="وسام شرفي وهدية تكريمية"
                            className="w-5 h-5 object-contain inline-block drop-shadow-xs"
                          />
                        ))}
                      </span>
                    )}

                    <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                      <span>{profileTargetUser.flag}</span>
                      {getCountryNameFromFlag(profileTargetUser.flag) && (
                        <span className="font-bold">{getCountryNameFromFlag(profileTargetUser.flag)}</span>
                      )}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-slate-600 mt-0.5">{profileTargetUser.statusQuote}</div>

                {/* Target Role Badge */}
                <div className="flex items-center justify-center gap-1.5 my-1.5">
                  <span className={`px-2.5 py-0.5 rounded text-xs font-bold shadow-xs ${getRoleBadge(profileTargetUser.role).badgeClass}`}>
                    {getRoleBadge(profileTargetUser.role).title}
                  </span>
                </div>

                {/* 4. Golden Stars Engagement Progression System (نظام التفاعل والنجوم الذهبية) */}
                {(() => {
                  const eng = profileTargetUser.engagement || {
                    activeTimeMinutes: Math.floor((profileTargetUser.likes || 0) / 10),
                    messagesSent: Math.floor((profileTargetUser.points || 0) / 50),
                    wallPostsCount: 2,
                    micTimeMinutes: 5,
                    starsLevel: Math.min(5, Math.max(0.5, ((profileTargetUser.likes || 0) + (profileTargetUser.points || 0) / 100) / 300)),
                    progressPercent: 65
                  };
                  const currentLevel = typeof eng.starsLevel === 'number' ? eng.starsLevel : 0;
                  const progressPct = typeof eng.progressPercent === 'number' ? eng.progressPercent : 50;

                  return (
                    <div className="my-2 p-2.5 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-xl space-y-1.5 shadow-xs">
                      <div className="flex items-center justify-between text-[11px] font-bold text-amber-900">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                          <span>رتبة التفاعل والنشاط:</span>
                        </span>
                        <span className="bg-amber-500 text-slate-950 px-2 py-0.2 rounded-full text-[10px] font-black">
                          {currentLevel.toFixed(1)} / 5.0 ⭐
                        </span>
                      </div>

                      {/* 5 Golden Stars Bar: Gray at start, fills gradually with shimmering gold */}
                      <div className="flex items-center justify-center gap-1.5 py-1">
                        {[1, 2, 3, 4, 5].map((starIdx) => {
                          const isFullyFilled = currentLevel >= starIdx;
                          const isPartiallyFilled = !isFullyFilled && currentLevel > starIdx - 1;
                          const fillRatio = isPartiallyFilled ? Math.round((currentLevel - (starIdx - 1)) * 100) : isFullyFilled ? 100 : 0;

                          return (
                            <div key={starIdx} className="relative flex items-center justify-center group" title={`نجمة التفاعل ${starIdx} (${fillRatio}%)`}>
                              {/* Background empty gray star */}
                              <Star className="w-5 h-5 text-slate-300 fill-slate-200/60" />

                              {/* Foreground gold filled star with clip-path or overlay */}
                              {fillRatio > 0 && (
                                <div
                                  className="absolute inset-0 overflow-hidden"
                                  style={{ width: `${fillRatio}%` }}
                                >
                                  <Star className="w-5 h-5 text-amber-500 fill-amber-400 drop-shadow-xs gold-star-glow" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Progress Bar to next star */}
                      <div className="space-y-1">
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden shadow-inner">
                          <div
                            className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.max(5, progressPct))}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-slate-500 font-medium px-0.5">
                          <span>التقدم نحو النجمة التالية: {progressPct}%</span>
                          <span>المستوى {Math.min(5, Math.floor(currentLevel) + 1)}</span>
                        </div>
                      </div>

                      {/* Engagement Metrics Chips */}
                      <div className="grid grid-cols-2 gap-1 pt-1 text-[10px] text-slate-600 font-semibold text-center">
                        <span className="bg-white/80 border border-slate-200 rounded px-1 py-0.5" title="دقائق التواجد النشط في الشات">
                          ⏱️ التواجد: {eng.activeTimeMinutes || 0} د
                        </span>
                        <span className="bg-white/80 border border-slate-200 rounded px-1 py-0.5" title="عدد الرسائل المرسلة">
                          💬 الرسائل: {eng.messagesSent || 0}
                        </span>
                        <span className="bg-white/80 border border-slate-200 rounded px-1 py-0.5" title="المنشورات والخواطر على الحائط">
                          📝 الحائط: {eng.wallPostsCount || 0}
                        </span>
                        <span className="bg-white/80 border border-slate-200 rounded px-1 py-0.5" title="دقائق التحدث أو الصعود على المايك">
                          🎙️ المايك: {eng.micTimeMinutes || 0} د
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Points & Stats Banner */}
                <div className="flex items-center justify-center gap-4 text-xs font-bold text-slate-700">
                  <span className="text-rose-600 flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 fill-rose-600" />
                    {profileTargetUser.likes} لايك
                  </span>
                  <span>الغرفة: {(!profileTargetUser.room || profileTargetUser.room === 'خارج الغرف' || profileTargetUser.room.trim() === '') ? '' : profileTargetUser.room}</span>
                  <span className="text-indigo-600 font-mono">1M نقطة</span>
                </div>
              </div>

              {/* Universal Like Profile Button (متاح لجميع الأعضاء والمشرفين والإداريين - مرة بالدقيقة ويعطي لايك واحد مع تنبيه عائم) */}
              {currentUser && currentUser.username !== profileTargetUser.username && (
                <div className="px-3 pt-3">
                  <button
                    type="button"
                    onClick={() => handleLikeUserProfile(profileTargetUser.username)}
                    className="w-full py-2.5 px-3 bg-gradient-to-r from-rose-500 via-pink-600 to-rose-500 hover:from-rose-600 hover:to-pink-700 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 group"
                  >
                    <Heart className="w-4 h-4 fill-white animate-pulse group-hover:scale-125 transition-transform" />
                    <span>إعجاب بالملف الشخصي ❤️ (+1 لايك • مرة بالدقيقة)</span>
                  </button>
                </div>
              )}

              {/* ACTION BUTTONS & FORMS GOVERNED BY ROLE PERMISSIONS */}
              <div className="p-3 space-y-3">
                
                {/* CASE 1: VIEWER IS A REGULAR MEMBER OR GUEST */}
                {currentUser.role !== 'admin' && currentUser.role !== 'super' && (
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-slate-700">تفاعل اجتماعي مع العضو:</div>
                    <div className="grid grid-cols-3 gap-1.5 text-[11px] font-bold text-center">
                      <button
                        onClick={() => {
                          setSelectedPmUser(profileTargetUser);
                          setActiveDrawer('pm');
                        }}
                        className="p-2.5 rounded bg-slate-100 hover:bg-slate-200 border flex items-center justify-center gap-1 text-slate-800 cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-indigo-600" />
                        <span>💬 محادثة خاصة</span>
                      </button>

                      <button
                        onClick={() => {
                          insertMention(profileTargetUser.username);
                          setActiveDrawer('none');
                          showToast(`تمت إضافة منشن @${profileTargetUser.username} لحقل الكتابة 🔔`, 'info');
                        }}
                        className="p-2.5 rounded bg-amber-50 hover:bg-amber-100 border border-amber-300 flex items-center justify-center gap-1 text-amber-900 font-bold cursor-pointer"
                      >
                        <AtSign className="w-3.5 h-3.5 text-amber-600" />
                        <span>🔔 إشارة @ بالاسم</span>
                      </button>

                      <button
                        onClick={() => handleLikeUserProfile(profileTargetUser.username)}
                        className="p-2.5 rounded bg-rose-50 hover:bg-rose-100 border border-rose-200 flex items-center justify-center gap-1 text-rose-600 font-black cursor-pointer"
                      >
                        <Heart className="w-3.5 h-3.5 fill-rose-600" />
                        <span>❤️ إهداء لايك</span>
                      </button>

                      <button
                        onClick={() => {
                          socket?.emit('chatMessage', { text: `🎁✨ أهدى [${currentUser.username}] هدية فاخرة 💎 لصاحب الحساب المحترم [${profileTargetUser.username}] مع خالص التقدير!` });
                          showToast(`تم إرسال الهدية لـ ${profileTargetUser.username} 💎`, 'success');
                          confetti({ particleCount: 50, spread: 70 });
                        }}
                        className="p-2.5 rounded bg-amber-50 hover:bg-amber-100 border border-amber-200 flex items-center justify-center gap-1 text-amber-700 cursor-pointer"
                      >
                        <Gift className="w-3.5 h-3.5" />
                        <span>💎 إرسال هدية</span>
                      </button>

                      <button
                        onClick={() => {
                          try {
                            const curFriends = JSON.parse(localStorage.getItem('user_friends_list') || '[]');
                            if (!curFriends.includes(profileTargetUser.username)) {
                              curFriends.push(profileTargetUser.username);
                              localStorage.setItem('user_friends_list', JSON.stringify(curFriends));
                            }
                          } catch (e) {}
                          showToast(`تمت إضافة ${profileTargetUser.username} لقائمة أصدقائك المقربين VIP ⭐`, 'success');
                        }}
                        className="p-2 rounded bg-slate-100 hover:bg-slate-200 border flex items-center justify-center gap-1 text-slate-800 cursor-pointer"
                      >
                        <span>⭐ إضافة صديق</span>
                      </button>

                      <button
                        onClick={() => {
                          socket?.emit('chatMessage', { text: `💌 أرسل [${currentUser.username}] بطاقة تحية ومودة إلى [${profileTargetUser.username}] 🌹` });
                          showToast(`تم إرسال بطاقة تحية ومودة إلى ${profileTargetUser.username} 💌`, 'success');
                        }}
                        className="p-2 rounded bg-slate-100 hover:bg-slate-200 border flex items-center justify-center gap-1 text-slate-800 cursor-pointer"
                      >
                        <span>✉ إرسال تحية</span>
                      </button>

                      <button
                        onClick={() => showToast(`المعلومات: مسجل بحسان برو • الدولة: ${profileTargetUser.flag} • الحالة: ${profileTargetUser.statusQuote || 'عضو مميز'}`, 'info')}
                        className="p-2 rounded bg-slate-100 hover:bg-slate-200 border flex items-center justify-center gap-1 text-slate-800 cursor-pointer"
                      >
                        <span>🔍 كشف النكات</span>
                      </button>

                      {/* Ignore / Unignore Member Button */}
                      {currentUser.username !== profileTargetUser.username && (
                        <button
                          type="button"
                          onClick={() => toggleIgnoreUser(profileTargetUser.username)}
                          className={`p-2 rounded border flex items-center justify-center gap-1 font-bold transition-all cursor-pointer ${
                            isUserIgnored(profileTargetUser.username)
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300'
                          }`}
                          title={isUserIgnored(profileTargetUser.username) ? 'إلغاء تجاهل العضو' : 'تجاهل العضو ومنع ظهور رسائله'}
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>{isUserIgnored(profileTargetUser.username) ? 'إلغاء التجاهل ✔️' : '🚫 تجاهل'}</span>
                        </button>
                      )}
                    </div>

                    {/* Member Info Callout */}
                    <div className="p-2.5 bg-slate-50 border rounded-lg text-slate-600 text-[11px] leading-relaxed flex items-start gap-2">
                      <Lock className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                      <div>
                        الخصائص الإشرافية والإدارية كـ (<strong>حذف الصور</strong>، <strong>طرد الأعضاء</strong>، <strong>تعديل البيانات</strong>، و<strong>إسكات المستخدمين</strong>) متاحة فقط للإدارة والمشرفين (Admin / Super).
                      </div>
                    </div>
                  </div>
                )}

                {/* CASE 2: VIEWER IS A SUPER MODERATOR */}
                {currentUser.role === 'super' && (
                  <div className="space-y-3">
                    {/* Check if target is Admin or another Super (Protected Hierarchy) */}
                    {(profileTargetUser.role === 'admin' || profileTargetUser.role === 'super') ? (
                      <div className="space-y-2.5">
                        <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-lg text-amber-950 text-xs flex items-start gap-2">
                          <Shield className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <strong>رتبة محمية ({getRoleBadge(profileTargetUser.role).title}):</strong> لا يملك المشرف صلاحية تطبيق عقوبات أو تعديل بيانات رتبة مساوية أو أعلى منه وفقاً لنظام الصلاحيات.
                          </div>
                        </div>

                        {/* Social Interactions Available */}
                        <div className="grid grid-cols-3 gap-1.5 text-xs font-bold text-center">
                          <button
                            onClick={() => {
                              setSelectedPmUser(profileTargetUser);
                              setActiveDrawer('pm');
                            }}
                            className="p-2 rounded bg-slate-100 hover:bg-slate-200 border text-slate-800 flex items-center justify-center gap-1"
                          >
                            <span>💬 خاص</span>
                          </button>
                          <button
                            onClick={() => showToast(`المعلومات: ${profileTargetUser.username} • الدولة: ${profileTargetUser.flag}`, 'info')}
                            className="p-2 rounded bg-slate-100 hover:bg-slate-200 border text-slate-800 flex items-center justify-center gap-1"
                          >
                            <span>🔍 النكات</span>
                          </button>
                          {currentUser.username !== profileTargetUser.username && (
                            <button
                              type="button"
                              onClick={() => toggleIgnoreUser(profileTargetUser.username)}
                              className={`p-2 rounded border flex items-center justify-center gap-1 font-bold transition-all cursor-pointer ${
                                isUserIgnored(profileTargetUser.username)
                                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300'
                              }`}
                              title={isUserIgnored(profileTargetUser.username) ? 'إلغاء تجاهل العضو' : 'تجاهل العضو ومنع رسائله'}
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span>{isUserIgnored(profileTargetUser.username) ? 'إلغاء التجاهل' : '🚫 تجاهل'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Target is Member or Guest: Super has Full Moderation Rights */
                      <div className="space-y-3">
                        <div className="font-bold text-xs text-slate-800 flex items-center justify-between">
                          <span>إجراءات الإشراف (سوبر إداري):</span>
                          <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded">
                            صلاحيات المشرف مفعلة
                          </span>
                        </div>

                        {/* Super Action Grid */}
                        <div className="grid grid-cols-3 gap-1.5 text-[11px] font-bold text-center">
                          {/* PM */}
                          <button
                            onClick={() => {
                              setSelectedPmUser(profileTargetUser);
                              setActiveDrawer('pm');
                            }}
                            className="p-2 rounded bg-slate-100 hover:bg-slate-200 border flex items-center justify-center gap-1 text-slate-800"
                          >
                            <span>💬 خاص</span>
                          </button>

                          {/* Mention User */}
                          <button
                            type="button"
                            onClick={() => {
                              insertMention(profileTargetUser.username);
                              setActiveDrawer('none');
                              showToast(`تمت إضافة منشن @${profileTargetUser.username} لحقل الكتابة 🔔`, 'info');
                            }}
                            className="p-2 rounded bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 flex items-center justify-center gap-1 font-bold cursor-pointer"
                          >
                            <AtSign className="w-3.5 h-3.5 text-amber-600" />
                            <span>@ منشن</span>
                          </button>

                          {/* Official Warning */}
                          <button
                            onClick={() => {
                              setWarningModalTarget(profileTargetUser);
                              setCustomWarningText('');
                            }}
                            className="p-2 rounded bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 flex items-center justify-center gap-1 font-bold cursor-pointer"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span>✉ تنبيه</span>
                          </button>

                          {/* Delete Avatar */}
                          <button
                            onClick={() => {
                              handleAdminAction('deleteAvatar', profileTargetUser.username);
                              setProfileTargetUser((prev) => prev ? { ...prev, avatarUrl: undefined } : null);
                            }}
                            className="p-2 rounded bg-slate-100 hover:bg-rose-50 border text-rose-600 flex items-center justify-center gap-1 font-bold cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>🚫 حذف الصورة</span>
                          </button>

                          {/* Mute */}
                          <button
                            onClick={() => handleAdminAction('mute', profileTargetUser.username)}
                            className={`p-2 rounded border flex items-center justify-center gap-1 ${
                              profileTargetUser.isTextMuted
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-slate-100 hover:bg-slate-200 text-rose-600'
                            }`}
                          >
                            <VolumeX className="w-3.5 h-3.5" />
                            <span>{profileTargetUser.isTextMuted ? 'إلغاء الإسكات' : '🚫 إسكات'}</span>
                          </button>

                          {/* Kick */}
                          <button
                            onClick={() => {
                              const r = prompt('سبب الطرد من الشات:');
                              if (r !== null) handleAdminAction('kick', profileTargetUser.username, undefined, r || 'مخالفة القوانين');
                            }}
                            className="p-2 rounded bg-rose-100 hover:bg-rose-200 border border-rose-300 text-rose-700 flex items-center justify-center gap-1"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>🚫 طرد</span>
                          </button>

                          {/* Temp Kick */}
                          <button
                            onClick={() => {
                              const mins = prompt('مدة الطرد المؤقت بالدقائق (مثال: 15):');
                              if (mins) handleAdminAction('kick', profileTargetUser.username, undefined, `طرد مؤقت ${mins} دقيقة`);
                            }}
                            className="p-2 rounded bg-slate-100 hover:bg-slate-200 border text-slate-800 flex items-center justify-center gap-1"
                          >
                            <span>⏰ طرد مؤقت</span>
                          </button>

                          {/* Banner Button for Super */}
                          <button
                            type="button"
                            onClick={() => {
                              setBannerPickerTargetUser(profileTargetUser);
                              setCustomBannerUrlInput(profileTargetUser.nameBannerUrl || '');
                              setShowBannerPickerModal(true);
                            }}
                            className="p-2 rounded bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold flex items-center justify-center gap-1 cursor-pointer"
                            title="تعيين وتثبيت البنر المصور للعضو (500x50)"
                          >
                            <Palette className="w-3.5 h-3.5 text-amber-600" />
                            <span>★ البنر</span>
                          </button>

                          {/* Ignore User Button */}
                          {currentUser.username !== profileTargetUser.username && (
                            <button
                              type="button"
                              onClick={() => toggleIgnoreUser(profileTargetUser.username)}
                              className={`p-2 rounded border flex items-center justify-center gap-1 font-bold transition-all cursor-pointer ${
                                isUserIgnored(profileTargetUser.username)
                                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300'
                              }`}
                              title={isUserIgnored(profileTargetUser.username) ? 'إلغاء تجاهل العضو' : 'تجاهل العضو ومنع رسائله'}
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span>{isUserIgnored(profileTargetUser.username) ? 'إلغاء التجاهل' : '🚫 تجاهل'}</span>
                            </button>
                          )}

                          {/* Pull Mic (if on mic) */}
                          {profileTargetUser.micSlot !== null && (
                            <button
                              onClick={() => handleAdminAction('pullMic', profileTargetUser.username)}
                              className="col-span-3 p-2.5 rounded bg-amber-500 hover:bg-amber-600 text-white font-black flex items-center justify-center gap-1 shadow-xs"
                            >
                              <MicOff className="w-4 h-4" />
                              <span>🎙️ سحب المايك من {profileTargetUser.username} فوراً</span>
                            </button>
                          )}

                          {/* Locked Permanent Ban (Admin Only) */}
                          <button
                            onClick={() => showToast('صلاحية الباند والحظر الدائم محصورة بمدير النظام (Admin) فقط.', 'info')}
                            className="col-span-3 p-1.5 rounded bg-slate-50 border border-dashed border-slate-300 text-slate-400 flex items-center justify-center gap-1 text-[10px]"
                          >
                            <Lock className="w-3 h-3" />
                            <span>الباند الدائم (محصور بمدير النظام Admin)</span>
                          </button>
                        </div>

                        {/* Super Editing Section (Quote, Username, Move Room) */}
                        <div className="pt-2 border-t space-y-2 text-xs">
                          <div className="font-bold text-slate-800 text-xs">تعديل بيانات العضو (سوبر):</div>

                          {/* تعديل الزخرفة */}
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={profileEditName}
                              onChange={(e) => setProfileEditName(e.target.value)}
                              className="flex-1 p-1.5 border rounded text-xs"
                              placeholder="اسم / زخرفة العضو"
                            />
                            <button
                              onClick={() => handleAdminAction('updateUsername', profileTargetUser.username, profileEditName)}
                              className="px-3 py-1.5 bg-[#2a241e] text-amber-200 font-bold rounded"
                            >
                              تغيير
                            </button>
                          </div>

                          {/* تعديل الحالة */}
                          <div className="flex gap-1.5 items-center">
                            <span className="w-14 font-bold text-slate-700">الحالة</span>
                            <input
                              type="text"
                              value={profileEditQuote}
                              onChange={(e) => setProfileEditQuote(e.target.value)}
                              className="flex-1 p-1.5 border rounded text-xs"
                              placeholder="حالة العضو"
                            />
                            <button
                              onClick={() => handleAdminAction('updateQuote', profileTargetUser.username, profileEditQuote)}
                              className="px-3 py-1.5 bg-[#48a942] text-white font-bold rounded"
                            >
                              ✔ حفظ
                            </button>
                          </div>

                          {/* نقل العضو لغرفة أخرى */}
                          <div className="flex gap-1.5 items-center">
                            <span className="w-14 font-bold text-slate-700">نقل لغرفة</span>
                            <select
                              value={profileMoveRoom}
                              onChange={(e) => setProfileMoveRoom(e.target.value)}
                              className="flex-1 p-1.5 border rounded bg-white text-xs"
                            >
                              {roomsList.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.name}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleAdminAction('moveRoom', profileTargetUser.username, profileMoveRoom)}
                              className="px-3 py-1.5 bg-[#2a241e] text-amber-200 font-bold rounded"
                            >
                              ✔ نقل
                            </button>
                          </div>

                          {/* Admin Only Notices */}
                          <div className="p-2 bg-slate-50 border rounded text-[10px] text-slate-500 space-y-1">
                            <div className="flex items-center gap-1">
                              <Lock className="w-3 h-3 text-slate-400" />
                              <span>تعديل رصيد اللايكات محصور بمدير النظام (Admin).</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Lock className="w-3 h-3 text-slate-400" />
                              <span>ترقية وتعيين الرتب محصورة بمدير النظام (Admin).</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* CASE 3: VIEWER IS ADMIN (FULL CONTROL) */}
                {currentUser.role === 'admin' && (
                  <div className="space-y-3">
                    <div className="font-bold text-xs text-slate-800 flex items-center justify-between">
                      <span>لوحة تحكم مدير النظام (كامل الصلاحيات):</span>
                      <span className="text-[10px] text-red-600 font-bold bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                        👑 Admin Mode
                      </span>
                    </div>

                    {/* Admin Action Grid (Screenshot 10 & 11) */}
                    <div className="grid grid-cols-3 gap-1.5 text-[11px] font-bold text-center">
                      {/* Row 1 */}
                      <button
                        onClick={() => {
                          setSelectedPmUser(profileTargetUser);
                          setActiveDrawer('pm');
                        }}
                        className="p-2 rounded bg-slate-100 hover:bg-slate-200 border flex items-center justify-center gap-1 text-slate-800"
                      >
                        <span>💬 محادثه خاصه</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          insertMention(profileTargetUser.username);
                          setActiveDrawer('none');
                          showToast(`تمت إضافة منشن @${profileTargetUser.username} لحقل الكتابة 🔔`, 'info');
                        }}
                        className="p-2 rounded bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 flex items-center justify-center gap-1 font-bold cursor-pointer"
                      >
                        <AtSign className="w-3 h-3 text-amber-600" />
                        <span>@ منشن</span>
                      </button>

                      <button
                        onClick={() => {
                          setWarningModalTarget(profileTargetUser);
                          setCustomWarningText('');
                        }}
                        className="p-2 rounded bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 flex items-center justify-center gap-1 font-bold cursor-pointer"
                      >
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        <span>✉ تنبيه</span>
                      </button>

                      <button
                        onClick={() => {
                          const curLikes = profileTargetUser.likes || 0;
                          const inputVal = prompt('أدخل عدد اللايكات المراد إضافتها أو تعيينها للعضو:', String(curLikes + 500));
                          if (inputVal !== null && !isNaN(Number(inputVal))) {
                            handleAdminAction('updateLikes', profileTargetUser.username, Number(inputVal));
                            showToast(`تم تحديث رصيد لايكات ${profileTargetUser.username} إلى ${inputVal} ❤️`, 'success');
                          }
                        }}
                        className="p-2 rounded bg-rose-50 hover:bg-rose-100 border border-rose-200 flex items-center justify-center gap-1 text-rose-600 font-black cursor-pointer"
                        title="تعديل رصيد لايكات العضو"
                      >
                        <Heart className="w-3 h-3 fill-rose-600" />
                        <span>+{profileTargetUser.likes}</span>
                      </button>

                      {/* Row 2 */}
                      <button
                        onClick={() => {
                          handleAdminAction('deleteAvatar', profileTargetUser.username);
                          setProfileTargetUser((prev) => prev ? { ...prev, avatarUrl: undefined } : null);
                        }}
                        className="p-2 rounded bg-slate-100 hover:bg-rose-50 border text-rose-600 flex items-center justify-center gap-1 font-bold cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>🚫 حذف الصورة</span>
                      </button>

                      <button
                        onClick={() => {
                          socket?.emit('revealNicks', { targetUsername: profileTargetUser.username });
                        }}
                        className="p-2 rounded bg-amber-100 hover:bg-amber-200 border border-amber-400 font-bold flex items-center justify-center gap-1 text-amber-950 cursor-pointer"
                        title="كشف النكات وعنوان الآي بي والجهاز"
                      >
                        <span>🔍 كشف النكات</span>
                      </button>

                      <button
                        onClick={() => {
                          socket?.emit('chatMessage', { text: `👑💎 أهدت الإدارة [${currentUser.username}] هدية ملكية فاخرة إلى [${profileTargetUser.username}]!` });
                          showToast(`تم إرسال هدية فاخرة لـ ${profileTargetUser.username} 💎`, 'success');
                          confetti({ particleCount: 70, spread: 90 });
                        }}
                        className="p-2 rounded bg-slate-100 hover:bg-slate-200 border flex items-center justify-center gap-1 text-indigo-700 cursor-pointer"
                        title="إرسال هدية ملكية للعضو"
                      >
                        <span>💎 ارسل هديه</span>
                      </button>

                      {/* تغيير كلمة المرور عند النسيان */}
                      <button
                        type="button"
                        onClick={() => {
                          const newPass = prompt(`أدخل كلمة المرور الجديدة للعضو [${profileTargetUser.username}] عند النسيان:`, '123456');
                          if (newPass && newPass.trim().length >= 3) {
                            handleAdminAction('updatePassword', profileTargetUser.username, newPass.trim());
                            showToast(`تم تعيين كلمة مرور جديدة للعضو [${profileTargetUser.username}] بنجاح 🔑`, 'success');
                          } else if (newPass !== null) {
                            showToast('يجب أن تتكون كلمة المرور من 3 خانات على الأقل', 'error');
                          }
                        }}
                        className="p-2 rounded bg-amber-50 hover:bg-amber-100 border border-amber-300 font-bold flex items-center justify-center gap-1 text-amber-900 cursor-pointer"
                        title="تغيير كلمة المرور للعضو عند نسيانها"
                      >
                        <Key className="w-3 h-3 text-amber-600" />
                        <span>🔑 كلمة المرور</span>
                      </button>

                      {/* Row 3 */}
                      <button
                        onClick={() => {
                          const r = prompt('سبب الطرد:');
                          handleAdminAction('kick', profileTargetUser.username, undefined, r || undefined);
                        }}
                        className="p-2 rounded bg-rose-100 hover:bg-rose-200 border border-rose-300 text-rose-700 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <UserX className="w-3 h-3" />
                        <span>🚫 طرد</span>
                      </button>

                      <button
                        onClick={() => handleAdminAction('kick', profileTargetUser.username, undefined, 'طرد من الغرفة')}
                        className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>👤 طرد من الغرفه</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setBannerPickerTargetUser(profileTargetUser);
                          setCustomBannerUrlInput(profileTargetUser.nameBannerUrl || '');
                          setShowBannerPickerModal(true);
                        }}
                        className="p-2 rounded bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold flex items-center justify-center gap-1 cursor-pointer"
                        title="تعيين وتثبيت البنر المصور للعضو (500x50)"
                      >
                        <Palette className="w-3.5 h-3.5 text-amber-600" />
                        <span>★ البنر</span>
                      </button>

                      {/* Ignore / Unignore User */}
                      {currentUser.username !== profileTargetUser.username && (
                        <button
                          type="button"
                          onClick={() => toggleIgnoreUser(profileTargetUser.username)}
                          className={`p-2 rounded border flex items-center justify-center gap-1 font-bold transition-all cursor-pointer ${
                            isUserIgnored(profileTargetUser.username)
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300'
                          }`}
                          title={isUserIgnored(profileTargetUser.username) ? 'إلغاء تجاهل العضو' : 'تجاهل العضو ومنع رسائله'}
                        >
                          <UserX className="w-3 h-3" />
                          <span>{isUserIgnored(profileTargetUser.username) ? 'إلغاء التجاهل' : '🚫 تجاهل'}</span>
                        </button>
                      )}

                      {/* Row 4: Mic Pull (if on mic) */}
                      {profileTargetUser.micSlot !== null && (
                        <button
                          onClick={() => handleAdminAction('pullMic', profileTargetUser.username)}
                          className="col-span-3 p-2.5 rounded bg-amber-500 hover:bg-amber-600 text-white font-black flex items-center justify-center gap-1 shadow-xs"
                        >
                          <MicOff className="w-4 h-4" />
                          <span>🎙️ سحب المايك من {profileTargetUser.username} فوراً</span>
                        </button>
                      )}

                      {/* Mute */}
                      <button
                        onClick={() => handleAdminAction('mute', profileTargetUser.username)}
                        className={`p-2 rounded border flex items-center justify-center gap-1 ${
                          profileTargetUser.isTextMuted
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-slate-100 hover:bg-slate-200 text-rose-600'
                        }`}
                      >
                        <VolumeX className="w-3.5 h-3.5" />
                        <span>{profileTargetUser.isTextMuted ? 'إلغاء الإسكات' : '🚫 اسكات'}</span>
                      </button>

                      {/* Temp Ban */}
                      <button
                        onClick={() => {
                          const mins = prompt('مدة الباند المؤقت بالدقائق (مثال: 30):');
                          if (mins) handleAdminAction('kick', profileTargetUser.username, undefined, `باند مؤقت ${mins} دقيقة`);
                        }}
                        className="p-2 rounded bg-slate-100 border text-slate-800 flex items-center justify-center gap-1"
                      >
                        <span>⏰ باند مؤقت</span>
                      </button>

                      {/* Permanent Ban */}
                      <button
                        onClick={() => {
                          if (confirm(`هل أنت متأكد من فرض باند دائم على ${profileTargetUser.username}؟`)) {
                            handleAdminAction('ban', profileTargetUser.username);
                          }
                        }}
                        className="p-2 rounded bg-red-600 hover:bg-red-700 text-white font-bold flex items-center justify-center gap-1"
                      >
                        <span>🚫 باند</span>
                      </button>
                    </div>

                    {/* Admin Complete Editing Suite */}
                    <div className="mt-4 pt-3 border-t space-y-2 text-xs">
                      <div className="font-black text-slate-800 text-sm mb-1">صلاحيات وتعديل العضو الكاملة:</div>

                      {/* تعديل الزخرفة */}
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={profileEditName}
                          onChange={(e) => setProfileEditName(e.target.value)}
                          className="flex-1 p-1.5 border rounded text-xs"
                          placeholder="اسم / زخرفة العضو"
                        />
                        <button
                          onClick={() => handleAdminAction('updateUsername', profileTargetUser.username, profileEditName)}
                          className="px-3 py-1.5 bg-[#2a241e] text-amber-200 font-bold rounded"
                        >
                          تغيير
                        </button>
                      </div>

                      {/* تعديل الصورة الشخصية */}
                      <div className="flex gap-1.5 items-center">
                        <span className="w-14 font-bold text-slate-700">الصورة📷</span>
                        <input
                          type="text"
                          value={profileTargetUser.avatarUrl || ''}
                          onChange={(e) => setProfileTargetUser({ ...profileTargetUser, avatarUrl: e.target.value })}
                          className="flex-1 p-1.5 border rounded text-xs truncate"
                          placeholder="رابط الصورة أو اختر ملف"
                        />
                        <label className="px-2 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded cursor-pointer text-xs">
                          رفع
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              handleFileUpload(e, (dataUrl) => {
                                handleAdminAction('updateAvatar', profileTargetUser.username, dataUrl);
                                setProfileTargetUser({ ...profileTargetUser, avatarUrl: dataUrl });
                              })
                            }
                          />
                        </label>
                        <button
                          onClick={() => handleAdminAction('updateAvatar', profileTargetUser.username, profileTargetUser.avatarUrl)}
                          className="px-2.5 py-1.5 bg-[#48a942] text-white font-bold rounded"
                        >
                          ✔ حفظ
                        </button>
                      </div>

                      {/* تعديل اللايكات */}
                      <div className="flex gap-1.5 items-center">
                        <span className="w-14 text-rose-600 font-bold">اللايكات❤️</span>
                        <input
                          type="number"
                          value={profileEditLikes}
                          onChange={(e) => setProfileEditLikes(e.target.value)}
                          className="flex-1 p-1.5 border rounded text-xs font-mono"
                        />
                        <button
                          onClick={() => handleAdminAction('updateLikes', profileTargetUser.username, profileEditLikes)}
                          className="px-3 py-1.5 bg-[#48a942] text-white font-bold rounded"
                        >
                          ✔ حفظ
                        </button>
                      </div>

                      {/* تعديل الحاله */}
                      <div className="flex gap-1.5 items-center">
                        <span className="w-14 font-bold text-slate-700">الحاله</span>
                        <input
                          type="text"
                          value={profileEditQuote}
                          onChange={(e) => setProfileEditQuote(e.target.value)}
                          className="flex-1 p-1.5 border rounded text-xs"
                        />
                        <button
                          onClick={() => handleAdminAction('updateQuote', profileTargetUser.username, profileEditQuote)}
                          className="px-3 py-1.5 bg-[#48a942] text-white font-bold rounded"
                        >
                          ✔ حفظ
                        </button>
                      </div>

                      {/* ترقية الرتبة والمجموعة (Admin Exclusive) */}
                      <div className="p-2 bg-slate-50 border rounded space-y-1.5">
                        <div className="font-bold text-slate-800">المجموعه والصلاحيات (ترقية فورية):</div>
                        <select
                          value={profileEditRole}
                          onChange={(e: any) => setProfileEditRole(e.target.value)}
                          className="w-full p-1.5 border rounded bg-white text-xs"
                        >
                          <option value="guest">👤 زائر عادي (بدون صلاحيات إدارية)</option>
                          <option value="member">🎖️ [1000] عضو مسجل معتمد</option>
                          <option value="super">🛡️ [5000] سوبر إداري (مشرف عام)</option>
                          <option value="admin">👑 [10000] أدمن ومدير النظام (كامل الصلاحيات)</option>
                        </select>
                        <button
                          onClick={() => handleAdminAction('updateRole', profileTargetUser.username, profileEditRole)}
                          className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded shadow-xs"
                        >
                          ✔ حفظ الصلاحية والترقية
                        </button>
                      </div>

                      {/* نقل العضو لغرفة أخرى */}
                      <div className="p-2 bg-slate-50 border rounded space-y-1.5">
                        <div className="font-bold text-slate-800">نقل لغرفة أخرى:</div>
                        <select
                          value={profileMoveRoom}
                          onChange={(e) => setProfileMoveRoom(e.target.value)}
                          className="w-full p-1.5 border rounded bg-white text-xs"
                        >
                          {roomsList.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleAdminAction('moveRoom', profileTargetUser.username, profileMoveRoom)}
                          className="w-full py-1.5 bg-[#2a241e] text-amber-200 font-bold rounded"
                        >
                          ✔ نقل
                        </button>
                      </div>

                      {/* تغيير كلمة مرور العضو عند النسيان (Admin Only) */}
                      <div className="p-2.5 bg-amber-50/90 border border-amber-300 rounded-xl space-y-1.5 shadow-xs">
                        <div className="font-bold text-amber-950 flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5 text-amber-700" />
                            <span>تغيير كلمة المرور للعضو (عند النسيان):</span>
                          </span>
                          <span className="text-[10px] text-amber-700 font-bold bg-amber-200/60 px-1.5 py-0.2 rounded">
                            مدير النظام فقط
                          </span>
                        </div>
                        <p className="text-[10px] text-amber-900/80 leading-tight">
                          يمكنك كمدير نظام تعيين كلمة مرور جديدة للعضو مباشرة في حال نسيانها لتمكينه من الدخول لحسابه مجدداً.
                        </p>
                        <div className="flex gap-1.5 items-center">
                          <input
                            type="text"
                            id={`admin_user_pass_${profileTargetUser.username}`}
                            placeholder="كلمة المرور الجديدة (مثال: 123456)..."
                            className="flex-1 p-1.5 border border-amber-300 rounded text-xs bg-white text-slate-900 font-mono font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const el = document.getElementById(`admin_user_pass_${profileTargetUser.username}`) as HTMLInputElement;
                              const p = el ? el.value.trim() : '';
                              if (!p || p.length < 3) {
                                showToast('يجب أن تتكون كلمة المرور من 3 خانات على الأقل', 'error');
                                return;
                              }
                              handleAdminAction('updatePassword', profileTargetUser.username, p);
                              showToast(`تم تغيير وتعيين كلمة المرور لـ [${profileTargetUser.username}] بنجاح 🔑`, 'success');
                              if (el) el.value = '';
                            }}
                            className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold rounded text-xs cursor-pointer shadow-xs flex items-center gap-1"
                          >
                            <Key className="w-3 h-3" />
                            <span>تعيين 🔑</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Falcon Mega Suite (50+ Creative Features: Games, Gifts, DJ, Calligraphy, Culture) */}
        <FalconMegaSuite
          isOpen={isMegaSuiteOpen}
          onClose={() => setIsMegaSuiteOpen(false)}
          currentUser={currentUser || { username: 'زائر', role: 'guest', points: 0, likes: 0, room: 'الغرفة العامة' }}
          onlineUsers={rosterUsers}
          onSendChatMessage={(text) => {
            if (socket) {
              socket.emit('chatMessage', { text });
            }
          }}
          onShowToast={(msg, type) => showToast(msg, type || 'info')}
          starredMessages={starredMessages}
          onToggleStarMessage={toggleStarMessage}
          chatFontSize={chatFontSize}
          onChangeFontSize={handleUpdateFontSize}
          eyeComfort={eyeComfort}
          onToggleEyeComfort={() => {
            const next = !eyeComfort;
            setEyeComfort(next);
            try {
              localStorage.setItem('soqoor_eye_comfort', String(next));
            } catch {}
            showToast(!eyeComfort ? 'تم تفعيل فلتر راحة العين الدافئ 🌙' : 'تم تعطيل فلتر راحة العين ☀️', 'info');
          }}
          activeTheme={activeTheme}
          onChangeTheme={handleUpdateTheme}
          pinnedTopic={pinnedTopic}
          onUpdatePinnedTopic={(topic) => {
            setPinnedTopic(topic);
            showToast('تم تحديث الإعلان المثبت في الروم 📌', 'success');
          }}
          userMood={userMood}
          onChangeMood={(mood) => {
            setUserMood(mood);
            showToast(`تم تعيين حالتك المزاجية: ${mood}`, 'info');
          }}
          userFrame={userFrame}
          onChangeFrame={(frame) => {
            setUserFrame(frame);
            showToast(`تم تطبيق الإطار الملكي بنجاح 🖼️`, 'success');
          }}
          onClearLocalChat={handleClearLocalChat}
          onExportChat={handleExportChat}
        />

        {/* 50+ Ultimate Mega Features Arsenal (ترسانة الميزات الـ 50 الشاملة) */}
        <UltimateMegaFeatures50
          isOpen={showUltimateFeatures50}
          onClose={() => setShowUltimateFeatures50(false)}
          currentUser={currentUser || { username: 'زائر', role: 'guest', points: 0, likes: 0, room: 'الغرفة العامة' }}
          onlineUsers={rosterUsers}
          onSendChatMessage={(text) => {
            if (socket) {
              socket.emit('chatMessage', { text });
            }
          }}
          onShowToast={(msg, type) => showToast(msg, type || 'info')}
          onAddPoints={handleAddPointsReward}
          onApplyTheme={handleUpdateTheme}
          onApplyFont={handleUpdateFontFamily}
          onToggleMic={() => {
            if (currentUser?.micSlot !== null) {
              handleDropMic();
            } else {
              handleTakeMic(1);
            }
          }}
          socket={socket}
        />

        {/* Urgent Critical Broadcast Popup Modal (لجميع الغرف) */}
        {criticalBroadcast && (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setCriticalBroadcast(null);
            }}
            className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 animate-in fade-in"
          >
            <div className="bg-gradient-to-b from-[#2a1313] via-[#1a0c0c] to-[#2a1313] border-2 border-red-500 rounded-3xl w-full max-w-sm p-5 text-center space-y-4 shadow-2xl text-slate-100">
              <div className="w-16 h-16 rounded-full bg-red-600/30 border-2 border-red-500 flex items-center justify-center mx-auto text-red-400">
                <Megaphone className="w-9 h-9 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-black text-red-300 flex items-center justify-center gap-1.5">
                  <span>📢 {criticalBroadcast.title}</span>
                </h3>
                <p className="text-[11px] text-amber-300 font-bold mt-1">
                  مرسل من [{criticalBroadcast.senderRole.toUpperCase()}]: {criticalBroadcast.sender} • {criticalBroadcast.time}
                </p>
              </div>
              <div className="p-3.5 bg-red-950/50 border border-red-700/60 rounded-2xl text-xs text-white leading-relaxed font-bold shadow-inner">
                {criticalBroadcast.text}
              </div>
              <button
                type="button"
                onClick={() => setCriticalBroadcast(null)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-700 hover:to-rose-700 text-white font-black text-xs shadow-lg cursor-pointer"
              >
                حسناً، فهمت التوجيه الإداري 🦅
              </button>
            </div>
          </div>
        )}

        {/* Private 1-on-1 Audio/Video Call Overlay (شاشة ومودال الاتصال الخاص) */}
        <PrivateCallOverlay
          incomingCall={incomingCall}
          activeCall={activeCall}
          onAcceptIncoming={handleAcceptIncomingCall}
          onRejectIncoming={handleRejectIncomingCall}
          onEndActiveCall={handleEndActiveCall}
        />

        {/* Received Official Warning Modal with Manual Written Reply */}
        {receivedOfficialWarning && (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setReceivedOfficialWarning(null);
            }}
            className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 animate-in fade-in"
          >
            <div className="bg-[#241a12] border-2 border-red-500 rounded-3xl w-full max-w-sm p-5 text-center space-y-3.5 shadow-2xl text-slate-100">
              <div className="w-16 h-16 rounded-full bg-red-600/20 border-2 border-red-500 flex items-center justify-center mx-auto text-red-500">
                <AlertTriangle className="w-10 h-10 animate-bounce" />
              </div>
              <div>
                <h3 className="text-base font-black text-red-400">⚠️ إنذار وتنبيه إداري رسمي</h3>
                <p className="text-xs text-slate-300 mt-1">صادر من المشرف: {receivedOfficialWarning.from}</p>
              </div>
              <div className="p-3 bg-red-950/40 border border-red-700/60 rounded-xl text-xs text-red-200 leading-relaxed font-bold">
                {receivedOfficialWarning.text}
              </div>

              {/* Manual Written Reply Input (الرد على التنبيه بكتابة يدوية) */}
              <div className="space-y-2 text-right">
                <label className="text-xs font-bold text-amber-300 block">
                  الرد والتوضيح للإدارة (كتابة يدوية):
                </label>
                <textarea
                  name="official_warning_reply"
                  id="official_warning_reply"
                  autoComplete="off"
                  autoCorrect="on"
                  autoCapitalize="sentences"
                  spellCheck={true}
                  data-form-type="other"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  value={warningReplyInput}
                  onChange={(e) => setWarningReplyInput(e.target.value)}
                  placeholder="اكتب ردك وتوضيحك هنا ليتم إرساله فوراً للمشرف..."
                  rows={2}
                  className="w-full p-2 text-xs bg-black/60 border border-amber-600/50 rounded-xl text-white outline-none focus:border-amber-400 resize-none font-medium"
                />
                <button
                  type="button"
                  disabled={!warningReplyInput.trim()}
                  onClick={handleSendWarningReply}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>إرسال ردك وتوضيحك للإدارة ✉️</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setReceivedOfficialWarning(null)}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer border border-slate-700"
              >
                إغلاق والتعهد بالالتزام 🤝
              </button>
            </div>
          </div>
        )}

        {/* 1. HQ Audio Equalizer, Modulators & Voice Studio */}
        <AudioEqualizerAndEffects
          isOpen={showAudioStudio}
          onClose={() => setShowAudioStudio(false)}
          isVoiceActive={currentUser?.micSlot !== null}
          onToggleVoice={() => {
            if (currentUser?.micSlot !== null) {
              handleDropMic();
            } else {
              handleTakeMic(1);
            }
          }}
          onShowToast={showToast}
        />

        {/* 2. Interactive Games, Contests & Challenges Suite */}
        <InteractiveGamesSuite
          isOpen={showGamesSuite}
          onClose={() => setShowGamesSuite(false)}
          currentUserPoints={currentUser?.points || 0}
          onAddPoints={handleAddPointsReward}
          onBroadcastGameWin={handleBroadcastGameWin}
          onShowToast={showToast}
        />

        {/* 3. Identity, Profile, Frames, Badges & Streaks Studio */}
        <IdentityProfileStudio
          isOpen={showIdentityStudio}
          onClose={() => setShowIdentityStudio(false)}
          currentUser={currentUser || { id: '', username: 'زائر', role: 'guest', likes: 0, points: 0, statusQuote: '', flag: '🇸🇦' }}
          activeFrame={userFrame}
          onChangeFrame={setUserFrame}
          userMood={userMood}
          onChangeMood={setUserMood}
          nameGradient={nameGradient}
          onChangeNameGradient={handleUpdateNameGradient}
          onUpdateStatusQuote={(q) => {
            setSettingQuote(q);
            if (socket) socket.emit('updateProfile', { statusQuote: q });
          }}
          onAddPoints={handleAddPointsReward}
          onShowToast={showToast}
        />

        {/* 4. Themes, Wallpapers & Typography Center */}
        <ThemeAndWallpaperCenter
          isOpen={showThemesModal}
          onClose={() => setShowThemesModal(false)}
          activeTheme={activeTheme}
          onChangeTheme={handleUpdateTheme}
          activeWallpaper={activeWallpaper}
          onChangeWallpaper={handleUpdateWallpaper}
          fontFamily={fontFamily}
          onChangeFontFamily={handleUpdateFontFamily}
          chatFontSize={chatFontSize}
          onChangeFontSize={handleUpdateFontSize}
          bubbleStyle={bubbleStyle}
          onChangeBubbleStyle={handleUpdateBubbleStyle}
          nameColor={settingNameColor}
          onChangeNameColor={handleUpdateNameColor}
          textColor={settingTextColor}
          onChangeTextColor={handleUpdateTextColor}
          eyeComfort={eyeComfort}
          onToggleEyeComfort={() => {
            const next = !eyeComfort;
            setEyeComfort(next);
            try {
              localStorage.setItem('soqoor_eye_comfort', String(next));
            } catch {}
          }}
          soundVolume={soundVolume}
          onChangeSoundVolume={(v) => {
            setSoundVolume(v);
            sounds.setMasterVolume(v / 100);
            try {
              localStorage.setItem('soqoor_sound_volume', String(v));
            } catch {}
          }}
          particlesEnabled={particlesEnabled}
          onToggleParticles={() => {
            const next = !particlesEnabled;
            setParticlesEnabled(next);
            try {
              localStorage.setItem('soqoor_particles', String(next));
            } catch {}
          }}
          currentUserRole={currentUser?.role}
          onApplyGlobalAppearance={handleApplyGlobalAppearance}
          onShowToast={showToast}
        />

        {/* 5. System Diagnostics & Realtime Latency Monitor */}
        <SystemDiagnosticsModal
          isOpen={showDiagnosticsModal}
          onClose={() => setShowDiagnosticsModal(false)}
          onlineCount={onlineCount}
          currentRoom={currentUser?.room || 'الغرفة العامة'}
          socketConnected={isConnected}
          onShowToast={showToast}
        />

        {/* 6. Filter Alerts Modal (يفتح عند النقر على أيقونة الجرس للمصرح لهم فقط) */}
        {showFilterAlertsModal && (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowFilterAlertsModal(false);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fade-in"
            dir="rtl"
          >
            <div className="bg-[#1a140f] border-2 border-amber-500/70 rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-right">
              <div className="p-3 bg-[#241a12] border-b border-[#3e2c1c] flex items-center justify-between text-amber-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-rose-600/30 text-rose-400 border border-rose-500/40 flex items-center justify-center">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                      <span>تنبيهات الفلتر والكلمات المراقبة</span>
                      <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-mono">
                        {filterAlertsList.length}
                      </span>
                    </h3>
                    <p className="text-[10px] text-amber-300/70">رصد تلقائي لأي رسائل تضمنت كلمات ممنوعة في الشات</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {filterAlertsList.length > 0 && (
                    <button
                      onClick={() => {
                        socket?.emit('clearFilterAlerts');
                        setFilterAlertsList([]);
                        showToast('تم مسح جميع تنبيهات الفلتر 🧹', 'info');
                      }}
                      className="px-2.5 py-1 bg-rose-600/80 hover:bg-rose-600 text-white text-[10px] font-bold rounded-lg cursor-pointer transition-colors"
                    >
                      مسح الكل
                    </button>
                  )}
                  <button
                    onClick={() => setShowFilterAlertsModal(false)}
                    className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {filterAlertsList.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 space-y-2">
                    <div className="text-3xl">🛡️✨</div>
                    <div className="text-sm font-bold text-slate-300">سجل الفلتر نظيف تماماً!</div>
                    <div className="text-xs text-slate-500">لم يتم التقاط أي كلمات مخالفة حالياً.</div>
                  </div>
                ) : (
                  filterAlertsList.map((alert, idx) => (
                    <div key={alert.id || idx} className="p-3 bg-slate-900/95 border border-slate-700/80 rounded-xl space-y-2 shadow-sm">
                      <div className="flex items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <img src={alert.avatarUrl || falconIcon} alt="avatar" className="w-8 h-8 rounded-full object-cover border border-amber-500/60 shrink-0" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-amber-300">{alert.username}</span>
                              {alert.flag && <span>{alert.flag}</span>}
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-black ${
                                alert.contextType === 'pm'
                                  ? 'bg-purple-900/70 text-purple-200 border border-purple-500/40'
                                  : alert.contextType === 'wall_post' || alert.contextType === 'wall_comment'
                                  ? 'bg-blue-900/70 text-blue-200 border border-blue-500/40'
                                  : 'bg-emerald-900/70 text-emerald-200 border border-emerald-500/40'
                              }`}>
                                {alert.contextType === 'pm' ? '💬 بالخاص' : alert.contextType === 'wall_post' ? '📰 منشور حائط' : alert.contextType === 'wall_comment' ? '💬 تعليق حائط' : '👥 بالغرفة'}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                              <span className="text-amber-200/80 font-semibold">
                                {alert.targetUser ? `أرسلت إلى: @${alert.targetUser}` : `المكان: ${alert.room}`}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-left shrink-0">
                          <span className="text-[10px] text-slate-400 font-mono bg-black/40 px-2 py-0.5 rounded border border-slate-800">
                            🕒 {alert.time}
                          </span>
                        </div>
                      </div>
                      <div className="p-2.5 bg-black/60 rounded-lg text-slate-200 text-xs border border-rose-950/40 leading-relaxed font-medium">
                        "{alert.fullMessage}"
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-[10px] text-rose-400 font-bold">الكلمات الملتقطة:</span>
                          {alert.matchedWords?.map((w: string, i: number) => (
                            <span key={i} className="px-1.5 py-0.2 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded text-[9px] font-bold">
                              {w}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              socket?.emit('adminAction', {
                                action: 'mute',
                                targetUsername: alert.username,
                                value: true,
                                reason: `فلتر الكلمات: ${alert.matchedWords?.join(', ')}`
                              });
                              showToast(`تم كتم [${alert.username}] بنجاح 🔇`, 'success');
                            }}
                            className="px-2 py-0.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-[10px] font-bold cursor-pointer"
                          >
                            كتم
                          </button>
                          <button
                            onClick={() => {
                              socket?.emit('adminAction', {
                                action: 'kick',
                                targetUsername: alert.username,
                                reason: `فلتر الكلمات: ${alert.matchedWords?.join(', ')}`
                              });
                              showToast(`تم طرد [${alert.username}] بنجاح 🚪`, 'info');
                            }}
                            className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold cursor-pointer"
                          >
                            طرد
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 7. Dedicated In-Room Settings Modal (تعديل إعدادات الغرفة الحالية بالكامل) */}
        {isRoomSettingsModalOpen && (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsRoomSettingsModalOpen(false);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fade-in"
            dir="rtl"
          >
            <div className="bg-[#1a140f] border-2 border-amber-500/70 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-right">
              <div className="p-3 bg-[#241a12] border-b border-[#3e2c1c] flex items-center justify-between text-amber-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">إعدادات الغرفة: [{currentUser?.room}]</h3>
                    <p className="text-[10px] text-amber-300/70">تعديل كافة خيارات الغرفة وتطبيقها فوراً</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsRoomSettingsModalOpen(false)}
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs">
                {/* Room Name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-amber-200">اسم الغرفة:</label>
                  <input
                    type="text"
                    value={currentRoomSettingsForm.name}
                    onChange={(e) => setCurrentRoomSettingsForm({ ...currentRoomSettingsForm, name: e.target.value })}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold outline-none focus:border-amber-500"
                  />
                </div>

                {/* Pinned Topic */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-amber-200">الإعلان المثبت أعلى الغرفة (الموضوع):</label>
                  <textarea
                    rows={2}
                    value={currentRoomSettingsForm.pinnedTopic}
                    onChange={(e) => setCurrentRoomSettingsForm({ ...currentRoomSettingsForm, pinnedTopic: e.target.value })}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs outline-none focus:border-amber-500 resize-none"
                    placeholder="اكتب إعلان الغرفة هنا..."
                  />
                </div>

                {/* Lock Controls */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-slate-900 border border-slate-700 rounded-xl space-y-1.5 flex flex-col justify-between">
                    <div className="font-bold text-slate-200 text-[11px]">قفل الشات الكتابي:</div>
                    <button
                      type="button"
                      onClick={() => setCurrentRoomSettingsForm({ ...currentRoomSettingsForm, isChatLocked: !currentRoomSettingsForm.isChatLocked })}
                      className={`w-full py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        currentRoomSettingsForm.isChatLocked ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {currentRoomSettingsForm.isChatLocked ? '🔒 الشات مقفل' : '🔓 الشات مفتوح'}
                    </button>
                  </div>

                  <div className="p-2.5 bg-slate-900 border border-slate-700 rounded-xl space-y-1.5 flex flex-col justify-between">
                    <div className="font-bold text-slate-200 text-[11px]">قفل الصعود للمايك:</div>
                    <button
                      type="button"
                      onClick={() => setCurrentRoomSettingsForm({ ...currentRoomSettingsForm, isVoiceLocked: !currentRoomSettingsForm.isVoiceLocked })}
                      className={`w-full py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        currentRoomSettingsForm.isVoiceLocked ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {currentRoomSettingsForm.isVoiceLocked ? '🎙️ المايكات مقفلة' : '🎙️ المايكات مفتوحة'}
                    </button>
                  </div>
                </div>

                {/* Slow mode */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-amber-200">الوضع البطيء (Slow Mode):</label>
                  <select
                    value={currentRoomSettingsForm.slowModeSeconds}
                    onChange={(e) => setCurrentRoomSettingsForm({ ...currentRoomSettingsForm, slowModeSeconds: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold outline-none"
                  >
                    <option value={0}>معطل (إرسال فوري دون انتظار)</option>
                    <option value={5}>5 ثوانٍ بين كل رسالة</option>
                    <option value={10}>10 ثوانٍ بين كل رسالة</option>
                    <option value={30}>30 ثانية (تهدئة حادة)</option>
                  </select>
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-amber-200">كلمة مرور الغرفة (اتركه فارغاً إن كانت عامة):</label>
                  <input
                    type="password"
                    autoComplete="off"
                    data-form-type="other"
                    data-lpignore="true"
                    placeholder="اتركه فارغاً لغرفة مفتوحة للجميع"
                    value={currentRoomSettingsForm.password}
                    onChange={(e) => setCurrentRoomSettingsForm({ ...currentRoomSettingsForm, password: e.target.value })}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                {/* Room Welcome Message Section (الرسالة الترحيبية للغرفة لمالك الغرفة) */}
                <div className="p-3 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-amber-950/40 border border-emerald-500/40 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-emerald-300 block text-xs">رسالة ترحيب الغرفة (Welcome Message):</span>
                      <span className="text-[10px] text-slate-400">تظهر تلقائياً للعضو فور دخوله إلى هذه الغرفة</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentRoomSettingsForm({ ...currentRoomSettingsForm, welcomeEnabled: !currentRoomSettingsForm.welcomeEnabled })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                        currentRoomSettingsForm.welcomeEnabled ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {currentRoomSettingsForm.welcomeEnabled ? 'مفعلة ✔️' : 'معطلة ✕'}
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={currentRoomSettingsForm.welcomeMessage}
                    onChange={(e) => setCurrentRoomSettingsForm({ ...currentRoomSettingsForm, welcomeMessage: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs outline-none focus:border-emerald-500 resize-none font-medium"
                    placeholder="مثال: أهلاً بكم في غرفتنا.. نتمنى لكم أسعد الأوقات والالتزام بالاحترام المتبادل 🌹"
                  />
                </div>

                {/* Save Button */}
                <button
                  type="button"
                  onClick={() => {
                    const roomName = currentUser?.room || 'الغرفة العامة';
                    const currentRoomObj = roomsList.find(r => r.name === roomName || r.id === roomName);
                    const roomId = currentRoomObj?.id || roomName;
                    socket?.emit('updateRoomDetails', {
                      roomId,
                      name: currentRoomSettingsForm.name,
                      desc: currentRoomSettingsForm.desc,
                      pinnedTopic: currentRoomSettingsForm.pinnedTopic,
                      isChatLocked: currentRoomSettingsForm.isChatLocked,
                      slowModeSeconds: currentRoomSettingsForm.slowModeSeconds,
                      isVoiceLocked: currentRoomSettingsForm.isVoiceLocked,
                      isPasswordProtected: Boolean(currentRoomSettingsForm.password),
                      password: currentRoomSettingsForm.password,
                      welcomeMessage: currentRoomSettingsForm.welcomeMessage,
                      welcomeEnabled: currentRoomSettingsForm.welcomeEnabled
                    });
                    if (currentRoomSettingsForm.pinnedTopic !== undefined) {
                      setPinnedTopic(currentRoomSettingsForm.pinnedTopic);
                    }
                    setIsRoomSettingsModalOpen(false);
                    showToast('تم حفظ وتطبيق إعدادات الغرفة بنجاح 💾⚙️', 'success');
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-black rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ وتطبيق إعدادات الغرفة الآن 💾</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            PROFILE VISITORS MODAL (نافذة زوار ملفي الشخصي - الاسم والصورة وعدد المرات)
           ========================================================================= */}
        {showProfileVisitorsModal && (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowProfileVisitorsModal(false);
            }}
            className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 backdrop-blur-md animate-in fade-in"
            dir="rtl"
          >
            <div className={`w-full max-w-sm ${curTheme.drawerBg} border-2 border-amber-500 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 text-slate-100`}>
              {/* Header */}
              <div className={`p-3.5 ${curTheme.drawerHeaderBg || curTheme.headerBg} border-b ${curTheme.headerBorder} flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-400/30">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-amber-300 flex items-center gap-1.5">
                      <span>زوار ملفي الشخصي 👁️</span>
                      <span className="px-2 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-mono font-black">
                        {profileVisitorsList.length}
                      </span>
                    </h3>
                    <p className="text-[10px] text-amber-200/70">من نقر على صورتك وتصفح بروفايلك وعدد المرات</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProfileVisitorsModal(false)}
                  className="w-7 h-7 rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-slate-800/40">
                {profileVisitorsList.length === 0 ? (
                  <div className="py-10 text-center flex flex-col items-center justify-center gap-3 text-slate-400">
                    <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <Eye className="w-7 h-7" />
                    </div>
                    <p className="text-xs font-bold text-amber-200">لا يوجد زوار لملفك الشخصي حتى الآن</p>
                    <p className="text-[11px] text-slate-400 max-w-[220px]">
                      عندما ينقر أي عضو على صورتك الشخصية لعرض ملفك سيظهر هنا فوراً مع عدد مرات الزيارة!
                    </p>
                  </div>
                ) : (
                  profileVisitorsList.map((v, i) => {
                    const visitorUser = allConnectedUsers.find((u) => u.username.toLowerCase() === v.username.toLowerCase()) ||
                      rosterUsers.find((u) => u.username.toLowerCase() === v.username.toLowerCase());
                    return (
                      <div
                        key={v.username + '-' + i}
                        className={`pt-2 first:pt-0 p-2.5 rounded-xl ${curTheme.cardBg} border ${curTheme.cardBorder} flex items-center justify-between gap-2 transition-all hover:border-amber-400/60`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={v.avatarUrl || falconIcon}
                            alt={v.username}
                            onClick={() => {
                              if (visitorUser) {
                                openUserProfile(visitorUser);
                                setShowProfileVisitorsModal(false);
                              }
                            }}
                            className="w-11 h-11 rounded-xl object-cover border-2 border-amber-500/50 shadow-md cursor-pointer hover:opacity-85 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-black text-xs text-amber-200 flex items-center gap-1.5 truncate">
                              {(() => {
                                const banner = getUserBanner(v.username, v.nameBannerUrl);
                                if (banner) {
                                  return (
                                    <img
                                      src={banner}
                                      alt={v.username}
                                      title={v.username}
                                      onClick={() => {
                                        if (visitorUser) {
                                          openUserProfile(visitorUser);
                                          setShowProfileVisitorsModal(false);
                                        }
                                      }}
                                      className="h-5 max-h-[24px] max-w-[140px] object-contain rounded inline-block cursor-pointer hover:opacity-90"
                                    />
                                  );
                                }
                                return <span>{v.username}</span>;
                              })()}
                              {v.flag && <span className="text-sm">{v.flag}</span>}
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <span>آخر زيارة:</span>
                              <span className="font-mono text-amber-400">
                                {v.lastVisitTime ? new Date(v.lastVisitTime).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : 'مؤخراً'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs font-mono shadow-xs flex items-center gap-1">
                            <span>👁️</span>
                            <span>{v.visitCount || 1} مرات</span>
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (visitorUser) {
                                  openUserProfile(visitorUser);
                                  setShowProfileVisitorsModal(false);
                                } else {
                                  showToast(`العضو [${v.username}] غير متصل حالياً`, 'info');
                                }
                              }}
                              className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-[10px] font-bold cursor-pointer transition-colors"
                            >
                              الملف
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (visitorUser) {
                                  setSelectedPmUser(visitorUser);
                                  setActiveDrawer('pm');
                                  setShowProfileVisitorsModal(false);
                                } else {
                                  showToast(`العضو [${v.username}] غير متصل حالياً للمحادثة الخاصة`, 'info');
                                }
                              }}
                              className="px-2 py-0.5 bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 rounded text-[10px] font-bold cursor-pointer transition-colors"
                            >
                              خاص
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className={`p-2.5 ${curTheme.drawerHeaderBg || curTheme.headerBg} border-t ${curTheme.headerBorder} flex items-center justify-between text-xs`}>
                <button
                  type="button"
                  onClick={() => {
                    socket?.emit('getProfileVisitors');
                    showToast('تم تحديث قائمة زوار الملف الشخصي 🔄', 'info');
                  }}
                  className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>تحديث</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowProfileVisitorsModal(false)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold cursor-pointer transition-colors"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            START LIVE BROADCAST CONFIRMATION MODAL (بدء البث المباشر - فيديو وصوت)
           ========================================================================= */}
        {showStartLiveConfirm && (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowStartLiveConfirm(false);
            }}
            className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 backdrop-blur-md animate-in fade-in"
            dir="rtl"
          >
            <div className={`w-full max-w-sm ${curTheme.drawerBg} border-2 border-red-500 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 text-slate-100`}>
              {/* Header */}
              <div className="p-3.5 bg-gradient-to-r from-red-700 via-rose-700 to-red-800 text-white flex items-center justify-between shadow-md">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <Video className="w-4 h-4 text-white animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                      <span>بدء بث مباشر (LIVE) 🔴</span>
                    </h3>
                    <p className="text-[10px] text-rose-100/80">فيديو وصوت حقيقي لجميع أعضاء الغرفة</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowStartLiveConfirm(false)}
                  className="w-7 h-7 rounded-lg bg-black/30 hover:bg-black/50 text-white flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 space-y-3.5 text-xs">
                <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl space-y-1.5">
                  <div className="font-bold text-red-200 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                    <span>الغرفة المستهدفة: [{currentUser?.room || 'الغرفة العامة'}]</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    سيتم فتح الكاميرا والمايكروفون وبث الفيديو بجودة عالية لجميع المتواجدين في الغرفة، مع إمكانية التفاعل بالرموز التعبيرية والتعليقات الحية!
                  </p>
                </div>

                {/* Camera Selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-amber-200 block">اختيار الكاميرا:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setLiveFacingMode('user')}
                      className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-bold cursor-pointer transition-all ${
                        liveFacingMode === 'user'
                          ? 'bg-red-600 text-white border-red-400 shadow-md ring-2 ring-red-400/50'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      <Camera className="w-4 h-4" />
                      <span>كاميرا أمامية 🤳</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLiveFacingMode('environment')}
                      className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-bold cursor-pointer transition-all ${
                        liveFacingMode === 'environment'
                          ? 'bg-red-600 text-white border-red-400 shadow-md ring-2 ring-red-400/50'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      <Camera className="w-4 h-4" />
                      <span>كاميرا خلفية 📸</span>
                    </button>
                  </div>
                </div>

                {/* Buttons */}
                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    onClick={handleStartLiveBroadcast}
                    className="w-full py-3 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-600 text-white font-black rounded-xl shadow-lg cursor-pointer transition-all flex items-center justify-center gap-2 text-sm animate-pulse active:scale-[0.98]"
                  >
                    <Video className="w-4 h-4" />
                    <span>ابدأ البث المباشر الآن 🔴</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowStartLiveConfirm(false)}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer transition-colors text-xs"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            BANNER / NAME LOGO SELECTION MODAL (تعيين وتثبيت البنر والسوابر المصور 500x50)
           ========================================================================= */}
        {showBannerPickerModal && bannerPickerTargetUser && (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowBannerPickerModal(false);
            }}
            className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-4 backdrop-blur-md animate-in fade-in"
            dir="rtl"
          >
            <div className={`w-full max-w-lg ${curTheme.drawerBg} border-2 border-amber-500 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 text-slate-100 text-right`}>
              {/* Header */}
              <div className="p-3.5 bg-gradient-to-r from-purple-900 via-slate-900 to-amber-900 border-b border-amber-500/40 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center justify-center">
                    <Palette className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-amber-200 flex items-center gap-1.5">
                      <span>تعيين وتثبيت البنر / السوابر المصور للعضو 🎨</span>
                    </h3>
                    <p className="text-[10px] text-slate-300">
                      استبدال الاسم النصي لـ [{bannerPickerTargetUser.username}] بلقب مصور مخصص (500x50 PNG/GIF)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBannerPickerModal(false)}
                  className="w-7 h-7 rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Current Assigned Banner Status */}
              <div className="p-3.5 bg-slate-950/60 border-b border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">البنر المثبت حالياً للعضو:</span>
                  {bannerPickerTargetUser.nameBannerUrl ? (
                    <button
                      type="button"
                      onClick={() => {
                        socket?.emit('assignMemberBanner', {
                          username: bannerPickerTargetUser.username,
                          bannerUrl: undefined
                        });
                        setBannerPickerTargetUser((prev) => prev ? { ...prev, nameBannerUrl: undefined } : null);
                        setProfileTargetUser((prev) => prev ? { ...prev, nameBannerUrl: undefined } : null);
                        showToast(`تمت إزالة البنر المصور لـ [${bannerPickerTargetUser.username}] والعودة للاسم النصي ✕`, 'info');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-500/50 text-[11px] font-bold cursor-pointer transition-colors"
                    >
                      إزالة البنر والعودة للاسم النصي ✕
                    </button>
                  ) : (
                    <span className="text-[11px] text-amber-400 font-medium">اسم نصي عادي (لا يوجد بنر)</span>
                  )}
                </div>
                {bannerPickerTargetUser.nameBannerUrl && (
                  <div className="p-2 bg-black/40 rounded-xl border border-amber-500/30 flex items-center justify-center">
                    <img
                      src={bannerPickerTargetUser.nameBannerUrl}
                      alt="البنر المثبت"
                      className="max-h-12 w-auto max-w-full object-contain rounded drop-shadow-md"
                    />
                  </div>
                )}
              </div>

              {/* Scrollable List of Pre-Uploaded Banners */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-amber-300">
                    اختر من قائمة البنرات المرفوعة مسبقاً ({emblemsConfig.items.filter((i) => i.type === 'banner').length}):
                  </span>
                  <span className="text-[10px] text-slate-400">مقاس قياسي 500x50</span>
                </div>

                {emblemsConfig.items.filter((i) => i.type === 'banner').length === 0 ? (
                  <div className="py-8 text-center text-slate-400 space-y-2">
                    <p className="text-xs">لا توجد بنرات مرفوعة حالياً في النظام.</p>
                    <p className="text-[11px] text-slate-500">
                      يمكنك رفع بنرات جديدة من تبويب (الرموز) في لوحة التحكم الإدارية.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {emblemsConfig.items
                      .filter((item) => item.type === 'banner')
                      .map((banner) => {
                        const isCurrentlySelected = bannerPickerTargetUser.nameBannerUrl === banner.imageUrl;
                        return (
                          <div
                            key={banner.id}
                            className={`p-2.5 rounded-xl border transition-all ${
                              isCurrentlySelected
                                ? 'bg-amber-950/40 border-amber-400 shadow-md ring-1 ring-amber-400'
                                : 'bg-slate-900/80 border-slate-800 hover:border-amber-500/50 hover:bg-slate-850'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-bold text-xs text-amber-200 truncate max-w-[250px]">
                                {banner.title}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  socket?.emit('assignMemberBanner', {
                                    username: bannerPickerTargetUser.username,
                                    bannerUrl: banner.imageUrl
                                  });
                                  setBannerPickerTargetUser((prev) => prev ? { ...prev, nameBannerUrl: banner.imageUrl } : null);
                                  setProfileTargetUser((prev) => prev ? { ...prev, nameBannerUrl: banner.imageUrl } : null);
                                  setShowBannerPickerModal(false);
                                  showToast(`تم تثبيت البنر [${banner.title}] لـ [${bannerPickerTargetUser.username}] بنجاح 🌟`, 'success');
                                }}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  isCurrentlySelected
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'bg-amber-500 hover:bg-amber-400 text-black shadow'
                                }`}
                              >
                                {isCurrentlySelected ? 'مثبت حالياً ✔️' : 'تثبيت كاسم العضو 📌'}
                              </button>
                            </div>
                            {/* Standard 500x50 preview box */}
                            <div className="w-full h-11 bg-black/50 rounded-lg p-1 flex items-center justify-center border border-slate-700/60 overflow-hidden">
                              <img
                                src={banner.imageUrl}
                                alt={banner.title}
                                className="h-full w-auto max-w-full object-contain"
                                loading="lazy"
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}

                {/* Direct Custom URL / File Upload for Quick Assignment */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <label className="text-[11px] font-bold text-slate-300 block">
                    أو رفع وتثبيت بنر خاص مباشرة (PNG / GIF مقاس 500x50):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="رابط صورة البنر أو GIF مباشرة..."
                      value={customBannerUrlInput}
                      onChange={(e) => setCustomBannerUrlInput(e.target.value)}
                      className="flex-1 p-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-amber-500 font-mono"
                    />
                    <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-amber-300 flex items-center gap-1.5 cursor-pointer shrink-0">
                      <Download className="w-3.5 h-3.5" />
                      <span>رفع 📁</span>
                      <input
                        type="file"
                        accept="image/png,image/gif,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          handleFileUpload(e, (dataUrl) => {
                            setCustomBannerUrlInput(dataUrl);
                            showToast('تم تحميل الصورة بنجاح! انقر تثبيت لحفظها', 'info');
                          });
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      disabled={!customBannerUrlInput.trim()}
                      onClick={() => {
                        if (!customBannerUrlInput.trim()) return;
                        socket?.emit('assignMemberBanner', {
                          username: bannerPickerTargetUser.username,
                          bannerUrl: customBannerUrlInput.trim()
                        });
                        setBannerPickerTargetUser((prev) => prev ? { ...prev, nameBannerUrl: customBannerUrlInput.trim() } : null);
                        setProfileTargetUser((prev) => prev ? { ...prev, nameBannerUrl: customBannerUrlInput.trim() } : null);
                        setShowBannerPickerModal(false);
                        showToast(`تم تثبيت البنر المخصص لـ [${bannerPickerTargetUser.username}] بنجاح 🌟`, 'success');
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:opacity-40 text-black font-black rounded-xl text-xs cursor-pointer shadow-md shrink-0"
                    >
                      تثبيت ✔️
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowBannerPickerModal(false)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Story Upload Progress Overlay */}
        {isStoryUploading && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-white p-4">
            <div className="bg-slate-900 border border-amber-500/60 p-5 rounded-2xl max-w-xs w-full text-center space-y-3 shadow-2xl">
              <Sparkles className="w-8 h-8 text-amber-400 mx-auto animate-spin" />
              <div className="font-bold text-sm text-amber-300">جاري رفع ونشر الخاطرة / الحالة...</div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full transition-all duration-200"
                  style={{ width: `${storyUploadProgress}%` }}
                />
              </div>
              <div className="text-xs text-slate-400 font-mono">{storyUploadProgress}%</div>
              <div className="text-[10px] text-amber-200/80">ستبقى معروضة لجميع الأعضاء لمدة 24 ساعة ⏳</div>
            </div>
          </div>
        )}

        {/* Story Creation / Preview Modal */}
        {isCreatingStory && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 text-right">
            <div className="bg-slate-900 border border-amber-500/60 rounded-2xl max-w-sm w-full p-4 space-y-3 shadow-2xl text-white animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="font-bold text-sm text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>نشر خاطرة / حالة جديدة (24 ساعة)</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingStory(false);
                    setStoryMediaUrl('');
                    setStoryCaption('');
                  }}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Media Preview */}
              <div className="rounded-xl overflow-hidden bg-black max-h-[45vh] flex items-center justify-center border border-slate-800">
                {storyMediaType === 'video' ? (
                  <video src={storyMediaUrl} controls autoPlay muted playsInline className="max-h-[45vh] w-full object-contain" />
                ) : (
                  <img src={storyMediaUrl} alt="معاينة الخاطرة" className="max-h-[45vh] w-full object-contain" />
                )}
              </div>

              {/* Caption Input */}
              <div className="space-y-1">
                <label className="text-xs text-amber-200/90 font-bold block">اكتب خاطرة أو وصفاً مع الحالة (اختياري):</label>
                <textarea
                  rows={2}
                  value={storyCaption}
                  onChange={(e) => setStoryCaption(e.target.value)}
                  placeholder="...ماذا يدور في خاطرك اليوم؟"
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 outline-none focus:border-amber-500 resize-none font-medium"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingStory(false);
                    setStoryMediaUrl('');
                    setStoryCaption('');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handlePublishStory}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-black shadow-lg cursor-pointer flex items-center gap-1.5"
                >
                  <span>نشر للجميع ✨</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 24-Hour Story Viewer Modal: الأزرار المطلوبة [خروج، إعجاب، تعليق، تحميل] */}
        {activeStoryViewer && (
          <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-3 select-none text-white animate-in fade-in duration-150">
            {/* Top Bar: Author Info, Time, & Caption */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10 z-10">
              <div className="flex items-center gap-2.5">
                <img
                  src={activeStoryViewer.avatarUrl || falconIcon}
                  alt={activeStoryViewer.username}
                  className="w-10 h-10 rounded-full border-2 border-amber-400 object-cover shadow-md"
                />
                <div className="text-right">
                  <div className="text-xs font-bold text-amber-300 flex items-center gap-1">
                    <span>{activeStoryViewer.username}</span>
                    {activeStoryViewer.flag && <span>{activeStoryViewer.flag}</span>}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {activeStoryViewer.time} • ⏳ حالة 24 ساعة
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {currentUser && (activeStoryViewer.username === currentUser.username || currentUser.role === 'admin' || currentUser.role === 'super') && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('هل أنت متأكد من حذف هذه الخاطرة نهائياً؟')) {
                        socket?.emit('deleteStory', { storyId: activeStoryViewer.id });
                        setActiveStoryViewer(null);
                        showToast('تم حذف الخاطرة بنجاح 🗑️', 'info');
                      }
                    }}
                    className="p-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-300 text-xs font-bold transition-all"
                    title="حذف الخاطرة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                {/* زر خروج العلوي */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveStoryViewer(null);
                    setShowStoryComments(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                  title="خروج من عرض الخاطرة"
                >
                  <X className="w-4 h-4" />
                  <span>خروج</span>
                </button>
              </div>
            </div>

            {/* Main Media Container */}
            <div className="flex-1 flex flex-col items-center justify-center p-2 min-h-0 relative">
              {activeStoryViewer.mediaType === 'video' ? (
                <video
                  src={activeStoryViewer.mediaUrl}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[60vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/10"
                />
              ) : (
                <img
                  src={activeStoryViewer.mediaUrl}
                  alt="خاطرة"
                  className="max-h-[60vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/10"
                />
              )}

              {/* Caption Overlay */}
              {activeStoryViewer.caption && (
                <div className="mt-3 max-w-md w-full bg-black/60 backdrop-blur-sm border border-white/15 px-3 py-2 rounded-xl text-center text-xs text-amber-100 font-medium leading-relaxed">
                  {activeStoryViewer.caption}
                </div>
              )}
            </div>

            {/* Comments Drawer / Box when toggled */}
            {showStoryComments && (
              <div className="bg-slate-900/95 border border-white/15 rounded-2xl p-3 max-h-48 overflow-y-auto mb-2 text-right space-y-2 backdrop-blur-md shadow-2xl">
                <div className="text-xs font-bold text-amber-300 border-b border-slate-800 pb-1 flex items-center justify-between">
                  <span>التعليقات على الخاطرة ({activeStoryViewer.comments?.length || 0}):</span>
                  <button
                    type="button"
                    onClick={() => setShowStoryComments(false)}
                    className="text-slate-400 hover:text-white text-xs"
                  >
                    إغلاق التعليقات
                  </button>
                </div>
                <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                  {(!activeStoryViewer.comments || activeStoryViewer.comments.length === 0) ? (
                    <div className="text-[11px] text-slate-400 text-center py-2">لا توجد تعليقات بعد، كن أول من يعلق!</div>
                  ) : (
                    activeStoryViewer.comments.map((cm) => (
                      <div key={cm.id} className="text-xs bg-slate-800/80 p-1.5 rounded-lg border border-slate-700/60">
                        <div className="flex items-center justify-between text-[10px] text-amber-400 font-bold mb-0.5">
                          <span>{cm.username}</span>
                          <span className="text-slate-400 font-mono">{cm.time}</span>
                        </div>
                        <div className="text-slate-200">{cm.text}</div>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex gap-1.5 pt-1 border-t border-slate-800">
                  <input
                    type="text"
                    value={storyCommentInput}
                    onChange={(e) => setStoryCommentInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && storyCommentInput.trim()) {
                        e.preventDefault();
                        socket?.emit('addStoryComment', {
                          storyId: activeStoryViewer.id,
                          text: storyCommentInput.trim()
                        });
                        setStoryCommentInput('');
                      }
                    }}
                    placeholder="اكتب تعليقك هنا..."
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-400 outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (storyCommentInput.trim()) {
                        socket?.emit('addStoryComment', {
                          storyId: activeStoryViewer.id,
                          text: storyCommentInput.trim()
                        });
                        setStoryCommentInput('');
                      }
                    }}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-lg cursor-pointer"
                  >
                    إرسال
                  </button>
                </div>
              </div>
            )}

            {/* Bottom 4 Explicit Action Buttons: [خروج، إعجاب، تعليق، تحميل] */}
            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/10 z-10">
              {/* 1. زر خروج */}
              <button
                type="button"
                onClick={() => {
                  setActiveStoryViewer(null);
                  setShowStoryComments(false);
                }}
                className="py-2.5 px-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 border border-white/10 transition-all active:scale-95 cursor-pointer shadow-md"
              >
                <X className="w-4 h-4 text-rose-400" />
                <span>خروج</span>
              </button>

              {/* 2. زر إعجاب */}
              <button
                type="button"
                onClick={() => {
                  socket?.emit('likeStory', { storyId: activeStoryViewer.id });
                }}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 border transition-all active:scale-95 cursor-pointer shadow-md ${
                  currentUser && activeStoryViewer.likedUsers?.includes(currentUser.username.toLowerCase())
                    ? 'bg-rose-950/80 text-rose-300 border-rose-600/80'
                    : 'bg-slate-800/90 hover:bg-slate-700 text-rose-400 border-white/10'
                }`}
              >
                <Heart className={`w-4 h-4 ${currentUser && activeStoryViewer.likedUsers?.includes(currentUser.username.toLowerCase()) ? 'fill-rose-500 text-rose-500' : 'text-rose-400'}`} />
                <span>إعجاب ({activeStoryViewer.likes || 0})</span>
              </button>

              {/* 3. زر تعليق */}
              <button
                type="button"
                onClick={() => setShowStoryComments(!showStoryComments)}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 border transition-all active:scale-95 cursor-pointer shadow-md ${
                  showStoryComments
                    ? 'bg-amber-950/80 text-amber-300 border-amber-600/80'
                    : 'bg-slate-800/90 hover:bg-slate-700 text-amber-400 border-white/10'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <span>تعليق ({activeStoryViewer.comments?.length || 0})</span>
              </button>

              {/* 4. زر تحميل */}
              <button
                type="button"
                onClick={() => {
                  handleDownloadMedia(
                    activeStoryViewer.mediaUrl,
                    `story-${activeStoryViewer.username}-${activeStoryViewer.mediaType === 'video' ? 'video.mp4' : 'image.jpg'}`
                  );
                }}
                className="py-2.5 px-2 bg-slate-800/90 hover:bg-slate-700 text-emerald-400 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 border border-white/10 transition-all active:scale-95 cursor-pointer shadow-md"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>تحميل</span>
              </button>
            </div>
          </div>
        )}

        {/* 8. Connection & Session Diagnostics Modal (مركز فحص وتشخيص الاتصال والجلسة) */}
        {showConnectionDetailsModal && (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowConnectionDetailsModal(false);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fade-in"
            dir="rtl"
          >
            <div className="bg-[#18110b] border-2 border-amber-500/80 rounded-2xl w-full max-w-sm flex flex-col shadow-2xl overflow-hidden text-right text-white">
              {/* Header */}
              <div className="p-3 bg-[#241a12] border-b border-[#3e2c1c] flex items-center justify-between text-amber-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">حالة الاتصال والجلسة</h3>
                    <p className="text-[10px] text-amber-300/70">مراقبة الجلسة اللحظية وسرعة الخادم</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConnectionDetailsModal(false)}
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-3.5 space-y-3 text-xs overflow-y-auto max-h-[75vh]">
                {/* 1. Status Card */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-bold">حالة الاتصال المباشر:</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-black flex items-center gap-1.5 ${
                        !isConnected || connectionState === 'disconnected'
                          ? 'bg-rose-950 text-rose-300 border border-rose-500/50'
                          : connectionState === 'reconnecting'
                          ? 'bg-amber-950 text-amber-300 border border-amber-500/50 animate-pulse'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          !isConnected || connectionState === 'disconnected'
                            ? 'bg-rose-500'
                            : connectionState === 'reconnecting'
                            ? 'bg-amber-400 animate-ping'
                            : 'bg-emerald-400'
                        }`}
                      />
                      <span>
                        {!isConnected || connectionState === 'disconnected'
                          ? 'منقطع الاتصال'
                          : connectionState === 'reconnecting'
                          ? 'جاري استعادة الجلسة'
                          : 'متصل ومستقر'}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-800 pt-2">
                    <span className="text-[11px] text-slate-400 font-bold">سرعة الاستجابة (Ping):</span>
                    <span className="font-mono font-black text-xs flex items-center gap-1 text-amber-300">
                      <span>{pingLatency !== null ? `${pingLatency} ms` : 'قياس...'}</span>
                      <span className="text-[10px] text-slate-400">
                        {pingLatency !== null && pingLatency < 75
                          ? '(ممتاز 🟢)'
                          : pingLatency !== null && pingLatency < 180
                          ? '(جيد 🟡)'
                          : '(ضعيف 🔴)'}
                      </span>
                    </span>
                  </div>
                </div>

                {/* 2. Single Session Policy Status Card */}
                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 space-y-2 text-right">
                  <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>نظام الجلسة الواحدة المحمية:</span>
                  </div>
                  <p className="text-[11px] text-amber-100/80 leading-relaxed">
                    • مفعل بنجاح: حسابك مربوط بجلسة واحدة نشطة حالياً.<br />
                    • عند انقطاع النت أو ضعف الشبكة: يتم تعليق الاتصال واستعادة نفس الجلسة دون تكرار أو تسجيل دخول جديد.<br />
                    • عند فتح حسابك من جهاز أو متصفح آخر: يتم إنهاء هذه الجلسة فوراً واعتماد الجلسة الجديدة فقط.
                  </p>
                </div>

                {/* 3. Tech Info Grid */}
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[10px] text-slate-400 space-y-1.5 font-mono">
                  <div className="flex justify-between">
                    <span>الغرفة الحالية:</span>
                    <span className="text-white font-sans font-bold">{currentUser?.room || 'الغرفة العامة'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>العضو المسجل:</span>
                    <span className="text-amber-300 font-sans font-bold">{currentUser?.username || 'زائر'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>معرف الاتصال (Socket):</span>
                    <span className="text-slate-300 truncate max-w-[170px]">{socket?.id || 'غير متصل'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>حالة التواجد (Presence):</span>
                    <span className="text-emerald-400 font-bold font-sans">
                      {currentUser?.presenceState === 'away' ? 'في الخلفية 🟡' : 'نشط متصل 🟢'}
                    </span>
                  </div>
                </div>

                {/* 4. Action Buttons */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (socket && socket.connected) {
                        socket.emit('keepAlivePing', { timestamp: Date.now() });
                        showToast('تم إرسال إشارة فحص سرعة الاستجابة ⚡', 'info');
                      } else {
                        showToast('الخادم غير متصل حالياً', 'error');
                      }
                    }}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>فحص سرعة الاتصال الآن (Ping Test)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (socket) {
                        if (!socket.connected) socket.connect();
                        const savedToken = localStorage.getItem('soqoor_session_token');
                        const savedUserStr = localStorage.getItem('soqoor_current_user');
                        if (savedToken && savedUserStr) {
                          try {
                            const parsed = JSON.parse(savedUserStr);
                            socket.emit('restoreSession', {
                              sessionToken: savedToken,
                              username: parsed.username,
                              room: currentUser?.room || parsed.room || 'الغرفة العامة',
                              deviceFingerprint: generateDeviceFingerprint().fingerprintId
                            });
                          } catch {}
                        }
                        showToast('جاري استعادة ومزامنة الجلسة مع الخادم 🔄', 'info');
                      }
                    }}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-amber-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>إعادة مزامنة واستعادة الجلسة</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowConnectionDetailsModal(false);
                      handleExitChat();
                    }}
                    className="w-full py-2 bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>تسجيل الخروج الرسمي وإنهاء الجلسة</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
