/**
 * Web Notifications API Engine & Background Service Worker Connector
 * Ensures users receive native system push/browser notifications when:
 * 1. A new private message arrives
 * 2. A mention (@) is made in the chat
 * Works seamlessly even when:
 * - Tab is in the background
 * - Phone screen is locked / phone is sleeping
 * - Browser is minimized
 */

let swRegistration: ServiceWorkerRegistration | null = null;
let clickListenerRegistered = false;

/**
 * Check if Web Notifications API is supported by the current browser
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Get current notification permission state
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Register Service Worker for background notifications and click handling
 */
export async function registerNotificationServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    swRegistration = reg;
    return reg;
  } catch (err) {
    console.warn('Service worker registration for notifications:', err);
    return null;
  }
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) return 'unsupported';

  // If already granted, ensure SW is registered
  if (Notification.permission === 'granted') {
    registerNotificationServiceWorker().catch(() => {});
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await registerNotificationServiceWorker();
      try {
        localStorage.setItem('soqoor_notifications_granted', 'true');
      } catch {}
    }
    return permission;
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return Notification.permission;
  }
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
}

/**
 * Send a web notification via ServiceWorker (background/screen-off resilient) or window.Notification
 */
export async function sendBrowserNotification(payload: NotificationPayload): Promise<boolean> {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  const {
    title,
    body,
    icon = '/favicon.svg',
    badge = '/favicon.svg',
    tag,
    data = {},
    requireInteraction = false
  } = payload;

  const options: NotificationOptions = {
    body,
    icon,
    badge,
    tag: tag || `soqoor-notif-${Date.now()}`,
    data: {
      ...data,
      url: typeof window !== 'undefined' ? window.location.href : '/'
    },
    requireInteraction,
    silent: false,
    // Vibration pattern for mobile devices: 200ms vibrate, 100ms pause, 200ms vibrate
    // @ts-ignore
    vibrate: [200, 100, 200]
  };

  // Try service worker showNotification first (essential for background & screen-off wakeups)
  if ('serviceWorker' in navigator) {
    try {
      const reg = swRegistration || (await navigator.serviceWorker.ready);
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, options);
        return true;
      }
    } catch {
      // Fall through to window Notification
    }
  }

  // Fallback to standard window Notification constructor
  try {
    const notif = new Notification(title, options);
    notif.onclick = () => {
      window.focus();
      if (data?.onAction) {
        try {
          data.onAction();
        } catch {}
      }
      notif.close();
    };
    return true;
  } catch (err) {
    console.warn('Notification instantiation fallback failed:', err);
    return false;
  }
}

/**
 * Notify user of a new incoming Private Message
 */
export async function notifyPrivateMessage(
  fromUsername: string,
  messageText: string,
  options?: {
    avatarUrl?: string;
    onOpenPm?: () => void;
  }
): Promise<boolean> {
  const cleanText = messageText ? messageText.trim() : 'أرسل لك وسائط أو رسالة خاصة';
  const displayBody = cleanText.length > 80 ? `${cleanText.slice(0, 80)}...` : cleanText;

  return sendBrowserNotification({
    title: `💬 رسالة خاصة من ${fromUsername}`,
    body: displayBody,
    icon: options?.avatarUrl || '/favicon.svg',
    tag: `pm-${fromUsername.toLowerCase().trim()}`,
    data: {
      type: 'pm',
      fromUsername,
      timestamp: Date.now()
    },
    requireInteraction: true
  });
}

/**
 * Notify user of an @mention in a chat message
 */
export async function notifyMention(
  fromUsername: string,
  messageText: string,
  roomName: string = 'الغرفة العامة',
  options?: {
    avatarUrl?: string;
  }
): Promise<boolean> {
  const cleanText = messageText ? messageText.trim() : 'قام بالإشارة إليك';
  const displayBody = cleanText.length > 80 ? `${cleanText.slice(0, 80)}...` : cleanText;

  return sendBrowserNotification({
    title: `🔔 تم ذكرك بواسطة @${fromUsername} في ${roomName}`,
    body: displayBody,
    icon: options?.avatarUrl || '/favicon.svg',
    tag: `mention-${fromUsername.toLowerCase().trim()}-${Date.now()}`,
    data: {
      type: 'mention',
      fromUsername,
      room: roomName,
      timestamp: Date.now()
    },
    requireInteraction: true
  });
}

/**
 * Test notification helper
 */
export async function sendTestNotification(): Promise<boolean> {
  return sendBrowserNotification({
    title: '🦅 تجربة إشعارات شات حسان برو',
    body: 'نظام تنبيهات المتصفح يعمل بنجاح! ستصلك التنبيهات حتى عند قفل الشاشة أو خروجك من التطبيق 🔔',
    icon: '/favicon.svg',
    tag: 'test-notification'
  });
}

/**
 * Attach global listener for notifications clicked via Service Worker
 */
export function listenToNotificationClicks(
  callback: (data: { type: string; fromUsername?: string; room?: string }) => void
): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || clickListenerRegistered) {
    return;
  }

  clickListenerRegistered = true;
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'NOTIFICATION_CLICKED' && event.data.data) {
      callback(event.data.data);
    }
  });
}
