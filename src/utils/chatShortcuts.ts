/**
 * Chat Shortcuts Engine (نظام اختصارات الشات الذكية والاستبدال التلقائي)
 * يقوم باستبدال رموز الاختصارات (مثل: "نورت" ➔ "نورت الشات بطلتك الحلوه" أو "ن" ➔ "نورتو يالي دخلتو")
 * تلقائياً عند الإرسال سواء في الشات العام أو الخاص.
 */

export interface ChatShortcut {
  id: string;
  trigger: string;
  replacement: string;
  createdBy?: string;
  createdAt: number;
}

export const DEFAULT_PRESET_SHORTCUTS: Array<{ trigger: string; replacement: string; label: string }> = [
  {
    trigger: 'نورت',
    replacement: 'نورت الشات بطلتك الحلوه 🌹✨',
    label: 'ترحيب دافئ بطلة العضو'
  },
  {
    trigger: 'ن',
    replacement: 'نورتو يالي دخلتو 🌟',
    label: 'ترحيب سريع بالداخلين'
  },
  {
    trigger: 'سلام',
    replacement: 'وعليكم السلام ورحمة الله وبركاته، أهلاً وسهلاً بك 🤍',
    label: 'رد السلام الرسمي'
  },
  {
    trigger: 'ولكم',
    replacement: 'أهلاً وسهلاً ومرحباً بكم شرفتم المجلس 👑',
    label: 'ترحيب بالضيوف'
  },
  {
    trigger: 'ص',
    replacement: 'صباح الخير والياسمين وراحة البال ☕🌸',
    label: 'تحية صباحية'
  },
  {
    trigger: 'م',
    replacement: 'مساء النور والسرور والورد والفل 🌙💫',
    label: 'تحية مسائية'
  },
  {
    trigger: 'برب',
    replacement: 'برب قليل وراجع بإذن الله، استأذنكم لحظات ⏱️',
    label: 'استئذان مؤقت'
  },
  {
    trigger: 'باك',
    replacement: 'باك أسعد الله أوقاتكم بكل خير جميعاً 🎉',
    label: 'عودة بعد الغياب'
  },
  {
    trigger: 'كفو',
    replacement: 'كفو والله بيض الله وجهك وما قصرت 🦅👏',
    label: 'مدح وتقدير'
  }
];

/**
 * Expands shortcuts in a message string.
 * Supports:
 * 1. Exact match (message is trimmed shortcut, e.g. "نورت" or "ن")
 * 2. Word boundary match (standalone token in sentence e.g. "يا هلا نورت اخي" -> "يا هلا نورت الشات بطلتك الحلوه اخي")
 */
export function expandClientShortcuts(rawText: string, shortcutsList: ChatShortcut[]): string {
  if (!rawText || !shortcutsList || shortcutsList.length === 0) return rawText;

  let result = rawText;

  // Sort descending by trigger length so longer triggers match first
  const sorted = [...shortcutsList].sort((a, b) => b.trigger.length - a.trigger.length);

  for (const sc of sorted) {
    const trigger = sc.trigger?.trim();
    const replacement = sc.replacement?.trim();
    if (!trigger || !replacement) continue;

    // 1. Direct exact match
    if (result.trim() === trigger) {
      result = replacement;
      continue;
    }

    // 2. Token / word boundary matching (surrounded by whitespace, punctuation, quotes)
    try {
      const escaped = trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(^|[\\s،,.:;!؟?\\-_"'\`()[\\]{}«»])(${escaped})($|[\\s،,.:;!؟?\\-_"'\`()[\\]{}«»])`, 'g');
      result = result.replace(regex, `$1${replacement}$3`);
    } catch {
      // Fallback
      if (result.includes(trigger)) {
        result = result.split(trigger).join(replacement);
      }
    }
  }

  return result;
}

/**
 * Checks if current input text matches any shortcut trigger (for live UI preview pill).
 */
export function findMatchingShortcut(rawText: string, shortcutsList: ChatShortcut[]): ChatShortcut | null {
  if (!rawText || !shortcutsList || shortcutsList.length === 0) return null;
  const trimmed = rawText.trim();
  if (!trimmed) return null;

  // Check exact match
  const exact = shortcutsList.find((s) => s.trigger.trim().toLowerCase() === trimmed.toLowerCase());
  if (exact) return exact;

  // Check if ends with a shortcut token (e.g. user typed "... نورت")
  const lastWord = trimmed.split(/[\s،,.:;!؟?]+/).pop();
  if (lastWord) {
    const wordMatch = shortcutsList.find((s) => s.trigger.trim().toLowerCase() === lastWord.toLowerCase());
    if (wordMatch) return wordMatch;
  }

  return null;
}
