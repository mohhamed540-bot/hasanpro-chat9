import React, { useState } from 'react';
import {
  Award,
  Sparkles,
  Flame,
  Crown,
  Heart,
  Star,
  Shield,
  Palette,
  Check,
  Calendar,
  Gift,
  Smile,
  Users,
  Copy,
  UserCheck,
  Zap,
  TrendingUp,
  X
} from 'lucide-react';
import confetti from '../utils/confetti';

export interface IdentityProfileStudioProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    id: string;
    username: string;
    role: string;
    likes: number;
    points: number;
    statusQuote: string;
    avatarUrl?: string;
    flag: string;
    room?: string;
  };
  activeFrame: string;
  onChangeFrame: (frame: string) => void;
  userMood: string;
  onChangeMood: (mood: string) => void;
  nameGradient: string;
  onChangeNameGradient: (gradient: string) => void;
  onUpdateStatusQuote: (quote: string) => void;
  onAddPoints: (amount: number, reason: string) => void;
  onShowToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export const IdentityProfileStudio: React.FC<IdentityProfileStudioProps> = ({
  isOpen,
  onClose,
  currentUser,
  activeFrame,
  onChangeFrame,
  userMood,
  onChangeMood,
  nameGradient,
  onChangeNameGradient,
  onUpdateStatusQuote,
  onAddPoints,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'frames' | 'mood' | 'name' | 'badges' | 'streak' | 'friends'>('frames');
  const [newQuote, setNewQuote] = useState(currentUser.statusQuote || '');
  const [dailyStreakDay, setDailyStreakDay] = useState(4);
  const [streakClaimedToday, setStreakClaimedToday] = useState(false);

  // VIP Friends Demo
  const [friendsList, setFriendsList] = useState<string[]>(['أبو صقر', 'أميرة الصمت', 'فارس قريش']);
  const [friendNameInput, setFriendNameInput] = useState('');

  // Calculate Level based on points
  const userLevel = Math.max(1, Math.floor(currentUser.points / 100) + 1);
  const nextLevelPoints = userLevel * 100;
  const currentLevelProgress = currentUser.points % 100;

  // Available Avatar Frames
  const FRAMES = [
    { id: 'none', name: 'بدون إطار', style: 'border-2 border-slate-700' },
    { id: 'falcon-gold', name: 'الصقر الذهبي الملكي', style: 'ring-4 ring-amber-400 ring-offset-2 ring-offset-slate-900 shadow-lg shadow-amber-500/40' },
    { id: 'emerald-royal', name: 'الزمرد الأخضر الفاخر', style: 'ring-4 ring-emerald-400 ring-offset-2 ring-offset-slate-900 shadow-lg shadow-emerald-500/40' },
    { id: 'flame-fire', name: 'لهب التفاعل الناري', style: 'ring-4 ring-rose-500 ring-offset-2 ring-offset-slate-900 shadow-lg shadow-rose-500/40 animate-pulse' },
    { id: 'cyber-neon', name: 'السايبر نيون السحابي', style: 'ring-4 ring-cyan-400 ring-offset-2 ring-offset-slate-900 shadow-lg shadow-cyan-500/40' },
    { id: 'ramadan-crescent', name: 'هلال البركة والنور', style: 'ring-4 ring-purple-400 ring-offset-2 ring-offset-slate-900 shadow-lg shadow-purple-500/40' },
    { id: 'star-legend', name: 'نجم الأساطير الذهبي', style: 'ring-4 ring-yellow-300 ring-offset-2 ring-offset-slate-900 shadow-lg shadow-yellow-400/50' }
  ];

  // Moods
  const MOODS = [
    { id: 'مروق قهوة ☕', icon: '☕', label: 'مروق قهوة عربية' },
    { id: 'في صيد صقور 🦅', icon: '🦅', label: 'في صيد ومقناص' },
    { id: 'يستمع للشعر 📜', icon: '📜', label: 'يستمع للقصائد' },
    { id: 'شاعر المجلس ✍️', icon: '✍️', label: 'شاعر وكاتب خواطر' },
    { id: 'ملك الساحة 👑', icon: '👑', label: 'ملك الساحة' },
    { id: 'طاقة ونشاط 🔥', icon: '🔥', label: 'شعلة نشاط وحماس' },
    { id: 'مستمع هادئ 🎧', icon: '🎧', label: 'مستمع في الصمت' },
    { id: 'سهران ومستانس 🌙', icon: '🌙', label: 'سهرة وسعادة' },
  ];

  // Name Gradients
  const GRADIENTS = [
    { id: 'from-amber-400 to-yellow-200', name: 'الذهب الخالص', preview: 'bg-gradient-to-r from-amber-400 to-yellow-200' },
    { id: 'from-rose-400 to-amber-300', name: 'الياقوت والغروب', preview: 'bg-gradient-to-r from-rose-400 to-amber-300' },
    { id: 'from-emerald-400 to-teal-200', name: 'الزمرد الملكي', preview: 'bg-gradient-to-r from-emerald-400 to-teal-200' },
    { id: 'from-cyan-400 to-blue-400', name: 'أمواج الخليج', preview: 'bg-gradient-to-r from-cyan-400 to-blue-400' },
    { id: 'from-purple-400 to-pink-400', name: 'الشفق البنفسجي', preview: 'bg-gradient-to-r from-purple-400 to-pink-400' },
    { id: 'from-white to-slate-300', name: 'الفضي النقي', preview: 'bg-gradient-to-r from-white to-slate-300' },
  ];

  // Honor Badges Collection
  const BADGES = [
    { id: 'falcon-crest', title: 'صقر حسان برو الأصيل', icon: '🦅', desc: 'شارة الفخر والانتماء لحسان برو', unlocked: true },
    { id: 'poet', title: 'شاعر المجلس', icon: '📜', desc: 'أبدع بأبيات وقصائد راقية', unlocked: currentUser.points >= 50 },
    { id: 'generous', title: 'كريم الدار (داعم)', icon: '💎', desc: 'أرسل أكثر من 10 هدايا للأعضاء', unlocked: currentUser.likes >= 10 },
    { id: 'night-owl', title: 'فارس السهر', icon: '🌙', desc: 'تواجد أكثر من 50 ساعة تفاعل', unlocked: true },
    { id: 'knight', title: 'فارس الأخلاق', icon: '🛡️', desc: 'سجل أمني ناصع بدون أي مخالفة', unlocked: true },
    { id: 'legend', title: 'أسطورة الشات', icon: '👑', desc: 'تجاوز المستوى 10 وجمع آلاف النقاط', unlocked: userLevel >= 10 }
  ];

  const handleClaimDailyReward = () => {
    if (streakClaimedToday) return;
    const bonus = 25 * dailyStreakDay;
    onAddPoints(bonus, `مكافأة تسجيل الدخول اليومي (اليوم ${dailyStreakDay})`);
    setStreakClaimedToday(true);
    confetti({ particleCount: 90, spread: 65 });
    onShowToast(`مبروك! استلمت مكافأة اليوم ${dailyStreakDay} (+${bonus} نقطة) 🎁`, 'success');
  };

  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendNameInput.trim()) return;
    if (friendsList.includes(friendNameInput.trim())) {
      onShowToast('هذا المستخدم مضاف بالفعل في قائمة أصدقائك المقربين', 'info');
      return;
    }
    setFriendsList((prev) => [...prev, friendNameInput.trim()]);
    onShowToast(`تمت إضافة @${friendNameInput.trim()} إلى قائمة أصدقائك VIP! ⭐`, 'success');
    setFriendNameInput('');
  };

  const handleRemoveFriend = (name: string) => {
    setFriendsList((prev) => prev.filter((n) => n !== name));
    onShowToast(`تمت إزالة ${name} من قائمة الأصدقاء المقربين`, 'info');
  };

  if (!isOpen) return null;

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
        <div className="p-4 bg-gradient-to-r from-purple-950/70 via-slate-900 to-amber-950/70 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-inner">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                استوديو الهوية الشخصية والرتب الشرفية
                <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full">
                  Level {userLevel}
                </span>
              </h2>
              <p className="text-xs text-slate-400">خصص إطار صورتك، ألوان اسمك، حالتك، وأوسمتك الشرفية</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Live Profile Card Preview */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800">
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-700/70 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {/* Avatar with current frame */}
              <div className="relative">
                <div
                  className={`w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-2xl overflow-hidden ${
                    FRAMES.find((f) => f.id === activeFrame)?.style || ''
                  }`}
                >
                  {currentUser.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>🦅</span>
                  )}
                </div>
                <div className="absolute -bottom-1 -left-1 text-sm bg-slate-900 border border-slate-700 rounded-full px-1">
                  {currentUser.flag || '🇸🇦'}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-base font-extrabold bg-gradient-to-r ${nameGradient} bg-clip-text text-transparent`}>
                    {currentUser.username}
                  </span>
                  <span className="text-xs">{userMood}</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md">
                    {currentUser.role === 'admin' ? 'مدير عام 👑' : currentUser.role === 'super' ? 'سوبر مشرف 🛡️' : 'عضو حسان برو 🦅'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] bg-indigo-950/70 text-indigo-300 border border-indigo-700/50 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                    <span>الغرفة الحالية:</span>
                    <strong className="text-white font-extrabold">{(!currentUser.room || currentUser.room === 'خارج الغرف' || currentUser.room.trim() === '') ? '' : currentUser.room}</strong>
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 italic">
                  "{newQuote || 'الصقر لا يلتفت لصياح الغربان'}"
                </p>
              </div>
            </div>

            {/* Level & XP bar */}
            <div className="w-full sm:w-48 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  المستوى {userLevel}
                </span>
                <span className="text-slate-400 font-mono">{currentLevelProgress} / 100 XP</span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500"
                  style={{ width: `${currentLevelProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/70 px-3 overflow-x-auto gap-1 py-1.5 scrollbar-none">
          {[
            { id: 'frames', label: 'إطارات الصورة', icon: Crown },
            { id: 'mood', label: 'المزاج والحالة', icon: Smile },
            { id: 'name', label: 'ألوان وتدرج الاسم', icon: Palette },
            { id: 'badges', label: 'الأوسمة الشرفية', icon: Award },
            { id: 'streak', label: 'المكافأة اليومية', icon: Calendar },
            { id: 'friends', label: 'الأصدقاء المقربون VIP', icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-purple-600 text-white font-bold shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto max-h-[calc(92vh-220px)] space-y-4">
          {/* TAB 1: Frames */}
          {activeTab === 'frames' && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300 block">اختر إطار رمزيتك الشخصية:</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {FRAMES.map((f) => {
                  const isSelected = activeFrame === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => {
                        onChangeFrame(f.id);
                        onShowToast(`تم تطبيق إطار: ${f.name}`, 'success');
                      }}
                      className={`p-3 rounded-xl border flex items-center gap-3 transition-all text-right ${
                        isSelected
                          ? 'bg-purple-950/40 border-purple-500 shadow-md shadow-purple-500/20'
                          : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-lg ${f.style}`}>
                        🦅
                      </div>
                      <div className="flex-1">
                        <div className={`text-xs font-bold ${isSelected ? 'text-purple-300' : 'text-slate-200'}`}>
                          {f.name}
                        </div>
                        {isSelected && <span className="text-[10px] text-emerald-400 font-semibold">مفعّل حالياً ✓</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Mood & Status Quote */}
          {activeTab === 'mood' && (
            <div className="space-y-4 max-w-xl mx-auto">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">اختر مزاجك الحالي:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {MOODS.map((m) => {
                    const isSelected = userMood === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          onChangeMood(m.id);
                          onShowToast(`تم تعيين الحالة: ${m.label}`, 'success');
                        }}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                            : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="text-xl mb-1">{m.icon}</div>
                        <div className="text-[11px]">{m.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">العبارة والاقتباس الشخصي (Bio):</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newQuote}
                    onChange={(e) => setNewQuote(e.target.value)}
                    placeholder="اكتب عبارتك التي تظهر في بروفايلك..."
                    maxLength={100}
                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={() => {
                      onUpdateStatusQuote(newQuote);
                      onShowToast('تم تحديث العبارة الشخصية بنجاح!', 'success');
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md"
                  >
                    حفظ
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Name Gradients */}
          {activeTab === 'name' && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300 block">اختر تدرج ألوان اسمك في المحادثة:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {GRADIENTS.map((g) => {
                  const isSelected = nameGradient === g.id;
                  return (
                    <button
                      key={g.id}
                      onClick={() => {
                        onChangeNameGradient(g.id);
                        onShowToast(`تم تطبيق تدرج: ${g.name}`, 'success');
                      }}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-slate-800 border-amber-500 shadow-md'
                          : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full ${g.preview} shadow-sm`} />
                        <span className={`text-sm font-extrabold bg-gradient-to-r ${g.id} bg-clip-text text-transparent`}>
                          {currentUser.username}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">{g.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: Badges */}
          {activeTab === 'badges' && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300 block">مجموعة الأوسمة والشارات الشرفية:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {BADGES.map((b) => (
                  <div
                    key={b.id}
                    className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                      b.unlocked
                        ? 'bg-slate-800/80 border-slate-700'
                        : 'bg-slate-900/40 border-slate-800/60 opacity-60'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-xl shrink-0">
                      {b.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white">{b.title}</h4>
                        {b.unlocked ? (
                          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">مكتسب ✓</span>
                        ) : (
                          <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">مغلق 🔒</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: Daily Streak */}
          {activeTab === 'streak' && (
            <div className="max-w-md mx-auto text-center space-y-4">
              <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 shadow-lg">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto text-2xl mb-2">
                  🔥
                </div>
                <h3 className="text-base font-bold text-white mb-1">سجل الحضور اليومي المستمر</h3>
                <p className="text-xs text-slate-400 mb-4">سجل دخولك كل يوم لتضاعف نقاطك ومكافآتك الذهبية</p>

                {/* Days Tracker */}
                <div className="grid grid-cols-7 gap-1.5 mb-5">
                  {[1, 2, 3, 4, 5, 6, 7].map((d) => {
                    const isPast = d < dailyStreakDay;
                    const isToday = d === dailyStreakDay;
                    return (
                      <div
                        key={d}
                        className={`p-2 rounded-xl border text-center flex flex-col items-center justify-between ${
                          isPast
                            ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400'
                            : isToday
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold animate-pulse'
                            : 'bg-slate-900 border-slate-800 text-slate-500'
                        }`}
                      >
                        <span className="text-[10px]">يوم {d}</span>
                        <span className="text-base my-1">{isPast ? '✓' : '🎁'}</span>
                        <span className="text-[9px] font-mono">+{d * 25}</span>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={handleClaimDailyReward}
                  disabled={streakClaimedToday}
                  className={`w-full py-3 rounded-xl font-bold text-xs shadow-lg transition-all ${
                    streakClaimedToday
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      : 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-amber-500/20'
                  }`}
                >
                  {streakClaimedToday ? 'تم استلام مكافأة اليوم بنجاح ✓' : `استلم مكافأة اليوم الرابع (+${dailyStreakDay * 25} نقطة) 🎉`}
                </button>
              </div>
            </div>
          )}

          {/* TAB 6: VIP Friends */}
          {activeTab === 'friends' && (
            <div className="max-w-lg mx-auto space-y-4">
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3.5">
                <form onSubmit={handleAddFriend} className="flex gap-2">
                  <input
                    type="text"
                    value={friendNameInput}
                    onChange={(e) => setFriendNameInput(e.target.value)}
                    placeholder="اكتب اسم العضو لإضافته لقائمة المقربين..."
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-md"
                  >
                    إضافة صديق VIP
                  </button>
                </form>
              </div>

              <div className="space-y-2">
                {friendsList.map((friend) => (
                  <div
                    key={friend}
                    className="p-3 bg-slate-800/70 border border-slate-700 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs border border-purple-500/30">
                        ⭐
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">@{friend}</div>
                        <div className="text-[10px] text-emerald-400">صديق مقرب VIP</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFriend(friend)}
                      className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2 py-1 rounded-lg transition-colors"
                    >
                      إزالة
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>التعديلات تُحفظ وتظهر فوراً لجميع الحاضرين في الغرفة</span>
          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
