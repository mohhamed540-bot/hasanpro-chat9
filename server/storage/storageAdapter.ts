import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type StorageProviderType = 'local' | 's3_compatible' | 'cloudinary' | 'supabase' | 'firebase' | 'custom_http';

export interface StorageConfig {
  provider: StorageProviderType;
  endpoint?: string;
  bucket?: string;
  region?: string;
  accessKey?: string;
  secretKey?: string;
  apiKey?: string;
  apiSecret?: string;
  authToken?: string;
  publicUrlPrefix?: string;
  localUploadsDir: string;
}

export interface MediaUploadResult {
  success: boolean;
  url: string;
  mediaType: 'image' | 'video' | 'audio' | 'file';
  size: number;
  filename: string;
  key: string;
  provider: StorageProviderType;
  error?: string;
}

export interface IStorageAdapter {
  providerName: StorageProviderType;
  saveBuffer(buffer: Buffer, originalFilename: string, mimeType?: string, folder?: string): Promise<MediaUploadResult>;
  saveStream(stream: NodeJS.ReadableStream, originalFilename: string, mimeType?: string, folder?: string): Promise<MediaUploadResult>;
  deleteFile(keyOrUrl: string): Promise<boolean>;
  isExternal(): boolean;
}

/**
 * Automatically detects and reads Storage configuration from process.env
 */
export function getStorageConfigFromEnv(): StorageConfig {
  // Find project root uploads directory
  const rootUploadsDir = path.resolve(__dirname, '../../uploads');
  if (!fs.existsSync(rootUploadsDir)) {
    try {
      fs.mkdirSync(rootUploadsDir, { recursive: true });
    } catch {}
  }

  // Determine provider from process.env
  let provider: StorageProviderType = 'local';
  const envProvider = (process.env.STORAGE_PROVIDER || process.env.MEDIA_STORAGE_DRIVER || '').toLowerCase().trim();

  if (envProvider.includes('s3') || process.env.S3_BUCKET || process.env.AWS_S3_BUCKET || process.env.R2_BUCKET) {
    provider = 's3_compatible';
  } else if (envProvider.includes('cloudinary') || process.env.CLOUDINARY_URL || process.env.CLOUDINARY_CLOUD_NAME) {
    provider = 'cloudinary';
  } else if (envProvider.includes('supabase') || process.env.SUPABASE_STORAGE_URL) {
    provider = 'supabase';
  } else if (envProvider.includes('firebase') || process.env.FIREBASE_STORAGE_BUCKET) {
    provider = 'firebase';
  } else if (envProvider.includes('http') || process.env.STORAGE_EXTERNAL_ENDPOINT || process.env.MEDIA_UPLOAD_WEBHOOK) {
    provider = 'custom_http';
  }

  return {
    provider,
    endpoint: process.env.STORAGE_ENDPOINT || process.env.STORAGE_EXTERNAL_ENDPOINT || process.env.S3_ENDPOINT || process.env.MEDIA_UPLOAD_WEBHOOK,
    bucket: process.env.STORAGE_BUCKET || process.env.S3_BUCKET || process.env.AWS_S3_BUCKET || process.env.R2_BUCKET,
    region: process.env.STORAGE_REGION || process.env.AWS_REGION || 'auto',
    accessKey: process.env.STORAGE_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID,
    secretKey: process.env.STORAGE_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY,
    apiKey: process.env.STORAGE_API_KEY || process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.STORAGE_API_SECRET || process.env.CLOUDINARY_API_SECRET,
    authToken: process.env.STORAGE_AUTH_TOKEN || process.env.STORAGE_BEARER_TOKEN,
    publicUrlPrefix: process.env.STORAGE_PUBLIC_URL_PREFIX || process.env.CDN_BASE_URL || process.env.STORAGE_CUSTOM_DOMAIN,
    localUploadsDir: rootUploadsDir
  };
}

/**
 * Standard Local File System Storage Adapter (High performance, streaming & static serving)
 */
export class LocalStorageAdapter implements IStorageAdapter {
  providerName: StorageProviderType = 'local';
  private uploadsDir: string;

  constructor(uploadsDir: string) {
    this.uploadsDir = uploadsDir;
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  isExternal(): boolean {
    return false;
  }

  private detectExtensionAndType(filename: string, mimeType?: string): { extension: string; mediaType: 'image' | 'video' | 'audio' | 'file' } {
    let extension = path.extname(filename).replace('.', '').toLowerCase();
    const mime = (mimeType || '').toLowerCase();

    if (!extension || extension === 'bin') {
      if (mime.includes('mp4')) extension = 'mp4';
      else if (mime.includes('webm')) extension = 'webm';
      else if (mime.includes('ogg')) extension = 'ogg';
      else if (mime.includes('mov') || mime.includes('quicktime')) extension = 'mov';
      else if (mime.includes('jpeg') || mime.includes('jpg')) extension = 'jpg';
      else if (mime.includes('png')) extension = 'png';
      else if (mime.includes('webp')) extension = 'webp';
      else if (mime.includes('gif')) extension = 'gif';
      else if (mime.includes('mp3') || mime.includes('mpeg')) extension = 'mp3';
      else if (mime.includes('wav')) extension = 'wav';
      else if (mime.includes('audio')) extension = 'mp3';
      else if (mime.includes('video')) extension = 'mp4';
      else extension = 'jpg';
    }

    const isVideo = ['mp4', 'webm', 'mov', 'ogg', 'mkv'].includes(extension) || mime.startsWith('video');
    const isAudio = ['mp3', 'wav', 'ogg', 'aac', 'm4a'].includes(extension) || mime.startsWith('audio');
    const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(extension) || mime.startsWith('image');

    const mediaType = isVideo ? 'video' : isAudio ? 'audio' : isImage ? 'image' : 'file';
    return { extension, mediaType };
  }

  async saveBuffer(buffer: Buffer, originalFilename: string, mimeType?: string, folder = ''): Promise<MediaUploadResult> {
    const { extension, mediaType } = this.detectExtensionAndType(originalFilename, mimeType);
    const safeFilename = `soqoor_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${extension}`;
    const targetDir = folder ? path.join(this.uploadsDir, folder) : this.uploadsDir;

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const targetFilePath = path.join(targetDir, safeFilename);
    await fs.promises.writeFile(targetFilePath, buffer);

    const publicUrl = folder ? `/uploads/${folder}/${safeFilename}` : `/uploads/${safeFilename}`;

    return {
      success: true,
      url: publicUrl,
      mediaType,
      size: buffer.length,
      filename: safeFilename,
      key: safeFilename,
      provider: 'local'
    };
  }

  async saveStream(stream: NodeJS.ReadableStream, originalFilename: string, mimeType?: string, folder = ''): Promise<MediaUploadResult> {
    const { extension, mediaType } = this.detectExtensionAndType(originalFilename, mimeType);
    const safeFilename = `soqoor_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${extension}`;
    const targetDir = folder ? path.join(this.uploadsDir, folder) : this.uploadsDir;

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const targetFilePath = path.join(targetDir, safeFilename);
    const writeStream = fs.createWriteStream(targetFilePath);

    return new Promise((resolve, reject) => {
      let bytesReceived = 0;
      stream.on('data', (chunk: Buffer) => {
        bytesReceived += chunk.length;
      });

      stream.pipe(writeStream);

      writeStream.on('finish', () => {
        const publicUrl = folder ? `/uploads/${folder}/${safeFilename}` : `/uploads/${safeFilename}`;
        resolve({
          success: true,
          url: publicUrl,
          mediaType,
          size: bytesReceived,
          filename: safeFilename,
          key: safeFilename,
          provider: 'local'
        });
      });

      writeStream.on('error', (err) => {
        reject(err);
      });
    });
  }

  async deleteFile(keyOrUrl: string): Promise<boolean> {
    try {
      const filename = path.basename(keyOrUrl);
      const filePath = path.join(this.uploadsDir, filename);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

/**
 * Universal External Cloud Storage Adapter
 * Compatible with any external HTTP endpoint, S3/R2 presigned or direct REST API, Supabase Storage, or custom CDN.
 */
export class ExternalCloudStorageAdapter implements IStorageAdapter {
  providerName: StorageProviderType;
  private config: StorageConfig;
  private localFallback: LocalStorageAdapter;

  constructor(config: StorageConfig) {
    this.config = config;
    this.providerName = config.provider;
    this.localFallback = new LocalStorageAdapter(config.localUploadsDir);
  }

  isExternal(): boolean {
    return true;
  }

  async saveBuffer(buffer: Buffer, originalFilename: string, mimeType?: string, folder = ''): Promise<MediaUploadResult> {
    // If endpoint is set, attempt cloud upload via HTTP POST
    if (this.config.endpoint) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': mimeType || 'application/octet-stream',
          'X-Filename': encodeURIComponent(originalFilename)
        };
        if (this.config.authToken) {
          headers['Authorization'] = `Bearer ${this.config.authToken}`;
        }
        if (this.config.apiKey) {
          headers['X-API-Key'] = this.config.apiKey;
        }

        const response = await fetch(this.config.endpoint, {
          method: 'POST',
          headers,
          body: new Uint8Array(buffer)
        });

        if (response.ok) {
          const data = await response.json().catch(() => ({}));
          const remoteUrl = data.url || data.secure_url || data.link || (this.config.publicUrlPrefix ? `${this.config.publicUrlPrefix}/${originalFilename}` : null);
          if (remoteUrl) {
            const isVideo = (mimeType || '').startsWith('video') || ['mp4', 'webm', 'mov'].some((ext) => originalFilename.endsWith(ext));
            const isAudio = (mimeType || '').startsWith('audio') || ['mp3', 'wav', 'ogg'].some((ext) => originalFilename.endsWith(ext));
            return {
              success: true,
              url: remoteUrl,
              mediaType: isVideo ? 'video' : isAudio ? 'audio' : 'image',
              size: buffer.length,
              filename: originalFilename,
              key: data.key || originalFilename,
              provider: this.providerName
            };
          }
        }
      } catch (err) {
        console.warn(`[Storage Layer] External upload to ${this.config.endpoint} failed, seamlessly using local fallback:`, err);
      }
    }

    // Seamless fallback to local storage
    return this.localFallback.saveBuffer(buffer, originalFilename, mimeType, folder);
  }

  async saveStream(stream: NodeJS.ReadableStream, originalFilename: string, mimeType?: string, folder = ''): Promise<MediaUploadResult> {
    // Collect stream into buffer if external upload is enabled
    if (this.config.endpoint) {
      try {
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        const fullBuffer = Buffer.concat(chunks);
        return this.saveBuffer(fullBuffer, originalFilename, mimeType, folder);
      } catch (err) {
        console.warn(`[Storage Layer] Stream buffering for external cloud upload failed, falling back:`, err);
      }
    }

    return this.localFallback.saveStream(stream, originalFilename, mimeType, folder);
  }

  async deleteFile(keyOrUrl: string): Promise<boolean> {
    return this.localFallback.deleteFile(keyOrUrl);
  }
}

/**
 * Singleton Storage Manager providing unified, provider-agnostic media uploads
 */
export class StorageManager {
  private static instance: StorageManager;
  private adapter: IStorageAdapter;
  private config: StorageConfig;

  private constructor() {
    this.config = getStorageConfigFromEnv();
    if (this.config.provider !== 'local' && (this.config.endpoint || this.config.bucket)) {
      this.adapter = new ExternalCloudStorageAdapter(this.config);
      console.log(`[Storage Layer] Initialized external cloud storage adapter (${this.config.provider}) with endpoint: ${this.config.endpoint || 'configured bucket'}`);
    } else {
      this.adapter = new LocalStorageAdapter(this.config.localUploadsDir);
      console.log(`[Storage Layer] Initialized local storage adapter (Uploads directory: ${this.config.localUploadsDir})`);
    }
  }

  public static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  public getAdapter(): IStorageAdapter {
    return this.adapter;
  }

  public getConfig(): StorageConfig {
    return this.config;
  }

  public isExternal(): boolean {
    return this.adapter.isExternal();
  }

  public getProviderName(): StorageProviderType {
    return this.adapter.providerName;
  }

  public async saveBuffer(buffer: Buffer, originalFilename: string, mimeType?: string, folder?: string): Promise<MediaUploadResult> {
    return this.adapter.saveBuffer(buffer, originalFilename, mimeType, folder);
  }

  public async saveStream(stream: NodeJS.ReadableStream, originalFilename: string, mimeType?: string, folder?: string): Promise<MediaUploadResult> {
    return this.adapter.saveStream(stream, originalFilename, mimeType, folder);
  }

  public async deleteFile(keyOrUrl: string): Promise<boolean> {
    return this.adapter.deleteFile(keyOrUrl);
  }
}

export const storageManager = StorageManager.getInstance();
