import React, { useState, useEffect, useRef } from 'react';
import {
  Gamepad2,
  Sparkles,
  Trophy,
  Award,
  Zap,
  RotateCw,
  CheckCircle,
  XCircle,
  HelpCircle,
  Flame,
  Brain,
  Timer,
  Heart,
  Target,
  ArrowRight,
  Send,
  Star,
  Play,
  X,
  Compass,
  FileText,
  Type,
  Hash,
  Globe
} from 'lucide-react';
import confetti from '../utils/confetti';

export interface InteractiveGamesSuiteProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserPoints: number;
  onAddPoints: (amount: number, reason: string) => void;
  onBroadcastGameWin?: (gameName: string, pointsWon: number) => void;
  onShowToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

// 1. Poetry Verses Data
const POETRY_VERSES = [
  {
    firstHalf: 'إذا الشّعْبُ يَوْمَاً أرَادَ الـحَـيَـاةَ',
    options: ['فَلا بُدَّ أنْ يَسْتَجِيبَ القَدَر', 'فلا تبتئس بما قد مضى', 'فشمر عن الساعدين وجُد', 'تسامى إلى المجد فوق الذرى'],
    correct: 0,
    author: 'أبو القاسم الشابي'
  },
  {
    firstHalf: 'الخَيْلُ وَاللّيْلُ وَالبَيْداءُ تَعرِفُني',
    options: ['وَالسّيفُ وَالرّمحُ وَالقِرطاسُ وَالقَلَمُ', 'والبدر في جنح الدجى يلثمُ', 'وجياد خيلي في الوغى تقتحمُ', 'والطير في عالي الغصون ترنمُ'],
    correct: 0,
    author: 'أبو الطيب المتنبي'
  },
  {
    firstHalf: 'أَلا كُلُّ شَيءٍ ما خَلا اللَّهَ باطِلُ',
    options: ['وَكُلُّ نَعيمٍ لا مَحالَةَ زائِلُ', 'وكل فتى في غمرة الموت نازلُ', 'وكل ظلام في النهار يزائلُ', 'وكل رفيق في الشدائد خاذلُ'],
    correct: 0,
    author: 'لبيد بن ربيعة'
  },
  {
    firstHalf: 'على قَدْرِ أهْلِ العَزْم تأتي العَزائِمُ',
    options: ['وتَأتي علَى قَدْرِ الكِرامِ المَكارمُ', 'وتخفق في قلب الشجاع الهمائمُ', 'ويقهر في ساح النزال المقاومُ', 'وتشرق في عين الصباح المياسمُ'],
    correct: 0,
    author: 'المتنبي'
  }
];

// 2. Arabic Riddles & Fawazeer
const ARABIC_RIDDLES = [
  {
    riddle: 'شيء يمشي بلا رجلين ويبكي بلا عينين، فما هو؟',
    answer: 'السحابة / الغيمة ☁️',
    hint: 'تسقي الأرض والزرع'
  },
  {
    riddle: 'أنا بيت ليس له أبواب ولا نوافذ، فما أنا؟',
    answer: 'بيت الشعر العربي 📜',
    hint: 'يُنظم بالكلمات والقوافي'
  },
  {
    riddle: 'ابن أمك وأبيك، وليس بأختك ولا بأخيك، فمن يكون؟',
    answer: 'أنت نفسك! 👤',
    hint: 'انظر في المرآة'
  },
  {
    riddle: 'شيء كلما زاد نقص، فما هو؟',
    answer: 'العمر ⏳',
    hint: 'يمضي بالسنوات والأيام'
  },
  {
    riddle: 'يسمع بلا أذن ويتكلم بلا لسان، فما هو؟',
    answer: 'الهاتف / التلفون 📱',
    hint: 'جهاز تحمله بيدك دائماً'
  }
];

// 3. Truth or Dare Questions
const TRUTH_OR_DARE_LIST = {
  truth: [
    'ما هو أكثر موقف محرج تعرضت له في حياتك؟',
    'ما هي الأمنية التي تتمنى تحقيقها قبل نهاية هذا العام؟',
    'من هو أعز شخص تعرفت عليه في هذا الشات؟',
    'لو أتيحت لك فرصة السفر لأي دولة غداً، إلى أين ستذهب؟',
    'ما هي الصفة التي تفخر بها أكثر من غيرها في شخصيتك؟',
    'ما هي أكبر مخاوفك في الحياة؟',
    'لو خيروك بين الشهرة والثروة ماذا تختار؟',
    'ما هو الشيء الذي لا تسامح عليه أبداً؟'
  ],
  dare: [
    'أنشد بيتاً شعرياً جميلاً بصوتك على المايك الآن!',
    'أرسل رسالة شكر وإهداء لأول شخص تراه في قائمة المتواجدين.',
    'اكتب عبارة ترحيبية راقية في الشات العام بالخط الكوفي أو المزخرف.',
    'غيّر عبارتك وحالتك الشخصية إلى: "صقر محلق في سماء المجد 🦅".',
    'قم بإهداء وردة 🌹 أو قهوة ☕ لعضو متفاعل في الروم.',
    'قل كلمة طيبة لثلاثة أعضاء متواجدين في الغرفة الآن.',
    'قل نكتة طريفة ومضحكة للأعضاء في الشات.'
  ]
};

// 4. Flags Quiz Data
const FLAGS_QUIZ = [
  { flag: '🇸🇦', country: 'السعودية', options: ['السعودية', 'الإمارات', 'الكويت', 'عُمان'] },
  { flag: '🇪🇬', country: 'مصر', options: ['سوريا', 'مصر', 'العراق', 'اليمن'] },
  { flag: '🇦🇪', country: 'الإمارات', options: ['فلسطين', 'الأردن', 'الإمارات', 'الكويت'] },
  { flag: '🇲🇦', country: 'المغرب', options: ['تونس', 'الجزائر', 'المغرب', 'ليبيا'] },
  { flag: '🇸🇾', country: 'سوريا', options: ['سوريا', 'مصر', 'العراق', 'اليمن'] },
  { flag: '🇶🇦', country: 'قطر', options: ['البحرين', 'قطر', 'الكويت', 'عُمان'] },
  { flag: '🇯🇴', country: 'الأردن', options: ['فلسطين', 'السودان', 'الأردن', 'الإمارات'] },
  { flag: '🇰🇼', country: 'الكويت', options: ['عُمان', 'اليمن', 'الكويت', 'العراق'] },
  { flag: '🇧🇭', country: 'البحرين', options: ['قطر', 'البحرين', 'لبنان', 'تونس'] },
  { flag: '🇴🇲', country: 'سلطنة عُمان', options: ['سلطنة عُمان', 'اليمن', 'السعودية', 'الأردن'] }
];

// 5. Arabic Speed Typing Challenge Sentences
const TYPING_SENTENCES = [
  'الصقر الحر لا يرضى بغير القمم مسكناً وملاذاً سامياً',
  'خير الكلام ما قل ودل وخير العمل ما نفع واستمر طويلاً',
  'أهلاً وسهلاً بجميع الكرام في مجلس شات حسان برو العريق',
  'لسان الفتى نصف ونصف فؤاده فلم يبق إلا صورة اللحم والدم',
  'من جد وجد ومن زرع حصد ومن سار على درب الفلاح وصل'
];

// 6. Arabic Proverbs Matcher
const PROVERBS_LIST = [
  { prompt: 'الصديق وقت...', answer: 'الضيق', options: ['الضيق', 'الفرح', 'السفر', 'الرخاء'] },
  { prompt: 'رب أخ لك لم...', answer: 'تلده أمك', options: ['تلده أمك', 'تعرفه من قبل', 'تلقه في سفر', 'تسمع به'] },
  { prompt: 'الجار قبل...', answer: 'الدار', options: ['الدار', 'السفر', 'الزاد', 'الرفيق'] },
  { prompt: 'لسانك حصانك إن صنته صانك وإن...', answer: 'خنته خانك', options: ['خنته خانك', 'أطلقته هانك', 'أهنته هانك', 'أهملته ضامك'] },
  { prompt: 'من حفر حفرة لأخيه...', answer: 'وقع فيها', options: ['وقع فيها', 'سقط فيها', 'خاب مسعاه', 'ندم كثيراً'] },
  { prompt: 'ما كل ما يتمنى المرء يدركه تجري الرياح بما لا...', answer: 'تشتهي السفن', options: ['تشتهي السفن', 'يرجو البشر', 'ترجو القلوب', 'يهوى الأمل'] }
];

export const InteractiveGamesSuite: React.FC<InteractiveGamesSuiteProps> = ({
  isOpen,
  onClose,
  currentUserPoints,
  onAddPoints,
  onBroadcastGameWin,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<
    'memory' | 'clicker' | 'poetry' | 'math' | 'riddles' | 'tod' | 'flags' | 'typing' | 'guessNum' | 'proverbs' | 'wordChain'
  >('memory');

  // Mini-Game 1: Memory Cards
  const ICONS = ['🦅', '👑', '💎', '🔥', '🌹', '⚡'];
  const [cards, setCards] = useState<Array<{ id: number; icon: string; isFlipped: boolean; isMatched: boolean }>>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [memoryMoves, setMemoryMoves] = useState(0);
  const [memoryWon, setMemoryWon] = useState(false);

  const initMemoryGame = () => {
    const deck = [...ICONS, ...ICONS]
      .sort(() => Math.random() - 0.5)
      .map((icon, idx) => ({
        id: idx,
        icon,
        isFlipped: false,
        isMatched: false
      }));
    setCards(deck);
    setFlippedCards([]);
    setMemoryMoves(0);
    setMemoryWon(false);
  };

  useEffect(() => {
    if (isOpen && activeTab === 'memory' && cards.length === 0) {
      initMemoryGame();
    }
  }, [isOpen, activeTab]);

  const handleCardClick = (index: number) => {
    if (cards[index].isFlipped || cards[index].isMatched || flippedCards.length === 2) return;

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedCards, index];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMemoryMoves((m) => m + 1);
      const [first, second] = newFlipped;
      if (cards[first].icon === cards[second].icon) {
        newCards[first].isMatched = true;
        newCards[second].isMatched = true;
        setCards(newCards);
        setFlippedCards([]);

        // Check if all matched
        if (newCards.every((c) => c.isMatched)) {
          setMemoryWon(true);
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          const reward = 50;
          onAddPoints(reward, 'الفوز في لعبة الذاكرة');
          onShowToast(`مبروك! أكملت لعبة الذاكرة في ${memoryMoves + 1} حركة وحصلت على ${reward} نقطة! 🏆`, 'success');
          onBroadcastGameWin?.('لعبة الذاكرة والصقور', reward);
        }
      } else {
        setTimeout(() => {
          newCards[first].isFlipped = false;
          newCards[second].isFlipped = false;
          setCards(newCards);
          setFlippedCards([]);
        }, 800);
      }
    }
  };

  // Mini-Game 2: Falcon Clicker Speed Challenge (5 seconds)
  const [clickerTime, setClickerTime] = useState(5);
  const [clickerCount, setClickerCount] = useState(0);
  const [clickerActive, setClickerActive] = useState(false);
  const [clickerFinished, setClickerFinished] = useState(false);
  const [cpsScore, setCpsScore] = useState(0);

  const startClicker = () => {
    setClickerTime(5);
    setClickerCount(0);
    setClickerActive(true);
    setClickerFinished(false);
    setCpsScore(0);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (clickerActive && clickerTime > 0) {
      timer = setInterval(() => {
        setClickerTime((t) => t - 1);
      }, 1000);
    } else if (clickerActive && clickerTime === 0) {
      setClickerActive(false);
      setClickerFinished(true);
      const cps = parseFloat((clickerCount / 5).toFixed(1));
      setCpsScore(cps);
      const reward = Math.round(cps * 5);
      onAddPoints(reward, 'تحدي سرعة النقر CPS');
      confetti({ particleCount: 80, spread: 60 });
      onShowToast(`انتهى التحدي! سرعتك: ${cps} نقرة/ثانية. كسبت ${reward} نقطة! ⚡`, 'success');
      onBroadcastGameWin?.('تحدي سرعة النقر CPS', reward);
    }
    return () => clearInterval(timer);
  }, [clickerActive, clickerTime, clickerCount]);

  const handleClickerTap = () => {
    if (clickerActive) {
      setClickerCount((c) => c + 1);
    }
  };

  // Mini-Game 3: Poetry Verses Completion
  const [poetryIndex, setPoetryIndex] = useState(0);
  const [poetrySelected, setPoetrySelected] = useState<number | null>(null);

  const handlePoetryAnswer = (optIndex: number) => {
    if (poetrySelected !== null) return;
    setPoetrySelected(optIndex);
    const correct = POETRY_VERSES[poetryIndex].correct;
    if (optIndex === correct) {
      confetti({ particleCount: 70, spread: 60 });
      onAddPoints(30, 'إكمال البيت الشعري بنجاح');
      onShowToast('إجابة صحيحة! صح لسانك ونبضك 📜 +30 نقطة', 'success');
      onBroadcastGameWin?.('تحدي الشعر النبطي والفصيح', 30);
    } else {
      onShowToast('إجابة غير صحيحة، حاول في البيت القادم!', 'error');
    }
  };

  const nextPoetry = () => {
    setPoetrySelected(null);
    setPoetryIndex((prev) => (prev + 1) % POETRY_VERSES.length);
  };

  // Mini-Game 4: Math Speed Duel
  const [mathNum1, setMathNum1] = useState(12);
  const [mathNum2, setMathNum2] = useState(7);
  const [mathOp, setMathOp] = useState<'+' | '-' | '×'>('+');
  const [mathInput, setMathInput] = useState('');
  const [mathStreak, setMathStreak] = useState(0);

  const generateNewMath = () => {
    const ops: Array<'+' | '-' | '×'> = ['+', '-', '×'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    const n1 = Math.floor(Math.random() * 20) + 5;
    const n2 = Math.floor(Math.random() * 15) + 3;
    setMathNum1(n1);
    setMathNum2(n2);
    setMathOp(op);
    setMathInput('');
  };

  const getCorrectMathAnswer = () => {
    if (mathOp === '+') return mathNum1 + mathNum2;
    if (mathOp === '-') return mathNum1 - mathNum2;
    return mathNum1 * mathNum2;
  };

  const submitMathAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(mathInput, 10);
    if (isNaN(parsed)) return;

    if (parsed === getCorrectMathAnswer()) {
      const newStreak = mathStreak + 1;
      setMathStreak(newStreak);
      const points = 10 * newStreak;
      onAddPoints(points, `حل مسألة حسابية سريعة (سلسلة ${newStreak})`);
      onShowToast(`إجابة عبقرية صحيحة! 🧠 سلسلة إجابات: ${newStreak} (+${points} نقطة)`, 'success');
      confetti({ particleCount: 40, spread: 50 });
      generateNewMath();
    } else {
      setMathStreak(0);
      onShowToast(`خطأ! الإجابة الصحيحة كانت ${getCorrectMathAnswer()}`, 'error');
      generateNewMath();
    }
  };

  // Mini-Game 5: Riddles
  const [riddleIndex, setRiddleIndex] = useState(0);
  const [showRiddleAnswer, setShowRiddleAnswer] = useState(false);

  // Mini-Game 6: Truth or Dare
  const [todType, setTodType] = useState<'truth' | 'dare' | null>(null);
  const [todText, setTodText] = useState<string>('');

  const pickTruthOrDare = (type: 'truth' | 'dare') => {
    setTodType(type);
    const pool = TRUTH_OR_DARE_LIST[type];
    const picked = pool[Math.floor(Math.random() * pool.length)];
    setTodText(picked);
  };

  // Mini-Game 7: Flags Quiz
  const [flagIndex, setFlagIndex] = useState(0);
  const [flagSelected, setFlagSelected] = useState<number | null>(null);
  const [flagScore, setFlagScore] = useState(0);

  const handleSelectFlag = (idx: number) => {
    if (flagSelected !== null) return;
    setFlagSelected(idx);
    const cur = FLAGS_QUIZ[flagIndex];
    if (cur.options[idx] === cur.country) {
      setFlagScore((s) => s + 1);
      const reward = 25;
      onAddPoints(reward, `تخمين علم دولة صحيح: ${cur.country}`);
      onShowToast(`علم صحيح! ${cur.flag} ${cur.country} (+${reward} نقطة)`, 'success');
      confetti({ particleCount: 40, spread: 60 });
    } else {
      onShowToast(`إجابة خاطئة! الدولة الصحيحة هي ${cur.country}`, 'error');
    }
  };

  const nextFlag = () => {
    setFlagSelected(null);
    setFlagIndex((prev) => (prev + 1) % FLAGS_QUIZ.length);
  };

  // Mini-Game 8: Arabic Speed Typing
  const [typingIndex, setTypingIndex] = useState(0);
  const [typingInput, setTypingInput] = useState('');
  const [typingStart, setTypingStart] = useState<number | null>(null);
  const [typingWpm, setTypingWpm] = useState<number | null>(null);
  const [typingDone, setTypingDone] = useState(false);

  const handleTypingChange = (val: string) => {
    if (!typingStart && val.length > 0) {
      setTypingStart(Date.now());
    }
    setTypingInput(val);

    const targetSentence = TYPING_SENTENCES[typingIndex];
    if (val.trim() === targetSentence.trim() && !typingDone) {
      setTypingDone(true);
      const elapsedSec = (Date.now() - (typingStart || Date.now())) / 1000;
      const wordCount = targetSentence.trim().split(/\s+/).length;
      const wpm = Math.round((wordCount / Math.max(elapsedSec, 1)) * 60);
      setTypingWpm(wpm);
      const reward = 40;
      onAddPoints(reward, 'سرعة الكتابة العربية الفائقة');
      onShowToast(`كفو! سرعة خارقة ${wpm} كلمة/دقيقة (+${reward} نقطة) ⚡`, 'success');
      confetti({ particleCount: 60, spread: 80 });
      onBroadcastGameWin?.(`تحدي سرعة الكتابة (${wpm} ك/د)`, reward);
    }
  };

  const resetTyping = () => {
    setTypingInput('');
    setTypingStart(null);
    setTypingWpm(null);
    setTypingDone(false);
    setTypingIndex((prev) => (prev + 1) % TYPING_SENTENCES.length);
  };

  // Mini-Game 9: Secret Number 1-100
  const [secretNum, setSecretNum] = useState(() => Math.floor(Math.random() * 100) + 1);
  const [guessInput, setGuessInput] = useState('');
  const [guessAttempts, setGuessAttempts] = useState(0);
  const [guessHint, setGuessHint] = useState<string | null>(null);
  const [guessWon, setGuessWon] = useState(false);

  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(guessInput, 10);
    if (isNaN(num) || num < 1 || num > 100) return;

    const attempts = guessAttempts + 1;
    setGuessAttempts(attempts);

    if (num === secretNum) {
      setGuessWon(true);
      setGuessHint(`🎯 عبقري! الرقم السري هو ${secretNum} بعد ${attempts} محاولات!`);
      const reward = Math.max(10, 80 - attempts * 5);
      onAddPoints(reward, `تخمين الرقم السري ${secretNum}`);
      onShowToast(`مبروك! حزرت الرقم السري (+${reward} نقطة)`, 'success');
      confetti({ particleCount: 70, spread: 70 });
      onBroadcastGameWin?.(`لعبة تخمين الرقم السري (${secretNum})`, reward);
    } else if (num < secretNum) {
      setGuessHint(`الرقم السري أكبر ⬆️ من ${num}`);
    } else {
      setGuessHint(`الرقم السري أصغر ⬇️ من ${num}`);
    }
    setGuessInput('');
  };

  const resetSecretNum = () => {
    setSecretNum(Math.floor(Math.random() * 100) + 1);
    setGuessInput('');
    setGuessAttempts(0);
    setGuessHint(null);
    setGuessWon(false);
  };

  // Mini-Game 10: Proverbs Matcher
  const [proverbIndex, setProverbIndex] = useState(0);
  const [proverbSelected, setProverbSelected] = useState<number | null>(null);
  const [proverbScore, setProverbScore] = useState(0);

  const handleSelectProverb = (idx: number) => {
    if (proverbSelected !== null) return;
    setProverbSelected(idx);
    const p = PROVERBS_LIST[proverbIndex];
    if (p.options[idx] === p.answer) {
      setProverbScore((s) => s + 1);
      const reward = 20;
      onAddPoints(reward, 'إكمال مثل عربي أصيل');
      onShowToast(`إجابة صحيحة! «${p.prompt} ${p.answer}» (+${reward} نقطة)`, 'success');
      confetti({ particleCount: 35, spread: 50 });
    } else {
      onShowToast(`خطأ! الإكمال الصحيح: ${p.answer}`, 'error');
    }
  };

  const nextProverb = () => {
    setProverbSelected(null);
    setProverbIndex((prev) => (prev + 1) % PROVERBS_LIST.length);
  };

  // Mini-Game 11: Word Chain Game (سباق الحروف)
  const [currentLetter, setCurrentLetter] = useState('س');
  const [chainWords, setChainWords] = useState<string[]>(['صقر', 'رسام', 'مجلس']);
  const [chainInput, setChainInput] = useState('');
  const [chainScore, setChainScore] = useState(0);

  const handleChainSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const word = chainInput.trim();
    if (!word || word.length < 2) return;

    if (!word.startsWith(currentLetter)) {
      onShowToast(`الكلمة يجب أن تبدأ بحرف (${currentLetter})!`, 'error');
      return;
    }

    if (chainWords.includes(word)) {
      onShowToast('تم استخدام هذه الكلمة من قبل، ابحث عن كلمة أخرى!', 'error');
      return;
    }

    const lastChar = word.slice(-1);
    setChainWords((prev) => [word, ...prev]);
    setCurrentLetter(lastChar);
    setChainInput('');
    setChainScore((s) => s + 1);
    const reward = 15;
    onAddPoints(reward, `كلمة صحيحة في سباق الحروف: ${word}`);
    onShowToast(`كلمة ممتازة! الحرف التالي: (${lastChar}) (+${reward} نقطة)`, 'success');
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
        <div className="p-4 bg-gradient-to-r from-amber-950/70 via-slate-900 to-indigo-950/70 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                ميدان الألعاب والمسابقات التفاعلية
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-amber-400" />
                  رصيدك: {currentUserPoints} نقطة
                </span>
              </h2>
              <p className="text-xs text-slate-400">تحديات جماعية، ألعاب ذكاء، شعر، وسرعة بديهة بجوائز حقيقية</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/70 px-3 overflow-x-auto gap-1 py-1.5 scrollbar-none">
          {[
            { id: 'memory', label: 'لعبة الذاكرة', icon: Brain },
            { id: 'flags', label: 'تحدي الأعلام', icon: Globe },
            { id: 'typing', label: 'سرعة الكتابة', icon: Type },
            { id: 'guessNum', label: 'خمن الرقم 1-100', icon: Hash },
            { id: 'proverbs', label: 'أكمل المثل', icon: FileText },
            { id: 'wordChain', label: 'سباق الحروف', icon: RotateCw },
            { id: 'clicker', label: 'سرعة النقر CPS', icon: Zap },
            { id: 'poetry', label: 'تحدي الشعر', icon: Star },
            { id: 'math', label: 'الحساب العبقري', icon: Target },
            { id: 'riddles', label: 'فوازير وألغاز', icon: HelpCircle },
            { id: 'tod', label: 'صراحة أو تحدي', icon: Flame }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
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
        <div className="p-5 overflow-y-auto max-h-[calc(92vh-140px)] space-y-4">
          {/* TAB 1: Memory Game */}
          {activeTab === 'memory' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
                <div className="text-xs text-slate-300">
                  اطابق الرموز المتشابهة بأقل عدد حركات للفوز بـ <span className="text-amber-400 font-bold">50 نقطة</span>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="text-slate-400">الحركات: <b className="text-white">{memoryMoves}</b></span>
                  <button
                    onClick={initMemoryGame}
                    className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center gap-1 text-xs"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    إعادة البدء
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 max-w-lg mx-auto">
                {cards.map((card, idx) => (
                  <button
                    key={card.id}
                    onClick={() => handleCardClick(idx)}
                    className={`h-20 rounded-xl text-3xl flex items-center justify-center font-bold border transition-all duration-300 transform select-none ${
                      card.isFlipped || card.isMatched
                        ? 'bg-amber-500/20 border-amber-500/80 shadow-lg scale-105'
                        : 'bg-slate-800 border-slate-700 hover:bg-slate-750 hover:border-slate-600'
                    }`}
                  >
                    {card.isFlipped || card.isMatched ? card.icon : '❓'}
                  </button>
                ))}
              </div>

              {memoryWon && (
                <div className="text-center p-4 bg-emerald-950/40 border border-emerald-500/50 rounded-xl text-emerald-300 text-sm font-bold animate-bounce">
                  🎉 كفو! تم إتمام اللعبة بنجاح وحصلت على مكافأتك الذهبية!
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Clicker CPS */}
          {activeTab === 'clicker' && (
            <div className="text-center space-y-6 max-w-md mx-auto py-3">
              <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4">
                <h3 className="text-sm font-bold text-white mb-1">تحدي سرعة النقر CPS (خلال 5 ثوانٍ)</h3>
                <p className="text-xs text-slate-400">انقر بأسرع ما يمكن لتثبت سرعتك وتكسب نقاطاً فورية</p>
                <div className="flex items-center justify-center gap-6 mt-4">
                  <div className="text-center">
                    <div className="text-xs text-slate-400">الوقت المتبقي</div>
                    <div className="text-2xl font-mono font-bold text-amber-400">{clickerTime}s</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-slate-400">عدد النقرات</div>
                    <div className="text-2xl font-mono font-bold text-emerald-400">{clickerCount}</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={clickerActive ? handleClickerTap : startClicker}
                  className={`w-44 h-44 rounded-full font-bold shadow-2xl flex flex-col items-center justify-center transition-transform active:scale-90 border-4 select-none ${
                    clickerActive
                      ? 'bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 border-amber-300 shadow-amber-500/30'
                      : 'bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white border-indigo-300 shadow-indigo-500/30 hover:scale-105'
                  }`}
                >
                  {clickerActive ? (
                    <>
                      <Zap className="w-10 h-10 mb-1 animate-pulse" />
                      <span className="text-xl">اضغط بسرعة!</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-10 h-10 mb-1" />
                      <span className="text-base">{clickerFinished ? 'تحدَّ مجدداً' : 'ابدأ التحدي'}</span>
                    </>
                  )}
                </button>
              </div>

              {clickerFinished && (
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-xs text-slate-300">
                  سرعتك النهائية: <span className="font-mono text-amber-400 font-bold">{cpsScore} CPS</span> (نقرة في الثانية) ⚡
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Poetry Verses */}
          {activeTab === 'poetry' && (
            <div className="max-w-xl mx-auto space-y-5">
              <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 text-center shadow-lg relative overflow-hidden">
                <div className="text-[11px] text-amber-400 font-semibold mb-2">
                  الشاعر: {POETRY_VERSES[poetryIndex].author}
                </div>
                <div className="text-lg md:text-xl font-bold text-amber-200 font-serif leading-relaxed mb-1">
                  « {POETRY_VERSES[poetryIndex].firstHalf} »
                </div>
                <div className="text-xs text-slate-400">أكمل عجز البيت الشعري الصحيح:</div>
              </div>

              <div className="space-y-2.5">
                {POETRY_VERSES[poetryIndex].options.map((opt, idx) => {
                  const isSelected = poetrySelected === idx;
                  const isCorrect = idx === POETRY_VERSES[poetryIndex].correct;
                  let btnStyle = 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-750';
                  if (poetrySelected !== null) {
                    if (isCorrect) btnStyle = 'bg-emerald-950/70 border-emerald-500 text-emerald-300 font-bold';
                    else if (isSelected) btnStyle = 'bg-rose-950/70 border-rose-500 text-rose-300';
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handlePoetryAnswer(idx)}
                      disabled={poetrySelected !== null}
                      className={`w-full p-3.5 rounded-xl border text-right transition-all flex items-center justify-between text-sm ${btnStyle}`}
                    >
                      <span>{opt}</span>
                      {poetrySelected !== null && isCorrect && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                      {poetrySelected !== null && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-400" />}
                    </button>
                  );
                })}
              </div>

              {poetrySelected !== null && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={nextPoetry}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
                  >
                    <span>البيت الشعري التالي</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Math Speed Duel */}
          {activeTab === 'math' && (
            <div className="max-w-md mx-auto space-y-5 text-center">
              <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
                  <span>تحدي الحساب الذهني</span>
                  <span className="text-amber-400 font-bold">سلسلة الإجابات المتتالية: {mathStreak} 🔥</span>
                </div>
                <div className="text-4xl font-mono font-extrabold text-white mb-4 tracking-wider flex items-center justify-center gap-4">
                  <span>{mathNum1}</span>
                  <span className="text-amber-400">{mathOp}</span>
                  <span>{mathNum2}</span>
                  <span className="text-slate-500">=</span>
                  <span className="text-emerald-400">؟</span>
                </div>

                <form onSubmit={submitMathAnswer} className="flex gap-2">
                  <input
                    type="number"
                    value={mathInput}
                    onChange={(e) => setMathInput(e.target.value)}
                    placeholder="اكتب الإجابة واضغط Enter..."
                    autoFocus
                    className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-center font-mono text-lg text-white focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md flex items-center gap-1"
                  >
                    إرسال
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 5: Riddles & Fawazeer */}
          {activeTab === 'riddles' && (
            <div className="max-w-lg mx-auto space-y-4">
              <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 text-center space-y-4 shadow-lg">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto text-xl">
                  💡
                </div>
                <div className="text-xs text-slate-400">لغز رقم {riddleIndex + 1} من {ARABIC_RIDDLES.length}</div>
                <div className="text-base font-bold text-white leading-relaxed">
                  « {ARABIC_RIDDLES[riddleIndex].riddle} »
                </div>
                <div className="text-xs text-amber-400/80 bg-amber-400/10 py-1.5 px-3 rounded-lg inline-block">
                  تلميح: {ARABIC_RIDDLES[riddleIndex].hint}
                </div>

                {showRiddleAnswer ? (
                  <div className="p-3 bg-emerald-950/50 border border-emerald-500/50 rounded-xl text-emerald-300 text-sm font-bold">
                    الإجابة الصحيحة هي: {ARABIC_RIDDLES[riddleIndex].answer}
                  </div>
                ) : (
                  <div>
                    <button
                      onClick={() => setShowRiddleAnswer(true)}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-semibold"
                    >
                      كشف الإجابة 🔍
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center">
                <button
                  onClick={() => {
                    setShowRiddleAnswer(false);
                    setRiddleIndex((prev) => (prev > 0 ? prev - 1 : ARABIC_RIDDLES.length - 1));
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl border border-slate-700"
                >
                  اللغز السابق
                </button>
                <button
                  onClick={() => {
                    setShowRiddleAnswer(false);
                    setRiddleIndex((prev) => (prev + 1) % ARABIC_RIDDLES.length);
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-md"
                >
                  اللغز التالي ➡️
                </button>
              </div>
            </div>
          )}

          {/* TAB 6: Truth or Dare */}
          {activeTab === 'tod' && (
            <div className="max-w-lg mx-auto text-center space-y-6">
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <h3 className="text-sm font-bold text-white mb-1">لعبة صراحة أو تحدي الجماعية</h3>
                <p className="text-xs text-slate-400">اختر مسارك وأجب بشجاعة أمام رفاق المجلس الصوتي!</p>
              </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => pickTruthOrDare('truth')}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl transition-all transform active:scale-95 flex items-center gap-2"
                >
                  <Brain className="w-4 h-4" />
                  صراحة (سؤال جريء)
                </button>
                <button
                  onClick={() => pickTruthOrDare('dare')}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-sm shadow-xl transition-all transform active:scale-95 flex items-center gap-2"
                >
                  <Flame className="w-4 h-4" />
                  تحدي (مهمة شجاعة)
                </button>
              </div>

              {todType && (
                <div className={`p-5 rounded-2xl border text-center shadow-lg animate-fade-in ${
                  todType === 'truth' ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-200' : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                }`}>
                  <div className="text-xs font-bold mb-2">
                    {todType === 'truth' ? 'سؤال الصراحة الموجه لك:' : 'المهمة والتحدي المطلوب منك:'}
                  </div>
                  <div className="text-base font-bold text-white mb-3">
                    {todText}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    نفّذ التحدي على المايك أو في الشات ليمنحك الأعضاء لايكات وإشادات!
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: Flags Quiz */}
          {activeTab === 'flags' && (
            <div className="max-w-lg mx-auto space-y-4">
              <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 text-center space-y-4 shadow-lg">
                <div className="text-xs text-slate-400">
                  علم رقم {flagIndex + 1} من {FLAGS_QUIZ.length} • نقاطك في الأعلام: <b className="text-amber-400">{flagScore}</b>
                </div>
                <div className="text-7xl animate-bounce drop-shadow-lg py-2">
                  {FLAGS_QUIZ[flagIndex].flag}
                </div>
                <div className="text-sm font-bold text-white">
                  ما هي الدولة صاحبة هذا العلم؟
                </div>
                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  {FLAGS_QUIZ[flagIndex].options.map((opt, idx) => {
                    const isSelected = flagSelected === idx;
                    const isCorrect = opt === FLAGS_QUIZ[flagIndex].country;
                    let btnStyle = 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700';
                    if (flagSelected !== null) {
                      if (isCorrect) btnStyle = 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-300';
                      else if (isSelected) btnStyle = 'bg-rose-600 text-white border-rose-400';
                    }
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectFlag(idx)}
                        disabled={flagSelected !== null}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all shadow-sm ${btnStyle}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {flagSelected !== null && (
                  <div className="pt-2">
                    <button
                      onClick={nextFlag}
                      className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md"
                    >
                      العلم التالي ➡️
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 8: Speed Typing */}
          {activeTab === 'typing' && (
            <div className="max-w-lg mx-auto space-y-4 text-center">
              <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 space-y-3 shadow-lg">
                <div className="text-xs text-amber-400 font-bold flex items-center justify-center gap-1.5">
                  <Type className="w-4 h-4" />
                  اكتب الجملة التالية بأسرع ما يمكن بدقة!
                </div>
                <div className="p-4 bg-slate-900 border border-slate-700/80 rounded-xl text-base font-bold text-amber-200 leading-relaxed font-serif">
                  « {TYPING_SENTENCES[typingIndex]} »
                </div>
                <textarea
                  value={typingInput}
                  onChange={(e) => handleTypingChange(e.target.value)}
                  disabled={typingDone}
                  placeholder="ابدأ الكتابة هنا مباشرة وسيبدأ المؤقت تلقائياً..."
                  rows={2}
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 outline-none focus:border-amber-500"
                />
                {typingWpm !== null && (
                  <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-bold space-y-1">
                    <div>🏆 سرعتك: {typingWpm} كلمة في الدقيقة (WPM)</div>
                    <div className="text-[10px] text-emerald-400/80">تمت إضافة 40 نقطة إلى رصيدك!</div>
                  </div>
                )}
                <div className="flex justify-center gap-2 pt-1">
                  <button
                    onClick={resetTyping}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    جملة جديدة
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: Secret Number 1-100 */}
          {activeTab === 'guessNum' && (
            <div className="max-w-lg mx-auto space-y-4 text-center">
              <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-lg">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto text-xl font-mono font-black">
                  ?
                </div>
                <h3 className="text-sm font-bold text-white">خمن الرقم السري من 1 إلى 100</h3>
                <p className="text-xs text-slate-400">كلما خمنت الرقم بمحاولات أقل، حصلت على نقاط أكبر!</p>
                <form onSubmit={handleGuessSubmit} className="flex gap-2 max-w-xs mx-auto">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={guessInput}
                    onChange={(e) => setGuessInput(e.target.value)}
                    disabled={guessWon}
                    placeholder="ادخل رقماً (1-100)..."
                    className="flex-1 p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white text-center font-bold outline-none focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    disabled={guessWon}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md disabled:opacity-50"
                  >
                    تخمين
                  </button>
                </form>
                {guessHint && (
                  <div className={`p-3 rounded-xl text-xs font-bold ${
                    guessWon ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300' : 'bg-amber-950/40 border border-amber-500/40 text-amber-300'
                  }`}>
                    {guessHint}
                  </div>
                )}
                <div className="text-[11px] text-slate-400">
                  عدد المحاولات الحالية: <b className="text-white">{guessAttempts}</b>
                </div>
                {guessWon && (
                  <button
                    onClick={resetSecretNum}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl"
                  >
                    لعب جولة جديدة 🔄
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 10: Proverbs Matcher */}
          {activeTab === 'proverbs' && (
            <div className="max-w-lg mx-auto space-y-4">
              <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 text-center space-y-4 shadow-lg">
                <div className="text-xs text-slate-400">
                  مثل رقم {proverbIndex + 1} من {PROVERBS_LIST.length} • رصيدك: <b className="text-amber-400">{proverbScore}</b>
                </div>
                <div className="p-4 bg-slate-900 border border-slate-700 rounded-xl text-base font-bold text-amber-200 leading-relaxed font-serif">
                  « {PROVERBS_LIST[proverbIndex].prompt} »
                </div>
                <div className="text-xs text-slate-300">أكمل المثل بالكلمة المناسبة:</div>
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  {PROVERBS_LIST[proverbIndex].options.map((opt, idx) => {
                    const isSelected = proverbSelected === idx;
                    const isCorrect = opt === PROVERBS_LIST[proverbIndex].answer;
                    let btnStyle = 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700';
                    if (proverbSelected !== null) {
                      if (isCorrect) btnStyle = 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-300';
                      else if (isSelected) btnStyle = 'bg-rose-600 text-white border-rose-400';
                    }
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectProverb(idx)}
                        disabled={proverbSelected !== null}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all shadow-sm ${btnStyle}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {proverbSelected !== null && (
                  <div className="pt-2">
                    <button
                      onClick={nextProverb}
                      className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md"
                    >
                      المثل التالي ➡️
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 11: Word Chain Game */}
          {activeTab === 'wordChain' && (
            <div className="max-w-lg mx-auto space-y-4">
              <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 text-center space-y-4 shadow-lg">
                <div className="text-xs text-slate-400">
                  سباق الحروف والكلمات • كلماتك الصحيحة: <b className="text-amber-400">{chainScore}</b>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-xs text-slate-300">المطلوب كلمة تبدأ بحرف:</span>
                  <span className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg">
                    {currentLetter}
                  </span>
                </div>
                <form onSubmit={handleChainSubmit} className="flex gap-2 max-w-xs mx-auto">
                  <input
                    type="text"
                    value={chainInput}
                    onChange={(e) => setChainInput(e.target.value)}
                    placeholder={`اكتب كلمة تبدأ بـ (${currentLetter})...`}
                    className="flex-1 p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white text-center font-bold outline-none focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md"
                  >
                    إرسال
                  </button>
                </form>
                <div className="space-y-1.5 pt-2">
                  <div className="text-[11px] text-slate-400 font-bold">سلسلة الكلمات السابقة:</div>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {chainWords.map((w, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-semibold text-amber-300">
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>كل مشاركة تزيد من رصيد نقاطك ومستواك في الشات</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
