import React from 'react';

export type EmblemType = 'banner' | 'gift' | 'sticker' | 'emoji';

export interface EmblemItem {
  id: string;
  type: EmblemType;
  title: string;
  imageUrl: string;
  shortcut?: string; // e.g. "ف1", "ف2", "ف3"
  codeNumber?: number;
  targetMember?: string;
  requiredRole?: string;
  createdAt: number;
  createdBy?: string;
}

export type EmojiSizeSetting = 'small' | 'default' | 'large';

export interface EmblemsConfig {
  items: EmblemItem[];
  emojiSize: EmojiSizeSetting;
}

// Helper to generate elegant high-contrast SVG Data URIs for 500x50 Name Logos / Banners
export function createBannerSvgDataUri(
  title: string,
  gradientFrom: string,
  gradientTo: string,
  accentColor: string,
  iconSymbol: string
): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 50" width="500" height="50">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${gradientFrom}" stop-opacity="0.95" />
      <stop offset="50%" stop-color="#0a0a14" stop-opacity="0.98" />
      <stop offset="100%" stop-color="${gradientTo}" stop-opacity="0.95" />
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="50%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#fef08a" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <rect x="2" y="2" width="496" height="46" rx="10" fill="url(#bg)" stroke="${accentColor}" stroke-width="2" />
  <rect x="6" y="6" width="488" height="38" rx="8" fill="none" stroke="${accentColor}" stroke-width="0.8" stroke-dasharray="6,4" opacity="0.6" />
  <circle cx="28" cy="25" r="14" fill="${gradientFrom}" stroke="${accentColor}" stroke-width="1.5" />
  <text x="28" y="30" font-size="14" text-anchor="middle" dominant-baseline="central">${iconSymbol}</text>
  <circle cx="472" cy="25" r="14" fill="${gradientTo}" stroke="${accentColor}" stroke-width="1.5" />
  <text x="472" y="30" font-size="14" text-anchor="middle" dominant-baseline="central">${iconSymbol}</text>
  <text x="250" y="32" font-family="'Cairo', sans-serif" font-weight="900" font-size="21" text-anchor="middle" fill="url(#gold)" filter="url(#glow)" letter-spacing="1.5">${title}</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Helper to generate elegant 48x48 icon SVG Data URIs for Gifts & Badges
export function createGiftSvgDataUri(symbol: string, bgColor: string, borderColor: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="60" height="60">
  <defs>
    <radialGradient id="grad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${bgColor}" stop-opacity="1" />
      <stop offset="100%" stop-color="#020617" stop-opacity="0.9" />
    </radialGradient>
    <filter id="g" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="${borderColor}" flood-opacity="0.7"/>
    </filter>
  </defs>
  <circle cx="30" cy="30" r="26" fill="url(#grad)" stroke="${borderColor}" stroke-width="2.5" filter="url(#g)" />
  <circle cx="30" cy="30" r="22" fill="none" stroke="${borderColor}" stroke-width="1" stroke-dasharray="3,3" opacity="0.7" />
  <text x="30" y="38" font-size="26" text-anchor="middle" dominant-baseline="central">${symbol}</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Helper to generate cute expressive 64x64 custom emoji faces with labels
export function createCustomEmojiSvgDataUri(emojiFace: string, bgGradientStart: string, bgGradientEnd: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="80" height="80">
  <defs>
    <radialGradient id="faceGrad" cx="40%" cy="40%" r="60%">
      <stop offset="0%" stop-color="${bgGradientStart}" />
      <stop offset="100%" stop-color="${bgGradientEnd}" />
    </radialGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity="0.5"/>
    </filter>
  </defs>
  <circle cx="40" cy="40" r="36" fill="url(#faceGrad)" stroke="#fef08a" stroke-width="2" filter="url(#shadow)" />
  <text x="40" y="50" font-size="44" text-anchor="middle" dominant-baseline="central">${emojiFace}</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Pre-seeded Default Emblems Library
export const DEFAULT_EMBLEMS: EmblemItem[] = [
  // 1. أيقونات السوابر والبنرات بمقاس قياسي 500x50
  {
    id: 'banner-admin-exec',
    type: 'banner',
    title: '👑 المدير التنفيذي الملكي',
    imageUrl: createBannerSvgDataUri('👑 المدير التنفيذي', '#991b1b', '#b91c1c', '#f59e0b', '👑'),
    createdAt: Date.now() - 100000,
    createdBy: 'إدارة حسان برو'
  },
  {
    id: 'banner-falcon-crest',
    type: 'banner',
    title: '🦅 صقر حسان برو الأصيل',
    imageUrl: createBannerSvgDataUri('🦅 صقر حسان برو الأصيل', '#b45309', '#78350f', '#fbbf24', '🦅'),
    createdAt: Date.now() - 90000,
    createdBy: 'إدارة حسان برو'
  },
  {
    id: 'banner-royal-leader',
    type: 'banner',
    title: '⚔️ الزعيم الملكي الأول',
    imageUrl: createBannerSvgDataUri('⚔️ الزعيم الملكي الأول', '#1e1b4b', '#312e81', '#a855f7', '⚔️'),
    createdAt: Date.now() - 80000,
    createdBy: 'إدارة حسان برو'
  },
  {
    id: 'banner-vip-diamond',
    type: 'banner',
    title: '💎 عضو VIP الذهبي الفاخر',
    imageUrl: createBannerSvgDataUri('💎 عضو VIP الذهبي', '#065f46', '#047857', '#34d399', '💎'),
    createdAt: Date.now() - 70000,
    createdBy: 'إدارة حسان برو'
  },
  {
    id: 'banner-night-knight',
    type: 'banner',
    title: '🌙 فارس السهر والليل',
    imageUrl: createBannerSvgDataUri('🌙 فارس السهر والليل', '#0f172a', '#1e293b', '#38bdf8', '🌙'),
    createdAt: Date.now() - 60000,
    createdBy: 'إدارة حسان برو'
  },
  {
    id: 'banner-ruby-heart',
    type: 'banner',
    title: '🌹 سفير القلوب والمحبة',
    imageUrl: createBannerSvgDataUri('🌹 سفير القلوب والمحبة', '#881337', '#9f1239', '#fb7185', '🌹'),
    createdAt: Date.now() - 50000,
    createdBy: 'إدارة حسان برو'
  },

  // 2. أيقونات الهدايا والأوسمة للتكريم والتمييز في قائمة المتواجدين
  {
    id: 'gift-crown-gold',
    type: 'gift',
    title: '👑 تاج الملوك الذهبي',
    imageUrl: createGiftSvgDataUri('👑', '#b45309', '#fbbf24'),
    createdAt: Date.now() - 40000,
    createdBy: 'إدارة حسان برو'
  },
  {
    id: 'gift-falcon-golden',
    type: 'gift',
    title: '🦅 صقر الذهب الخالص',
    imageUrl: createGiftSvgDataUri('🦅', '#854d0e', '#facc15'),
    createdAt: Date.now() - 39000,
    createdBy: 'إدارة حسان برو'
  },
  {
    id: 'gift-diamond-blue',
    type: 'gift',
    title: '💎 ألماسة المودة الزرقاء',
    imageUrl: createGiftSvgDataUri('💎', '#0369a1', '#38bdf8'),
    createdAt: Date.now() - 38000,
    createdBy: 'إدارة حسان برو'
  },
  {
    id: 'gift-flame-ruby',
    type: 'gift',
    title: '🔥 شعلة التفاعل الملتهبة',
    imageUrl: createGiftSvgDataUri('🔥', '#be123c', '#fb7185'),
    createdAt: Date.now() - 37000,
    createdBy: 'إدارة حسان برو'
  },
  {
    id: 'gift-swords-saudi',
    type: 'gift',
    title: '⚔️ وسام الشجاعة والفخر',
    imageUrl: createGiftSvgDataUri('⚔️', '#15803d', '#4ade80'),
    createdAt: Date.now() - 36000,
    createdBy: 'إدارة حسان برو'
  },
  {
    id: 'gift-trophy-gold',
    type: 'gift',
    title: '🏆 كأس التميز والإبداع',
    imageUrl: createGiftSvgDataUri('🏆', '#a16207', '#fde047'),
    createdAt: Date.now() - 35000,
    createdBy: 'إدارة حسان برو'
  },
  {
    id: 'gift-rose-velvet',
    type: 'gift',
    title: '🌹 وردة الإخلاص والوفاء',
    imageUrl: createGiftSvgDataUri('🌹', '#9f1239', '#f43f5e'),
    createdAt: Date.now() - 34000,
    createdBy: 'إدارة حسان برو'
  },

  // 3. الستيكرات التعبيرية (Stickers)
  {
    id: 'sticker-falcon-salute',
    type: 'sticker',
    title: 'صقر حسان برو يحيي الجميع',
    imageUrl: createCustomEmojiSvgDataUri('🦅', '#b45309', '#1e1b4b'),
    createdAt: Date.now() - 30000,
    createdBy: 'إدارة حسان برو'
  },
  {
    id: 'sticker-arabic-coffee',
    type: 'sticker',
    title: 'قهوة العز والضيافة',
    imageUrl: createCustomEmojiSvgDataUri('☕', '#78350f', '#451a03'),
    createdAt: Date.now() - 29000,
    createdBy: 'إدارة حسان برو'
  },
  {
    id: 'sticker-celebrate-cheer',
    type: 'sticker',
    title: 'احتفال وفرحة كبرى',
    imageUrl: createCustomEmojiSvgDataUri('🎉', '#dc2626', '#b45309'),
    createdAt: Date.now() - 28000,
    createdBy: 'إدارة حسان برو'
  },
  {
    id: 'sticker-heart-love',
    type: 'sticker',
    title: 'قلب وردي دافئ',
    imageUrl: createCustomEmojiSvgDataUri('💖', '#be123c', '#701a75'),
    createdAt: Date.now() - 27000,
    createdBy: 'إدارة حسان برو'
  },

  // 4. الفيسات (Custom Emojis) ذات الترقيم التسلسلي التلقائي من "ف1" تصاعدياً
  {
    id: 'emoji-f1',
    type: 'emoji',
    title: 'ضحكة وفرحة عريضة',
    shortcut: 'ف1',
    codeNumber: 1,
    imageUrl: createCustomEmojiSvgDataUri('😄', '#facc15', '#eab308'),
    createdAt: Date.now() - 20000,
    createdBy: 'إدارة حسان برو'
  },
  {
    id: 'emoji-f2',
    type: 'emoji',
    title: 'غمزة ومحبة',
    shortcut: 'ف2',
    codeNumber: 2,
    imageUrl: createCustomEmojiSvgDataUri('😉', '#facc15', '#ca8a04'),
    createdAt: Date.now() - 19000,
    createdBy: 'إدارة حسان برو'
  },
  {
    id: 'emoji-f3',
    type: 'emoji',
    title: 'عيون قلوب حب',
    shortcut: 'ف3',
    codeNumber: 3,
    imageUrl: createCustomEmojiSvgDataUri('😍', '#fb7185', '#e11d48'),
    createdAt: Date.now() - 18000,
    createdBy: 'إدارة حسان برو'
  },
  {
    id: 'emoji-f4',
    type: 'emoji',
    title: 'نظارة الهيبة والرزانة',
    shortcut: 'ف4',
    codeNumber: 4,
    imageUrl: createCustomEmojiSvgDataUri('😎', '#facc15', '#a16207'),
    createdAt: Date.now() - 17000,
    createdBy: 'إدارة حسان برو'
  },
  {
    id: 'emoji-f5',
    type: 'emoji',
    title: 'صقر حسان برو المحارب',
    shortcut: 'ف5',
    codeNumber: 5,
    imageUrl: createCustomEmojiSvgDataUri('🦅', '#d97706', '#78350f'),
    createdAt: Date.now() - 16000,
    createdBy: 'إدارة حسان برو'
  },
  {
    id: 'emoji-f6',
    type: 'emoji',
    title: 'تاج الفخر الملكي',
    shortcut: 'ف6',
    codeNumber: 6,
    imageUrl: createCustomEmojiSvgDataUri('👑', '#fef08a', '#ca8a04'),
    createdAt: Date.now() - 15000,
    createdBy: 'إدارة حسان برو'
  },
  {
    id: 'emoji-f7',
    type: 'emoji',
    title: 'شعلة الحماس والنشاط',
    shortcut: 'ف7',
    codeNumber: 7,
    imageUrl: createCustomEmojiSvgDataUri('🔥', '#f87171', '#dc2626'),
    createdAt: Date.now() - 14000,
    createdBy: 'إدارة حسان برو'
  },
  {
    id: 'emoji-f8',
    type: 'emoji',
    title: 'وردة بيضاء نقية',
    shortcut: 'ف8',
    codeNumber: 8,
    imageUrl: createCustomEmojiSvgDataUri('🌹', '#fda4af', '#e11d48'),
    createdAt: Date.now() - 13000,
    createdBy: 'إدارة حسان برو'
  },
  {
    id: 'emoji-f9',
    type: 'emoji',
    title: 'فنجان قهوة الضيافة',
    shortcut: 'ف9',
    codeNumber: 9,
    imageUrl: createCustomEmojiSvgDataUri('☕', '#fbbf24', '#78350f'),
    createdAt: Date.now() - 12000,
    createdBy: 'إدارة حسان برو'
  },
  {
    id: 'emoji-f10',
    type: 'emoji',
    title: 'ألماسة فاخرة',
    shortcut: 'ف10',
    codeNumber: 10,
    imageUrl: createCustomEmojiSvgDataUri('💎', '#38bdf8', '#0284c7'),
    createdAt: Date.now() - 11000,
    createdBy: 'إدارة حسان برو'
  },
  {
    id: 'emoji-f11',
    type: 'emoji',
    title: 'تصفيق وتهنئة حارة',
    shortcut: 'ف11',
    codeNumber: 11,
    imageUrl: createCustomEmojiSvgDataUri('👏', '#facc15', '#ca8a04'),
    createdAt: Date.now() - 10000,
    createdBy: 'إدارة حسان برو'
  },
  {
    id: 'emoji-f12',
    type: 'emoji',
    title: 'هلال البركة والخير',
    shortcut: 'ف12',
    codeNumber: 12,
    imageUrl: createCustomEmojiSvgDataUri('🌙', '#c084fc', '#6b21a8'),
    createdAt: Date.now() - 9000,
    createdBy: 'إدارة حسان برو'
  }
];

export function getEmojiSizeClass(size: EmojiSizeSetting): string {
  switch (size) {
    case 'small':
      return 'w-6 h-6 max-w-[24px] max-h-[24px]';
    case 'large':
      return 'w-11 h-11 max-w-[44px] max-h-[44px]';
    case 'default':
    default:
      return 'w-8 h-8 max-w-[32px] max-h-[32px]';
  }
}

/**
 * نظام الاستبدال الآلي للوجوه التعبيرية (Emoji Parser):
 * يبحث في النص عن الأكواد التسلسلية مثل "ف1"، "ف2"، "ف3"... ويستبدلها بعنصر صورة <img>
 * بحجم العرض المحدد، مع الحفاظ على سلامة بقية النص والمسافات.
 */
export function parseCustomEmojisInText(
  text: string,
  emojisList: EmblemItem[],
  emojiSize: EmojiSizeSetting = 'default'
): React.ReactNode {
  if (!text) return text;

  // Filter only custom emojis with shortcut
  const activeEmojis = emojisList.filter((e) => e.type === 'emoji' && e.shortcut);
  if (activeEmojis.length === 0) return text;

  // Map shortcuts for quick lookup (e.g. 'ف1' -> emblem)
  const map = new Map<string, EmblemItem>();
  activeEmojis.forEach((e) => {
    if (e.shortcut) {
      map.set(e.shortcut.trim(), e);
    }
  });

  // Regex pattern matching "ف" followed by one or more digits: e.g. ف1, ف2, ف10
  const tokenRegex = /(ف\d+)/g;
  const parts = text.split(tokenRegex);

  if (parts.length <= 1) return text;

  const sizeClass = getEmojiSizeClass(emojiSize);

  return parts.map((part, idx) => {
    const matched = map.get(part);
    if (matched) {
      return React.createElement('img', {
        key: `emoji-token-${idx}-${part}`,
        src: matched.imageUrl,
        alt: matched.shortcut || part,
        title: `${matched.shortcut}: ${matched.title}`,
        className: `${sizeClass} inline-block align-middle mx-1 object-contain drop-shadow-sm select-none transition-transform hover:scale-125`,
        loading: 'lazy'
      });
    }
    return part;
  });
}

export const DEFAULT_EMBLEMS_CONFIG: EmblemsConfig = {
  items: DEFAULT_EMBLEMS,
  emojiSize: 'default'
};

export const createGiftBadgeSvgDataUri = createGiftSvgDataUri;
export const createStickerSvgDataUri = createBannerSvgDataUri;
