import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  ShieldAlert,
  UserX,
  Megaphone,
  PieChart,
  FileText,
  Filter,
  Award,
  Lock,
  Unlock,
  Key,
  Trash2,
  Mic,
  MicOff,
  VolumeX,
  Volume2,
  Clock,
  Search,
  PlusCircle,
  AlertTriangle,
  Siren,
  Globe,
  Radio,
  Star,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  Flame,
  Sparkles,
  Edit3,
  HelpCircle,
  Heart,
  Zap,
  Copy,
  Palette,
  Image,
  X
} from 'lucide-react';
import { RoomStatsPieChart, RoomStatData } from './RoomStatsPieChart';
import { ChatShortcut, DEFAULT_PRESET_SHORTCUTS, expandClientShortcuts } from '../utils/chatShortcuts';
import { THEMES_LIST, FONTS_LIST, WALLPAPERS_LIST, BUBBLE_STYLES } from './ThemeAndWallpaperCenter';
import { getCountryNameFromFlag } from '../utils/countryDetect';
import {
  EmblemItem,
  EmblemType,
  EmblemsConfig,
  EmojiSizeSetting,
  createBannerSvgDataUri,
  createCustomEmojiSvgDataUri,
  createGiftBadgeSvgDataUri,
  createStickerSvgDataUri,
  DEFAULT_EMBLEMS_CONFIG
} from '../utils/emblemsSystem';
import { DEFAULT_AVATAR_SVG } from '../utils/avatarConstants';
import { uploadMediaWithProgress } from '../utils/connectionKeepAlive';

export interface User {
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
  presenceState?: 'online' | 'away' | 'offline';
  ipAddress?: string;
  deviceInfo?: string;
  deviceFingerprint?: string;
  honorBadge?: string;
  nameBannerUrl?: string;
  isJailed?: boolean;
  joinedAt?: number;
}

export interface LikesThresholdSettings {
  roomTextLikes: number;
  roomMediaLikes: number;
  wallTextLikes: number;
  wallMediaLikes: number;
  pmTextLikes: number;
  pmMediaLikes: number;
  micLikes: number;
  callLikes: number;
}

export interface ChatRoom {
  id: string;
  name: string;
  desc: string;
  isPasswordProtected: boolean;
  password?: string;
  voiceLimit: number;
  activeVoiceCount: number;
}

export interface MonitorEvent {
  id: string;
  type: string;
  description: string;
  actor: string;
  target?: string;
  time: string;
}

export interface ServerSecuritySettings {
  emergencyLockdown: boolean;
  guestsAllowed: boolean;
  blockExternalLinks: boolean;
  floodControlRate: number;
  marqueeTicker: string;
}

export interface StaffMemo {
  id: string;
  author: string;
  role: string;
  text: string;
  priority: 'low' | 'normal' | 'urgent';
  timestamp: number;
  timeFormatted: string;
}

export interface BannedRecord {
  username: string;
  ip?: string;
  reason: string;
  bannedBy: string;
  timestamp: number;
}

export interface FilterAlertItem {
  id: string;
  username: string;
  avatarUrl?: string;
  flag?: string;
  room: string;
  matchedWords: string[];
  fullMessage: string;
  timestamp: number;
  time: string;
}

export interface RegisteredMemberItem {
  username: string;
  role: 'admin' | 'super' | 'member' | 'guest' | string;
  flag: string;
  statusQuote: string;
  avatarUrl?: string;
  nameBannerUrl?: string;
  likes?: number;
  points?: number;
  honorBadge?: string;
  ipAddress?: string;
  deviceInfo?: string;
  deviceFingerprint?: string;
  isJailed?: boolean;
  isOnline: boolean;
  presenceState?: 'online' | 'away' | 'offline';
  currentRoom?: string;
  lastSeen?: number;
}

interface AdminControlSuiteProps {
  currentUser: User;
  rosterUsers: User[];
  allRegisteredMembers?: RegisteredMemberItem[];
  roomsList: ChatRoom[];
  roomStatsData: RoomStatData[];
  bannedList: BannedRecord[];
  roomSettings: { isChatLocked: boolean; slowModeSeconds: number; isVoiceLocked: boolean };
  serverSecurity: ServerSecuritySettings;
  staffMemos: StaffMemo[];
  monitorLogs: MonitorEvent[];
  monitoredWordsList: string[];
  filterAlerts?: FilterAlertItem[];
  likesSettings?: LikesThresholdSettings;
  generalWelcome?: { enabled: boolean; message: string; title: string };
  onUpdateGeneralWelcome?: (data: Partial<{ enabled: boolean; message: string; title: string }>) => void;
  onAdminAction: (action: string, targetUsername?: string, value?: any, reason?: string) => void;
  onManualBan: (username: string, ip: string, reason: string) => void;
  onUpdateSecurity: (newSettings: Partial<ServerSecuritySettings>) => void;
  onUpdateLikesSettings?: (newSettings: Partial<LikesThresholdSettings>) => void;
  onUpdateRoomDetails?: (data: any) => void;
  onAddStaffMemo: (text: string, priority: 'low' | 'normal' | 'urgent') => void;
  onDeleteStaffMemo: (memoId: string) => void;
  onAddMonitoredWord: (word: string) => void;
  onRemoveMonitoredWord: (word: string) => void;
  onClearMonitorLogs: () => void;
  onClearFilterAlerts?: () => void;
  onRevealNicks?: (username: string) => void;
  onOpenUserProfile: (user: User) => void;
  onSwitchRoom: (roomId: string) => void;
  onRefreshRoomStats?: () => void;
  shortcuts?: ChatShortcut[];
  onAddShortcut?: (trigger: string, replacement: string) => void;
  onDeleteShortcut?: (shortcutId: string) => void;
  onUpdateShortcut?: (id: string, trigger: string, replacement: string) => void;
  rolePermissions?: Record<string, any>;
  onUpdateRolePermissions?: (role: string, permissions: any) => void;
  onApplyGlobalAppearance?: (themeId: string, fontId: string, wallpaperId: string, bubbleStyle?: string) => void;
  emblemsConfig?: EmblemsConfig;
  onAddEmblem?: (data: { type: EmblemType; title: string; imageUrl: string; targetMember?: string; requiredRole?: string }) => void;
  onDeleteEmblem?: (id: string) => void;
  onUpdateEmojiSize?: (size: EmojiSizeSetting) => void;
  onAssignMemberBanner?: (username: string, bannerUrl?: string) => void;
  onGrantMemberGift?: (username: string, giftUrl: string, giftTitle?: string) => void;
  onRemoveMemberGift?: (username: string, giftUrl: string) => void;
  onClose: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const AdminControlSuite: React.FC<AdminControlSuiteProps> = ({
  currentUser,
  rosterUsers,
  allRegisteredMembers = [],
  roomsList,
  roomStatsData,
  bannedList,
  roomSettings,
  serverSecurity,
  staffMemos,
  monitorLogs,
  monitoredWordsList,
  filterAlerts = [],
  shortcuts = [],
  likesSettings,
  generalWelcome,
  onUpdateGeneralWelcome,
  rolePermissions,
  onUpdateRolePermissions,
  onApplyGlobalAppearance,
  emblemsConfig = DEFAULT_EMBLEMS_CONFIG,
  onAddEmblem,
  onDeleteEmblem,
  onUpdateEmojiSize,
  onAssignMemberBanner,
  onGrantMemberGift,
  onRemoveMemberGift,
  onAdminAction,
  onManualBan,
  onUpdateSecurity,
  onUpdateLikesSettings,
  onUpdateRoomDetails,
  onAddStaffMemo,
  onDeleteStaffMemo,
  onAddMonitoredWord,
  onRemoveMonitoredWord,
  onClearMonitorLogs,
  onClearFilterAlerts,
  onRevealNicks,
  onOpenUserProfile,
  onSwitchRoom,
  onRefreshRoomStats,
  onAddShortcut,
  onDeleteShortcut,
  onUpdateShortcut,
  onClose,
  showToast
}) => {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<
    'moderation' | 'roomControls' | 'security' | 'bans' | 'broadcast' | 'stats' | 'memos' | 'words' | 'shortcuts' | 'logs' | 'matrix' | 'welcome' | 'emblems'
  >('moderation');

  // General Welcome Settings State
  const [generalWelcomeEnabled, setGeneralWelcomeEnabled] = useState<boolean>(generalWelcome?.enabled ?? true);
  const [generalWelcomeTitle, setGeneralWelcomeTitle] = useState<string>(generalWelcome?.title || 'إدارة حسان برو 🦅');
  const [generalWelcomeText, setGeneralWelcomeText] = useState<string>(
    generalWelcome?.message || 'نحن سعداء بتشريفك فأهلاً بك عطراً فوّاحاً ينثرُ شذاه في كلّ الأرجاء .. نتمنى لك وقتاً ممتعاً 🌹'
  );

  useEffect(() => {
    if (generalWelcome) {
      setGeneralWelcomeEnabled(generalWelcome.enabled ?? true);
      setGeneralWelcomeTitle(generalWelcome.title || 'إدارة حسان برو 🦅');
      setGeneralWelcomeText(generalWelcome.message || '');
    }
  }, [generalWelcome]);

  // Appearance Global broadcast state
  const [globalThemeChoice, setGlobalThemeChoice] = useState('golden-brown-harmony');
  const [globalFontChoice, setGlobalFontChoice] = useState('Noto Naskh Arabic');
  const [globalWallpaperChoice, setGlobalWallpaperChoice] = useState('default');
  const [globalBubbleChoice, setGlobalBubbleChoice] = useState('modern');

  // Dynamic Role Permissions Management Tab State
  const [selectedRoleForPerms, setSelectedRoleForPerms] = useState<'admin' | 'super' | 'member' | 'guest'>('super');

  // Member View Mode: Live in current room vs All registered/login accounts (online & offline)
  const [memberViewMode, setMemberViewMode] = useState<'roomLive' | 'registeredAll'>('roomLive');

  // Filter Sub-tab: alerts log vs word list
  const [filterSubTab, setFilterSubTab] = useState<'alerts' | 'words'>('alerts');

  // Shortcuts Sub-tab: list vs test
  const [shortcutSubTab, setShortcutSubTab] = useState<'manage' | 'tester'>('manage');

  // Filters & Search
  const [memberRoleFilter, setMemberRoleFilter] = useState<'all' | 'admin' | 'super' | 'member' | 'guest' | 'jailed'>('all');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [logTypeFilter, setLogTypeFilter] = useState<'all' | 'kick_ban' | 'mute' | 'mic' | 'role' | 'security' | 'jail'>('all');
  const [logSearchQuery, setLogSearchQuery] = useState('');

  // Form States
  const [roomPasswordInput, setRoomPasswordInput] = useState('');
  const [broadcastTitleInput, setBroadcastTitleInput] = useState('تنبيه ملكي عاجل من إدارة حسان برو 🦅');
  const [broadcastTextInput, setBroadcastTextInput] = useState('');
  const [newWordInput, setNewWordInput] = useState('');
  const [marqueeInput, setMarqueeInput] = useState(serverSecurity.marqueeTicker || '');
  const [sirenTextInput, setSirenTextInput] = useState('🚨 تنبيه إداري عاجل من إدارة حسان برو! الرجاء الانتباه والالتزام بالقوانين.');

  // Chat Shortcuts Form States (إدارة اختصارات الشات الذكية)
  const [shortcutTriggerInput, setShortcutTriggerInput] = useState('');
  const [shortcutReplacementInput, setShortcutReplacementInput] = useState('');
  const [shortcutSearchQuery, setShortcutSearchQuery] = useState('');
  const [editingShortcut, setEditingShortcut] = useState<ChatShortcut | null>(null);
  const [editTriggerInput, setEditTriggerInput] = useState('');
  const [editReplacementInput, setEditReplacementInput] = useState('');
  const [testShortcutText, setTestShortcutText] = useState('نورت');

  // Emblems & Custom Emojis Sub-tabs & Form States (قسم الرموز، السوابر، الهدايا، الستيكرات والفيسات)
  const [emblemSubTab, setEmblemSubTab] = useState<'banners' | 'gifts' | 'stickers' | 'emojis'>('banners');
  // 1. Name Logos / Banners form
  const [bannerTitleInput, setBannerTitleInput] = useState('');
  const [bannerUrlInput, setBannerUrlInput] = useState('');
  const [bannerTargetMemberInput, setBannerTargetMemberInput] = useState('');
  const [bannerRoleInput, setBannerRoleInput] = useState('all');
  const [bannerSearchQuery, setBannerSearchQuery] = useState('');
  // 2. Gifts & Honors form
  const [giftTitleInput, setGiftTitleInput] = useState('');
  const [giftUrlInput, setGiftUrlInput] = useState('');
  const [giftTargetMemberInput, setGiftTargetMemberInput] = useState('');
  const [grantSelectedGiftUrl, setGrantSelectedGiftUrl] = useState('');
  const [grantTargetMember, setGrantTargetMember] = useState('');
  // 3. Stickers form
  const [stickerTitleInput, setStickerTitleInput] = useState('');
  const [stickerUrlInput, setStickerUrlInput] = useState('');
  // 4. Custom Emojis form & size
  const [emojiTitleInput, setEmojiTitleInput] = useState('');
  const [emojiUrlInput, setEmojiUrlInput] = useState('');
  const [emojiSearchQuery, setEmojiSearchQuery] = useState('');

  // Likes Threshold Requirements State (شروط عدد اللايكات المطلوبة للإرسال)
  const [likesForm, setLikesForm] = useState<LikesThresholdSettings>({
    roomTextLikes: likesSettings?.roomTextLikes || 0,
    roomMediaLikes: likesSettings?.roomMediaLikes || 0,
    wallTextLikes: likesSettings?.wallTextLikes || 0,
    wallMediaLikes: likesSettings?.wallMediaLikes || 0,
    pmTextLikes: likesSettings?.pmTextLikes || 0,
    pmMediaLikes: likesSettings?.pmMediaLikes || 0,
    micLikes: likesSettings?.micLikes || 0,
    callLikes: likesSettings?.callLikes || 0
  });

  useEffect(() => {
    if (likesSettings) {
      setLikesForm({
        roomTextLikes: likesSettings.roomTextLikes || 0,
        roomMediaLikes: likesSettings.roomMediaLikes || 0,
        wallTextLikes: likesSettings.wallTextLikes || 0,
        wallMediaLikes: likesSettings.wallMediaLikes || 0,
        pmTextLikes: likesSettings.pmTextLikes || 0,
        pmMediaLikes: likesSettings.pmMediaLikes || 0,
        micLikes: likesSettings.micLikes || 0,
        callLikes: likesSettings.callLikes || 0
      });
    }
  }, [likesSettings]);

  // Staff Memo State
  const [memoText, setMemoText] = useState('');
  const [memoPriority, setMemoPriority] = useState<'low' | 'normal' | 'urgent'>('normal');

  // Manual Ban Modal Inputs
  const [manualBanName, setManualBanName] = useState('');
  const [manualBanIp, setManualBanIp] = useState('');
  const [manualBanReason, setManualBanReason] = useState('مخالفة قوانين حسان برو والآداب العامة');

  // Room Creation / Edit Inputs
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [newRoomId, setNewRoomId] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [newRoomPass, setNewRoomPass] = useState('');
  const [newRoomVoiceCap, setNewRoomVoiceCap] = useState(30);

  // Edit Room Modal
  const [editingRoom, setEditingRoom] = useState<ChatRoom | null>(null);
  const [editRoomName, setEditRoomName] = useState('');
  const [editRoomDesc, setEditRoomDesc] = useState('');
  const [editRoomPass, setEditRoomPass] = useState('');
  const [editRoomVoiceCap, setEditRoomVoiceCap] = useState(30);

  // Quick Action User Dialog (Modal)
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userActionType, setUserActionType] = useState<'kick' | 'ban' | 'warn' | 'jail' | 'resetName' | 'badge' | 'role' | 'move' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionValue, setActionValue] = useState('');

  const ROLE_HIERARCHY: Record<string, number> = {
    admin: 3,
    super: 2,
    member: 1,
    guest: 0
  };

  const canModerateUser = (target: User) => {
    if (target.id === currentUser.id) return false;
    const actorRank = ROLE_HIERARCHY[currentUser.role] || 0;
    const targetRank = ROLE_HIERARCHY[target.role] || 0;
    if (currentUser.role === 'super' && targetRank >= actorRank) return false;
    if (currentUser.role === 'admin' && target.role === 'admin') return false;
    return true;
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return { short: '👑 مدير عام', badgeClass: 'bg-red-600 text-white' };
      case 'super':
        return { short: '🛡️ سوبر', badgeClass: 'bg-amber-600 text-white' };
      case 'member':
        return { short: '🎖️ عضو', badgeClass: 'bg-indigo-600 text-white' };
      default:
        return { short: '👤 زائر', badgeClass: 'bg-slate-600 text-white' };
    }
  };

  // Filtered members list
  const filteredUsers = rosterUsers.filter((u) => {
    if (memberRoleFilter === 'jailed') {
      if (!u.isJailed && u.room !== 'سجن حسان برو') return false;
    } else if (memberRoleFilter !== 'all' && u.role !== memberRoleFilter) {
      return false;
    }
    if (memberSearchQuery.trim()) {
      const q = memberSearchQuery.toLowerCase();
      return u.username.toLowerCase().includes(q) || u.statusQuote.toLowerCase().includes(q) || (u.ipAddress && u.ipAddress.includes(q));
    }
    return true;
  });

  // Filtered registered members (all saved memberships online and offline)
  const filteredRegisteredMembers = allRegisteredMembers.filter((m) => {
    if (memberRoleFilter === 'jailed') {
      if (!m.isJailed) return false;
    } else if (memberRoleFilter !== 'all' && m.role !== memberRoleFilter) {
      return false;
    }
    if (memberSearchQuery.trim()) {
      const q = memberSearchQuery.toLowerCase();
      return (
        m.username.toLowerCase().includes(q) ||
        (m.statusQuote && m.statusQuote.toLowerCase().includes(q)) ||
        (m.ipAddress && m.ipAddress.includes(q)) ||
        (m.deviceInfo && m.deviceInfo.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Filtered logs
  const filteredLogs = monitorLogs.filter((log) => {
    if (logTypeFilter === 'kick_ban' && !['kick', 'ban'].includes(log.type)) return false;
    if (logTypeFilter === 'mute' && log.type !== 'mute') return false;
    if (logTypeFilter === 'mic' && !['mic_take', 'mic_drop', 'mic_pull'].includes(log.type)) return false;
    if (logTypeFilter === 'role' && log.type !== 'role') return false;
    if (logTypeFilter === 'security' && log.type !== 'security') return false;
    if (logTypeFilter === 'jail' && log.type !== 'jail') return false;
    if (logSearchQuery.trim()) {
      const q = logSearchQuery.toLowerCase();
      return (
        log.description.toLowerCase().includes(q) ||
        log.actor.toLowerCase().includes(q) ||
        (log.target && log.target.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Export audit logs
  const handleExportLogs = () => {
    if (monitorLogs.length === 0) {
      showToast('لا توجد سجلات لتصديرها حالياً', 'info');
      return;
    }
    const textContent =
      `سجل الرقابة الإدارية - شات حسان برو\nتاريخ التصدير: ${new Date().toLocaleString('ar-EG')}\n==============================\n\n` +
      monitorLogs.map((l) => `[${l.time}] (${l.type.toUpperCase()}) ${l.description}`).join('\n');
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hassanpro-audit-logs-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('تم تصدير سجل المراقبة بنجاح 📄', 'success');
  };

  // Staff members currently online
  const onlineStaff = rosterUsers.filter((u) => u.role === 'admin' || u.role === 'super');

  return (
    <div className="flex flex-col h-full bg-[#17110c] text-slate-100 overflow-hidden select-none font-sans">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-[#2a1d12] via-[#3a2819] to-[#2a1d12] p-3 border-b border-[#4d3722] flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-sm text-amber-200 flex items-center gap-1.5">
              <span>لوحة التحكم والصلاحيات الإدارية الشاملة</span>
              <span className="text-[10px] bg-red-600 text-white font-mono px-1.5 py-0.2 rounded-full">PRO</span>
            </h3>
            <p className="text-[10px] text-amber-300/80">
              أهلاً بك [{currentUser.role.toUpperCase()}] {currentUser.username} • {onlineStaff.length} مشرف متواجد الآن
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-black/30 hover:bg-black/60 text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="إغلاق لوحة التحكم"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Top Navigation Tabs - 2 Organized Rows of Buttons */}
      <div className="grid grid-cols-7 bg-[#241a12] text-[9px] font-bold border-b border-[#3e2c1c]">
        <button
          onClick={() => setActiveTab('moderation')}
          className={`py-2 px-0.5 text-center transition-colors border-b-2 flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'moderation'
              ? 'border-amber-400 text-amber-300 bg-white/5 font-black'
              : 'border-transparent text-slate-300 hover:text-white'
          }`}
          title="إدارة الأعضاء والزوار والعقوبات"
        >
          <Users className="w-3.5 h-3.5 text-amber-400" />
          <span>الأعضاء</span>
        </button>

        <button
          onClick={() => setActiveTab('roomControls')}
          className={`py-2 px-0.5 text-center transition-colors border-b-2 flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'roomControls'
              ? 'border-amber-400 text-amber-300 bg-white/5 font-black'
              : 'border-transparent text-slate-300 hover:text-white'
          }`}
          title="إدارة الغرف وقفل الشات والميكروفونات"
        >
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>إدارة الروم</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`py-2 px-0.5 text-center transition-colors border-b-2 flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'security'
              ? 'border-red-400 text-red-300 bg-red-950/30 font-black'
              : 'border-transparent text-slate-300 hover:text-white'
          }`}
          title="الأمان، قفل الطوارئ، وحظر الروابط"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-red-400 animate-pulse" />
          <span>الأمان</span>
        </button>

        <button
          onClick={() => setActiveTab('bans')}
          className={`py-2 px-0.5 text-center transition-colors border-b-2 flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'bans'
              ? 'border-amber-400 text-amber-300 bg-white/5 font-black'
              : 'border-transparent text-slate-300 hover:text-white'
          }`}
          title="سجل المحظورين وإضافة حظر يدوي"
        >
          <UserX className="w-3.5 h-3.5 text-rose-400" />
          <span>المحظورون</span>
        </button>

        <button
          onClick={() => setActiveTab('broadcast')}
          className={`py-2 px-0.5 text-center transition-colors border-b-2 flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'broadcast'
              ? 'border-amber-400 text-amber-300 bg-white/5 font-black'
              : 'border-transparent text-slate-300 hover:text-white'
          }`}
          title="بث إشعار عام منبثق لكافة الغرف"
        >
          <Megaphone className="w-3.5 h-3.5 text-amber-400" />
          <span>بث عاجل</span>
        </button>

        <button
          onClick={() => setActiveTab('emblems')}
          className={`py-2 px-0.5 text-center transition-colors border-b-2 flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'emblems'
              ? 'border-purple-400 text-purple-300 bg-purple-950/40 font-black'
              : 'border-transparent text-slate-300 hover:text-white'
          }`}
          title="إدارة الرموز، السوابر، الهدايا، الستيكرات والفيسات"
        >
          <Palette className="w-3.5 h-3.5 text-purple-400" />
          <span>الرموز 🎨</span>
          {emblemsConfig?.items && emblemsConfig.items.length > 0 && (
            <span className="text-[8.5px] bg-purple-500/30 text-purple-200 px-1 rounded-full font-mono">
              {emblemsConfig.items.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('welcome')}
          className={`py-2 px-0.5 text-center transition-colors border-b-2 flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'welcome'
              ? 'border-emerald-400 text-emerald-300 bg-emerald-950/40 font-black'
              : 'border-transparent text-slate-300 hover:text-white'
          }`}
          title="إدارة الرسائل الترحيبية العامة للشات"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>الترحيب 💬</span>
        </button>
      </div>

      <div className="grid grid-cols-6 bg-[#1a140f] text-[9.5px] font-bold border-b border-[#3e2c1c]">
        <button
          onClick={() => setActiveTab('shortcuts')}
          className={`py-2 px-0.5 text-center transition-colors border-b-2 flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'shortcuts'
              ? 'border-amber-400 text-amber-300 bg-amber-950/40 font-black'
              : 'border-transparent text-slate-300 hover:text-white'
          }`}
          title="قائمة الاختصارات الذكية للشات"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>الاختصارات ⚡</span>
          {shortcuts && shortcuts.length > 0 && (
            <span className="text-[9px] bg-amber-500/30 text-amber-300 px-1 rounded-full font-mono">
              {shortcuts.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          className={`py-2 px-0.5 text-center transition-colors border-b-2 flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'stats'
              ? 'border-amber-400 text-amber-300 bg-white/5 font-black'
              : 'border-transparent text-slate-300 hover:text-white'
          }`}
          title="المخطط البياني الدائري للغرف"
        >
          <PieChart className="w-3.5 h-3.5 text-indigo-400" />
          <span>الإحصائيات</span>
        </button>

        <button
          onClick={() => setActiveTab('memos')}
          className={`py-2 px-0.5 text-center transition-colors border-b-2 flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'memos'
              ? 'border-amber-400 text-amber-300 bg-white/5 font-black'
              : 'border-transparent text-slate-300 hover:text-white'
          }`}
          title="طاقم الإدارة ومذكرات المشرفين السرية"
        >
          <Award className="w-3.5 h-3.5 text-amber-400" />
          <span>طاقم الإدارة</span>
        </button>

        <button
          onClick={() => setActiveTab('words')}
          className={`py-2 px-0.5 text-center transition-colors border-b-2 flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'words'
              ? 'border-amber-400 text-amber-300 bg-white/5 font-black'
              : 'border-transparent text-slate-300 hover:text-white'
          }`}
          title="إدارة الكلمات المحظورة بالفلتر"
        >
          <Filter className="w-3.5 h-3.5 text-amber-400" />
          <span>الفلتر</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`py-2 px-0.5 text-center transition-colors border-b-2 flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'logs'
              ? 'border-amber-400 text-amber-300 bg-white/5 font-black'
              : 'border-transparent text-slate-300 hover:text-white'
          }`}
          title="سجل المراقبة والعمليات الإدارية"
        >
          <FileText className="w-3.5 h-3.5 text-cyan-400" />
          <span>السجل</span>
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`py-2 px-0.5 text-center transition-colors border-b-2 flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'matrix'
              ? 'border-amber-400 text-amber-300 bg-white/5 font-black'
              : 'border-transparent text-slate-300 hover:text-white'
          }`}
          title="مصفوفة وقواعد الصلاحيات الهرمية"
        >
          <Key className="w-3.5 h-3.5 text-yellow-400" />
          <span>الصلاحيات</span>
        </button>
      </div>

      {/* TAB 1: MEMBERS MODERATION */}
      {activeTab === 'moderation' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs bg-slate-900/60">
          {/* Sub-Switch: المتواجدون بالروم vs جميع العضويات المسجلة والتاريخية (أوفلاين وأونلاين) */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-800 rounded-xl border border-slate-700 shadow-sm">
            <button
              type="button"
              onClick={() => setMemberViewMode('roomLive')}
              className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                memberViewMode === 'roomLive'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>المتواجدون بالروم ({rosterUsers.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setMemberViewMode('registeredAll')}
              className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                memberViewMode === 'registeredAll'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>جميع العضويات المسجلة والأوفلاين ({allRegisteredMembers.length})</span>
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="space-y-1.5">
            <div className="relative">
              <input
                type="text"
                placeholder={memberViewMode === 'roomLive' ? "بحث في المتواجدين بالاسم أو الحالة أو الـ IP..." : "بحث في قاعدة العضويات والأوفلاين بالاسم أو الـ IP أو الجهاز..."}
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                className="w-full p-2 pr-8 pl-3 rounded-xl text-xs bg-slate-800 border border-slate-700 focus:border-amber-500 focus:bg-slate-700 outline-none text-white placeholder-slate-400"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] font-bold">
              {(['all', 'admin', 'super', 'member', 'guest', 'jailed'] as const).map((r) => {
                const sourceList = memberViewMode === 'roomLive' ? rosterUsers : allRegisteredMembers;
                const count = r === 'all' 
                  ? sourceList.length 
                  : r === 'jailed' 
                  ? sourceList.filter((u: any) => u.isJailed || u.room === 'سجن حسان برو' || u.currentRoom === 'سجن حسان برو').length
                  : sourceList.filter((u: any) => u.role === r).length;
                return (
                  <button
                    key={r}
                    onClick={() => setMemberRoleFilter(r)}
                    className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                      memberRoleFilter === r
                        ? 'bg-amber-500 text-black font-black shadow-xs'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {r === 'all' && `الكل (${count})`}
                    {r === 'admin' && `الإدارة (${count})`}
                    {r === 'super' && `المشرفين (${count})`}
                    {r === 'member' && `الأعضاء (${count})`}
                    {r === 'guest' && `الزوار (${count})`}
                    {r === 'jailed' && `المسجونين (${count}) 🚔`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Members List View */}
          {memberViewMode === 'registeredAll' ? (
            /* ALL REGISTERED & HISTORICAL LOGINS (ONLINE & OFFLINE) */
            <div className="space-y-2">
              <div className="p-2.5 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-200 flex items-center justify-between">
                <span className="font-bold text-xs">
                  قاعدة العضويات المحفوظة: تحكم كامل بكل عضوية مسجلة وسجل دخول حتى لو كان العضو غير متصل (أوفلاين)
                </span>
                <span className="text-[10px] font-mono bg-emerald-900/80 px-2 py-0.5 rounded font-bold">
                  {filteredRegisteredMembers.length} عضوية
                </span>
              </div>

              {filteredRegisteredMembers.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs bg-slate-800/40 rounded-xl border border-dashed border-slate-700">
                  لا توجد عضويات مسجلة تطابق البحث.
                </div>
              ) : (
                filteredRegisteredMembers.map((m) => {
                  const isBanned = bannedList.some(
                    (b) => b.username.toLowerCase() === m.username.toLowerCase() || (m.ipAddress && b.ip === m.ipAddress)
                  );
                  const isJailed = m.isJailed;
                  const isOnline = m.isOnline;

                  return (
                    <div
                      key={m.username}
                      className={`p-3 rounded-xl border transition-all ${
                        isBanned
                          ? 'bg-rose-950/40 border-rose-800/80 shadow-xs'
                          : isJailed
                          ? 'bg-red-950/40 border-red-800/80 shadow-xs'
                          : isOnline
                          ? 'bg-slate-800/90 border-slate-700 hover:border-slate-600'
                          : 'bg-slate-900/80 border-slate-800 opacity-90'
                      }`}
                    >
                      {/* Member Meta Row */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative">
                            <img
                              src={m.avatarUrl || DEFAULT_AVATAR_SVG}
                              alt={m.username}
                              className={`w-10 h-10 rounded-xl object-cover border-2 flex-shrink-0 ${
                                isOnline ? 'border-emerald-500' : 'border-slate-600 grayscale'
                              }`}
                            />
                            <span
                              className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-900 ${
                                isOnline ? 'bg-emerald-500' : 'bg-slate-500'
                              }`}
                              title={isOnline ? 'متصل الآن' : 'غير متصل (أوفلاين)'}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-white text-xs truncate flex items-center gap-1.5">
                              {m.nameBannerUrl ? (
                                <img
                                  src={m.nameBannerUrl}
                                  alt={m.username}
                                  title={m.username}
                                  className="h-5 max-h-[22px] max-w-[140px] object-contain rounded inline-block drop-shadow-xs"
                                />
                              ) : (
                                <span>{m.username}</span>
                              )}
                              <span>{m.flag}</span>
                              {m.honorBadge && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 font-bold truncate">
                                  {m.honorBadge}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[200px]">
                              {m.statusQuote || 'عضو في حسان برو'}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 text-[9px] text-slate-400 mt-0.5 font-mono">
                              <span>🌐 {m.ipAddress || '192.168.1.1'}</span>
                              <span>•</span>
                              <span>📱 {m.deviceInfo || 'جهاز ذكي'}</span>
                              <span>•</span>
                              <span>💎 {m.points || 0} نقطة</span>
                              <span>•</span>
                              <span>❤️ {m.likes || 0}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status Badges */}
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getRoleBadge(m.role).badgeClass}`}>
                            {getRoleBadge(m.role).short}
                          </span>
                          {isOnline ? (
                            <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded text-[9px] font-bold">
                              متصل ({m.currentRoom || 'غرفة'})
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 bg-slate-800 text-slate-400 border border-slate-700 rounded text-[9px]">
                              أوفلاين
                            </span>
                          )}
                          {isBanned && (
                            <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded text-[9px] font-black animate-pulse">
                              محظور ⛔
                            </span>
                          )}
                          {isJailed && (
                            <span className="px-1.5 py-0.2 bg-red-600 text-white rounded text-[9px] font-bold">
                              مسجون 🚔
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Management Actions for Offline & Online Members */}
                      <div className="pt-2 border-t border-slate-700/80 flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                        {/* رفع الحظر / Unban (متاح حتى لو كان العضو غير متصل) */}
                        {isBanned ? (
                          <button
                            type="button"
                            onClick={() => {
                              onAdminAction('unban', m.username);
                              showToast(`تم رفع الحظر وفك الباند عن [${m.username}] بنجاح 🔓`, 'success');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black flex items-center gap-1 cursor-pointer shadow-xs transition-colors"
                            title="رفع الحظر فوراً عن الاسم والـ IP"
                          >
                            <span>🔓 رفع الحظر</span>
                          </button>
                        ) : (
                          /* باند وحظر IP شامل */
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`هل أنت متأكد من حظر [${m.username}] وعنوان الـ IP [${m.ipAddress || ''}] نهائياً؟`)) {
                                onAdminAction('ban', m.username, 'حظر إداري دائم يشمل عنوان الـ IP والحسابات');
                                showToast(`تم تطبيق الباند وحظر الـ IP لـ [${m.username}]`, 'success');
                              }
                            }}
                            className="px-2 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                            title="حظر العضوية والـ IP نهائياً ومنع الدخول كزائر أو تسجيل جديد"
                          >
                            <Shield className="w-3 h-3" />
                            <span>باند IP</span>
                          </button>
                        )}

                        {/* سجن / إفراج (Jail / Unjail) */}
                        {isJailed ? (
                          <button
                            type="button"
                            onClick={() => {
                              onAdminAction('unjailUser', m.username);
                              showToast(`تم الإفراج عن [${m.username}] ونقله للغرفة العامة`, 'success');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1 cursor-pointer"
                            title="فك السجن والإفراج"
                          >
                            <span>🕊️ إفراج</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              onAdminAction('jailUser', m.username, 'إيداع بالسجن بقرار إداري صارم');
                              showToast(`تم إيداع [${m.username}] في سجن حسان برو`, 'info');
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-700 hover:bg-black text-amber-300 border border-slate-600 flex items-center gap-1 cursor-pointer"
                            title="إيداع وتثبيت في غرفة السجن"
                          >
                            <span>🚔 سجن</span>
                          </button>
                        )}

                        {/* ترقية الرتبة (Admin Only) */}
                        {currentUser.role === 'admin' && (
                          <button
                            type="button"
                            onClick={() => {
                              const r = prompt('اختر الرتبة الجديدة (admin / super / member / guest):', m.role);
                              if (r && ['admin', 'super', 'member', 'guest'].includes(r.toLowerCase())) {
                                onAdminAction('updateRole', m.username, r.toLowerCase());
                                showToast(`تمت ترقية رتبة [${m.username}] إلى ${r}`, 'success');
                              }
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-emerald-300 border border-slate-600 flex items-center gap-1 cursor-pointer"
                            title="ترقية أو تغيير الرتبة"
                          >
                            <Award className="w-3 h-3 text-emerald-400" />
                            <span>الرتبة</span>
                          </button>
                        )}

                        {/* تعديل النقاط (Admin Only) */}
                        {currentUser.role === 'admin' && (
                          <button
                            type="button"
                            onClick={() => {
                              const pts = prompt(`أدخل رصيد النقاط الجديد لـ [${m.username}]:`, String(m.points || 0));
                              if (pts !== null && !isNaN(Number(pts))) {
                                onAdminAction('updatePoints', m.username, Number(pts));
                                showToast(`تم تعديل نقاط [${m.username}] إلى ${pts}`, 'success');
                              }
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-amber-300 border border-slate-600 flex items-center gap-1 cursor-pointer"
                            title="تعديل رصيد النقاط"
                          >
                            <span>💎 نقاط</span>
                          </button>
                        )}

                        {/* تعديل اللايكات (Admin Only) */}
                        {currentUser.role === 'admin' && (
                          <button
                            type="button"
                            onClick={() => {
                              const lks = prompt(`أدخل عدد اللايكات الجديد لـ [${m.username}]:`, String(m.likes || 0));
                              if (lks !== null && !isNaN(Number(lks))) {
                                onAdminAction('updateLikes', m.username, Number(lks));
                                showToast(`تم تعديل لايكات [${m.username}] إلى ${lks}`, 'success');
                              }
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-rose-300 border border-slate-600 flex items-center gap-1 cursor-pointer"
                            title="تعديل اللايكات"
                          >
                            <Heart className="w-3 h-3 text-rose-400" />
                            <span>لايكات</span>
                          </button>
                        )}

                        {/* تعديل الاسم والزخرفة */}
                        <button
                          type="button"
                          onClick={() => {
                            const newN = prompt(`أدخل الاسم أو الزخرفة الجديدة لـ [${m.username}]:`, m.username);
                            if (newN && newN.trim() && newN.trim() !== m.username) {
                              onAdminAction('updateUsername', m.username, newN.trim());
                              showToast(`تم تعديل اسم العضوية إلى [${newN.trim()}]`, 'success');
                            }
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 flex items-center gap-1 cursor-pointer"
                          title="تعديل الاسم والزخرفة في قاعدة البيانات"
                        >
                          <Edit3 className="w-3 h-3 text-cyan-400" />
                          <span>تعديل الاسم</span>
                        </button>

                        {/* بنر الاسم المصور 500x50 */}
                        <button
                          type="button"
                          onClick={() => {
                            const bUrl = prompt(`أدخل رابط البنر المصور 500x50 لـ [${m.username}] (أو اتركه فارغاً لإلغاء البنر):`, m.nameBannerUrl || '');
                            if (bUrl !== null) {
                              if (onAssignMemberBanner) {
                                onAssignMemberBanner(m.username, bUrl.trim());
                              }
                              showToast(bUrl.trim() ? `تم حفظ بنر الاسم لـ [${m.username}] 🖼️` : `تم حذف بنر [${m.username}]`, 'success');
                            }
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-amber-300 border border-slate-600 flex items-center gap-1 cursor-pointer"
                          title="تحديد أو تغيير بنر الاسم المصور 500x50 لهذا العضو"
                        >
                          <Image className="w-3 h-3 text-amber-400" />
                          <span>{m.nameBannerUrl ? 'تعديل البنر 🖼️' : 'إسناد بنر 🖼️'}</span>
                        </button>

                        {/* تغيير كلمة المرور عند النسيان (Admin Only) */}
                        {currentUser.role === 'admin' && (
                          <button
                            type="button"
                            onClick={() => {
                              const newPass = prompt(`أدخل كلمة المرور الجديدة للعضو [${m.username}] عند النسيان:`, '123456');
                              if (newPass && newPass.trim().length >= 3) {
                                onAdminAction('updatePassword', m.username, newPass.trim());
                                showToast(`تم تعيين كلمة مرور جديدة للعضو [${m.username}] بنجاح 🔑`, 'success');
                              } else if (newPass !== null) {
                                showToast('يجب أن تتكون كلمة المرور من 3 خانات على الأقل', 'error');
                              }
                            }}
                            className="px-2 py-1 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 flex items-center gap-1 cursor-pointer"
                            title="تغيير كلمة المرور للعضو عند نسيانها"
                          >
                            <Key className="w-3 h-3 text-amber-400" />
                            <span>تغيير كلمة المرور 🔑</span>
                          </button>
                        )}

                        {/* منح وسام شرفي */}
                        <button
                          type="button"
                          onClick={() => {
                            const b = prompt(`أدخل الوسام أو اللقب الشرفي لـ [${m.username}] (اتركه فارغاً للإزالة):`, m.honorBadge || '👑 صقر ذهبي');
                            if (b !== null) {
                              onAdminAction('assignHonorBadge', m.username, b.trim() || undefined);
                              showToast(`تم تحديث الوسام الشرفي لـ [${m.username}]`, 'success');
                            }
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-amber-300 border border-slate-600 flex items-center gap-1 cursor-pointer"
                          title="منح أو تعديل وسام شرفي"
                        >
                          <Star className="w-3 h-3 text-amber-400" />
                          <span>وسام</span>
                        </button>

                        {/* كشف النكات والعضويات المرتبطة بالـ IP */}
                        <button
                          type="button"
                          onClick={() => {
                            if (onRevealNicks) {
                              onRevealNicks(m.username);
                            } else {
                              onAdminAction('revealNicks', m.username);
                            }
                          }}
                          className="px-2 py-1 rounded-lg bg-indigo-950/70 hover:bg-indigo-900 text-indigo-200 border border-indigo-700/60 flex items-center gap-1 cursor-pointer transition-colors"
                          title="كشف النكات والعضويات المسجلة من هذا الجهاز والـ IP"
                        >
                          <Search className="w-3 h-3 text-indigo-400" />
                          <span>🔍 كشف نكات</span>
                        </button>

                        {/* حذف العضوية بالكامل من السيرفر (Admin Only) */}
                        {currentUser.role === 'admin' && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`هل أنت متأكد من حذف عضوية [${m.username}] نهائياً من قاعدة البيانات؟`)) {
                                onAdminAction('deleteAccount', m.username);
                                showToast(`تم حذف عضوية [${m.username}] نهائياً`, 'info');
                              }
                            }}
                            className="px-2 py-1 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 flex items-center gap-1 cursor-pointer"
                            title="حذف الحساب نهائياً من قاعدة البيانات"
                          >
                            <Trash2 className="w-3 h-3 text-rose-400" />
                            <span>حذف العضوية</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* LIVE USERS IN CURRENT ROOM */
            <div className="space-y-2">
            {filteredUsers.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs bg-slate-800/40 rounded-xl border border-dashed border-slate-700">
                لا يوجد أعضاء يطابقون خيارات البحث والفلتر.
              </div>
            ) : (
              filteredUsers.map((user) => {
                const isSelf = user.id === currentUser.id;
                const canMod = canModerateUser(user);
                const roleBadge = getRoleBadge(user.role);

                return (
                  <div
                    key={user.id}
                    className={`p-3 rounded-xl border transition-all ${
                      user.isJailed || user.room === 'سجن حسان برو'
                        ? 'bg-red-950/40 border-red-800/80 shadow-xs'
                        : 'bg-slate-800/80 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    {/* User Meta Row */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={user.avatarUrl || DEFAULT_AVATAR_SVG}
                          alt={user.username}
                          onClick={() => onOpenUserProfile(user)}
                          className="w-10 h-10 rounded-xl object-cover border-2 border-amber-500/60 cursor-pointer flex-shrink-0 hover:scale-105 transition-transform"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-white text-xs truncate flex items-center gap-1.5">
                            {user.nameBannerUrl ? (
                              <img
                                src={user.nameBannerUrl}
                                alt={user.username}
                                title={user.username}
                                className="h-5 max-h-[22px] max-w-[140px] object-contain rounded inline-block drop-shadow-xs"
                              />
                            ) : (
                              <span>{user.username}</span>
                            )}
                            <span>{user.flag}</span>
                            {user.honorBadge && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 font-bold truncate">
                                {user.honorBadge}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[200px]">
                            {user.statusQuote || 'عضو في حسان برو'}
                          </div>
                          <div className="flex items-center gap-2 text-[9px] text-slate-400 mt-0.5 font-mono">
                            <span>🌐 {user.ipAddress || '192.168.1.1'}</span>
                            <span>•</span>
                            <span>غرفة: {user.room}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${roleBadge.badgeClass}`}>
                          {roleBadge.short}
                        </span>
                        {user.micSlot !== null && (
                          <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded text-[9px] font-bold flex items-center gap-0.5">
                            <Mic className="w-2.5 h-2.5 text-emerald-400" />
                            <span>مايك {user.micSlot}</span>
                          </span>
                        )}
                        {user.isTextMuted && (
                          <span className="px-1.5 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded text-[9px] font-bold">
                            مسكت 🔇
                          </span>
                        )}
                        {(user.isJailed || user.room === 'سجن حسان برو') && (
                          <span className="px-1.5 py-0.5 bg-red-600 text-white rounded text-[9px] font-bold animate-pulse">
                            مسجون 🚔
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Toolbar */}
                    <div className="pt-2 border-t border-slate-700/80 flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                      {isSelf ? (
                        <span className="text-[10px] text-slate-400 font-semibold px-2 py-0.5 bg-slate-700/50 rounded">
                          (حسابك الحالي)
                        </span>
                      ) : canMod ? (
                        <>
                          {/* إسكات / فك إسكات */}
                          <button
                            onClick={() => onAdminAction(user.isTextMuted ? 'unmuteText' : 'mute', user.username)}
                            className={`px-2 py-1 rounded-lg border flex items-center gap-1 transition-colors cursor-pointer ${
                              user.isTextMuted
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 font-bold'
                                : 'bg-rose-950/50 text-rose-300 border-rose-700/60 hover:bg-rose-900/60'
                            }`}
                            title={user.isTextMuted ? 'فك الإسكات' : 'إسكات كتابي وصوتي'}
                          >
                            <VolumeX className="w-3 h-3" />
                            <span>{user.isTextMuted ? 'فك الإسكات' : 'إسكات'}</span>
                          </button>

                          {/* طرد */}
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setUserActionType('kick');
                              setActionReason('مخالفة قوانين الشات والآداب العامة');
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-700 hover:bg-rose-900/60 text-rose-300 border border-slate-600 hover:border-rose-500 flex items-center gap-1 transition-colors cursor-pointer"
                            title="طرد العضو من الروم"
                          >
                            <UserX className="w-3 h-3" />
                            <span>طرد</span>
                          </button>

                          {/* باند وحظر دائم */}
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setUserActionType('ban');
                              setActionReason('مخالفة شروط وقوانين حسان برو');
                            }}
                            className="px-2 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-1 transition-colors shadow-xs cursor-pointer"
                            title="حظر دائم وباند"
                          >
                            <Shield className="w-3 h-3" />
                            <span>باند</span>
                          </button>

                          {/* سجن / إفراج */}
                          {user.isJailed || user.room === 'سجن حسان برو' ? (
                            <button
                              onClick={() => onAdminAction('unjailUser', user.username)}
                              className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title="فك السجن والإفراج"
                            >
                              <span>🕊️ إفراج</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setUserActionType('jail');
                                setActionReason('توقيف وتأديب لمخالفة القوانين');
                              }}
                              className="px-2 py-1 rounded-lg bg-slate-700 hover:bg-black text-amber-300 border border-slate-600 flex items-center gap-1 transition-colors cursor-pointer"
                              title="إيداع في غرفة السجن"
                            >
                              <span>🚔 سجن</span>
                            </button>
                          )}

                          {/* سحب المايك */}
                          {user.micSlot !== null && (
                            <button
                              onClick={() => onAdminAction('pullMic', user.username)}
                              className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-bold flex items-center gap-1 transition-colors shadow-xs cursor-pointer"
                              title="سحب المايك من العضو"
                            >
                              <MicOff className="w-3 h-3" />
                              <span>سحب المايك</span>
                            </button>
                          )}

                          {/* تغيير الاسم المخالف */}
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setUserActionType('resetName');
                              setActionValue(`عضو_محترم_${Math.floor(100 + Math.random() * 900)}`);
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 flex items-center gap-1 transition-colors cursor-pointer"
                            title="استبدال الاسم المخالف"
                          >
                            <Edit3 className="w-3 h-3 text-cyan-400" />
                            <span>تعديل الاسم</span>
                          </button>

                          {/* بنر الاسم المصور 500x50 */}
                          <button
                            type="button"
                            onClick={() => {
                              const bUrl = prompt(`أدخل رابط البنر المصور 500x50 لـ [${user.username}] (أو اتركه فارغاً لإلغاء البنر):`, user.nameBannerUrl || '');
                              if (bUrl !== null) {
                                if (onAssignMemberBanner) {
                                  onAssignMemberBanner(user.username, bUrl.trim());
                                }
                                showToast(bUrl.trim() ? `تم حفظ بنر الاسم لـ [${user.username}] 🖼️` : `تم حذف بنر [${user.username}]`, 'success');
                              }
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-amber-300 border border-slate-600 flex items-center gap-1 transition-colors cursor-pointer"
                            title="تحديد أو تغيير بنر الاسم المصور 500x50 لهذا العضو"
                          >
                            <Image className="w-3 h-3 text-amber-400" />
                            <span>{user.nameBannerUrl ? 'تعديل البنر 🖼️' : 'إسناد بنر 🖼️'}</span>
                          </button>

                          {/* منح وسام شرفي */}
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setUserActionType('badge');
                              setActionValue(user.honorBadge || '👑 صقر ذهبي');
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-amber-300 border border-slate-600 flex items-center gap-1 transition-colors cursor-pointer"
                            title="منح أو تعديل وسام شرفي"
                          >
                            <Star className="w-3 h-3 text-amber-400" />
                            <span>وسام</span>
                          </button>

                          {/* ترقية الرتبة */}
                          {currentUser.role === 'admin' && (
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setUserActionType('role');
                                setActionValue(user.role);
                              }}
                              className="px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-emerald-300 border border-slate-600 flex items-center gap-1 transition-colors cursor-pointer"
                              title="ترقية أو تغيير الرتبة"
                            >
                              <Award className="w-3 h-3 text-emerald-400" />
                              <span>الرتبة</span>
                            </button>
                          )}

                          {/* تغيير كلمة المرور عند النسيان (Admin Only) */}
                          {currentUser.role === 'admin' && (
                            <button
                              type="button"
                              onClick={() => {
                                const newPass = prompt(`أدخل كلمة المرور الجديدة للعضو [${user.username}] عند النسيان:`, '123456');
                                if (newPass && newPass.trim().length >= 3) {
                                  onAdminAction('updatePassword', user.username, newPass.trim());
                                  showToast(`تم تعيين كلمة مرور جديدة للعضو [${user.username}] بنجاح 🔑`, 'success');
                                } else if (newPass !== null) {
                                  showToast('يجب أن تتكون كلمة المرور من 3 خانات على الأقل', 'error');
                                }
                              }}
                              className="px-2 py-1 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 flex items-center gap-1 transition-colors cursor-pointer"
                              title="تغيير كلمة المرور للعضو عند نسيانها"
                            >
                              <Key className="w-3 h-3 text-amber-400" />
                              <span>تغيير كلمة المرور 🔑</span>
                            </button>
                          )}

                          {/* نقل لغرفة أخرى */}
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setUserActionType('move');
                              setActionValue(roomsList[0]?.id || 'الغرفة العامة');
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 flex items-center gap-1 transition-colors cursor-pointer"
                            title="نقل لغرفة أخرى"
                          >
                            <span>🚪 نقل</span>
                          </button>

                          {/* حذف الصورة الشخصية */}
                          {user.avatarUrl && (
                            <button
                              onClick={() => {
                                if (confirm(`هل أنت متأكد من حذف صورة ${user.username} المخالفة؟`)) {
                                  onAdminAction('deleteAvatar', user.username);
                                }
                              }}
                              className="px-2 py-1 rounded-lg bg-slate-700 hover:bg-rose-900/60 text-rose-300 border border-slate-600 flex items-center gap-1 transition-colors cursor-pointer"
                              title="حذف الصورة المخالفة"
                            >
                              <Trash2 className="w-3 h-3 text-rose-400" />
                              <span>الصورة</span>
                            </button>
                          )}

                          {/* كشف النكات والعضويات */}
                          <button
                            onClick={() => {
                              if (onRevealNicks) {
                                onRevealNicks(user.username);
                              } else {
                                onAdminAction('revealNicks', user.username);
                              }
                            }}
                            className="px-2 py-1 rounded-lg bg-indigo-950/70 hover:bg-indigo-900 text-indigo-200 border border-indigo-700/60 flex items-center gap-1 transition-colors cursor-pointer"
                            title="كشف الآي بي والأسماء والعضويات التي دخل بها هذا العضو"
                          >
                            <Search className="w-3 h-3 text-indigo-400" />
                            <span>🔍 كشف نكات</span>
                          </button>

                          {/* فتح البروفايل للتعديل الكامل */}
                          <button
                            onClick={() => onOpenUserProfile(user)}
                            className="px-2 py-1 rounded-lg bg-[#2a241e] hover:bg-black text-amber-200 border border-amber-600/40 flex items-center gap-1 transition-colors cursor-pointer"
                            title="فتح الملف الشخصي الكامل"
                          >
                            <span>✏️ البروفايل</span>
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-800 px-2 py-1 rounded border border-slate-700">
                          <Lock className="w-3 h-3 text-slate-400" />
                          <span>محمي بنظام الصلاحيات الهرمية ({roleBadge.short})</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          )}
        </div>
      )}

      {/* TAB 2: ROOM MANAGEMENT & CONTROLS */}
      {activeTab === 'roomControls' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs bg-slate-900/60">
          {/* Current Room Status Card */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-[#241a12] to-[#3a291b] text-amber-200 border border-amber-500/40 shadow-md flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm text-amber-100">{currentUser.room}</span>
              </div>
              <p className="text-[10px] text-amber-300/80">
                لوحة الرقابة والتحكم اللحظي في إعدادات الغرفة الحالية وكافة الغرف
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-bold">
              {rosterUsers.filter((u) => u.room === currentUser.room).length} عضو متواجد
            </span>
          </div>

          {/* Quick Room Switches */}
          <div className="grid grid-cols-2 gap-2">
            {/* 1. Lock/Unlock Chat */}
            <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 flex flex-col justify-between">
              <div>
                <h5 className="font-bold text-white text-xs flex items-center gap-1.5 mb-1">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>قفل الشات العام مؤقتاً</span>
                </h5>
                <p className="text-[10px] text-slate-400 mb-2">منع غير المشرفين من إرسال رسائل نصية</p>
              </div>
              <button
                type="button"
                onClick={() => onAdminAction('lockRoomChat', '', !roomSettings.isChatLocked)}
                className={`w-full py-1.5 rounded-lg font-black text-[11px] transition-all cursor-pointer ${
                  roomSettings.isChatLocked
                    ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {roomSettings.isChatLocked ? '🔒 مقفل (اضغط للفتح)' : '🔓 مفتوح (اضغط للقفل)'}
              </button>
            </div>

            {/* 2. Lock Voice Mics */}
            <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 flex flex-col justify-between">
              <div>
                <h5 className="font-bold text-white text-xs flex items-center gap-1.5 mb-1">
                  <Mic className="w-3.5 h-3.5 text-rose-400" />
                  <span>حصر المايكات للإدارة</span>
                </h5>
                <p className="text-[10px] text-slate-400 mb-2">قفل مقاعد الصوت ومنع صعود الأعضاء</p>
              </div>
              <button
                type="button"
                onClick={() => onAdminAction('lockRoomVoice', '', !roomSettings.isVoiceLocked)}
                className={`w-full py-1.5 rounded-lg font-black text-[11px] transition-all cursor-pointer ${
                  roomSettings.isVoiceLocked
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-amber-300'
                }`}
              >
                {roomSettings.isVoiceLocked ? '🎙️🔒 مقفل للإدارة' : '🎙️🔓 متاح للجميع'}
              </button>
            </div>
          </div>

          {/* 3. Slow Mode */}
          <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>وضع الدردشة البطيء (Slow Mode)</span>
              </h5>
              <span className="text-[10px] font-mono font-bold text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-700/50">
                {roomSettings.slowModeSeconds > 0 ? `${roomSettings.slowModeSeconds} ثواني` : 'معطل'}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: 'إيقاف ✕', sec: 0 },
                { label: '5 ثواني', sec: 5 },
                { label: '10 ثواني', sec: 10 },
                { label: '30 ثانية', sec: 30 }
              ].map((opt) => (
                <button
                  key={opt.sec}
                  type="button"
                  onClick={() => onAdminAction('setSlowMode', '', opt.sec)}
                  className={`py-1.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                    roomSettings.slowModeSeconds === opt.sec
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-700/60 text-slate-300 border-slate-600 hover:bg-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Global Clear Chat & Pull All */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                if (confirm('هل أنت متأكد من مسح شات الغرفة كاملاً لجميع المتواجدين؟')) {
                  onAdminAction('globalClearChat', '');
                }
              }}
              className="p-3 bg-red-950/50 hover:bg-red-900/60 text-red-200 border border-red-700/60 rounded-xl flex items-center justify-center gap-2 font-bold cursor-pointer transition-colors shadow-xs"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
              <span>مسح شات الغرفة للجميع 🧹</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (confirm(`هل أنت متأكد من سحب جميع الأعضاء المتواجدين بالسيرفر إلى [${currentUser.room}]؟`)) {
                  onAdminAction('pullAllUsers', '');
                }
              }}
              className="p-3 bg-amber-950/50 hover:bg-amber-900/60 text-amber-200 border border-amber-700/60 rounded-xl flex items-center justify-center gap-2 font-bold cursor-pointer transition-colors shadow-xs"
            >
              <Users className="w-4 h-4 text-amber-400" />
              <span>سحب جميع الأعضاء لغرفتي 🚀</span>
            </button>
          </div>

          {/* 5. Room Password Manager */}
          <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 space-y-2">
            <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>إدارة كلمة مرور الغرفة الحالية</span>
            </h5>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                placeholder="اكتب كلمة مرور أو اترك فارغاً لإلغاء القفل..."
                value={roomPasswordInput}
                onChange={(e) => setRoomPasswordInput(e.target.value)}
                className="flex-1 p-2 rounded-xl text-xs bg-slate-900 border border-slate-700 focus:border-amber-500 outline-none text-white"
              />
              <button
                type="button"
                onClick={() => {
                  onAdminAction('setRoomPassword', '', roomPasswordInput);
                  setRoomPasswordInput('');
                }}
                className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] cursor-pointer"
              >
                تطبيق
              </button>
            </div>
          </div>

          {/* 6. Rooms Directory & Create New Room (Admin Only) */}
          <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>دليل الغرف وإضافة غرف جديدة ({roomsList.length})</span>
              </h5>
              {currentUser.role === 'admin' && (
                <button
                  onClick={() => setIsCreatingRoom(!isCreatingRoom)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>غرفة جديدة</span>
                </button>
              )}
            </div>

            {/* Create Room Form */}
            {isCreatingRoom && (
              <div className="p-3 bg-slate-900 rounded-xl border border-emerald-500/40 space-y-2">
                <h6 className="font-bold text-emerald-300 text-xs">إنشاء غرفة دردشة وصوت جديدة:</h6>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="اسم الغرفة (مثال: الكويت 🇰🇼)"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    className="p-2 rounded-lg text-xs bg-slate-800 border border-slate-700 text-white outline-none"
                  />
                  <input
                    type="text"
                    placeholder="كلمة مرور (اختياري)"
                    value={newRoomPass}
                    onChange={(e) => setNewRoomPass(e.target.value)}
                    className="p-2 rounded-lg text-xs bg-slate-800 border border-slate-700 text-white outline-none"
                  />
                </div>
                <input
                  type="text"
                  placeholder="وصف وتوبيك الغرفة..."
                  value={newRoomDesc}
                  onChange={(e) => setNewRoomDesc(e.target.value)}
                  className="w-full p-2 rounded-lg text-xs bg-slate-800 border border-slate-700 text-white outline-none"
                />
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">سعة الصوت:</span>
                    <input
                      type="number"
                      min={5}
                      max={100}
                      value={newRoomVoiceCap}
                      onChange={(e) => setNewRoomVoiceCap(Number(e.target.value))}
                      className="w-16 p-1 rounded bg-slate-800 text-white text-xs border border-slate-700"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setIsCreatingRoom(false)}
                      className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-xs cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={() => {
                        if (!newRoomName.trim()) {
                          showToast('يرجى كتابة اسم الغرفة', 'error');
                          return;
                        }
                        onAdminAction('createRoom', undefined, {
                          name: newRoomName.trim(),
                          desc: newRoomDesc.trim(),
                          password: newRoomPass.trim() || undefined,
                          voiceLimit: newRoomVoiceCap
                        });
                        setNewRoomName('');
                        setNewRoomDesc('');
                        setNewRoomPass('');
                        setIsCreatingRoom(false);
                      }}
                      className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                    >
                      إنشاء الغرفة ✅
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Rooms List Cards */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {roomsList.map((room) => {
                const occupants = rosterUsers.filter((u) => u.room === room.id).length;
                const isCurrent = currentUser.room === room.id;
                const isProtectedCore = room.id === 'الغرفة العامة' || room.id === 'سجن حسان برو';

                return (
                  <div
                    key={room.id}
                    className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-white text-xs flex items-center gap-1.5">
                        <span>{room.name}</span>
                        {room.isPasswordProtected && <Lock className="w-3 h-3 text-amber-400" />}
                        {isCurrent && (
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded font-bold">
                            غرفتك الحالية
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[220px]">
                        {room.desc}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-mono">
                        {occupants} عضو
                      </span>
                      {!isCurrent && (
                        <button
                          onClick={() => onSwitchRoom(room.id)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] font-bold cursor-pointer"
                        >
                          دخول
                        </button>
                      )}
                      {currentUser.role === 'admin' && !isProtectedCore && (
                        <button
                          onClick={() => {
                            if (confirm(`هل أنت متأكد من حذف الغرفة [${room.name}]؟ سيتم نقل روادها إلى الغرفة العامة.`)) {
                              onAdminAction('deleteRoom', undefined, room.id);
                            }
                          }}
                          className="p-1 rounded bg-slate-800 hover:bg-red-900/60 text-red-400 cursor-pointer"
                          title="حذف الغرفة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SERVER SECURITY & ANTI-RAID */}
      {activeTab === 'security' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs bg-slate-900/60">
          <div className="p-3 rounded-2xl bg-gradient-to-r from-red-950 via-rose-950 to-red-950 text-white border border-red-600/50 shadow-md">
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert className="w-5 h-5 text-red-400 animate-pulse" />
              <h5 className="font-bold text-sm text-red-100">منظومة الأمان والرقابة وحماية السيرفر من السبام والهجمات</h5>
            </div>
            <p className="text-[10px] text-red-200/90 leading-relaxed">
              تحكم فوري بحماية الدردشة ضد الهجمات العشوائية والإعلانات المشبوهة وقفل الطوارئ العام وإطلاق صافرات التنبيه.
            </p>
          </div>

          {/* 1. Emergency Lockdown Toggle */}
          <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-between">
            <div>
              <h5 className="font-bold text-white text-xs flex items-center gap-1.5 mb-1">
                <Lock className="w-4 h-4 text-red-400" />
                <span>قفل الطوارئ العام للدردشة (Emergency Lockdown)</span>
              </h5>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                تجميد الإرسال العام ومنع دخول الزوار أو الأعضاء غير الإداريين عند حدوث سبام أو فوضى
              </p>
            </div>
            <button
              onClick={() => onUpdateSecurity({ emergencyLockdown: !serverSecurity.emergencyLockdown })}
              className={`px-3 py-2 rounded-xl font-black text-xs transition-all cursor-pointer ${
                serverSecurity.emergencyLockdown
                  ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse shadow-md'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
            >
              {serverSecurity.emergencyLockdown ? '🛑 وضع الطوارئ مفعل' : '🟢 معطل (الوضع طبيعي)'}
            </button>
          </div>

          {/* 2. Guest Access Control */}
          <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-between">
            <div>
              <h5 className="font-bold text-white text-xs flex items-center gap-1.5 mb-1">
                <Users className="w-4 h-4 text-amber-400" />
                <span>دخول ومشاركة الزوار (Guest Access)</span>
              </h5>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                السماح أو منع دخول الزوار بدون تسجيل عضوية للحد من الحسابات الوهمية
              </p>
            </div>
            <button
              onClick={() => onUpdateSecurity({ guestsAllowed: !serverSecurity.guestsAllowed })}
              className={`px-3 py-2 rounded-xl font-black text-xs transition-all cursor-pointer ${
                serverSecurity.guestsAllowed
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-rose-600 hover:bg-rose-700 text-white'
              }`}
            >
              {serverSecurity.guestsAllowed ? '✔️ متاح للزوار' : '⛔ محظور على الزوار'}
            </button>
          </div>

          {/* 3. External Links Blocker */}
          <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-between">
            <div>
              <h5 className="font-bold text-white text-xs flex items-center gap-1.5 mb-1">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>مانع نشر الروابط والإعلانات الخارجية (Block External Links)</span>
              </h5>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                حظر الرسائل التي تحتوي على روابط (http, www, .com, wa.me, t.me) وحفظها بسجل المراقبة
              </p>
            </div>
            <button
              onClick={() => onUpdateSecurity({ blockExternalLinks: !serverSecurity.blockExternalLinks })}
              className={`px-3 py-2 rounded-xl font-black text-xs transition-all cursor-pointer ${
                serverSecurity.blockExternalLinks
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
            >
              {serverSecurity.blockExternalLinks ? '🛡️ الحماية مفعلة' : '⚠️ معطلة'}
            </button>
          </div>

          {/* 4. Marquee News Ticker Banner Editor */}
          <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 space-y-2">
            <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
              <Megaphone className="w-4 h-4 text-amber-400" />
              <span>شريط الأخبار التفاعلي العلوي (Marquee Ticker Banner)</span>
            </h5>
            <p className="text-[10px] text-slate-400">النص المتحرك الترحيبي الذي يظهر أعلى شاشة الدردشة لكافة المتواجدين:</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={marqueeInput}
                onChange={(e) => setMarqueeInput(e.target.value)}
                placeholder="اكتب الترحيب أو التوجيه الإداري..."
                className="flex-1 p-2 rounded-xl text-xs bg-slate-900 border border-slate-700 focus:border-amber-500 text-white outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (!marqueeInput.trim()) return;
                  onUpdateSecurity({ marqueeTicker: marqueeInput.trim() });
                  showToast('تم تحديث شريط الأخبار العلوي بنجاح 📢', 'success');
                }}
                className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer"
              >
                تحديث
              </button>
            </div>
          </div>

          {/* 5. Administrative Emergency Siren Alert */}
          <div className="p-3 bg-slate-800 rounded-xl border border-red-700/60 space-y-2">
            <h5 className="font-bold text-red-300 text-xs flex items-center gap-1.5">
              <Siren className="w-4 h-4 text-red-400 animate-bounce" />
              <span>إطلاق صافرة الإنذار الإداري العاجل (Admin Siren Alert)</span>
            </h5>
            <p className="text-[10px] text-slate-400">
              إطلاق صوت صافرة إنذار رسمية وظهور وميض أحمر تحذيري مع رسالة تنبيهية على كامل شاشات جميع المتواجدين بالسيرفر:
            </p>
            <textarea
              rows={2}
              value={sirenTextInput}
              onChange={(e) => setSirenTextInput(e.target.value)}
              className="w-full p-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white outline-none resize-none"
            />
            <button
              onClick={() => {
                if (confirm('هل أنت متأكد من إطلاق صافرة الإنذار لجميع المتواجدين؟')) {
                  onAdminAction('adminSiren', undefined, sirenTextInput);
                }
              }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-700 hover:to-rose-700 text-white font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              <Siren className="w-4 h-4" />
              <span>إطلاق صافرة الإنذار والتنبيه الإداري الآن 🚨</span>
            </button>
          </div>

          {/* 6. Likes Threshold Settings (شروط عدد اللايكات المطلوبة للإرسال) */}
          <div className="p-3.5 bg-gradient-to-br from-slate-800 via-amber-950/20 to-slate-800 rounded-2xl border border-amber-500/40 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
              <h5 className="font-black text-amber-300 text-xs flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>شروط عدد اللايكات اللازمة لكل نوع رسالة وإجراء 👍</span>
              </h5>
              <span className="text-[10px] text-amber-300/80 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                0 = متاح للجميع بدون قيود
              </span>
            </div>

            <p className="text-[10px] text-slate-300 leading-relaxed">
              حدد الحد الأدنى من اللايكات الذي يجب أن يمتلكه العضو ليتمكن من الإرسال لكل نوع مراسلة على حدة. (طاقم الإدارة معفي تلقائياً).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-right">
              {/* 1. نص بالغرفة */}
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 space-y-1">
                <label className="text-[11px] font-bold text-slate-200 block">💬 لايكات إرسال نص بالغرفة:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={likesForm.roomTextLikes}
                    onChange={(e) => setLikesForm({ ...likesForm, roomTextLikes: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full p-1.5 rounded-lg bg-slate-800 border border-slate-600 text-amber-300 font-bold text-center text-xs outline-none"
                  />
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">لايك</span>
                </div>
              </div>

              {/* 2. وسائط بالغرفة */}
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 space-y-1">
                <label className="text-[11px] font-bold text-slate-200 block">📸 لايكات إرسال وسائط بالغرفة:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={likesForm.roomMediaLikes}
                    onChange={(e) => setLikesForm({ ...likesForm, roomMediaLikes: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full p-1.5 rounded-lg bg-slate-800 border border-slate-600 text-amber-300 font-bold text-center text-xs outline-none"
                  />
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">لايك</span>
                </div>
              </div>

              {/* 3. نص بالحائط */}
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 space-y-1">
                <label className="text-[11px] font-bold text-slate-200 block">📝 لايكات إرسال نص بالحائط:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={likesForm.wallTextLikes}
                    onChange={(e) => setLikesForm({ ...likesForm, wallTextLikes: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full p-1.5 rounded-lg bg-slate-800 border border-slate-600 text-amber-300 font-bold text-center text-xs outline-none"
                  />
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">لايك</span>
                </div>
              </div>

              {/* 4. وسائط بالحائط */}
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 space-y-1">
                <label className="text-[11px] font-bold text-slate-200 block">🖼️ لايكات إرسال وسائط بالحائط:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={likesForm.wallMediaLikes}
                    onChange={(e) => setLikesForm({ ...likesForm, wallMediaLikes: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full p-1.5 rounded-lg bg-slate-800 border border-slate-600 text-amber-300 font-bold text-center text-xs outline-none"
                  />
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">لايك</span>
                </div>
              </div>

              {/* 5. نص بالخاص */}
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 space-y-1">
                <label className="text-[11px] font-bold text-slate-200 block">🔒 لايكات إرسال نص بالخاص:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={likesForm.pmTextLikes}
                    onChange={(e) => setLikesForm({ ...likesForm, pmTextLikes: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full p-1.5 rounded-lg bg-slate-800 border border-slate-600 text-amber-300 font-bold text-center text-xs outline-none"
                  />
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">لايك</span>
                </div>
              </div>

              {/* 6. وسائط بالخاص */}
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 space-y-1">
                <label className="text-[11px] font-bold text-slate-200 block">📁 لايكات إرسال وسائط بالخاص:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={likesForm.pmMediaLikes}
                    onChange={(e) => setLikesForm({ ...likesForm, pmMediaLikes: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full p-1.5 rounded-lg bg-slate-800 border border-slate-600 text-amber-300 font-bold text-center text-xs outline-none"
                  />
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">لايك</span>
                </div>
              </div>

              {/* 7. الصعود للمايك */}
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 space-y-1">
                <label className="text-[11px] font-bold text-slate-200 block">🎙️ لايكات الصعود للمايك:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={likesForm.micLikes}
                    onChange={(e) => setLikesForm({ ...likesForm, micLikes: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full p-1.5 rounded-lg bg-slate-800 border border-slate-600 text-amber-300 font-bold text-center text-xs outline-none"
                  />
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">لايك</span>
                </div>
              </div>

              {/* 8. الاتصال بالخاص */}
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 space-y-1">
                <label className="text-[11px] font-bold text-slate-200 block">📞 لايكات الاتصال في الخاص:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={likesForm.callLikes}
                    onChange={(e) => setLikesForm({ ...likesForm, callLikes: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full p-1.5 rounded-lg bg-slate-800 border border-slate-600 text-amber-300 font-bold text-center text-xs outline-none"
                  />
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">لايك</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const cleaned: LikesThresholdSettings = {
                  roomTextLikes: Math.max(0, Number(likesForm.roomTextLikes) || 0),
                  roomMediaLikes: Math.max(0, Number(likesForm.roomMediaLikes) || 0),
                  wallTextLikes: Math.max(0, Number(likesForm.wallTextLikes) || 0),
                  wallMediaLikes: Math.max(0, Number(likesForm.wallMediaLikes) || 0),
                  pmTextLikes: Math.max(0, Number(likesForm.pmTextLikes) || 0),
                  pmMediaLikes: Math.max(0, Number(likesForm.pmMediaLikes) || 0),
                  micLikes: Math.max(0, Number(likesForm.micLikes) || 0),
                  callLikes: Math.max(0, Number(likesForm.callLikes) || 0)
                };
                setLikesForm(cleaned);
                if (onUpdateLikesSettings) {
                  onUpdateLikesSettings(cleaned);
                  showToast('تم حفظ وتطبيق شروط اللايكات بنجاح في السيرفر 👍💾', 'success');
                }
              }}
              className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>حفظ وتطبيق شروط اللايكات في السيرفر 💾</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: BANS & MANUAL BLACKLIST */}
      {activeTab === 'bans' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs bg-slate-900/60">
          {/* Manual Ban Direct Form */}
          <div className="p-3 bg-slate-800 rounded-xl border border-rose-500/40 space-y-2">
            <h5 className="font-bold text-rose-300 text-xs flex items-center gap-1.5">
              <UserX className="w-4 h-4 text-rose-400" />
              <span>إضافة حظر يدوي مباشر (حظر اسم أو IP)</span>
            </h5>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="اسم المستخدم المراد حظره..."
                value={manualBanName}
                onChange={(e) => setManualBanName(e.target.value)}
                className="p-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white outline-none"
              />
              <input
                type="text"
                placeholder="عنوان IP (اختياري)..."
                value={manualBanIp}
                onChange={(e) => setManualBanIp(e.target.value)}
                className="p-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white outline-none"
              />
            </div>
            <input
              type="text"
              placeholder="سبب الحظر..."
              value={manualBanReason}
              onChange={(e) => setManualBanReason(e.target.value)}
              className="w-full p-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white outline-none"
            />
            <button
              onClick={() => {
                if (!manualBanName.trim()) {
                  showToast('يرجى إدخال اسم المستخدم', 'error');
                  return;
                }
                onManualBan(manualBanName.trim(), manualBanIp.trim(), manualBanReason.trim());
                setManualBanName('');
                setManualBanIp('');
                showToast(`تم تطبيق الحظر اليدوي على [${manualBanName}] بنجاح`, 'success');
              }}
              className="w-full py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer shadow-xs"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>تنفيذ الحظر والباند الفوري</span>
            </button>
          </div>

          {/* Banned Users List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
              <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
                <UserX className="w-4 h-4 text-rose-500" />
                <span>قائمة المحظورين نهائياً ({bannedList.length}):</span>
              </h5>
            </div>

            {bannedList.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs bg-slate-800/40 rounded-xl border border-dashed border-slate-700">
                لا يوجد أي مستخدم محظور حالياً.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {bannedList.map((item) => (
                  <div
                    key={item.username}
                    className="p-2.5 rounded-xl bg-slate-800 border border-rose-900/60 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-rose-300 flex items-center gap-1.5 text-xs">
                        <span className="truncate">{item.username}</span>
                        <span className="text-[9px] text-slate-400 font-mono">({item.ip || 'IP غير مسجل'})</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">
                        سبب: {item.reason}
                      </div>
                      <div className="text-[9px] text-slate-500 mt-0.5">
                        بواسطة: {item.bannedBy} • {new Date(item.timestamp).toLocaleDateString('ar-EG')}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`هل أنت متأكد من فك الحظر عن [${item.username}]؟`)) {
                          onAdminAction('unban', item.username);
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition-colors cursor-pointer whitespace-nowrap shadow-xs"
                    >
                      فك الحظر 🔓
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: CRITICAL GLOBAL BROADCAST */}
      {activeTab === 'broadcast' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs bg-slate-900/60">
          <div className="p-3 rounded-2xl bg-gradient-to-r from-red-950 via-rose-900 to-red-950 text-white border border-red-500/50 shadow-md">
            <div className="flex items-center gap-2 mb-1">
              <Megaphone className="w-4 h-4 text-red-300 animate-pulse" />
              <h5 className="font-bold text-sm text-red-100">بث إشعار عام عاجل لجميع الغرف</h5>
            </div>
            <p className="text-[10px] text-red-200/90 leading-relaxed">
              هذا البث يظهر فوراً كإشعار ملكي أحمر منبثق على كامل شاشات جميع المتواجدين في كافة الغرف مع نغمة إنذار إداري.
            </p>
          </div>

          {/* Quick Templates */}
          <div className="p-2.5 bg-slate-800 rounded-xl border border-slate-700 space-y-1.5">
            <span className="text-[10px] font-bold text-slate-300">نماذج سريعة للإشعار:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'انطلاق مسابقة حسان برو الكبرى الآن في غرفة المسابقات! 🔥',
                'حان الآن موعد أذان الصلاة حسب توقيت مكة المكرمة 🕌',
                'نرجو من جميع الإخوة والأخوات الالتزام بآداب الحوار واحترام المتواجدين 🌹',
                'ترحب إدارة حسان برو بجميع الزوار والأعضاء الكرام ونتمنى لكم أطيب الأوقات 🦅'
              ].map((tmpl, idx) => (
                <button
                  key={idx}
                  onClick={() => setBroadcastTextInput(tmpl)}
                  className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-[10px] text-amber-200 border border-slate-600 truncate max-w-full text-right cursor-pointer"
                >
                  {tmpl}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700 space-y-2.5">
            <div>
              <label className="font-bold text-slate-200 text-[11px] block mb-1">عنوان الإشعار:</label>
              <input
                type="text"
                value={broadcastTitleInput}
                onChange={(e) => setBroadcastTitleInput(e.target.value)}
                className="w-full p-2 border border-slate-700 rounded-xl text-xs bg-slate-900 text-white outline-none font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-200 text-[11px] block mb-1">نص الرسالة والتوجيه الإداري:</label>
              <textarea
                rows={4}
                placeholder="اكتب التوجيه أو الإعلان الإداري العاجل هنا..."
                value={broadcastTextInput}
                onChange={(e) => setBroadcastTextInput(e.target.value)}
                className="w-full p-2 border border-slate-700 rounded-xl text-xs bg-slate-900 text-white outline-none resize-none leading-relaxed"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                if (!broadcastTextInput.trim()) {
                  showToast('يرجى كتابة نص الإشعار العام', 'error');
                  return;
                }
                onAdminAction('globalBroadcast', undefined, {
                  title: broadcastTitleInput,
                  text: broadcastTextInput
                });
                setBroadcastTextInput('');
                showToast('تم إرسال البث الملكي لجميع الغرف بنجاح 📢', 'success');
              }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-700 hover:to-rose-700 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Megaphone className="w-4 h-4" />
              <span>إرسال البث الملكي لجميع الغرف فوراً 📢</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 6: ROOM STATISTICS PIE CHART */}
      {activeTab === 'stats' && (
        <RoomStatsPieChart
          stats={roomStatsData}
          currentRoomId={currentUser.room}
          onRefresh={() => {
            if (onRefreshRoomStats) {
              onRefreshRoomStats();
            } else {
              onAdminAction('getRoomStats');
            }
            showToast('تم تحديث إحصائيات الغرف فورياً 🔄', 'info');
          }}
          onSwitchRoom={(roomId) => onSwitchRoom(roomId)}
          onOpenUserProfile={(targetUsername) => {
            const target = rosterUsers.find((u) => u.username === targetUsername);
            if (target) {
              onOpenUserProfile(target);
            } else {
              showToast(`المستخدم [${targetUsername}] متواجد بروم آخر`, 'info');
            }
          }}
        />
      )}

      {/* TAB 7: STAFF ROSTER & CONFIDENTIAL MEMOS */}
      {activeTab === 'memos' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs bg-slate-900/60">
          {/* Active Staff Attendance */}
          <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 space-y-2">
            <h5 className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              <span>كشف حضور وتواجد طاقم الإدارة حالياً ({onlineStaff.length})</span>
            </h5>
            <div className="grid grid-cols-2 gap-2">
              {onlineStaff.map((staff) => (
                <div
                  key={staff.id}
                  className="p-2 rounded-lg bg-slate-900 border border-slate-700 flex items-center gap-2"
                >
                  <img
                    src={staff.avatarUrl || DEFAULT_AVATAR_SVG}
                    alt={staff.username}
                    className="w-8 h-8 rounded-lg object-cover border border-amber-500/50"
                  />
                  <div className="min-w-0">
                    <div className="font-bold text-white text-[11px] truncate flex items-center gap-1">
                      <span>{staff.username}</span>
                      <span>{staff.flag}</span>
                    </div>
                    <div className="text-[9px] text-amber-300 font-bold truncate">
                      {staff.role === 'admin' ? '👑 مدير عام' : '🛡️ مشرف سوبر'} • {staff.room}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Secret Memo */}
          <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 space-y-2">
            <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
              <Edit3 className="w-4 h-4 text-cyan-400" />
              <span>سبورة الملاحظات والتوجيهات الإدارية السرية (Staff Memo Board)</span>
            </h5>
            <textarea
              rows={2}
              placeholder="اكتب ملاحظة أو توجيه خاص لطاقم الإدارة..."
              value={memoText}
              onChange={(e) => setMemoText(e.target.value)}
              className="w-full p-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white outline-none resize-none"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400">الأولوية:</span>
                {(['low', 'normal', 'urgent'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setMemoPriority(p)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                      memoPriority === p
                        ? p === 'urgent'
                          ? 'bg-red-600 text-white'
                          : p === 'normal'
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-600 text-white'
                        : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {p === 'urgent' ? '🔴 عاجل' : p === 'normal' ? '🟡 عادي' : '⚪ توجيه'}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  if (!memoText.trim()) return;
                  onAddStaffMemo(memoText.trim(), memoPriority);
                  setMemoText('');
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer"
              >
                نشر الملاحظة 📝
              </button>
            </div>
          </div>

          {/* Memos List */}
          <div className="space-y-2">
            <h6 className="font-bold text-slate-300 text-xs">الملاحظات النشطة:</h6>
            {staffMemos.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs bg-slate-800/40 rounded-xl border border-dashed border-slate-700">
                لا توجد ملاحظات إدارية حالياً.
              </div>
            ) : (
              staffMemos.map((memo) => (
                <div
                  key={memo.id}
                  className={`p-3 rounded-xl border space-y-1 ${
                    memo.priority === 'urgent'
                      ? 'bg-red-950/40 border-red-700/60 text-red-100'
                      : memo.priority === 'normal'
                      ? 'bg-slate-800 border-amber-500/40 text-amber-100'
                      : 'bg-slate-800 border-slate-700 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className={memo.role === 'admin' ? 'text-red-400' : 'text-amber-400'}>
                        [{memo.role.toUpperCase()}] {memo.author}
                      </span>
                      <span>•</span>
                      <span className="text-slate-400">{memo.timeFormatted}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                          memo.priority === 'urgent'
                            ? 'bg-red-600 text-white'
                            : memo.priority === 'normal'
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {memo.priority === 'urgent' ? 'عاجل' : memo.priority === 'normal' ? 'عادي' : 'توجيه'}
                      </span>
                      <button
                        onClick={() => onDeleteStaffMemo(memo.id)}
                        className="text-slate-400 hover:text-red-400 cursor-pointer"
                        title="حذف الملاحظة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed">{memo.text}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 8: BAD WORDS FILTER & FILTER ALERTS LOG */}
      {activeTab === 'words' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs bg-slate-900/60">
          {/* Sub-tabs: Alerts Log vs Word Management */}
          <div className="flex rounded-xl bg-slate-800 p-1 border border-slate-700">
            <button
              onClick={() => setFilterSubTab('alerts')}
              className={`flex-1 py-1.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                filterSubTab === 'alerts'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
              <span>سجل تنبيهات الفلتر 🚨 ({filterAlerts.length})</span>
            </button>
            <button
              onClick={() => setFilterSubTab('words')}
              className={`flex-1 py-1.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                filterSubTab === 'words'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Filter className="w-3.5 h-3.5 text-amber-200" />
              <span>إدارة الكلمات المحظورة 📝 ({monitoredWordsList.length})</span>
            </button>
          </div>

          {filterSubTab === 'alerts' ? (
            /* SUB-TAB 1: FILTER ALERTS LOG (سجل تنبيهات الفلتر مع اسم العضو والرسالة الكاملة) */
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-2.5 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-200">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
                  <span className="font-bold text-xs">
                    سجل الرقابة الحية: يعرض اسم العضو والرسالة الكاملة التي وردت فيها الكلمة المفلترة
                  </span>
                </div>
                {filterAlerts.length > 0 && onClearFilterAlerts && (
                  <button
                    onClick={() => {
                      if (confirm('تفريغ سجل تنبيهات الفلتر بالكامل؟')) {
                        onClearFilterAlerts();
                      }
                    }}
                    className="px-2 py-1 bg-red-900/80 hover:bg-red-800 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>مسح السجل</span>
                  </button>
                )}
              </div>

              {filterAlerts.length === 0 ? (
                <div className="py-12 text-center text-slate-400 bg-slate-800/40 rounded-xl border border-dashed border-slate-700">
                  <Check className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                  <p className="font-bold text-slate-300">لا توجد تنبيهات فلتر مسجلة حالياً</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    الدردشة نظيفة ولم يتم رصد أي كلمات مخالفة حتى الآن
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {filterAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-3 bg-slate-800/90 border border-red-800/70 hover:border-red-600 rounded-xl space-y-2 transition-all shadow-xs"
                    >
                      {/* Author row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={alert.avatarUrl || DEFAULT_AVATAR_SVG}
                            alt={alert.username}
                            className="w-7 h-7 rounded-lg object-cover border border-amber-500/60"
                          />
                          <div>
                            <div className="font-black text-white text-xs flex items-center gap-1.5">
                              <span>{alert.username}</span>
                              <span>{alert.flag || '🇸🇦'}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              غرفة: {alert.room} • {alert.time}
                            </div>
                          </div>
                        </div>

                        {/* Matched Bad Word Badge */}
                        <div className="px-2 py-0.5 bg-rose-600 text-white font-black rounded-lg text-[10px] flex items-center gap-1">
                          <span>الكلمة المكتشفة:</span>
                          <span className="underline">{alert.matchedWords.join(', ')}</span>
                        </div>
                      </div>

                      {/* Full Message containing the filtered word */}
                      <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-700 text-slate-100 text-xs leading-relaxed break-words whitespace-pre-wrap">
                        <span className="text-amber-400 font-bold block mb-1 text-[10px]">
                          💬 نص الرسالة الكاملة:
                        </span>
                        <div className="font-sans">
                          {alert.fullMessage}
                        </div>
                      </div>

                      {/* Quick Moderation Actions Toolbar */}
                      <div className="flex items-center gap-1.5 pt-1 border-t border-slate-700 text-[11px] font-bold">
                        <button
                          onClick={() => onAdminAction('kick', alert.username, undefined, `كتابة كلمة محظورة: ${alert.matchedWords.join(', ')}`)}
                          className="px-2 py-1 rounded bg-slate-700 hover:bg-rose-900/80 text-rose-300 border border-slate-600 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <UserX className="w-3 h-3" />
                          <span>طرد</span>
                        </button>
                        <button
                          onClick={() => onAdminAction('mute', alert.username)}
                          className="px-2 py-1 rounded bg-slate-700 hover:bg-rose-900/80 text-rose-300 border border-slate-600 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <VolumeX className="w-3 h-3" />
                          <span>إسكات</span>
                        </button>
                        <button
                          onClick={() => onAdminAction('jailUser', alert.username, undefined, `مخالفة الفلتر: ${alert.matchedWords.join(', ')}`)}
                          className="px-2 py-1 rounded bg-slate-700 hover:bg-amber-900/80 text-amber-300 border border-slate-600 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <span>🚔 سجن</span>
                        </button>
                        <button
                          onClick={() => onAdminAction('ban', alert.username, `مخالفة الفلتر: ${alert.matchedWords.join(', ')}`)}
                          className="px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Shield className="w-3 h-3" />
                          <span>باند</span>
                        </button>
                        <button
                          onClick={() => {
                            if (onRevealNicks) {
                              onRevealNicks(alert.username);
                            } else {
                              onAdminAction('revealNicks', alert.username);
                            }
                          }}
                          className="px-2 py-1 rounded bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Search className="w-3 h-3 text-indigo-400" />
                          <span>🔍 كشف نكات</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* SUB-TAB 2: BAD WORDS FILTER MANAGEMENT (إدارة كلمات الفلتر) */
            <div className="space-y-3">
              <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 space-y-1">
                <div className="font-bold text-amber-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Filter className="w-4 h-4 text-amber-400" />
                    <span>فلتر الكلمات والعبارات المحظورة ({monitoredWordsList.length})</span>
                  </span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-black">
                    مراقبة حية
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  الكلمات المدرجة هنا يتم حجبها وتسجيلها فوراً مع اسم العضو والرسالة الكاملة في سجل تنبيهات الفلتر.
                </p>
              </div>

              {/* Add Word Input */}
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="اكتب الكلمة أو العبارة المحظورة الجديدة..."
                  value={newWordInput}
                  onChange={(e) => setNewWordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newWordInput.trim()) {
                      onAddMonitoredWord(newWordInput.trim());
                      setNewWordInput('');
                    }
                  }}
                  className="flex-1 p-2 rounded-xl text-xs bg-slate-800 border border-slate-700 focus:border-amber-500 text-white outline-none"
                />
                <button
                  onClick={() => {
                    if (newWordInput.trim()) {
                      onAddMonitoredWord(newWordInput.trim());
                      setNewWordInput('');
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>إضافة للفلتر</span>
                </button>
              </div>

              {/* Words Chips List */}
              <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300 text-xs">قائمة الكلمات النشطة بالفلتر:</span>
                  <span className="text-[10px] text-slate-400">انقر على ✕ لحذف أي كلمة</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {monitoredWordsList.map((word) => (
                    <span
                      key={word}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 text-rose-300 border border-rose-900/60 font-mono text-[11px]"
                    >
                      <span>{word}</span>
                      <button
                        type="button"
                        onClick={() => onRemoveMonitoredWord(word)}
                        className="text-slate-400 hover:text-white cursor-pointer"
                        title={`حذف [${word}] من الفلتر`}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: CHAT SHORTCUTS MANAGEMENT (قائمة الاختصارات الذكية للشات) */}
      {activeTab === 'shortcuts' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs bg-slate-900/60">
          {/* Header Banner */}
          <div className="p-3 bg-gradient-to-r from-amber-950/60 via-slate-800 to-amber-950/60 rounded-2xl border border-amber-500/40 shadow-md space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400">
                  <Zap className="w-4 h-4 fill-amber-400" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-amber-200">قائمة اختصارات الشات الذكية ⚡</h4>
                  <p className="text-[10px] text-amber-300/80">استبدال تلقائي فوري للكلمات والرموز بالجمل الكاملة</p>
                </div>
              </div>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold">
                {shortcuts.length} اختصار نشط
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed pt-1">
              أضف اختصاراتك يدوياً هنا؛ بمجرد كتابة رمز الاختصار (مثال: <strong className="text-amber-300">نورت</strong> أو <strong className="text-amber-300">ن</strong>) في أي مكان بالشات يتم استبداله فوراً بالجملة البديلة المحددة (مثال: <strong className="text-amber-300">نورت الشات بطلتك الحلوه</strong> أو <strong className="text-amber-300">نورتو يالي دخلتو</strong>).
            </p>
          </div>

          {/* Sub-Switch: إدارة الاختصارات vs مختبر التجربة الفوري */}
          <div className="flex rounded-xl bg-slate-800 p-1 border border-slate-700">
            <button
              onClick={() => setShortcutSubTab('manage')}
              className={`flex-1 py-1.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                shortcutSubTab === 'manage'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>إدارة وإضافة الاختصارات ({shortcuts.length})</span>
            </button>
            <button
              onClick={() => setShortcutSubTab('tester')}
              className={`flex-1 py-1.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                shortcutSubTab === 'tester'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-indigo-300" />
              <span>مختبر التجربة الحية 🧪</span>
            </button>
          </div>

          {shortcutSubTab === 'manage' ? (
            <div className="space-y-3">
              {/* Form: Add New Shortcut Manually */}
              <div className="p-3 bg-slate-800/90 rounded-2xl border border-slate-700 space-y-2.5 shadow-sm">
                <div className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-amber-400" />
                  <span>إضافة اختصار جديد يدوياً:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-300 block">اسم / رمز الاختصار:</label>
                    <input
                      type="text"
                      placeholder="مثال: نورت  أو  ن"
                      value={shortcutTriggerInput}
                      onChange={(e) => setShortcutTriggerInput(e.target.value)}
                      className="w-full p-2 rounded-xl text-xs bg-slate-900 border border-slate-700 focus:border-amber-400 text-amber-300 font-bold outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-300 block">الجملة أو النص البديل الكامل:</label>
                    <input
                      type="text"
                      placeholder="مثال: نورت الشات بطلتك الحلوه 🌹  أو  نورتو يالي دخلتو 🌟"
                      value={shortcutReplacementInput}
                      onChange={(e) => setShortcutReplacementInput(e.target.value)}
                      className="w-full p-2 rounded-xl text-xs bg-slate-900 border border-slate-700 focus:border-amber-400 text-white outline-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const cleanTrig = shortcutTriggerInput.trim();
                    const cleanRepl = shortcutReplacementInput.trim();
                    if (!cleanTrig || !cleanRepl) {
                      showToast('يرجى كتابة رمز الاختصار والجملة البديلة كاملة', 'error');
                      return;
                    }
                    if (onAddShortcut) {
                      onAddShortcut(cleanTrig, cleanRepl);
                      setShortcutTriggerInput('');
                      setShortcutReplacementInput('');
                      showToast(`تم حفظ وتفعيل الاختصار [${cleanTrig}] ⚡`, 'success');
                    }
                  }}
                  disabled={!shortcutTriggerInput.trim() || !shortcutReplacementInput.trim()}
                  className="w-full py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ وتفعيل الاختصار في الشات الآن ⚡</span>
                </button>

                {/* Fast Clickable Presets Bar */}
                <div className="pt-2 border-t border-slate-700/60 space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-bold block">
                    ⚡ اقتراحات واختصارات جاهزة للإضافة السريعة بضغطة واحدة:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {DEFAULT_PRESET_SHORTCUTS.map((preset) => (
                      <button
                        key={preset.trigger}
                        type="button"
                        onClick={() => {
                          setShortcutTriggerInput(preset.trigger);
                          setShortcutReplacementInput(preset.replacement);
                          showToast(`تم نسخ الاقتراح [${preset.trigger}] للحقول 📝`, 'info');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-amber-950/80 border border-slate-700 hover:border-amber-500/60 text-[11px] text-amber-200 transition-colors flex items-center gap-1 cursor-pointer"
                        title={preset.label}
                      >
                        <span className="font-black text-amber-400">[{preset.trigger}]</span>
                        <span className="text-slate-400">➔</span>
                        <span className="truncate max-w-[130px] text-[10px]">{preset.replacement}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Search Bar for Shortcuts */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="بحث في الاختصارات أو الجمل البديلة..."
                    value={shortcutSearchQuery}
                    onChange={(e) => setShortcutSearchQuery(e.target.value)}
                    className="w-full p-2 pr-7 rounded-xl text-xs bg-slate-800 border border-slate-700 text-white outline-none"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                </div>
                {shortcutSearchQuery && (
                  <button
                    onClick={() => setShortcutSearchQuery('')}
                    className="px-2 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs"
                  >
                    إلغاء
                  </button>
                )}
              </div>

              {/* Active Shortcuts Cards List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300 font-bold px-1">
                  <span>الاختصارات المسجلة والنشطة ({shortcuts.length}):</span>
                  <span className="text-[10px] text-slate-400">تُستبدل تلقائياً في الشات العام والخاص</span>
                </div>

                {shortcuts.length === 0 ? (
                  <div className="p-6 bg-slate-800/60 rounded-2xl border border-slate-700 text-center text-slate-400 space-y-2">
                    <Sparkles className="w-8 h-8 text-amber-400 mx-auto opacity-40" />
                    <p className="text-xs">لا توجد اختصارات مضافة بعد.</p>
                    <p className="text-[10px] text-slate-500">أضف اختصارات مخصصة من الحقول بالأعلى أو اضغط على الاقتراحات السريعة.</p>
                  </div>
                ) : (
                  shortcuts
                    .filter((sc) => {
                      if (!shortcutSearchQuery.trim()) return true;
                      const q = shortcutSearchQuery.toLowerCase();
                      return sc.trigger.toLowerCase().includes(q) || sc.replacement.toLowerCase().includes(q);
                    })
                    .map((sc) => (
                      <div
                        key={sc.id}
                        className="p-3 bg-slate-800 rounded-xl border border-slate-700 hover:border-amber-500/50 transition-colors space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/40 font-mono font-black text-xs shadow-xs flex items-center gap-1">
                              <Zap className="w-3 h-3 fill-amber-400" />
                              <span>{sc.trigger}</span>
                            </span>
                            <span className="text-amber-500 font-bold">➔</span>
                            <span className="text-slate-100 font-bold text-xs select-text">
                              {sc.replacement}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingShortcut(sc);
                                setEditTriggerInput(sc.trigger);
                                setEditReplacementInput(sc.replacement);
                              }}
                              className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-amber-300 text-xs transition-colors cursor-pointer"
                              title="تعديل هذا الاختصار"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`هل أنت متأكد من حذف الاختصار [${sc.trigger}]؟`)) {
                                  if (onDeleteShortcut) {
                                    onDeleteShortcut(sc.id);
                                    showToast(`تم حذف الاختصار [${sc.trigger}]`, 'info');
                                  }
                                }
                              }}
                              className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-xs transition-colors cursor-pointer"
                              title="حذف هذا الاختصار"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-700/60">
                          <span>بواسطة: {sc.createdBy || 'الإدارة'}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setTestShortcutText(sc.trigger);
                              setShortcutSubTab('tester');
                              showToast(`تم إرسال [${sc.trigger}] لمختبر التجربة 🧪`, 'info');
                            }}
                            className="text-amber-400 hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <span>تجربة الاختصار ➔</span>
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          ) : (
            /* SUB-TAB 2: INTERACTIVE LIVE SHORTCUT TESTER */
            <div className="space-y-3">
              <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 space-y-1">
                <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 fill-indigo-400" />
                  <span>مختبر التجربة الحية الفورية للاختصارات:</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  اكتب أي نص أو كلمة اختصار في الحقل أدناه (مثل: <strong className="text-amber-300">نورت</strong> أو <strong className="text-amber-300">ن</strong> أو <strong className="text-amber-300">يا هلا نورت المجلس</strong>) وشاهد كيف يستبدلها النظام تلقائياً وبدقة!
                </p>
              </div>

              <div className="p-3 bg-slate-800/90 rounded-2xl border border-slate-700 space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-300 block">النص المكتوب (كما يكتبه العضو):</label>
                  <input
                    type="text"
                    value={testShortcutText}
                    onChange={(e) => setTestShortcutText(e.target.value)}
                    placeholder="اكتب هنا لتجربة الاستبدال (مثال: نورت أو ن)..."
                    className="w-full p-2.5 rounded-xl text-xs bg-slate-900 border border-indigo-500/50 text-white outline-none focus:border-indigo-400"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] text-slate-400 self-center">أمثلة سريعة للتجربة:</span>
                  {['نورت', 'ن', 'سلام', 'برب', 'باك', 'يا هلا نورت الشات', 'ن تفضلوا'].map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => setTestShortcutText(ex)}
                      className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-amber-300 hover:border-amber-400 cursor-pointer"
                    >
                      {ex}
                    </button>
                  ))}
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-1.5">
                  <div className="text-[10px] font-bold text-indigo-400 flex items-center justify-between">
                    <span>كيف ستظهر الرسالة في الشات بعد الإرسال:</span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                      معاينة حية
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 text-amber-200 font-bold text-xs border border-slate-800 select-text leading-relaxed">
                    {expandClientShortcuts(testShortcutText, shortcuts) || <span className="text-slate-600 font-normal">اكتب نصاً للمعاينة...</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Edit Shortcut Modal */}
          {editingShortcut && (
            <div
              onClick={(e) => {
                if (e.target === e.currentTarget) setEditingShortcut(null);
              }}
              className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 backdrop-blur-xs text-right"
            >
              <div className="w-full max-w-sm bg-[#1e1712] rounded-2xl border-2 border-amber-500 p-4 text-slate-100 space-y-3 shadow-2xl">
                <div className="flex items-center justify-between border-b border-[#3e2c1c] pb-2">
                  <div className="font-bold text-sm text-amber-300 flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4 text-amber-400" />
                    <span>تعديل الاختصار [{editingShortcut.trigger}]</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingShortcut(null)}
                    className="w-6 h-6 rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-300 block mb-1">اسم / رمز الاختصار:</label>
                    <input
                      type="text"
                      value={editTriggerInput}
                      onChange={(e) => setEditTriggerInput(e.target.value)}
                      className="w-full p-2 bg-black/50 border border-slate-700 rounded-xl text-xs text-amber-300 font-bold outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-300 block mb-1">الجملة البديلة الكاملة:</label>
                    <textarea
                      value={editReplacementInput}
                      onChange={(e) => setEditReplacementInput(e.target.value)}
                      rows={3}
                      className="w-full p-2 bg-black/50 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (!editTriggerInput.trim() || !editReplacementInput.trim()) {
                        showToast('يرجى ملء جميع الحقول', 'error');
                        return;
                      }
                      if (onUpdateShortcut) {
                        onUpdateShortcut(editingShortcut.id, editTriggerInput.trim(), editReplacementInput.trim());
                      } else if (onAddShortcut) {
                        onAddShortcut(editTriggerInput.trim(), editReplacementInput.trim());
                      }
                      setEditingShortcut(null);
                      showToast('تم حفظ تعديلات الاختصار بنجاح ⚡', 'success');
                    }}
                    className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow cursor-pointer"
                  >
                    حفظ التعديل ✔️
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingShortcut(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 9: AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs bg-slate-900/60">
          {/* Persistent Log Banner */}
          <div className="p-2.5 bg-slate-800/90 border border-amber-500/30 rounded-xl text-slate-300 flex items-center justify-between text-[11px] font-medium shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold text-sm">🛡️</span>
              <div>
                <div className="font-bold text-amber-200">سجل الأحداث والنشاطات الإدارية الدائم (Persistent Log)</div>
                <div className="text-[10px] text-slate-400">محفوظ في قاعدة البيانات باستمرار ولا يُحذف بالخروج، ليتسنى لك مراجعة كل ما حدث أثناء غيابك.</div>
              </div>
            </div>
            <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
              {monitorLogs.length} حدث مسجل
            </span>
          </div>

          {/* Filter Bar & Export & Clear Log Button */}
          <div className="flex items-center justify-between gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="بحث في السجل..."
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
                className="w-full p-2 pr-7 rounded-xl text-xs bg-slate-800 border border-slate-700 text-white outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
            </div>

            <button
              onClick={handleExportLogs}
              className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
              title="تصدير السجل لملف نصي"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير</span>
            </button>

            {(currentUser.role === 'admin' || currentUser.role === 'super') && (
              <button
                onClick={() => {
                  if (confirm('تنبيه هام: هل أنت متأكد من رغبتك في حذف السجل الإداري ومسح جميع الأحداث والنشاطات نهائياً من قاعدة البيانات؟')) {
                    onClearMonitorLogs();
                  }
                }}
                className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white border border-red-500 text-[11px] font-black flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-md active:scale-95 transition-all"
                title="حذف السجل الإداري بالكامل من قاعدة البيانات"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف السجل</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-bold">
            {(['all', 'kick_ban', 'mute', 'jail', 'mic', 'role', 'security'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setLogTypeFilter(t)}
                className={`px-2.5 py-1 rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
                  logTypeFilter === t
                    ? 'bg-amber-500 text-black font-black'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {t === 'all' && 'الكل'}
                {t === 'kick_ban' && 'طرد وباند'}
                {t === 'mute' && 'إسكات'}
                {t === 'jail' && 'سجن'}
                {t === 'mic' && 'المايكات'}
                {t === 'role' && 'الرتب والأسماء'}
                {t === 'security' && 'الأمان'}
              </button>
            ))}
          </div>

          {/* Logs List */}
          <div className="space-y-1.5 max-h-96 overflow-y-auto font-mono text-[11px]">
            {filteredLogs.length === 0 ? (
              <div className="py-8 text-center text-slate-400 bg-slate-800/40 rounded-xl border border-dashed border-slate-700">
                لا توجد سجلات مطابقة حالياً.
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-2 rounded-lg bg-slate-800/90 border border-slate-700 flex items-start justify-between gap-2"
                >
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-amber-400 block mb-0.5">[{log.time}]</span>
                    <span className="text-slate-200 leading-relaxed">{log.description}</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 flex-shrink-0 font-bold uppercase">
                    {log.type}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 10: PERMISSIONS HIERARCHY MATRIX & DYNAMIC PERMISSIONS MANAGER */}
      {activeTab === 'matrix' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs bg-slate-900/60">
          {/* Dynamic Role Permissions Management Box (إدارة محتوى وصلاحيات كل رتبة بالـ Checkboxes) */}
          <div className="bg-slate-800/90 border border-amber-500/50 rounded-2xl p-3.5 space-y-3 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-amber-200">إدارة محتوى وصلاحيات الرتب ديناميكياً ⚙️</h4>
                  <p className="text-[10px] text-amber-300/80">حدد الرتبة ثم ضع علامة (✓) للمنح أو اتركها فارغة للمنع</p>
                </div>
              </div>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold">
                حفظ فوري بالسيرفر
              </span>
            </div>

            {/* Role Selector Tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900 rounded-xl border border-slate-700">
              {(
                [
                  { id: 'admin', label: '👑 المدير', title: 'Admin' },
                  { id: 'super', label: '🛡️ السوبر', title: 'Super' },
                  { id: 'member', label: '🎖️ العضو', title: 'Member' },
                  { id: 'guest', label: '👤 الزائر', title: 'Guest' }
                ] as const
              ).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRoleForPerms(r.id)}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                    selectedRoleForPerms === r.id
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <div>{r.label}</div>
                  <div className="text-[9px] opacity-75">{r.title}</div>
                </button>
              ))}
            </div>

            {/* Permissions Checkbox Grid for Selected Role */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                <span>الصلاحيات المتاحة لرتبة [{selectedRoleForPerms.toUpperCase()}]:</span>
                <span className="text-[10px] text-amber-400">انقر للتبديل (✓ للمنح / فارغة للمنع)</span>
              </div>

              {(() => {
                const permsForRole = rolePermissions?.[selectedRoleForPerms] || {};
                const PERMISSIONS_DEF = [
                  { key: 'canFilter', label: 'جرس وتنبيهات الفلتر', desc: 'الاطلاع على جرس وتنبيهات الكلمات المحظورة' },
                  { key: 'canDeleteMessage', label: 'حذف رسائل الشات', desc: 'إمكانية إزالة وحذف رسائل الشات العام' },
                  { key: 'canDeleteWallPost', label: 'حذف منشورات الحائط', desc: 'إمكانية إزالة أي منشور مخالف بالحائط' },
                  { key: 'canMute', label: 'إسكات الأعضاء (نص وصوت)', desc: 'فرض الإسكات والكتم المؤقت على المخالفين' },
                  { key: 'canPullMic', label: 'سحب المايك', desc: 'تنزيل وسحب المايك من المتحدثين' },
                  { key: 'canKick', label: 'طرد المستخدمين', desc: 'طرد المخالف من الغرفة وإشعاره بالسبب' },
                  { key: 'canBan', label: 'الباند والحظر الدائم', desc: 'حظر المستخدم وحظر الـ IP' },
                  { key: 'canJail', label: 'سجن واحتجاز المخالفين', desc: 'إيداع العضو بسجن حسان برو' },
                  { key: 'canLockRoom', label: 'قفل الشات في الغرفة', desc: 'إغلاق أو فتح إرسال الرسائل بالروم' },
                  { key: 'canLockVoice', label: 'قفل المايكات للإدارة', desc: 'حصر المايكات على طاقم الإدارة' },
                  { key: 'canBroadcast', label: 'إرسال إشعار عام', desc: 'إرسال إشعار وتنبيه ملكي عائم للغرفة' },
                  { key: 'canManageShortcuts', label: 'إدارة الاختصارات الذكية', desc: 'إضافة وتعديل اختصارات الشات' },
                  { key: 'canChangeGlobalTheme', label: 'تعميم الثيم والخط العام', desc: 'تطبيق الثيم والخط على جميع الأعضاء' },
                  { key: 'canTakeMic', label: 'الصعود للمايك', desc: 'حجز مايك والتحدث صوتياً' },
                  { key: 'canSendMedia', label: 'إرسال الصور والوسائط والصوت', desc: 'إرسال الصور والفيديوهات والتسجيل الصوتي' }
                ];

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PERMISSIONS_DEF.map((p) => {
                      const isChecked = Boolean(permsForRole[p.key]);
                      return (
                        <label
                          key={p.key}
                          className={`p-2 rounded-xl border flex items-start gap-2.5 transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-amber-950/40 border-amber-500/70 text-amber-100 shadow-2xs'
                              : 'bg-slate-900/80 border-slate-700/80 text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              if (onUpdateRolePermissions) {
                                onUpdateRolePermissions(selectedRoleForPerms, { [p.key]: checked });
                                showToast(
                                  checked
                                    ? `تم منح صلاحية [${p.label}] لرتبة [${selectedRoleForPerms}] بنجاح ✓`
                                    : `تم سحب صلاحية [${p.label}] من رتبة [${selectedRoleForPerms}] ✗`,
                                  'success'
                                );
                              }
                            }}
                            className="mt-0.5 w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-600 cursor-pointer accent-amber-500 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-xs flex items-center gap-1.5">
                              <span>{p.label}</span>
                              {isChecked ? (
                                <span className="text-[10px] text-emerald-400 font-bold">✓ ممنوحة</span>
                              ) : (
                                <span className="text-[10px] text-slate-500">فارغة (ممنوعة)</span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 line-clamp-1">{p.desc}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="bg-amber-950/40 border border-amber-600/50 p-3 rounded-xl text-amber-200 leading-relaxed space-y-1">
            <div className="font-bold text-sm flex items-center gap-1.5 text-amber-300">
              <Award className="w-4 h-4 text-amber-400" />
              <span>نظام وقواعد الحماية الهرمية الصارمة</span>
            </div>
            <p className="text-[11px] text-amber-200/90">
              يتبع نظام حسان برو تسلسلاً هرمياً صارماً: <strong className="font-black text-amber-100">Admin &gt; Super &gt; Member &gt; Guest</strong>. لا يمكن لأي مشرف تطبيق عقوبة أو تعديل بيانات عضو له نفس الرتبة أو رتبة أعلى منه.
            </p>
          </div>

          <div className="border border-slate-700 rounded-xl overflow-hidden shadow-xs bg-slate-800">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#241a12] text-amber-300 text-[11px]">
                <tr>
                  <th className="p-2.5 text-right">الخاصية / الإجراء الإداري</th>
                  <th className="p-2.5 text-center text-red-400">👑 المدير (Admin)</th>
                  <th className="p-2.5 text-center text-amber-400">🛡️ السوبر (Super)</th>
                  <th className="p-2.5 text-center text-indigo-300">🎖️ العضو (Member)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700 text-[11px]">
                <tr>
                  <td className="p-2.5 font-bold text-white">قفل الطوارئ العام وإيقاف الدردشة</td>
                  <td className="p-2.5 text-center text-emerald-400 font-black">✔️ كامل</td>
                  <td className="p-2.5 text-center text-rose-400 font-bold">❌ محصور</td>
                  <td className="p-2.5 text-center text-rose-400 font-bold">❌ غير متاح</td>
                </tr>
                <tr className="bg-slate-800/50">
                  <td className="p-2.5 font-bold text-white">الباند والحظر الدائم بالـ IP</td>
                  <td className="p-2.5 text-center text-emerald-400 font-black">✔️ كامل</td>
                  <td className="p-2.5 text-center text-rose-400 font-bold">❌ محصور</td>
                  <td className="p-2.5 text-center text-rose-400 font-bold">❌ غير متاح</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-white">سجن واحتجاز المخالفين</td>
                  <td className="p-2.5 text-center text-emerald-400 font-black">✔️ كامل</td>
                  <td className="p-2.5 text-center text-emerald-400 font-bold">✔️ للأعضاء والزوار</td>
                  <td className="p-2.5 text-center text-rose-400 font-bold">❌ غير متاح</td>
                </tr>
                <tr className="bg-slate-800/50">
                  <td className="p-2.5 font-bold text-white">طرد وإسكات المستخدمين (نصي وصوتي)</td>
                  <td className="p-2.5 text-center text-emerald-400 font-black">✔️ كامل</td>
                  <td className="p-2.5 text-center text-emerald-400 font-bold">✔️ للأعضاء والزوار</td>
                  <td className="p-2.5 text-center text-rose-400 font-bold">❌ غير متاح</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-white">إنشاء وحذف الغرف الأساسية</td>
                  <td className="p-2.5 text-center text-emerald-400 font-black">✔️ كامل</td>
                  <td className="p-2.5 text-center text-rose-400 font-bold">❌ محصور</td>
                  <td className="p-2.5 text-center text-rose-400 font-bold">❌ غير متاح</td>
                </tr>
                <tr className="bg-slate-800/50">
                  <td className="p-2.5 font-bold text-white">ترقية وتعيين الرتب والألقاب</td>
                  <td className="p-2.5 text-center text-emerald-400 font-black">✔️ كامل</td>
                  <td className="p-2.5 text-center text-rose-400 font-bold">❌ محصور</td>
                  <td className="p-2.5 text-center text-rose-400 font-bold">❌ غير متاح</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-white">إطلاق صافرات الإنذار الإداري</td>
                  <td className="p-2.5 text-center text-emerald-400 font-black">✔️ كامل</td>
                  <td className="p-2.5 text-center text-emerald-400 font-bold">✔️ متاح</td>
                  <td className="p-2.5 text-center text-rose-400 font-bold">❌ غير متاح</td>
                </tr>
                <tr className="bg-slate-800/50">
                  <td className="p-2.5 font-bold text-white">إفراغ سجل المراقبة كاملاً</td>
                  <td className="p-2.5 text-center text-emerald-400 font-black">✔️ كامل</td>
                  <td className="p-2.5 text-center text-rose-400 font-bold">❌ محصور</td>
                  <td className="p-2.5 text-center text-rose-400 font-bold">❌ غير متاح</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: GENERAL WELCOME MESSAGES MANAGEMENT (إدارة الرسائل الترحيبية العامة للشات) */}
      {activeTab === 'welcome' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs bg-slate-900/80">
          <div className="bg-gradient-to-r from-emerald-950/60 via-slate-800 to-amber-950/60 border border-emerald-500/40 rounded-2xl p-4 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-emerald-200">إدارة الرسائل الترحيبية العامة للشات 💬</h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    التحكم بالرسالة الترحيبية الرسمية التي تظهر تلقائياً للزوار والأعضاء فور دخولهم إلى الشات
                  </p>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                لوحة تحكم الأدمن
              </span>
            </div>

            {/* Toggle Status */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div>
                <span className="font-bold text-slate-200 block text-xs">تفعيل رسالة الترحيب العامة:</span>
                <span className="text-[10px] text-slate-400">
                  عند التفعيل، سيرسل النظام رسالة ترحيب منسقة للأعضاء والزوار عند دخولهم
                </span>
              </div>
              <button
                type="button"
                onClick={() => setGeneralWelcomeEnabled(!generalWelcomeEnabled)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer border ${
                  generalWelcomeEnabled
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {generalWelcomeEnabled ? 'مفعلة ✔️' : 'معطلة ✕'}
              </button>
            </div>

            {/* Sender / Badge Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-amber-300 block">
                عنوان ولقب مرسل الترحيب (اسم الجهة أو الإدارة):
              </label>
              <input
                type="text"
                value={generalWelcomeTitle}
                onChange={(e) => setGeneralWelcomeTitle(e.target.value)}
                placeholder="مثال: إدارة حسان برو 🦅"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:border-emerald-500 outline-none"
              />
            </div>

            {/* Message Text */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-emerald-300 block">
                نص رسالة الترحيب العامة:
              </label>
              <textarea
                rows={4}
                value={generalWelcomeText}
                onChange={(e) => setGeneralWelcomeText(e.target.value)}
                placeholder="اكتب نص الترحيب العام الذي يظهر للجميع..."
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:border-emerald-500 outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Quick Template Presets */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 block">
                قوالب ترحيبية جاهزة وفخمة (انقر لاختيارها):
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setGeneralWelcomeTitle('إدارة حسان برو 🦅');
                    setGeneralWelcomeText('نحن سعداء بتشريفك فأهلاً بك عطراً فوّاحاً ينثرُ شذاه في كلّ الأرجاء .. نتمنى لك وقتاً ممتعاً 🌹');
                  }}
                  className="p-2 text-right rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-slate-800 text-[10px] text-amber-200 cursor-pointer"
                >
                  <span className="font-bold block text-amber-300 mb-0.5">👑 ترحيب ملكي أصيل</span>
                  <span className="line-clamp-1 opacity-80">أهلاً بك عطراً فوّاحاً ينثرُ شذاه...</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGeneralWelcomeTitle('مجلس الصقور 🦅');
                    setGeneralWelcomeText('مرحباً بصقرنا الغالي في مجلس الصقور .. حياك الله وبياك في شات حسان برو ملتقى الأصالة والشهامة 🦅✨');
                  }}
                  className="p-2 text-right rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-slate-800 text-[10px] text-amber-200 cursor-pointer"
                >
                  <span className="font-bold block text-amber-300 mb-0.5">🦅 ترحيب الصقور</span>
                  <span className="line-clamp-1 opacity-80">مرحباً بصقرنا الغالي في مجلس الصقور...</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGeneralWelcomeTitle('أسرة حسان برو 🤍');
                    setGeneralWelcomeText('يا هلا والله ومسهلا بنور العين .. حللت أهلاً ووطئت سهلاً في بيتك الثاني بين إخوتك وأحبتك 🤍☕');
                  }}
                  className="p-2 text-right rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-slate-800 text-[10px] text-amber-200 cursor-pointer"
                >
                  <span className="font-bold block text-amber-300 mb-0.5">☕ ترحيب العائلة الدافئ</span>
                  <span className="line-clamp-1 opacity-80">يا هلا والله ومسهلا بنور العين...</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGeneralWelcomeTitle('إدارة حسان برو 🌟');
                    setGeneralWelcomeText('يسعدنا ويشرفنا تواجدك العاطر معنا .. نتمنى لك أمتع اللحظات وأجمل الذكريات في شات حسان برو 🌟🌹');
                  }}
                  className="p-2 text-right rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-slate-800 text-[10px] text-amber-200 cursor-pointer"
                >
                  <span className="font-bold block text-amber-300 mb-0.5">🌟 ترحيب التميز والتألق</span>
                  <span className="line-clamp-1 opacity-80">يسعدنا ويشرفنا تواجدك العاطر معنا...</span>
                </button>
              </div>
            </div>

            {/* Live Preview Card */}
            <div className="p-3 bg-white/95 text-slate-900 rounded-xl border border-amber-400 shadow-md space-y-1">
              <div className="text-[10px] font-bold text-slate-500 mb-1">معاينة حية لرسالة الترحيب كما ستظهر في الغرفة:</div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-red-700">
                <span>[ {generalWelcomeTitle || 'إدارة حسان برو'} ]</span>
                <span className="px-1.5 py-0.2 bg-red-100 text-red-700 border border-red-300 rounded text-[9px]">ترحـيـب عام</span>
              </div>
              <div className="text-xs text-slate-800 leading-relaxed font-medium">
                {generalWelcomeText || 'نص رسالة الترحيب...'}
              </div>
            </div>

            {/* Action Save Button */}
            <div className="pt-2 border-t border-slate-700 flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  if (onUpdateGeneralWelcome) {
                    onUpdateGeneralWelcome({
                      enabled: generalWelcomeEnabled,
                      title: generalWelcomeTitle.trim(),
                      message: generalWelcomeText.trim()
                    });
                    showToast('تم حفظ وتثبيت الرسالة الترحيبية العامة للشات بنجاح 💾', 'success');
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-amber-600 hover:from-emerald-500 hover:to-amber-500 text-white font-black text-xs flex items-center gap-1.5 shadow-lg cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>حفظ وتثبيت الرسالة الترحيبية العامة 💾</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: EMBLEMS & CUSTOM EMOJIS MANAGEMENT (نظام إدارة وعرض الرموز الألقاب المصورة والوجوه التعبيرية) */}
      {activeTab === 'emblems' && (
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 text-xs bg-slate-900/90 text-right">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-purple-950/70 via-slate-900 to-amber-950/70 border border-purple-500/40 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300">
                  <Palette className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-purple-200">
                    نظام إدارة وعرض الرموز، الألقاب المصورة والوجوه التعبيرية 🎨
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    التحكم الشامل ببنرات الأسوابر (500x50)، أيقونات الهدايا، الستيكرات، والفيسات المخصصة ذات الأكواد التسلسلية (ف1..ف10)
                  </p>
                </div>
              </div>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full font-bold">
                إجمالي الأصول: {emblemsConfig.items.length}
              </span>
            </div>

            {/* Sub-tabs selector for the 4 required sections */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEmblemSubTab('banners')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                  emblemSubTab === 'banners'
                    ? 'bg-amber-600/30 border-amber-400 text-amber-200 font-black shadow-md ring-1 ring-amber-400'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-1 text-xs">
                  <span>🖼️</span>
                  <span>أيقونات السوابر</span>
                </div>
                <span className="text-[10px] text-amber-400 font-mono">
                  (500x50 Banners) [
                  {emblemsConfig.items.filter((i) => i.type === 'banner').length}]
                </span>
              </button>

              <button
                type="button"
                onClick={() => setEmblemSubTab('gifts')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                  emblemSubTab === 'gifts'
                    ? 'bg-rose-600/30 border-rose-400 text-rose-200 font-black shadow-md ring-1 ring-rose-400'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-1 text-xs">
                  <span>🎖️</span>
                  <span>أيقونات الهدايا</span>
                </div>
                <span className="text-[10px] text-rose-400 font-mono">
                  (Gift Icons) [
                  {emblemsConfig.items.filter((i) => i.type === 'gift').length}]
                </span>
              </button>

              <button
                type="button"
                onClick={() => setEmblemSubTab('stickers')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                  emblemSubTab === 'stickers'
                    ? 'bg-indigo-600/30 border-indigo-400 text-indigo-200 font-black shadow-md ring-1 ring-indigo-400'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-1 text-xs">
                  <span>🎭</span>
                  <span>الستيكرات</span>
                </div>
                <span className="text-[10px] text-indigo-400 font-mono">
                  (Stickers) [
                  {emblemsConfig.items.filter((i) => i.type === 'sticker').length}]
                </span>
              </button>

              <button
                type="button"
                onClick={() => setEmblemSubTab('emojis')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                  emblemSubTab === 'emojis'
                    ? 'bg-purple-600/30 border-purple-400 text-purple-200 font-black shadow-md ring-1 ring-purple-400'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-1 text-xs">
                  <span>😊</span>
                  <span>الفيسات المخصصة</span>
                </div>
                <span className="text-[10px] text-purple-400 font-mono">
                  (ف1، ف2...) [
                  {emblemsConfig.items.filter((i) => i.type === 'emoji').length}]
                </span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 1. أيقونات السوابر (Name Logos / Banners: 500x50 PNG/GIF) */}
          {/* ========================================================================= */}
          {emblemSubTab === 'banners' && (
            <div className="space-y-4">
              {/* Notice & Standards */}
              <div className="p-3 bg-amber-950/30 border border-amber-500/40 rounded-xl space-y-1">
                <div className="font-bold text-amber-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span>🖼️</span>
                    <span>معايير سوابر وبنرات الأسماء المصورة (500x50)</span>
                  </span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-mono font-bold">
                    PNG شفاف / GIF متحرك
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  هذه البطاقات المصورة بمقاس <strong className="text-amber-200 font-mono font-bold">500x50 بكسل</strong> تحل محل الاسم النصي للعضو في قائمة المتواجدين بالكامل، وتظهر في الملف الشخصي لاختيار أحدها وتثبيته.
                </p>
              </div>

              {/* Add New Banner Form */}
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                <div className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
                  <PlusCircle className="w-4 h-4 text-amber-400" />
                  <span>إضافة وتخزين بنر / سوابر جديد (500x50)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      اسم / عنوان البنر (لتمييزه في القائمة):
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: سوابر المدير العام الذهبي"
                      value={bannerTitleInput}
                      onChange={(e) => setBannerTitleInput(e.target.value)}
                      className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      تقييد العضو أو الرتبة (اختياري):
                    </label>
                    <select
                      value={bannerRoleInput}
                      onChange={(e) => setBannerRoleInput(e.target.value)}
                      className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-amber-500"
                    >
                      <option value="all">متاح للجميع</option>
                      <option value="admin">مدير النظام (Admin) فقط</option>
                      <option value="super">مشرف سوبر (Super) فما فوق</option>
                      <option value="member">الأعضاء المسجلين فقط</option>
                    </select>
                  </div>
                </div>

                {/* Banner Image URL or File Upload */}
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    رابط الصورة المباشر أو الرفع من الجهاز (PNG شفاف أو GIF متحرك):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="https://example.com/banner_500x50.png أو data:image/..."
                      value={bannerUrlInput}
                      onChange={(e) => setBannerUrlInput(e.target.value)}
                      className="flex-1 p-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-amber-500 font-mono"
                    />
                    <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-amber-300 flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors">
                      <Download className="w-3.5 h-3.5" />
                      <span>رفع ملف 📁</span>
                      <input
                        type="file"
                        accept="image/png,image/gif,image/jpeg,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            showToast('جاري رفع البنر... ⏳', 'info');
                            uploadMediaWithProgress(file)
                              .then((res) => {
                                if (res?.url) {
                                  setBannerUrlInput(res.url);
                                  if (!bannerTitleInput) {
                                    setBannerTitleInput(file.name.replace(/\.[^/.]+$/, ''));
                                  }
                                  showToast('تم تحميل تصميم البنر بنجاح جاهز للحفظ ✅', 'success');
                                }
                              })
                              .catch((err) => {
                                showToast('فشل رفع البنر: ' + (err?.message || 'خطأ'), 'error');
                              });
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                {/* Live Preview of Input Banner */}
                {bannerUrlInput && (
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-amber-500/40 space-y-1">
                    <div className="text-[10px] text-amber-400 font-bold">معاينة البنر الحالية (عرض كامل بمقاس 500x50):</div>
                    <div className="w-full max-w-[500px] h-[50px] mx-auto bg-black/50 border border-slate-800 rounded-lg flex items-center justify-center overflow-hidden">
                      <img
                        src={bannerUrlInput}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                )}

                {/* Fast Preset SVG Generators for Instant Banners */}
                <div className="pt-1">
                  <div className="text-[10px] font-bold text-slate-400 mb-1.5">
                    أو اختر نموذجاً جاهزاً فخماً لتوليده فوراً بمقاس (500x50):
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const uri = createBannerSvgDataUri('المدير التنفيذي 🦅', '#1c1917', '#451a03', '#f59e0b', '👑');
                        setBannerTitleInput('المدير التنفيذي الملكي');
                        setBannerUrlInput(uri);
                      }}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-amber-600/50 text-[10px] text-amber-300 font-bold cursor-pointer text-center"
                    >
                      👑 المدير التنفيذي الملكي
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const uri = createBannerSvgDataUri('صقر الجزيرة 🦅', '#052e16', '#14532d', '#22c55e', '🦅');
                        setBannerTitleInput('صقر الجزيرة الأخضر');
                        setBannerUrlInput(uri);
                      }}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-emerald-600/50 text-[10px] text-emerald-300 font-bold cursor-pointer text-center"
                    >
                      🦅 صقر الجزيرة الأخضر
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const uri = createBannerSvgDataUri('أمير القلوب ❤️', '#4c0519', '#881337', '#f43f5e', '💎');
                        setBannerTitleInput('أمير القلوب الياقوتي');
                        setBannerUrlInput(uri);
                      }}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-rose-600/50 text-[10px] text-rose-300 font-bold cursor-pointer text-center"
                    >
                      💎 أمير القلوب الياقوتي
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const uri = createBannerSvgDataUri('أسطورة حسان برو ✨', '#3b0764', '#581c87', '#a855f7', '⭐');
                        setBannerTitleInput('أسطورة حسان برو الماسي');
                        setBannerUrlInput(uri);
                      }}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-purple-600/50 text-[10px] text-purple-300 font-bold cursor-pointer text-center"
                    >
                      ⭐ أسطورة حسان برو الماسي
                    </button>
                  </div>
                </div>

                {/* Save Banner Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (!bannerUrlInput.trim()) {
                        showToast('يرجى إدخال رابط البنر أو رفع ملف الصورة أولاً', 'error');
                        return;
                      }
                      if (onAddEmblem) {
                        onAddEmblem({
                          type: 'banner',
                          title: bannerTitleInput.trim() || 'سوابر مصور 500x50',
                          imageUrl: bannerUrlInput.trim(),
                          requiredRole: bannerRoleInput
                        });
                        setBannerTitleInput('');
                        setBannerUrlInput('');
                        showToast('تمت إضافة البنر/السوابر إلى النظام بنجاح 🖼️', 'success');
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>حفظ البنر في مكتبة السوابر 💾</span>
                  </button>
                </div>
              </div>

              {/* Banners Gallery */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-amber-300 text-xs">
                    مكتبة السوابر والبنرات الجاهزة للاختيار ({emblemsConfig.items.filter((i) => i.type === 'banner').length}):
                  </div>
                  <input
                    type="text"
                    placeholder="بحث في البنرات..."
                    value={bannerSearchQuery}
                    onChange={(e) => setBannerSearchQuery(e.target.value)}
                    className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white outline-none w-44"
                  />
                </div>

                <div className="space-y-2.5">
                  {emblemsConfig.items
                    .filter((item) => item.type === 'banner')
                    .filter((item) =>
                      bannerSearchQuery
                        ? item.title.toLowerCase().includes(bannerSearchQuery.toLowerCase())
                        : true
                    )
                    .map((banner) => (
                      <div
                        key={banner.id}
                        className="p-3 bg-slate-950/70 border border-slate-800 hover:border-amber-500/60 rounded-xl space-y-2 transition-all shadow-sm"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-amber-200">{banner.title}</span>
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono border border-amber-500/30">
                              500x50
                            </span>
                            {banner.requiredRole && banner.requiredRole !== 'all' && (
                              <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[10px]">
                                {banner.requiredRole}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const target = prompt(`أدخل اسم العضو المراد إسناد بنر [${banner.title}] له:`);
                                if (target && target.trim()) {
                                  if (onAssignMemberBanner) {
                                    onAssignMemberBanner(target.trim(), banner.imageUrl);
                                  }
                                  showToast(`تم إسناد البنر بنجاح للعضو [${target.trim()}] 🎯`, 'success');
                                }
                              }}
                              className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                              title="إسناد هذا البنر لعضو محدد فوراً"
                            >
                              <span>إسناد لعضو 🎯</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(banner.imageUrl);
                                showToast('تم نسخ مسار البنر بنجاح 📋', 'info');
                              }}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                              title="نسخ مسار الصورة"
                            >
                              <Copy className="w-3 h-3" />
                              <span>نسخ الرابط</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (onDeleteEmblem) {
                                  onDeleteEmblem(banner.id);
                                }
                              }}
                              className="px-2 py-1 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                              title="حذف هذا البنر"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>حذف</span>
                            </button>
                          </div>
                        </div>

                        {/* Visual 500x50 Container Preview */}
                        <div className="w-full max-w-[500px] h-[50px] bg-black/40 rounded-lg border border-slate-800 flex items-center justify-center overflow-hidden p-0.5">
                          <img
                            src={banner.imageUrl}
                            alt={banner.title}
                            className="w-full h-full object-contain"
                            loading="lazy"
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. أيقونات الهدايا والأوسمة (Gift Icons) */}
          {/* ========================================================================= */}
          {emblemSubTab === 'gifts' && (
            <div className="space-y-4">
              {/* Notice */}
              <div className="p-3 bg-rose-950/30 border border-rose-500/40 rounded-xl space-y-1">
                <div className="font-bold text-rose-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span>🎖️</span>
                    <span>أيقونات الهدايا والأوسمة الشرفية</span>
                  </span>
                  <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded font-bold">
                    تكريم وتمييز الأعضاء
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  تظهر هذه الأيقونات المصغرة بجانب اسم العضو أو لقبه المصور في <strong className="text-rose-200 font-bold">قائمة المتواجدين</strong> للتكريم والتمييز الإداري.
                </p>
              </div>

              {/* Direct Grant Gift to Member Tool */}
              <div className="p-3.5 bg-gradient-to-r from-rose-950/50 via-slate-900 to-amber-950/50 border border-rose-500/30 rounded-xl space-y-3">
                <div className="font-bold text-rose-300 flex items-center gap-1.5 text-xs">
                  <Award className="w-4 h-4 text-rose-400" />
                  <span>منح وتثبيت وسام / هدية تكريمية لعضو مباشرة</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      اختر العضو المراد تكريمه:
                    </label>
                    <select
                      value={grantTargetMember}
                      onChange={(e) => setGrantTargetMember(e.target.value)}
                      className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-rose-500"
                    >
                      <option value="">-- اختر العضو من القائمة --</option>
                      {allRegisteredMembers.map((m) => (
                        <option key={m.username} value={m.username}>
                          {m.username} ({m.role}) {m.flag}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      اختر أيقونة الهدية / الوسام:
                    </label>
                    <select
                      value={grantSelectedGiftUrl}
                      onChange={(e) => setGrantSelectedGiftUrl(e.target.value)}
                      className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-rose-500"
                    >
                      <option value="">-- اختر الهدية من المكتبة --</option>
                      {emblemsConfig.items
                        .filter((i) => i.type === 'gift')
                        .map((g) => (
                          <option key={g.id} value={g.imageUrl}>
                            {g.title}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (!grantTargetMember) {
                        showToast('يرجى اختيار العضو المراد تكريمه', 'error');
                        return;
                      }
                      if (!grantSelectedGiftUrl) {
                        showToast('يرجى اختيار الهدية أو الوسام', 'error');
                        return;
                      }
                      if (onGrantMemberGift) {
                        const giftObj = emblemsConfig.items.find((i) => i.imageUrl === grantSelectedGiftUrl);
                        onGrantMemberGift(grantTargetMember, grantSelectedGiftUrl, giftObj?.title || 'وسام');
                        showToast(`تم منح الوسام التكريمي لـ [${grantTargetMember}] بنجاح 🎖️`, 'success');
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Award className="w-4 h-4" />
                    <span>منح الوسام الآن بجانب اسم العضو 🎖️</span>
                  </button>
                </div>
              </div>

              {/* Add New Gift Form */}
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                <div className="font-bold text-rose-300 flex items-center gap-1.5 text-xs">
                  <PlusCircle className="w-4 h-4 text-rose-400" />
                  <span>رفع وتخزين أيقونة هدية أو وسام جديد</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      اسم / مسمى الوسام:
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: وسام الصقر الذهبي"
                      value={giftTitleInput}
                      onChange={(e) => setGiftTitleInput(e.target.value)}
                      className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      رابط الصورة المباشر أو الرفع من الجهاز:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="رابط الصورة المباشر..."
                        value={giftUrlInput}
                        onChange={(e) => setGiftUrlInput(e.target.value)}
                        className="flex-1 p-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-rose-500 font-mono"
                      />
                      <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-rose-300 flex items-center gap-1.5 cursor-pointer shrink-0">
                        <Download className="w-3.5 h-3.5" />
                        <span>رفع 📁</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              showToast('جاري رفع الهدية/الوسام... ⏳', 'info');
                              uploadMediaWithProgress(file)
                                .then((res) => {
                                  if (res?.url) {
                                    setGiftUrlInput(res.url);
                                    if (!giftTitleInput) {
                                      setGiftTitleInput(file.name.replace(/\.[^/.]+$/, ''));
                                    }
                                    showToast('تم تحميل الهدية بنجاح ✅', 'success');
                                  }
                                })
                                .catch((err) => {
                                  showToast('فشل رفع الهدية: ' + (err?.message || 'خطأ'), 'error');
                                });
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Instant Gift Presets */}
                <div>
                  <div className="text-[10px] font-bold text-slate-400 mb-1.5">
                    أو اختر قالباً فخماً لتوليد أيقونة هدية ووسام فوراً:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setGiftTitleInput('تاج الملك الفاخر');
                        setGiftUrlInput(createGiftBadgeSvgDataUri('👑', '#f59e0b', '#78350f'));
                      }}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-[10px] text-amber-300 font-bold cursor-pointer"
                    >
                      👑 تاج الملك
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setGiftTitleInput('كأس البطولة الذهبي');
                        setGiftUrlInput(createGiftBadgeSvgDataUri('🏆', '#eab308', '#713f12'));
                      }}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-yellow-500/40 text-[10px] text-yellow-300 font-bold cursor-pointer"
                    >
                      🏆 كأس البطولة
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setGiftTitleInput('وسام الشرف والأصالة');
                        setGiftUrlInput(createGiftBadgeSvgDataUri('🎖️', '#ef4444', '#7f1d1d'));
                      }}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-rose-500/40 text-[10px] text-rose-300 font-bold cursor-pointer"
                    >
                      🎖️ وسام الشرف
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setGiftTitleInput('الماسة التميز الملكية');
                        setGiftUrlInput(createGiftBadgeSvgDataUri('💎', '#06b6d4', '#164e63'));
                      }}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-[10px] text-cyan-300 font-bold cursor-pointer"
                    >
                      💎 الماسة التميز
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (!giftUrlInput.trim()) {
                        showToast('يرجى إدخال رابط الهدية أو اختيار نموذج', 'error');
                        return;
                      }
                      if (onAddEmblem) {
                        onAddEmblem({
                          type: 'gift',
                          title: giftTitleInput.trim() || 'هدية تكريمية',
                          imageUrl: giftUrlInput.trim()
                        });
                        setGiftTitleInput('');
                        setGiftUrlInput('');
                        showToast('تمت إضافة الهدية إلى مكتبة الأوسمة بنجاح 🎖️', 'success');
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>حفظ في مكتبة الهدايا 💾</span>
                  </button>
                </div>
              </div>

              {/* Gifts Gallery */}
              <div className="space-y-2">
                <div className="font-bold text-rose-300 text-xs">
                  مكتبة أيقونات الهدايا والأوسمة المتاحة ({emblemsConfig.items.filter((i) => i.type === 'gift').length}):
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {emblemsConfig.items
                    .filter((item) => item.type === 'gift')
                    .map((gift) => (
                      <div
                        key={gift.id}
                        className="p-2.5 bg-slate-950/70 border border-slate-800 hover:border-rose-500/50 rounded-xl flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={gift.imageUrl}
                            alt={gift.title}
                            className="w-8 h-8 rounded-lg object-contain bg-black/40 border border-slate-700 p-0.5"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-100 text-xs truncate">
                              {gift.title}
                            </div>
                            <div className="text-[10px] text-slate-400">وسام شرفي</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setGrantSelectedGiftUrl(gift.imageUrl);
                              showToast(`تم اختيار [${gift.title}] لمنحه لعضو من أعلى الصفحة 🎖️`, 'info');
                            }}
                            className="px-2 py-1 rounded bg-rose-600/30 hover:bg-rose-600 text-rose-200 text-[10px] font-bold cursor-pointer transition-colors"
                            title="اختيار لمنحه لعضو"
                          >
                            منح
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (onDeleteEmblem) onDeleteEmblem(gift.id);
                            }}
                            className="p-1 rounded bg-slate-800 hover:bg-rose-900 text-slate-400 hover:text-rose-200 cursor-pointer"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. الستيكرات (Stickers) */}
          {/* ========================================================================= */}
          {emblemSubTab === 'stickers' && (
            <div className="space-y-4">
              {/* Notice */}
              <div className="p-3 bg-indigo-950/30 border border-indigo-500/40 rounded-xl space-y-1">
                <div className="font-bold text-indigo-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span>🎭</span>
                    <span>حزم الملصقات التعبيرية (Stickers) للشات</span>
                  </span>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded font-bold">
                    إرسال فوري بالمحادثة
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  تظهر هذه الملصقات في شريط ملصقات المحادثة، ويمكن للأعضاء النقر عليها لإرسالها فوراً كصور تعبيرية مبهجة داخل شاشات المحادثة (العامة، الحائط، والخاص).
                </p>
              </div>

              {/* Add New Sticker Form */}
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                <div className="font-bold text-indigo-300 flex items-center gap-1.5 text-xs">
                  <PlusCircle className="w-4 h-4 text-indigo-400" />
                  <span>إضافة وتخزين ملصق شات جديد (Sticker)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      اسم / عبارة الملصق:
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: يا هلا ومسهلا"
                      value={stickerTitleInput}
                      onChange={(e) => setStickerTitleInput(e.target.value)}
                      className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      رابط الملصق أو الرفع من الجهاز:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="رابط الصورة أو GIF..."
                        value={stickerUrlInput}
                        onChange={(e) => setStickerUrlInput(e.target.value)}
                        className="flex-1 p-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-indigo-500 font-mono"
                      />
                      <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-indigo-300 flex items-center gap-1.5 cursor-pointer shrink-0">
                        <Download className="w-3.5 h-3.5" />
                        <span>رفع 📁</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              showToast('جاري رفع الملصق... ⏳', 'info');
                              uploadMediaWithProgress(file)
                                .then((res) => {
                                  if (res?.url) {
                                    setStickerUrlInput(res.url);
                                    if (!stickerTitleInput) {
                                      setStickerTitleInput(file.name.replace(/\.[^/.]+$/, ''));
                                    }
                                    showToast('تم تحميل الملصق بنجاح ✅', 'success');
                                  }
                                })
                                .catch((err) => {
                                  showToast('فشل رفع الملصق: ' + (err?.message || 'خطأ'), 'error');
                                });
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (!stickerUrlInput.trim()) {
                        showToast('يرجى إدخال رابط الملصق أو رفع صورة', 'error');
                        return;
                      }
                      if (onAddEmblem) {
                        onAddEmblem({
                          type: 'sticker',
                          title: stickerTitleInput.trim() || 'ملصق شات',
                          imageUrl: stickerUrlInput.trim()
                        });
                        setStickerTitleInput('');
                        setStickerUrlInput('');
                        showToast('تمت إضافة الملصق بنجاح إلى حزم الشات 🎭', 'success');
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>حفظ الملصق في المكتبة 💾</span>
                  </button>
                </div>
              </div>

              {/* Stickers Gallery */}
              <div className="space-y-2">
                <div className="font-bold text-indigo-300 text-xs">
                  حزم الملصقات المتوفرة للشات ({emblemsConfig.items.filter((i) => i.type === 'sticker').length}):
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {emblemsConfig.items
                    .filter((item) => item.type === 'sticker')
                    .map((sticker) => (
                      <div
                        key={sticker.id}
                        className="p-3 bg-slate-950/70 border border-slate-800 hover:border-indigo-500/50 rounded-xl flex flex-col items-center justify-between gap-2 text-center"
                      >
                        <div className="w-20 h-20 flex items-center justify-center bg-black/30 rounded-lg p-1">
                          <img
                            src={sticker.imageUrl}
                            alt={sticker.title}
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>

                        <div className="font-bold text-slate-200 text-xs truncate max-w-full">
                          {sticker.title}
                        </div>

                        <div className="flex items-center gap-2 w-full pt-1 border-t border-slate-800">
                          <button
                            type="button"
                            onClick={() => {
                              onAdminAction('broadcastMessage', undefined, `[ملصق]: ${sticker.title}`);
                              showToast(`تم إرسال الملصق [${sticker.title}] تجريبياً للشات 🎭`, 'success');
                            }}
                            className="flex-1 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 text-[10px] font-bold cursor-pointer transition-colors"
                          >
                            إرسال للشات
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (onDeleteEmblem) onDeleteEmblem(sticker.id);
                            }}
                            className="p-1 rounded bg-slate-800 hover:bg-rose-900 text-slate-400 hover:text-rose-200 cursor-pointer"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. الفيسات (Custom Emojis: Auto Codes ف1..ف10 + Emoji Size Settings) */}
          {/* ========================================================================= */}
          {emblemSubTab === 'emojis' && (
            <div className="space-y-4">
              {/* Notice & Rule */}
              <div className="p-3 bg-purple-950/30 border border-purple-500/40 rounded-xl space-y-1">
                <div className="font-bold text-purple-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span>😊</span>
                    <span>نظام الفيسات المخصصة والاستبدال الآلي (Emoji Parser)</span>
                  </span>
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded font-mono font-bold">
                    ترقيم تسلسلي تصاعدي
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  عند رفع أي صورة في هذا القسم، <strong className="text-purple-200 font-bold">يولد النظام تلقائياً رقماً تسلسلياً واختصاراً نصياً لها يبدأ تصاعدياً من "ف1"</strong>. عند كتابة الكود داخل أي رسالة يتم استبداله فوراً بصورة الفيس مع الحفاظ على سلامة النص.
                </p>
              </div>

              {/* Emoji Display Size Setting Control */}
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>ضبط الحجم الافتراضي لعرض الفيسات داخل الرسائل:</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    الحجم الحالي: {emblemsConfig.emojiSize === 'small' ? 'صغير (24px)' : emblemsConfig.emojiSize === 'large' ? 'كبير (44px)' : 'افتراضي (32px)'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onUpdateEmojiSize) onUpdateEmojiSize('small');
                      showToast('تم ضبط حجم الفيسات داخل الرسائل إلى صغير (24px) 📏', 'info');
                    }}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      emblemsConfig.emojiSize === 'small'
                        ? 'bg-amber-600/30 border-amber-400 text-amber-200 font-black shadow-md ring-1 ring-amber-400'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                    }`}
                  >
                    <span className="text-xs font-bold">صغير (Small)</span>
                    <span className="text-[10px] text-slate-400 font-mono">24x24 بكسل</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onUpdateEmojiSize) onUpdateEmojiSize('default');
                      showToast('تم ضبط حجم الفيسات داخل الرسائل إلى افتراضي (32px) 📏', 'info');
                    }}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      emblemsConfig.emojiSize === 'default'
                        ? 'bg-amber-600/30 border-amber-400 text-amber-200 font-black shadow-md ring-1 ring-amber-400'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                    }`}
                  >
                    <span className="text-xs font-bold">افتراضي (Default)</span>
                    <span className="text-[10px] text-slate-400 font-mono">32x32 بكسل</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onUpdateEmojiSize) onUpdateEmojiSize('large');
                      showToast('تم ضبط حجم الفيسات داخل الرسائل إلى كبير (44px) 📏', 'info');
                    }}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      emblemsConfig.emojiSize === 'large'
                        ? 'bg-amber-600/30 border-amber-400 text-amber-200 font-black shadow-md ring-1 ring-amber-400'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                    }`}
                  >
                    <span className="text-xs font-bold">كبير (Large)</span>
                    <span className="text-[10px] text-slate-400 font-mono">44x44 بكسل</span>
                  </button>
                </div>
              </div>

              {/* Add New Custom Emoji Form */}
              {(() => {
                // Calculate next automatic sequential shortcut
                let maxNum = 0;
                emblemsConfig.items.forEach((item) => {
                  if (item.type === 'emoji' && item.shortcut) {
                    const match = item.shortcut.match(/^ف(\d+)$/);
                    if (match) {
                      const n = parseInt(match[1], 10);
                      if (!isNaN(n) && n > maxNum) maxNum = n;
                    }
                  }
                });
                const nextShortcut = `ف${maxNum + 1}`;

                return (
                  <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-purple-300 flex items-center gap-1.5 text-xs">
                        <PlusCircle className="w-4 h-4 text-purple-400" />
                        <span>إضافة فيس مخصص جديد (Custom Emoji)</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-200 font-mono text-xs font-black border border-purple-400/40 animate-pulse">
                        الكود التلقائي القادم: {nextShortcut}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] font-bold text-slate-300 block mb-1">
                          اسم / وصف الفيس:
                        </label>
                        <input
                          type="text"
                          placeholder={`مثال: فيس ${nextShortcut} السعيد`}
                          value={emojiTitleInput}
                          onChange={(e) => setEmojiTitleInput(e.target.value)}
                          className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-300 block mb-1">
                          رابط صورة الفيس أو الرفع من الجهاز (PNG / GIF):
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="رابط الصورة أو GIF..."
                            value={emojiUrlInput}
                            onChange={(e) => setEmojiUrlInput(e.target.value)}
                            className="flex-1 p-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-purple-500 font-mono"
                          />
                          <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-purple-300 flex items-center gap-1.5 cursor-pointer shrink-0">
                            <Download className="w-3.5 h-3.5" />
                            <span>رفع 📁</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  showToast('جاري رفع الفيس... ⏳', 'info');
                                  uploadMediaWithProgress(file)
                                    .then((res) => {
                                      if (res?.url) {
                                        setEmojiUrlInput(res.url);
                                        if (!emojiTitleInput) {
                                          setEmojiTitleInput(file.name.replace(/\.[^/.]+$/, ''));
                                        }
                                        showToast('تم تحميل الفيس بنجاح ✅', 'success');
                                      }
                                    })
                                    .catch((err) => {
                                      showToast('فشل رفع الفيس: ' + (err?.message || 'خطأ'), 'error');
                                    });
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Quick Preset SVG Emojis */}
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 mb-1.5">
                        أو اختر قالباً سريعاً لتوليد الفيس القادم بالكود ({nextShortcut}):
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEmojiTitleInput('صقر حسان برو الفاخر');
                            setEmojiUrlInput(createCustomEmojiSvgDataUri('🦅', '#f59e0b', '#78350f'));
                          }}
                          className="p-1 rounded-lg bg-slate-900 hover:bg-slate-850 border border-amber-500/40 text-[10px] text-amber-300 font-bold cursor-pointer"
                        >
                          🦅 صقر برو
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEmojiTitleInput('فيس الابتسامة المشرقة');
                            setEmojiUrlInput(createCustomEmojiSvgDataUri('😄', '#fbbf24', '#b45309'));
                          }}
                          className="p-1 rounded-lg bg-slate-900 hover:bg-slate-850 border border-yellow-500/40 text-[10px] text-yellow-300 font-bold cursor-pointer"
                        >
                          😄 ابتسامة
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEmojiTitleInput('فيس النار والحماس');
                            setEmojiUrlInput(createCustomEmojiSvgDataUri('🔥', '#f97316', '#c2410c'));
                          }}
                          className="p-1 rounded-lg bg-slate-900 hover:bg-slate-850 border border-orange-500/40 text-[10px] text-orange-300 font-bold cursor-pointer"
                        >
                          🔥 حماس
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEmojiTitleInput('فيس الحب والتقدير');
                            setEmojiUrlInput(createCustomEmojiSvgDataUri('❤️', '#ef4444', '#b91c1c'));
                          }}
                          className="p-1 rounded-lg bg-slate-900 hover:bg-slate-850 border border-rose-500/40 text-[10px] text-rose-300 font-bold cursor-pointer"
                        >
                          ❤️ محبة
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEmojiTitleInput('فيس القهوة والمزاج');
                            setEmojiUrlInput(createCustomEmojiSvgDataUri('☕', '#a16207', '#451a03'));
                          }}
                          className="p-1 rounded-lg bg-slate-900 hover:bg-slate-850 border border-amber-700/40 text-[10px] text-amber-400 font-bold cursor-pointer"
                        >
                          ☕ مزاج
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEmojiTitleInput('فيس القمر الساهر');
                            setEmojiUrlInput(createCustomEmojiSvgDataUri('🌙', '#c084fc', '#6b21a8'));
                          }}
                          className="p-1 rounded-lg bg-slate-900 hover:bg-slate-850 border border-purple-500/40 text-[10px] text-purple-300 font-bold cursor-pointer"
                        >
                          🌙 سهرة
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          if (!emojiUrlInput.trim()) {
                            showToast('يرجى إدخال رابط الفيس أو رفع صورة أولاً', 'error');
                            return;
                          }
                          if (onAddEmblem) {
                            onAddEmblem({
                              type: 'emoji',
                              title: emojiTitleInput.trim() || `فيس ${nextShortcut}`,
                              imageUrl: emojiUrlInput.trim()
                            });
                            setEmojiTitleInput('');
                            setEmojiUrlInput('');
                            showToast(`تم حفظ الفيس بنجاح بالكود التسلسلي (${nextShortcut}) ⚡`, 'success');
                          }
                        }}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>تأكيد الإضافة بالكود التلقائي ({nextShortcut}) 💾</span>
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Custom Emojis Gallery */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-purple-300 text-xs">
                    مكتبة الفيسات المخصصة ({emblemsConfig.items.filter((i) => i.type === 'emoji').length}):
                  </div>
                  <input
                    type="text"
                    placeholder="بحث بالكود (مثل ف1) أو الاسم..."
                    value={emojiSearchQuery}
                    onChange={(e) => setEmojiSearchQuery(e.target.value)}
                    className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white outline-none w-48 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                  {emblemsConfig.items
                    .filter((item) => item.type === 'emoji')
                    .filter((item) => {
                      if (!emojiSearchQuery) return true;
                      const q = emojiSearchQuery.toLowerCase();
                      return (
                        (item.shortcut && item.shortcut.toLowerCase().includes(q)) ||
                        item.title.toLowerCase().includes(q)
                      );
                    })
                    .sort((a, b) => (a.codeNumber || 0) - (b.codeNumber || 0))
                    .map((emoji) => (
                      <div
                        key={emoji.id}
                        className="p-2.5 bg-slate-950/70 border border-slate-800 hover:border-purple-500/60 rounded-xl flex flex-col items-center justify-between gap-1.5 text-center transition-all group"
                      >
                        {/* Shortcut Code Badge in bold gold font */}
                        <div className="flex items-center justify-between w-full">
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-mono font-black border border-amber-500/40">
                            {emoji.shortcut}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (emoji.shortcut) {
                                navigator.clipboard.writeText(emoji.shortcut);
                                showToast(`تم نسخ الكود [${emoji.shortcut}] للحافظة! الصقه بالمحادثة ⚡`, 'info');
                              }
                            }}
                            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-amber-300 rounded cursor-pointer"
                            title="نسخ الكود"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Image Preview */}
                        <div className="w-12 h-12 flex items-center justify-center p-1 bg-black/30 rounded-lg">
                          <img
                            src={emoji.imageUrl}
                            alt={emoji.shortcut || emoji.title}
                            className="w-10 h-10 object-contain hover:scale-125 transition-transform"
                            loading="lazy"
                          />
                        </div>

                        {/* Title */}
                        <div className="font-bold text-slate-200 text-[11px] truncate max-w-full">
                          {emoji.title}
                        </div>

                        {/* Delete action */}
                        <div className="pt-1 border-t border-slate-850 w-full flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => {
                              if (emoji.shortcut) {
                                onAdminAction('broadcastMessage', undefined, `تجربة الفيس: ${emoji.shortcut}`);
                                showToast(`تمت تجربة الفيس [${emoji.shortcut}] بالشات 💬`, 'success');
                              }
                            }}
                            className="text-[9px] text-purple-300 hover:underline cursor-pointer"
                          >
                            تجربة بالشات
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (onDeleteEmblem) onDeleteEmblem(emoji.id);
                            }}
                            className="text-slate-500 hover:text-rose-400 p-0.5 cursor-pointer"
                            title="حذف هذا الفيس"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: ACTION DIALOG FOR KICK, BAN, JAIL, RESET NAME, BADGE, ROLE */}
      {selectedUser && userActionType && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedUser(null);
              setUserActionType(null);
            }
          }}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 animate-in fade-in"
        >
          <div className="bg-[#241a12] border border-amber-500/50 rounded-2xl w-full max-w-sm p-4 space-y-3 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#3e2c1c] pb-2">
              <h4 className="font-black text-sm text-amber-300 flex items-center gap-1.5">
                {userActionType === 'kick' && '🚫 تأكيد طرد المستخدم'}
                {userActionType === 'ban' && '⛔ تأكيد الباند والحظر الدائم'}
                {userActionType === 'jail' && '🚔 إيداع العضو في السجن والتأديب'}
                {userActionType === 'resetName' && '✏️ تغيير وتعديل الاسم المخالف'}
                {userActionType === 'badge' && '🎖️ منح وتعديل الوسام الشرفي'}
                {userActionType === 'role' && '👑 ترقية وتعيين رتبة العضو'}
                {userActionType === 'move' && '🚪 نقل العضو لغرفة أخرى'}
              </h4>
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setUserActionType(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-300">
              العضو المستهدف: <strong className="text-white font-black">{selectedUser.username}</strong> ({selectedUser.role})
            </div>

            {/* Kick / Ban / Jail Reason Inputs */}
            {(userActionType === 'kick' || userActionType === 'ban' || userActionType === 'jail') && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300">سبب الإجراء:</label>
                <input
                  type="text"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="w-full p-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white outline-none"
                />
                <div className="flex flex-wrap gap-1 pt-1">
                  {['سب وقذف', 'روابط إعلانية', 'مضايقة الأعضاء', 'إساءة استخدام المايك'].map((quickReason) => (
                    <button
                      key={quickReason}
                      onClick={() => setActionReason(quickReason)}
                      className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 hover:bg-slate-700"
                    >
                      {quickReason}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Reset Name Input */}
            {userActionType === 'resetName' && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300">الاسم الجديد البديل:</label>
                <input
                  type="text"
                  value={actionValue}
                  onChange={(e) => setActionValue(e.target.value)}
                  className="w-full p-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white outline-none"
                />
              </div>
            )}

            {/* Badge Input */}
            {userActionType === 'badge' && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300">الوسام أو اللقب الشرفي:</label>
                <input
                  type="text"
                  value={actionValue}
                  onChange={(e) => setActionValue(e.target.value)}
                  placeholder="مثال: 👑 صقر ذهبي أو 💎 عضو VIP"
                  className="w-full p-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white outline-none"
                />
                <div className="flex flex-wrap gap-1 pt-1">
                  {['👑 صقر ذهبي', '💎 كبار الشخصيات VIP', '⭐ نجم الأسبوع', '🏆 بطل المسابقات', '🛡️ مشرف شرفي'].map((b) => (
                    <button
                      key={b}
                      onClick={() => setActionValue(b)}
                      className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-amber-300 hover:bg-slate-700"
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Role Select */}
            {userActionType === 'role' && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300">اختر الرتبة الجديدة:</label>
                <select
                  value={actionValue}
                  onChange={(e) => setActionValue(e.target.value)}
                  className="w-full p-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white outline-none"
                >
                  <option value="admin">👑 مدير عام (Admin)</option>
                  <option value="super">🛡️ مشرف سوبر (Super)</option>
                  <option value="member">🎖️ عضو معتمد (Member)</option>
                  <option value="guest">👤 زائر (Guest)</option>
                </select>
              </div>
            )}

            {/* Move Room Select */}
            {userActionType === 'move' && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300">اختر الغرفة المراد النقل إليها:</label>
                <select
                  value={actionValue}
                  onChange={(e) => setActionValue(e.target.value)}
                  className="w-full p-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white outline-none"
                >
                  {roomsList.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#3e2c1c]">
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setUserActionType(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  if (userActionType === 'kick') {
                    onAdminAction('kick', selectedUser.username, undefined, actionReason);
                  } else if (userActionType === 'ban') {
                    onAdminAction('ban', selectedUser.username, actionReason, actionReason);
                  } else if (userActionType === 'jail') {
                    onAdminAction('jailUser', selectedUser.username, actionReason, actionReason);
                  } else if (userActionType === 'resetName') {
                    onAdminAction('resetName', selectedUser.username, actionValue);
                  } else if (userActionType === 'badge') {
                    onAdminAction('assignHonorBadge', selectedUser.username, actionValue);
                  } else if (userActionType === 'role') {
                    onAdminAction('updateRole', selectedUser.username, actionValue);
                  } else if (userActionType === 'move') {
                    onAdminAction('moveRoom', selectedUser.username, actionValue);
                  }
                  setSelectedUser(null);
                  setUserActionType(null);
                }}
                className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer"
              >
                تأكيد وتنفيذ ✅
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
