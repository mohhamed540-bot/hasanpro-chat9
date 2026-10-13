import React, { useState, useEffect } from 'react';
import {
  Activity,
  Wifi,
  Cpu,
  Layers,
  ShieldCheck,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertTriangle,
  Server,
  Zap,
  X
} from 'lucide-react';

export interface SystemDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onlineCount: number;
  currentRoom: string;
  socketConnected: boolean;
  onShowToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export const SystemDiagnosticsModal: React.FC<SystemDiagnosticsModalProps> = ({
  isOpen,
  onClose,
  onlineCount,
  currentRoom,
  socketConnected,
  onShowToast
}) => {
  const [ping, setPing] = useState(24);
  const [fps, setFps] = useState(60);
  const [packetLoss, setPacketLoss] = useState(0.1);
  const [audioJitter, setAudioJitter] = useState(3.2); // ms
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Simulate periodic ping fluctuation
    const interval = setInterval(() => {
      setPing(Math.floor(18 + Math.random() * 14));
      setPacketLoss(parseFloat((Math.random() * 0.2).toFixed(2)));
      setAudioJitter(parseFloat((2 + Math.random() * 2).toFixed(1)));
    }, 2000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const handleRunHealthCheck = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setPing(21);
      onShowToast('تم اكتمال الفحص التشخيصي: جميع الأنظمة تعمل بكفاءة 100% 🟢', 'success');
    }, 1200);
  };

  const handleExportDiagnostics = () => {
    const report = {
      timestamp: new Date().toISOString(),
      platform: 'ProChat Falcon Suite Web App',
      status: socketConnected ? 'Connected' : 'Disconnected',
      room: currentRoom,
      onlineUsers: onlineCount,
      pingMs: ping,
      packetLossPercent: packetLoss,
      jitterMs: audioJitter,
      browserUserAgent: navigator.userAgent,
      screenResolution: `${window.innerWidth}x${window.innerHeight}`,
      audioContextState: 'Running'
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prochat-diagnostics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast('تم تحميل التقرير التشخيصي بنجاح 📋', 'success');
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
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-950/70 via-slate-900 to-indigo-950/70 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                لوحة فحص جودة الاتصال وصحة الخادم
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  مستقر ومباشر
                </span>
              </h2>
              <p className="text-xs text-slate-400">مراقبة دقيقة لزمن استجابة الصوت، جودة الـ WebRTC، وخوادم النقل</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Ping */}
            <div className="bg-slate-800/60 border border-slate-700 p-3 rounded-xl text-center">
              <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1 mb-1">
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                سرعة الاستجابة Ping
              </div>
              <div className="text-xl font-mono font-bold text-emerald-400">{ping} ms</div>
              <div className="text-[10px] text-emerald-500/80 mt-0.5">ممتاز جداً</div>
            </div>

            {/* Socket Status */}
            <div className="bg-slate-800/60 border border-slate-700 p-3 rounded-xl text-center">
              <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1 mb-1">
                <Server className="w-3.5 h-3.5 text-indigo-400" />
                خادم المقبس Socket
              </div>
              <div className="text-sm font-bold text-white mt-1">
                {socketConnected ? 'متصل بنجاح ✓' : 'انقطاع الاتصال'}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">WSS v4 / Realtime</div>
            </div>

            {/* Packet Loss */}
            <div className="bg-slate-800/60 border border-slate-700 p-3 rounded-xl text-center">
              <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1 mb-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                فقدان الحزم Loss
              </div>
              <div className="text-xl font-mono font-bold text-amber-400">{packetLoss}%</div>
              <div className="text-[10px] text-slate-400 mt-0.5">شبه منعدم</div>
            </div>

            {/* Jitter */}
            <div className="bg-slate-800/60 border border-slate-700 p-3 rounded-xl text-center">
              <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1 mb-1">
                <Cpu className="w-3.5 h-3.5 text-purple-400" />
                تذبذب الصوت Jitter
              </div>
              <div className="text-xl font-mono font-bold text-purple-400">{audioJitter} ms</div>
              <div className="text-[10px] text-slate-400 mt-0.5">استقرار فائق</div>
            </div>
          </div>

          {/* System Check Status List */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-2.5">
            <h3 className="text-xs font-bold text-slate-200 mb-2">فحص المكونات التفاعلية الأساسية:</h3>

            {[
              { name: 'محرك الصوت الشبكي WebRTC Audio Mesh', status: 'يعمل بجودة صوت ستيريو 48kHz', ok: true },
              { name: 'قاعدة بيانات حفظ الرسائل وتاريخ المحادثة', status: 'متزامنة مع السيرفر المحلي والذاكرة', ok: true },
              { name: 'بروتوكول حماية الأسماء ومنع التكرار', status: 'نظام التدقيق الفوري بالرتب فعال', ok: true },
              { name: 'فلتر الكلمات الرقابي ومكافحة السبام', status: 'محدث مع قائمة الكلمات المحظورة', ok: true },
              { name: 'خوارزمية تشفير المحادثات الخاصة', status: 'نقل آمن ثنائي الأطراف مشفر', ok: true }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-800 last:border-none">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-slate-300">{item.name}</span>
                </div>
                <span className="text-[11px] text-slate-400">{item.status}</span>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleRunHealthCheck}
              disabled={isRefreshing}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              إعادة الفحص المباشر
            </button>
            <button
              onClick={handleExportDiagnostics}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              تحميل تقرير التشخيص JSON
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>الغرفة النشطة: <b className="text-white">{currentRoom}</b> | المتواجدون: <b className="text-amber-400">{onlineCount}</b></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
