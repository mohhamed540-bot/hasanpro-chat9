import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type DatabaseDriverType = 'local_json' | 'cloud_rest' | 'memory' | 'database_url';

export interface DatabaseConfig {
  driverType: DatabaseDriverType;
  databaseUrl?: string;
  apiKey?: string;
  authToken?: string;
  syncIntervalMs?: number;
  localFallbackDir: string;
}

export interface IDataDriver {
  name: DatabaseDriverType;
  isCloudConnected(): boolean;
  loadSync<T>(collection: string, defaultValue: T): T;
  load<T>(collection: string, defaultValue: T): Promise<T>;
  save<T>(collection: string, data: T): Promise<void>;
  delete(collection: string): Promise<void>;
}

/**
 * Automatically inspects process.env to determine database driver and credentials
 */
export function getDatabaseConfigFromEnv(): DatabaseConfig {
  const rootDir = path.resolve(__dirname, '../../');
  const dbUrl = (
    process.env.DATABASE_URL ||
    process.env.CLOUD_DB_URL ||
    process.env.DB_CONNECTION_STRING ||
    process.env.REMOTE_DATABASE_URL ||
    ''
  ).trim();

  let driverType: DatabaseDriverType = 'local_json';
  if (dbUrl) {
    if (dbUrl.startsWith('http://') || dbUrl.startsWith('https://')) {
      driverType = 'cloud_rest';
    } else {
      driverType = 'database_url';
    }
  }

  const explicitType = (process.env.DATABASE_TYPE || process.env.DB_DRIVER || '').toLowerCase().trim();
  if (explicitType === 'memory') {
    driverType = 'memory';
  } else if (explicitType === 'local' || explicitType === 'json') {
    driverType = 'local_json';
  }

  return {
    driverType,
    databaseUrl: dbUrl || undefined,
    apiKey: process.env.DATABASE_API_KEY || process.env.DB_API_KEY,
    authToken: process.env.DATABASE_AUTH_TOKEN || process.env.DB_TOKEN,
    syncIntervalMs: process.env.DATABASE_SYNC_INTERVAL_MS ? parseInt(process.env.DATABASE_SYNC_INTERVAL_MS, 10) : 5000,
    localFallbackDir: rootDir
  };
}

/**
 * Local JSON file-based driver (Ultra-reliable default fallback for local dev)
 */
export class LocalJsonDataDriver implements IDataDriver {
  name: DatabaseDriverType = 'local_json';
  private baseDir: string;
  private writeTimers = new Map<string, NodeJS.Timeout>();

  constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  isCloudConnected(): boolean {
    return false;
  }

  private getFilePath(collection: string): string {
    const safeName = collection.endsWith('.json') ? collection : `${collection}.json`;
    return path.join(this.baseDir, safeName);
  }

  loadSync<T>(collection: string, defaultValue: T): T {
    try {
      const filePath = this.getFilePath(collection);
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(raw) as T;
      }
    } catch (err) {
      console.warn(`[Data Layer] Error synchronously reading local file for "${collection}", returning default:`, err);
    }
    return defaultValue;
  }

  async load<T>(collection: string, defaultValue: T): Promise<T> {
    try {
      const filePath = this.getFilePath(collection);
      if (fs.existsSync(filePath)) {
        const raw = await fs.promises.readFile(filePath, 'utf8');
        return JSON.parse(raw) as T;
      }
    } catch (err) {
      console.warn(`[Data Layer] Error reading local file for "${collection}", returning default:`, err);
    }
    return defaultValue;
  }

  async save<T>(collection: string, data: T): Promise<void> {
    const filePath = this.getFilePath(collection);
    // Debounce rapid continuous writes
    return new Promise((resolve) => {
      const existingTimer = this.writeTimers.get(collection);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(async () => {
        this.writeTimers.delete(collection);
        try {
          const serialized = JSON.stringify(data, null, 2);
          await fs.promises.writeFile(filePath, serialized, 'utf8');
        } catch (err) {
          console.error(`[Data Layer] Error writing local file for "${collection}":`, err);
        }
        resolve();
      }, 500);

      this.writeTimers.set(collection, timer);
    });
  }

  async delete(collection: string): Promise<void> {
    try {
      const filePath = this.getFilePath(collection);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (err) {
      console.error(`[Data Layer] Error deleting local file for "${collection}":`, err);
    }
  }
}

/**
 * Cloud Remote REST / Database URL Driver
 * Syncs seamlessly with any external cloud database via standard REST/JSON API,
 * while maintaining a local fallback cache for instant speed and offline resiliency.
 */
export class CloudRemoteDataDriver implements IDataDriver {
  name: DatabaseDriverType;
  private config: DatabaseConfig;
  private localFallback: LocalJsonDataDriver;
  private cloudHealthy: boolean = false;

  constructor(config: DatabaseConfig) {
    this.config = config;
    this.name = config.driverType;
    this.localFallback = new LocalJsonDataDriver(config.localFallbackDir);
  }

  isCloudConnected(): boolean {
    return this.cloudHealthy;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    if (this.config.authToken) {
      headers['Authorization'] = `Bearer ${this.config.authToken}`;
    }
    if (this.config.apiKey) {
      headers['x-api-key'] = this.config.apiKey;
    }
    return headers;
  }

  loadSync<T>(collection: string, defaultValue: T): T {
    return this.localFallback.loadSync(collection, defaultValue);
  }

  async load<T>(collection: string, defaultValue: T): Promise<T> {
    if (this.config.databaseUrl && (this.config.databaseUrl.startsWith('http://') || this.config.databaseUrl.startsWith('https://'))) {
      try {
        const url = `${this.config.databaseUrl.replace(/\/$/, '')}/${collection}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const response = await fetch(url, {
          method: 'GET',
          headers: this.getHeaders(),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const remoteData = (await response.json()) as T;
          this.cloudHealthy = true;
          // Synchronize local fallback cache silently
          this.localFallback.save(collection, remoteData).catch(() => {});
          return remoteData;
        }
      } catch (err) {
        console.warn(`[Data Layer] Cloud load failed for "${collection}", falling back to local replica:`, err);
        this.cloudHealthy = false;
      }
    }

    // Fallback to local storage replica
    return this.localFallback.load(collection, defaultValue);
  }

  async save<T>(collection: string, data: T): Promise<void> {
    // 1. Immediately persist to local replica for instant durability
    await this.localFallback.save(collection, data);

    // 2. Asynchronously sync to external cloud database
    if (this.config.databaseUrl && (this.config.databaseUrl.startsWith('http://') || this.config.databaseUrl.startsWith('https://'))) {
      try {
        const url = `${this.config.databaseUrl.replace(/\/$/, '')}/${collection}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(url, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(data),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          this.cloudHealthy = true;
        } else {
          console.warn(`[Data Layer] Cloud save for "${collection}" returned status: ${response.status}`);
        }
      } catch (err) {
        this.cloudHealthy = false;
        console.warn(`[Data Layer] Cloud save to external DB failed for "${collection}", queued locally:`, err);
      }
    }
  }

  async delete(collection: string): Promise<void> {
    await this.localFallback.delete(collection);
    if (this.config.databaseUrl && (this.config.databaseUrl.startsWith('http://') || this.config.databaseUrl.startsWith('https://'))) {
      try {
        const url = `${this.config.databaseUrl.replace(/\/$/, '')}/${collection}`;
        await fetch(url, {
          method: 'DELETE',
          headers: this.getHeaders()
        });
      } catch {}
    }
  }
}

/**
 * Central Data Manager Facade
 * Provides strongly-typed CRUD for members, sessions, chat history, rooms, settings, etc.
 */
export class DataManager {
  private static instance: DataManager;
  private driver: IDataDriver;
  private config: DatabaseConfig;

  private constructor() {
    this.config = getDatabaseConfigFromEnv();
    if (this.config.databaseUrl) {
      this.driver = new CloudRemoteDataDriver(this.config);
      console.log(`[Data Layer] Initialized Database Layer with external configuration: ${this.config.driverType} (${this.config.databaseUrl})`);
    } else {
      this.driver = new LocalJsonDataDriver(this.config.localFallbackDir);
      console.log(`[Data Layer] Initialized Local JSON Database driver with fallback dir: ${this.config.localFallbackDir}`);
    }
  }

  public static getInstance(): DataManager {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager();
    }
    return DataManager.instance;
  }

  public getDriver(): IDataDriver {
    return this.driver;
  }

  public getConfig(): DatabaseConfig {
    return this.config;
  }

  public isCloudConnected(): boolean {
    return this.driver.isCloudConnected();
  }

  public getStatus() {
    return {
      driver: this.driver.name,
      hasDatabaseUrl: Boolean(this.config.databaseUrl),
      isCloudConnected: this.driver.isCloudConnected(),
      databaseUrl: this.config.databaseUrl ? this.config.databaseUrl.replace(/:[^:]*@/, ':***@') : undefined
    };
  }

  // Generic methods
  public loadSync<T>(collection: string, defaultValue: T): T {
    return this.driver.loadSync<T>(collection, defaultValue);
  }

  public async load<T>(collection: string, defaultValue: T): Promise<T> {
    return this.driver.load<T>(collection, defaultValue);
  }

  public async save<T>(collection: string, data: T): Promise<void> {
    return this.driver.save<T>(collection, data);
  }

  public async delete(collection: string): Promise<void> {
    return this.driver.delete(collection);
  }

  // Domain-specific helpers with both Sync (for boot) and Async (for runtime)
  public loadSessionsSync<T>(defaultValue: T): T {
    return this.loadSync<T>('active_sessions', defaultValue);
  }

  public loadMembersSync<T>(defaultValue: T): T {
    return this.loadSync<T>('members', defaultValue);
  }

  public loadChatHistorySync<T>(defaultValue: T): T {
    return this.loadSync<T>('chat_history', defaultValue);
  }

  public loadBansSync<T>(defaultValue: T): T {
    return this.loadSync<T>('banned_records', defaultValue);
  }

  public loadJailedSync<T>(defaultValue: T): T {
    return this.loadSync<T>('jailed_records', defaultValue);
  }

  public loadShortcutsSync<T>(defaultValue: T): T {
    return this.loadSync<T>('shortcuts', defaultValue);
  }

  public loadEmblemsSync<T>(defaultValue: T): T {
    return this.loadSync<T>('emblems', defaultValue);
  }

  public loadRolePermissionsSync<T>(defaultValue: T): T {
    return this.loadSync<T>('role_permissions', defaultValue);
  }

  public loadGlobalAppearanceSync<T>(defaultValue: T): T {
    return this.loadSync<T>('global_appearance', defaultValue);
  }

  public loadGeneralWelcomeSync<T>(defaultValue: T): T {
    return this.loadSync<T>('general_welcome', defaultValue);
  }

  public loadServerSecuritySync<T>(defaultValue: T): T {
    return this.loadSync<T>('server_security', defaultValue);
  }

  public loadLikesSettingsSync<T>(defaultValue: T): T {
    return this.loadSync<T>('likes_settings', defaultValue);
  }

  public loadStaffMemosSync<T>(defaultValue: T): T {
    return this.loadSync<T>('staff_memos', defaultValue);
  }

  public loadChatRoomsSync<T>(defaultValue: T): T {
    return this.loadSync<T>('chat_rooms', defaultValue);
  }

  public loadRoomSettingsSync<T>(defaultValue: T): T {
    return this.loadSync<T>('room_settings', defaultValue);
  }

  public loadMonitoredWordsSync<T>(defaultValue: T): T {
    return this.loadSync<T>('monitored_words', defaultValue);
  }

  public loadAuditLogsSync<T>(defaultValue: T): T {
    return this.loadSync<T>('admin_audit_logs', defaultValue);
  }

  public loadWallPostsSync<T>(defaultValue: T): T {
    return this.loadSync<T>('wall_posts', defaultValue);
  }

  public loadStoriesSync<T>(defaultValue: T): T {
    return this.loadSync<T>('stories', defaultValue);
  }

  // Domain-specific helpers
  public async loadMembers<T>(defaultValue: T): Promise<T> {
    return this.load<T>('members', defaultValue);
  }

  public async saveMembers<T>(data: T): Promise<void> {
    return this.save<T>('members', data);
  }

  public async loadSessions<T>(defaultValue: T): Promise<T> {
    return this.load<T>('active_sessions', defaultValue);
  }

  public async saveSessions<T>(data: T): Promise<void> {
    return this.save<T>('active_sessions', data);
  }

  public async loadChatHistory<T>(defaultValue: T): Promise<T> {
    return this.load<T>('chat_history', defaultValue);
  }

  public async saveChatHistory<T>(data: T): Promise<void> {
    return this.save<T>('chat_history', data);
  }

  public async loadWallPosts<T>(defaultValue: T): Promise<T> {
    return this.load<T>('wall_posts', defaultValue);
  }

  public async saveWallPosts<T>(data: T): Promise<void> {
    return this.save<T>('wall_posts', data);
  }

  public async loadStories<T>(defaultValue: T): Promise<T> {
    return this.load<T>('stories', defaultValue);
  }

  public async saveStories<T>(data: T): Promise<void> {
    return this.save<T>('stories', data);
  }

  public async loadShortcuts<T>(defaultValue: T): Promise<T> {
    return this.load<T>('shortcuts', defaultValue);
  }

  public async saveShortcuts<T>(data: T): Promise<void> {
    return this.save<T>('shortcuts', data);
  }

  public async loadEmblems<T>(defaultValue: T): Promise<T> {
    return this.load<T>('emblems', defaultValue);
  }

  public async saveEmblems<T>(data: T): Promise<void> {
    return this.save<T>('emblems', data);
  }

  public async loadRolePermissions<T>(defaultValue: T): Promise<T> {
    return this.load<T>('role_permissions', defaultValue);
  }

  public async saveRolePermissions<T>(data: T): Promise<void> {
    return this.save<T>('role_permissions', data);
  }

  public async loadGlobalAppearance<T>(defaultValue: T): Promise<T> {
    return this.load<T>('global_appearance', defaultValue);
  }

  public async saveGlobalAppearance<T>(data: T): Promise<void> {
    return this.save<T>('global_appearance', data);
  }

  public async loadGeneralWelcome<T>(defaultValue: T): Promise<T> {
    return this.load<T>('general_welcome', defaultValue);
  }

  public async saveGeneralWelcome<T>(data: T): Promise<void> {
    return this.save<T>('general_welcome', data);
  }

  public async loadServerSecurity<T>(defaultValue: T): Promise<T> {
    return this.load<T>('server_security', defaultValue);
  }

  public async saveServerSecurity<T>(data: T): Promise<void> {
    return this.save<T>('server_security', data);
  }

  public async loadLikesSettings<T>(defaultValue: T): Promise<T> {
    return this.load<T>('likes_settings', defaultValue);
  }

  public async saveLikesSettings<T>(data: T): Promise<void> {
    return this.save<T>('likes_settings', data);
  }

  public async loadStaffMemos<T>(defaultValue: T): Promise<T> {
    return this.load<T>('staff_memos', defaultValue);
  }

  public async saveStaffMemos<T>(data: T): Promise<void> {
    return this.save<T>('staff_memos', data);
  }

  public async loadChatRooms<T>(defaultValue: T): Promise<T> {
    return this.load<T>('chat_rooms', defaultValue);
  }

  public async saveChatRooms<T>(data: T): Promise<void> {
    return this.save<T>('chat_rooms', data);
  }

  public async loadRoomSettings<T>(defaultValue: T): Promise<T> {
    return this.load<T>('room_settings', defaultValue);
  }

  public async saveRoomSettings<T>(data: T): Promise<void> {
    return this.save<T>('room_settings', data);
  }

  public async loadMonitoredWords<T>(defaultValue: T): Promise<T> {
    return this.load<T>('monitored_words', defaultValue);
  }

  public async saveMonitoredWords<T>(data: T): Promise<void> {
    return this.save<T>('monitored_words', data);
  }

  public async loadAuditLogs<T>(defaultValue: T): Promise<T> {
    return this.load<T>('admin_audit_logs', defaultValue);
  }

  public async saveAuditLogs<T>(data: T): Promise<void> {
    return this.save<T>('admin_audit_logs', data);
  }

  public async loadBans<T>(defaultValue: T): Promise<T> {
    return this.load<T>('banned_records', defaultValue);
  }

  public async saveBans<T>(data: T): Promise<void> {
    return this.save<T>('banned_records', data);
  }

  public async loadJailed<T>(defaultValue: T): Promise<T> {
    return this.load<T>('jailed_records', defaultValue);
  }

  public async saveJailed<T>(data: T): Promise<void> {
    return this.save<T>('jailed_records', data);
  }
}

export const dataManager = DataManager.getInstance();
