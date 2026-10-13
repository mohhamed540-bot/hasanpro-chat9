import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Gamepad2,
  Gift,
  Radio,
  Type,
  Sun,
  Moon,
  Clock,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Award,
  Flame,
  Heart,
  HelpCircle,
  RotateCw,
  Copy,
  Check,
  Send,
  Trash2,
  Download,
  Star,
  FileText,
  Activity,
  Mic,
  Square,
  Compass,
  Smile,
  Shield,
  X,
  CheckCircle2,
  BarChart2,
  MessageSquare
} from 'lucide-react';
import confetti from '../utils/confetti';

interface FalconMegaSuiteProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    username: string;
    role: string;
    points: number;
    likes: number;
    room: string;
  };
  onlineUsers: Array<{
    id: string;
    username: string;
    flag?: string;
    role: string;
  }>;
  onSendChatMessage: (text: string) => void;
  onShowToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
  starredMessages: Array<{ id: string; username: string; text: string; time: string }>;
  onToggleStarMessage: (msg: { id: string; username: string; text: string; time: string }) => void;
  chatFontSize: 'sm' | 'base' | 'lg' | 'xl';
  onChangeFontSize: (size: 'sm' | 'base' | 'lg' | 'xl') => void;
  eyeComfort: boolean;
  onToggleEyeComfort: () => void;
  activeTheme: string;
  onChangeTheme: (theme: string) => void;
  pinnedTopic: string;
  onUpdatePinnedTopic: (topic: string) => void;
  userMood: string;
  onChangeMood: (mood: string) => void;
  userFrame: string;
  onChangeFrame: (frame: string) => void;
  onClearLocalChat: () => void;
  onExportChat: () => void;
}

// 1. Trivia Questions Pool
const TRIVIA_QUESTIONS = [
  {
    question: 'ما هو أسرع طائر في العالم عند الانقضاض؟',
    options: ['صقر الشاهين', 'النسر الذهبي', 'العقاب الأصلع', 'الصقر الحر'],
    correct: 0,
    hint: 'تتجاوز سرعته 380 كم/ساعة!'
  },
  {
    question: 'ما هي عاصمة الدولة الأموية التاريخية؟',
    options: ['بغداد', 'دمشق', 'القاهرة', 'القدس'],
    correct: 1,
    hint: 'مدينة الياسمين في بلاد الشام'
  },
  {
    question: 'من هو الشاعر الملقب بـ "المتنبي"؟',
    options: ['أحمد بن الحسين', 'امرؤ القيس', 'عمرو بن كلثوم', 'أبو تمام'],
    correct: 0,
    hint: 'مالئ الدنيا وشاغل الناس'
  },
  {
    question: 'ما هو أطول نهر في الوطن العربي والعالم؟',
    options: ['نهر دجلة', 'نهر الفرات', 'نهر النيل', 'نهر الأردن'],
    correct: 2,
    hint: 'شريان الحياة في مصر والسودان'
  },
  {
    question: 'ما هو الاسم العربي التقليدي لرياضة تدريب الصقور؟',
    options: ['القنص (الصقارة)', 'الهجن', 'الفروسية', 'الرماية'],
    correct: 0,
    hint: 'تراث أصيل معتمد لدى اليونسكو'
  },
  {
    question: 'في أي عام تم تأسيس المملكة العربية السعودية رسمياً؟',
    options: ['1924م', '1932م', '1945م', '1918م'],
    correct: 1,
    hint: 'اليوم الوطني 23 سبتمبر'
  }
];

// 2. Arabic Calligraphy Styles Generator
function decorateText(text: string, styleId: number): string {
  if (!text) return '';
  switch (styleId) {
    case 1: // Royal Stars
      return `★ 彡 ${text} 彡 ★`;
    case 2: // Falcon Wings
      return `༻『 ${text} 』༺`;
    case 3: // Crown Arabesque
      return `﮼${text} 👑`;
    case 4: // Golden Brackets
      return `【 ${text} 】 🦅`;
    case 5: // Shakkal & Tashkeel Decorative
      return `⊰⊹ฺ ${text} ⊹ฺ⊱`;
    case 6: // Diamond Sparkle
      return `✧ ════ ${text} ════ ✧`;
    default:
      return text;
  }
}

// 3. Audio Synthesizer for DJ Soundboard (Web Audio API)
class SoundboardSynthesizer {
  private ctx: AudioContext | null = null;

  private getContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  playApplause() {
    const ctx = this.getContext();
    const duration = 1.5;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.7));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  }

  playVictory() {
    const ctx = this.getContext();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
      gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.12);
      osc.stop(ctx.currentTime + idx * 0.12 + 0.45);
    });
  }

  playAirHorn() {
    const ctx = this.getContext();
    const freqs = [311.13, 311.13, 466.16];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
      gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.1 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.1);
      osc.stop(ctx.currentTime + idx * 0.1 + 0.4);
    });
  }

  playDrumRoll() {
    const ctx = this.getContext();
    for (let i = 0; i < 15; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120 - i * 2, ctx.currentTime + i * 0.06);
      gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.06 + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.06);
      osc.stop(ctx.currentTime + i * 0.06 + 0.06);
    }
  }

  playOudChord() {
    const ctx = this.getContext();
    const chords = [196, 246.94, 293.66, 392]; // G3, B3, D4, G4
    chords.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
      gain.gain.setValueAtTime(0.3, ctx.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + idx * 0.08 + 1.3);
    });
  }
}

const soundboard = new SoundboardSynthesizer();

export const FalconMegaSuite: React.FC<FalconMegaSuiteProps> = ({
  isOpen,
  onClose,
  currentUser,
  onlineUsers,
  onSendChatMessage,
  onShowToast,
  starredMessages,
  onToggleStarMessage,
  chatFontSize,
  onChangeFontSize,
  eyeComfort,
  onToggleEyeComfort,
  activeTheme,
  onChangeTheme,
  pinnedTopic,
  onUpdatePinnedTopic,
  userMood,
  onChangeMood,
  userFrame,
  onChangeFrame,
  onClearLocalChat,
  onExportChat
}) => {
  const [activeTab, setActiveTab] = useState<'games' | 'gifts' | 'audio' | 'tools' | 'culture' | 'starred'>('games');

  // Mini-Game 1: Trivia State
  const [triviaIndex, setTriviaIndex] = useState(0);
  const [triviaSelected, setTriviaSelected] = useState<number | null>(null);
  const [triviaScore, setTriviaScore] = useState(0);
  const [triviaTimer, setTriviaTimer] = useState(15);
  const [triviaActive, setTriviaActive] = useState(false);

  // Mini-Game 2: Wheel of Fortune
  const [wheelRotation, setWheelRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelPrize, setWheelPrize] = useState<string | null>(null);

  // Mini-Game 3: Dice Roller
  const [dice1, setDice1] = useState(6);
  const [dice2, setDice2] = useState(6);
  const [isRollingDice, setIsRollingDice] = useState(false);

  // Mini-Game 4: Coin Flip
  const [coinResult, setCoinResult] = useState<'ملك 👑' | 'كتابة 🦅' | null>(null);
  const [isFlippingCoin, setIsFlippingCoin] = useState(false);

  // Mini-Game 5: Rock Paper Scissors
  const [rpsResult, setRpsResult] = useState<string | null>(null);

  // Mini-Game 6: Falcon Flight canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [flightScore, setFlightScore] = useState(0);
  const [isPlayingFlight, setIsPlayingFlight] = useState(false);

  // Calligraphy Formatter
  const [calligraphyInput, setCalligraphyInput] = useState('');
  const [copiedStyleId, setCopiedStyleId] = useState<number | null>(null);

  // Gifts System
  const [selectedGiftRecipient, setSelectedGiftRecipient] = useState(onlineUsers[0]?.username || '');
  const [selectedGiftId, setSelectedGiftId] = useState(1);

  // Audio Voice Recorder
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceAudioUrl, setVoiceAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Ambient Radio
  const [isPlayingAmbient, setIsPlayingAmbient] = useState(false);
  const [ambientTrack, setAmbientTrack] = useState<'oud' | 'desert' | 'night'>('oud');

  // Poll Creator
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOpt1, setPollOpt1] = useState('');
  const [pollOpt2, setPollOpt2] = useState('');

  // Daily Wisdom
  const WISDOM_LIST = [
    'الصقر لا يلتفت لصياح الغربان.',
    'خيرُ جليسٍ في الزمانِ كتابُ، وأوفى خليلٍ صاحبٌ أوابُ.',
    'من سار على الدرب وصل، ومن غرس حصد الطيبات.',
    'لسانك حصانك، إن صنته صانك وإن خنته خانك.',
    'الكرم شيمة النفوس الأبية، وحسن الخلق زينة الرجال.',
    'صداقة الصادقين كنزٌ لا يفنى، وبسمة الأخ محبة ونور.'
  ];
  const [todayWisdom, setTodayWisdom] = useState(WISDOM_LIST[0]);

  useEffect(() => {
    setTodayWisdom(WISDOM_LIST[Math.floor(Math.random() * WISDOM_LIST.length)]);
  }, []);

  // Trivia Timer Countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (triviaActive && triviaTimer > 0 && triviaSelected === null) {
      interval = setInterval(() => {
        setTriviaTimer((prev) => prev - 1);
      }, 1000);
    } else if (triviaTimer === 0 && triviaSelected === null) {
      setTriviaSelected(-1); // timed out
    }
    return () => clearInterval(interval);
  }, [triviaActive, triviaTimer, triviaSelected]);

  // Spin Lucky Wheel
  const handleSpinWheel = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setWheelPrize(null);
    const prizes = [
      '1,000 نقطة ذهبية 💰',
      'وسام الصقر الملكي 👑',
      '500 لايك مجاني ❤️',
      'رتبة شرفية لمدة ساعة 🛡️',
      'رشاش ألعاب نارية 🎆',
      '2,500 نقطة فخرية 💎'
    ];
    const randomIndex = Math.floor(Math.random() * prizes.length);
    const addedDegrees = 1800 + randomIndex * 60 + Math.floor(Math.random() * 20);
    const newRot = wheelRotation + addedDegrees;
    setWheelRotation(newRot);

    setTimeout(() => {
      setIsSpinning(false);
      const wonPrize = prizes[randomIndex];
      setWheelPrize(wonPrize);
      confetti({ particleCount: 60, spread: 80, origin: { y: 0.6 } });
      soundboard.playVictory();
      onShowToast(`🎉 مبروك! ربحت من عجلة الحظ: ${wonPrize}`, 'success');
      onSendChatMessage(`🎡 قام [${currentUser.username}] بتدوير عجلة الحظ وربح: ${wonPrize}!`);
    }, 3200);
  };

  // Roll 2 Dice
  const handleRollDice = () => {
    if (isRollingDice) return;
    setIsRollingDice(true);
    soundboard.playDrumRoll();
    let rollCount = 0;
    const interval = setInterval(() => {
      setDice1(Math.floor(Math.random() * 6) + 1);
      setDice2(Math.floor(Math.random() * 6) + 1);
      rollCount++;
      if (rollCount > 8) {
        clearInterval(interval);
        setIsRollingDice(false);
        const final1 = Math.floor(Math.random() * 6) + 1;
        const final2 = Math.floor(Math.random() * 6) + 1;
        setDice1(final1);
        setDice2(final2);
        const sum = final1 + final2;
        onSendChatMessage(`🎲 رمى [${currentUser.username}] النرد وحصل على: [${final1} و ${final2}] بمجموع ${sum}!`);
        onShowToast(`نتيجة رمي النرد: ${final1} + ${final2} = ${sum}`, 'info');
      }
    }, 80);
  };

  // Coin Flip
  const handleFlipCoin = () => {
    if (isFlippingCoin) return;
    setIsFlippingCoin(true);
    setCoinResult(null);
    soundboard.playDrumRoll();
    setTimeout(() => {
      setIsFlippingCoin(false);
      const res = Math.random() > 0.5 ? 'ملك 👑' : 'كتابة 🦅';
      setCoinResult(res);
      onSendChatMessage(`🪙 رمى [${currentUser.username}] القرعة وظهر: [${res}]!`);
      onShowToast(`نتيجة القرعة: ${res}`, 'info');
    }, 1200);
  };

  // Rock Paper Scissors Duel
  const handlePlayRPS = (choice: 'حجرة 🪨' | 'ورقة 📄' | 'مقص ✂️') => {
    const choices = ['حجرة 🪨', 'ورقة 📄', 'مقص ✂️'] as const;
    const opponentChoice = choices[Math.floor(Math.random() * 3)];
    let outcome = 'تعادل 🤝';
    if (
      (choice === 'حجرة 🪨' && opponentChoice === 'مقص ✂️') ||
      (choice === 'ورقة 📄' && opponentChoice === 'حجرة 🪨') ||
      (choice === 'مقص ✂️' && opponentChoice === 'ورقة 📄')
    ) {
      outcome = 'فوز كاسح! 🏆';
      confetti({ particleCount: 30, spread: 60 });
      soundboard.playVictory();
    } else if (choice !== opponentChoice) {
      outcome = 'خسارة جولة! 💔';
    }
    setRpsResult(`اخترت: ${choice} | الخصم: ${opponentChoice} ➔ ${outcome}`);
    onSendChatMessage(`⚔️ تحدي حجرة ورقة مقص: اختار [${currentUser.username}] ${choice} ضد الخصم ${opponentChoice} ➔ ${outcome}`);
  };

  // Falcon Flight Arcade Game
  const startFalconFlight = () => {
    setIsPlayingFlight(true);
    setFlightScore(0);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let birdY = 70;
    let velocity = 0;
    const gravity = 0.25;
    const jump = -4.5;
    let frame = 0;
    let obstacles: Array<{ x: number; top: number; bottom: number }> = [];
    let isGameOver = false;

    const onCanvasClick = () => {
      velocity = jump;
    };
    canvas.addEventListener('click', onCanvasClick);

    const loop = () => {
      if (isGameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 14px Cairo, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('انتهت رحلة الصقر!', canvas.width / 2, 60);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`نقاطك: ${Math.floor(frame / 10)} 🦅`, canvas.width / 2, 85);
        canvas.removeEventListener('click', onCanvasClick);
        return;
      }

      velocity += gravity;
      birdY += velocity;

      // Draw Sky & Dunes
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(0, canvas.height - 20, canvas.width, 20);

      // Spawn Pillars
      if (frame % 80 === 0) {
        const topH = Math.floor(Math.random() * 40) + 15;
        obstacles.push({ x: canvas.width, top: topH, bottom: canvas.height - topH - 55 });
      }

      // Update & Draw Pillars
      ctx.fillStyle = '#78350f';
      obstacles.forEach((obs) => {
        obs.x -= 2;
        ctx.fillRect(obs.x, 0, 20, obs.top);
        ctx.fillRect(obs.x, canvas.height - obs.bottom, 20, obs.bottom);

        // Collision Check
        if (
          obs.x < 35 &&
          obs.x + 20 > 15 &&
          (birdY < obs.top || birdY > canvas.height - obs.bottom)
        ) {
          isGameOver = true;
        }
      });

      obstacles = obstacles.filter((o) => o.x > -20);

      // Out of bounds
      if (birdY > canvas.height - 25 || birdY < 0) {
        isGameOver = true;
      }

      // Draw Falcon Bird
      ctx.font = '20px sans-serif';
      ctx.fillText('🦅', 15, birdY);

      // Score
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`المسافة: ${Math.floor(frame / 10)}م`, canvas.width - 8, 16);

      frame++;
      setFlightScore(Math.floor(frame / 10));
      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  };

  // Send Luxury Virtual Gift
  const GIFTS = [
    { id: 1, name: 'تاج الصقر الملكي', icon: '👑', cost: 1000, desc: 'فخامة ملكية لصاحب السمو' },
    { id: 2, name: 'الخنجر الذهبي العريق', icon: '🗡️', cost: 800, desc: 'رمز الشجاعة والأصالة' },
    { id: 3, name: 'الفرس العربي الأصيل', icon: '🐎', cost: 600, desc: 'نخوة وجمال عربي لا مثيل له' },
    { id: 4, name: 'دهن العود الفاخر', icon: '🏺', cost: 400, desc: 'عطر كبار الشخصيات' },
    { id: 5, name: 'الوردة الجورية النادرة', icon: '🌹', cost: 200, desc: 'هدية المحبة والاحترام' },
    { id: 6, name: 'ألماسة حسان برو', icon: '💎', cost: 2000, desc: 'أغلى وأندر هدايا الشات' }
  ];

  const handleSendGift = () => {
    const gift = GIFTS.find((g) => g.id === selectedGiftId) || GIFTS[0];
    const targetUser = selectedGiftRecipient || (onlineUsers[0]?.username ?? 'الجميع');

    confetti({ particleCount: 80, spread: 100, origin: { y: 0.5 } });
    soundboard.playVictory();
    onSendChatMessage(
      `🎁✨ أهدى [${currentUser.username}] هدية فاخرة (${gift.name} ${gift.icon}) إلى العضو المحترم [${targetUser}] مع خالص التقدير!`
    );
    onShowToast(`تم إرسال [${gift.name}] إلى ${targetUser} بنجاح! 🎁`, 'success');
  };

  // Voice Note Recorder (MediaRecorder API)
  const handleStartVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setVoiceAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecordingVoice(true);
      onShowToast('🎙️ جاري تسجيل البصمة الصوتية...', 'info');
    } catch {
      onShowToast('تعذر الوصول إلى الميكروفون لتسجيل الصوت', 'error');
    }
  };

  const handleStopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecordingVoice) {
      mediaRecorderRef.current.stop();
      setIsRecordingVoice(false);
      onShowToast('تم حفظ البصمة الصوتية ✔️ جاهزة للمشاركة', 'success');
    }
  };

  // Quick Poll Publisher
  const handlePublishPoll = () => {
    if (!pollQuestion.trim()) {
      onShowToast('يرجى كتابة سؤال الاستطلاع', 'error');
      return;
    }
    const opt1 = pollOpt1.trim() || 'نعم 🦅';
    const opt2 = pollOpt2.trim() || 'لا 🕊️';
    onSendChatMessage(`📊 استطلاع رأي من [${currentUser.username}]:\n❓ ${pollQuestion}\n1️⃣ ${opt1}\n2️⃣ ${opt2}\n(صوّت بكتابة 1 أو 2 في الشات)`);
    setPollQuestion('');
    setPollOpt1('');
    setPollOpt2('');
    onShowToast('تم نشر استطلاع الرأي في الغرفة 📊', 'success');
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 text-right animate-in fade-in duration-200"
    >
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-amber-500/40 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-[#241a12] via-[#352517] to-[#241a12] text-amber-200 p-3 sm:p-4 flex items-center justify-between border-b border-amber-600/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm text-amber-100">جناح حسان برو الإبداعي (Mega Suite)</h3>
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black">
                  50+ ميزة
                </span>
              </div>
              <p className="text-[10px] text-amber-300/80">ألعاب، هدايا فاخرة، صوتيات، زخارف إسلامية، وميزات ذكية</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-red-600/90 hover:bg-red-700 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Categories Tab Navigation */}
        <div className="grid grid-cols-6 bg-[#1a130d] text-[10px] sm:text-[11px] font-bold border-b border-[#3e2c1c]">
          <button
            type="button"
            onClick={() => setActiveTab('games')}
            className={`py-2.5 px-1 text-center flex flex-col sm:flex-row items-center justify-center gap-1 transition-colors border-b-2 ${
              activeTab === 'games'
                ? 'border-amber-400 text-amber-300 bg-white/5 font-black'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>الألعاب</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gifts')}
            className={`py-2.5 px-1 text-center flex flex-col sm:flex-row items-center justify-center gap-1 transition-colors border-b-2 ${
              activeTab === 'gifts'
                ? 'border-amber-400 text-amber-300 bg-white/5 font-black'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>الهدايا</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audio')}
            className={`py-2.5 px-1 text-center flex flex-col sm:flex-row items-center justify-center gap-1 transition-colors border-b-2 ${
              activeTab === 'audio'
                ? 'border-amber-400 text-amber-300 bg-white/5 font-black'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>الصوتيات</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tools')}
            className={`py-2.5 px-1 text-center flex flex-col sm:flex-row items-center justify-center gap-1 transition-colors border-b-2 ${
              activeTab === 'tools'
                ? 'border-amber-400 text-amber-300 bg-white/5 font-black'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>الزخرفة</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('culture')}
            className={`py-2.5 px-1 text-center flex flex-col sm:flex-row items-center justify-center gap-1 transition-colors border-b-2 ${
              activeTab === 'culture'
                ? 'border-amber-400 text-amber-300 bg-white/5 font-black'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>المواقيت</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('starred')}
            className={`py-2.5 px-1 text-center flex flex-col sm:flex-row items-center justify-center gap-1 transition-colors border-b-2 ${
              activeTab === 'starred'
                ? 'border-amber-400 text-amber-300 bg-white/5 font-black'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>المفضلة</span>
          </button>
        </div>

        {/* Tab Body Contents */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 text-xs bg-slate-50">
          
          {/* TAB 1: GAMES & CHALLENGES */}
          {activeTab === 'games' && (
            <div className="space-y-3.5">
              
              {/* 1. Lucky Wheel (عجلة الحظ) */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between border-b pb-1.5">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <RotateCw className="w-4 h-4 text-amber-500" />
                    <span>عجلة الحظ اليومية لحسان برو 🎡</span>
                  </span>
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-bold">
                    فرصة الفوز بـ 2,500 نقطة
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center py-2">
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    <div
                      className="w-32 h-32 rounded-full border-4 border-amber-500 shadow-md flex items-center justify-center bg-gradient-to-tr from-amber-400 via-rose-400 to-indigo-500 transition-transform duration-[3000ms] ease-out text-white font-black text-center text-[10px]"
                      style={{ transform: `rotate(${wheelRotation}deg)` }}
                    >
                      <div className="w-24 h-24 rounded-full bg-white/90 text-slate-800 flex items-center justify-center shadow-inner font-mono font-bold text-xs p-1">
                        حسان 🦅 برو
                      </div>
                    </div>
                    {/* Needle Indicator */}
                    <div className="absolute -top-1 w-0 h-0 border-x-8 border-x-transparent border-t-12 border-t-red-600 z-10 drop-shadow-xs" />
                  </div>

                  <button
                    type="button"
                    onClick={handleSpinWheel}
                    disabled={isSpinning}
                    className="mt-3 px-6 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-black shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isSpinning ? 'جاري تدوير العجلة...' : 'تدوير العجلة الآن 🎯'}
                  </button>

                  {wheelPrize && (
                    <div className="mt-2 text-center text-xs font-black text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 animate-bounce">
                      {wheelPrize}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Trivia Quiz Bot (مسابقات حسان برو) */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between border-b pb-1.5">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-indigo-600" />
                    <span>روبوت مسابقات حسان برو 🎯</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full font-bold">
                      نقاطك: {triviaScore}
                    </span>
                    {triviaActive && (
                      <span className="text-[10px] text-rose-600 font-mono font-black">
                        ⏱️ {triviaTimer} ث
                      </span>
                    )}
                  </div>
                </div>

                {!triviaActive ? (
                  <div className="text-center py-2 space-y-2">
                    <p className="text-slate-600 text-[11px]">
                      أجب عن أسئلة التراث والثقافة العربية واربح نقاطاً تعزز رتبتك في الغرفة!
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setTriviaActive(true);
                        setTriviaIndex(0);
                        setTriviaScore(0);
                        setTriviaTimer(15);
                        setTriviaSelected(null);
                      }}
                      className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-xs cursor-pointer"
                    >
                      بدء التحدي الآن 🔥
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900">
                      {TRIVIA_QUESTIONS[triviaIndex].question}
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      {TRIVIA_QUESTIONS[triviaIndex].options.map((opt, i) => {
                        const isCorrect = i === TRIVIA_QUESTIONS[triviaIndex].correct;
                        const isSelected = triviaSelected === i;

                        let btnClass = 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50';
                        if (triviaSelected !== null) {
                          if (isCorrect) btnClass = 'bg-emerald-100 border-emerald-500 text-emerald-900 font-bold';
                          else if (isSelected) btnClass = 'bg-rose-100 border-rose-500 text-rose-900 font-bold';
                        }

                        return (
                          <button
                            key={opt}
                            type="button"
                            disabled={triviaSelected !== null}
                            onClick={() => {
                              setTriviaSelected(i);
                              if (isCorrect) {
                                soundboard.playVictory();
                                setTriviaScore((s) => s + 500);
                                confetti({ particleCount: 30, spread: 60 });
                                onShowToast('إجابة صحيحة! +500 نقطة 🎯', 'success');
                              } else {
                                onShowToast('إجابة خاطئة! حظاً أوفر ❌', 'error');
                              }
                            }}
                            className={`p-2 rounded-xl border text-center transition-all cursor-pointer text-[11px] ${btnClass}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>

                    {triviaSelected !== null && (
                      <div className="pt-1 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500">
                          {TRIVIA_QUESTIONS[triviaIndex].hint}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (triviaIndex + 1 < TRIVIA_QUESTIONS.length) {
                              setTriviaIndex((idx) => idx + 1);
                              setTriviaSelected(null);
                              setTriviaTimer(15);
                            } else {
                              onSendChatMessage(`🏆 أكمل [${currentUser.username}] تحدي مسابقات حسان برو بنتيجة ${triviaScore} نقطة!`);
                              setTriviaActive(false);
                            }
                          }}
                          className="px-3 py-1 rounded-lg bg-[#241a12] text-amber-300 font-bold text-[10px] cursor-pointer"
                        >
                          {triviaIndex + 1 < TRIVIA_QUESTIONS.length ? 'السؤال التالي ➔' : 'إنهاء المسابقة 🏁'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 3. Dice, Coin Flip & Rock Paper Scissors Grid */}
              <div className="grid grid-cols-3 gap-2">
                {/* Dice */}
                <div className="p-2.5 bg-white rounded-2xl border border-slate-200 text-center flex flex-col justify-between">
                  <span className="font-bold text-[11px] text-slate-800">رمي النرد 🎲</span>
                  <div className="flex items-center justify-center gap-1.5 my-2">
                    <span className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-300 flex items-center justify-center font-black text-amber-800 text-sm shadow-xs">
                      {dice1}
                    </span>
                    <span className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-300 flex items-center justify-center font-black text-amber-800 text-sm shadow-xs">
                      {dice2}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRollDice}
                    disabled={isRollingDice}
                    className="w-full py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] cursor-pointer"
                  >
                    رمي النرد
                  </button>
                </div>

                {/* Coin Flip */}
                <div className="p-2.5 bg-white rounded-2xl border border-slate-200 text-center flex flex-col justify-between">
                  <span className="font-bold text-[11px] text-slate-800">القرعة 🪙</span>
                  <div className="my-2 h-8 flex items-center justify-center font-black text-xs text-amber-900">
                    {coinResult || 'جاهز للرمي'}
                  </div>
                  <button
                    type="button"
                    onClick={handleFlipCoin}
                    disabled={isFlippingCoin}
                    className="w-full py-1 rounded-lg bg-slate-800 hover:bg-black text-amber-300 font-bold text-[10px] cursor-pointer"
                  >
                    رمي العملة
                  </button>
                </div>

                {/* Rock Paper Scissors */}
                <div className="p-2.5 bg-white rounded-2xl border border-slate-200 text-center flex flex-col justify-between">
                  <span className="font-bold text-[11px] text-slate-800">حجرة ورقة مقص ✂️</span>
                  <div className="flex items-center justify-center gap-1 my-2">
                    <button onClick={() => handlePlayRPS('حجرة 🪨')} className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-xs">🪨</button>
                    <button onClick={() => handlePlayRPS('ورقة 📄')} className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-xs">📄</button>
                    <button onClick={() => handlePlayRPS('مقص ✂️')} className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-xs">✂️</button>
                  </div>
                  <span className="text-[9px] text-slate-500 truncate block">
                    {rpsResult ? 'تم التحدي' : 'اختر يدك'}
                  </span>
                </div>
              </div>

              {/* 4. Falcon Flight Mini-Game */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between border-b pb-1">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span>🦅 لعبة طيران الصقر (Falcon Flight)</span>
                  </span>
                  <span className="text-[10px] text-amber-700 font-mono font-bold">
                    النقاط: {flightScore}م
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center">
                  <canvas
                    ref={canvasRef}
                    width={280}
                    height={140}
                    className="rounded-xl border border-slate-300 shadow-inner bg-slate-900 cursor-pointer"
                  />
                  {!isPlayingFlight ? (
                    <button
                      type="button"
                      onClick={startFalconFlight}
                      className="mt-2 px-4 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] shadow-xs cursor-pointer"
                    >
                      بدء الطيران (اضغط للقفز) 🦅
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-500 mt-1">انقر على الشاشة داخل اللعبة لرفع الصقر!</span>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: VIRTUAL LUXURY GIFTS */}
          {activeTab === 'gifts' && (
            <div className="space-y-3">
              <div className="p-3 bg-gradient-to-r from-amber-50 to-rose-50 rounded-2xl border border-amber-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-amber-950 text-xs">متجر الهدايا الفاخرة لحسان برو 🎁</h4>
                  <p className="text-[10px] text-amber-800">أرسل هدايا مميزة تضيء الشات باحتفالية كاملة للأعضاء</p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-slate-500 block">رصيد نقاطك:</span>
                  <span className="font-mono font-black text-amber-800 text-sm">{currentUser.points}</span>
                </div>
              </div>

              {/* Recipient Picker */}
              <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">إلى العضو:</label>
                <select
                  value={selectedGiftRecipient}
                  onChange={(e) => setSelectedGiftRecipient(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-slate-50 font-bold"
                >
                  {onlineUsers.map((u) => (
                    <option key={u.id} value={u.username}>
                      {u.username} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Gifts Grid */}
              <div className="grid grid-cols-2 gap-2">
                {GIFTS.map((g) => {
                  const isSelected = selectedGiftId === g.id;
                  return (
                    <div
                      key={g.id}
                      onClick={() => setSelectedGiftId(g.id)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 ${
                        isSelected
                          ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400 shadow-xs'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-2xl">{g.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-900 truncate text-[11px]">{g.name}</div>
                        <div className="text-[9px] text-slate-500 truncate">{g.desc}</div>
                        <div className="text-[10px] font-mono font-black text-amber-700 mt-0.5">
                          {g.cost} نقطة
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleSendGift}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-rose-600 to-amber-600 text-white font-black text-xs shadow-md hover:opacity-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Gift className="w-4 h-4" />
                <span>إرسال الهدية الآن للمحادثة العامة 🎁</span>
              </button>
            </div>
          )}

          {/* TAB 3: AUDIO & DJ SOUNDBOARD */}
          {activeTab === 'audio' && (
            <div className="space-y-3">
              
              {/* DJ Soundboard */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-emerald-600" />
                  <span>ساوند بورد دي جي المايك (Soundboard) 🎛️</span>
                </h4>
                <p className="text-[10px] text-slate-500">
                  مؤثرات صوتية حية للعزف والتفاعل المباشر أثناء الحديث على المايك:
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => soundboard.playApplause()}
                    className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 flex items-center justify-center gap-1.5 cursor-pointer text-[11px]"
                  >
                    <span>تصفيق حار 👏</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => soundboard.playVictory()}
                    className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold border border-amber-200 flex items-center justify-center gap-1.5 cursor-pointer text-[11px]"
                  >
                    <span>نغمة الفوز 🎺</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => soundboard.playAirHorn()}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold border border-rose-200 flex items-center justify-center gap-1.5 cursor-pointer text-[11px]"
                  >
                    <span>بوق حماسي 📯</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => soundboard.playDrumRoll()}
                    className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold border border-indigo-200 flex items-center justify-center gap-1.5 cursor-pointer text-[11px]"
                  >
                    <span>رمية طبلة 🥁</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => soundboard.playOudChord()}
                    className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold border border-purple-200 flex items-center justify-center gap-1.5 cursor-pointer text-[11px]"
                  >
                    <span>دندنة عود 🎵</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      confetti({ particleCount: 50, spread: 80 });
                      soundboard.playVictory();
                      onSendChatMessage(`🎆 أطلق [${currentUser.username}] مدفع الألعاب النارية في الغرفة!`);
                    }}
                    className="p-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-800 font-bold border border-pink-200 flex items-center justify-center gap-1.5 cursor-pointer text-[11px]"
                  >
                    <span>ألعاب نارية 🎆</span>
                  </button>
                </div>
              </div>

              {/* Ambient Radio */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-amber-600" />
                    <span>أجواء وراديو حسان برو 📻</span>
                  </h4>
                  <span className="text-[9px] text-emerald-600 font-bold">بث صوتي بيئي</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundboard.playOudChord();
                      onShowToast('تم تشغيل تقاسيم العود الأصيلة 🎵', 'info');
                    }}
                    className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-[10px] cursor-pointer"
                  >
                    تقاسيم عود 🎻
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundboard.playAirHorn();
                      onShowToast('تم تشغيل شيلة الصحراء 🦅', 'info');
                    }}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-900 font-bold text-[10px] cursor-pointer"
                  >
                    شيلة الصحراء 🏜️
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundboard.playApplause();
                      onShowToast('تم تشغيل مجلس الصوت والترحيب ☕', 'info');
                    }}
                    className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 text-indigo-900 font-bold text-[10px] cursor-pointer"
                  >
                    مجلس القهوة ☕
                  </button>
                </div>
              </div>

              {/* Voice Note Recorder */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-rose-600" />
                  <span>مسجل البصمات الصوتية (Voice Note) 🎙️</span>
                </h4>

                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2">
                    {!isRecordingVoice ? (
                      <button
                        type="button"
                        onClick={handleStartVoiceRecording}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                      >
                        <Mic className="w-3.5 h-3.5" />
                        <span>تسجيل بصمة</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleStopVoiceRecording}
                        className="px-3 py-1.5 rounded-lg bg-red-700 animate-pulse text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                      >
                        <Square className="w-3.5 h-3.5" />
                        <span>إيقاف وحفظ</span>
                      </button>
                    )}
                    {isRecordingVoice && (
                      <span className="text-[10px] text-rose-600 font-bold animate-pulse">
                        🔴 جاري التسجيل الحي...
                      </span>
                    )}
                  </div>

                  {voiceAudioUrl && (
                    <audio src={voiceAudioUrl} controls className="h-7 max-w-[170px]" />
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: CALLIGRAPHY & TOOLS */}
          {activeTab === 'tools' && (
            <div className="space-y-3">
              
              {/* Calligraphy Decorator */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Type className="w-4 h-4 text-indigo-600" />
                  <span>مزخرف النصوص والأسماء العربية الاحترافي ✍️</span>
                </h4>

                <input
                  type="text"
                  placeholder="اكتب اسمك أو عبارتك للزخرفة الفورية..."
                  value={calligraphyInput}
                  onChange={(e) => setCalligraphyInput(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl text-xs bg-slate-50 focus:bg-white outline-none"
                />

                <div className="space-y-1.5 pt-1">
                  {[1, 2, 3, 4, 5, 6].map((styleId) => {
                    const sample = calligraphyInput.trim() || 'حسان برو';
                    const decorated = decorateText(sample, styleId);
                    return (
                      <div
                        key={styleId}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                      >
                        <span className="font-bold text-slate-800 font-mono select-all">
                          {decorated}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(decorated);
                              setCopiedStyleId(styleId);
                              setTimeout(() => setCopiedStyleId(null), 1500);
                              onShowToast('تم نسخ النص المزخرف بنجاح ✔️', 'info');
                            }}
                            className="p-1 rounded bg-white hover:bg-slate-100 border text-[10px] text-slate-600 cursor-pointer"
                            title="نسخ النص"
                          >
                            {copiedStyleId === styleId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onSendChatMessage(decorated);
                              onShowToast('تم إرسال النص المزخرف إلى الشات! 🚀', 'success');
                            }}
                            className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] cursor-pointer"
                          >
                            إرسال
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Phrases */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-amber-600" />
                  <span>العبارات السريعة الجاهزة (Quick Phrases) ⚡</span>
                </h4>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    'السلام عليكم ورحمة الله وبركاته 🌹',
                    'يسعد مساكم جميعاً يا طيبين ☕',
                    'منورين الشات يا هلا والله 🦅',
                    'طابت أوقاتكم بكل خير وسرور ✨',
                    'في أمان الله وحفظه ورعايته 🌙',
                    'ما شاء الله تبارك الرحمن 👑'
                  ].map((phrase) => (
                    <button
                      key={phrase}
                      type="button"
                      onClick={() => {
                        onSendChatMessage(phrase);
                        onShowToast('تم إرسال العبارة السريعة! ⚡', 'info');
                      }}
                      className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold text-[10px] truncate text-right cursor-pointer"
                    >
                      {phrase}
                    </button>
                  ))}
                </div>
              </div>

              {/* Poll Creator */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-emerald-600" />
                  <span>إنشاء استطلاع رأي فوري في الروم 📊</span>
                </h4>
                <input
                  type="text"
                  placeholder="سؤال الاستطلاع..."
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  className="w-full p-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50"
                />
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="text"
                    placeholder="الخيار الأول (مثال: نعم 🦅)"
                    value={pollOpt1}
                    onChange={(e) => setPollOpt1(e.target.value)}
                    className="p-1.5 border border-slate-300 rounded-lg text-[11px] bg-slate-50"
                  />
                  <input
                    type="text"
                    placeholder="الخيار الثاني (مثال: لا 🕊️)"
                    value={pollOpt2}
                    onChange={(e) => setPollOpt2(e.target.value)}
                    className="p-1.5 border border-slate-300 rounded-lg text-[11px] bg-slate-50"
                  />
                </div>
                <button
                  type="button"
                  onClick={handlePublishPoll}
                  className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer"
                >
                  نشر الاستطلاع في الغرفة 📊
                </button>
              </div>

              {/* Chat Actions: Clear & Export */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClearLocalChat}
                  className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>مسح الشاشة محلياً</span>
                </button>
                <button
                  type="button"
                  onClick={onExportChat}
                  className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تصدير سجل الشات</span>
                </button>
              </div>

            </div>
          )}

          {/* TAB 5: CULTURE, PRAYERS & WEATHER */}
          {activeTab === 'culture' && (
            <div className="space-y-3">
              
              {/* Daily Wisdom */}
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-950 space-y-1">
                <span className="text-[10px] font-bold text-amber-700 flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-600" />
                  <span>حكمة ومثل اليوم من أصالة التراث:</span>
                </span>
                <p className="font-bold text-xs leading-relaxed font-serif">
                  « {todayWisdom} »
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onSendChatMessage(`📜 حكمة اليوم: « ${todayWisdom} »`);
                    onShowToast('تمت مشاركة حكمة اليوم في الروم!', 'info');
                  }}
                  className="mt-1 text-[10px] text-amber-700 hover:underline font-bold"
                >
                  مشاركة الحكمة في الروم ➔
                </button>
              </div>

              {/* Prayer Times Widget */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between border-b pb-1">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>مواقيت الصلاة والتقويم الهجري 🕌</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">1448 هـ</span>
                </div>
                <div className="grid grid-cols-5 gap-1 text-center font-mono text-[10px]">
                  <div className="p-1.5 rounded-lg bg-slate-50 border">
                    <span className="block text-slate-500 font-bold">الفجر</span>
                    <span className="font-black text-slate-800">04:32</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-50 border">
                    <span className="block text-slate-500 font-bold">الظهر</span>
                    <span className="font-black text-slate-800">11:58</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-50 border">
                    <span className="block text-slate-500 font-bold">العصر</span>
                    <span className="font-black text-slate-800">03:22</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-300">
                    <span className="block text-emerald-700 font-bold">المغرب</span>
                    <span className="font-black text-emerald-900">05:48</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-50 border">
                    <span className="block text-slate-500 font-bold">العشاء</span>
                    <span className="font-black text-slate-800">07:18</span>
                  </div>
                </div>
              </div>

              {/* Weather in Arab Capitals */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5 border-b pb-1">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>طقس العواصم العربية ☀️</span>
                </span>
                <div className="grid grid-cols-5 gap-1 text-center text-[10px]">
                  <div className="p-1.5 rounded-lg bg-amber-50 border border-amber-200">
                    <span className="block font-bold text-slate-600">الرياض</span>
                    <span className="font-mono font-black text-amber-800">32°C ☀️</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-sky-50 border border-sky-200">
                    <span className="block font-bold text-slate-600">دبي</span>
                    <span className="font-mono font-black text-sky-800">34°C 🌤️</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-50 border">
                    <span className="block font-bold text-slate-600">القاهرة</span>
                    <span className="font-mono font-black text-slate-800">28°C ☀️</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-50 border">
                    <span className="block font-bold text-slate-600">بغداد</span>
                    <span className="font-mono font-black text-slate-800">30°C 🌤️</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200">
                    <span className="block font-bold text-slate-600">صنعاء</span>
                    <span className="font-mono font-black text-emerald-800">24°C ⛅</span>
                  </div>
                </div>
              </div>

              {/* Appearance & Comfort Toggles */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
                <span className="font-bold text-slate-800 text-xs block border-b pb-1">
                  تخصيص المظهر وراحة العين 🌓
                </span>

                {/* Eye comfort toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700">🌙 فلتر راحة العين الليلي (دافئ):</span>
                  <button
                    type="button"
                    onClick={onToggleEyeComfort}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                      eyeComfort ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {eyeComfort ? 'مفعل ✔️' : 'معطل ✕'}
                  </button>
                </div>

                {/* Font Size Selector */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700">حجم خط المحادثة:</span>
                  <div className="flex items-center gap-1 font-mono text-[10px]">
                    {(['sm', 'base', 'lg', 'xl'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => onChangeFontSize(s)}
                        className={`px-2 py-0.5 rounded font-bold transition-colors cursor-pointer ${
                          chatFontSize === s ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {s === 'sm' ? 'صغير' : s === 'base' ? 'عادي' : s === 'lg' ? 'كبير' : 'ضخم'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 6: STARRED MESSAGES */}
          {activeTab === 'starred' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b pb-1">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                  <span>الرسائل المحفوظة في المفضلة ({starredMessages.length})</span>
                </span>
                <span className="text-[10px] text-slate-400">حفظ محلي فوري</span>
              </div>

              {starredMessages.length === 0 ? (
                <div className="py-8 text-center text-slate-400 space-y-1">
                  <Star className="w-8 h-8 mx-auto opacity-30" />
                  <p className="text-[11px]">لا توجد رسائل محفوظة في المفضلة بعد.</p>
                  <p className="text-[10px] text-slate-500">
                    اضغط على أيقونة النجمة ⭐ بجانب أي رسالة في الشات لحفظها هنا والرجوع إليها لاحقاً!
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-72 overflow-y-auto">
                  {starredMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-start justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                          <span className="font-bold text-slate-800">{msg.username}</span>
                          <span className="font-mono">{msg.time}</span>
                        </div>
                        <p className="text-slate-800 text-[11px] font-medium leading-relaxed">
                          {msg.text}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onToggleStarMessage(msg)}
                        className="text-amber-500 hover:text-rose-600 p-1 cursor-pointer"
                        title="إزالة من المفضلة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer info bar */}
        <div className="bg-[#241a12] text-amber-200 px-3 py-2 text-[10px] flex items-center justify-between border-t border-amber-600/30">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>شات حسان برو 🦅 • بيئة آمنة وتفاعلية عالية الأداء</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer"
          >
            إغلاق الجناح
          </button>
        </div>

      </div>
    </div>
  );
};
