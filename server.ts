import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dataManager } from './server/data/dataAdapter.ts';
import { storageManager } from './server/storage/storageAdapter.ts';
import { DEFAULT_EMBLEMS } from './src/utils/emblemsSystem.ts';
import type {
  EmblemItem,
  EmblemType,
  EmblemsConfig,
  EmojiSizeSetting
} from './src/utils/emblemsSystem.ts';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1);

// Production, Security, and Cross-Origin Headers
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-filename, x-mime-type');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

const httpServer = createServer(app);

// Keep-Alive connection tuning for reverse proxy and WebSocket persistence (up to 5+ minutes continuous persistence)
httpServer.keepAliveTimeout = 310000;
httpServer.headersTimeout = 320000;

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  maxHttpBufferSize: 50 * 1024 * 1024, // 50MB buffer
  pingTimeout: 300000, // 300s (5 minutes) keep-alive tolerance so background app switching does NOT drop socket
  pingInterval: 25000, // 25s regular heartbeats
  connectTimeout: 45000,
  upgradeTimeout: 30000,
  allowUpgrades: true,
  perMessageDeflate: false, // Low latency and minimal CPU overhead for high concurrency
  httpCompression: true,
  allowEIO3: true,
  transports: ['polling', 'websocket']
});

app.use(express.json({ limit: '150mb' }));
app.use(express.urlencoded({ limit: '150mb', extended: true }));

// Uploads storage directory for heavy media (videos, photos, audio)
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir, { maxAge: '7d', etag: true }));

// Storage & Database Health / Status Endpoint
app.get('/api/system/storage-status', (_req, res) => {
  res.json({
    success: true,
    data: dataManager.getStatus(),
    storage: {
      provider: storageManager.getProviderName(),
      isExternal: storageManager.isExternal(),
      endpoint: storageManager.getConfig().endpoint || 'local filesystem',
      bucket: storageManager.getConfig().bucket || 'uploads'
    }
  });
});

// HTTP Media Upload Endpoint: Bypasses WebSocket frames to prevent socket freeze/disconnect
app.post('/api/upload-media-binary', async (req, res) => {
  try {
    const rawFilename = req.headers['x-filename'] ? decodeURIComponent(req.headers['x-filename'] as string) : 'file';
    const mediaTypeHeader = (req.headers['x-mediatype'] as string) || '';
    const mime = (req.headers['content-type'] || '').toLowerCase();

    const uploadResult = await storageManager.saveStream(req, rawFilename, mime);

    return res.json({
      success: uploadResult.success,
      url: uploadResult.url,
      mediaType: uploadResult.mediaType,
      size: uploadResult.size,
      filename: uploadResult.filename,
      provider: uploadResult.provider
    });
  } catch (err: any) {
    console.error('Error in binary upload:', err);
    return res.status(500).json({ success: false, error: 'فشل حفظ الملف على الخادم أو التخزين السحابي' });
  }
});

app.post('/api/upload-media', async (req, res) => {
  try {
    const { dataUrl, filename, mediaType } = req.body;
    if (!dataUrl) {
      return res.status(400).json({ success: false, error: 'بيانات الملف مفقودة' });
    }

    const matches = dataUrl.match(/^data:([A-Za-z0-9-+\/]+);base64,(.+)$/);
    let buffer: Buffer;
    let mime = '';

    if (matches && matches.length === 3) {
      mime = matches[1].toLowerCase();
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(dataUrl, 'base64');
    }

    const originalFilename = filename || `file_${Date.now()}`;
    const uploadResult = await storageManager.saveBuffer(buffer, originalFilename, mime);

    return res.json({
      success: uploadResult.success,
      url: uploadResult.url,
      mediaType: mediaType || uploadResult.mediaType,
      size: uploadResult.size,
      filename: uploadResult.filename,
      provider: uploadResult.provider
    });
  } catch (err: any) {
    console.error('Error saving uploaded media:', err);
    return res.status(500).json({ success: false, error: 'فشل حفظ الملف على الخادم أو التخزين السحابي' });
  }
});

/**
 * Server-side security & payload minimization:
 * Automatically decodes and converts any incoming data: URL / Base64 into a local /uploads file,
 * strictly guaranteeing that Socket.IO message payloads contain only tiny URL strings (<1KB).
 */
export function ensureMediaUrlNotBase64(url: string | undefined): string | undefined {
  if (!url || typeof url !== 'string') return url;
  if (!url.startsWith('data:')) return url;

  try {
    const matches = url.match(/^data:([A-Za-z0-9-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return url;

    const mime = matches[1].toLowerCase();
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    let ext = 'bin';
    if (mime.includes('png')) ext = 'png';
    else if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';
    else if (mime.includes('gif')) ext = 'gif';
    else if (mime.includes('webp')) ext = 'webp';
    else if (mime.includes('webm')) ext = 'webm';
    else if (mime.includes('mp4')) ext = 'mp4';
    else if (mime.includes('ogg') || mime.includes('audio') || mime.includes('wav')) ext = 'wav';

    const filename = `media_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${ext}`;
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, buffer);
    return `/uploads/${filename}`;
  } catch (err) {
    console.warn('Failed to sanitize base64 media to file:', err);
    return url;
  }
}

// XSS Sanitizer helper
function sanitizeText(str?: string | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .trim();
}

export interface StoredMessage {
  id: string;
  room: string;
  username: string;
  avatarUrl?: string;
  nameBannerUrl?: string;
  flag?: string;
  badge?: string;
  badgeColor?: string;
  text: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'sticker' | 'audio';
  voiceNote?: {
    audioUrl: string;
    duration: number;
  };
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

export interface ConnectedUser {
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
  micSlot: number | null; // 1 to 5, or null
  isMuted: boolean;
  isTextMuted: boolean;
  isSpeaking: boolean;
  presenceState?: 'online' | 'away' | 'offline'; // Green dot (online), Yellow dot (away/background), Gray dot (offline)
  ipAddress?: string;
  deviceInfo?: string;
  deviceFingerprint?: string;
  honorBadge?: string;
  nameColor?: string;
  textColor?: string;
  nameGradient?: string;
  profileBg?: string;
  theme?: string;
  fontFamily?: string;
  wallpaper?: string;
  bubbleStyle?: string;
  fontSize?: string;
  nameBannerUrl?: string; // رابط البنر / السوابر المصور للعضو بمقاس 500x50 كبديل لاسمه
  giftBadges?: string[]; // قائمة أيقونات الهدايا والأوسمة التكريمية بجانب الاسم
  isJailed?: boolean;
  joinedAt: number;
  sessionToken?: string;
  lastActiveTime?: number;
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

export function getDefaultEngagement(): MemberEngagement {
  return {
    activeTimeMinutes: 0,
    messagesSent: 0,
    wallPostsCount: 0,
    micTimeMinutes: 0,
    starsLevel: 0,
    progressPercent: 0
  };
}

export function calculateEngagementStars(eng: MemberEngagement): { starsLevel: number; progressPercent: number } {
  const score = (eng.activeTimeMinutes * 0.5) + (eng.messagesSent * 2) + (eng.wallPostsCount * 8) + (eng.micTimeMinutes * 3);
  let level = 0;
  let progress = 0;
  if (score < 30) {
    level = score / 30;
    progress = Math.min(100, Math.round((score / 30) * 100));
  } else if (score < 100) {
    level = 1 + (score - 30) / 70;
    progress = Math.min(100, Math.round(((score - 30) / 70) * 100));
  } else if (score < 250) {
    level = 2 + (score - 100) / 150;
    progress = Math.min(100, Math.round(((score - 100) / 150) * 100));
  } else if (score < 500) {
    level = 3 + (score - 250) / 250;
    progress = Math.min(100, Math.round(((score - 250) / 250) * 100));
  } else if (score < 1000) {
    level = 4 + (score - 500) / 500;
    progress = Math.min(100, Math.round(((score - 500) / 500) * 100));
  } else {
    level = 5;
    progress = 100;
  }
  return {
    starsLevel: Math.min(5, Math.max(0, Math.round(level * 10) / 10)),
    progressPercent: progress
  };
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

export interface UserSession {
  sessionToken: string;
  user: ConnectedUser;
  currentSocketId: string;
  lastActiveTime: number;
  isExplicitlyLoggedOut: boolean;
}

const activeSessions = new Map<string, UserSession>(); // key: sessionToken
const usernameToSessionMap = new Map<string, string>(); // key: username.toLowerCase() -> sessionToken
const pendingAwayTimers = new Map<string, NodeJS.Timeout>(); // key: username.toLowerCase() -> 2-min presence away timer

// Hydrate existing sessions from Data Layer
try {
  const loadedSessions = dataManager.loadSessionsSync<Record<string, UserSession>>({});
  if (loadedSessions && typeof loadedSessions === 'object') {
    (Object.values(loadedSessions) as UserSession[]).forEach((sess) => {
      if (sess && sess.sessionToken && sess.user && !sess.isExplicitlyLoggedOut) {
        activeSessions.set(sess.sessionToken, sess);
        usernameToSessionMap.set(sess.user.username.toLowerCase(), sess.sessionToken);
      }
    });
  }
} catch (err) {
  console.error('[Data Layer] Error hydrating active sessions:', err);
}

function persistActiveSessions() {
  try {
    const obj: Record<string, UserSession> = {};
    for (const [token, sess] of activeSessions.entries()) {
      if (!sess.isExplicitlyLoggedOut) {
        obj[token] = sess;
      }
    }
    dataManager.saveSessions(obj);
  } catch (err) {
    console.error('[Data Layer] Error persisting active sessions:', err);
  }
}

export interface WallComment {
  id: string;
  username: string;
  avatarUrl?: string;
  nameBannerUrl?: string;
  text: string;
  time: string;
  timestamp: number;
}

export interface WallPost {
  id: string;
  username: string;
  avatarUrl?: string;
  nameBannerUrl?: string;
  flag?: string;
  text: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  category?: 'posts' | 'quick'; // تبويب الحائط: المنشورات أو الدردشة السريعة
  time: string;
  likes: number;
  likedUsers?: string[];
  commentsCount: number;
  comments?: WallComment[];
  timestamp: number;
  isEdited?: boolean;
}

export interface PrivateMessage {
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
  voiceNote?: {
    audioUrl: string;
    duration: number;
  };
  replyTo?: {
    id: string;
    username: string;
    text: string;
  };
  isCallNotification?: boolean;
  time: string;
  timestamp: number;
  isEdited?: boolean;
  // Read Receipts:
  status?: 'sent' | 'delivered' | 'read';
  readAt?: number;
  // Self-Destructing:
  selfDestructSeconds?: number;
  selfDestructAt?: number;
}

export interface ChatRoom {
  id: string;
  name: string;
  desc: string;
  isPasswordProtected: boolean;
  password?: string;
  bannerUrl?: string;
  voiceLimit: number;
  activeVoiceCount: number;
}

export interface MonitorEvent {
  id: string;
  type: 'join' | 'leave' | 'mic_take' | 'mic_drop' | 'mic_pull' | 'warn' | 'kick' | 'ban' | 'mute' | 'likes' | 'role' | 'word_filter' | 'security' | 'room' | 'siren' | 'jail';
  description: string;
  actor: string;
  target?: string;
  time: string;
  timestamp: number;
}

// User Role Definition & Hierarchy
export type UserRole = 'admin' | 'super' | 'member' | 'guest';

const ROLE_RANK: Record<string, number> = {
  admin: 3,
  super: 2,
  member: 1,
  guest: 0
};

function canPerformModeration(
  actor: ConnectedUser,
  target: { id?: string; username: string; role: 'admin' | 'super' | 'member' | 'guest' } | undefined,
  action: string
): { allowed: boolean; reason?: string } {
  // 1. Only admin and super have moderation rights
  if (actor.role !== 'admin' && actor.role !== 'super') {
    return { allowed: false, reason: 'عفواً، ليست لديك أي صلاحيات إدارية لتنفيذ هذا الإجراء (Admin/Super).' };
  }

  // 2. Action-specific constraints (Admin Only powers)
  if (action === 'ban' && actor.role !== 'admin') {
    return { allowed: false, reason: 'صلاحية الباند والحظر الدائم محصورة بمدير النظام (Admin) فقط.' };
  }

  if (action === 'updateLikes' && actor.role !== 'admin') {
    return { allowed: false, reason: 'صلاحية تعديل رصيد اللايكات محصورة بمدير النظام (Admin) فقط.' };
  }

  if (action === 'updatePoints' && actor.role !== 'admin') {
    return { allowed: false, reason: 'صلاحية تعديل رصيد النقاط محصورة بمدير النظام (Admin) فقط.' };
  }

  if (action === 'updateRole' && actor.role !== 'admin') {
    return { allowed: false, reason: 'صلاحية ترقية وتعيين الرتب محصورة بمدير النظام (Admin) فقط.' };
  }

  if (action === 'updatePassword' && actor.role !== 'admin') {
    return { allowed: false, reason: 'صلاحية تغيير كلمة مرور العضو محصورة بمدير النظام (Admin) فقط.' };
  }

  if ((action === 'deleteRoom' || action === 'editRoom' || action === 'deleteAccount') && actor.role !== 'admin') {
    return { allowed: false, reason: 'هذا الإجراء الإداري المتقدم محصور بمدير النظام (Admin) فقط.' };
  }

  // 3. Target hierarchy checks
  if (target) {
    if (target.id && target.id === actor.id && (action === 'kick' || action === 'ban' || action === 'mute' || action === 'deleteAvatar' || action === 'jailUser' || action === 'deleteAccount')) {
      return { allowed: false, reason: 'لا يمكنك تطبيق العقوبات على نفسك.' };
    }
    if (target.username.toLowerCase() === actor.username.toLowerCase() && (action === 'kick' || action === 'ban' || action === 'jailUser' || action === 'deleteAccount')) {
      return { allowed: false, reason: 'لا يمكنك تطبيق هذا الإجراء على حسابك الشخصي.' };
    }

    const actorRank = ROLE_RANK[actor.role] || 0;
    const targetRank = ROLE_RANK[target.role] || 0;

    // Super cannot touch Admin or another Super
    if (actor.role === 'super') {
      if (targetRank >= actorRank) {
        return {
          allowed: false,
          reason: `لا تملك صلاحية تعديل أو معاقبة رتبة مساوية أو أعلى منك (${target.role === 'admin' ? 'مدير نظام' : 'مشرف سوبر'}).`
        };
      }
    }

    // Admin protecting other Admins from arbitrary kicks/bans/jails
    if (actor.role === 'admin' && target.role === 'admin' && target.username.toLowerCase() !== actor.username.toLowerCase()) {
      if (action === 'ban' || action === 'kick' || action === 'jailUser' || action === 'deleteAccount' || action === 'updatePassword') {
        return { allowed: false, reason: 'لا يمكن تعديل كلمة مرور أو طرد أو حظر أو سجن مدير نظام آخر مباشرة.' };
      }
    }
  }

  return { allowed: true };
}

// Banned record structure
export interface BannedRecord {
  username: string;
  ip?: string;
  reason: string;
  bannedBy: string;
  timestamp: number;
}

// Jailed record structure
export interface JailedRecord {
  username: string;
  ip?: string;
  reason: string;
  jailedBy: string;
  timestamp: number;
}

// Banned usernames, IPs and structured records
const bannedUsers = new Set<string>();
const bannedIps = new Set<string>();
const bannedRecords: Map<string, BannedRecord> = new Map();

// Jailed usernames, IPs and structured records
const jailedUsernames = new Set<string>();
const jailedIps = new Set<string>();
const jailedRecords: Map<string, JailedRecord> = new Map();

// Save / Load Bans via Data Layer
function saveBans() {
  try {
    const data = {
      records: Array.from(bannedRecords.values()),
      ips: Array.from(bannedIps)
    };
    dataManager.saveBans(data);
  } catch (err) {
    console.error('Error saving bans:', err);
  }
}

function loadBans() {
  try {
    const seed = {
      records: [
        {
          username: 'spammer_bot',
          ip: '192.168.1.105',
          reason: 'إرسال روابط دعائية مخالفة وإزعاج الأعضاء',
          bannedBy: 'admin',
          timestamp: Date.now() - 3600000
        },
        {
          username: 'bad_user_99',
          ip: '10.0.0.44',
          reason: 'تلفظ بكلمات خادشة للحياء والآداب العامة',
          bannedBy: 'Sajan',
          timestamp: Date.now() - 7200000
        }
      ],
      ips: ['192.168.1.105', '10.0.0.44']
    };
    const parsed = dataManager.loadBansSync(seed);
    if (parsed && Array.isArray(parsed.records)) {
      parsed.records.forEach((r: BannedRecord) => {
        bannedRecords.set(r.username.toLowerCase(), r);
        bannedUsers.add(r.username.toLowerCase());
        if (r.ip) bannedIps.add(r.ip);
      });
    }
    if (parsed && Array.isArray(parsed.ips)) {
      parsed.ips.forEach((ip: string) => bannedIps.add(ip));
    }
  } catch (err) {
    console.error('Error loading bans:', err);
  }
}
loadBans();

// Save / Load Jailed via Data Layer
function saveJailed() {
  try {
    const data = {
      records: Array.from(jailedRecords.values()),
      ips: Array.from(jailedIps)
    };
    dataManager.saveJailed(data);
  } catch (err) {
    console.error('Error saving jailed records:', err);
  }
}

function loadJailed() {
  try {
    const parsed = dataManager.loadJailedSync<{ records: JailedRecord[]; ips: string[] }>({ records: [], ips: [] });
    if (parsed && Array.isArray(parsed.records)) {
      parsed.records.forEach((r: JailedRecord) => {
        jailedRecords.set(r.username.toLowerCase(), r);
        jailedUsernames.add(r.username.toLowerCase());
        if (r.ip) jailedIps.add(r.ip);
      });
    }
    if (parsed && Array.isArray(parsed.ips)) {
      parsed.ips.forEach((ip: string) => jailedIps.add(ip));
    }
  } catch (err) {
    console.error('Error loading jailed records:', err);
  }
}
loadJailed();

// Chat Shortcuts Structure & Persistence (قائمة الاختصارات الذكية للشات)
export interface ChatShortcut {
  id: string;
  trigger: string;
  replacement: string;
  createdBy?: string;
  createdAt: number;
}

let chatShortcuts: ChatShortcut[] = [];

const DEFAULT_SEED_SHORTCUTS: ChatShortcut[] = [
  {
    id: 'sc-1',
    trigger: 'نورت',
    replacement: 'نورت الشات بطلتك الحلوه 🌹',
    createdBy: 'إدارة حسان برو',
    createdAt: Date.now() - 3600000
  },
  {
    id: 'sc-2',
    trigger: 'ن',
    replacement: 'نورتو يالي دخلتو 🌟',
    createdBy: 'إدارة حسان برو',
    createdAt: Date.now() - 3600000
  },
  {
    id: 'sc-3',
    trigger: 'سلام',
    replacement: 'السلام عليكم ورحمة الله وبركاته 🌹',
    createdBy: 'إدارة حسان برو',
    createdAt: Date.now() - 3600000
  },
  {
    id: 'sc-4',
    trigger: 'برب',
    replacement: 'برب دقائق وراجع بإذن الله ☕',
    createdBy: 'إدارة حسان برو',
    createdAt: Date.now() - 3600000
  },
  {
    id: 'sc-5',
    trigger: 'باك',
    replacement: 'باك أسعد الله أوقاتكم جميعاً 🤍',
    createdBy: 'إدارة حسان برو',
    createdAt: Date.now() - 3600000
  },
  {
    id: 'sc-6',
    trigger: 'منور',
    replacement: 'منور الدنيا كلها وحسان برو 🦅',
    createdBy: 'إدارة حسان برو',
    createdAt: Date.now() - 3600000
  }
];

function saveShortcuts() {
  try {
    dataManager.saveShortcuts(chatShortcuts);
  } catch (err) {
    console.error('Error saving shortcuts:', err);
  }
}

function loadShortcuts() {
  try {
    const parsed = dataManager.loadShortcutsSync<ChatShortcut[]>(DEFAULT_SEED_SHORTCUTS);
    if (Array.isArray(parsed) && parsed.length > 0) {
      chatShortcuts = parsed;
      return;
    }
  } catch (err) {
    console.error('Error loading shortcuts:', err);
  }
  chatShortcuts = DEFAULT_SEED_SHORTCUTS;
  saveShortcuts();
}
loadShortcuts();

// Function to expand chat shortcuts in any message
export function expandShortcuts(rawText: string): string {
  if (!rawText || chatShortcuts.length === 0) return rawText;
  let result = rawText;

  // Sort shortcuts by trigger length descending so longer words match first
  const sorted = [...chatShortcuts].sort((a, b) => b.trigger.length - a.trigger.length);

  for (const sc of sorted) {
    const trigger = sc.trigger.trim();
    if (!trigger || !sc.replacement) continue;

    // 1. Direct entire match (e.g. user just types "نورت" or "ن")
    if (result.trim() === trigger) {
      result = sc.replacement;
      continue;
    }

    // 2. Token / word boundary matching (surrounded by whitespace, punctuation or boundaries)
    try {
      const escaped = trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(^|[\\s،,.:;!؟?\\-_"'\`()[\\]{}«»])(${escaped})($|[\\s،,.:;!؟?\\-_"'\`()[\\]{}«»])`, 'g');
      result = result.replace(regex, `$1${sc.replacement}$3`);
    } catch {
      if (result.includes(trigger)) {
        result = result.split(trigger).join(sc.replacement);
      }
    }
  }

  return result;
}

// Dynamic Room Settings (Chat lock, Slow mode, Voice lock, Room Pinned Topic, Welcome Message)
export interface RoomSettings {
  isChatLocked: boolean;
  slowModeSeconds: number; // 0 = off, 5, 10, 30
  isVoiceLocked: boolean;
  pinnedTopic?: string;
  welcomeMessage?: string;
  welcomeEnabled?: boolean;
  wallpaper?: string;
}
const roomSettingsMap: Record<string, RoomSettings> = {};
export function getRoomSettings(roomId: string): RoomSettings {
  if (!roomSettingsMap[roomId]) {
    roomSettingsMap[roomId] = {
      isChatLocked: false,
      slowModeSeconds: 0,
      isVoiceLocked: false,
      pinnedTopic: '',
      welcomeMessage: '',
      welcomeEnabled: true,
      wallpaper: 'default'
    };
  }
  return roomSettingsMap[roomId];
}

// Rate limit tracker for slow mode
const userLastMessageTime: Record<string, number> = {};

// Pinned messages per room
const roomPinnedMessages: Record<string, { id: string; username: string; text: string } | null> = {};

// Dynamic Filter Monitored Words (الكلمات المراقبة في الفلتر)
let monitoredWords: string[] = [
  'سب', 'شتم', 'قذف', 'لعن', 'طرد', 'كود', 'هكر', 'اخترق', 'سكس', 'اباحي',
  'قحبة', 'منيوك', 'كس', 'طيز', 'كلب', 'حمار', 'وسخ', 'حقير', 'تفو'
];

// Likes Threshold Limits per Feature (شروط عدد اللايكات المطلوبة للإرسال)
export interface LikesThresholdSettings {
  roomTextLikes: number;    // لايكات إرسال نص بالغرفة
  roomMediaLikes: number;   // لايكات إرسال وسائط بالغرفة
  wallTextLikes: number;    // لايكات إرسال نص بالحائط
  wallMediaLikes: number;   // لايكات إرسال وسائط بالحائط
  pmTextLikes: number;      // لايكات إرسال نص بالخاص
  pmMediaLikes: number;     // لايكات إرسال وسائط بالخاص
  micLikes: number;         // لايكات الصعود للمايك
  callLikes: number;        // لايكات الاتصال في الخاص
}

let likesSettings: LikesThresholdSettings = {
  roomTextLikes: 0,
  roomMediaLikes: 0,
  wallTextLikes: 0,
  wallMediaLikes: 0,
  pmTextLikes: 0,
  pmMediaLikes: 0,
  micLikes: 0,
  callLikes: 0
};

// Dynamic Role Permissions Management (إدارة محتوى وصلاحيات كل رتبة بالـ Checkboxes)
export interface RolePermissions {
  canFilter: boolean;           // الاطلاع على جرس وتنبيهات الفلتر
  canDeleteMessages: boolean;   // حذف رسائل الأعضاء الآخرين
  canMuteText: boolean;         // الإسكات الكتابي (كتم الشات)
  canMuteVoice: boolean;        // كتم المايكات الصوتية
  canPullMic: boolean;          // سحب المايك بالقوة
  canKick: boolean;             // طرد الأعضاء من الغرفة
  canBan: boolean;              // الباند والحظر النهائي بالـ IP
  canJail: boolean;             // السجن والاحتجاز التأديبي
  canLockRoom: boolean;         // قفل الشات والمايكات
  canBroadcast: boolean;        // إرسال إشعار عام وإطلاق الصافرة
  canManageShortcuts: boolean;  // تعديل وإدارة الاختصارات
  canChangeGlobalTheme: boolean;// تغيير الثيم والخط العام للشات
  canRevealNicks: boolean;      // كشف النكات وتعدد العضويات
  canEditMemberData: boolean;   // تعديل بيانات ورتب الأعضاء
}

export let rolePermissions: Record<string, RolePermissions> = {
  admin: {
    canFilter: true,
    canDeleteMessages: true,
    canMuteText: true,
    canMuteVoice: true,
    canPullMic: true,
    canKick: true,
    canBan: true,
    canJail: true,
    canLockRoom: true,
    canBroadcast: true,
    canManageShortcuts: true,
    canChangeGlobalTheme: true,
    canRevealNicks: true,
    canEditMemberData: true
  },
  super: {
    canFilter: true,
    canDeleteMessages: true,
    canMuteText: true,
    canMuteVoice: true,
    canPullMic: true,
    canKick: true,
    canBan: false,
    canJail: true,
    canLockRoom: true,
    canBroadcast: true,
    canManageShortcuts: true,
    canChangeGlobalTheme: true,
    canRevealNicks: true,
    canEditMemberData: false
  },
  member: {
    canFilter: false,
    canDeleteMessages: false,
    canMuteText: false,
    canMuteVoice: false,
    canPullMic: false,
    canKick: false,
    canBan: false,
    canJail: false,
    canLockRoom: false,
    canBroadcast: false,
    canManageShortcuts: false,
    canChangeGlobalTheme: false,
    canRevealNicks: false,
    canEditMemberData: false
  },
  guest: {
    canFilter: false,
    canDeleteMessages: false,
    canMuteText: false,
    canMuteVoice: false,
    canPullMic: false,
    canKick: false,
    canBan: false,
    canJail: false,
    canLockRoom: false,
    canBroadcast: false,
    canManageShortcuts: false,
    canChangeGlobalTheme: false,
    canRevealNicks: false,
    canEditMemberData: false
  }
};

export interface GlobalAppearance {
  theme: string;
  fontFamily: string;
  wallpaper: string;
  bubbleStyle: string;
  bannerUrl?: string;
  logoUrl?: string;
}

export let globalAppearance: GlobalAppearance = {
  theme: 'dark-gold',
  fontFamily: 'Cairo',
  wallpaper: 'default',
  bubbleStyle: 'modern',
  bannerUrl: '',
  logoUrl: ''
};

export let emblemsConfig: EmblemsConfig = {
  items: DEFAULT_EMBLEMS,
  emojiSize: 'default'
};

export function saveEmblems() {
  try {
    dataManager.saveEmblems(emblemsConfig);
  } catch (err) {
    console.error('Error saving emblems:', err);
  }
}

export function loadEmblems() {
  try {
    const parsed = dataManager.loadEmblemsSync<EmblemsConfig>({
      items: DEFAULT_EMBLEMS,
      emojiSize: 'default'
    });
    if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
      emblemsConfig = {
        items: parsed.items,
        emojiSize: parsed.emojiSize || 'default'
      };
      return;
    }
  } catch (err) {
    console.error('Error loading emblems:', err);
  }
  emblemsConfig = {
    items: DEFAULT_EMBLEMS,
    emojiSize: 'default'
  };
  saveEmblems();
}

export interface GeneralWelcomeSettings {
  enabled: boolean;
  message: string;
  title: string;
}

export let generalWelcomeSettings: GeneralWelcomeSettings = {
  enabled: true,
  message: 'نحن سعداء بتشريفك فأهلاً بك عطراً فوّاحاً ينثرُ شذاه في كلّ الأرجاء .. نتمنى لك وقتاً ممتعاً 🌹',
  title: 'إدارة حسان برو'
};

export function saveGeneralWelcome() {
  try {
    dataManager.saveGeneralWelcome(generalWelcomeSettings);
  } catch (err) {
    console.error('Error saving general welcome:', err);
  }
}

export function loadGeneralWelcome() {
  try {
    const parsed = dataManager.loadGeneralWelcomeSync<Partial<GeneralWelcomeSettings>>(generalWelcomeSettings);
    if (parsed && typeof parsed === 'object') {
      generalWelcomeSettings = { ...generalWelcomeSettings, ...parsed };
    }
  } catch (err) {
    console.error('Error loading general welcome:', err);
  }
}

export function saveRolePermissions() {
  try {
    dataManager.saveRolePermissions(rolePermissions);
  } catch (err) {
    console.error('Error saving role permissions:', err);
  }
}

export function loadRolePermissions() {
  try {
    const parsed = dataManager.loadRolePermissionsSync<Record<string, RolePermissions>>(rolePermissions);
    if (parsed && typeof parsed === 'object') {
      Object.assign(rolePermissions, parsed);
    }
  } catch (err) {
    console.error('Error loading role permissions:', err);
  }
}

export function saveGlobalAppearance() {
  try {
    dataManager.saveGlobalAppearance(globalAppearance);
  } catch (err) {
    console.error('Error saving global appearance:', err);
  }
}

export function loadGlobalAppearance() {
  try {
    const parsed = dataManager.loadGlobalAppearanceSync<Partial<GlobalAppearance>>(globalAppearance);
    if (parsed && typeof parsed === 'object') {
      globalAppearance = { ...globalAppearance, ...parsed };
    }
  } catch (err) {
    console.error('Error loading global appearance:', err);
  }
}

// Save / Load Functions
export function saveMonitoredWords() {
  try {
    dataManager.saveMonitoredWords(monitoredWords);
  } catch (err) {
    console.error('Error saving monitored words:', err);
  }
}

export function loadMonitoredWords() {
  try {
    const parsed = dataManager.loadMonitoredWordsSync<string[]>(monitoredWords);
    if (Array.isArray(parsed) && parsed.length > 0) {
      monitoredWords = parsed;
    }
  } catch (err) {
    console.error('Error loading monitored words:', err);
  }
}

export function saveServerSecurity() {
  try {
    dataManager.saveServerSecurity(serverSecurity);
  } catch (err) {
    console.error('Error saving server security:', err);
  }
}

export function loadServerSecurity() {
  try {
    const parsed = dataManager.loadServerSecuritySync<Partial<ServerSecuritySettings>>(serverSecurity);
    if (parsed && typeof parsed === 'object') {
      serverSecurity = { ...serverSecurity, ...parsed };
    }
  } catch (err) {
    console.error('Error loading server security:', err);
  }
}

export function saveLikesSettings() {
  try {
    dataManager.saveLikesSettings(likesSettings);
  } catch (err) {
    console.error('Error saving likes settings:', err);
  }
}

export function loadLikesSettings() {
  try {
    const parsed = dataManager.loadLikesSettingsSync<Partial<LikesThresholdSettings>>(likesSettings);
    if (parsed && typeof parsed === 'object') {
      likesSettings = { ...likesSettings, ...parsed };
    }
  } catch (err) {
    console.error('Error loading likes settings:', err);
  }
}

export function saveStaffMemos() {
  try {
    dataManager.saveStaffMemos(staffMemos);
  } catch (err) {
    console.error('Error saving staff memos:', err);
  }
}

export function loadStaffMemos() {
  try {
    const parsed = dataManager.loadStaffMemosSync<StaffMemo[]>(staffMemos);
    if (Array.isArray(parsed) && parsed.length > 0) {
      staffMemos = parsed;
    }
  } catch (err) {
    console.error('Error loading staff memos:', err);
  }
}

// Rooms list (Matching Screenshot 3 + Jail Room)
let chatRooms: ChatRoom[] = [
  { id: 'الغرفة العامة', name: 'الغرفة العامة Room (الرئيسية)', desc: 'ملتقى جميع الأعضاء والزوار', isPasswordProtected: false, voiceLimit: 33, activeVoiceCount: 2 },
  { id: 'السعودية', name: 'Room | السعودية', desc: 'فديتك ياااا السعودية 🇸🇦', isPasswordProtected: false, voiceLimit: 33, activeVoiceCount: 2 },
  { id: 'العراق', name: 'Room | العراق', desc: 'حياكم روم العراق 🇮🇶', isPasswordProtected: false, voiceLimit: 20, activeVoiceCount: 1 },
  { id: 'المسابقات', name: 'Room | المسابقات', desc: 'اكتب مسابقات وابدأ اللعب 🎯🔥', isPasswordProtected: false, voiceLimit: 40, activeVoiceCount: 0 },
  { id: 'خاص vip', name: 'غرفة VIP خاصة 🔒', desc: 'غرفة خاصة لكبار الشخصيات', isPasswordProtected: true, password: 'vip', voiceLimit: 10, activeVoiceCount: 0 },
  { id: 'صوت حسان برو', name: 'مجلس الصوت المباشر 🎙️', desc: 'صوت جماعي عالي النقاء', isPasswordProtected: false, voiceLimit: 30, activeVoiceCount: 0 },
  { id: 'سجن حسان برو', name: '🚔 سجن واحتجاز حسان برو', desc: 'غرفة توقيف المخالفين بقرار إداري صارم', isPasswordProtected: true, password: 'jail', voiceLimit: 50, activeVoiceCount: 0 }
];

export function saveChatRooms() {
  try {
    dataManager.saveChatRooms(chatRooms);
  } catch (err) {
    console.error('Error saving chat rooms:', err);
  }
}

export function loadChatRooms() {
  try {
    const parsed = dataManager.loadChatRoomsSync<ChatRoom[]>(chatRooms);
    if (Array.isArray(parsed) && parsed.length > 0) {
      chatRooms = parsed;
    }
  } catch (err) {
    console.error('Error loading chat rooms:', err);
  }
}

export function saveRoomSettings() {
  try {
    dataManager.saveRoomSettings(roomSettingsMap);
  } catch (err) {
    console.error('Error saving room settings:', err);
  }
}

export function loadRoomSettings() {
  try {
    const parsed = dataManager.loadRoomSettingsSync<Record<string, RoomSettings>>(roomSettingsMap);
    if (parsed && typeof parsed === 'object') {
      Object.assign(roomSettingsMap, parsed);
    }
  } catch (err) {
    console.error('Error loading room settings:', err);
  }
}

// Server Security & Anti-Raid System
export interface ServerSecuritySettings {
  emergencyLockdown: boolean;
  guestsAllowed: boolean;
  blockExternalLinks: boolean;
  floodControlRate: number; // Max messages per 5 seconds
  marqueeTicker: string;
}

let serverSecurity: ServerSecuritySettings = {
  emergencyLockdown: false,
  guestsAllowed: true,
  blockExternalLinks: true,
  floodControlRate: 3,
  marqueeTicker: '🦅 مرحباً بكم في حسان برو | شات العرب الصوتي والكتابي الأرقى | أهلاً وسهلاً بجميع الإخوة والأخوات 🌹'
};

// Staff Internal Memos & Notice Board
export interface StaffMemo {
  id: string;
  author: string;
  role: string;
  text: string;
  priority: 'low' | 'normal' | 'urgent';
  timestamp: number;
  timeFormatted: string;
}

let staffMemos: StaffMemo[] = [
  {
    id: 'memo-1',
    author: 'المدير العام',
    role: 'admin',
    text: 'الرجاء مراقبة غرفة المسابقات الليلة الساعة 9:00 مساءً لوجود فعاليات وتوزيع جوائز ومكافآت.',
    priority: 'urgent',
    timestamp: Date.now() - 3600000,
    timeFormatted: 'اليوم 08:30 م'
  },
  {
    id: 'memo-2',
    author: '★ ﺟﻨﺘﻞ ★',
    role: 'admin',
    text: 'تم حظر مستخدم كان يكرر نشر روابط إعلانات مخالفة على الخاص والتأكد من هدوء الغرف.',
    priority: 'normal',
    timestamp: Date.now() - 7200000,
    timeFormatted: 'اليوم 06:15 م'
  }
];

// Initialize all loaded configurations from Data Layer
loadMonitoredWords();
loadServerSecurity();
loadLikesSettings();
loadStaffMemos();
loadChatRooms();
loadRoomSettings();
loadRolePermissions();
loadGlobalAppearance();
loadGeneralWelcome();
loadEmblems();

// Monitoring events buffer & persistent audit log via Data Layer
let monitorLogs: MonitorEvent[] = [];
let auditSaveTimer: NodeJS.Timeout | null = null;

function saveAuditLogs() {
  if (auditSaveTimer) return;
  auditSaveTimer = setTimeout(() => {
    auditSaveTimer = null;
    try {
      dataManager.saveAuditLogs(monitorLogs.slice(0, 250));
    } catch (err) {
      console.error('Error saving persistent audit logs:', err);
    }
  }, 3000);
}

function loadAuditLogs() {
  try {
    const data = dataManager.loadAuditLogsSync<MonitorEvent[]>([]);
    if (Array.isArray(data)) {
      monitorLogs = data.slice(0, 250);
      return;
    }
  } catch (err) {
    console.error('Error loading persistent audit logs:', err);
  }
  monitorLogs = [];
}
loadAuditLogs();

function logMonitorEvent(type: MonitorEvent['type'], description: string, actor: string, target?: string) {
  const event: MonitorEvent = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type,
    description,
    actor,
    target,
    time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    timestamp: Date.now()
  };
  monitorLogs.unshift(event);
  if (monitorLogs.length > 250) monitorLogs.pop();
  saveAuditLogs();

  // Optimized Socket Payload: Only stream live audit logs to active admin/super staff
  users.forEach((u) => {
    if (u.role === 'admin' || u.role === 'super') {
      io.to(u.id).emit('monitorEvent', event);
    }
  });
}

// Profile Visitor Record structure (من نقر على صورتي وشاهد ملفي الشخصي وعدد المرات)
export interface ProfileVisitorRecord {
  username: string;
  avatarUrl?: string;
  flag?: string;
  visitCount: number;
  lastVisitTime: number;
}

// Live Video Broadcast Session Structure (بث مباشر فيديو وصوت حقيقي للغرفة)
export interface RoomLiveBroadcast {
  broadcasterId: string;
  broadcasterUsername: string;
  broadcasterAvatar?: string;
  broadcasterFlag?: string;
  room: string;
  title: string;
  startedAt: number;
  viewers: string[];
}

// Global Active Live Broadcasts Map by room
const activeLiveBroadcasts: Map<string, RoomLiveBroadcast> = new Map();

// Registered members store structure
export interface RegisteredMemberInfo {
  password: string;
  role: 'admin' | 'super' | 'member' | 'guest';
  flag: string;
  statusQuote: string;
  avatarUrl?: string;
  likes: number;
  points: number;
  honorBadge?: string;
  ipAddress?: string;
  deviceInfo?: string;
  deviceFingerprint?: string;
  nameColor?: string;
  textColor?: string;
  nameGradient?: string;
  profileBg?: string;
  theme?: string;
  fontFamily?: string;
  wallpaper?: string;
  bubbleStyle?: string;
  nameBannerUrl?: string; // رابط البنر / السوابر المصور للعضو بمقاس 500x50
  giftBadges?: string[]; // قائمة أيقونات الهدايا والأوسمة التكريمية بجانب الاسم
  isJailed?: boolean;
  lastSeen?: number;
  visitors?: ProfileVisitorRecord[];
  engagement?: MemberEngagement;
}

const registeredMembers: Record<string, RegisteredMemberInfo> = {
  'admin': {
    password: '123',
    role: 'admin',
    flag: '👑',
    statusQuote: 'مدير عام شات حسان برو 🦅',
    avatarUrl: '',
    likes: 10000,
    points: 2000000,
    honorBadge: '👑 المدير التنفيذي',
    nameBannerUrl: '',
    giftBadges: [],
    ipAddress: '127.0.0.1',
    deviceInfo: 'كمبيوتر / هاتف ذكي',
    deviceFingerprint: 'FP-ADMIN-ORIGIN',
    engagement: {
      activeTimeMinutes: 120,
      messagesSent: 50,
      wallPostsCount: 10,
      micTimeMinutes: 45,
      starsLevel: 5,
      progressPercent: 100
    }
  }
};

export function getAllRegisteredMembersPayload() {
  return Object.entries(registeredMembers).map(([username, m]) => {
    const onlineUser = users.find((u) => u.username.toLowerCase() === username.toLowerCase());
    const presenceState: 'online' | 'away' | 'offline' = onlineUser ? (onlineUser.presenceState || 'online') : 'offline';
    return {
      username,
      role: m.role,
      flag: m.flag,
      statusQuote: m.statusQuote || 'عضو في حسان برو',
      avatarUrl: m.avatarUrl,
      likes: m.likes || 0,
      points: m.points || 0,
      honorBadge: m.honorBadge,
      nameBannerUrl: onlineUser?.nameBannerUrl || m.nameBannerUrl || '',
      giftBadges: onlineUser?.giftBadges || m.giftBadges || [],
      ipAddress: onlineUser?.ipAddress || m.ipAddress || '192.168.1.1',
      deviceInfo: onlineUser?.deviceInfo || m.deviceInfo || 'جهاز ذكي',
      deviceFingerprint: onlineUser?.deviceFingerprint || m.deviceFingerprint || 'FP-DEV-DEFAULT',
      isJailed: Boolean(m.isJailed || jailedUsernames.has(username.toLowerCase())),
      isOnline: Boolean(onlineUser && presenceState !== 'offline'),
      presenceState,
      currentRoom: onlineUser ? onlineUser.room : 'خارج الغرف',
      lastSeen: onlineUser ? Date.now() : (m.lastSeen || Date.now() - 3600000),
      engagement: m.engagement || getDefaultEngagement()
    };
  });
}

// Connected live users store (الأعضاء الفعليون المتواجدون فقط بدون وهمي)
const users: ConnectedUser[] = [];

// IP Address to accounts / nicknames mapping (كشف النكات والآي بي والعضويات)
const ipToAccountsMap: Map<string, Set<string>> = new Map();
const ipToDeviceMap: Map<string, string> = new Map();
const ipToCountryMap: Map<string, string> = new Map();
const ipToFingerprintMap: Map<string, string> = new Map();

// Helper to parse human-readable device name from User-Agent
export function parseDeviceInfo(ua?: string): string {
  if (!ua) return 'هاتف ذكي (Android/iOS)';
  const lower = ua.toLowerCase();
  if (lower.includes('iphone')) return 'iPhone (Apple iOS)';
  if (lower.includes('ipad')) return 'iPad (Apple iPadOS)';
  if (lower.includes('android')) {
    if (lower.includes('samsung')) return 'Samsung Galaxy (Android)';
    if (lower.includes('xiaomi') || lower.includes('redmi')) return 'Xiaomi (Android)';
    if (lower.includes('huawei') || lower.includes('honor')) return 'Huawei (Android)';
    if (lower.includes('pixel')) return 'Google Pixel (Android)';
    return 'هاتف أندرويد (Android)';
  }
  if (lower.includes('windows')) return 'كمبيوتر (Windows PC)';
  if (lower.includes('macintosh') || lower.includes('mac os')) return 'كمبيوتر (Apple Mac)';
  if (lower.includes('linux')) return 'جهاز لينكس (Linux)';
  return 'متصفح هاتف ذكي';
}

// Filter Alerts Log structure (سجل تنبيهات الفلتر مع الرسالة الكاملة واسم العضو ولمن أرسلت ووقتها)
export interface FilterAlert {
  id: string;
  username: string;
  avatarUrl?: string;
  flag?: string;
  room: string;
  targetUser?: string; // لمن أرسلت (العضو المستلم في الخاص، أو الغرفة، أو الحائط)
  contextType?: 'room' | 'pm' | 'wall_post' | 'wall_comment';
  matchedWords: string[];
  fullMessage: string;
  timestamp: number;
  time: string;
}

const filterAlerts: FilterAlert[] = [];

// Rate limit cooldown map for liking member profiles (1 like per minute per target member)
const userLikeCooldownMap = new Map<string, number>();

// Comprehensive Filter Detection across Room, Private Messages & Wall
function checkAndLogMonitoredWords(
  text: string | undefined | null,
  sender: ConnectedUser,
  context: {
    type: 'room' | 'pm' | 'wall_post' | 'wall_comment';
    targetName?: string;
  }
) {
  if (!text) return;
  const clean = sanitizeText(text);
  if (!clean) return;
  const lower = clean.toLowerCase();
  const detectedBadWords = monitoredWords.filter((w) => lower.includes(w.toLowerCase()));
  if (detectedBadWords.length > 0) {
    const alertObj: FilterAlert = {
      id: `fa-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      username: sender.username,
      avatarUrl: sender.avatarUrl,
      flag: sender.flag,
      room:
        context.type === 'pm'
          ? `الخاص (إلى: @${context.targetName || 'مستلم'})`
          : context.type === 'wall_post'
          ? 'منشور في الحائط'
          : context.type === 'wall_comment'
          ? `تعليق بالحائط (${context.targetName || 'منشور'})`
          : `غرفة: ${context.targetName || sender.room || 'العامة'}`,
      targetUser: context.targetName,
      contextType: context.type,
      matchedWords: detectedBadWords,
      fullMessage: clean,
      timestamp: Date.now(),
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    filterAlerts.unshift(alertObj);
    if (filterAlerts.length > 100) filterAlerts.pop();

    users.forEach((u) => {
      if (u.role === 'admin' || u.role === 'super') {
        io.to(u.id).emit('newFilterAlert', alertObj);
      }
    });

    const placeDesc =
      context.type === 'pm'
        ? `في الخاص إلى [${context.targetName}]`
        : context.type === 'wall_post'
        ? 'في منشور بالحائط'
        : context.type === 'wall_comment'
        ? `في تعليق بالحائط على [${context.targetName}]`
        : `في الغرفة [${context.targetName || sender.room}]`;

    logMonitorEvent(
      'word_filter',
      `التقط الفلتر ${placeDesc} كلمات محظورة [${detectedBadWords.join(', ')}] من [${sender.username}]: "${clean}"`,
      sender.username,
      context.targetName
    );
  }
}

// Helper to extract country flag from headers or country code
function getFlagFromCountryCode(code?: string): string {
  if (!code || code.length !== 2) return '';
  const codePoints = code
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Self-contained Geo Flag API (inspects cloud headers without forcing static country)
app.get('/api/geo-flag', (req, res) => {
  const cfCountry = ((req.headers['cf-ipcountry'] || req.headers['x-country-code'] || req.headers['x-appengine-country']) as string) || '';
  const flag = cfCountry ? getFlagFromCountryCode(cfCountry) : null;
  res.json({
    countryCode: cfCountry || null,
    flag: flag || null
  });
});

// Calculate real-time room statistics for pie chart based on real users
export function getRoomStatistics() {
  const total = users.length;
  return chatRooms.map((r) => {
    const roomUsers = users.filter((u) => u.room.trim().toLowerCase() === r.id.trim().toLowerCase());
    const count = roomUsers.length;
    const percentage = total > 0 ? Math.round((count / total) * 100) : (total === 0 && r.id === 'الغرفة العامة' ? 100 : 0);
    const voiceCount = roomUsers.filter((u) => u.micSlot !== null).length;
    return {
      id: r.id,
      roomId: r.id,
      name: r.name,
      roomName: r.name,
      desc: r.desc,
      isPasswordProtected: r.isPasswordProtected,
      voiceLimit: r.voiceLimit,
      count,
      percentage,
      voiceCount,
      users: roomUsers.map((u) => ({
        id: u.id,
        username: u.username,
        role: u.role,
        flag: u.flag,
        avatarUrl: u.avatarUrl,
        isVoice: u.isVoice,
        micSlot: u.micSlot
      }))
    };
  });
}

// Mic slots (5 slots per room: 1 to 5)
const roomMicSlots: Record<string, Array<{ slotNumber: number; user: ConnectedUser | null }>> = {};

function getMicSlotsForRoom(room: string) {
  if (!roomMicSlots[room]) {
    roomMicSlots[room] = [1, 2, 3, 4, 5].map((slotNumber) => ({
      slotNumber,
      user: null
    }));
  }
  return roomMicSlots[room];
}

// Chat History Database via Data Layer
let chatHistory: StoredMessage[] = [];

try {
  chatHistory = dataManager.loadChatHistorySync<StoredMessage[]>([]);
} catch (err) {
  console.error('[Data Layer] Error loading chat history:', err);
  chatHistory = [];
}

// Persistent members data via Data Layer
try {
  const loadedMembers = dataManager.loadMembersSync<Record<string, RegisteredMemberInfo>>(registeredMembers);
  if (loadedMembers && typeof loadedMembers === 'object') {
    Object.assign(registeredMembers, loadedMembers);
  }
} catch (err) {
  console.error('[Data Layer] Error loading members from data layer:', err);
}

function getCurrentTimeString(): string {
  try {
    return new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return new Date().toLocaleTimeString();
  }
}

let saveMembersTimer: NodeJS.Timeout | null = null;
function saveMembers() {
  if (saveMembersTimer) return;
  saveMembersTimer = setTimeout(async () => {
    saveMembersTimer = null;
    try {
      await dataManager.saveMembers(registeredMembers);
    } catch (err) {
      console.error('[Data Layer] Error saving members:', err);
    }
  }, 1000);
}

let saveHistoryTimer: NodeJS.Timeout | null = null;
function saveHistory() {
  if (chatHistory.length > 500) {
    chatHistory = chatHistory.slice(-500);
  }
  if (saveHistoryTimer) return;
  saveHistoryTimer = setTimeout(async () => {
    saveHistoryTimer = null;
    try {
      await dataManager.saveChatHistory(chatHistory);
    } catch (err) {
      console.error('[Data Layer] Error saving history:', err);
    }
  }, 800);
}

// Wall Posts Persistence via Data Layer (الحائط - حفظ دائم للمنشورات)
let wallPosts: WallPost[] = [];

function saveWallPosts() {
  try {
    dataManager.saveWallPosts(wallPosts.slice(0, 100));
  } catch (err) {
    console.error('[Data Layer] Error saving wall posts:', err);
  }
}

function loadWallPosts() {
  try {
    const data = dataManager.loadWallPostsSync<WallPost[]>([]);
    if (Array.isArray(data)) {
      wallPosts = data;
      return;
    }
  } catch (err) {
    console.error('[Data Layer] Error loading wall posts:', err);
  }
  wallPosts = [];
}
loadWallPosts();

// 24-Hour Stories / Khwater Persistence via Data Layer (نظام الخواطر والحالات - حذف تلقائي بعد 24 ساعة)
let storiesList: StoryItem[] = [];

function getActiveStories(): StoryItem[] {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  return storiesList.filter((s) => s.createdAt > cutoff);
}

function saveStories() {
  try {
    dataManager.saveStories(getActiveStories());
  } catch (err) {
    console.error('[Data Layer] Error saving stories:', err);
  }
}

function loadStories() {
  try {
    const data = dataManager.loadStoriesSync<StoryItem[]>([]);
    if (Array.isArray(data)) {
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      storiesList = data.filter((s: StoryItem) => s.createdAt > cutoff);
      return;
    }
  } catch (err) {
    console.error('[Data Layer] Error loading stories:', err);
  }
  storiesList = [];
}
loadStories();

// 24-Hour Auto-cleanup Interval: deletes stories older than 24 hours automatically
setInterval(() => {
  const prevCount = storiesList.length;
  const cleaned = getActiveStories();
  if (cleaned.length !== prevCount) {
    storiesList = cleaned;
    saveStories();
    io.emit('storiesUpdated', storiesList);
  }
}, 5 * 60 * 1000);

// Active Engagement Ticker (حساب التفاعل تلقائياً كل دقيقة للتواجد والمايك)
setInterval(() => {
  let hasChanges = false;
  users.forEach((u) => {
    const reg = registeredMembers[u.username];
    if (reg) {
      if (!reg.engagement) {
        reg.engagement = getDefaultEngagement();
      }
      reg.engagement.activeTimeMinutes += 1;
      if (u.micSlot !== null || u.isSpeaking) {
        reg.engagement.micTimeMinutes += 1;
      }
      const updated = calculateEngagementStars(reg.engagement);
      reg.engagement.starsLevel = updated.starsLevel;
      reg.engagement.progressPercent = updated.progressPercent;
      u.engagement = reg.engagement;
      hasChanges = true;
    }
  });

  if (hasChanges) {
    saveMembers();
  }
}, 60000);

// Socket connection
io.on('connection', (socket) => {
  // Determine real client IP and country flag
  const rawIp = (socket.handshake.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || socket.handshake.address || '127.0.0.1';
  const clientIp = rawIp.replace(/^.*:/, '') || '127.0.0.1';
  const cfCountry = (socket.handshake.headers['cf-ipcountry'] as string) || '';
  const detectedRealFlag = getFlagFromCountryCode(cfCountry);

  const currentConnectedCount = users.length;
  io.emit('onlineCountUpdated', currentConnectedCount);

  // Send minimal initial configuration payload (<2KB)
  socket.emit('initialRoster', {
    onlineCount: currentConnectedCount,
    users: [],
    rooms: chatRooms,
    shortcuts: chatShortcuts,
    likesSettings,
    marqueeTicker: serverSecurity.marqueeTicker,
    globalAppearance,
    generalWelcome: generalWelcomeSettings,
    emblemsConfig,
    stories: getActiveStories(),
    serverSecurity: {
      marqueeTicker: serverSecurity.marqueeTicker,
      guestsAllowed: serverSecurity.guestsAllowed,
      emergencyLockdown: serverSecurity.emergencyLockdown,
      blockExternalLinks: serverSecurity.blockExternalLinks
    }
  });

  // Admin Data on-demand (sent ONLY to authorized admin staff to protect bandwidth & privacy)
  socket.on('getAdminData', () => {
    const admin = users.find((u) => u.id === socket.id);
    if (admin && (admin.role === 'admin' || admin.role === 'super')) {
      socket.emit('adminInitialData', {
        bannedList: Array.from(bannedRecords.values()),
        staffMemos,
        filterAlerts,
        monitoredWords,
        rolePermissions,
        serverSecurity
      });
      socket.emit('allRegisteredMembers', getAllRegisteredMembersPayload());
    }
  });

  socket.on('getRegisteredMembers', () => {
    const admin = users.find((u) => u.id === socket.id);
    if (admin && (admin.role === 'admin' || admin.role === 'super')) {
      socket.emit('allRegisteredMembers', getAllRegisteredMembersPayload());
    }
  });

  // Emblems & Custom Emojis Listeners (إدارة وعرض الرموز، السوابر، الهدايا، الستيكرات والفيسات)
  socket.on('getEmblems', () => {
    socket.emit('emblemsUpdated', emblemsConfig);
  });

  socket.on('addEmblem', ({
    type,
    title,
    imageUrl,
    targetMember,
    requiredRole
  }: {
    type: EmblemType;
    title: string;
    imageUrl: string;
    targetMember?: string;
    requiredRole?: string;
  }) => {
    const admin = users.find((u) => u.id === socket.id);
    if (!admin || (admin.role !== 'admin' && admin.role !== 'super')) {
      socket.emit('systemAlert', 'إدارة وإضافة الرموز والألقاب محصورة بطاقم الإدارة.');
      return;
    }
    if (!imageUrl || !type) {
      socket.emit('systemAlert', 'بيانات الرمز أو رابط الصورة مفقود.');
      return;
    }

    let shortcut: string | undefined = undefined;
    let codeNumber: number | undefined = undefined;

    if (type === 'emoji') {
      // الترقيم التسلسلي التلقائي للفيسات بدءاً من ف1 تصاعدياً
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
      const nextNum = maxNum + 1;
      shortcut = `ف${nextNum}`;
      codeNumber = nextNum;
    }

    const newItem: EmblemItem = {
      id: `emblem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      title: sanitizeText(title) || (type === 'emoji' ? `فيس ${shortcut}` : type === 'banner' ? 'لقب مصور' : 'رمز'),
      imageUrl,
      shortcut,
      codeNumber,
      targetMember: targetMember ? sanitizeText(targetMember) : undefined,
      requiredRole: requiredRole || 'all',
      createdAt: Date.now(),
      createdBy: admin.username
    };

    emblemsConfig.items.unshift(newItem);
    saveEmblems();
    io.emit('emblemsUpdated', emblemsConfig);
    logMonitorEvent(
      'security',
      `إضافة أصل جديد في قسم الرموز [${type}] ${shortcut ? `(الكود: ${shortcut})` : ''} بواسطة [${admin.username}]`,
      admin.username
    );
    socket.emit('systemAlert', `تمت إضافة ${type === 'emoji' ? `الفيس بنجاح بالكود التلقائي (${shortcut})` : 'الرمز بنجاح'} ✅`);
  });

  socket.on('deleteEmblem', ({ id }: { id: string }) => {
    const admin = users.find((u) => u.id === socket.id);
    if (!admin || (admin.role !== 'admin' && admin.role !== 'super')) {
      socket.emit('systemAlert', 'حذف الرموز محصور بطاقم الإدارة.');
      return;
    }
    const prevLen = emblemsConfig.items.length;
    emblemsConfig.items = emblemsConfig.items.filter((item) => item.id !== id);
    if (emblemsConfig.items.length !== prevLen) {
      saveEmblems();
      io.emit('emblemsUpdated', emblemsConfig);
      logMonitorEvent('security', `حذف رمز بواسطة [${admin.username}]`, admin.username);
      socket.emit('systemAlert', 'تم حذف الرمز بنجاح 🗑️');
    }
  });

  socket.on('updateEmblemEmojiSize', ({ emojiSize }: { emojiSize: EmojiSizeSetting }) => {
    const admin = users.find((u) => u.id === socket.id);
    if (!admin || (admin.role !== 'admin' && admin.role !== 'super')) {
      socket.emit('systemAlert', 'تعديل حجم الفيسات محصور بالإدارة.');
      return;
    }
    if (['small', 'default', 'large'].includes(emojiSize)) {
      emblemsConfig.emojiSize = emojiSize;
      saveEmblems();
      io.emit('emblemsUpdated', emblemsConfig);
      logMonitorEvent('security', `تعديل حجم عرض الفيسات إلى [${emojiSize}] بواسطة [${admin.username}]`, admin.username);
      socket.emit('systemAlert', `تم ضبط حجم الفيسات الافتراضي إلى (${emojiSize === 'small' ? 'صغير' : emojiSize === 'large' ? 'كبير' : 'افتراضي'}) بنجاح 📏`);
    }
  });

  // تعيين السوابر / البنر المصور للعضو
  socket.on('assignMemberBanner', ({ username, bannerUrl }: { username: string; bannerUrl?: string }) => {
    const actor = users.find((u) => u.id === socket.id);
    if (!actor) return;
    const cleanUser = sanitizeText(username)?.trim();
    if (!cleanUser) return;

    const isSelf = actor.username.toLowerCase() === cleanUser.toLowerCase();
    const isAdmin = actor.role === 'admin' || actor.role === 'super';

    if (!isSelf && !isAdmin) {
      socket.emit('systemAlert', 'تعيين البنر لعضو آخر محصور بطاقم الإدارة.');
      return;
    }

    const cleanBannerUrl = bannerUrl?.trim() || undefined;

    users.forEach((u) => {
      if (u.username.toLowerCase() === cleanUser.toLowerCase()) {
        u.nameBannerUrl = cleanBannerUrl;
      }
    });

    if (registeredMembers[cleanUser]) {
      registeredMembers[cleanUser].nameBannerUrl = cleanBannerUrl;
      saveMembers();
    }

    // Update nameBannerUrl across historical messages in chat and wall posts
    chatHistory.forEach((msg) => {
      if (msg.username.toLowerCase() === cleanUser.toLowerCase()) {
        msg.nameBannerUrl = cleanBannerUrl;
      }
    });
    saveHistory();

    wallPosts.forEach((post) => {
      if (post.username.toLowerCase() === cleanUser.toLowerCase()) {
        post.nameBannerUrl = cleanBannerUrl;
      }
      if (post.comments) {
        post.comments.forEach((cm) => {
          if (cm.username.toLowerCase() === cleanUser.toLowerCase()) {
            cm.nameBannerUrl = cleanBannerUrl;
          }
        });
      }
    });

    io.emit('userStyleUpdated', {
      username: cleanUser,
      nameBannerUrl: cleanBannerUrl
    });

    const targetUser = users.find((u) => u.username.toLowerCase() === cleanUser.toLowerCase());
    if (targetUser?.room) {
      io.to(targetUser.room).emit('roomUsers', { room: targetUser.room, users: users.filter((u) => u.room === targetUser.room) });
    }

    logMonitorEvent(
      'role',
      `${cleanBannerUrl ? 'تثبيت بنر مصور' : 'إزالة البنر المصور'} لـ [${cleanUser}] بواسطة [${actor.username}]`,
      actor.username,
      cleanUser
    );
    socket.emit('systemAlert', cleanBannerUrl ? `تم تثبيت البنر المصور لـ [${cleanUser}] بنجاح 🌟` : `تمت إزالة البنر المصور لـ [${cleanUser}] والعودة للاسم النصي.`);
  });

  // منح أيقونة هدية أو وسام للعضو يظهر بجانب اسمه في المتواجدين
  socket.on('grantMemberGift', ({ username, giftUrl, giftTitle }: { username: string; giftUrl: string; giftTitle?: string }) => {
    const actor = users.find((u) => u.id === socket.id);
    if (!actor || (actor.role !== 'admin' && actor.role !== 'super')) {
      socket.emit('systemAlert', 'منح الأوسمة والهدايا للأعضاء محصور بطاقم الإدارة.');
      return;
    }
    const cleanUser = sanitizeText(username)?.trim();
    if (!cleanUser || !giftUrl) return;

    users.forEach((u) => {
      if (u.username.toLowerCase() === cleanUser.toLowerCase()) {
        if (!u.giftBadges) u.giftBadges = [];
        if (!u.giftBadges.includes(giftUrl)) {
          u.giftBadges.push(giftUrl);
        }
      }
    });

    if (!registeredMembers[cleanUser]) {
      registeredMembers[cleanUser] = {
        password: '123',
        role: 'member',
        flag: '🇾🇪',
        statusQuote: 'عضو في حسان برو',
        likes: 0,
        points: 0,
        giftBadges: [giftUrl]
      };
    } else {
      if (!registeredMembers[cleanUser].giftBadges) registeredMembers[cleanUser].giftBadges = [];
      if (!registeredMembers[cleanUser].giftBadges!.includes(giftUrl)) {
        registeredMembers[cleanUser].giftBadges!.push(giftUrl);
      }
    }
    saveMembers();

    io.emit('userStyleUpdated', {
      username: cleanUser,
      giftBadges: registeredMembers[cleanUser].giftBadges
    });
    const targetUser = users.find((u) => u.username.toLowerCase() === cleanUser.toLowerCase());
    if (targetUser?.room) {
      io.to(targetUser.room).emit('roomUsers', { room: targetUser.room, users: users.filter((u) => u.room === targetUser.room) });
    }

    logMonitorEvent('likes', `منح هدية/وسام شرفي [${giftTitle || 'وسام'}] لـ [${cleanUser}] بواسطة [${actor.username}]`, actor.username, cleanUser);
    socket.emit('systemAlert', `تم منح الوسام الشرفي لـ [${cleanUser}] بنجاح 🎖️`);
  });

  // إزالة أيقونة هدية أو وسام من العضو
  socket.on('removeMemberGift', ({ username, giftUrl }: { username: string; giftUrl: string }) => {
    const actor = users.find((u) => u.id === socket.id);
    if (!actor || (actor.role !== 'admin' && actor.role !== 'super')) {
      socket.emit('systemAlert', 'حذف أوسمة الأعضاء محصور بطاقم الإدارة.');
      return;
    }
    const cleanUser = sanitizeText(username)?.trim();
    if (!cleanUser || !giftUrl) return;

    users.forEach((u) => {
      if (u.username.toLowerCase() === cleanUser.toLowerCase() && u.giftBadges) {
        u.giftBadges = u.giftBadges.filter((g) => g !== giftUrl);
      }
    });

    if (registeredMembers[cleanUser] && registeredMembers[cleanUser].giftBadges) {
      registeredMembers[cleanUser].giftBadges = registeredMembers[cleanUser].giftBadges!.filter((g) => g !== giftUrl);
      saveMembers();
    }

    io.emit('userStyleUpdated', {
      username: cleanUser,
      giftBadges: registeredMembers[cleanUser]?.giftBadges || []
    });
    const targetUser = users.find((u) => u.username.toLowerCase() === cleanUser.toLowerCase());
    if (targetUser?.room) {
      io.to(targetUser.room).emit('roomUsers', { room: targetUser.room, users: users.filter((u) => u.room === targetUser.room) });
    }

    socket.emit('systemAlert', `تمت إزالة الوسام الشرفي من [${cleanUser}].`);
  });

  // General Welcome Settings Listeners (إدارة الرسائل الترحيبية العامة للشات من لوحة التحكم)
  socket.on('getGeneralWelcome', () => {
    socket.emit('generalWelcomeUpdated', generalWelcomeSettings);
  });

  socket.on('updateGeneralWelcome', ({ enabled, message, title }: Partial<GeneralWelcomeSettings>) => {
    const admin = users.find((u) => u.id === socket.id);
    if (!admin || (admin.role !== 'admin' && admin.role !== 'super')) {
      socket.emit('systemAlert', 'تعديل رسائل الترحيب العامة محصور بطاقم الإدارة.');
      return;
    }
    if (enabled !== undefined) generalWelcomeSettings.enabled = Boolean(enabled);
    if (message !== undefined) generalWelcomeSettings.message = sanitizeText(message);
    if (title !== undefined) generalWelcomeSettings.title = sanitizeText(title);
    saveGeneralWelcome();
    io.emit('generalWelcomeUpdated', generalWelcomeSettings);
    logMonitorEvent('security', `تحديث رسالة الترحيب العامة للشات بواسطة ${admin.username}`, admin.username);
    socket.emit('systemAlert', 'تم حفظ وتحديث الرسالة الترحيبية العامة بنجاح ✅');
  });

  // Role Permissions Listeners (إدارة الصلاحيات الديناميكية للرتب)
  socket.on('getRolePermissions', () => {
    socket.emit('rolePermissionsUpdated', rolePermissions);
  });

  socket.on('updateRolePermissions', ({ role, permissions }: { role: string; permissions: Partial<RolePermissions> }) => {
    const admin = users.find((u) => u.id === socket.id);
    if (!admin || admin.role !== 'admin') {
      socket.emit('systemAlert', 'تعديل الصلاحيات محصور بمدير النظام (Admin) فقط.');
      return;
    }
    if (role && rolePermissions[role]) {
      rolePermissions[role] = { ...rolePermissions[role], ...permissions };
      saveRolePermissions();
      io.emit('rolePermissionsUpdated', rolePermissions);
      logMonitorEvent('role', `تعديل جدول صلاحيات رتبة [${role.toUpperCase()}] بواسطة ${admin.username}`, admin.username);
      socket.emit('systemAlert', `تم حفظ وتثبيت صلاحيات رتبة [${role}] بنجاح ✅`);
    }
  });

  // Global Appearance Listeners (التطبيق العام للثيم والخط والخلفية)
  socket.on('getGlobalAppearance', () => {
    socket.emit('globalAppearanceUpdated', globalAppearance);
  });

  socket.on('updateGlobalAppearance', ({ theme, fontFamily, wallpaper, bubbleStyle, bannerUrl, logoUrl }: Partial<GlobalAppearance>) => {
    const admin = users.find((u) => u.id === socket.id);
    if (!admin || (admin.role !== 'admin' && admin.role !== 'super')) {
      socket.emit('systemAlert', 'تعميم الثيم والخط العام محصور بطاقم الإدارة.');
      return;
    }
    if (theme) globalAppearance.theme = theme;
    if (fontFamily) globalAppearance.fontFamily = fontFamily;
    if (wallpaper) globalAppearance.wallpaper = wallpaper;
    if (bubbleStyle) globalAppearance.bubbleStyle = bubbleStyle;
    if (bannerUrl !== undefined) globalAppearance.bannerUrl = bannerUrl;
    if (logoUrl !== undefined) globalAppearance.logoUrl = logoUrl;
    saveGlobalAppearance();
    io.emit('globalAppearanceUpdated', globalAppearance);
    logMonitorEvent('role', `تعميم مظهر الشات (ثيم: ${globalAppearance.theme}، خط: ${globalAppearance.fontFamily}) بواسطة ${admin.username}`, admin.username);
    socket.emit('systemAlert', 'تم تعميم وتحديث مظهر الشات على كافة الأعضاء بنجاح 📢');
  });

  // User Style Updates (تحديث لون الاسم ولون خط الرسائل واستدامته فوراً للجميع)
  socket.on('updateUserStyle', ({
    nameColor,
    textColor,
    nameGradient,
    profileBg
  }: {
    nameColor?: string;
    textColor?: string;
    nameGradient?: string;
    profileBg?: string;
  }) => {
    const user = users.find((u) => u.id === socket.id);
    if (!user) return;
    if (nameColor !== undefined) user.nameColor = nameColor;
    if (textColor !== undefined) user.textColor = textColor;
    if (nameGradient !== undefined) user.nameGradient = nameGradient;
    if (profileBg !== undefined) user.profileBg = profileBg;

    if (registeredMembers[user.username]) {
      if (nameColor !== undefined) (registeredMembers[user.username] as any).nameColor = nameColor;
      if (textColor !== undefined) (registeredMembers[user.username] as any).textColor = textColor;
      if (nameGradient !== undefined) (registeredMembers[user.username] as any).nameGradient = nameGradient;
      if (profileBg !== undefined) (registeredMembers[user.username] as any).profileBg = profileBg;
      saveMembers();
    }

    io.emit('userStyleUpdated', {
      username: user.username,
      nameColor: user.nameColor,
      textColor: user.textColor,
      nameGradient: user.nameGradient,
      profileBg: user.profileBg
    });

    if (user.room) {
      io.to(user.room).emit('roomUsers', { room: user.room, users: users.filter((u) => u.room === user.room) });
    }
    socket.emit('systemAlert', 'تم حفظ وتحديث تنسيق اسمك ولون خطك للجميع بنجاح ✨');
  });

  // Personal User Appearance Preferences (تحديث وحفظ تفضيلات المظهر الشخصي للمستخدم فقط في حسابه بقاعدة البيانات)
  socket.on('updateUserPreferences', ({
    theme,
    fontFamily,
    wallpaper,
    bubbleStyle,
    fontSize,
    nameColor,
    textColor
  }: {
    theme?: string;
    fontFamily?: string;
    wallpaper?: string;
    bubbleStyle?: string;
    fontSize?: string;
    nameColor?: string;
    textColor?: string;
  }) => {
    const user = users.find((u) => u.id === socket.id);
    if (!user) return;

    if (theme) (user as any).theme = theme;
    if (fontFamily) (user as any).fontFamily = fontFamily;
    if (wallpaper) (user as any).wallpaper = wallpaper;
    if (bubbleStyle) (user as any).bubbleStyle = bubbleStyle;
    if (fontSize) (user as any).fontSize = fontSize;
    if (nameColor) user.nameColor = nameColor;
    if (textColor) user.textColor = textColor;

    if (registeredMembers[user.username]) {
      if (theme) (registeredMembers[user.username] as any).theme = theme;
      if (fontFamily) (registeredMembers[user.username] as any).fontFamily = fontFamily;
      if (wallpaper) (registeredMembers[user.username] as any).wallpaper = wallpaper;
      if (bubbleStyle) (registeredMembers[user.username] as any).bubbleStyle = bubbleStyle;
      if (fontSize) (registeredMembers[user.username] as any).fontSize = fontSize;
      if (nameColor) (registeredMembers[user.username] as any).nameColor = nameColor;
      if (textColor) (registeredMembers[user.username] as any).textColor = textColor;
      saveMembers();
    }

    const sessionToken = user.sessionToken;
    if (sessionToken && activeSessions.has(sessionToken)) {
      const sess = activeSessions.get(sessionToken)!;
      if (theme) (sess.user as any).theme = theme;
      if (fontFamily) (sess.user as any).fontFamily = fontFamily;
      if (wallpaper) (sess.user as any).wallpaper = wallpaper;
      if (bubbleStyle) (sess.user as any).bubbleStyle = bubbleStyle;
      if (fontSize) (sess.user as any).fontSize = fontSize;
      if (nameColor) sess.user.nameColor = nameColor;
      if (textColor) sess.user.textColor = textColor;
    }

    // Acknowledge back to user only - does NOT broadcast to other members!
    socket.emit('preferencesSaved', { theme, fontFamily, wallpaper, bubbleStyle, fontSize, nameColor, textColor });
  });

  // Leave Room (الخروج من الغرفة الحالية فقط دون تسجيل الخروج من الشات)
  socket.on('leaveRoom', ({ room }: { room?: string } = {}) => {
    const user = users.find((u) => u.id === socket.id);
    if (!user) return;
    const currentRoom = room || user.room;
    if (user.micSlot !== null) {
      const slots = getMicSlotsForRoom(currentRoom);
      const slot = slots.find((s) => s.slotNumber === user.micSlot);
      if (slot) slot.user = null;
      user.micSlot = null;
      user.isVoice = false;
      io.to(currentRoom).emit('micSlotsUpdated', slots);
    }
    socket.leave(currentRoom);
    user.room = 'خارج الغرف';
    io.to(currentRoom).emit('userTyping', {
      userId: user.id,
      username: user.username,
      room: currentRoom,
      isTyping: false,
      timestamp: Date.now()
    });
    io.to(currentRoom).emit('roomUsers', { room: currentRoom, users: users.filter((u) => u.room === currentRoom) });
    io.emit('onlineCountUpdated', users.length);
    socket.emit('leftRoomSuccess', { room: currentRoom });
  });

  // Chat Shortcuts Listeners (إدارة واستعلام اختصارات الشات الذكية)
  socket.on('getShortcuts', () => {
    socket.emit('shortcutsUpdated', chatShortcuts);
  });

  socket.on('addShortcut', ({ trigger, replacement }: { trigger: string; replacement: string }) => {
    const admin = users.find((u) => u.id === socket.id);
    if (!admin || (admin.role !== 'admin' && admin.role !== 'super')) {
      socket.emit('systemAlert', 'إدارة وتعديل الاختصارات محصورة بطاقم الإدارة (Admin/Super).');
      return;
    }

    const cleanTrigger = sanitizeText(trigger)?.trim();
    const cleanReplacement = sanitizeText(replacement)?.trim();

    if (!cleanTrigger || !cleanReplacement) {
      socket.emit('systemAlert', 'يرجى إدخال رمز الاختصار والجملة البديلة كاملة.');
      return;
    }

    const existingIndex = chatShortcuts.findIndex(
      (s) => s.trigger.toLowerCase() === cleanTrigger.toLowerCase()
    );

    if (existingIndex !== -1) {
      chatShortcuts[existingIndex].replacement = cleanReplacement;
      chatShortcuts[existingIndex].createdBy = admin.username;
      chatShortcuts[existingIndex].createdAt = Date.now();
    } else {
      const newShortcut: ChatShortcut = {
        id: `sc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        trigger: cleanTrigger,
        replacement: cleanReplacement,
        createdBy: admin.username,
        createdAt: Date.now()
      };
      chatShortcuts.unshift(newShortcut);
    }

    saveShortcuts();
    io.emit('shortcutsUpdated', chatShortcuts);
    logMonitorEvent(
      'security',
      `أضاف المشرف [${admin.username}] اختصاراً جديداً: [${cleanTrigger}] ➔ "${cleanReplacement}"`,
      admin.username
    );
    socket.emit('systemAlert', `تم حفظ وتفعيل الاختصار [${cleanTrigger}] بنجاح ⚡`);
  });

  socket.on('deleteShortcut', ({ shortcutId }: { shortcutId: string }) => {
    const admin = users.find((u) => u.id === socket.id);
    if (!admin || (admin.role !== 'admin' && admin.role !== 'super')) {
      socket.emit('systemAlert', 'إدارة الاختصارات محصورة بطاقم الإدارة (Admin/Super).');
      return;
    }

    const item = chatShortcuts.find((s) => s.id === shortcutId);
    if (item) {
      chatShortcuts = chatShortcuts.filter((s) => s.id !== shortcutId);
      saveShortcuts();
      io.emit('shortcutsUpdated', chatShortcuts);
      logMonitorEvent('security', `حذف المشرف [${admin.username}] الاختصار: [${item.trigger}]`, admin.username);
      socket.emit('systemAlert', `تم حذف الاختصار [${item.trigger}] بنجاح.`);
    }
  });

  socket.on('updateShortcut', ({ id, trigger, replacement }: { id: string; trigger: string; replacement: string }) => {
    const admin = users.find((u) => u.id === socket.id);
    if (!admin || (admin.role !== 'admin' && admin.role !== 'super')) {
      socket.emit('systemAlert', 'إدارة وتعديل الاختصارات محصورة بطاقم الإدارة (Admin/Super).');
      return;
    }

    const cleanTrigger = sanitizeText(trigger)?.trim();
    const cleanReplacement = sanitizeText(replacement)?.trim();

    if (!cleanTrigger || !cleanReplacement) {
      socket.emit('systemAlert', 'يرجى إدخال رمز الاختصار والجملة البديلة كاملة.');
      return;
    }

    const item = chatShortcuts.find((s) => s.id === id);
    if (item) {
      item.trigger = cleanTrigger;
      item.replacement = cleanReplacement;
      item.createdBy = admin.username;
      item.createdAt = Date.now();
      saveShortcuts();
      io.emit('shortcutsUpdated', chatShortcuts);
      logMonitorEvent('security', `عدل المشرف [${admin.username}] الاختصار: [${cleanTrigger}] ➔ "${cleanReplacement}"`, admin.username);
      socket.emit('systemAlert', `تم تعديل الاختصار [${cleanTrigger}] بنجاح ⚡`);
    }
  });

  // Keep-Alive Heartbeat Responder (يضمن بقاء الاتصال حياً وحساب سرعة الاستجابة Ping)
  socket.on('keepAlivePing', (data?: { timestamp?: number }) => {
    for (const s of activeSessions.values()) {
      if (s.currentSocketId === socket.id) {
        s.lastActiveTime = Date.now();
        break;
      }
    }
    socket.emit('keepAlivePong', { timestamp: Date.now(), clientTimestamp: data?.timestamp });
  });

  // Restore Session without disconnect (استعادة الجلسة الفورية عند فتح قفل الشاشة أو عودة النت دون اعتباره دخول جديد)
  socket.on('restoreSession', ({ sessionToken, username, room }: { sessionToken?: string; username?: string; room?: string }) => {
    let session = sessionToken ? activeSessions.get(sessionToken) : undefined;
    if (!session && username) {
      const token = usernameToSessionMap.get(username.trim().toLowerCase());
      if (token) session = activeSessions.get(token);
    }

    // Verify session exists and was not explicitly logged out or taken by another login
    if (session && !session.isExplicitlyLoggedOut) {
      const uName = session.user.username;
      if (pendingAwayTimers.has(uName.toLowerCase())) {
        clearTimeout(pendingAwayTimers.get(uName.toLowerCase())!);
        pendingAwayTimers.delete(uName.toLowerCase());
      }

      const oldSocketId = session.currentSocketId;
      if (oldSocketId && oldSocketId !== socket.id) {
        const oldSock = io.sockets.sockets.get(oldSocketId);
        if (oldSock) {
          try {
            oldSock.disconnect(true);
          } catch {}
        }
      }

      session.currentSocketId = socket.id;
      session.lastActiveTime = Date.now();
      session.user.id = socket.id;
      session.user.presenceState = 'online';

      const targetRoom = room || session.user.room || 'الغرفة العامة';
      session.user.room = targetRoom;
      socket.join(targetRoom);

      if (registeredMembers[uName]) {
        session.user.nameBannerUrl = registeredMembers[uName].nameBannerUrl;
        session.user.giftBadges = registeredMembers[uName].giftBadges;
      }

      // Purge any duplicate records of this user across the users array
      const lowerName = session.user.username.toLowerCase();
      let foundExisting = false;
      for (let i = users.length - 1; i >= 0; i--) {
        if (users[i].username.toLowerCase() === lowerName) {
          if (!foundExisting) {
            users[i].id = socket.id;
            users[i].room = targetRoom;
            users[i].presenceState = 'online';
            users[i].nameBannerUrl = session.user.nameBannerUrl;
            users[i].giftBadges = session.user.giftBadges;
            session.user = users[i];
            foundExisting = true;
          } else {
            // Remove duplicate zombie entry
            users.splice(i, 1);
          }
        }
      }
      if (!foundExisting) {
        users.unshift(session.user);
      }

      if (session.user.micSlot !== null) {
        const slots = getMicSlotsForRoom(targetRoom);
        const slot = slots.find((s) => s.slotNumber === session!.user.micSlot);
        if (slot) {
          slot.user = session.user;
          io.to(targetRoom).emit('micSlotsUpdated', slots);
        }
      }

      socket.emit('sessionRestored', {
        user: session.user,
        sessionToken: session.sessionToken,
        room: targetRoom
      });

      io.emit('userPresenceUpdated', { userId: socket.id, username: session.user.username, state: 'online' });
      socket.emit('micSlotsUpdated', getMicSlotsForRoom(targetRoom));

      io.to(targetRoom).emit('roomUsers', {
        room: targetRoom,
        users: users.filter((u) => u.room === targetRoom)
      });
      io.emit('onlineCountUpdated', users.length);
      if (session.user.role === 'admin' || session.user.role === 'super') {
        socket.emit('adminInitialData', {
          bannedList: Array.from(bannedRecords.values()),
          staffMemos,
          filterAlerts,
          monitoredWords,
          rolePermissions,
          serverSecurity
        });
        socket.emit('allRegisteredMembers', getAllRegisteredMembersPayload());
      }
    } else {
      socket.emit('sessionRestoreFailed', { reason: 'انتهت صلاحية الجلسة أو تم تسجيل الدخول من جهاز آخر.' });
    }
  });

  // Explicit Logout by user himself (لا يفصل إلا إذا سجل خروج هو بنفسه)
  socket.on('explicitLogout', ({ sessionToken }: { sessionToken?: string } = {}) => {
    let session = sessionToken ? activeSessions.get(sessionToken) : undefined;
    if (!session) {
      for (const s of activeSessions.values()) {
        if (s.currentSocketId === socket.id) {
          session = s;
          break;
        }
      }
    }

    const uName = session?.user?.username || users.find((u) => u.id === socket.id)?.username;
    if (uName && pendingAwayTimers.has(uName.toLowerCase())) {
      clearTimeout(pendingAwayTimers.get(uName.toLowerCase())!);
      pendingAwayTimers.delete(uName.toLowerCase());
    }

    if (session) {
      session.isExplicitlyLoggedOut = true;
      activeSessions.delete(session.sessionToken);
      if (session.user?.username) {
        usernameToSessionMap.delete(session.user.username.toLowerCase());
      }
      persistActiveSessions();
    }

    const idx = users.findIndex((u) => u.id === socket.id || (uName && u.username.toLowerCase() === uName.toLowerCase()));
    if (idx !== -1) {
      const user = users.splice(idx, 1)[0];
      if (user.micSlot !== null) {
        const slots = getMicSlotsForRoom(user.room);
        const slot = slots.find((s) => s.slotNumber === user.micSlot);
        if (slot) slot.user = null;
        io.to(user.room).emit('micSlotsUpdated', slots);
      }
      logMonitorEvent('leave', `سجل ${user.username} خروجاً رسمياً من الدردشة`, user.username);
      if (user.room) {
        io.to(user.room).emit('roomUsers', { room: user.room, users: users.filter((u) => u.room === user.room) });
      }
      io.emit('onlineCountUpdated', users.length);
    }

    socket.emit('loggedOutSuccess');
  });

  // Reveal Nicks & Account Discovery (كشف النكات والآي بي والعضويات)
  socket.on('revealNicks', ({ targetUsername }: { targetUsername: string }) => {
    const admin = users.find((u) => u.id === socket.id);
    if (!admin || (admin.role !== 'admin' && admin.role !== 'super')) {
      socket.emit('systemAlert', 'كشف النكات محصور بمدير النظام والمشرفين (Admin/Super).');
      return;
    }

    const cleanTargetName = (targetUsername || '').trim();
    const targetUser = users.find((u) => u.username.toLowerCase() === cleanTargetName.toLowerCase());
    let targetIp = targetUser?.ipAddress;

    if (!targetIp) {
      for (const [ip, nicks] of ipToAccountsMap.entries()) {
        if (Array.from(nicks).some((n) => n.toLowerCase() === cleanTargetName.toLowerCase())) {
          targetIp = ip;
          break;
        }
      }
    }

    if (!targetIp) {
      targetIp = '192.168.1.100';
    }

    let nicksSet = ipToAccountsMap.get(targetIp);
    if (!nicksSet) {
      nicksSet = new Set([cleanTargetName]);
      ipToAccountsMap.set(targetIp, nicksSet);
    } else {
      nicksSet.add(cleanTargetName);
    }
    const accounts = Array.from(nicksSet);

    const resolvedDevice = targetUser?.deviceInfo || ipToDeviceMap.get(targetIp) || parseDeviceInfo(socket.handshake.headers['user-agent'] as string);
    const resolvedCountry = targetUser?.flag || ipToCountryMap.get(targetIp) || '🇾🇪';
    const resolvedFingerprint = targetUser?.deviceFingerprint || (registeredMembers[cleanTargetName] as any)?.deviceFingerprint || ipToFingerprintMap.get(targetIp) || 'FP-DEV-STANDARD';

    socket.emit('revealedNicksResult', {
      targetUsername: cleanTargetName,
      ip: targetIp,
      device: resolvedDevice,
      deviceFingerprint: resolvedFingerprint,
      country: resolvedCountry,
      accountsCount: accounts.length,
      accounts: accounts,
      role: targetUser?.role || registeredMembers[cleanTargetName]?.role || 'member',
      room: targetUser?.room || 'غير متصل حالياً',
      flag: resolvedCountry,
      isOnline: !!targetUser
    });

    logMonitorEvent(
      'security',
      `كشف نكات العضو [${cleanTargetName}] بواسطة ${admin.username} (IP: ${targetIp}, عدد العضويات: ${accounts.length})`,
      admin.username,
      cleanTargetName
    );
  });

  // Get Filter Alerts List (سجل تنبيهات الفلتر)
  socket.on('getFilterAlerts', () => {
    socket.emit('filterAlertsList', filterAlerts);
  });

  // Clear Filter Alerts List
  socket.on('clearFilterAlerts', () => {
    const admin = users.find((u) => u.id === socket.id);
    if (!admin || (admin.role !== 'admin' && admin.role !== 'super')) return;
    filterAlerts.length = 0;
    io.emit('filterAlertsList', filterAlerts);
    socket.emit('systemAlert', 'تم تفريغ سجل تنبيهات الفلتر بنجاح.');
  });

  // Get Room Statistics for Control Panel Pie Chart
  socket.on('getRoomStats', () => {
    socket.emit('roomStats', getRoomStatistics());
  });

  // Get Banned List for Control Panel
  socket.on('getBannedList', () => {
    socket.emit('bannedListUpdated', Array.from(bannedRecords.values()));
  });

  // Get Room Settings (locks, slow mode)
  socket.on('getRoomSettings', ({ room }: { room: string }) => {
    socket.emit('roomSettingsUpdated', { room, settings: getRoomSettings(room) });
  });

  // Get Server Security Settings
  socket.on('getServerSecurity', () => {
    socket.emit('serverSecurityUpdated', serverSecurity);
  });

  // Update Server Security Settings (Admin Only)
  socket.on('updateServerSecurity', (newSettings: Partial<ServerSecuritySettings>) => {
    const admin = users.find((u) => u.id === socket.id);
    if (!admin || admin.role !== 'admin') {
      socket.emit('systemAlert', 'إعدادات أمان السيرفر محصورة بمدير النظام (Admin) فقط.');
      return;
    }
    serverSecurity = { ...serverSecurity, ...newSettings };
    saveServerSecurity();
    io.emit('serverSecurityUpdated', serverSecurity);
    logMonitorEvent('security', `تحديث إعدادات أمان الدردشة بواسطة مدير النظام [${admin.username}]`, admin.username);
    socket.emit('systemAlert', 'تم حفظ وتطبيق إعدادات أمان الدردشة بنجاح 🛡️');
  });

  // Likes Threshold Limits (شروط عدد اللايكات المطلوبة للإرسال)
  socket.on('getLikesSettings', () => {
    socket.emit('likesSettingsUpdated', likesSettings);
  });

  socket.on('updateLikesSettings', (newSettings: Partial<LikesThresholdSettings>) => {
    const admin = users.find((u) => u.id === socket.id);
    if (!admin || (admin.role !== 'admin' && admin.role !== 'super')) {
      socket.emit('systemAlert', 'تعديل شروط اللايكات محصور بطاقم الإدارة.');
      return;
    }
    likesSettings = {
      roomTextLikes: Math.max(0, parseInt(String(newSettings.roomTextLikes ?? likesSettings.roomTextLikes), 10) || 0),
      roomMediaLikes: Math.max(0, parseInt(String(newSettings.roomMediaLikes ?? likesSettings.roomMediaLikes), 10) || 0),
      wallTextLikes: Math.max(0, parseInt(String(newSettings.wallTextLikes ?? likesSettings.wallTextLikes), 10) || 0),
      wallMediaLikes: Math.max(0, parseInt(String(newSettings.wallMediaLikes ?? likesSettings.wallMediaLikes), 10) || 0),
      pmTextLikes: Math.max(0, parseInt(String(newSettings.pmTextLikes ?? likesSettings.pmTextLikes), 10) || 0),
      pmMediaLikes: Math.max(0, parseInt(String(newSettings.pmMediaLikes ?? likesSettings.pmMediaLikes), 10) || 0),
      micLikes: Math.max(0, parseInt(String(newSettings.micLikes ?? likesSettings.micLikes), 10) || 0),
      callLikes: Math.max(0, parseInt(String(newSettings.callLikes ?? likesSettings.callLikes), 10) || 0)
    };
    saveLikesSettings();
    io.emit('likesSettingsUpdated', likesSettings);
    logMonitorEvent('security', `تحديث شروط اللايكات المطلوبة للرسائل والوسائط والمايك بواسطة [${admin.username}]`, admin.username);
    socket.emit('systemAlert', 'تم حفظ وتطبيق شروط اللايكات بنجاح 👍💾');
  });

  // User Presence State Change (Green dot: online, Yellow dot: away/background, Gray dot: offline)
  socket.on('userPresenceChange', ({ state }: { state: 'online' | 'away' | 'offline' }) => {
    const user = users.find((u) => u.id === socket.id);
    if (!user) return;

    if (pendingAwayTimers.has(user.username.toLowerCase())) {
      clearTimeout(pendingAwayTimers.get(user.username.toLowerCase())!);
      pendingAwayTimers.delete(user.username.toLowerCase());
    }

    user.presenceState = state;
    if (state === 'online') {
      user.lastActiveTime = Date.now();
    }
    if (state === 'offline') {
      if (user.micSlot !== null) {
        const slots = getMicSlotsForRoom(user.room);
        const slot = slots.find((s) => s.slotNumber === user.micSlot);
        if (slot) slot.user = null;
        io.to(user.room).emit('micSlotsUpdated', slots);
      }
      const idx = users.findIndex((u) => u.id === user.id);
      if (idx !== -1) users.splice(idx, 1);
    }

    io.emit('userPresenceUpdated', { userId: user.id, username: user.username, state });
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: users.filter((u) => u.room === user.room)
    });
  });

  // Sync Room Messages when user returns to foreground from background
  socket.on('syncRoomMessages', ({ roomId, lastTimestamp }: { roomId: string; lastTimestamp?: number }, callback) => {
    const targetRoom = (roomId || 'الغرفة العامة').trim().toLowerCase();
    const roomMsgs = chatHistory.filter((m) => m.room.trim().toLowerCase() === targetRoom);
    // If lastTimestamp is provided and > 0, return only messages newer than it.
    // If lastTimestamp is omitted or 0, return recent room messages (up to 50) so backgrounded user receives missed messages.
    const missed = (typeof lastTimestamp === 'number' && lastTimestamp > 0)
      ? roomMsgs.filter((m) => m.timestamp > lastTimestamp)
      : roomMsgs.slice(-50);
    if (typeof callback === 'function') {
      callback({ messages: missed });
    } else {
      socket.emit('syncedRoomMessages', { roomId, messages: missed });
    }
  });

  // Update Room Details from in-room settings
  socket.on('updateRoomDetails', (data: {
    roomId: string;
    name?: string;
    desc?: string;
    isPasswordProtected?: boolean;
    password?: string;
    isChatLocked?: boolean;
    slowModeSeconds?: number;
    isVoiceLocked?: boolean;
    pinnedTopic?: string;
    welcomeMessage?: string;
    welcomeEnabled?: boolean;
    wallpaper?: string;
  }) => {
    const admin = users.find((u) => u.id === socket.id);
    if (!admin || (admin.role !== 'admin' && admin.role !== 'super' && admin.room !== data.roomId && !(admin as any).isRoomOwner)) {
      socket.emit('systemAlert', 'تعديل إعدادات الغرفة محصور بمالك الغرفة وطاقم الإدارة.');
      return;
    }
    const room = chatRooms.find((r) => r.id === data.roomId);
    if (room) {
      if (data.name !== undefined) room.name = sanitizeText(data.name);
      if (data.desc !== undefined) room.desc = sanitizeText(data.desc);
      if (data.isPasswordProtected !== undefined) room.isPasswordProtected = data.isPasswordProtected;
      if (data.password !== undefined) room.password = data.password;
      saveChatRooms();
      io.emit('roomsUpdated', chatRooms);
    }
    const curSettings = getRoomSettings(data.roomId);
    if (data.isChatLocked !== undefined) curSettings.isChatLocked = data.isChatLocked;
    if (data.slowModeSeconds !== undefined) curSettings.slowModeSeconds = data.slowModeSeconds;
    if (data.isVoiceLocked !== undefined) curSettings.isVoiceLocked = data.isVoiceLocked;
    if (data.pinnedTopic !== undefined) {
      curSettings.pinnedTopic = sanitizeText(data.pinnedTopic);
      io.to(data.roomId).emit('pinnedTopic', curSettings.pinnedTopic);
    }
    if (data.welcomeMessage !== undefined) curSettings.welcomeMessage = sanitizeText(data.welcomeMessage);
    if (data.welcomeEnabled !== undefined) curSettings.welcomeEnabled = Boolean(data.welcomeEnabled);
    if (data.wallpaper !== undefined) curSettings.wallpaper = data.wallpaper;
    saveRoomSettings();
    io.to(data.roomId).emit('roomSettingsUpdated', curSettings);
    logMonitorEvent('room', `عدل المشرف [${admin.username}] إعدادات غرفة [${data.roomId}]`, admin.username);
    socket.emit('systemAlert', `تم حفظ وتحديث إعدادات غرفة [${data.roomId}] بنجاح ⚙️`);
  });

  // Get Staff Memos
  socket.on('getStaffMemos', () => {
    socket.emit('staffMemosUpdated', staffMemos);
  });

  // Add Staff Memo
  socket.on('addStaffMemo', ({ text, priority }: { text: string; priority?: 'low' | 'normal' | 'urgent' }) => {
    const user = users.find((u) => u.id === socket.id);
    if (!user || (user.role !== 'admin' && user.role !== 'super')) {
      socket.emit('systemAlert', 'كتابة الملاحظات الإدارية محصورة بطاقم الإدارة.');
      return;
    }
    const clean = sanitizeText(text);
    if (!clean) return;
    const newMemo: StaffMemo = {
      id: `memo-${Date.now()}`,
      author: user.username,
      role: user.role,
      text: clean,
      priority: priority || 'normal',
      timestamp: Date.now(),
      timeFormatted: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };
    staffMemos.unshift(newMemo);
    if (staffMemos.length > 50) staffMemos.pop();
    saveStaffMemos();
    io.emit('staffMemosUpdated', staffMemos);
    socket.emit('systemAlert', 'تمت إضافة الملاحظة الإدارية بنجاح 📝');
  });

  // Delete Staff Memo
  socket.on('deleteStaffMemo', ({ memoId }: { memoId: string }) => {
    const user = users.find((u) => u.id === socket.id);
    if (!user || (user.role !== 'admin' && user.role !== 'super')) return;
    staffMemos = staffMemos.filter((m) => m.id !== memoId);
    saveStaffMemos();
    io.emit('staffMemosUpdated', staffMemos);
  });

  // Manual Ban by IP or Username directly
  socket.on('manualBan', ({ username, ip, reason }: { username: string; ip?: string; reason?: string }) => {
    const admin = users.find((u) => u.id === socket.id);
    if (!admin || admin.role !== 'admin') {
      socket.emit('systemAlert', 'صلاحية الباند محصورة بمدير النظام (Admin) فقط.');
      return;
    }
    const cleanName = sanitizeText(username?.trim());
    if (!cleanName) return;
    bannedUsers.add(cleanName.toLowerCase());
    bannedRecords.set(cleanName.toLowerCase(), {
      username: cleanName,
      ip: ip?.trim() || '192.168.1.100',
      reason: reason?.trim() || 'حظر إداري يدوي مباشر',
      bannedBy: admin.username,
      timestamp: Date.now()
    });
    // Disconnect target if currently connected
    const target = users.find((u) => u.username.toLowerCase() === cleanName.toLowerCase());
    if (target) {
      io.to(target.id).emit('kickedByAdmin', { reason: 'تم حظرك نهائياً من دخول حسان برو بقرار إداري.', by: admin.username });
      const tIdx = users.findIndex((u) => u.id === target.id);
      if (tIdx !== -1) users.splice(tIdx, 1);
      io.to(target.room).emit('roomUsers', { room: target.room, users: users.filter((u) => u.room === target.room) });
    }
    io.emit('bannedListUpdated', Array.from(bannedRecords.values()));
    logMonitorEvent('ban', `حظر يدوي مباشر لـ [${cleanName}] بواسطة ${admin.username}`, admin.username, cleanName);
    socket.emit('systemAlert', `تم تطبيق الحظر اليدوي على [${cleanName}] بنجاح.`);
  });

  // Critical Global Broadcast Alert Across All Rooms
  socket.on('globalBroadcast', ({ title, text }: { title?: string; text: string }) => {
    const admin = users.find((u) => u.id === socket.id);
    if (!admin || (admin.role !== 'admin' && admin.role !== 'super')) {
      socket.emit('systemAlert', 'عفواً، إرسال الإشعار العام العاجل متاح للإدارة والمشرفين فقط.');
      return;
    }
    const cleanText = sanitizeText(text);
    if (!cleanText) return;

    io.emit('criticalGlobalBroadcast', {
      id: `broadcast-${Date.now()}`,
      title: title || 'إعلان ملكي عاجل من إدارة حسان برو 🦅',
      text: cleanText,
      sender: admin.username,
      senderRole: admin.role,
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    });
    logMonitorEvent('warn', `إرسال بث أحمر عاجل لجميع الغرف بواسطة [${admin.role.toUpperCase()}] ${admin.username}: "${cleanText}"`, admin.username);
  });

  // Login / Join Room
  socket.on('joinRoom', ({
    username,
    room,
    loginType,
    password,
    flag,
    statusQuote,
    deviceFingerprint
  }: {
    username: string;
    room?: string;
    loginType?: string;
    password?: string;
    flag?: string;
    statusQuote?: string;
    deviceFingerprint?: string;
  }) => {
    const cleanUsername = sanitizeText(username);
    // Automatic default room: 'الغرفة العامة'
    const targetRoom = sanitizeText(room) || 'الغرفة العامة';

    if (!cleanUsername) {
      socket.emit('loginError', 'يرجى إدخال اسم مستخدم صالح.');
      return;
    }

    // 1. STRICT IP AND ACCOUNT BAN PROTECTION (حظر الآي بي وحظر الجهاز ومنع التسجيل والزوار)
    const isIpBanned = bannedIps.has(clientIp) || Array.from(bannedRecords.values()).some((r) => r.ip === clientIp);
    const isNameBanned = bannedUsers.has(cleanUsername.toLowerCase());
    const accountsForIp = ipToAccountsMap.get(clientIp);
    const isIpAssociatedWithBanned = accountsForIp ? Array.from(accountsForIp).some((acc) => bannedUsers.has(acc.toLowerCase())) : false;

    if (isIpBanned || isNameBanned || isIpAssociatedWithBanned) {
      // Ensure current IP and clean name are also permanently locked in banned sets
      bannedIps.add(clientIp);
      bannedUsers.add(cleanUsername.toLowerCase());
      if (!bannedRecords.has(cleanUsername.toLowerCase())) {
        bannedRecords.set(cleanUsername.toLowerCase(), {
          username: cleanUsername,
          ip: clientIp,
          reason: 'حظر IP: محاولة دخول من جهاز/شبكة تم حظرها مسبقاً بقرار إداري',
          bannedBy: 'النظام الأمني',
          timestamp: Date.now()
        });
      }
      saveBans();
      io.emit('bannedListUpdated', Array.from(bannedRecords.values()));
      socket.emit('loginError', '🚫 تم حظر جهازك وعنوان الشبكة (IP) نهائياً من دخول حسان برو بقرار إداري صارم.');
      return;
    }

    // 2. JAIL ROOM ENFORCEMENT (سجن واحتجاز حسان برو - منع الخروج)
    const isUserJailed = jailedUsernames.has(cleanUsername.toLowerCase()) || 
                         jailedIps.has(clientIp) || 
                         Boolean(registeredMembers[cleanUsername]?.isJailed);

    // If an existing live user is in jail and trying to switch rooms:
    const liveSession = users.find((u) => u.id === socket.id);
    if (liveSession && (liveSession.isJailed || liveSession.room === 'سجن حسان برو' || isUserJailed)) {
      if (targetRoom !== 'سجن حسان برو') {
        socket.emit('systemAlert', '🚔 لا يمكنك مغادرة غرفة السجن! أنت محتجز وموقوف بقرار إداري ولا يمكنك الخروج إلا بإفراج رسمي من الإدارة.');
        return;
      }
    }

    let finalTargetRoom = targetRoom;
    if (isUserJailed) {
      finalTargetRoom = 'سجن حسان برو';
    }

    // Security Checks: Lockdown and Guest Restrictions
    if (serverSecurity.emergencyLockdown) {
      const prospectiveRole = registeredMembers[cleanUsername]?.role || (loginType === 'member' ? 'member' : 'guest');
      if (prospectiveRole !== 'admin' && prospectiveRole !== 'super') {
        socket.emit('loginError', '🔒 وضع الطوارئ الإداري (Emergency Lockdown) مفعل حالياً. الدخول محصور بالإدارة والمشرفين.');
        return;
      }
    }

    if (!serverSecurity.guestsAllowed && loginType === 'guest') {
      socket.emit('loginError', 'عفواً، تم إيقاف دخول الزوار مؤقتاً بقرار إداري. يرجى تسجيل عضوية أو الدخول بحساب مسجل.');
      return;
    }

    // Check Member registration/login
    if (loginType === 'member') {
      const member = registeredMembers[cleanUsername];
      if (!member) {
        socket.emit('loginError', 'اسم العضوية غير مسجل. يمكنك الدخول كزائر أو تسجيل عضوية جديدة.');
        return;
      }
      if (member.password !== password) {
        socket.emit('loginError', 'كلمة المرور غير صحيحة، يرجى المحاولة ثانية.');
        return;
      }
      // Update persistent metadata for member
      member.ipAddress = clientIp;
      member.deviceInfo = parseDeviceInfo(socket.handshake.headers['user-agent'] as string);
      member.lastSeen = Date.now();
      if (isUserJailed) member.isJailed = true;
      saveMembers();
    } else if (loginType === 'register') {
      if (registeredMembers[cleanUsername]) {
        socket.emit('loginError', 'هذا الاسم مسجل مسبقاً، يرجى اختيار اسم عضوية آخر.');
        return;
      }
      registeredMembers[cleanUsername] = {
        password: password || '123',
        role: 'member',
        flag: detectedRealFlag || flag || '🇾🇪',
        statusQuote: statusQuote || 'عضو جديد',
        likes: 500,
        points: 10000,
        ipAddress: clientIp,
        deviceInfo: parseDeviceInfo(socket.handshake.headers['user-agent'] as string),
        lastSeen: Date.now(),
        isJailed: isUserJailed
      };
      saveMembers();
    } else if (loginType === 'visitor') {
      if (registeredMembers[cleanUsername] && registeredMembers[cleanUsername].role !== 'guest') {
        socket.emit('loginError', 'هذا الاسم مسجل لعضوية خاصة بكلمة مرور. يرجى تسجيل الدخول من تبويب [دخول الاعضاء].');
        return;
      }
      // Record visitor in registeredMembers so the admin sees their account and IP even offline!
      if (!registeredMembers[cleanUsername]) {
        registeredMembers[cleanUsername] = {
          password: '123',
          role: 'guest',
          flag: detectedRealFlag || flag || '🇾🇪',
          statusQuote: 'زائر',
          likes: 100,
          points: 500,
          ipAddress: clientIp,
          deviceInfo: parseDeviceInfo(socket.handshake.headers['user-agent'] as string),
          lastSeen: Date.now(),
          isJailed: isUserJailed
        };
        saveMembers();
      } else {
        registeredMembers[cleanUsername].ipAddress = clientIp;
        registeredMembers[cleanUsername].lastSeen = Date.now();
        saveMembers();
      }
    }

    // =========================================================================
    // ENFORCE STRICT SINGLE-SESSION PER MEMBER / ACCOUNT
    // (يمنع تعدد الجلسات تماماً: عند تسجيل الدخول من جهاز أو متصفح أو صفحة أخرى،
    // يتم طرد وفصل الجلسة السابقة فوراً واعتماد الجلسة الجديدة فقط)
    // =========================================================================
    const oldSocketIds = new Set<string>();

    // 1. Collect sockets from live users list
    users.forEach((u) => {
      if (u.username.toLowerCase() === cleanUsername.toLowerCase() && u.id !== socket.id) {
        oldSocketIds.add(u.id);
      }
    });

    // 2. Collect sockets from activeSessions and invalidate previous sessions
    for (const [token, sess] of activeSessions.entries()) {
      if (
        sess.user?.username?.toLowerCase() === cleanUsername.toLowerCase() &&
        sess.currentSocketId !== socket.id
      ) {
        if (sess.currentSocketId) oldSocketIds.add(sess.currentSocketId);
        sess.isExplicitlyLoggedOut = true;
        activeSessions.delete(token);
      }
    }
    usernameToSessionMap.delete(cleanUsername.toLowerCase());

    // 3. Clear any pending away timer for this username
    if (pendingAwayTimers.has(cleanUsername.toLowerCase())) {
      clearTimeout(pendingAwayTimers.get(cleanUsername.toLowerCase())!);
      pendingAwayTimers.delete(cleanUsername.toLowerCase());
    }

    // 4. Force disconnect and notify all old sockets
    oldSocketIds.forEach((oldId) => {
      const oldSocket = io.sockets.sockets.get(oldId);
      if (oldSocket) {
        oldSocket.emit('forceLogout', {
          reason: 'duplicate_login',
          message: '⚠️ تم تسجيل الدخول إلى حسابك من متصفح أو جهاز آخر. تم إنهاء هذه الجلسة تلقائياً واعتماد الجلسة الجديدة.'
        });
        try {
          oldSocket.disconnect(true);
        } catch {}
      }
    });

    // 5. Free mic slots for all previous instances of this user in any room
    users.forEach((u) => {
      if (u.username.toLowerCase() === cleanUsername.toLowerCase() && u.micSlot !== null) {
        const slots = getMicSlotsForRoom(u.room);
        const slot = slots.find((s) => s.slotNumber === u.micSlot);
        if (slot) slot.user = null;
        io.to(u.room).emit('micSlotsUpdated', slots);
      }
    });

    // 6. Purge all previous instances from users array
    for (let i = users.length - 1; i >= 0; i--) {
      if (users[i].username.toLowerCase() === cleanUsername.toLowerCase() && users[i].id !== socket.id) {
        const removed = users.splice(i, 1)[0];
        io.to(removed.room).emit('roomUsers', {
          room: removed.room,
          users: users.filter((u) => u.room === removed.room)
        });
      }
    }

    // Remove old session if any
    const existingIndex = users.findIndex((u) => u.id === socket.id);
    if (existingIndex !== -1) {
      const old = users.splice(existingIndex, 1)[0];
      if (old.micSlot !== null) {
        const slots = getMicSlotsForRoom(old.room);
        const slot = slots.find((s) => s.slotNumber === old.micSlot);
        if (slot) slot.user = null;
        io.to(old.room).emit('micSlotsUpdated', slots);
      }
      socket.leave(old.room);
    }

    const reg = registeredMembers[cleanUsername];
    const realFlag = detectedRealFlag || flag || reg?.flag || '🇾🇪';
    const clientUserAgent = (socket.handshake.headers['user-agent'] as string) || '';
    const clientDevice = parseDeviceInfo(clientUserAgent);

    // Track this username, device, and country under this IP address
    if (!ipToAccountsMap.has(clientIp)) {
      ipToAccountsMap.set(clientIp, new Set<string>());
    }
    ipToAccountsMap.get(clientIp)!.add(cleanUsername);
    ipToDeviceMap.set(clientIp, clientDevice);
    ipToCountryMap.set(clientIp, realFlag);
    const clientFingerprint = deviceFingerprint || `FP-${clientIp.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase() || 'STD'}`;
    ipToFingerprintMap.set(clientIp, clientFingerprint);

    if (reg) {
      reg.deviceFingerprint = clientFingerprint;
      saveMembers();
    }

    // Default status: 'زائر' for visitor, 'عضو جديد' for new member
    let userQuote = 'عضو جديد';
    if (loginType === 'visitor') {
      userQuote = 'زائر';
    } else if (reg?.statusQuote) {
      userQuote = reg.statusQuote;
    } else {
      userQuote = 'عضو جديد';
    }

    const userSessionToken = `token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const newUser: ConnectedUser = {
      id: socket.id,
      username: cleanUsername,
      room: finalTargetRoom,
      avatarSeed: cleanUsername,
      avatarUrl: reg?.avatarUrl || undefined,
      statusQuote: userQuote,
      flag: realFlag,
      role: reg?.role || (cleanUsername.toLowerCase() === 'sajan' ? 'admin' : loginType === 'visitor' ? 'guest' : 'member'),
      likes: reg ? reg.likes : 500,
      points: reg ? reg.points : 2500,
      honorBadge: reg?.honorBadge || undefined,
      isVoice: false,
      micSlot: null,
      isMuted: isUserJailed,
      isTextMuted: isUserJailed,
      isSpeaking: false,
      presenceState: 'online',
      ipAddress: clientIp,
      deviceInfo: clientDevice,
      deviceFingerprint: clientFingerprint,
      isJailed: isUserJailed,
      joinedAt: Date.now(),
      sessionToken: userSessionToken,
      lastActiveTime: Date.now(),
      nameColor: (reg as any)?.nameColor || undefined,
      textColor: (reg as any)?.textColor || undefined,
      nameGradient: (reg as any)?.nameGradient || undefined,
      profileBg: (reg as any)?.profileBg || undefined,
      theme: (reg as any)?.theme || undefined,
      fontFamily: (reg as any)?.fontFamily || undefined,
      wallpaper: (reg as any)?.wallpaper || undefined,
      bubbleStyle: (reg as any)?.bubbleStyle || undefined,
      fontSize: (reg as any)?.fontSize || undefined,
      nameBannerUrl: reg?.nameBannerUrl || undefined,
      giftBadges: reg?.giftBadges || undefined,
      engagement: reg?.engagement || getDefaultEngagement()
    };

    activeSessions.set(userSessionToken, {
      sessionToken: userSessionToken,
      user: newUser,
      currentSocketId: socket.id,
      lastActiveTime: Date.now(),
      isExplicitlyLoggedOut: false
    });
    usernameToSessionMap.set(cleanUsername.toLowerCase(), userSessionToken);
    persistActiveSessions();

    users.unshift(newUser);
    socket.join(finalTargetRoom);

    logMonitorEvent('join', `دخل ${newUser.username} إلى ${newUser.room} (العلم: ${realFlag} - IP: ${clientIp})`, newUser.username);

    // Send success confirmation with sessionToken
    socket.emit('loginSuccess', { user: newUser, sessionToken: userSessionToken });

    if (isUserJailed) {
      socket.emit('systemAlert', '🚔 تنبيه: أنت قيد السجن والاحتجاز الإداري في (سجن حسان برو) بموجب قرار إداري صارم. لا يمكنك التحدث أو الكتابة أو مغادرة السجن إلا بقرار الإفراج.');
    }

    // Send mic slots for this room
    const currentSlots = getMicSlotsForRoom(targetRoom);
    socket.emit('micSlotsUpdated', currentSlots);

    // Send currently pinned message if any
    if (roomPinnedMessages[targetRoom]) {
      socket.emit('roomPinnedMessageUpdated', roomPinnedMessages[targetRoom]);
    }

    // Clean session on login / re-entry as requested by user (عدم الاحتفاظ بالرسائل السابقة للغرفة والخاص)
    socket.emit('chatHistory', []);

    // Send profile visitors for the logged-in user
    socket.emit('profileVisitorsUpdated', registeredMembers[cleanUsername]?.visitors || []);

    // Broadcast entry message in chat stream with user name
    const entryMessage: StoredMessage = {
      id: `enter-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      room: finalTargetRoom,
      username: cleanUsername,
      avatarUrl: newUser.avatarUrl,
      nameBannerUrl: newUser.nameBannerUrl,
      flag: newUser.flag,
      badge: `${finalTargetRoom} Room | دخل الى`,
      badgeColor: 'text-amber-400',
      text: `دخل ${cleanUsername} إلى ${finalTargetRoom} أهلاً وسهلاً 🦅`,
      time: getCurrentTimeString(),
      timestamp: Date.now()
    };
    chatHistory.push(entryMessage);
    saveHistory();
    io.to(finalTargetRoom).emit('message', entryMessage);

    // Send welcome greeting for this user
    const currentRoomObj = chatRooms.find((r) => r.id === finalTargetRoom);
    const roomTitle = currentRoomObj?.name || `${finalTargetRoom} Room`;
    const curRoomSettings = getRoomSettings(finalTargetRoom);

    // 1. Room Owner Custom Welcome Message
    if (curRoomSettings?.welcomeEnabled !== false && curRoomSettings?.welcomeMessage && curRoomSettings.welcomeMessage.trim()) {
      socket.emit('message', {
        id: `welcome-room-${Date.now()}`,
        room: finalTargetRoom,
        username: roomTitle,
        badge: 'ترحـيـب الغرفة',
        badgeColor: 'text-amber-500',
        text: curRoomSettings.welcomeMessage.trim(),
        time: getCurrentTimeString(),
        timestamp: Date.now()
      });
    }

    // 2. Chat General Welcome Message (managed in Control Panel)
    if (generalWelcomeSettings.enabled && generalWelcomeSettings.message && generalWelcomeSettings.message.trim()) {
      socket.emit('message', {
        id: `welcome-gen-${Date.now()}`,
        room: finalTargetRoom,
        username: generalWelcomeSettings.title || 'إدارة حسان برو',
        badge: 'ترحـيـب عام',
        badgeColor: 'text-red-600',
        text: generalWelcomeSettings.message.trim(),
        time: getCurrentTimeString(),
        timestamp: Date.now() + 1
      });
    }

    // Minimal Socket Payload: Only broadcast roomUsers to the affected room
    io.to(finalTargetRoom).emit('roomUsers', {
      room: finalTargetRoom,
      users: users.filter((u) => u.room === finalTargetRoom)
    });
    io.emit('onlineCountUpdated', users.length);

    // Send admin data only to admin/super users
    if (newUser.role === 'admin' || newUser.role === 'super') {
      socket.emit('adminInitialData', {
        bannedList: Array.from(bannedRecords.values()),
        staffMemos,
        filterAlerts,
        monitoredWords,
        rolePermissions,
        serverSecurity
      });
      socket.emit('allRegisteredMembers', getAllRegisteredMembersPayload());
    }
  });

  // User typing indicator event (بث حالة الكتابة الآن للأعضاء في نفس الغرفة مع وميض وتأثير بصري)
  socket.on('typing', ({ isTyping }: { isTyping?: boolean } = {}) => {
    const user = users.find((u) => u.id === socket.id);
    if (!user || !user.room || user.room === 'خارج الغرف') return;

    socket.to(user.room).emit('userTyping', {
      userId: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      flag: user.flag,
      role: user.role,
      nameColor: user.nameColor,
      nameGradient: user.nameGradient,
      room: user.room,
      isTyping: Boolean(isTyping),
      timestamp: Date.now()
    });
  });

  // Chat message event (Supports text + mediaUrl + voiceNote + replyTo)
  socket.on(
    'chatMessage',
    ({
      text,
      mediaUrl,
      mediaType,
      voiceNote,
      replyTo
    }: {
      text?: string;
      mediaUrl?: string;
      mediaType?: 'image' | 'video' | 'sticker' | 'audio';
      voiceNote?: { audioUrl: string; duration: number };
      replyTo?: { id: string; username: string; text: string; mediaUrl?: string };
    }) => {
      const user = users.find((u) => u.id === socket.id);
      if (!user) return;

    if (user.isTextMuted) {
      socket.emit('systemAlert', 'أنت خاضع للإسكات حالياً من قبل الإدارة.');
      return;
    }

    // Emergency Lockdown Check
    if (serverSecurity.emergencyLockdown && user.role !== 'admin' && user.role !== 'super') {
      socket.emit('systemAlert', '🔒 تم تفعيل وضع الطوارئ الإداري (Lockdown)، الإرسال محصور بطاقم الإدارة.');
      return;
    }

    const roomSettings = getRoomSettings(user.room);
    if (roomSettings.isChatLocked && user.role !== 'admin' && user.role !== 'super') {
      socket.emit('systemAlert', 'الشات العام مقفل حالياً بقرار من إدارة حسان برو.');
      return;
    }

    if (roomSettings.slowModeSeconds > 0 && user.role !== 'admin' && user.role !== 'super') {
      const lastSent = userLastMessageTime[socket.id] || 0;
      const elapsed = (Date.now() - lastSent) / 1000;
      if (elapsed < roomSettings.slowModeSeconds) {
        const remaining = Math.ceil(roomSettings.slowModeSeconds - elapsed);
        socket.emit('systemAlert', `وضع الدردشة البطيء مفعل: يرجى الانتظار ${remaining} ثواني قبل إرسال رسالتك القادمة.`);
        return;
      }
      userLastMessageTime[socket.id] = Date.now();
    }

    const cleanMsg = sanitizeText(text);
    if (!cleanMsg && !mediaUrl && !voiceNote) return;

    // Likes Requirement Check for Room Messages
    if (user.role !== 'admin' && user.role !== 'super') {
      if (cleanMsg && likesSettings.roomTextLikes > 0 && user.likes < likesSettings.roomTextLikes) {
        socket.emit('systemAlert', `عفواً، يتطلب إرسال النص في الغرفة ${likesSettings.roomTextLikes} لايك على الأقل. رصيدك الحالي: ${user.likes} 👍`);
        return;
      }
      if ((mediaUrl || voiceNote) && likesSettings.roomMediaLikes > 0 && user.likes < likesSettings.roomMediaLikes) {
        socket.emit('systemAlert', `عفواً، يتطلب إرسال الوسائط في الغرفة ${likesSettings.roomMediaLikes} لايك على الأقل. رصيدك الحالي: ${user.likes} 👍`);
        return;
      }
    }

    // External Link Blocker Check
    if (cleanMsg && serverSecurity.blockExternalLinks && user.role !== 'admin' && user.role !== 'super') {
      const urlPattern = /(https?:\/\/|www\.|\.com|\.net|\.org|\.xyz|\.app|\.me|\.online|t\.me|wa\.me)/i;
      if (urlPattern.test(cleanMsg)) {
        logMonitorEvent('security', `محاولة نشر رابط محظور من [${user.username}]: "${cleanMsg}"`, user.username);
        socket.emit('systemAlert', '⚠️ نشر الروابط والإعلانات الخارجية ممنوع منعاً باتاً في شات حسان برو.');
        return;
      }
    }

    // Check if message matches any monitored filter words (الكلمات المراقبة عبر الفلتر)
    if (cleanMsg) {
      checkAndLogMonitoredWords(cleanMsg, user, { type: 'room', targetName: user.room });
    }

    // Automatic Chat Shortcut Expansion (توسيع واستبدال الاختصارات تلقائياً)
    const expandedMsg = cleanMsg ? expandShortcuts(cleanMsg) : '';

    // Guarantee short URLs (<1KB payload) by converting any client base64 to local disk storage
    const safeMediaUrl = ensureMediaUrlNotBase64(mediaUrl);
    let safeVoiceNote = voiceNote;
    if (voiceNote?.audioUrl) {
      safeVoiceNote = {
        ...voiceNote,
        audioUrl: ensureMediaUrlNotBase64(voiceNote.audioUrl) || voiceNote.audioUrl
      };
    }

    const messageObj: StoredMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      room: user.room,
      username: user.username,
      avatarUrl: user.avatarUrl,
      nameBannerUrl: user.nameBannerUrl,
      flag: user.flag,
      badge: user.role === 'admin' ? 'الإدارة' : user.role === 'super' ? 'سوبر' : undefined,
      badgeColor: user.role === 'admin' ? 'text-red-600' : 'text-amber-400',
      text: expandedMsg,
      mediaUrl: safeMediaUrl,
      mediaType,
      voiceNote: safeVoiceNote,
      replyTo,
      time: getCurrentTimeString(),
      timestamp: Date.now(),
      reactions: {},
      nameColor: user.nameColor,
      textColor: user.textColor,
      nameGradient: user.nameGradient
    };

    chatHistory.push(messageObj);
    if (chatHistory.length > 500) chatHistory = chatHistory.slice(-500);
    saveHistory();

    // Increment engagement messages count & calculate progression
    const regMember = registeredMembers[user.username];
    if (regMember) {
      if (!regMember.engagement) regMember.engagement = getDefaultEngagement();
      regMember.engagement.messagesSent += 1;
      const engProg = calculateEngagementStars(regMember.engagement);
      regMember.engagement.starsLevel = engProg.starsLevel;
      regMember.engagement.progressPercent = engProg.progressPercent;
      user.engagement = regMember.engagement;
      saveMembers();
    }

    io.to(user.room).emit('message', messageObj);
    socket.to(user.room).emit('userTyping', {
      userId: user.id,
      username: user.username,
      room: user.room,
      isTyping: false,
      timestamp: Date.now()
    });
  });

  // General Broadcast Alert (إشعار عام للغرفة من الإدارة والمشرفين)
  socket.on('broadcastAlert', ({ text }: { text: string }) => {
    const user = users.find((u) => u.id === socket.id);
    if (!user) return;

    if (user.role !== 'admin' && user.role !== 'super') {
      socket.emit('systemAlert', 'عفواً، إرسال الإشعار والتنبيه العام متاح للإدارة والمشرفين فقط.');
      return;
    }

    const clean = sanitizeText(text);
    if (!clean) return;

    const alertMessageObj: StoredMessage = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      room: user.room,
      username: user.username,
      avatarUrl: user.avatarUrl,
      nameBannerUrl: user.nameBannerUrl,
      flag: user.flag,
      badge: '📢 إشعار عام',
      badgeColor: 'text-amber-500 font-extrabold',
      text: clean,
      time: 'الآن',
      timestamp: Date.now(),
      reactions: {}
    };

    chatHistory.push(alertMessageObj);
    if (chatHistory.length > 500) chatHistory = chatHistory.slice(-500);
    saveHistory();

    io.to(user.room).emit('generalAlert', {
      from: user.username,
      text: clean,
      messageObj: alertMessageObj
    });
    io.to(user.room).emit('message', alertMessageObj);
  });

  // Take Mic slot (1 to 5)
  socket.on('takeMic', ({ slotNumber }: { slotNumber: number }) => {
    const user = users.find((u) => u.id === socket.id);
    if (!user) return;

    if (user.isTextMuted) {
      socket.emit('micError', 'أنت خاضع للإسكات من قبل الإدارة، لا يمكنك الصعود إلى المايك.');
      return;
    }

    if (user.role !== 'admin' && user.role !== 'super' && likesSettings.micLikes > 0 && user.likes < likesSettings.micLikes) {
      socket.emit('micError', `عفواً، يتطلب الصعود إلى المايك ${likesSettings.micLikes} لايك على الأقل. رصيدك الحالي: ${user.likes} 👍`);
      return;
    }

    const roomSettings = getRoomSettings(user.room);
    if (roomSettings.isVoiceLocked && user.role !== 'admin' && user.role !== 'super') {
      socket.emit('micError', 'المايكات مقفلة ومحصورة حالياً على الإدارة والمشرفين فقط.');
      return;
    }

    const slots = getMicSlotsForRoom(user.room);
    const targetSlot = slots.find((s) => s.slotNumber === slotNumber);
    if (!targetSlot) return;

    if (targetSlot.user && targetSlot.user.id !== user.id) {
      socket.emit('micError', `المايك رقم ${slotNumber} مشغول حالياً.`);
      return;
    }

    slots.forEach((s) => {
      if (s.user && s.user.id === user.id) s.user = null;
    });

    user.micSlot = slotNumber;
    user.isVoice = true;
    user.isMuted = false;
    user.isSpeaking = false;
    targetSlot.user = user;

    logMonitorEvent('mic_take', `صعد ${user.username} إلى المايك (${slotNumber})`, user.username);
    io.to(user.room).emit('micSlotsUpdated', slots);

    const micMsg: StoredMessage = {
      id: `mic-${Date.now()}`,
      room: user.room,
      username: 'نظام المايكات 🎙️',
      badge: `مايك ${slotNumber}`,
      badgeColor: 'text-emerald-500',
      text: `صعد ${user.username} إلى المايك رقم (${slotNumber}) 🎤`,
      time: getCurrentTimeString(),
      timestamp: Date.now()
    };
    io.to(user.room).emit('message', micMsg);

    const otherVoiceUsers = users.filter((u) => u.room === user.room && u.isVoice && u.id !== socket.id);
    socket.emit('voiceRoomUsers', otherVoiceUsers);
    socket.broadcast.to(user.room).emit('userJoinedVoice', user);
  });

  // Drop Mic slot
  socket.on('dropMic', () => {
    const user = users.find((u) => u.id === socket.id);
    if (!user || user.micSlot === null) return;

    const slots = getMicSlotsForRoom(user.room);
    const slot = slots.find((s) => s.slotNumber === user.micSlot);
    const releasedNumber = user.micSlot;

    if (slot) slot.user = null;
    user.micSlot = null;
    user.isVoice = false;
    user.isSpeaking = false;

    logMonitorEvent('mic_drop', `نزل ${user.username} من المايك (${releasedNumber})`, user.username);
    io.to(user.room).emit('micSlotsUpdated', slots);
    socket.broadcast.to(user.room).emit('userLeftVoice', { userId: socket.id, username: user.username });
  });

  // WebRTC Signaling
  socket.on('voiceSignal', ({ targetId, signal }: { targetId: string; signal: any }) => {
    const sender = users.find((u) => u.id === socket.id);
    if (!sender) return;

    io.to(targetId).emit('voiceSignal', {
      senderId: socket.id,
      senderUsername: sender.username,
      signal
    });
  });

  // Voice state
  socket.on('voiceStateUpdate', ({ isMuted, isSpeaking }: { isMuted?: boolean; isSpeaking?: boolean }) => {
    const user = users.find((u) => u.id === socket.id);
    if (!user) return;

    if (typeof isMuted === 'boolean') user.isMuted = isMuted;
    if (typeof isSpeaking === 'boolean') user.isSpeaking = isSpeaking;

    const slots = getMicSlotsForRoom(user.room);
    io.to(user.room).emit('micSlotsUpdated', slots);
    io.to(user.room).emit('userVoiceStateChanged', {
      userId: user.id,
      isMuted: user.isMuted,
      isSpeaking: user.isSpeaking
    });
  });

  // ================= ADMIN & MODERATION POWERS =================
  socket.on('adminAction', ({
    action,
    targetUsername,
    value,
    reason
  }: {
    action: string;
    targetUsername?: string;
    value?: any;
    reason?: string;
  }) => {
    const admin = users.find((u) => u.id === socket.id);
    if (!admin) {
      socket.emit('systemAlert', 'يجب تسجيل الدخول أولاً لتنفيذ الإجراءات.');
      return;
    }

    const target = users.find((u) => u.username === targetUsername);
    const offlineMember = targetUsername ? registeredMembers[targetUsername] : undefined;

    const actionsWithoutTarget = [
      'unban', 'globalBroadcast', 'globalClearChat', 'pullAllUsers', 'editRoom', 'deleteRoom', 
      'lockRoomChat', 'setSlowMode', 'lockRoomVoice', 'setRoomPassword', 'adminSiren',
      'getRoomStats', 'getBannedList', 'getMonitorLogs'
    ];

    if (!target && !offlineMember && !actionsWithoutTarget.includes(action) && action !== 'ban') {
      socket.emit('systemAlert', `المستخدم [${targetUsername}] غير موجود في قاعدة بيانات الأعضاء.`);
      return;
    }

    const targetProxy = target ? target : (offlineMember ? { username: targetUsername!, role: offlineMember.role } : undefined);

    // Role Permission & Hierarchy Check
    if (!actionsWithoutTarget.includes(action)) {
      const perm = canPerformModeration(admin, targetProxy, action);
      if (!perm.allowed) {
        socket.emit('systemAlert', perm.reason || 'ليست لديك الصلاحية لتنفيذ هذا الإجراء.');
        return;
      }
    }

    switch (action) {
      case 'getRoomStats': {
        socket.emit('roomStats', getRoomStatistics());
        break;
      }
      case 'getBannedList': {
        socket.emit('bannedListUpdated', Array.from(bannedRecords.values()));
        break;
      }
      case 'getMonitorLogs': {
        socket.emit('monitorLogs', monitorLogs);
        socket.emit('monitoredWordsUpdated', monitoredWords);
        break;
      }
      // سحب المايك (Revoke Mic)
      case 'pullMic': {
        if (target && target.micSlot !== null) {
          const slots = getMicSlotsForRoom(target.room);
          const slot = slots.find((s) => s.slotNumber === target.micSlot);
          const slotNum = target.micSlot;
          if (slot) slot.user = null;
          target.micSlot = null;
          target.isVoice = false;
          target.isSpeaking = false;

          io.to(target.room).emit('micSlotsUpdated', slots);
          io.to(target.id).emit('micRevokedByAdmin', { adminName: admin.username });
          io.to(target.room).emit('userLeftVoice', { userId: target.id, username: target.username });

          logMonitorEvent('mic_pull', `قام [${admin.role.toUpperCase()}] ${admin.username} بسحب المايك من ${target.username}`, admin.username, target.username);

          const alertMsg: StoredMessage = {
            id: `pull-${Date.now()}`,
            room: target.room,
            username: 'إدارة حسان برو',
            badge: 'سحب المايك',
            badgeColor: 'text-red-600',
            text: `تم سحب المايك (${slotNum}) من ${target.username} بواسطة ${admin.role === 'admin' ? 'مدير النظام' : 'المشرف'} (${admin.username}).`,
            time: getCurrentTimeString(),
            timestamp: Date.now()
          };
          io.to(target.room).emit('message', alertMsg);
          socket.emit('systemAlert', `تم سحب المايك من ${target.username} بنجاح.`);
        }
        break;
      }

      // إسكات (Mute / Unmute Text & Voice)
      case 'mute': {
        if (target) {
          target.isTextMuted = !target.isTextMuted;
          if (target.isTextMuted && target.micSlot !== null) {
            target.isMuted = true;
          }
          logMonitorEvent('mute', `${target.isTextMuted ? 'إسكات' : 'إلغاء إسكات'} ${target.username} بواسطة [${admin.role.toUpperCase()}] ${admin.username}`, admin.username, target.username);
          io.to(target.id).emit('systemAlert', target.isTextMuted ? `تم فرض الإسكات عليك بواسطة ${admin.username}.` : `تم رفع الإسكات عنك بواسطة ${admin.username}.`);
          io.to(target.room).emit('roomUsers', { room: target.room, users: users.filter((u) => u.room === target.room) });
          socket.emit('systemAlert', `تم ${target.isTextMuted ? 'إسكات' : 'إلغاء إسكات'} ${target.username} بنجاح.`);
        }
        break;
      }

      // طرد من الغرفة (Kick)
      case 'kick': {
        if (target) {
          const kickReason = reason || 'مخالفة قوانين وقواعد شات حسان برو';
          logMonitorEvent('kick', `طرد ${target.username} بواسطة [${admin.role.toUpperCase()}] ${admin.username} (السبب: ${kickReason})`, admin.username, target.username);
          io.to(target.id).emit('kickedByAdmin', { reason: kickReason, by: admin.username });
          
          if (target.micSlot !== null) {
            const slots = getMicSlotsForRoom(target.room);
            const slot = slots.find((s) => s.slotNumber === target.micSlot);
            if (slot) slot.user = null;
            io.to(target.room).emit('micSlotsUpdated', slots);
          }

          const tIdx = users.findIndex((u) => u.id === target.id);
          if (tIdx !== -1) users.splice(tIdx, 1);
          io.to(target.room).emit('roomUsers', { room: target.room, users: users.filter((u) => u.room === target.room) });
          socket.emit('systemAlert', `تم طرد ${target.username} بنجاح.`);
        }
        break;
      }

      // باند وحظر دائم يشمل عنوان الـ IP والحسابات المرتبطة (Ban IP & Username)
      case 'ban': {
        const uName = (targetUsername || target?.username || '').trim();
        if (!uName) break;
        const banReason = value || reason || 'مخالفة شروط وقوانين حسان برو';

        // 1. Resolve target IP
        let targetIp = target?.ipAddress;
        if (!targetIp && registeredMembers[uName]?.ipAddress) {
          targetIp = registeredMembers[uName].ipAddress;
        }
        if (!targetIp) {
          for (const [ip, nicks] of ipToAccountsMap.entries()) {
            if (Array.from(nicks).some((n) => n.toLowerCase() === uName.toLowerCase())) {
              targetIp = ip;
              break;
            }
          }
        }
        if (!targetIp) targetIp = clientIp || '192.168.1.1';

        // 2. Add to banned sets
        bannedUsers.add(uName.toLowerCase());
        if (targetIp) bannedIps.add(targetIp);

        // Ban all accounts associated with this IP
        if (targetIp && ipToAccountsMap.has(targetIp)) {
          ipToAccountsMap.get(targetIp)!.forEach((acc) => {
            bannedUsers.add(acc.toLowerCase());
          });
        }

        bannedRecords.set(uName.toLowerCase(), {
          username: uName,
          ip: targetIp,
          reason: banReason,
          bannedBy: admin.username,
          timestamp: Date.now()
        });
        saveBans();

        // 3. Disconnect all live users from this IP or username
        const liveToKick = users.filter((u) => u.username.toLowerCase() === uName.toLowerCase() || (targetIp && u.ipAddress === targetIp));
        liveToKick.forEach((kUser) => {
          io.to(kUser.id).emit('kickedByAdmin', { reason: `تم حظرك نهائياً وحظر عنوان الـ IP من دخول حسان برو بقرار إداري (${banReason}).`, by: admin.username });
          if (kUser.micSlot !== null) {
            const slots = getMicSlotsForRoom(kUser.room);
            const slot = slots.find((s) => s.slotNumber === kUser.micSlot);
            if (slot) slot.user = null;
            io.to(kUser.room).emit('micSlotsUpdated', slots);
          }
          const tIdx = users.findIndex((u) => u.id === kUser.id);
          if (tIdx !== -1) users.splice(tIdx, 1);
          io.to(kUser.room).emit('roomUsers', { room: kUser.room, users: users.filter((u) => u.room === kUser.room) });
        });

        io.emit('bannedListUpdated', Array.from(bannedRecords.values()));
        io.emit('allRegisteredMembers', getAllRegisteredMembersPayload());
        logMonitorEvent('ban', `حظر دائم لـ ${uName} وعنوان الـ IP [${targetIp}] بواسطة [${admin.role.toUpperCase()}] ${admin.username} (السبب: ${banReason})`, admin.username, uName);
        socket.emit('systemAlert', `تم تطبيق الباند والحظر النهائي على ${uName} وعنوان الـ IP [${targetIp}] بنجاح.`);
        break;
      }

      // إلغاء الحظر وفك الباند (Unban by Username or IP - حتى لو كان الشخص غير متصل)
      case 'unban': {
        const uName = (targetUsername || '').trim();
        if (!uName) break;

        let rec = bannedRecords.get(uName.toLowerCase());
        if (!rec) {
          for (const [k, v] of bannedRecords.entries()) {
            if (v.ip === uName || v.username.toLowerCase() === uName.toLowerCase()) {
              rec = v;
              break;
            }
          }
        }

        if (rec) {
          if (rec.ip) bannedIps.delete(rec.ip);
          bannedUsers.delete(rec.username.toLowerCase());
          bannedRecords.delete(rec.username.toLowerCase());
        } else {
          bannedUsers.delete(uName.toLowerCase());
          bannedIps.delete(uName);
          bannedRecords.delete(uName.toLowerCase());
        }
        saveBans();

        io.emit('bannedListUpdated', Array.from(bannedRecords.values()));
        logMonitorEvent('role', `فك الحظر والباند عن [${uName}] بواسطة ${admin.username}`, admin.username, uName);
        socket.emit('systemAlert', `تم رفع الحظر وفك الباند عن ${uName} بنجاح 🔓.`);
        break;
      }

      // فك الإسكات الكتابي (Unmute Text)
      case 'unmuteText': {
        if (target) {
          target.isTextMuted = false;
          io.to(target.room).emit('roomUsers', { room: target.room, users: users.filter((u) => u.room === target.room) });
          io.to(target.id).emit('systemAlert', `تم فك الإسكات الكتابي عنك بواسطة الإدارة (${admin.username}).`);
          logMonitorEvent('mute', `فك الإسكات الكتابي عن ${target.username} بواسطة ${admin.username}`, admin.username, target.username);
          socket.emit('systemAlert', `تم فك الإسكات الكتابي عن ${target.username}.`);
        }
        break;
      }

      // فك الإسكات الصوتي (Unmute Voice)
      case 'unmuteVoice': {
        if (target) {
          target.isMuted = false;
          io.to(target.room).emit('roomUsers', { room: target.room, users: users.filter((u) => u.room === target.room) });
          io.to(target.id).emit('systemAlert', `تم فك الإسكات الصوتي عنك بواسطة الإدارة (${admin.username}).`);
          logMonitorEvent('mute', `فك الإسكات الصوتي عن ${target.username} بواسطة ${admin.username}`, admin.username, target.username);
          socket.emit('systemAlert', `تم فك الإسكات الصوتي عن ${target.username}.`);
        }
        break;
      }

      // تعديل النقاط (Update Points - Admin Only - للأعضاء المتصلين وغير المتصلين)
      case 'updatePoints': {
        const uName = (targetUsername || target?.username || '').trim();
        const pts = Number(value) || 0;
        if (target) {
          target.points = pts;
        }
        if (registeredMembers[uName]) {
          registeredMembers[uName].points = pts;
          saveMembers();
        }
        if (target) {
          io.to(target.room).emit('roomUsers', { room: target.room, users: users.filter((u) => u.room === target.room) });
        }
        io.emit('allRegisteredMembers', getAllRegisteredMembersPayload());
        logMonitorEvent('role', `تعديل رصيد نقاط ${uName} إلى (${pts}) بواسطة مدير النظام ${admin.username}`, admin.username, uName);
        socket.emit('systemAlert', `تم تعديل نقاط ${uName} إلى ${pts}.`);
        break;
      }

      // قفل أو فتح الشات العام للغرفة (Lock Room Chat)
      case 'lockRoomChat': {
        const room = admin.room;
        const settings = getRoomSettings(room);
        settings.isChatLocked = Boolean(value);
        io.to(room).emit('roomSettingsUpdated', { room, settings });
        logMonitorEvent('role', `${settings.isChatLocked ? 'قفل' : 'فتح'} الشات العام في [${room}] بواسطة ${admin.username}`, admin.username);
        io.to(room).emit('systemAlert', settings.isChatLocked ? '🔒 تم قفل الشات العام مؤقتاً بقرار إداري.' : '🔓 تم فتح الشات العام للجميع.');
        break;
      }

      // تحديد وضع الدردشة البطيء (Set Slow Mode)
      case 'setSlowMode': {
        const room = admin.room;
        const settings = getRoomSettings(room);
        settings.slowModeSeconds = Number(value) || 0;
        io.to(room).emit('roomSettingsUpdated', { room, settings });
        logMonitorEvent('role', `تعديل وضع الدردشة البطيء في [${room}] إلى (${settings.slowModeSeconds} ثواني) بواسطة ${admin.username}`, admin.username);
        io.to(room).emit('systemAlert', settings.slowModeSeconds > 0 ? `⏱️ تم تفعيل وضع الدردشة البطيء (${settings.slowModeSeconds} ثواني بين الرسائل).` : '⏱️ تم إيقاف وضع الدردشة البطيء.');
        break;
      }

      // قفل أو فتح المايكات الصوتية للإدارة فقط (Lock Room Voice)
      case 'lockRoomVoice': {
        const room = admin.room;
        const settings = getRoomSettings(room);
        settings.isVoiceLocked = Boolean(value);
        io.to(room).emit('roomSettingsUpdated', { room, settings });
        logMonitorEvent('role', `${settings.isVoiceLocked ? 'قفل' : 'فتح'} المايكات الصوتية في [${room}] بواسطة ${admin.username}`, admin.username);
        io.to(room).emit('systemAlert', settings.isVoiceLocked ? '🎙️🔒 تم قفل مقاعد الصوت وحصرها على الإدارة فقط.' : '🎙️🔓 تم فتح مقاعد الصوت لجميع الأعضاء.');
        break;
      }

      // مسح سجل محادثات الغرفة للجميع (Global Clear Chat)
      case 'globalClearChat': {
        const room = admin.room;
        chatHistory.length = 0;
        saveHistory();
        io.to(room).emit('chatHistory', []);
        io.to(room).emit('systemAlert', `🧹 قام المشرف ${admin.username} بمسح سجل محادثات الغرفة كاملاً للجميع.`);
        logMonitorEvent('role', `مسح سجل محادثات الغرفة [${room}] بواسطة ${admin.username}`, admin.username);
        break;
      }

      // سحب جميع المتواجدين في كافة الغرف لغرفة المشرف (Pull All Users)
      case 'pullAllUsers': {
        const targetRoom = admin.room;
        users.forEach((u) => {
          if (u.room !== targetRoom) {
            u.room = targetRoom;
            io.to(u.id).emit('forceMoveRoom', { room: targetRoom });
          }
        });
        chatRooms.forEach((r) => {
          io.to(r.id).emit('roomUsers', { room: r.id, users: users.filter((u) => u.room === r.id) });
        });
        io.emit('roomStatsUpdated', getRoomStatistics());
        logMonitorEvent('role', `قام ${admin.username} بسحب جميع الأعضاء إلى غرفة [${targetRoom}]`, admin.username);
        io.emit('systemAlert', `📢 قامت الإدارة بنقل جميع الأعضاء المتواجدين إلى [${targetRoom}]!`);
        break;
      }

      // تعيين أو تغيير كلمة مرور الغرفة (Set Room Password)
      case 'setRoomPassword': {
        const room = chatRooms.find((r) => r.id === admin.room);
        if (room) {
          const pass = sanitizeText(value);
          if (pass) {
            room.isPasswordProtected = true;
            room.password = pass;
            io.emit('roomsUpdated', chatRooms);
            socket.emit('systemAlert', `تم تعيين كلمة مرور للغرفة [${room.name}]: ${pass}`);
          } else {
            room.isPasswordProtected = false;
            delete room.password;
            io.emit('roomsUpdated', chatRooms);
            socket.emit('systemAlert', `تمت إزالة كلمة المرور وأصبحت الغرفة [${room.name}] عامة ومفتوحة.`);
          }
          logMonitorEvent('role', `تعديل حماية وكلمة سر الغرفة [${room.name}] بواسطة ${admin.username}`, admin.username);
        }
        break;
      }

      // إرسال تنبيه رسمي (Warn)
      case 'warn': {
        if (target) {
          const warnText = value || 'الرجاء الالتزام بقوانين حسان برو واحترام المتواجدين.';
          logMonitorEvent('warn', `إرسال تنبيه رسمي لـ ${target.username} بواسطة ${admin.username}`, admin.username, target.username);
          io.to(target.id).emit('officialWarning', { from: admin.username, text: warnText });
          socket.emit('systemAlert', `تم إرسال التنبيه الرسمي إلى ${target.username}.`);
        }
        break;
      }

      // حذف الصورة الشخصية (Delete Avatar - للأعضاء المتصلين وغير المتصلين)
      case 'deleteAvatar': {
        const uName = (targetUsername || target?.username || '').trim();
        if (target) {
          target.avatarUrl = undefined;
        }
        if (registeredMembers[uName]) {
          registeredMembers[uName].avatarUrl = undefined;
          saveMembers();
        }
        if (target) {
          io.to(target.room).emit('roomUsers', { room: target.room, users: users.filter((u) => u.room === target.room) });
          io.to(target.id).emit('systemAlert', `تم حذف صورتك الشخصية بواسطة الإدارة (${admin.username}) لمخالفتها الآداب العامة.`);
        }
        io.emit('allRegisteredMembers', getAllRegisteredMembersPayload());
        logMonitorEvent('role', `حذف صورة ${uName} بواسطة [${admin.role.toUpperCase()}] ${admin.username}`, admin.username, uName);
        socket.emit('systemAlert', `تم حذف صورة ${uName} بنجاح.`);
        break;
      }

      // تعيين وتحديث صورة شخصية للعضو (Update Avatar)
      case 'updateAvatar': {
        const uName = (targetUsername || target?.username || '').trim();
        if (value && typeof value === 'string') {
          if (target) {
            target.avatarUrl = value;
          }
          if (registeredMembers[uName]) {
            registeredMembers[uName].avatarUrl = value;
            saveMembers();
          }
          if (target) {
            io.to(target.room).emit('roomUsers', { room: target.room, users: users.filter((u) => u.room === target.room) });
            io.to(target.id).emit('systemAlert', `تم تحديث صورتك الشخصية بواسطة الإدارة (${admin.username}).`);
          }
          io.emit('allRegisteredMembers', getAllRegisteredMembersPayload());
          logMonitorEvent('role', `تحديث صورة ${uName} بواسطة [${admin.role.toUpperCase()}] ${admin.username}`, admin.username, uName);
          socket.emit('systemAlert', `تم تحديث صورة ${uName} بنجاح.`);
        }
        break;
      }

      // تعديل اللايكات (Update Likes - Admin Only - للأعضاء المتصلين وغير المتصلين)
      case 'updateLikes': {
        const uName = (targetUsername || target?.username || '').trim();
        const lks = Number(value) || 0;
        if (target) {
          target.likes = lks;
        }
        if (registeredMembers[uName]) {
          registeredMembers[uName].likes = lks;
          saveMembers();
        }
        if (target) {
          io.to(target.room).emit('roomUsers', { room: target.room, users: users.filter((u) => u.room === target.room) });
        }
        io.emit('allRegisteredMembers', getAllRegisteredMembersPayload());
        logMonitorEvent('likes', `تعديل لايكات ${uName} إلى (${lks}) بواسطة مدير النظام ${admin.username}`, admin.username, uName);
        socket.emit('systemAlert', `تم تعديل لايكات ${uName} إلى ${lks}.`);
        break;
      }

      // تعديل الحالة (Update Quote - للأعضاء المتصلين وغير المتصلين)
      case 'updateQuote': {
        const uName = (targetUsername || target?.username || '').trim();
        const cleanQuote = sanitizeText(value) || '';
        if (target) {
          target.statusQuote = cleanQuote;
        }
        if (registeredMembers[uName]) {
          registeredMembers[uName].statusQuote = cleanQuote;
          saveMembers();
        }
        if (target) {
          io.to(target.room).emit('roomUsers', { room: target.room, users: users.filter((u) => u.room === target.room) });
        }
        io.emit('allRegisteredMembers', getAllRegisteredMembersPayload());
        socket.emit('systemAlert', `تم تحديث حالة ${uName} بنجاح.`);
        break;
      }

      // تعديل الاسم والزخرفة (Update Username)
      case 'updateUsername': {
        if (value && typeof value === 'string') {
          const oldName = (targetUsername || target?.username || '').trim();
          const newName = sanitizeText(value.trim());
          if (newName && newName !== oldName) {
            if (target) {
              target.username = newName;
            }
            if (registeredMembers[oldName]) {
              const data = registeredMembers[oldName];
              delete registeredMembers[oldName];
              registeredMembers[newName] = data;
              saveMembers();
            }
            if (target) {
              io.to(target.room).emit('roomUsers', { room: target.room, users: users.filter((u) => u.room === target.room) });
              io.to(target.id).emit('systemAlert', `تم تعديل اسمك/زخرفتك إلى [${newName}] بواسطة الإدارة.`);
            }
            io.emit('allRegisteredMembers', getAllRegisteredMembersPayload());
            logMonitorEvent('role', `تعديل اسم/زخرفة ${oldName} إلى [${newName}] بواسطة ${admin.username}`, admin.username, oldName);
            socket.emit('systemAlert', `تم تعديل اسم ${oldName} إلى ${newName} بنجاح.`);
          }
        }
        break;
      }

      // تغيير الرتبة والصلاحيات (Update Role - Admin Only - للأعضاء المتصلين وغير المتصلين)
      case 'updateRole': {
        const uName = (targetUsername || target?.username || '').trim();
        if (value === 'admin' || value === 'super' || value === 'member' || value === 'guest') {
          if (target) {
            target.role = value;
          }
          if (registeredMembers[uName]) {
            registeredMembers[uName].role = value;
            saveMembers();
          }
          if (target) {
            io.to(target.room).emit('roomUsers', { room: target.room, users: users.filter((u) => u.room === target.room) });
            io.to(target.id).emit('userRoleUpdated', { role: value });
          }
          io.emit('allRegisteredMembers', getAllRegisteredMembersPayload());
          logMonitorEvent('role', `ترقية وتعيين رتبة ${uName} إلى [${value.toUpperCase()}] بواسطة مدير النظام ${admin.username}`, admin.username, uName);
          socket.emit('systemAlert', `تم تحديث رتبة ${uName} إلى [${value}] بنجاح.`);
        }
        break;
      }

      // تغيير كلمة مرور العضو بواسطة الإدارة عند النسيان (Change/Reset Member Password - Admin Only)
      case 'updatePassword': {
        const uName = (targetUsername || target?.username || '').trim();
        const newPassword = String(value || '').trim();
        if (!uName) {
          socket.emit('systemAlert', 'يرجى تحديد اسم العضو المراد تغيير كلمة مروره.');
          break;
        }
        if (!newPassword || newPassword.length < 3) {
          socket.emit('systemAlert', 'يجب أن تتكون كلمة المرور الجديدة من 3 أحرف أو أرقام على الأقل.');
          break;
        }
        if (!registeredMembers[uName]) {
          socket.emit('systemAlert', `العضو [${uName}] غير مسجل في قاعدة بيانات الأعضاء.`);
          break;
        }

        registeredMembers[uName].password = newPassword;
        saveMembers();

        if (target) {
          io.to(target.id).emit('systemAlert', `🔑 قامت الإدارة (${admin.username}) بتحديث وتغيير كلمة مرور حسابك إلى: [${newPassword}]. يرجى حفظها لاستخدامها عند تسجيل الدخول.`);
        }

        io.emit('allRegisteredMembers', getAllRegisteredMembersPayload());
        logMonitorEvent('role', `قام مدير النظام ${admin.username} بتغيير وتعيين كلمة مرور جديدة لحساب [${uName}] عند نسيانها`, admin.username, uName);
        socket.emit('systemAlert', `✅ تم تغيير وتحديث كلمة مرور العضو [${uName}] بنجاح إلى: ${newPassword}`);
        break;
      }

      // نقل العضو لغرفة أخرى
      case 'moveRoom': {
        if (target && value) {
          const oldRoom = target.room;
          target.room = value;
          io.to(target.id).emit('forceMoveRoom', { room: value });
          io.to(oldRoom).emit('roomUsers', { room: oldRoom, users: users.filter((u) => u.room === oldRoom) });
          io.to(value).emit('roomUsers', { room: value, users: users.filter((u) => u.room === value) });
          io.emit('roomStatsUpdated', getRoomStatistics());
          logMonitorEvent('role', `نقل ${target.username} إلى غرفة [${value}] بواسطة ${admin.username}`, admin.username, target.username);
          socket.emit('systemAlert', `تم نقل ${target.username} إلى ${value}.`);
        }
        break;
      }

      // سجن واحتجاز العضو (Jail User - محكم وشامل للمتصل وغير المتصل)
      case 'jailUser': {
        const uName = (targetUsername || target?.username || '').trim();
        if (!uName) break;
        const jailReason = reason || value || 'مخالفة قوانين وقواعد شات حسان برو';

        let targetIp = target?.ipAddress;
        if (!targetIp && registeredMembers[uName]?.ipAddress) {
          targetIp = registeredMembers[uName].ipAddress;
        }
        if (!targetIp) targetIp = '192.168.1.1';

        jailedUsernames.add(uName.toLowerCase());
        if (targetIp) jailedIps.add(targetIp);
        jailedRecords.set(uName.toLowerCase(), {
          username: uName,
          ip: targetIp,
          reason: jailReason,
          jailedBy: admin.username,
          timestamp: Date.now()
        });
        saveJailed();

        if (registeredMembers[uName]) {
          registeredMembers[uName].isJailed = true;
          saveMembers();
        }

        if (target) {
          const oldRoom = target.room;
          target.room = 'سجن حسان برو';
          target.isTextMuted = true;
          target.isMuted = true;
          target.isJailed = true;
          if (target.micSlot !== null) {
            const slots = getMicSlotsForRoom(oldRoom);
            const slot = slots.find((s) => s.slotNumber === target.micSlot);
            if (slot) slot.user = null;
            target.micSlot = null;
            io.to(oldRoom).emit('micSlotsUpdated', slots);
          }
          io.to(target.id).emit('forceMoveRoom', { room: 'سجن حسان برو' });
          io.to(target.id).emit('systemAlert', `🚔 تم إيداعك في غرفة السجن والتأديب بقرار من الإدارة (${admin.username}). السبب: ${jailReason}. لا يمكنك مغادرة السجن.`);
          io.to(oldRoom).emit('roomUsers', { room: oldRoom, users: users.filter((u) => u.room === oldRoom) });
          io.to('سجن حسان برو').emit('roomUsers', { room: 'سجن حسان برو', users: users.filter((u) => u.room === 'سجن حسان برو') });
        }

        io.emit('allRegisteredMembers', getAllRegisteredMembersPayload());
        io.emit('roomStatsUpdated', getRoomStatistics());
        logMonitorEvent('jail', `إيداع ${uName} في السجن بواسطة [${admin.role.toUpperCase()}] ${admin.username} (السبب: ${jailReason})`, admin.username, uName);
        socket.emit('systemAlert', `تم إيداع ${uName} في السجن وتثبيت حبسه بنجاح 🚔.`);
        break;
      }

      // فك السجن والإفراج عن العضو (Unjail User - للمتصل وغير المتصل)
      case 'unjailUser': {
        const uName = (targetUsername || target?.username || '').trim();
        if (!uName) break;

        const rec = jailedRecords.get(uName.toLowerCase());
        if (rec?.ip) jailedIps.delete(rec.ip);
        jailedUsernames.delete(uName.toLowerCase());
        jailedRecords.delete(uName.toLowerCase());
        saveJailed();

        if (registeredMembers[uName]) {
          registeredMembers[uName].isJailed = false;
          saveMembers();
        }

        if (target) {
          const oldRoom = target.room;
          target.room = 'الغرفة العامة';
          target.isTextMuted = false;
          target.isMuted = false;
          target.isJailed = false;
          io.to(target.id).emit('forceMoveRoom', { room: 'الغرفة العامة' });
          io.to(target.id).emit('systemAlert', `🕊️ تم الإفراج عنك ورفع الحبس بواسطة الإدارة (${admin.username}). أهلاً بك مجدداً في الغرفة العامة.`);
          io.to(oldRoom).emit('roomUsers', { room: oldRoom, users: users.filter((u) => u.room === oldRoom) });
          io.to('الغرفة العامة').emit('roomUsers', { room: 'الغرفة العامة', users: users.filter((u) => u.room === 'الغرفة العامة') });
        }

        io.emit('allRegisteredMembers', getAllRegisteredMembersPayload());
        io.emit('roomStatsUpdated', getRoomStatistics());
        logMonitorEvent('jail', `الإفراج عن ${uName} من السجن بواسطة ${admin.username}`, admin.username, uName);
        socket.emit('systemAlert', `تم الإفراج عن ${uName} ونقله للغرفة العامة بنجاح 🕊️.`);
        break;
      }

      // حذف عضوية بالكامل من السيرفر (Delete Account - Admin Only)
      case 'deleteAccount': {
        const uName = (targetUsername || '').trim();
        if (registeredMembers[uName]) {
          delete registeredMembers[uName];
          saveMembers();
        }
        if (target) {
          io.to(target.id).emit('kickedByAdmin', { reason: 'تم حذف عضويتك بقرار من مدير النظام.', by: admin.username });
          const tIdx = users.findIndex((u) => u.id === target.id);
          if (tIdx !== -1) users.splice(tIdx, 1);
          io.to(target.room).emit('roomUsers', { room: target.room, users: users.filter((u) => u.room === target.room) });
        }
        io.emit('allRegisteredMembers', getAllRegisteredMembersPayload());
        logMonitorEvent('role', `حذف عضوية [${uName}] نهائياً بواسطة مدير النظام ${admin.username}`, admin.username, uName);
        socket.emit('systemAlert', `تم حذف حساب وعضوية [${uName}] بنجاح.`);
        break;
      }

      // تغيير الاسم المخالف واستبداله باسم لائق (Reset Username)
      case 'resetName': {
        const oldName = (targetUsername || target?.username || '').trim();
        const cleanCustom = sanitizeText(value?.trim());
        const newName = cleanCustom || `عضو_محترم_${Math.floor(100 + Math.random() * 900)}`;
        if (target) {
          target.username = newName;
        }
        if (registeredMembers[oldName]) {
          const data = registeredMembers[oldName];
          delete registeredMembers[oldName];
          registeredMembers[newName] = data;
          saveMembers();
        }
        if (target) {
          io.to(target.room).emit('roomUsers', { room: target.room, users: users.filter((u) => u.room === target.room) });
          io.to(target.id).emit('systemAlert', `تم تعديل اسمك المخالف إلى [${newName}] بواسطة إدارة الشات.`);
        }
        io.emit('allRegisteredMembers', getAllRegisteredMembersPayload());
        logMonitorEvent('role', `تعديل اسم ${oldName} إلى [${newName}] بواسطة ${admin.username}`, admin.username, oldName);
        socket.emit('systemAlert', `تم تعديل اسم ${oldName} إلى [${newName}] بنجاح.`);
        break;
      }

      // منح وسام ولقب شرفي (Assign Honor Badge - للمتصل وغير المتصل)
      case 'assignHonorBadge': {
        const uName = (targetUsername || target?.username || '').trim();
        const badgeText = value ? sanitizeText(String(value).trim()) : undefined;
        if (target) {
          target.honorBadge = badgeText;
        }
        if (registeredMembers[uName]) {
          registeredMembers[uName].honorBadge = badgeText;
          saveMembers();
        }
        if (target) {
          io.to(target.room).emit('roomUsers', { room: target.room, users: users.filter((u) => u.room === target.room) });
          io.to(target.id).emit('systemAlert', badgeText ? `🎉 تم منحك وساماً شرفياً جديداً من الإدارة: ${badgeText}` : 'تمت إزالة الوسام الشرفي.');
        }
        io.emit('allRegisteredMembers', getAllRegisteredMembersPayload());
        logMonitorEvent('role', `منح/تعديل الوسام الشرفي لـ ${uName} [${badgeText || 'إزالة'}] بواسطة ${admin.username}`, admin.username, uName);
        socket.emit('systemAlert', `تم تحديث الوسام الشرفي لـ ${uName} بنجاح.`);
        break;
      }

      // إطلاق صافرة الإنذار الإداري العاجل (Admin Siren)
      case 'adminSiren': {
        const sirenText = sanitizeText(value) || '🚨 صفارة إنذار وتنبيه عام من إدارة حسان برو! الرجاء الانتباه والالتزام بالقوانين.';
        io.emit('adminSirenAlert', { from: admin.username, message: sirenText, timestamp: Date.now() });
        logMonitorEvent('siren', `إطلاق صافرة الإنذار الإداري بواسطة ${admin.username}: "${sirenText}"`, admin.username);
        socket.emit('systemAlert', 'تم إطلاق صافرة الإنذار والتنبيه الإداري لجميع المتواجدين!');
        break;
      }

      // تعديل بيانات الغرفة (Edit Room - Admin Only)
      case 'editRoom': {
        if (value && typeof value === 'object') {
          const { roomId, name, desc, password, voiceLimit } = value;
          const room = chatRooms.find((r) => r.id === roomId);
          if (room) {
            if (name) room.name = sanitizeText(name);
            if (desc !== undefined) room.desc = sanitizeText(desc);
            if (voiceLimit) room.voiceLimit = Number(voiceLimit) || room.voiceLimit;
            if (password !== undefined) {
              if (password) {
                room.isPasswordProtected = true;
                room.password = sanitizeText(password);
              } else {
                room.isPasswordProtected = false;
                delete room.password;
              }
            }
            io.emit('roomsUpdated', chatRooms);
            logMonitorEvent('room', `تعديل إعدادات وبيانات الغرفة [${room.id}] بواسطة ${admin.username}`, admin.username);
            socket.emit('systemAlert', `تم تعديل بيانات وإعدادات الغرفة [${room.id}] بنجاح.`);
          }
        }
        break;
      }

      // حذف الغرفة ونقل الأعضاء للغرفة العامة (Delete Room - Admin Only)
      case 'deleteRoom': {
        const roomId = sanitizeText(value);
        if (roomId === 'الغرفة العامة' || roomId === 'سجن حسان برو') {
          socket.emit('systemAlert', 'لا يمكن حذف الغرف الأساسية للنظام.');
          break;
        }
        const idx = chatRooms.findIndex((r) => r.id === roomId);
        if (idx !== -1) {
          users.forEach((u) => {
            if (u.room === roomId) {
              u.room = 'الغرفة العامة';
              io.to(u.id).emit('forceMoveRoom', { room: 'الغرفة العامة' });
            }
          });
          chatRooms.splice(idx, 1);
          io.emit('roomsUpdated', chatRooms);
          chatRooms.forEach((r) => {
            io.to(r.id).emit('roomUsers', { room: r.id, users: users.filter((u) => u.room === r.id) });
          });
          io.emit('roomStatsUpdated', getRoomStatistics());
          logMonitorEvent('room', `حذف الغرفة [${roomId}] ونقل روادها إلى الغرفة العامة بواسطة ${admin.username}`, admin.username);
          socket.emit('systemAlert', `تم حذف الغرفة [${roomId}] بنجاح.`);
        }
        break;
      }
    }
  });

  // User Profile Settings Updates (حفظ وتعديل الملف الشخصي واستدامته)
  socket.on(
    'updateProfile',
    ({
      username,
      statusQuote,
      avatarUrl,
      password,
      flag,
      nameColor,
      textColor
    }: {
      username?: string;
      statusQuote?: string;
      avatarUrl?: string;
      password?: string;
      flag?: string;
      nameColor?: string;
      textColor?: string;
    }) => {
      const user = users.find((u) => u.id === socket.id);
      if (!user) return;

      const oldUsername = user.username;
      if (username && username.trim() && username.trim() !== oldUsername) {
        const cleanNew = sanitizeText(username.trim());
        const isTaken = users.some((u) => u.id !== user.id && u.username.toLowerCase() === cleanNew.toLowerCase());
        if (!isTaken) {
          user.username = cleanNew;
          user.avatarSeed = cleanNew;
          if (registeredMembers[oldUsername]) {
            const prev = registeredMembers[oldUsername];
            delete registeredMembers[oldUsername];
            registeredMembers[cleanNew] = prev;
          }
        }
      }

      // العلم الحقيقي مكتشف تلقائياً عند الدخول ومقفل لمنع اختيار أعلام وهمية
      // user.flag is preserved from real country IP detection
      if (statusQuote !== undefined) user.statusQuote = sanitizeText(statusQuote);
      if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
      if (nameColor !== undefined) user.nameColor = nameColor;
      if (textColor !== undefined) user.textColor = textColor;

      // Update registered members persistent store
      if (!registeredMembers[user.username]) {
        registeredMembers[user.username] = {
          password: password || '123',
          role: user.role === 'admin' ? 'admin' : user.role === 'super' ? 'super' : 'member',
          flag: user.flag,
          statusQuote: user.statusQuote,
          avatarUrl: user.avatarUrl,
          likes: user.likes || 0,
          points: user.points || 100,
          nameColor: user.nameColor,
          textColor: user.textColor
        };
      } else {
        if (password) registeredMembers[user.username].password = password;
        registeredMembers[user.username].statusQuote = user.statusQuote;
        if (avatarUrl !== undefined) registeredMembers[user.username].avatarUrl = avatarUrl;
        if (user.flag) registeredMembers[user.username].flag = user.flag;
        if (nameColor !== undefined) (registeredMembers[user.username] as any).nameColor = nameColor;
        if (textColor !== undefined) (registeredMembers[user.username] as any).textColor = textColor;
      }
      saveMembers();

      io.emit('userStyleUpdated', {
        username: user.username,
        nameColor: user.nameColor,
        textColor: user.textColor,
        nameGradient: user.nameGradient,
        profileBg: user.profileBg
      });

      // Broadcast update to all rooms and users
      chatRooms.forEach((r) => {
        io.to(r.id).emit('roomUsers', { room: r.id, users: users.filter((u) => u.room === r.id) });
      });
      io.emit('allUsers', users);
      socket.emit('loginSuccess', { user });
      socket.emit('systemAlert', 'تم حفظ وتحديث بيانات ملفك الشخصي بنجاح ✅');
    }
  );

  // Wall posts (الحائط - دعم التبويبين المنشورات والدردشة السريعة مع الحفظ التلقائي)
  socket.on('getWallPosts', () => {
    socket.emit('wallPosts', wallPosts);
  });

  socket.on(
    'newWallPost',
    async ({
      text,
      mediaUrl,
      mediaType,
      category
    }: {
      text: string;
      mediaUrl?: string;
      mediaType?: 'image' | 'video';
      category?: 'posts' | 'quick';
    }) => {
      const user = users.find((u) => u.id === socket.id);
      if (!user || (!text?.trim() && !mediaUrl)) return;

      if (user.role !== 'admin' && user.role !== 'super') {
        if (mediaUrl && likesSettings.wallMediaLikes > 0 && user.likes < likesSettings.wallMediaLikes) {
          socket.emit('systemAlert', `عفواً، يتطلب نشر وسائط في الحائط ${likesSettings.wallMediaLikes} لايك على الأقل. رصيدك الحالي: ${user.likes} 👍`);
          return;
        }
        if (!mediaUrl && text && likesSettings.wallTextLikes > 0 && user.likes < likesSettings.wallTextLikes) {
          socket.emit('systemAlert', `عفواً، يتطلب النشر في الحائط ${likesSettings.wallTextLikes} لايك على الأقل. رصيدك الحالي: ${user.likes} 👍`);
          return;
        }
      }

      if (text) {
        checkAndLogMonitoredWords(text, user, { type: 'wall_post', targetName: 'منشور في الحائط' });
      }

      let cleanMediaUrl = mediaUrl;
      let cleanMediaType: 'image' | 'video' = mediaType || 'image';

      // If client provided a base64 Data URI, convert and route through Storage Layer
      if (cleanMediaUrl && cleanMediaUrl.startsWith('data:')) {
        try {
          const matches = cleanMediaUrl.match(/^data:([A-Za-z0-9-+\/]+);base64,(.+)$/);
          let buffer: Buffer;
          let mime = 'image/jpeg';
          let ext = 'jpg';
          if (matches && matches.length === 3) {
            mime = matches[1].toLowerCase();
            if (mime.includes('mp4')) ext = 'mp4';
            else if (mime.includes('webm')) ext = 'webm';
            else if (mime.includes('mov') || mime.includes('quicktime')) ext = 'mov';
            else if (mime.includes('png')) ext = 'png';
            else if (mime.includes('webp')) ext = 'webp';
            else if (mime.includes('gif')) ext = 'gif';
            buffer = Buffer.from(matches[2], 'base64');
          } else {
            buffer = Buffer.from(cleanMediaUrl, 'base64');
          }
          const uploadRes = await storageManager.saveBuffer(buffer, `wall_${Date.now()}.${ext}`, mime);
          cleanMediaUrl = uploadRes.url;
          if (!mediaType) {
            cleanMediaType = uploadRes.mediaType === 'video' ? 'video' : 'image';
          }
        } catch (err) {
          console.error('[Storage Layer] Failed to convert base64 wall media:', err);
        }
      }

      if (cleanMediaUrl && !mediaType) {
        cleanMediaType = (cleanMediaUrl.endsWith('.mp4') || cleanMediaUrl.endsWith('.webm') || cleanMediaUrl.endsWith('.mov')) ? 'video' : 'image';
      }

      const assignedCategory: 'posts' | 'quick' = category || (cleanMediaUrl ? 'posts' : 'quick');

      const newPost: WallPost = {
        id: `post-${Date.now()}`,
        username: user.username,
        avatarUrl: user.avatarUrl,
        nameBannerUrl: user.nameBannerUrl,
        flag: user.flag,
        text: sanitizeText(text),
        mediaUrl: cleanMediaUrl,
        mediaType: cleanMediaType,
        category: assignedCategory,
        time: 'الآن',
        likes: 0,
        commentsCount: 0,
        timestamp: Date.now()
      };

      wallPosts.unshift(newPost);
      if (wallPosts.length > 100) {
        wallPosts = wallPosts.slice(0, 100);
      }
      saveWallPosts();

      // Increment engagement progression for wall posting
      const regMember = registeredMembers[user.username];
      if (regMember) {
        if (!regMember.engagement) regMember.engagement = getDefaultEngagement();
        regMember.engagement.wallPostsCount += 1;
        const engProg = calculateEngagementStars(regMember.engagement);
        regMember.engagement.starsLevel = engProg.starsLevel;
        regMember.engagement.progressPercent = engProg.progressPercent;
        user.engagement = regMember.engagement;
        saveMembers();
      }

      io.emit('wallPosts', wallPosts);
    }
  );

  socket.on('likeWallPost', ({ postId }: { postId: string }) => {
    const user = users.find((u) => u.id === socket.id);
    if (!user) return;
    const post = wallPosts.find((p) => p.id === postId);
    if (post) {
      if (!post.likedUsers) post.likedUsers = [];
      const userKey = user.username.toLowerCase();
      if (post.likedUsers.includes(userKey)) {
        socket.emit('systemAlert', 'لقد قمت بالإعجاب بهذا المنشور مسبقاً (مسموح بإعجاب واحد فقط لكل عضو) ❤️');
        return;
      }
      post.likedUsers.push(userKey);
      post.likes += 1;
      saveWallPosts();
      io.emit('wallPosts', wallPosts);
      socket.emit('systemAlert', 'تم تسجيل إعجابك بالمنشور بنجاح ❤️');
    }
  });

  // Add Comment on Wall Post (التعليق على منشورات الحائط)
  socket.on('addWallComment', ({ postId, text }: { postId: string; text: string }) => {
    const user = users.find((u) => u.id === socket.id);
    if (!user || !text.trim()) return;
    const post = wallPosts.find((p) => p.id === postId);
    if (post) {
      checkAndLogMonitoredWords(text, user, { type: 'wall_comment', targetName: `تعليق على منشور ${post.username}` });

      if (!post.comments) post.comments = [];
      const newComment: WallComment = {
        id: `cm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        username: user.username,
        avatarUrl: user.avatarUrl,
        nameBannerUrl: user.nameBannerUrl,
        text: sanitizeText(text),
        time: 'الآن',
        timestamp: Date.now()
      };
      post.comments.push(newComment);
      if (post.comments.length > 50) {
        post.comments = post.comments.slice(-50);
      }
      post.commentsCount = post.comments.length;
      saveWallPosts();
      io.emit('wallPosts', wallPosts);
      socket.emit('systemAlert', 'تم نشر تعليقك على الحائط بنجاح 💬');
    }
  });

  // Delete Wall Post (حذف منشور الحائط)
  socket.on('deleteWallPost', ({ postId }: { postId: string }) => {
    const user = users.find((u) => u.id === socket.id);
    if (!user) return;
    const idx = wallPosts.findIndex((p) => p.id === postId);
    if (idx !== -1) {
      const post = wallPosts[idx];
      if (post.username.toLowerCase() === user.username.toLowerCase() || user.role === 'admin' || user.role === 'super') {
        wallPosts.splice(idx, 1);
        saveWallPosts();
        io.emit('wallPosts', wallPosts);
        socket.emit('systemAlert', 'تم حذف المنشور بنجاح 🗑️');
      }
    }
  });

  // Edit Wall Post (تعديل منشور الحائط)
  socket.on('editWallPost', ({ postId, newText }: { postId: string; newText: string }) => {
    const user = users.find((u) => u.id === socket.id);
    if (!user || !newText?.trim()) return;
    const post = wallPosts.find((p) => p.id === postId);
    if (post) {
      if (post.username.toLowerCase() === user.username.toLowerCase() || user.role === 'admin' || user.role === 'super') {
        const cleanText = sanitizeText(newText.trim());
        post.text = cleanText;
        post.isEdited = true;
        saveWallPosts();
        io.emit('wallPosts', wallPosts);
        socket.emit('systemAlert', 'تم تعديل المنشور بنجاح ✏️');
      }
    }
  });

  // Delete Wall Comment (حذف تعليق على منشور الحائط)
  socket.on('deleteWallComment', ({ postId, commentId }: { postId: string; commentId: string }) => {
    const user = users.find((u) => u.id === socket.id);
    if (!user) return;
    const post = wallPosts.find((p) => p.id === postId);
    if (!post || !post.comments) return;

    const cmIdx = post.comments.findIndex((c) => c.id === commentId);
    if (cmIdx !== -1) {
      const comment = post.comments[cmIdx];
      const isCommentAuthor = comment.username.toLowerCase() === user.username.toLowerCase();
      const isPostAuthor = post.username.toLowerCase() === user.username.toLowerCase();
      if (isCommentAuthor || isPostAuthor || user.role === 'admin' || user.role === 'super') {
        post.comments.splice(cmIdx, 1);
        post.commentsCount = post.comments.length;
        saveWallPosts();
        io.emit('wallPosts', wallPosts);
        socket.emit('systemAlert', 'تم حذف التعليق بنجاح 🗑️');
      }
    }
  });

  // =========================================================================
  // 24-HOUR STORIES / KHWATER SYSTEM (نظام الخواطر والحالات - حذف تلقائي بعد 24 ساعة)
  // =========================================================================
  socket.on('getStories', () => {
    socket.emit('storiesUpdated', getActiveStories());
  });

  socket.on(
    'newStory',
    async ({
      mediaUrl,
      mediaType,
      caption
    }: {
      mediaUrl: string;
      mediaType?: 'image' | 'video';
      caption?: string;
    }) => {
      const user = users.find((u) => u.id === socket.id);
      if (!user || !mediaUrl) {
        socket.emit('systemAlert', 'بيانات الخاطرة أو الوسائط مفقودة.');
        return;
      }

      let cleanMedia = mediaUrl;
      let cleanType: 'image' | 'video' = mediaType || 'image';

      if (cleanMedia.startsWith('data:')) {
        try {
          const matches = cleanMedia.match(/^data:([A-Za-z0-9-+\/]+);base64,(.+)$/);
          let buffer: Buffer;
          let mime = 'image/jpeg';
          let ext = 'jpg';
          if (matches && matches.length === 3) {
            mime = matches[1].toLowerCase();
            if (mime.includes('mp4')) ext = 'mp4';
            else if (mime.includes('webm')) ext = 'webm';
            else if (mime.includes('mov') || mime.includes('quicktime')) ext = 'mov';
            else if (mime.includes('png')) ext = 'png';
            else if (mime.includes('webp')) ext = 'webp';
            else if (mime.includes('gif')) ext = 'gif';
            buffer = Buffer.from(matches[2], 'base64');
          } else {
            buffer = Buffer.from(cleanMedia, 'base64');
          }
          const uploadRes = await storageManager.saveBuffer(buffer, `story_${Date.now()}.${ext}`, mime);
          cleanMedia = uploadRes.url;
          if (!mediaType) {
            cleanType = uploadRes.mediaType === 'video' ? 'video' : 'image';
          }
        } catch (err) {
          console.error('[Storage Layer] Failed to convert base64 story to file:', err);
        }
      }

      const newStoryItem: StoryItem = {
        id: `story-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        username: user.username,
        avatarUrl: user.avatarUrl,
        nameBannerUrl: user.nameBannerUrl,
        flag: user.flag,
        mediaUrl: cleanMedia,
        mediaType: cleanType,
        caption: sanitizeText(caption) || undefined,
        createdAt: Date.now(),
        time: getCurrentTimeString(),
        likes: 0,
        likedUsers: [],
        comments: []
      };

      storiesList.unshift(newStoryItem);
      saveStories();

      // Increment engagement for creating a story
      const regMember = registeredMembers[user.username];
      if (regMember) {
        if (!regMember.engagement) regMember.engagement = getDefaultEngagement();
        regMember.engagement.wallPostsCount += 1;
        const engProg = calculateEngagementStars(regMember.engagement);
        regMember.engagement.starsLevel = engProg.starsLevel;
        regMember.engagement.progressPercent = engProg.progressPercent;
        user.engagement = regMember.engagement;
        saveMembers();
      }

      io.emit('storiesUpdated', getActiveStories());
      socket.emit('systemAlert', 'تم نشر خاطرتك / حالتك بنجاح وستبقى ظاهرة لمدة 24 ساعة ⏳✨');
    }
  );

  socket.on('likeStory', ({ storyId }: { storyId: string }) => {
    const user = users.find((u) => u.id === socket.id);
    if (!user) return;
    const story = storiesList.find((s) => s.id === storyId);
    if (story) {
      if (!story.likedUsers) story.likedUsers = [];
      const userKey = user.username.toLowerCase();
      if (story.likedUsers.includes(userKey)) {
        socket.emit('systemAlert', 'لقد سجلت إعجابك بهذه الخاطرة مسبقاً ❤️');
        return;
      }
      story.likedUsers.push(userKey);
      story.likes += 1;
      saveStories();
      io.emit('storiesUpdated', getActiveStories());
      socket.emit('systemAlert', 'تم تسجيل إعجابك بالخاطرة ❤️');
    }
  });

  socket.on('addStoryComment', ({ storyId, text }: { storyId: string; text: string }) => {
    const user = users.find((u) => u.id === socket.id);
    if (!user || !text?.trim()) return;
    const story = storiesList.find((s) => s.id === storyId);
    if (story) {
      if (!story.comments) story.comments = [];
      const newCm: StoryComment = {
        id: `sc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        username: user.username,
        avatarUrl: user.avatarUrl,
        nameBannerUrl: user.nameBannerUrl,
        text: sanitizeText(text),
        time: getCurrentTimeString(),
        timestamp: Date.now()
      };
      story.comments.push(newCm);
      saveStories();
      io.emit('storiesUpdated', getActiveStories());
      socket.emit('systemAlert', 'تمت إضافة تعليقك على الخاطرة بنجاح 💬');
    }
  });

  socket.on('deleteStory', ({ storyId }: { storyId: string }) => {
    const user = users.find((u) => u.id === socket.id);
    if (!user) return;
    const idx = storiesList.findIndex((s) => s.id === storyId);
    if (idx !== -1) {
      const story = storiesList[idx];
      if (story.username.toLowerCase() === user.username.toLowerCase() || user.role === 'admin' || user.role === 'super') {
        storiesList.splice(idx, 1);
        saveStories();
        io.emit('storiesUpdated', getActiveStories());
        socket.emit('systemAlert', 'تم حذف الخاطرة بنجاح 🗑️');
      }
    }
  });

  // Delete Chat Message in Room (حذف رسالة من الغرفة)
  socket.on('deleteChatMessage', ({ messageId }: { messageId: string }) => {
    const user = users.find((u) => u.id === socket.id);
    if (!user) return;
    const msgIdx = chatHistory.findIndex((m) => m.id === messageId);
    if (msgIdx !== -1) {
      const msg = chatHistory[msgIdx];
      if (msg.username.toLowerCase() === user.username.toLowerCase() || user.role === 'admin' || user.role === 'super') {
        chatHistory.splice(msgIdx, 1);
        saveHistory();
        io.to(msg.room).emit('chatMessageDeleted', { messageId });
        socket.emit('systemAlert', 'تم حذف الرسالة بنجاح 🗑️');
      }
    }
  });

  // Edit Chat Message in Room (تعديل رسالة من الغرفة)
  socket.on('editChatMessage', ({ messageId, newText }: { messageId: string; newText: string }) => {
    const user = users.find((u) => u.id === socket.id);
    if (!user || !newText?.trim()) return;
    const msg = chatHistory.find((m) => m.id === messageId);
    if (msg) {
      if (msg.username.toLowerCase() === user.username.toLowerCase() || user.role === 'admin' || user.role === 'super') {
        const cleanText = sanitizeText(newText.trim());
        msg.text = cleanText;
        msg.isEdited = true;
        saveHistory();
        io.to(msg.room).emit('chatMessageEdited', { messageId, newText: cleanText, isEdited: true });
        socket.emit('systemAlert', 'تم تعديل الرسالة بنجاح ✏️');
      }
    }
  });

  // Reaction to Chat Message (التفاعل بالإيموجي مع الرسائل)
  socket.on('reactChatMessage', ({ messageId, emoji }: { messageId: string; emoji: string }) => {
    const user = users.find((u) => u.id === socket.id);
    if (!user) return;
    const msg = chatHistory.find((m) => m.id === messageId);
    if (msg) {
      if (!msg.reactions) msg.reactions = {};
      msg.reactions[emoji] = (msg.reactions[emoji] || 0) + 1;
      saveHistory();
      io.to(msg.room).emit('chatMessageReactionUpdated', { messageId, reactions: msg.reactions });
    }
  });

  // Pin / Unpin Room Message (تثبيت وإلغاء تثبيت رسالة في الروم)
  socket.on('pinRoomMessage', ({ messageId, unpin }: { messageId?: string; unpin?: boolean }) => {
    const user = users.find((u) => u.id === socket.id);
    if (!user || (user.role !== 'admin' && user.role !== 'super')) {
      socket.emit('systemAlert', 'تثبيت الرسائل محصور بالإشراف والإدارة.');
      return;
    }
    if (unpin) {
      roomPinnedMessages[user.room] = null;
      io.to(user.room).emit('roomPinnedMessageUpdated', null);
      logMonitorEvent('room', `فك المشرف ${user.username} تثبيت الإعلان في [${user.room}]`, user.username);
    } else if (messageId) {
      const msg = chatHistory.find((m) => m.id === messageId);
      if (msg) {
        const pinned = { id: msg.id, username: msg.username, text: msg.text || 'مرفق وسائط' };
        roomPinnedMessages[user.room] = pinned;
        io.to(user.room).emit('roomPinnedMessageUpdated', pinned);
        logMonitorEvent('room', `تثبيت رسالة لـ [${msg.username}] في [${user.room}] بواسطة ${user.username}`, user.username);
      }
    }
  });

  // Get Room Pinned Message
  socket.on('getRoomPinnedMessage', () => {
    const user = users.find((u) => u.id === socket.id);
    if (user && roomPinnedMessages[user.room]) {
      socket.emit('roomPinnedMessageUpdated', roomPinnedMessages[user.room]);
    }
  });

  // Report Chat Message (إبلاغ عن رسالة مخالفة للإدارة)
  socket.on('reportChatMessage', ({ messageId, reportedUser, text, reason }: { messageId: string; reportedUser: string; text?: string; reason?: string }) => {
    const user = users.find((u) => u.id === socket.id);
    const reporterName = user?.username || 'عضو';
    logMonitorEvent(
      'warn',
      `🚩 بلاغ عن رسالة: [${reporterName}] أبلغ عن [${reportedUser}] - السبب: ${reason || 'مخالفة'} - المحتوى: "${text?.substring(0, 80) || 'مرفق وسائط'}"`,
      reporterName,
      reportedUser
    );
    users.forEach((u) => {
      if (u.role === 'admin' || u.role === 'super') {
        io.to(u.id).emit('systemAlert', `🚩 بلاغ جديد: @${reporterName} أبلغ عن رسالة لـ @${reportedUser}`);
      }
    });
    socket.emit('systemAlert', 'تم استلام بلاغك بنجاح وسيقوم المشرفون بمراجعته فوراً 🛡️');
  });

  // Add Points Reward from Games & Activities
  socket.on('addPointsReward', ({ amount, reason }: { amount: number; reason: string }) => {
    const user = users.find((u) => u.id === socket.id);
    if (!user) return;
    const pointsToAdd = Math.min(Math.max(1, amount), 500);
    user.points = (user.points || 0) + pointsToAdd;
    if (registeredMembers[user.username]) {
      registeredMembers[user.username].points = user.points;
      saveMembers();
    }
    socket.emit('userPointsUpdated', { points: user.points, reason, added: pointsToAdd });
  });

  // Broadcast Mini-Game Win to Room
  socket.on('broadcastGameWin', ({ gameName, pointsWon }: { gameName: string; pointsWon: number }) => {
    const user = users.find((u) => u.id === socket.id);
    if (!user) return;
    const winMsg: StoredMessage = {
      id: `gamewin-${Date.now()}`,
      room: user.room,
      username: 'نظام الجوائز والمسابقات 🏆',
      badge: 'فوز مستحق',
      badgeColor: 'text-amber-500',
      text: `🎉 كفو! حقق الصقر [${user.username}] فوزاً في (${gameName}) وحصد [${pointsWon} نقطة] إضافية!`,
      time: getCurrentTimeString(),
      timestamp: Date.now()
    };
    chatHistory.push(winMsg);
    if (chatHistory.length > 500) chatHistory = chatHistory.slice(-500);
    saveHistory();
    io.to(user.room).emit('message', winMsg);
  });

  // Delete Private Message (حذف رسالة من الخاص)
  socket.on('deletePrivateMessage', ({ messageId, partnerId, partnerUsername }: { messageId: string; partnerId?: string; partnerUsername?: string }) => {
    socket.emit('privateMessageDeleted', { messageId });
    if (partnerId) {
      io.to(partnerId).emit('privateMessageDeleted', { messageId });
    }
    if (partnerUsername) {
      const partner = users.find((u) => u.username.toLowerCase() === partnerUsername.toLowerCase());
      if (partner && partner.id !== partnerId) {
        io.to(partner.id).emit('privateMessageDeleted', { messageId });
      }
    }
    socket.emit('systemAlert', 'تم حذف الرسالة الخاصة 🗑️');
  });

  // Edit Private Message (تعديل رسالة من الخاص)
  socket.on('editPrivateMessage', ({ messageId, newText, partnerId, partnerUsername }: { messageId: string; newText: string; partnerId?: string; partnerUsername?: string }) => {
    const user = users.find((u) => u.id === socket.id);
    if (!user || !newText?.trim()) return;
    const cleanText = sanitizeText(newText.trim());
    socket.emit('privateMessageEdited', { messageId, newText: cleanText, isEdited: true });
    if (partnerId) {
      io.to(partnerId).emit('privateMessageEdited', { messageId, newText: cleanText, isEdited: true });
    }
    if (partnerUsername) {
      const partner = users.find((u) => u.username.toLowerCase() === partnerUsername.toLowerCase());
      if (partner && partner.id !== partnerId) {
        io.to(partner.id).emit('privateMessageEdited', { messageId, newText: cleanText, isEdited: true });
      }
    }
    socket.emit('systemAlert', 'تم تعديل الرسالة الخاصة بنجاح ✏️');
  });

  // Reply to Admin Warning (الرد على التنبيه الإداري وكتابة يدوية)
  socket.on('replyToWarning', ({ toUsername, replyText }: { toUsername: string; replyText: string }) => {
    const sender = users.find((u) => u.id === socket.id);
    if (!sender || !replyText.trim()) return;

    logMonitorEvent(
      'security',
      `رد العضو [${sender.username}] على التنبيه الإداري من [${toUsername}]: "${replyText}"`,
      sender.username,
      toUsername
    );

    const adminUser = users.find((u) => u.username.toLowerCase() === toUsername.toLowerCase());
    if (adminUser) {
      io.to(adminUser.id).emit('warningReplyReceived', {
        from: sender.username,
        avatarUrl: sender.avatarUrl,
        flag: sender.flag,
        replyText: sanitizeText(replyText),
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      });
    }
    socket.emit('systemAlert', 'تم إرسال ردك وتوضيحك للإدارة بنجاح ✔️');
  });

  // Phone-to-Phone Direct Audio Packet Relay (إرسال واستقبال بث الصوت المباشر بين الهواتف)
  socket.on('voiceDataChunk', ({ chunk }: { chunk: string }) => {
    const user = users.find((u) => u.id === socket.id);
    if (!user || user.micSlot === null || user.isMuted) return;

    // Relay audio chunk to all other users in this room
    socket.to(user.room).emit('remoteVoiceChunk', {
      userId: user.id,
      username: user.username,
      micSlot: user.micSlot,
      chunk
    });
  });

  // Private Messages (المحادثات الخاصة الصوتية والكتابية مع مؤشرات القراءة والرسائل ذاتية الاختفاء)
  socket.on(
    'privateMessage',
    ({
      toId,
      text,
      mediaUrl,
      voiceNote,
      replyTo,
      selfDestructSeconds
    }: {
      toId: string;
      text?: string;
      mediaUrl?: string;
      voiceNote?: { audioUrl: string; duration: number };
      replyTo?: { id: string; username: string; text: string };
      selfDestructSeconds?: number;
    }) => {
      const sender = users.find((u) => u.id === socket.id);
      const recipient = users.find((u) => u.id === toId);
      const clean = sanitizeText(text);

      if (sender && sender.role !== 'admin' && sender.role !== 'super') {
        if (clean && likesSettings.pmTextLikes > 0 && sender.likes < likesSettings.pmTextLikes) {
          socket.emit('systemAlert', `عفواً، يتطلب إرسال الرسائل الخاصة ${likesSettings.pmTextLikes} لايك على الأقل. رصيدك الحالي: ${sender.likes} 👍`);
          return;
        }
        if ((mediaUrl || voiceNote) && likesSettings.pmMediaLikes > 0 && sender.likes < likesSettings.pmMediaLikes) {
          socket.emit('systemAlert', `عفواً، يتطلب إرسال الوسائط في الخاص ${likesSettings.pmMediaLikes} لايك على الأقل. رصيدك الحالي: ${sender.likes} 👍`);
          return;
        }
      }

      if (sender && recipient && (clean || mediaUrl || voiceNote)) {
        if (clean) {
          checkAndLogMonitoredWords(clean, sender, { type: 'pm', targetName: recipient.username });
        }

        const expandedPmText = clean ? expandShortcuts(clean) : '';
        const now = Date.now();
        const validSelfDestruct = typeof selfDestructSeconds === 'number' && selfDestructSeconds > 0 ? selfDestructSeconds : undefined;

        const safePmMediaUrl = ensureMediaUrlNotBase64(mediaUrl);
        let safePmVoiceNote = voiceNote;
        if (voiceNote?.audioUrl) {
          safePmVoiceNote = {
            ...voiceNote,
            audioUrl: ensureMediaUrlNotBase64(voiceNote.audioUrl) || voiceNote.audioUrl
          };
        }

        const pm: PrivateMessage = {
          id: `pm-${now}-${Math.random().toString(36).substring(2, 6)}`,
          fromId: sender.id,
          fromUsername: sender.username,
          fromAvatar: sender.avatarUrl,
          fromNameBannerUrl: sender.nameBannerUrl,
          toId: recipient.id,
          toUsername: recipient.username,
          toNameBannerUrl: recipient.nameBannerUrl,
          text: expandedPmText,
          mediaUrl: safePmMediaUrl,
          voiceNote: safePmVoiceNote,
          replyTo,
          time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
          timestamp: now,
          status: 'delivered', // Delivered to connected recipient
          selfDestructSeconds: validSelfDestruct,
          selfDestructAt: validSelfDestruct ? now + (validSelfDestruct * 1000) : undefined
        };

        socket.emit('newPrivateMessage', pm);
        if (toId !== socket.id) {
          io.to(toId).emit('newPrivateMessage', pm);
        }

        // Automatic Server-Side Fail-safe Self-Destruct Timer
        if (validSelfDestruct) {
          setTimeout(() => {
            io.to(sender.id).emit('privateMessageDeleted', { messageId: pm.id });
            if (recipient.id !== sender.id) {
              io.to(recipient.id).emit('privateMessageDeleted', { messageId: pm.id });
            }
          }, validSelfDestruct * 1000);
        }
      }
    }
  );

  // Mark Private Messages as Read (مؤشرات القراءة بالصحين الأزرقين)
  socket.on('markPrivateMessagesRead', ({ partnerUsername, partnerId }: { partnerUsername: string; partnerId?: string }) => {
    const user = users.find((u) => u.id === socket.id);
    if (!user) return;

    const partner = users.find(
      (u) =>
        (partnerUsername && u.username.toLowerCase() === partnerUsername.toLowerCase()) ||
        (partnerId && u.id === partnerId)
    );

    if (partner) {
      io.to(partner.id).emit('privateMessagesRead', {
        byUsername: user.username,
        readAt: Date.now()
      });
    }
  });

  // Like User Profile (مرة واحدة بالدقيقة لكل عضو - يعطيه لايك واحد +1 مع إشعار عائم)
  socket.on('likeUserProfile', ({ targetUsername }: { targetUsername: string }) => {
    const sender = users.find((u) => u.id === socket.id);
    if (!sender) return;

    if (!targetUsername || sender.username === targetUsername) {
      socket.emit('systemAlert', 'لا يمكنك إعطاء لايك لملفك الشخصي 🙂');
      return;
    }

    const target = users.find((u) => u.username === targetUsername);
    if (!target) {
      socket.emit('systemAlert', 'المستخدم غير متواجد حالياً.');
      return;
    }

    const cooldownKey = `${sender.id}_${target.username}`;
    const now = Date.now();
    const lastLikeTime = userLikeCooldownMap.get(cooldownKey) || 0;
    const cooldownDuration = 60 * 1000; // 60 seconds (مرة واحدة بالدقيقة)

    if (now - lastLikeTime < cooldownDuration) {
      const remainingSec = Math.ceil((cooldownDuration - (now - lastLikeTime)) / 1000);
      socket.emit('systemAlert', `⏳ يمكنك إعطاء لايك لهذا العضو مرة واحدة كل دقيقة (متبقي ${remainingSec} ثانية).`);
      return;
    }

    // Record timestamp
    userLikeCooldownMap.set(cooldownKey, now);

    // Increment target user likes by exactly 1
    target.likes = (target.likes || 0) + 1;

    // Persist in registeredMembers if exists
    if (registeredMembers[target.username]) {
      registeredMembers[target.username].likes = target.likes;
      saveMembers();
    }

    // Broadcast updated likes count to everyone
    io.emit('userLikesUpdated', {
      username: target.username,
      likes: target.likes
    });

    // Notify sender of success
    socket.emit('systemAlert', `أهديت إعجاباً ❤️ لـ [${target.username}]. رصيده الآن: ${target.likes} لايك 👍`);

    // Emit live floating like alert with sender avatar and name to the recipient
    io.to(target.id).emit('receivedProfileLike', {
      fromUsername: sender.username,
      fromAvatar: sender.avatarUrl || '',
      flag: sender.flag,
      likes: target.likes,
      timestamp: Date.now()
    });

    logMonitorEvent('likes', `أهدى [${sender.username}] لايك للملف الشخصي لـ [${target.username}] (المجموع: ${target.likes})`, sender.username, target.username);
  });

  // Private 1-on-1 Call Signaling (اتصال صوت وفيديو خاص)
  socket.on(
    'pmCallOffer',
    ({ toId, callType }: { toId: string; callType: 'audio' | 'video' }) => {
      const caller = users.find((u) => u.id === socket.id);
      const callee = users.find((u) => u.id === toId);

      if (!caller || !callee) {
        socket.emit('systemAlert', 'المستخدم غير متصل حالياً للاتصال به.');
        return;
      }

      if (caller.role !== 'admin' && caller.role !== 'super' && likesSettings.callLikes > 0 && caller.likes < likesSettings.callLikes) {
        socket.emit('systemAlert', `عفواً، تتطلب ميزة الاتصال الخاص ${likesSettings.callLikes} لايك على الأقل. رصيدك الحالي: ${caller.likes} 👍`);
        return;
      }

      const callId = `call-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      io.to(toId).emit('pmIncomingCall', {
        callId,
        fromUser: {
          id: caller.id,
          username: caller.username,
          avatarUrl: caller.avatarUrl,
          flag: caller.flag
        },
        callType
      });
    }
  );

  socket.on(
    'pmCallAnswer',
    ({ callId, toId, accepted }: { callId: string; toId: string; accepted: boolean }) => {
      const responder = users.find((u) => u.id === socket.id);
      if (accepted) {
        io.to(toId).emit('pmCallAccepted', { callId, responderId: socket.id });
      } else {
        io.to(toId).emit('pmCallRejected', {
          callId,
          reason: `${responder?.username || 'المستخدم'} رفض أو لم يستطع الرد على المكالمة.`
        });
      }
    }
  );

  socket.on(
    'pmCallSignal',
    ({ toId, data }: { toId: string; data: any }) => {
      io.to(toId).emit('pmCallSignal', { fromId: socket.id, data });
    }
  );

  socket.on(
    'pmCallEnd',
    ({ toId, duration, callType }: { toId: string; duration?: number; callType?: 'audio' | 'video' }) => {
      const sender = users.find((u) => u.id === socket.id);
      const recipient = users.find((u) => u.id === toId);

      io.to(toId).emit('pmCallEnded', { fromId: socket.id });
      socket.emit('pmCallEnded', { fromId: socket.id });

      if (sender && recipient) {
        const durationFormatted = duration && duration > 0 
          ? `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}` 
          : 'أقل من دقيقة';
        const notice: PrivateMessage = {
          id: `call-log-${Date.now()}`,
          fromId: sender.id,
          fromUsername: sender.username,
          fromAvatar: sender.avatarUrl,
          toId: recipient.id,
          toUsername: recipient.username,
          text: `📞 انتهت مكالمة ${callType === 'video' ? 'فيديو' : 'صوتية'} خاصة (${durationFormatted})`,
          isCallNotification: true,
          time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now()
        };
        socket.emit('newPrivateMessage', notice);
        if (toId !== socket.id) {
          io.to(toId).emit('newPrivateMessage', notice);
        }
      }
    }
  );

  // Add Room
  socket.on('createRoom', ({ name, desc, password }: { name: string; desc?: string; password?: string }) => {
    const admin = users.find((u) => u.id === socket.id);
    if (!admin || (admin.role !== 'admin' && admin.role !== 'super')) return;

    const cleanName = sanitizeText(name);
    if (!cleanName) return;

    const newRoom: ChatRoom = {
      id: cleanName,
      name: `Room | ${cleanName}`,
      desc: sanitizeText(desc) || 'غرفة جديدة في حسان برو',
      isPasswordProtected: !!password,
      password: password || undefined,
      voiceLimit: 30,
      activeVoiceCount: 0
    };

    chatRooms.push(newRoom);
    io.emit('roomsUpdated', chatRooms);
    socket.emit('systemAlert', `تم إنشاء غرفة [${cleanName}] بنجاح!`);
  });

  // Monitor logs fetch & clear
  socket.on('getMonitorLogs', () => {
    socket.emit('monitorLogs', monitorLogs);
    socket.emit('monitoredWordsUpdated', monitoredWords);
  });

  socket.on('getMonitoredWords', () => {
    socket.emit('monitoredWordsUpdated', monitoredWords);
  });

  socket.on('addMonitoredWord', ({ word }: { word: string }) => {
    const admin = users.find((u) => u.id === socket.id);
    if (!admin || (admin.role !== 'admin' && admin.role !== 'super')) {
      socket.emit('systemAlert', 'عفواً، التحكم بكلمات الفلتر متاح للإدارة فقط.');
      return;
    }
    const cleanWord = sanitizeText(word?.trim());
    if (cleanWord && !monitoredWords.includes(cleanWord)) {
      monitoredWords.push(cleanWord);
      saveMonitoredWords();
      io.emit('monitoredWordsUpdated', monitoredWords);
      logMonitorEvent('role', `أضاف [${admin.username}] الكلمة [${cleanWord}] إلى فلتر المراقبة`, admin.username);
      socket.emit('systemAlert', `تمت إضافة الكلمة [${cleanWord}] إلى فلتر المراقبة.`);
    }
  });

  socket.on('removeMonitoredWord', ({ word }: { word: string }) => {
    const admin = users.find((u) => u.id === socket.id);
    if (!admin || (admin.role !== 'admin' && admin.role !== 'super')) {
      socket.emit('systemAlert', 'عفواً، التحكم بكلمات الفلتر متاح للإدارة فقط.');
      return;
    }
    monitoredWords = monitoredWords.filter((w) => w !== word);
    saveMonitoredWords();
    io.emit('monitoredWordsUpdated', monitoredWords);
    logMonitorEvent('role', `حذف [${admin.username}] الكلمة [${word}] من فلتر المراقبة`, admin.username);
    socket.emit('systemAlert', `تم حذف الكلمة [${word}] من فلتر المراقبة.`);
  });

  socket.on('clearMonitorLogs', () => {
    const admin = users.find((u) => u.id === socket.id);
    if (!admin || (admin.role !== 'admin' && admin.role !== 'super')) {
      socket.emit('systemAlert', 'عفواً، صلاحية حذف وإفراغ السجل الإداري محصورة بمدير النظام (Admin/Super) فقط.');
      return;
    }
    monitorLogs = [];
    saveAuditLogs();
    io.emit('monitorLogs', monitorLogs);
    logMonitorEvent('role', `قام ${admin.username} بحذف وإفراغ سجل المراقبة كاملاً بطلب يدوي صريح`, admin.username);
    socket.emit('systemAlert', 'تم حذف وإفراغ السجل الإداري كاملاً من قاعدة البيانات بنجاح 🗑️');
  });

  // =========================================================================
  // PROFILE VISITORS SYSTEM (زائري ملفي الشخصي - يظهر الاسم والصورة وعدد المرات)
  // =========================================================================
  socket.on('recordProfileVisit', ({ targetUsername }: { targetUsername: string }) => {
    const visitor = users.find((u) => u.id === socket.id);
    if (!visitor || !targetUsername) return;
    if (visitor.username.toLowerCase() === targetUsername.toLowerCase()) return; // Don't count self visits

    const targetMember = registeredMembers[targetUsername];
    if (!targetMember) return;

    if (!Array.isArray(targetMember.visitors)) {
      targetMember.visitors = [];
    }

    const existingIndex = targetMember.visitors.findIndex(
      (v) => v.username.toLowerCase() === visitor.username.toLowerCase()
    );

    if (existingIndex !== -1) {
      targetMember.visitors[existingIndex].visitCount = (targetMember.visitors[existingIndex].visitCount || 0) + 1;
      targetMember.visitors[existingIndex].lastVisitTime = Date.now();
      targetMember.visitors[existingIndex].avatarUrl = visitor.avatarUrl;
      targetMember.visitors[existingIndex].flag = visitor.flag;
      // Move to top of visitors list
      const [item] = targetMember.visitors.splice(existingIndex, 1);
      targetMember.visitors.unshift(item);
    } else {
      targetMember.visitors.unshift({
        username: visitor.username,
        avatarUrl: visitor.avatarUrl,
        flag: visitor.flag,
        visitCount: 1,
        lastVisitTime: Date.now()
      });
    }

    if (targetMember.visitors.length > 50) {
      targetMember.visitors = targetMember.visitors.slice(0, 50);
    }

    saveMembers();

    // If target user is online, emit real-time update and gentle notification
    const targetUser = users.find((u) => u.username.toLowerCase() === targetUsername.toLowerCase());
    if (targetUser) {
      io.to(targetUser.id).emit('profileVisitorsUpdated', targetMember.visitors);
      io.to(targetUser.id).emit('profileVisitedAlert', {
        visitorUsername: visitor.username,
        visitorAvatar: visitor.avatarUrl,
        visitCount: targetMember.visitors[0].visitCount,
        time: Date.now()
      });
    }
  });

  socket.on('getProfileVisitors', () => {
    const user = users.find((u) => u.id === socket.id);
    if (!user) return;
    const visitors = registeredMembers[user.username]?.visitors || [];
    socket.emit('profileVisitorsUpdated', visitors);
  });

  // =========================================================================
  // LIVE VIDEO & AUDIO BROADCAST SYSTEM (بث مباشر فيديو وصوت حقيقي للغرفة)
  // =========================================================================
  socket.on('startLiveBroadcast', ({ room, title }: { room: string; title?: string }) => {
    const user = users.find((u) => u.id === socket.id);
    if (!user) return;

    const targetRoom = room || user.room || 'الغرفة العامة';
    const broadcast: RoomLiveBroadcast = {
      broadcasterId: socket.id,
      broadcasterUsername: user.username,
      broadcasterAvatar: user.avatarUrl,
      broadcasterFlag: user.flag,
      room: targetRoom,
      title: title || `بث مباشر 🔴 ${user.username}`,
      startedAt: Date.now(),
      viewers: []
    };

    activeLiveBroadcasts.set(targetRoom, broadcast);
    io.to(targetRoom).emit('liveBroadcastStarted', {
      broadcasterId: socket.id,
      broadcasterUsername: user.username,
      broadcasterAvatar: user.avatarUrl,
      broadcasterFlag: user.flag,
      room: targetRoom,
      title: broadcast.title,
      startedAt: broadcast.startedAt,
      viewersCount: 0
    });

    logMonitorEvent('role', `بدأ [${user.username}] بثاً لايف مباشر (فيديو وصوت) في غرفة [${targetRoom}]`, user.username);
  });

  socket.on('endLiveBroadcast', ({ room }: { room: string }) => {
    const user = users.find((u) => u.id === socket.id);
    const targetRoom = room || (user ? user.room : 'الغرفة العامة');
    const broadcast = activeLiveBroadcasts.get(targetRoom);
    if (broadcast && (broadcast.broadcasterId === socket.id || (user && (user.role === 'admin' || user.role === 'super')))) {
      activeLiveBroadcasts.delete(targetRoom);
      io.to(targetRoom).emit('liveBroadcastEnded', { room: targetRoom, broadcasterUsername: broadcast.broadcasterUsername });
    }
  });

  socket.on('getLiveBroadcast', ({ room }: { room: string }) => {
    const targetRoom = room || 'الغرفة العامة';
    const broadcast = activeLiveBroadcasts.get(targetRoom);
    if (broadcast) {
      socket.emit('currentLiveBroadcast', {
        broadcasterId: broadcast.broadcasterId,
        broadcasterUsername: broadcast.broadcasterUsername,
        broadcasterAvatar: broadcast.broadcasterAvatar,
        broadcasterFlag: broadcast.broadcasterFlag,
        room: broadcast.room,
        title: broadcast.title,
        startedAt: broadcast.startedAt,
        viewersCount: broadcast.viewers.length
      });
    } else {
      socket.emit('currentLiveBroadcast', null);
    }
  });

  socket.on('joinLiveViewer', ({ room }: { room: string }) => {
    const targetRoom = room || 'الغرفة العامة';
    const broadcast = activeLiveBroadcasts.get(targetRoom);
    if (broadcast) {
      if (!broadcast.viewers.includes(socket.id)) {
        broadcast.viewers.push(socket.id);
      }
      io.to(targetRoom).emit('liveViewerCountUpdated', { room: targetRoom, count: broadcast.viewers.length });
    }
  });

  socket.on('leaveLiveViewer', ({ room }: { room: string }) => {
    const targetRoom = room || 'الغرفة العامة';
    const broadcast = activeLiveBroadcasts.get(targetRoom);
    if (broadcast) {
      broadcast.viewers = broadcast.viewers.filter((id) => id !== socket.id);
      io.to(targetRoom).emit('liveViewerCountUpdated', { room: targetRoom, count: broadcast.viewers.length });
    }
  });

  socket.on('liveSignal', ({ targetId, signal }: { targetId: string; signal: any }) => {
    const sender = users.find((u) => u.id === socket.id);
    io.to(targetId).emit('liveSignal', { senderId: socket.id, senderUsername: sender?.username || 'المستخدم', signal });
  });

  socket.on('liveVideoFrame', ({ room, frameData }: { room: string; frameData: string }) => {
    const sender = users.find((u) => u.id === socket.id);
    if (!sender) return;
    socket.to(room).emit('liveVideoFrame', { broadcasterUsername: sender.username, frameData });
  });

  socket.on('liveReaction', ({ room, emoji }: { room: string; emoji: string }) => {
    const user = users.find((u) => u.id === socket.id);
    io.to(room).emit('liveReactionReceived', { emoji, username: user?.username || 'عضو' });
  });

  // Disconnect handler: Preserves presence across phone screen locks & background sleep
  socket.on('disconnect', () => {
    const disconnectedUser = users.find((u) => u.id === socket.id);
    if (disconnectedUser && disconnectedUser.room && disconnectedUser.room !== 'خارج الغرف') {
      socket.to(disconnectedUser.room).emit('userTyping', {
        userId: disconnectedUser.id,
        username: disconnectedUser.username,
        room: disconnectedUser.room,
        isTyping: false,
        timestamp: Date.now()
      });
    }

    let session: UserSession | undefined;
    for (const s of activeSessions.values()) {
      if (s.currentSocketId === socket.id) {
        session = s;
        break;
      }
    }

    // Only purge user if they EXPLICITLY triggered logout
    if (session && session.isExplicitlyLoggedOut) {
      const index = users.findIndex((u) => u.id === socket.id || u.username.toLowerCase() === session!.user.username.toLowerCase());
      if (index !== -1) {
        const user = users.splice(index, 1)[0];

        if (user.micSlot !== null) {
          const slots = getMicSlotsForRoom(user.room);
          const slot = slots.find((s) => s.slotNumber === user.micSlot);
          if (slot) slot.user = null;
          io.to(user.room).emit('micSlotsUpdated', slots);
        }

        logMonitorEvent('leave', `سجل ${user.username} خروجاً رسمياً من الدردشة`, user.username);

        if (user.isVoice) {
          io.to(user.room).emit('userLeftVoice', { userId: socket.id, username: user.username });
        }

        chatRooms.forEach((r) => {
          io.to(r.id).emit('roomUsers', {
            room: r.id,
            users: users.filter((u) => u.room === r.id)
          });
        });
        io.emit('onlineCountUpdated', users.length);
        io.emit('allUsers', users);
        io.emit('allRegisteredMembers', getAllRegisteredMembersPayload());
        io.emit('roomStatsUpdated', getRoomStatistics());
      }
      if (session?.user?.username) {
        const uLower = session.user.username.toLowerCase();
        if (pendingAwayTimers.has(uLower)) {
          clearTimeout(pendingAwayTimers.get(uLower)!);
          pendingAwayTimers.delete(uLower);
        }
      }
      activeSessions.delete(session.sessionToken);
      usernameToSessionMap.delete(session.user.username.toLowerCase());
      return;
    }

    // Temporary disconnect / background app switch / screen lock:
    // Keep user session 100% active and connected without disconnection.
    // The presence mark remains green (online) for 2 full minutes, then transitions to yellow (away).
    const user = users.find((u) => u.id === socket.id);
    if (user) {
      user.isSpeaking = false;
      user.lastActiveTime = Date.now();
      const uName = user.username;
      const disconnectedSocketId = socket.id;

      // Keep user as 'online' (green mark) for 5 minutes before marking 'away' (yellow mark)
      if (pendingAwayTimers.has(uName.toLowerCase())) {
        clearTimeout(pendingAwayTimers.get(uName.toLowerCase())!);
      }

      const awayTimer = setTimeout(() => {
        pendingAwayTimers.delete(uName.toLowerCase());
        const currentU = users.find((u) => u.username.toLowerCase() === uName.toLowerCase());
        // Transition to yellow (away) only if user has not reconnected with a new socket
        if (currentU && (currentU.id === disconnectedSocketId || currentU.presenceState !== 'offline')) {
          currentU.presenceState = 'away';
          io.emit('userPresenceUpdated', { userId: currentU.id, username: currentU.username, state: 'away' });
        }
      }, 45000); // 45 seconds (45 ثانية عند انقطاع الاتصال)

      pendingAwayTimers.set(uName.toLowerCase(), awayTimer);

      // Grace period for mic preservation on momentary disconnect / tab switch (45 seconds)
      if (user.micSlot !== null) {
        const slotRoom = user.room;
        const slotNum = user.micSlot;

        setTimeout(() => {
          // Check if user reconnected with a new socket ID
          const currentU = users.find((u) => u.username.toLowerCase() === uName.toLowerCase());
          if (!currentU || currentU.id === disconnectedSocketId || currentU.presenceState === 'offline') {
            // Still not reconnected after 45s: safely free the mic slot
            if (currentU) {
              currentU.micSlot = null;
              currentU.isVoice = false;
            }
            const slots = getMicSlotsForRoom(slotRoom);
            const slot = slots.find((s) => s.slotNumber === slotNum);
            if (slot && (!slot.user || slot.user.id === disconnectedSocketId)) {
              slot.user = null;
              io.to(slotRoom).emit('micSlotsUpdated', slots);
              io.to(slotRoom).emit('userLeftVoice', { userId: disconnectedSocketId, username: uName, slotNumber: slotNum });
            }
          }
        }, 45000);
      }
    }

    if (session) {
      session.lastActiveTime = Date.now();
      session.user.isSpeaking = false;
    }

    // Clean up active live broadcast if this socket was broadcaster or viewer
    for (const [rId, live] of activeLiveBroadcasts.entries()) {
      if (live.broadcasterId === socket.id) {
        activeLiveBroadcasts.delete(rId);
        io.to(rId).emit('liveBroadcastEnded', { room: rId, broadcasterUsername: live.broadcasterUsername });
      } else if (live.viewers.includes(socket.id)) {
        live.viewers = live.viewers.filter((id) => id !== socket.id);
        io.to(rId).emit('liveViewerCountUpdated', { room: rId, count: live.viewers.length });
      }
    }

    // Real-time online count update to all connected clients
    const realCountAfter = users.length;
    io.emit('onlineCountUpdated', realCountAfter);
  });
});

// Periodic check: Removes sessions only after the 1-hour grace period has fully expired
setInterval(() => {
  const oneHourAgo = Date.now() - 3600 * 1000;
  let changed = false;

  for (const [token, session] of activeSessions.entries()) {
    const socketConnected = io.sockets.sockets.get(session.currentSocketId)?.connected;
    if (!socketConnected && session.lastActiveTime < oneHourAgo) {
      const uIdx = users.findIndex((u) => u.username.toLowerCase() === session.user.username.toLowerCase());
      if (uIdx !== -1) {
        const removed = users.splice(uIdx, 1)[0];
        if (removed.micSlot !== null) {
          const slots = getMicSlotsForRoom(removed.room);
          const slot = slots.find((s) => s.slotNumber === removed.micSlot);
          if (slot) slot.user = null;
          io.to(removed.room).emit('micSlotsUpdated', slots);
        }
        io.to(removed.room).emit('roomUsers', {
          room: removed.room,
          users: users.filter((u) => u.room === removed.room)
        });
        changed = true;
      }
      activeSessions.delete(token);
      usernameToSessionMap.delete(session.user.username.toLowerCase());
    }
  }

  if (changed) {
    io.emit('onlineCountUpdated', users.length);
  }
}, 60000);

// REST API & Health Check Endpoints
app.get(['/health', '/api/health'], (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: Math.floor(process.uptime()),
    timestamp: Date.now(),
    onlineUsers: users.length,
    activeRooms: chatRooms.length,
    version: '1.0.0'
  });
});

app.get('/api/stats', (_req, res) => {
  res.json({
    onlineUsers: users.length,
    activeRooms: chatRooms.length,
    totalMessages: chatHistory.length
  });
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const port = Number(process.env.PORT) || 3000;
  const isHmrDisabled = process.env.DISABLE_HMR === 'true';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled
          ? false
          : {
              server: httpServer
            }
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath, { maxAge: '1d', index: false }));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      console.warn('⚠️ [Production Warning] dist/ folder not found. Falling back to dynamic Vite dev server so the app runs smoothly!');
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: isHmrDisabled
            ? false
            : {
                server: httpServer
              }
        },
        appType: 'spa'
      });
      app.use(vite.middlewares);
    }
  }

  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`🚀 ProChat Hassan Server running on http://localhost:${port}`);
  });

  const handleShutdown = () => {
    try {
      io.close();
      httpServer.close();
    } catch {}
    process.exit(0);
  };

  process.on('SIGTERM', handleShutdown);
  process.on('SIGINT', handleShutdown);
}

// Process-level resilience against crashes on hosting platforms
process.on('uncaughtException', (err) => {
  console.error('⚠️ Trapped Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Trapped Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
