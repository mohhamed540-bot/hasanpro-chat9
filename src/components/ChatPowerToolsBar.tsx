import React, { useState } from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Highlighter,
  Feather,
  Search,
  Pin,
  Volume2,
  Smile,
  Sparkles,
  Check,
  X,
  MessageSquare
} from 'lucide-react';

export interface ChatPowerToolsBarProps {
  onInsertFormat: (prefix: string, suffix?: string) => void;
  onSendQuickGreeting: (text: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  pinnedMessage?: {
    id: string;
    username: string;
    text: string;
  } | null;
  onUnpinMessage?: () => void;
  isPoetryMode: boolean;
  onTogglePoetryMode: () => void;
  onShowToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export const CANNED_GREETINGS = [
  'السلام عليكم ورحمة الله وبركاته 🌹',
  'أهلاً ومرحباً بالجميع، نورتوا المجلس 🦅',
  'صح لسانك وعلا شانك، كفو 👏',
  'تفضلوا تقهوا معنا، يا هلا وسهلا ☕',
  'بيض الله وجهك على هذا الكلام الطيب 👑',
  'نستأذنكم دقائق وراجعين للمجلس ⏳'
];

export const ChatPowerToolsBar: React.FC<ChatPowerToolsBarProps> = ({
  onInsertFormat,
  onSendQuickGreeting,
  searchQuery,
  onSearchChange,
  pinnedMessage,
  onUnpinMessage,
  isPoetryMode,
  onTogglePoetryMode,
  onShowToast
}) => {
  const [showGreetingsMenu, setShowGreetingsMenu] = useState(false);
  const [showSearchBox, setShowSearchBox] = useState(false);

  return (
    <div className="w-full space-y-1.5" dir="rtl">
      {/* 1. Pinned Message Banner (If Any) */}
      {pinnedMessage && (
        <div className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/70 border border-amber-500/40 rounded-xl p-2.5 flex items-center justify-between shadow-lg animate-fade-in">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Pin className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs truncate">
              <span className="text-amber-400 font-bold ml-1.5">رسالة مثبتة من @{pinnedMessage.username}:</span>
              <span className="text-slate-200">{pinnedMessage.text}</span>
            </div>
          </div>
          {onUnpinMessage && (
            <button
              onClick={onUnpinMessage}
              className="text-slate-400 hover:text-rose-400 p-1 rounded-md transition-colors shrink-0"
              title="فك تثبيت الرسالة"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* 2. Message Search Box (Expandable) */}
      {showSearchBox && (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-2 flex items-center gap-2 animate-fade-in shadow-md">
          <Search className="w-4 h-4 text-amber-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="بحث فوري في الرسائل والأسماء..."
            className="flex-1 bg-transparent text-xs text-white focus:outline-none placeholder:text-slate-500"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="text-xs text-slate-400 hover:text-white px-1.5"
            >
              مسح
            </button>
          )}
          <button
            onClick={() => {
              setShowSearchBox(false);
              onSearchChange('');
            }}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. Text Formatting and Quick Actions Toolbar */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1.5 backdrop-blur-sm text-xs text-slate-300">
        {/* Left Formatting Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onInsertFormat('**', '**')}
            title="نص عريض (Bold)"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onInsertFormat('*', '*')}
            title="نص مائل (Italic)"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onInsertFormat('~~', '~~')}
            title="نص مشطوب (Strikethrough)"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onInsertFormat('`', '`')}
            title="كود برمجي أو اقتباس مميز"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onInsertFormat('==', '==')}
            title="تمييز بلون أصفر فاقع"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
          >
            <Highlighter className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-3.5 bg-slate-800 mx-1" />

          {/* Poetry Mode Toggle */}
          <button
            type="button"
            onClick={onTogglePoetryMode}
            title="وضع كتابة الشعر العربي المنظم"
            className={`px-2 py-1 rounded-lg flex items-center gap-1 transition-all ${
              isPoetryMode
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Feather className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px]">وضع القصائد</span>
          </button>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-1.5 relative">
          {/* Quick Greetings Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowGreetingsMenu(!showGreetingsMenu)}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-[11px] font-semibold flex items-center gap-1 border border-slate-750 transition-colors"
            >
              <MessageSquare className="w-3 h-3 text-emerald-400" />
              <span>ردود سريعة</span>
            </button>

            {showGreetingsMenu && (
              <div className="absolute bottom-full left-0 mb-2 w-64 bg-slate-900 border border-slate-750 rounded-xl shadow-2xl p-1.5 space-y-1 z-30 animate-fade-in">
                <div className="text-[10px] text-slate-400 px-2 py-1 font-semibold border-b border-slate-800">
                  نماذج الردود والترحيب الفوري
                </div>
                {CANNED_GREETINGS.map((msg, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      onSendQuickGreeting(msg);
                      setShowGreetingsMenu(false);
                      onShowToast('تم إرسال الرد السريع!', 'success');
                    }}
                    className="w-full text-right px-2.5 py-1.5 rounded-lg text-[11px] text-slate-200 hover:bg-slate-800 hover:text-amber-300 transition-colors flex items-center justify-between"
                  >
                    <span className="truncate">{msg}</span>
                    <span className="text-[10px] text-slate-500">إرسال</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search Toggle */}
          <button
            type="button"
            onClick={() => setShowSearchBox(!showSearchBox)}
            title="بحث في المحادثة"
            className={`p-1.5 rounded-lg transition-colors ${
              showSearchBox || searchQuery ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
