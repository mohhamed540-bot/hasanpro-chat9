import React from 'react';
import {
  Palette,
  Eye,
  Sliders,
  Sparkles,
  Volume2,
  VolumeX,
  Type,
  Sun,
  Moon,
  Layers,
  Check,
  Zap,
  Image as ImageIcon,
  X
} from 'lucide-react';

export interface ThemeAndWallpaperCenterProps {
  isOpen: boolean;
  onClose: () => void;
  activeTheme: string;
  onChangeTheme: (themeId: string) => void;
  activeWallpaper: string;
  onChangeWallpaper: (wallpaperId: string) => void;
  fontFamily: string;
  onChangeFontFamily: (fontId: string) => void;
  chatFontSize: 'sm' | 'base' | 'lg' | 'xl';
  onChangeFontSize: (size: 'sm' | 'base' | 'lg' | 'xl') => void;
  bubbleStyle: string;
  onChangeBubbleStyle: (styleId: string) => void;
  nameColor?: string;
  onChangeNameColor?: (color: string) => void;
  textColor?: string;
  onChangeTextColor?: (color: string) => void;
  eyeComfort: boolean;
  onToggleEyeComfort: () => void;
  soundVolume: number;
  onChangeSoundVolume: (volume: number) => void;
  particlesEnabled: boolean;
  onToggleParticles: () => void;
  currentUserRole?: string;
  onApplyGlobalAppearance?: (app: { theme?: string; fontFamily?: string; wallpaper?: string; bubbleStyle?: string }) => void;
  onShowToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export interface ThemeDefinition {
  id: string;
  name: string;
  bg: string;
  primary: string;
  accent: string;
  colors: string[];
  isGold?: boolean;
  category?: 'gold' | 'royal' | 'classic' | 'nature';
  badge?: string;
  fieldDesc?: string;
  recommendedFontColor?: string;
  recommendedNameColor?: string;
}

export const THEMES_LIST: ThemeDefinition[] = [
  // ⭐ الثيمات والاستايلات الذهبية الملكية الـ 5 الحصرية (ألوان ذهبية + حقول متناسقة + لون خط مناسب)
  {
    id: 'royal-pure-gold-24k',
    name: 'الذهب الإمبراطوري الخالص 24K 👑✨',
    bg: 'bg-[#090804]',
    primary: 'border-amber-400 text-amber-300',
    accent: '#fbbf24',
    colors: ['#fbbf24', '#f59e0b', '#d97706', '#090804'],
    isGold: true,
    category: 'gold',
    badge: 'عيار 24 صافي',
    fieldDesc: 'حقول فحمية مذهبة بإطار عيار 24 وتوهج أصفر ملكي',
    recommendedFontColor: '#fef3c7',
    recommendedNameColor: '#fbbf24'
  },
  {
    id: 'dubai-pearl-gold',
    name: 'ذهب دبي الفاخر ولؤلؤ الخليج 🪙🦪',
    bg: 'bg-[#120d03]',
    primary: 'border-yellow-400 text-yellow-300',
    accent: '#facc15',
    colors: ['#fef08a', '#facc15', '#ca8a04', '#120d03'],
    isGold: true,
    category: 'gold',
    badge: 'ذهب دبي ولؤلؤ',
    fieldDesc: 'حقول كهرمانية بلمعة اللؤلؤ وخط عاجي ناصع',
    recommendedFontColor: '#fef9c3',
    recommendedNameColor: '#facc15'
  },
  {
    id: 'pharaonic-sun-gold',
    name: 'شمس الفراعنة والذهب الكنعاني ☀️🏛️',
    bg: 'bg-[#0d0602]',
    primary: 'border-amber-500 text-amber-300',
    accent: '#f59e0b',
    colors: ['#f59e0b', '#d97706', '#92400e', '#0d0602'],
    isGold: true,
    category: 'gold',
    badge: 'ذهب فرعوني معتق',
    fieldDesc: 'حقول برونزية مذهبة بروح الآثار وخط عنبري أصيل',
    recommendedFontColor: '#fed7aa',
    recommendedNameColor: '#f59e0b'
  },
  {
    id: 'champagne-velvet-gold',
    name: 'شامبانيا الذهب ومخمل الليل 🥂👑',
    bg: 'bg-[#070709]',
    primary: 'border-yellow-300 text-yellow-200',
    accent: '#fde047',
    colors: ['#fde047', '#eab308', '#854d0e', '#070709'],
    isGold: true,
    category: 'gold',
    badge: 'شامبانيا وسواد مخملي',
    fieldDesc: 'حقول مخملية دافئة بإطار شامباني وخط ساطع ناصع',
    recommendedFontColor: '#fefce8',
    recommendedNameColor: '#fde047'
  },
  {
    id: 'alhambra-arabesque-gold',
    name: 'نقوش قصر الحمراء والذهب العتيق 🕌✨',
    bg: 'bg-[#100802]',
    primary: 'border-yellow-500 text-yellow-300',
    accent: '#eab308',
    colors: ['#eab308', '#ca8a04', '#713f12', '#100802'],
    isGold: true,
    category: 'gold',
    badge: 'ذهب أندلسي عتيق',
    fieldDesc: 'حقول زجاجية أندلسية مطعمة بالذهب والخط الأندلسي',
    recommendedFontColor: '#fef3c7',
    recommendedNameColor: '#eab308'
  },
  {
    id: 'andalusian-jasmine-palace',
    name: 'ياسمين الأندلس والرخام الملكي الأخضر 🏛️🌿',
    bg: 'bg-[#021810]',
    primary: 'border-emerald-500 text-emerald-200',
    accent: '#10b981',
    colors: ['#10b981', '#059669', '#022c22', '#fef08a'],
    category: 'royal'
  },
  {
    id: 'imperial-obsidian-gold',
    name: 'الأوبسيديان الأسود والذهب الخالص 24K 👑✨',
    bg: 'bg-[#050507]',
    primary: 'border-amber-400 text-amber-300',
    accent: '#f59e0b',
    colors: ['#f59e0b', '#fbbf24', '#18181b', '#000000'],
    category: 'gold'
  },
  {
    id: 'persian-lapis-lazuli',
    name: 'لازورد قصر أصفهان والأزرق الملكي 🌌🧿',
    bg: 'bg-[#050b1f]',
    primary: 'border-blue-500 text-blue-200',
    accent: '#2563eb',
    colors: ['#2563eb', '#1d4ed8', '#0b1940', '#67e8f9'],
    category: 'royal'
  },
  {
    id: 'royal-oud-ambergris',
    name: 'العود الكمبودي والعنبر الدخاني المعتق 🪵🔥',
    bg: 'bg-[#1a0a04]',
    primary: 'border-amber-600 text-amber-200',
    accent: '#d97706',
    colors: ['#d97706', '#9a3412', '#270f05', '#fed7aa'],
    category: 'royal'
  },
  {
    id: 'cosmic-aurora-borealis',
    name: 'شفق الشتاء القطبي والزمرد البنفسجي 🌌❄️',
    bg: 'bg-[#060414]',
    primary: 'border-teal-400 text-teal-200',
    accent: '#2dd4bf',
    colors: ['#2dd4bf', '#a855f7', '#0e0b29', '#e0e7ff'],
    category: 'classic'
  },
  {
    id: 'emerald-gold-palace',
    name: 'قصر الزمرد الملكي والذهب الأندلسي 🏛️✨',
    bg: 'bg-[#03261a]',
    primary: 'border-emerald-500 text-emerald-200',
    accent: '#10b981',
    colors: ['#10b981', '#059669', '#022c22', '#fbbf24'],
    category: 'royal'
  },
  {
    id: 'midnight-neon-cyber',
    name: 'نيون سايبر وسحر الليل المستقبلي ⚡🌃',
    bg: 'bg-[#080d16]',
    primary: 'border-cyan-400 text-cyan-200',
    accent: '#06b6d4',
    colors: ['#06b6d4', '#0891b2', '#081426', '#a855f7'],
    category: 'classic'
  },
  {
    id: 'royal-crimson-velvet',
    name: 'المخمل العنابي الإمبراطوري وذهب الباشا 🍷👑',
    bg: 'bg-[#2b0612]',
    primary: 'border-rose-600 text-rose-200',
    accent: '#e11d48',
    colors: ['#e11d48', '#9f1239', '#4c0519', '#fde047'],
    category: 'royal'
  },
  {
    id: 'desert-dune-gold',
    name: 'رمال الصحراء الذهبية وأصالة البادية 🏜️🦅',
    bg: 'bg-[#2a1708]',
    primary: 'border-amber-600 text-amber-200',
    accent: '#d97706',
    colors: ['#f59e0b', '#d97706', '#451a03', '#fef3c7'],
    category: 'gold'
  },
  {
    id: 'arctic-sapphire-frost',
    name: 'ياقوت الجليد الملكي والأزرق الفيروزي ❄️💎',
    bg: 'bg-[#051526]',
    primary: 'border-sky-400 text-sky-200',
    accent: '#0284c7',
    colors: ['#38bdf8', '#0284c7', '#082f49', '#e0f2fe'],
    category: 'classic'
  },
  {
    id: 'golden-brown-harmony',
    name: 'الذهبي وبني الموكا الملكي ☕👑',
    bg: 'bg-[#1c120c]',
    primary: 'border-amber-500 text-amber-200',
    accent: '#d97706',
    colors: ['#d97706', '#92400e', '#451a03', '#fef3c7'],
    category: 'gold'
  },
  {
    id: 'dam-ghazal-royal',
    name: 'دم الغزال المخملي الداكن 🦌🩸',
    bg: 'bg-[#22040c]',
    primary: 'border-rose-900 text-rose-300',
    accent: '#9f1239',
    colors: ['#9f1239', '#881337', '#4c0519', '#ffe4e6'],
    category: 'royal'
  },
  {
    id: 'royal-turquoise',
    name: 'الفيروز السلطاني والأبيض اللؤلؤي 💠',
    bg: 'bg-[#081b24]',
    primary: 'border-cyan-600 text-cyan-200',
    accent: '#06b6d4',
    colors: ['#06b6d4', '#0891b2', '#083344', '#ecfeff'],
    category: 'classic'
  },
  {
    id: 'sunset-bronze',
    name: 'غروب الصحراء والبرونز النحاسي 🌅',
    bg: 'bg-[#1e130c]',
    primary: 'border-orange-600 text-orange-200',
    accent: '#ea580c',
    colors: ['#ea580c', '#c2410c', '#431407', '#ffedd5'],
    category: 'gold'
  },
  {
    id: 'amethyst-velvet',
    name: 'الأرجوان المخملي والذهب الساطع 🔮👑',
    bg: 'bg-[#150722]',
    primary: 'border-purple-600 text-purple-200',
    accent: '#9333ea',
    colors: ['#9333ea', '#7e22ce', '#3b0764', '#f5d0fe'],
    category: 'royal'
  },
  {
    id: 'dark-gold',
    name: 'صقر الليل (ذهبي ملكي أصيل) 🦅',
    bg: 'bg-slate-950',
    primary: 'border-amber-500 text-amber-400',
    accent: '#f59e0b',
    colors: ['#f59e0b', '#b45309', '#1e293b', '#0f172a'],
    category: 'gold'
  },
  {
    id: 'royal-gold-brown',
    name: 'الذهب الملكي والخشب البني 🪵',
    bg: 'bg-[#18110b]',
    primary: 'border-amber-600 text-amber-300',
    accent: '#d97706',
    colors: ['#d97706', '#78350f', '#29180c', '#fde68a'],
    category: 'gold'
  },
  {
    id: 'dam-ghazal',
    name: 'دم الغزال الكلاسيكي 🦌',
    bg: 'bg-[#1a080c]',
    primary: 'border-rose-700 text-rose-300',
    accent: '#9f1239',
    colors: ['#be123c', '#881337', '#25050e', '#fecdd3'],
    category: 'classic'
  },
  {
    id: 'sapphire-night',
    name: 'الياقوت الأزرق الليلي والنيون 💎',
    bg: 'bg-[#09111e]',
    primary: 'border-blue-600 text-blue-300',
    accent: '#2563eb',
    colors: ['#2563eb', '#1d4ed8', '#0f172a', '#93c5fd'],
    category: 'classic'
  },
  {
    id: 'emerald-sand',
    name: 'واحة الزمرد والرمال الذهبية 🌿',
    bg: 'bg-[#0c1610]',
    primary: 'border-emerald-600 text-emerald-300',
    accent: '#059669',
    colors: ['#059669', '#047857', '#022c22', '#a7f3d0'],
    category: 'nature'
  },
  {
    id: 'violet-twilight',
    name: 'شفق الليل واللافندر 🔮',
    bg: 'bg-[#140b1c]',
    primary: 'border-purple-600 text-purple-300',
    accent: '#9333ea',
    colors: ['#a855f7', '#7e22ce', '#1e112a', '#e9d5ff'],
    category: 'classic'
  },
  {
    id: 'amber-oasis',
    name: 'واحة الصحراء (عنبر دافئ) 🏜️',
    bg: 'bg-stone-950',
    primary: 'border-orange-500 text-orange-400',
    accent: '#f97316',
    colors: ['#f97316', '#c2410c', '#1c1917', '#fed7aa'],
    category: 'nature'
  },
  {
    id: 'ruby-velvet',
    name: 'الياقوت الملكي (أحمر عنابي) 🍷',
    bg: 'bg-zinc-950',
    primary: 'border-rose-600 text-rose-400',
    accent: '#e11d48',
    colors: ['#e11d48', '#9f1239', '#18181b', '#fecdd3'],
    category: 'royal'
  },
  {
    id: 'deep-ocean',
    name: 'المحيط الهادئ (أزرق نيلي) 🌊',
    bg: 'bg-slate-950',
    primary: 'border-cyan-500 text-cyan-400',
    accent: '#06b6d4',
    colors: ['#06b6d4', '#0284c7', '#0f172a', '#bae6fd'],
    category: 'nature'
  },
  {
    id: 'emerald-forest',
    name: 'الزمرد الأخضر (واحة خضراء) 🌲',
    bg: 'bg-stone-950',
    primary: 'border-emerald-500 text-emerald-400',
    accent: '#10b981',
    colors: ['#10b981', '#047857', '#0c1610', '#6ee7b7'],
    category: 'nature'
  }
];

export interface WallpaperDefinition {
  id: string;
  name: string;
  category: 'light' | 'dark' | 'pattern';
  preview: string;
  badge?: string;
  textColor?: string;
}

export const WALLPAPERS_LIST: WallpaperDefinition[] = [
  // --- خلفيات فاتحة مريحة للعين (Light Wallpapers) ---
  {
    id: 'light-pure',
    name: 'أبيض لؤلؤي ناصع 🕊️',
    category: 'light',
    preview: 'bg-gradient-to-b from-slate-100 via-white to-slate-200',
    badge: 'فاتحة نقية',
    textColor: 'text-slate-800'
  },
  {
    id: 'light-paper',
    name: 'ورق بردي عاجي كلاسيكي 📜',
    category: 'light',
    preview: 'bg-[#faf6ee] bg-[radial-gradient(#d6cbb5_1px,transparent_1px)] [background-size:12px_12px]',
    badge: 'تراثي دافئ',
    textColor: 'text-stone-900'
  },
  {
    id: 'light-clouds',
    name: 'سحاب وسماء هادئة ☁️',
    category: 'light',
    preview: 'bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100',
    badge: 'سماوي منعش',
    textColor: 'text-slate-800'
  },
  {
    id: 'light-sand',
    name: 'رمال الشاطئ الذهبية 🏖️',
    category: 'light',
    preview: 'bg-gradient-to-tr from-amber-100 via-orange-50 to-yellow-100',
    badge: 'ذهبي فاتح',
    textColor: 'text-amber-950'
  },
  {
    id: 'light-mint',
    name: 'واحة النعناع الباردة 🌿',
    category: 'light',
    preview: 'bg-gradient-to-b from-emerald-100 via-teal-50 to-green-100',
    badge: 'نعناع هادئ',
    textColor: 'text-emerald-950'
  },
  {
    id: 'light-lavender',
    name: 'شفق اللافندر العطري 🪻',
    category: 'light',
    preview: 'bg-gradient-to-tr from-purple-100 via-pink-50 to-indigo-100',
    badge: 'لافندر ناعم',
    textColor: 'text-purple-950'
  },
  {
    id: 'light-geometric',
    name: 'شبكة هندسية بيضاء 📐',
    category: 'pattern',
    preview: 'bg-slate-100 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] bg-[size:16px_16px]',
    badge: 'هندسي فاتح',
    textColor: 'text-slate-800'
  },
  {
    id: 'light-rose',
    name: 'زهر الياقوت والورد 🌸',
    category: 'light',
    preview: 'bg-gradient-to-b from-rose-100 via-pink-50 to-stone-100',
    badge: 'وردي ناعم',
    textColor: 'text-rose-950'
  },

  // --- خلفيات غامقة ملكية وفخمة (Dark Wallpapers) ---
  {
    id: 'default',
    name: 'سادة هادئ (فحمي ناعم) 🌑',
    category: 'dark',
    preview: 'bg-slate-950',
    badge: 'افتراضي فخم',
    textColor: 'text-slate-100'
  },
  {
    id: 'stars',
    name: 'ليل النجوم والمجرة 🌌',
    category: 'dark',
    preview: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-slate-950 to-black',
    badge: 'مجرة كونية',
    textColor: 'text-slate-100'
  },
  {
    id: 'desert',
    name: 'كثبان الرمال والصحراء 🏜️',
    category: 'dark',
    preview: 'bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-amber-950 via-stone-950 to-slate-950',
    badge: 'صحراء ليلية',
    textColor: 'text-slate-100'
  },
  {
    id: 'arabesque',
    name: 'نقوش وزخارف إسلامية 🕌',
    category: 'pattern',
    preview: 'bg-slate-950 bg-[radial-gradient(#475569_1px,transparent_1px)] [background-size:16px_16px]',
    badge: 'زخارف إسلامية',
    textColor: 'text-slate-100'
  },
  {
    id: 'luxury-wood',
    name: 'مجلس الخشب الفاخر 🪵',
    category: 'dark',
    preview: 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-stone-900 via-stone-950 to-black',
    badge: 'خشب الماهوجني',
    textColor: 'text-slate-100'
  },
  {
    id: 'cyber-grid',
    name: 'شبكة السايبر نيون 🌐',
    category: 'pattern',
    preview: 'bg-slate-950 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:20px_20px]',
    badge: 'سايبر مستقبلي',
    textColor: 'text-slate-100'
  },
  {
    id: 'dark-obsidian',
    name: 'أوبسيديان الذهب الأسود 👑',
    category: 'dark',
    preview: 'bg-[#09080d] bg-[radial-gradient(ellipse_at_top,_#451a03_0%,transparent_70%)]',
    badge: 'ذهب أسود 24K',
    textColor: 'text-amber-200'
  },
  {
    id: 'dark-emerald',
    name: 'غابة الزمرد الملكية 🌲',
    category: 'dark',
    preview: 'bg-[#02150d] bg-[radial-gradient(ellipse_at_bottom,_#064e3b_0%,transparent_70%)]',
    badge: 'زمرد عميق',
    textColor: 'text-emerald-100'
  },
  {
    id: 'dark-sapphire',
    name: 'أعماق الياقوت الأزرق 🌊',
    category: 'dark',
    preview: 'bg-[#030c18] bg-[radial-gradient(ellipse_at_center,_#1e3a8a_0%,transparent_70%)]',
    badge: 'ياقوت كحلي',
    textColor: 'text-blue-100'
  },
  {
    id: 'dark-dam-ghazal',
    name: 'دم الغزال المخملي 🦌',
    category: 'dark',
    preview: 'bg-[#180309] bg-[radial-gradient(ellipse_at_top,_#881337_0%,transparent_70%)]',
    badge: 'عنابي إمبراطوري',
    textColor: 'text-rose-100'
  }
];

export const FONTS_LIST = [
  { id: 'Noto Naskh Arabic', name: 'خط النسخ العادي (Naskh) - المعتمد والأصيل', family: "'Noto Naskh Arabic', sans-serif" },
  { id: 'Cairo', name: 'خط القاهرة (Cairo) - الأصلي المعتمد', family: "'Cairo', sans-serif" },
  { id: 'Tajawal', name: 'خط تجوال (Tajawal) - حديث وأنيق', family: "'Tajawal', sans-serif" },
  { id: 'Almarai', name: 'خط المراعي (Almarai) - ناعم ومريح', family: "'Almarai', sans-serif" },
  { id: 'Amiri', name: 'خط أميري (Amiri) - كلاسيكي للشعر والأدب', family: "'Amiri', serif" },
  { id: 'Aref Ruqaa', name: 'خط الرقعة (Aref Ruqaa) - أصيل وتراثي', family: "'Aref Ruqaa', cursive" },
];

export const BUBBLE_STYLES = [
  { id: 'modern', name: 'عصرية ناعمة (Modern Rounded)', desc: 'حواف مستديرة ناعمة مع ظلال خفيفة وتنسيق أنيق', icon: '✨' },
  { id: 'pill', name: 'كبسولة انسيابية (Pill Smooth)', desc: 'حواف دائرية كبسولية بالكامل فائقة النعومة', icon: '💊' },
  { id: 'classic', name: 'كلاسيكية مؤطرة (Bordered Solid)', desc: 'إطار بارز وواضح بتحديد كلاسيكي صلب', icon: '🖼️' },
  { id: 'glass', name: 'زجاجية بلورية (Glassmorphism)', desc: 'خلفية شفافة بلورية وتأثير زجاجي راقي', icon: '🪟' },
  { id: 'sharp', name: 'عصرية زوايا حادة (Sharp Modern)', desc: 'تصميم هندسي متقاطع بزوايا غير متماثلة', icon: '📐' },
  { id: 'speech', name: 'فقاعة حوار ناطقة (Speech Bubble)', desc: 'شكل فقاعة المحادثة الكلاسيكية مع ذيل اتجاهي', icon: '💬' },
  { id: 'neon', name: 'توهج نيون (Neon Glow)', desc: 'وهج كهربائي مضيء في الأطراف وظلال مشعة', icon: '⚡' },
  { id: 'compact', name: 'مدمجة مقتضبة (Compact Snug)', desc: 'تصميم مضغوط موفر للمساحة بدون حشوات إضافية', icon: '📱' },
  { id: 'royal-gold', name: 'ذهب ملكي مذهب (Royal Gold Shimmer)', desc: 'إطار ذهبي متوهج مع تدرج عسلي فخم', icon: '👑' },
];

export const ThemeAndWallpaperCenter: React.FC<ThemeAndWallpaperCenterProps> = ({
  isOpen,
  onClose,
  activeTheme,
  onChangeTheme,
  activeWallpaper,
  onChangeWallpaper,
  fontFamily,
  onChangeFontFamily,
  chatFontSize,
  onChangeFontSize,
  bubbleStyle,
  onChangeBubbleStyle,
  nameColor = '#d97706',
  onChangeNameColor,
  textColor = '#0f172a',
  onChangeTextColor,
  eyeComfort,
  onToggleEyeComfort,
  soundVolume,
  onChangeSoundVolume,
  particlesEnabled,
  onToggleParticles,
  currentUserRole,
  onApplyGlobalAppearance,
  onShowToast
}) => {
  if (!isOpen) return null;

  const [themeCategory, setThemeCategory] = React.useState<'all' | 'gold' | 'royal' | 'classic' | 'nature'>('all');
  const [wallpaperCategory, setWallpaperCategory] = React.useState<'all' | 'light' | 'dark' | 'pattern'>('all');

  const filteredWallpapers = WALLPAPERS_LIST.filter((wp) => {
    if (wallpaperCategory === 'all') return true;
    return wp.category === wallpaperCategory;
  });

  const filteredThemes = THEMES_LIST.filter((th) => {
    if (themeCategory === 'all') return true;
    if (themeCategory === 'gold') return th.isGold || th.category === 'gold';
    return th.category === themeCategory;
  });

  const PRESET_NAME_COLORS = [
    { name: 'الذهب الخالص 24K', color: '#fbbf24' },
    { name: 'ذهب دبي الساطع', color: '#facc15' },
    { name: 'شامبانيا ملكية', color: '#fde047' },
    { name: 'الذهبي الملكي', color: '#d97706' },
    { name: 'العنبر الساطع', color: '#f59e0b' },
    { name: 'دم الغزال العنابي', color: '#be123c' },
    { name: 'الزمرد الأخضر', color: '#059669' },
    { name: 'الفيروزي السلطاني', color: '#06b6d4' },
    { name: 'الأزرق النيلي', color: '#2563eb' },
    { name: 'البنفسجي الملكي', color: '#9333ea' },
    { name: 'الوردي الزهري', color: '#ec4899' },
    { name: 'الأبيض الناصع', color: '#f8fafc' },
    { name: 'الأسود الفاحم', color: '#0f172a' },
  ];

  const PRESET_TEXT_COLORS = [
    { name: 'عاجي مذهب ملكي', color: '#fef3c7' },
    { name: 'ذهب لؤلؤي ساطع', color: '#fef9c3' },
    { name: 'شامبانيا ناصعة', color: '#fefce8' },
    { name: 'كهرمان ذهبي دافئ', color: '#fed7aa' },
    { name: 'الأسود الليلي', color: '#0f172a' },
    { name: 'الرمادي الداكن', color: '#334155' },
    { name: 'البني الموكا', color: '#78350f' },
    { name: 'العنابي الداكن', color: '#881337' },
    { name: 'الكحلي الداكن', color: '#1e3a8a' },
    { name: 'الذهبي الداكن', color: '#b45309' },
    { name: 'الأبيض الناصع', color: '#ffffff' },
  ];

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fade-in"
      dir="rtl"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-950/70 via-slate-900 to-yellow-950/70 border-b border-amber-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                مركز الثيمات، الخلفيات والمظهر البصري
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                  {THEMES_LIST.length} ثيماً • 5 استايلات ذهبية ملكية
                </span>
              </h2>
              <p className="text-xs text-slate-400">ثيمات ذهبية متكاملة بحقول مخصصة وخطوط متناسقة تمنحك فخامة استثنائية</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[calc(92vh-130px)] space-y-6">
          {/* 1. Theme Presets */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                ثيمك ومظهرك الشخصي (متعدد الألوان ومتناسق كلياً)
              </label>
              <span className="text-[11px] text-amber-400/90 font-medium">ينطبق على حسابك وواجهتك وحقولك فوراً ✓</span>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-xl mb-3 overflow-x-auto">
              <button
                type="button"
                onClick={() => setThemeCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  themeCategory === 'all'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🌟 جميع الثيمات ({THEMES_LIST.length})
              </button>
              <button
                type="button"
                onClick={() => setThemeCategory('gold')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                  themeCategory === 'gold'
                    ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                    : 'text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/30'
                }`}
              >
                <span>👑</span>
                <span>الثيمات الذهبية الملكية (5 استايلات)</span>
              </button>
              <button
                type="button"
                onClick={() => setThemeCategory('royal')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  themeCategory === 'royal'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🏛️ أندلسية وإمبراطورية
              </button>
              <button
                type="button"
                onClick={() => setThemeCategory('classic')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  themeCategory === 'classic'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🌌 ليلية وكلاسيكية
              </button>
              <button
                type="button"
                onClick={() => setThemeCategory('nature')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  themeCategory === 'nature'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🌿 الطبيعة والزمرد
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {filteredThemes.map((th) => {
                const isActive = activeTheme === th.id;
                return (
                  <button
                    key={th.id}
                    onClick={() => {
                      onChangeTheme(th.id);
                      if (th.recommendedFontColor && onChangeTextColor) {
                        onChangeTextColor(th.recommendedFontColor);
                      }
                      if (th.recommendedNameColor && onChangeNameColor) {
                        onChangeNameColor(th.recommendedNameColor);
                      }
                      onShowToast(`تم تطبيق ثيم: ${th.name}`, 'success');
                    }}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-between cursor-pointer relative group ${
                      isActive
                        ? 'bg-slate-800 border-amber-400 ring-2 ring-amber-400/70 shadow-lg shadow-amber-500/25'
                        : th.isGold
                        ? 'bg-gradient-to-b from-[#181308] to-[#0c0903] border-amber-500/50 hover:border-amber-400 hover:shadow-md'
                        : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {th.badge && (
                      <span className="absolute -top-2 right-2 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-500 text-slate-950 border border-amber-300 shadow-xs">
                        {th.badge}
                      </span>
                    )}

                    {/* Multi-color Palette Preview Swatch */}
                    <div className="flex items-center gap-1 mb-2 p-1 rounded-full bg-black/40 border border-white/10 shadow-inner">
                      {th.colors.map((c, idx) => (
                        <div
                          key={idx}
                          className="w-3.5 h-3.5 rounded-full shadow-xs border border-white/20"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>

                    <span className="text-[11px] font-bold text-slate-200 line-clamp-1">{th.name}</span>

                    {th.fieldDesc && (
                      <span className="text-[9px] text-amber-300/80 mt-1 line-clamp-1 font-medium">
                        {th.fieldDesc}
                      </span>
                    )}

                    {isActive ? (
                      <span className="mt-1.5 text-[10px] text-amber-400 font-extrabold flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> مفعل
                      </span>
                    ) : th.isGold ? (
                      <span className="mt-1 text-[9px] text-yellow-400/90 font-bold">
                        حقول + خط ذهبي
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Wallpapers */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span>خلفية مساحة المحادثة (خلفيات فاتحة وغامقة منوعة)</span>
              </label>

              {/* Wallpaper Category Tabs */}
              <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-700/60 overflow-x-auto text-[11px] font-bold">
                {[
                  { id: 'all', label: 'الكل' },
                  { id: 'light', label: '☀️ فاتحة ومريحة' },
                  { id: 'dark', label: '🌙 غامقة وملكية' },
                  { id: 'pattern', label: '🎨 نقوش وزخارف' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setWallpaperCategory(tab.id as any)}
                    className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                      wallpaperCategory === tab.id
                        ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {filteredWallpapers.map((wp) => {
                const isActive = activeWallpaper === wp.id;
                return (
                  <button
                    key={wp.id}
                    onClick={() => {
                      onChangeWallpaper(wp.id);
                      onShowToast(`تم تطبيق خلفية الشات: ${wp.name}`, 'success');
                    }}
                    className={`h-22 rounded-xl border p-2 flex flex-col justify-between text-right transition-all relative overflow-hidden cursor-pointer shadow-sm ${wp.preview} ${
                      isActive ? 'border-amber-400 ring-3 ring-amber-400/60 scale-[1.02]' : 'border-slate-700/80 hover:border-amber-500/50 hover:scale-[1.01]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      {wp.badge && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-950/70 text-amber-300 backdrop-blur-xs">
                          {wp.badge}
                        </span>
                      )}
                      {isActive && (
                        <div className="bg-amber-400 text-slate-950 rounded-full p-0.5 shadow-sm">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-white bg-slate-950/85 px-2 py-0.5 rounded-md inline-block truncate w-fit max-w-full drop-shadow-xs">
                      {wp.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Typography Font Family */}
          <div>
            <label className="text-xs font-bold text-slate-200 flex items-center gap-2 mb-3">
              <Type className="w-4 h-4 text-emerald-400" />
              الخط العربي المعتمد (Arabic Typography)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {FONTS_LIST.map((f) => {
                const isActive = fontFamily === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => {
                      onChangeFontFamily(f.id);
                      onShowToast(`تم تغيير الخط إلى: ${f.name}`, 'success');
                    }}
                    style={{ fontFamily: f.family }}
                    className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between text-sm ${
                      isActive
                        ? 'bg-emerald-950/30 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-slate-800/60 border-slate-700 text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span>{f.name}</span>
                    {isActive && <Check className="w-4 h-4 text-emerald-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Font Size & Bubble Style */}
          <div className="space-y-4">
            {/* Font Size */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3.5 space-y-2">
              <label className="text-xs font-bold text-slate-300 block">حجم خط الرسائل:</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'sm', label: 'صغير' },
                  { id: 'base', label: 'متوسط' },
                  { id: 'lg', label: 'كبير' },
                  { id: 'xl', label: 'ضخم' },
                ].map((sz) => (
                  <button
                    key={sz.id}
                    onClick={() => onChangeFontSize(sz.id as any)}
                    className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      chatFontSize === sz.id
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                    }`}
                  >
                    {sz.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bubble Style - Multiple Rich Styles with Live Mini Mockup */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>شكل وتصميم فقاعات الرسائل (اختر النمط المناسب لك):</span>
                </label>
                <span className="text-[10px] text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30 font-bold">
                  {BUBBLE_STYLES.find((b) => b.id === bubbleStyle)?.name.split('(')[0] || 'عصرية ناعمة'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {BUBBLE_STYLES.map((b) => {
                  const isCur = bubbleStyle === b.id;
                  return (
                    <button
                      key={b.id}
                      onClick={() => {
                        onChangeBubbleStyle(b.id);
                        onShowToast(`تم اختيار شكل الفقاعة: ${b.name.split('(')[0]}`, 'success');
                      }}
                      className={`p-2.5 rounded-xl border text-right transition-all flex flex-col justify-between gap-1.5 cursor-pointer ${
                        isCur
                          ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/50 text-amber-200 shadow-md'
                          : 'bg-slate-900/60 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold flex items-center gap-1">
                          <span>{b.icon}</span>
                          <span>{b.name}</span>
                        </span>
                        {isCur && <Check className="w-3.5 h-3.5 text-amber-400 stroke-[3]" />}
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1">{b.desc}</p>

                      {/* Mini Live Preview */}
                      <div className="pt-1 border-t border-white/5 flex items-center justify-between w-full">
                        <span className="text-[9px] text-slate-500">معاينة:</span>
                        <div
                          className={`text-[10px] px-2 py-0.5 font-medium ${
                            b.id === 'pill'
                              ? 'rounded-full bg-amber-500/30 text-amber-200 border border-amber-400/50'
                              : b.id === 'classic'
                              ? 'rounded-xs bg-slate-800 border-2 border-slate-400 text-slate-200'
                              : b.id === 'glass'
                              ? 'rounded-lg bg-white/20 backdrop-blur-md border border-white/30 text-white'
                              : b.id === 'sharp'
                              ? 'rounded-tl-lg rounded-br-lg rounded-tr-xs rounded-bl-xs bg-sky-950/80 border-r-2 border-sky-400 text-sky-200'
                              : b.id === 'speech'
                              ? 'rounded-lg rounded-tr-xs bg-amber-950/80 border border-amber-500/50 text-amber-200'
                              : b.id === 'neon'
                              ? 'rounded-xl border border-amber-400 shadow-xs shadow-amber-400/50 text-amber-300'
                              : b.id === 'compact'
                              ? 'rounded-xs py-0 px-1 text-[9px] bg-slate-800 border border-slate-600 text-slate-200'
                              : b.id === 'royal-gold'
                              ? 'rounded-xl border-2 border-amber-400 bg-amber-500/30 text-yellow-300 font-bold'
                              : 'rounded-xl bg-slate-800 border border-slate-600 text-slate-200'
                          }`}
                        >
                          أهلاً بكم في الصقور 🦅
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 5. Name and Chat Text Colors (ألوان الاسم ولون خط الرسائل - حفظ دائم) */}
          <div className="bg-slate-800/50 border border-amber-500/40 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
              <label className="text-xs font-bold text-amber-300 flex items-center gap-2">
                <Palette className="w-4 h-4 text-amber-400" />
                ألوان الاسم ولون خط الرسائل (تخصيص وحفظ دائم)
              </label>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                ✓ يظل محفوظاً دائماً ولا يعود للافتراضي
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name Color Control */}
              <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">لون اسمك في الشات:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={nameColor}
                      onChange={(e) => {
                        const col = e.target.value;
                        if (onChangeNameColor) onChangeNameColor(col);
                        onShowToast('تم حفظ لون الاسم بنجاح 👑', 'success');
                      }}
                      className="w-7 h-7 cursor-pointer rounded border border-slate-500 p-0.5 bg-slate-800"
                      title="اختر لون اسم مخصص"
                    />
                    <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-black/60 border border-white/10" style={{ color: nameColor }}>
                      معاينة الاسم
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-1.5 pt-1">
                  {PRESET_NAME_COLORS.map((p) => (
                    <button
                      key={p.color}
                      type="button"
                      onClick={() => {
                        if (onChangeNameColor) onChangeNameColor(p.color);
                        onShowToast(`تم اختيار لون الاسم: ${p.name}`, 'success');
                      }}
                      className={`h-7 rounded-lg border flex items-center justify-center transition-transform hover:scale-105 cursor-pointer ${
                        nameColor.toLowerCase() === p.color.toLowerCase() ? 'ring-2 ring-white border-white scale-105' : 'border-white/20'
                      }`}
                      style={{ backgroundColor: p.color }}
                      title={p.name}
                    >
                      {nameColor.toLowerCase() === p.color.toLowerCase() && <Check className="w-3 h-3 text-white drop-shadow-md" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Text Color Control */}
              <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">لون خط كتابة الرسائل:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => {
                        const col = e.target.value;
                        if (onChangeTextColor) onChangeTextColor(col);
                        onShowToast('تم حفظ لون خط الرسائل بنجاح ✍️', 'success');
                      }}
                      className="w-7 h-7 cursor-pointer rounded border border-slate-500 p-0.5 bg-slate-800"
                      title="اختر لون خط مخصص"
                    />
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-black/60 border border-white/10" style={{ color: textColor }}>
                      معاينة الخط
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {PRESET_TEXT_COLORS.map((p) => (
                    <button
                      key={p.color}
                      type="button"
                      onClick={() => {
                        if (onChangeTextColor) onChangeTextColor(p.color);
                        onShowToast(`تم اختيار لون الخط: ${p.name}`, 'success');
                      }}
                      className={`h-7 rounded-lg border flex items-center justify-center transition-transform hover:scale-105 cursor-pointer ${
                        textColor.toLowerCase() === p.color.toLowerCase() ? 'ring-2 ring-white border-white scale-105' : 'border-white/20'
                      }`}
                      style={{ backgroundColor: p.color }}
                      title={p.name}
                    >
                      {textColor.toLowerCase() === p.color.toLowerCase() && <Check className="w-3 h-3 text-white drop-shadow-md" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 6. Comfort, Sound & Performance Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Eye Comfort */}
            <button
              onClick={onToggleEyeComfort}
              className={`p-3 rounded-xl border flex items-center justify-between text-right transition-all ${
                eyeComfort
                  ? 'bg-amber-950/40 border-amber-500/50 text-amber-300'
                  : 'bg-slate-800/40 border-slate-700 text-slate-400'
              }`}
            >
              <div>
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  فلتر حماية العين (Warm Tint)
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">تقليل الضوء الأزرق المجهد</div>
              </div>
              <div className={`w-4 h-4 rounded-full flex items-center justify-center ${eyeComfort ? 'bg-amber-500 text-black' : 'bg-slate-700'}`}>
                {eyeComfort && <Check className="w-3 h-3" />}
              </div>
            </button>

            {/* Particles Toggle */}
            <button
              onClick={onToggleParticles}
              className={`p-3 rounded-xl border flex items-center justify-between text-right transition-all ${
                particlesEnabled
                  ? 'bg-purple-950/40 border-purple-500/50 text-purple-300'
                  : 'bg-slate-800/40 border-slate-700 text-slate-400'
              }`}
            >
              <div>
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  مؤثرات الاحتفال والشرر
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">كونفيتي ورسوم حركية</div>
              </div>
              <div className={`w-4 h-4 rounded-full flex items-center justify-center ${particlesEnabled ? 'bg-purple-500 text-white' : 'bg-slate-700'}`}>
                {particlesEnabled && <Check className="w-3 h-3" />}
              </div>
            </button>

            {/* Sound Volume Control */}
            <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1">
                <span className="flex items-center gap-1.5">
                  {soundVolume > 0 ? <Volume2 className="w-3.5 h-3.5 text-indigo-400" /> : <VolumeX className="w-3.5 h-3.5 text-rose-400" />}
                  مستوى صوت التنبيهات
                </span>
                <span className="font-mono text-amber-400">{soundVolume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={soundVolume}
                onChange={(e) => onChangeSoundVolume(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>التفضيلات محفوظة تلقائياً في متصفحك</span>
          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
          >
            تم وإغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
