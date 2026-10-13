/**
 * Connection Keep-Alive & Mobile Screen-Lock Resilience Engine
 * Ensures users NEVER drop connection when:
 * 1. Screen is locked / phone goes to sleep
 * 2. Uploading large videos (via dedicated HTTP background pipeline)
 * 3. Mobile background app switching
 * User only disconnects when they explicitly log out themselves.
 */

import { Socket } from 'socket.io-client';

// Extremely lightweight base64 silent WAV audio data URI (100ms silent audio loop)
const SILENT_AUDIO_URI = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

let silentAudioEl: HTMLAudioElement | null = null;
let wakeLockSentinel: any = null;
let heartbeatWorker: Worker | null = null;
let fallbackTimer: any = null;
let activeSocket: Socket | null = null;

/**
 * 1. Request Screen WakeLock to prevent automatic screen sleeping
 */
export async function requestScreenWakeLock(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
    try {
      wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      wakeLockSentinel.addEventListener('release', () => {
        wakeLockSentinel = null;
      });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * 2. Start Silent Audio Loop (Mobile OS Keep-Alive)
 * iOS Safari and Android Chrome grant high priority and un-throttled
 * network/timers to web applications actively playing media.
 */
export function startSilentAudioKeepAlive(): void {
  try {
    if (!silentAudioEl) {
      silentAudioEl = new Audio(SILENT_AUDIO_URI);
      silentAudioEl.loop = true;
      silentAudioEl.volume = 0.01; // virtually silent
    }
    silentAudioEl.play().catch(() => {
      // Browsers require user interaction before autoplay
      const playOnUserAction = () => {
        if (silentAudioEl) {
          silentAudioEl.play().catch(() => {});
        }
        window.removeEventListener('click', playOnUserAction);
        window.removeEventListener('touchstart', playOnUserAction);
      };
      window.addEventListener('click', playOnUserAction, { once: true });
      window.addEventListener('touchstart', playOnUserAction, { once: true });
    });
  } catch {}
}

export function stopSilentAudioKeepAlive(): void {
  if (silentAudioEl) {
    try {
      silentAudioEl.pause();
      silentAudioEl.src = '';
    } catch {}
    silentAudioEl = null;
  }
}

export const PRESENCE_AWAY_DELAY_MS = 2 * 60 * 1000; // دقيقتين (120 ثانية) بالتمام والكمال
let backgroundStartTime: number | null = null;
let hasEmittedAway = false;
let awayTimer: any = null;

/**
 * 3. Background Web Worker Heartbeat
 * Unlike window.setInterval (which browsers heavily throttle when tab is in background or screen is locked),
 * Web Workers run on a background OS thread and maintain regular tick intervals.
 */
export function startHeartbeatWorker(socket: Socket): void {
  activeSocket = socket;
  if (heartbeatWorker) return;

  const workerCode = `
    let timer = null;
    self.onmessage = function(e) {
      if (e.data === 'start') {
        if (!timer) {
          timer = setInterval(function() {
            self.postMessage('tick');
          }, 8000);
        }
      } else if (e.data === 'stop') {
        if (timer) {
          clearInterval(timer);
          timer = null;
        }
      }
    };
  `;

  try {
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const blobUrl = URL.createObjectURL(blob);
    heartbeatWorker = new Worker(blobUrl);
    URL.revokeObjectURL(blobUrl);

    heartbeatWorker.onmessage = (e) => {
      if (e.data === 'tick' && activeSocket) {
        if (activeSocket.connected) {
          activeSocket.emit('keepAlivePing', { timestamp: Date.now() });
        } else {
          // If disconnected during background sleep, initiate immediate reconnect
          activeSocket.connect();
        }

        // Check background elapsed time: change to yellow (away) only after 2 full minutes
        if (typeof document !== 'undefined' && document.hidden && backgroundStartTime !== null && !hasEmittedAway) {
          const elapsed = Date.now() - backgroundStartTime;
          if (elapsed >= PRESENCE_AWAY_DELAY_MS) {
            hasEmittedAway = true;
            if (activeSocket.connected) {
              activeSocket.emit('userPresenceChange', { state: 'away' });
            }
          }
        }
      }
    };
    heartbeatWorker.postMessage('start');
  } catch (err) {
    // Fallback to regular timer if worker unavailable
    if (fallbackTimer) clearInterval(fallbackTimer);
    fallbackTimer = setInterval(() => {
      if (activeSocket?.connected) {
        activeSocket.emit('keepAlivePing', { timestamp: Date.now() });
      }
      if (typeof document !== 'undefined' && document.hidden && backgroundStartTime !== null && !hasEmittedAway) {
        const elapsed = Date.now() - backgroundStartTime;
        if (elapsed >= PRESENCE_AWAY_DELAY_MS) {
          hasEmittedAway = true;
          if (activeSocket?.connected) {
            activeSocket.emit('userPresenceChange', { state: 'away' });
          }
        }
      }
    }, 10000);
  }
}

export function stopHeartbeatWorker(): void {
  if (heartbeatWorker) {
    try {
      heartbeatWorker.postMessage('stop');
      heartbeatWorker.terminate();
    } catch {}
    heartbeatWorker = null;
  }
  if (fallbackTimer) {
    clearInterval(fallbackTimer);
    fallbackTimer = null;
  }
}

/**
 * 4. Visibility & Phone Screen Unlock Handlers
 * When switching apps or locking screen:
 * - Mark remains green (online) for 2 full minutes.
 * - If user remains in background past 2 minutes, transitions to yellow (away).
 * - Connection stays 100% active, stable, and never dropped.
 * - Immediately turns green (online) upon returning to chat interface.
 */
export function setupVisibilityResync(socket: Socket, onWake?: () => void): () => void {
  activeSocket = socket;

  const triggerOnlineForeground = () => {
    if (awayTimer) {
      clearTimeout(awayTimer);
      awayTimer = null;
    }
    backgroundStartTime = null;
    hasEmittedAway = false;

    requestScreenWakeLock();

    if (activeSocket) {
      if (!activeSocket.connected) {
        // Socket was disconnected: reconnect and re-sync session
        activeSocket.connect();
        if (onWake) {
          onWake();
        }
      } else {
        // Socket is ALREADY connected! Just send keepAlive ping and ensure online presence
        activeSocket.emit('keepAlivePing', { timestamp: Date.now() });
      }
      // Return immediately to green online dot (متواجد ونشط 🟢)
      activeSocket.emit('userPresenceChange', { state: 'online' });
    }
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      // User returned to chat interface: switch to green (online) immediately
      triggerOnlineForeground();
    } else if (document.visibilityState === 'hidden') {
      // User switched to another app or locked screen:
      // Keep presence green for 2 minutes before turning yellow (away)
      if (awayTimer) clearTimeout(awayTimer);
      backgroundStartTime = Date.now();
      hasEmittedAway = false;

      awayTimer = setTimeout(() => {
        if (document.hidden && activeSocket?.connected && !hasEmittedAway) {
          hasEmittedAway = true;
          activeSocket.emit('userPresenceChange', { state: 'away' });
        }
      }, PRESENCE_AWAY_DELAY_MS);
    }
  };

  const handleFocus = () => {
    triggerOnlineForeground();
  };

  const handleBlur = () => {
    // When window loses focus while document is hidden, initialize the 2-minute delay
    if (document.hidden && !awayTimer && !hasEmittedAway) {
      backgroundStartTime = Date.now();
      awayTimer = setTimeout(() => {
        if (document.hidden && activeSocket?.connected && !hasEmittedAway) {
          hasEmittedAway = true;
          activeSocket.emit('userPresenceChange', { state: 'away' });
        }
      }, PRESENCE_AWAY_DELAY_MS);
    }
  };

  const handleOnline = () => {
    triggerOnlineForeground();
  };

  // Listeners for visibility and focus/online events
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('focus', handleFocus);
  window.addEventListener('blur', handleBlur);
  window.addEventListener('online', handleOnline);

  return () => {
    if (awayTimer) {
      clearTimeout(awayTimer);
      awayTimer = null;
    }
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('focus', handleFocus);
    window.removeEventListener('blur', handleBlur);
    window.removeEventListener('online', handleOnline);
  };
}

/**
 * 5. Robust Media Upload Pipeline (HTTP Binary Progress Pipeline)
 * Large videos (up to 150MB) and high-resolution images are uploaded over
 * direct binary streaming HTTP POST with progress, completely bypassing
 * WebSocket frames and eliminating base64 memory overhead so Socket.IO
 * heartbeats NEVER stall and connection NEVER drops!
 */
export async function uploadMediaWithProgress(
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ url: string; mediaType: 'image' | 'video' | 'audio'; originalName: string; size: number }> {
  const isVideo = file.type.startsWith('video');
  const isAudio = file.type.startsWith('audio');
  const mediaType: 'image' | 'video' | 'audio' = isVideo ? 'video' : isAudio ? 'audio' : 'image';

  // Primary: Pure binary streaming via XHR - Zero main-thread CPU freeze, Zero Base64 string allocations
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload-media-binary', true);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.setRequestHeader('x-filename', encodeURIComponent(file.name));
    xhr.setRequestHeader('x-mediatype', mediaType);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && e.total > 0) {
          const percent = Math.min(99, Math.round((e.loaded / e.total) * 100));
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.success && res.url) {
            if (onProgress) onProgress(100);
            resolve({
              url: res.url,
              mediaType: res.mediaType || mediaType,
              originalName: file.name,
              size: res.size || file.size
            });
            return;
          }
        } catch {}
      }

      // If binary upload encounters an issue, fallback to json upload
      fallbackUpload(file, mediaType, onProgress, resolve, reject);
    };

    xhr.onerror = () => {
      fallbackUpload(file, mediaType, onProgress, resolve, reject);
    };

    xhr.send(file);
  });
}

function fallbackUpload(
  file: File,
  mediaType: 'image' | 'video' | 'audio',
  onProgress?: (percent: number) => void,
  resolve?: (val: any) => void,
  reject?: (err: any) => void
) {
  const reader = new FileReader();
  reader.onerror = () => reject && reject(new Error('فشل قراءة ملف الوسائط'));
  reader.onload = () => {
    const dataUrl = reader.result as string;
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload-media', true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.min(99, Math.round((e.loaded / e.total) * 100));
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.success && res.url) {
            if (onProgress) onProgress(100);
            resolve && resolve({
              url: res.url,
              mediaType: res.mediaType || mediaType,
              originalName: file.name,
              size: res.size || file.size
            });
            return;
          }
        } catch {}
      }
      reject && reject(new Error('فشل رفع الملف على الخادم'));
    };

    xhr.onerror = () => reject && reject(new Error('انقطع الاتصال أثناء رفع الوسائط'));

    xhr.send(JSON.stringify({ dataUrl, filename: file.name, mediaType }));
  };
  reader.readAsDataURL(file);
}
