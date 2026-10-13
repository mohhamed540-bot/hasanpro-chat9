import React, { useState, useMemo } from 'react';
import {
  PieChart as PieChartIcon,
  Users,
  Radio,
  Flame,
  Lock,
  Globe,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  LogIn,
  Mic,
  Sparkles,
  Award
} from 'lucide-react';

export interface RoomStatUser {
  id: string;
  username: string;
  role: 'admin' | 'super' | 'member' | 'guest';
  flag: string;
  avatarUrl?: string;
  isVoice: boolean;
  micSlot: number | null;
}

export interface RoomStatData {
  id: string;
  name: string;
  desc: string;
  isPasswordProtected: boolean;
  voiceLimit: number;
  count: number;
  percentage: number;
  voiceCount: number;
  users: RoomStatUser[];
}

interface RoomStatsPieChartProps {
  stats: RoomStatData[];
  currentRoomId: string;
  onRefresh: () => void;
  onSwitchRoom?: (roomId: string) => void;
  onOpenUserProfile?: (username: string) => void;
}

// Distinctive and elegant color palette for the chat rooms
const ROOM_COLORS: Record<string, { fill: string; border: string; bg: string; text: string; badge: string }> = {
  'الغرفة العامة': {
    fill: '#10b981', // Emerald
    border: 'border-emerald-500',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-800'
  },
  'السعودية': {
    fill: '#f59e0b', // Amber / Gold
    border: 'border-amber-500',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-800'
  },
  'العراق': {
    fill: '#0284c7', // Sky Blue
    border: 'border-sky-500',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    badge: 'bg-sky-100 text-sky-800'
  },
  'المسابقات': {
    fill: '#f43f5e', // Rose / Red
    border: 'border-rose-500',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    badge: 'bg-rose-100 text-rose-800'
  },
  'خاص vip': {
    fill: '#8b5cf6', // Violet
    border: 'border-purple-500',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    badge: 'bg-purple-100 text-purple-800'
  },
  'صوت حسان برو': {
    fill: '#0d9488', // Teal
    border: 'border-teal-500',
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    badge: 'bg-teal-100 text-teal-800'
  }
};

const FALLBACK_COLORS = [
  { fill: '#ea580c', border: 'border-orange-500', bg: 'bg-orange-50', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-800' },
  { fill: '#ec4899', border: 'border-pink-500', bg: 'bg-pink-50', text: 'text-pink-700', badge: 'bg-pink-100 text-pink-800' },
  { fill: '#6366f1', border: 'border-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-800' },
  { fill: '#14b8a6', border: 'border-cyan-500', bg: 'bg-cyan-50', text: 'text-cyan-700', badge: 'bg-cyan-100 text-cyan-800' }
];

function getRoomTheme(roomId: string, index: number) {
  if (ROOM_COLORS[roomId]) return ROOM_COLORS[roomId];
  return FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

// Trigonometric helpers for clean SVG pie/donut paths
function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians)
  };
}

function describeArcPath(
  centerX: number,
  centerY: number,
  radiusOuter: number,
  radiusInner: number,
  startAngle: number,
  endAngle: number
) {
  const angleDelta = endAngle - startAngle;
  // If the slice is a full circle or almost full (e.g. 1 room has 100%):
  if (angleDelta >= 359.99) {
    if (radiusInner <= 0) {
      // Full pie circle
      return `M ${centerX} ${centerY - radiusOuter} A ${radiusOuter} ${radiusOuter} 0 1 1 ${centerX} ${centerY + radiusOuter} A ${radiusOuter} ${radiusOuter} 0 1 1 ${centerX} ${centerY - radiusOuter} Z`;
    }
    // Full donut ring
    return [
      `M ${centerX} ${centerY - radiusOuter}`,
      `A ${radiusOuter} ${radiusOuter} 0 1 1 ${centerX} ${centerY + radiusOuter}`,
      `A ${radiusOuter} ${radiusOuter} 0 1 1 ${centerX} ${centerY - radiusOuter}`,
      `M ${centerX} ${centerY - radiusInner}`,
      `A ${radiusInner} ${radiusInner} 0 1 0 ${centerX} ${centerY + radiusInner}`,
      `A ${radiusInner} ${radiusInner} 0 1 0 ${centerX} ${centerY - radiusInner}`,
      'Z'
    ].join(' ');
  }

  const outerStart = polarToCartesian(centerX, centerY, radiusOuter, startAngle);
  const outerEnd = polarToCartesian(centerX, centerY, radiusOuter, endAngle);
  const largeArcFlag = angleDelta <= 180 ? 0 : 1;

  if (radiusInner <= 0) {
    // Pure Pie slice to center
    return [
      `M ${centerX} ${centerY}`,
      `L ${outerStart.x} ${outerStart.y}`,
      `A ${radiusOuter} ${radiusOuter} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`,
      'Z'
    ].join(' ');
  }

  // Donut slice
  const innerStart = polarToCartesian(centerX, centerY, radiusInner, endAngle);
  const innerEnd = polarToCartesian(centerX, centerY, radiusInner, startAngle);

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${radiusOuter} ${radiusOuter} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${radiusInner} ${radiusInner} 0 ${largeArcFlag} 0 ${innerEnd.x} ${innerEnd.y}`,
    'Z'
  ].join(' ');
}

export const RoomStatsPieChart: React.FC<RoomStatsPieChartProps> = ({
  stats,
  currentRoomId,
  onRefresh,
  onSwitchRoom,
  onOpenUserProfile
}) => {
  const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [chartMode, setChartMode] = useState<'donut' | 'pie'>('donut');
  const [expandedRoomIds, setExpandedRoomIds] = useState<Record<string, boolean>>({});

  const toggleRoomExpand = (roomId: string) => {
    setExpandedRoomIds((prev) => ({ ...prev, [roomId]: !prev[roomId] }));
  };

  // Total members across all rooms
  const totalMembers = useMemo(() => {
    return stats.reduce((acc, curr) => acc + curr.count, 0);
  }, [stats]);

  // Total active voice mics
  const totalVoiceMics = useMemo(() => {
    return stats.reduce((acc, curr) => acc + curr.voiceCount, 0);
  }, [stats]);

  // Room with the highest member count
  const mostCrowdedRoom = useMemo(() => {
    if (stats.length === 0) return null;
    return [...stats].sort((a, b) => b.count - a.count)[0];
  }, [stats]);

  // Compute slice angles for the SVG Pie Chart
  const pieSlices = useMemo(() => {
    if (totalMembers === 0) return [];

    let currentAngle = 0;
    return stats.map((room, idx) => {
      const percentage = (room.count / totalMembers) * 100;
      const angle = (room.count / totalMembers) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      const theme = getRoomTheme(room.id, idx);
      const isSelected = selectedRoomId === room.id;
      const isHovered = hoveredRoomId === room.id;

      // Expand outer radius slightly on hover/selection for prominent visual feedback
      const cx = 160;
      const cy = 160;
      const rOuter = isHovered || isSelected ? 124 : 116;
      const rInner = chartMode === 'donut' ? 68 : 0;

      const pathData = describeArcPath(cx, cy, rOuter, rInner, startAngle, endAngle);

      // Mid-angle for slice labels or indicator
      const midAngle = startAngle + angle / 2;
      const labelPos = polarToCartesian(cx, cy, (rOuter + rInner) / 2, midAngle);

      return {
        ...room,
        percentageDisplay: Math.round(percentage),
        startAngle,
        endAngle,
        pathData,
        theme,
        isSelected,
        isHovered,
        labelPos,
        angle
      };
    });
  }, [stats, totalMembers, hoveredRoomId, selectedRoomId, chartMode]);

  // Active slice currently highlighted in center
  const activeHighlightedSlice = useMemo(() => {
    const targetId = hoveredRoomId || selectedRoomId;
    if (!targetId) return null;
    return pieSlices.find((s) => s.id === targetId) || null;
  }, [hoveredRoomId, selectedRoomId, pieSlices]);

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3.5 text-right text-slate-800">
      
      {/* Top Banner & Control Bar */}
      <div className="flex items-center justify-between bg-gradient-to-r from-[#241a12] to-[#3a2b1f] text-amber-200 p-3 rounded-2xl shadow-md border border-amber-600/30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
            <PieChartIcon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-black text-xs text-amber-100 flex items-center gap-1.5">
              <span>إحصائيات توزيع الأعضاء على الغرف</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </h4>
            <p className="text-[10px] text-amber-300/80">مخطط بياني حي يعكس تواجد الأعضاء الحالي بكل روم</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Mode Switcher */}
          <div className="bg-[#19110a] p-0.5 rounded-lg border border-amber-600/40 flex text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setChartMode('donut')}
              className={`px-2 py-1 rounded transition-colors ${
                chartMode === 'donut' ? 'bg-amber-600 text-white font-black' : 'text-amber-300 hover:text-white'
              }`}
              title="مخطط حلقي (Donut)"
            >
              حلقي
            </button>
            <button
              type="button"
              onClick={() => setChartMode('pie')}
              className={`px-2 py-1 rounded transition-colors ${
                chartMode === 'pie' ? 'bg-amber-600 text-white font-black' : 'text-amber-300 hover:text-white'
              }`}
              title="مخطط دائري ممتلئ (Pie)"
            >
              دائري
            </button>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            className="w-8 h-8 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 text-amber-200 flex items-center justify-center border border-amber-500/40 transition-colors cursor-pointer"
            title="تحديث الإحصائيات الآن"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mb-0.5">
            <Users className="w-3 h-3 text-indigo-600" />
            <span>المتواجدين</span>
          </span>
          <span className="text-base font-black text-indigo-950 font-mono">{totalMembers}</span>
          <span className="text-[9px] text-indigo-600 font-bold">عضو مباشر</span>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mb-0.5">
            <Radio className="w-3 h-3 text-emerald-600" />
            <span>الغرف</span>
          </span>
          <span className="text-base font-black text-emerald-950 font-mono">{stats.length}</span>
          <span className="text-[9px] text-emerald-600 font-bold">غرفة متاحة</span>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mb-0.5">
            <Mic className="w-3 h-3 text-rose-600" />
            <span>المايكات</span>
          </span>
          <span className="text-base font-black text-rose-950 font-mono">{totalVoiceMics}</span>
          <span className="text-[9px] text-rose-600 font-bold">صوت نشط</span>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex flex-col items-center justify-center text-center truncate">
          <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mb-0.5 truncate">
            <Flame className="w-3 h-3 text-amber-500" />
            <span>الأكثر نشاطاً</span>
          </span>
          <span className="text-xs font-black text-amber-950 truncate max-w-full">
            {mostCrowdedRoom?.name.split(' ')[0] || 'الرئيسية'}
          </span>
          <span className="text-[9px] text-amber-700 font-bold font-mono">
            {mostCrowdedRoom ? `${mostCrowdedRoom.count} عضو` : '0'}
          </span>
        </div>
      </div>

      {/* Main Interactive Pie Chart Card */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center">
        <div className="w-full flex items-center justify-between mb-2 pb-2 border-b border-slate-100 text-xs">
          <span className="font-black text-slate-900 flex items-center gap-1.5">
            <PieChartIcon className="w-4 h-4 text-amber-600" />
            <span>توزيع الأعضاء (Pie Chart):</span>
          </span>
          <span className="text-[11px] text-slate-500">
            {selectedRoomId ? 'اضغط لإلغاء التحديد' : 'مرر أو اضغط على أي قطاع للتفاصيل'}
          </span>
        </div>

        {totalMembers === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>لا يوجد أعضاء متواجدون حالياً لحساب الإحصائيات.</p>
          </div>
        ) : (
          <div className="relative flex items-center justify-center my-1">
            {/* SVG Rendered Pie Chart */}
            <svg
              viewBox="0 0 320 320"
              className="w-56 h-56 sm:w-64 sm:h-64 filter drop-shadow-md transition-all duration-200"
            >
              <defs>
                <filter id="sliceShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.25" />
                </filter>
              </defs>

              {/* Slices */}
              {pieSlices.map((slice) => {
                const isTarget = slice.isHovered || slice.isSelected;
                return (
                  <path
                    key={slice.id}
                    d={slice.pathData}
                    fill={slice.theme.fill}
                    stroke="#ffffff"
                    strokeWidth={isTarget ? 3 : 2}
                    filter={isTarget ? 'url(#sliceShadow)' : undefined}
                    className="cursor-pointer transition-all duration-200 hover:opacity-95"
                    onMouseEnter={() => setHoveredRoomId(slice.id)}
                    onMouseLeave={() => setHoveredRoomId(null)}
                    onClick={() => {
                      setSelectedRoomId(selectedRoomId === slice.id ? null : slice.id);
                    }}
                  />
                );
              })}

              {/* Percentage text directly on larger slices (angle > 30 degrees) */}
              {pieSlices.map((slice) => {
                if (slice.angle < 28) return null;
                return (
                  <text
                    key={`lbl-${slice.id}`}
                    x={slice.labelPos.x}
                    y={slice.labelPos.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#ffffff"
                    className="text-[10px] font-black pointer-events-none drop-shadow-sm font-mono select-none"
                  >
                    %{slice.percentageDisplay}
                  </text>
                );
              })}
            </svg>

            {/* Center Label for Donut Mode */}
            {chartMode === 'donut' && (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center select-none"
                style={{ width: '130px', height: '130px', margin: 'auto' }}
              >
                {activeHighlightedSlice ? (
                  <div className="animate-in fade-in duration-150 p-1">
                    <span className="text-[10px] font-bold text-slate-500 block truncate max-w-[110px]">
                      {activeHighlightedSlice.name}
                    </span>
                    <span className="text-xl font-black font-mono block leading-none my-0.5" style={{ color: activeHighlightedSlice.theme.fill }}>
                      {activeHighlightedSlice.count}
                    </span>
                    <span className="text-[10px] font-bold text-slate-700 block font-mono">
                      %{activeHighlightedSlice.percentageDisplay} من الأعضاء
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 block">إجمالي الأعضاء</span>
                    <span className="text-2xl font-black text-slate-800 font-mono block leading-none my-0.5">
                      {totalMembers}
                    </span>
                    <span className="text-[9px] text-emerald-600 font-bold flex items-center justify-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>متصل الآن</span>
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Selected / Hovered Room Callout Badge */}
        {activeHighlightedSlice && (
          <div className="w-full mt-2 p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full shadow-xs flex-shrink-0"
                style={{ backgroundColor: activeHighlightedSlice.theme.fill }}
              />
              <span className="font-black text-slate-900">{activeHighlightedSlice.name}</span>
              {activeHighlightedSlice.isPasswordProtected && (
                <Lock className="w-3 h-3 text-amber-600" />
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono font-bold">
              <span className="text-slate-600">{activeHighlightedSlice.count} عضو</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                %{activeHighlightedSlice.percentageDisplay}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Legend Grid */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800 pb-1.5 border-b border-slate-100">
          <span>دليل الغرف والنسب المئوية:</span>
          <span className="text-[10px] text-slate-400">اضغط على أي غرفة للتحديد</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {stats.map((room, idx) => {
            const theme = getRoomTheme(room.id, idx);
            const isSelected = selectedRoomId === room.id;
            const percentage = totalMembers > 0 ? Math.round((room.count / totalMembers) * 100) : 0;

            return (
              <button
                key={room.id}
                type="button"
                onClick={() => setSelectedRoomId(selectedRoomId === room.id ? null : room.id)}
                onMouseEnter={() => setHoveredRoomId(room.id)}
                onMouseLeave={() => setHoveredRoomId(null)}
                className={`p-2 rounded-xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? `${theme.bg} ${theme.border} ring-2 ring-amber-400 shadow-xs`
                    : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between gap-1 w-full mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: theme.fill }}
                    />
                    <span className="font-bold text-slate-800 truncate text-[11px]">
                      {room.name}
                    </span>
                  </div>
                  {room.isPasswordProtected && <Lock className="w-3 h-3 text-slate-400 flex-shrink-0" />}
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-600 w-full mt-1">
                  <span>{room.count} عضو</span>
                  <span className="font-black px-1.5 py-0.2 rounded bg-white border border-slate-200">
                    %{percentage}
                  </span>
                </div>

                {/* Progress Mini Bar */}
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1.5">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%`, backgroundColor: theme.fill }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detailed Room Cards & Members Inspector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-900 px-1">
          <span>تفاصيل الغرف والمتواجدين بداخلها:</span>
          {selectedRoomId && (
            <button
              type="button"
              onClick={() => setSelectedRoomId(null)}
              className="text-[11px] text-indigo-600 hover:underline font-bold"
            >
              عرض جميع الغرف
            </button>
          )}
        </div>

        {stats
          .filter((room) => !selectedRoomId || room.id === selectedRoomId)
          .map((room, idx) => {
            const theme = getRoomTheme(room.id, idx);
            const isExpanded = Boolean(expandedRoomIds[room.id] || selectedRoomId === room.id);
            const isCurrent = currentRoomId === room.id;
            const percentage = totalMembers > 0 ? Math.round((room.count / totalMembers) * 100) : 0;

            return (
              <div
                key={room.id}
                className={`bg-white rounded-xl border transition-all shadow-xs overflow-hidden ${
                  selectedRoomId === room.id ? `${theme.border} ring-2 ring-amber-300` : 'border-slate-200'
                }`}
              >
                {/* Room Header Item */}
                <div className="p-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-xs"
                      style={{ backgroundColor: theme.fill }}
                    >
                      {room.isPasswordProtected ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h5 className="font-black text-xs text-slate-900 truncate">{room.name}</h5>
                        {isCurrent && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-black">
                            غرفتك الحالية
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 truncate max-w-[190px]">{room.desc}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Switch room button if not current room */}
                    {!isCurrent && onSwitchRoom && (
                      <button
                        type="button"
                        onClick={() => onSwitchRoom(room.id)}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="الانتقال إلى هذه الغرفة"
                      >
                        <LogIn className="w-3 h-3" />
                        <span>دخول</span>
                      </button>
                    )}

                    {/* Expand/Collapse Room Users Toggle */}
                    <button
                      type="button"
                      onClick={() => toggleRoomExpand(room.id)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                      title={isExpanded ? 'طي قائمة الأعضاء' : 'عرض أعضاء الغرفة'}
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Sub-bar with member count & voice status */}
                <div className="px-3 pb-2.5 flex items-center justify-between text-[10px] font-medium text-slate-600 border-b border-slate-100">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold text-slate-800">
                      👥 {room.count} عضو (%{percentage})
                    </span>
                    {room.voiceCount > 0 && (
                      <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                        <Mic className="w-3 h-3 text-emerald-600" />
                        <span>{room.voiceCount} على المايك</span>
                      </span>
                    )}
                  </div>
                  <span className="text-slate-400 font-mono">الحد الأقصى: {room.voiceLimit}</span>
                </div>

                {/* Expanded Member List for this Room */}
                {isExpanded && (
                  <div className="p-2.5 bg-slate-50/70 space-y-1.5 animate-in fade-in duration-150">
                    <div className="text-[10px] font-bold text-slate-500 mb-1 flex items-center justify-between">
                      <span>الأعضاء المتواجدون داخل هذه الغرفة ({room.users.length}):</span>
                    </div>

                    {room.users.length === 0 ? (
                      <div className="text-[11px] text-slate-400 text-center py-2">
                        الغرفة فارغة حالياً ولا يوجد بها أعضاء.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-1.5">
                        {room.users.map((u) => (
                          <div
                            key={u.id}
                            onClick={() => onOpenUserProfile && onOpenUserProfile(u.username)}
                            className="p-1.5 rounded-lg bg-white border border-slate-200 shadow-xs flex items-center gap-2 hover:border-amber-400 transition-colors cursor-pointer"
                          >
                            <img
                              src={u.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(u.username)}`}
                              alt={u.username}
                              className="w-6 h-6 rounded-full object-cover border border-slate-200 flex-shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-[11px] font-bold text-slate-800 truncate flex items-center gap-1">
                                <span className="truncate">{u.username}</span>
                                {u.flag && <span className="text-[10px]">{u.flag}</span>}
                              </div>
                              <div className="flex items-center gap-1 text-[9px] text-slate-500">
                                <span>{u.role === 'admin' ? 'إدارة 👑' : u.role === 'super' ? 'سوبر 🛡️' : 'عضو'}</span>
                                {u.micSlot !== null && (
                                  <span className="text-emerald-600 font-bold">🎙️ م{u.micSlot}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
      </div>

    </div>
  );
};
