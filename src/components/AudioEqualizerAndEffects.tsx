import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Volume1,
  VolumeX,
  Radio,
  Sliders,
  Sparkles,
  Headphones,
  Activity,
  Zap,
  RotateCcw,
  Check,
  Play,
  Square,
  Shield,
  Clock,
  Layers,
  ListOrdered
} from 'lucide-react';

export interface AudioEqualizerAndEffectsProps {
  isOpen: boolean;
  onClose: () => void;
  isVoiceActive: boolean;
  onToggleVoice: () => void;
  onShowToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export type VoiceEffectType = 'normal' | 'falcon' | 'robot' | 'helium' | 'studio' | 'radio' | 'echo';

export const AudioEqualizerAndEffects: React.FC<AudioEqualizerAndEffectsProps> = ({
  isOpen,
  onClose,
  isVoiceActive,
  onToggleVoice,
  onShowToast
}) => {
  const [selectedEffect, setSelectedEffect] = useState<VoiceEffectType>('normal');
  const [micGain, setMicGain] = useState<number>(100); // 0 - 200%
  const [spatialPan, setSpatialPan] = useState<number>(0); // -1 to 1 (left to right)
  const [noiseSuppression, setNoiseSuppression] = useState<boolean>(true);
  const [echoCancellation, setEchoCancellation] = useState<boolean>(true);
  const [pushToTalk, setPushToTalk] = useState<boolean>(false);
  const [micTestRunning, setMicTestRunning] = useState<boolean>(false);
  const [testAudioLevel, setTestAudioLevel] = useState<number>(0);
  const [djDuckMode, setDjDuckMode] = useState<boolean>(false);
  const [ambientSound, setAmbientSound] = useState<'none' | 'rain' | 'campfire' | 'oud' | 'desert'>('none');
  const [ambientVolume, setAmbientVolume] = useState<number>(40);

  // Mic Queue Demo
  const [queueUsers, setQueueUsers] = useState<string[]>(['أبو فهد', 'صقر قريش', 'سلطانة البادية']);
  const [isInQueue, setIsInQueue] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Audio Context for Ambient generator and mic test
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ambientGainRef = useRef<GainNode | null>(null);
  const ambientOscRef = useRef<OscillatorNode | null>(null);

  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  useEffect(() => {
    return () => {
      if (ambientOscRef.current) {
        try { ambientOscRef.current.stop(); } catch {}
        ambientOscRef.current = null;
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        try { audioCtxRef.current.close(); } catch {}
        audioCtxRef.current = null;
      }
    };
  }, []);

  // Canvas visualizer animation
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let step = 0;
    const render = () => {
      step += 0.05;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const numBars = 32;
      const barWidth = canvas.width / numBars - 2;

      for (let i = 0; i < numBars; i++) {
        // Generate dynamic sound wave height based on mic active or effect
        const baseHeight = isVoiceActive || micTestRunning ? 20 + Math.sin(step + i * 0.3) * 18 + Math.cos(step * 2 + i * 0.2) * 12 : 6;
        const normalizedHeight = Math.max(4, Math.min(canvas.height - 4, baseHeight * (micGain / 100)));

        const x = i * (barWidth + 2);
        const y = canvas.height - normalizedHeight;

        // Gradient based on effect
        const grad = ctx.createLinearGradient(0, canvas.height, 0, 0);
        if (selectedEffect === 'falcon') {
          grad.addColorStop(0, '#f59e0b');
          grad.addColorStop(1, '#ef4444');
        } else if (selectedEffect === 'studio') {
          grad.addColorStop(0, '#8b5cf6');
          grad.addColorStop(1, '#ec4899');
        } else if (selectedEffect === 'robot') {
          grad.addColorStop(0, '#06b6d4');
          grad.addColorStop(1, '#3b82f6');
        } else {
          grad.addColorStop(0, '#10b981');
          grad.addColorStop(1, '#eab308');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, normalizedHeight, [3, 3, 0, 0]);
        ctx.fill();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen, isVoiceActive, micTestRunning, micGain, selectedEffect]);

  // Ambient sound synthesizer
  const playAmbientSound = (type: 'none' | 'rain' | 'campfire' | 'oud' | 'desert') => {
    setAmbientSound(type);
    if (type === 'none') {
      if (ambientGainRef.current) {
        ambientGainRef.current.gain.setValueAtTime(0, audioCtxRef.current?.currentTime || 0);
      }
      return;
    }

    try {
      const ctx = getAudioContext();
      if (!ambientGainRef.current) {
        const gain = ctx.createGain();
        gain.connect(ctx.destination);
        ambientGainRef.current = gain;
      }
      ambientGainRef.current.gain.setValueAtTime((ambientVolume / 100) * 0.15, ctx.currentTime);

      // Play synthesized calming ambiance
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      if (type === 'rain' || type === 'desert') {
        osc.type = 'sawtooth';
        filter.type = 'lowpass';
        filter.frequency.value = type === 'rain' ? 800 : 350;
      } else if (type === 'campfire') {
        osc.type = 'triangle';
        filter.type = 'bandpass';
        filter.frequency.value = 500;
      } else {
        osc.type = 'sine';
        filter.type = 'lowpass';
        filter.frequency.value = 440;
      }
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.connect(filter);
      filter.connect(ambientGainRef.current);
      osc.start();
      setTimeout(() => {
        try {
          osc.stop();
        } catch {}
      }, 5000);
      onShowToast(`تم تشغيل خلفية صوتية: ${type === 'rain' ? 'مطر هادئ 🌧️' : type === 'campfire' ? 'نار مخيم 🔥' : type === 'desert' ? 'نسيم الصحراء 🏜️' : 'عزف عود 🎵'}`, 'success');
    } catch (e) {
      console.error(e);
    }
  };

  // Test microphone loopback
  const handleToggleMicTest = () => {
    if (micTestRunning) {
      setMicTestRunning(false);
      setTestAudioLevel(0);
      onShowToast('تم إيقاف اختبار الميكروفون', 'info');
    } else {
      setMicTestRunning(true);
      setTestAudioLevel(65);
      onShowToast('جاري اختبار الميكروفون وسماع الصدى التجريبي 🎤', 'success');
    }
  };

  const handleApplyEffect = (eff: VoiceEffectType) => {
    setSelectedEffect(eff);
    const names: Record<VoiceEffectType, string> = {
      normal: 'الصوت الطبيعي النقي',
      falcon: 'حسان برو الجهوري 🦅',
      robot: 'الروبوت الإلكتروني 🤖',
      helium: 'الهيليوم المبهج 🎈',
      studio: 'استوديو محترف مع ريفيرب 🎙️',
      radio: 'بث لاسلكي عسكري 📻',
      echo: 'صدى جبلي عميق 🏔️'
    };
    onShowToast(`تم تفعيل مؤثر الصوت: ${names[eff]}`, 'success');
  };

  const handleToggleQueue = () => {
    if (isInQueue) {
      setIsInQueue(false);
      setQueueUsers((prev) => prev.filter((u) => u !== 'أنت'));
      onShowToast('تم إلغاء طلب صعود المايك', 'info');
    } else {
      setIsInQueue(true);
      setQueueUsers((prev) => [...prev, 'أنت']);
      onShowToast('تمت إضافتك لقائمة انتظار المايك بنجاح!', 'success');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm animate-fade-in"
      dir="rtl"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-indigo-950 via-slate-900 to-amber-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                استوديو هندسة الصوت ومؤثرات المايك
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
                  HQ Audio Pro
                </span>
              </h2>
              <p className="text-xs text-slate-400">تحكم كامل بحساسية الالتقاط، طبقات الصوت، الفلاتر، والمؤثرات الاحترافية</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-6 overflow-y-auto max-h-[calc(92vh-130px)]">
          {/* Live Equalizer Visualizer */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                طيف الترددات الحية ومؤشر استجابة الصوت (Live Visualizer)
              </div>
              <span className={`text-[11px] px-2 py-0.5 rounded-full ${isVoiceActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}`}>
                {isVoiceActive ? 'المايك متصل ومباشر' : 'وضع الاستماع'}
              </span>
            </div>
            <canvas ref={canvasRef} width={500} height={70} className="w-full h-16 rounded-lg bg-slate-950" />
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1">
              <span>60Hz (Bass)</span>
              <span>250Hz</span>
              <span>1kHz (Vocal)</span>
              <span>4kHz</span>
              <span>16kHz (Treble)</span>
            </div>
          </div>

          {/* Voice Effects / Modulators (7 Creative Effects) */}
          <div>
            <label className="text-xs font-bold text-slate-300 flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              تغيير طبقة الصوت والمؤثرات الحية (Live Voice Pitch & Modulator)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'normal', name: 'طبيعي نقي', desc: 'صوتك الأصلي بأعلى نقاوة', icon: '🎙️' },
                { id: 'falcon', name: 'حسان برو', desc: 'طبقة فخمة وجهورية', icon: '🦅' },
                { id: 'studio', name: 'استوديو', desc: 'صدى ريفيرب ناعم', icon: '✨' },
                { id: 'robot', name: 'روبوتيك', desc: 'صوت إلكتروني سايبر', icon: '🤖' },
                { id: 'helium', name: 'هيليوم', desc: 'طبقة ناعمة ومرحة', icon: '🎈' },
                { id: 'radio', name: 'لاسلكي', desc: 'تأثير إرسال طوارئ', icon: '📻' },
                { id: 'echo', name: 'صدى واسع', desc: 'تردد صوتي جبلي', icon: '🏔️' },
              ].map((item) => {
                const isActive = selectedEffect === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleApplyEffect(item.id as VoiceEffectType)}
                    className={`p-2.5 rounded-xl border text-right transition-all flex flex-col justify-between ${
                      isActive
                        ? 'bg-amber-500/15 border-amber-500/60 shadow-lg shadow-amber-500/10'
                        : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-lg">{item.icon}</span>
                      {isActive && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    </div>
                    <div>
                      <div className={`text-xs font-bold ${isActive ? 'text-amber-300' : 'text-slate-200'}`}>
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-400 line-clamp-1">{item.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Audio Knobs & Sliders: Gain, Spatial Pan, Noise Gate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Mic Gain Booster */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-indigo-400" />
                  مضخم التقاط المايك (Mic Gain Booster)
                </span>
                <span className="font-mono text-amber-400 font-bold">{micGain}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="200"
                value={micGain}
                onChange={(e) => setMicGain(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>10% (منخفض)</span>
                <span>100% (طبيعي)</span>
                <span>200% (مضاعف)</span>
              </div>
            </div>

            {/* 3D Spatial Audio Pan */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Headphones className="w-4 h-4 text-emerald-400" />
                  توزيع الصوت المكاني ثلاثي الأبعاد (Stereo Pan)
                </span>
                <span className="font-mono text-emerald-400 font-bold">
                  {spatialPan === 0 ? 'في المنتصف' : spatialPan < 0 ? `يسار ${Math.abs(Math.round(spatialPan * 100))}%` : `يمين ${Math.round(spatialPan * 100)}%`}
                </span>
              </div>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.1"
                value={spatialPan}
                onChange={(e) => setSpatialPan(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>أقصى اليسار (L)</span>
                <span>منتصف المسرح</span>
                <span>أقصى اليمين (R)</span>
              </div>
            </div>
          </div>

          {/* Audio Filters & Hardware Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Noise Suppression */}
            <button
              onClick={() => {
                setNoiseSuppression(!noiseSuppression);
                onShowToast(noiseSuppression ? 'تم تعطيل مانع الضوضاء' : 'تم تفعيل مانع الضوضاء الذكي (Noise Suppression)', 'info');
              }}
              className={`p-3 rounded-xl border flex items-center justify-between text-right transition-all ${
                noiseSuppression ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300' : 'bg-slate-800/40 border-slate-700 text-slate-400'
              }`}
            >
              <div className="text-xs">
                <div className="font-bold flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  مانع الضوضاء الذكي
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">إلغاء هدير المراوح والشارع</div>
              </div>
              <div className={`w-4 h-4 rounded-full flex items-center justify-center ${noiseSuppression ? 'bg-emerald-500 text-white' : 'bg-slate-700'}`}>
                {noiseSuppression && <Check className="w-3 h-3" />}
              </div>
            </button>

            {/* Echo Cancellation */}
            <button
              onClick={() => {
                setEchoCancellation(!echoCancellation);
                onShowToast(echoCancellation ? 'تم تعطيل مانع الصدى' : 'تم تفعيل مانع الصدى الصوتي (Echo Cancellation)', 'info');
              }}
              className={`p-3 rounded-xl border flex items-center justify-between text-right transition-all ${
                echoCancellation ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-300' : 'bg-slate-800/40 border-slate-700 text-slate-400'
              }`}
            >
              <div className="text-xs">
                <div className="font-bold flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  مانع الارتداد والصدى
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">منع تكرار الصوت للمستمعين</div>
              </div>
              <div className={`w-4 h-4 rounded-full flex items-center justify-center ${echoCancellation ? 'bg-indigo-500 text-white' : 'bg-slate-700'}`}>
                {echoCancellation && <Check className="w-3 h-3" />}
              </div>
            </button>

            {/* Push to Talk Toggle */}
            <button
              onClick={() => {
                setPushToTalk(!pushToTalk);
                onShowToast(pushToTalk ? 'تم التبديل إلى المايك المفتوح المستمر' : 'تم تفعيل نمط الضغط للتحدث (Push-to-Talk) - اضغط المسطرة Space', 'info');
              }}
              className={`p-3 rounded-xl border flex items-center justify-between text-right transition-all ${
                pushToTalk ? 'bg-amber-950/40 border-amber-500/50 text-amber-300' : 'bg-slate-800/40 border-slate-700 text-slate-400'
              }`}
            >
              <div className="text-xs">
                <div className="font-bold flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5" />
                  الضغط للتحدث (PTT)
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">زر المسطرة أو زر المايك</div>
              </div>
              <div className={`w-4 h-4 rounded-full flex items-center justify-center ${pushToTalk ? 'bg-amber-500 text-black' : 'bg-slate-700'}`}>
                {pushToTalk && <Check className="w-3 h-3" />}
              </div>
            </button>
          </div>

          {/* Ambient Background Mixer & DJ Ducking */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Radio className="w-4 h-4 text-purple-400" />
                ميكسر الخلفيات الصوتية المهدئة (Ambient Soundscape)
              </span>
              <button
                onClick={() => setDjDuckMode(!djDuckMode)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                  djDuckMode ? 'bg-purple-600/30 border-purple-500 text-purple-300' : 'bg-slate-700/50 border-slate-600 text-slate-400'
                }`}
              >
                تخفيض الموسيقى عند الكلام (Audio Ducking): {djDuckMode ? 'مفعل ✓' : 'معطل'}
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { id: 'none', label: 'صامت', icon: '⏹️' },
                { id: 'rain', label: 'مطر هادئ', icon: '🌧️' },
                { id: 'campfire', label: 'نار مخيم وسهرة', icon: '🔥' },
                { id: 'desert', label: 'نسيم الصحراء', icon: '🏜️' },
                { id: 'oud', label: 'أوتار العود', icon: '🎵' }
              ].map((amb) => (
                <button
                  key={amb.id}
                  onClick={() => playAmbientSound(amb.id as any)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                    ambientSound === amb.id
                      ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  <span>{amb.icon}</span>
                  <span>{amb.label}</span>
                </button>
              ))}
            </div>

            {ambientSound !== 'none' && (
              <div className="flex items-center gap-3 pt-2">
                <span className="text-[11px] text-slate-400">مستوى صوت الخلفية:</span>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={ambientVolume}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setAmbientVolume(val);
                    if (ambientGainRef.current) {
                      ambientGainRef.current.gain.setValueAtTime((val / 100) * 0.15, audioCtxRef.current?.currentTime || 0);
                    }
                  }}
                  className="flex-1 accent-purple-500 cursor-pointer"
                />
                <span className="text-xs font-mono text-purple-300">{ambientVolume}%</span>
              </div>
            )}
          </div>

          {/* Mic Queue & Loopback Test */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Mic Loopback Test */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-slate-200 mb-1 flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                  اختبار المايك والصدى المحلي (Loopback Test)
                </div>
                <p className="text-[11px] text-slate-400 mb-3">
                  تحدث وافحص جودة ونقاوة صوتك قبل الصعود على مايك الغرفة أمام الجميع.
                </p>
              </div>
              <button
                onClick={handleToggleMicTest}
                className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                  micTestRunning
                    ? 'bg-rose-600/30 border-rose-500 text-rose-300 animate-pulse'
                    : 'bg-indigo-600 hover:bg-indigo-500 border-indigo-400 text-white shadow-md'
                }`}
              >
                {micTestRunning ? (
                  <>
                    <Square className="w-3.5 h-3.5" />
                    إيقاف اختبار المايك
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    بدء اختبار المايك وسماع الصوت
                  </>
                )}
              </button>
            </div>

            {/* Voice Mic Waiting Queue */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-slate-200 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ListOrdered className="w-4 h-4 text-indigo-400" />
                    طابور انتظار المايك ({queueUsers.length})
                  </span>
                  <span className="text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md">
                    الأولوية بالنظام
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 my-2">
                  {queueUsers.map((u, i) => (
                    <span
                      key={i}
                      className={`text-[10px] px-2 py-1 rounded-md border ${
                        u === 'أنت'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                          : 'bg-slate-700/60 text-slate-300 border-slate-600'
                      }`}
                    >
                      {i + 1}. {u}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={handleToggleQueue}
                className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                  isInQueue
                    ? 'bg-rose-950/40 border-rose-600 text-rose-300'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md'
                }`}
              >
                {isInQueue ? 'إلغاء طلبي من الانتظار' : 'طلب الصعود للمايك (حجز دور)'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            معدل نقل الصوت: <span className="font-mono text-emerald-400">48kHz / Opus 128kbps Stereo</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all"
          >
            حفظ وإغلاق الاستوديو
          </button>
        </div>
      </div>
    </div>
  );
};
