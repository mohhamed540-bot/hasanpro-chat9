// Web Audio API Sound Generator for Real-Time feedback with customizable event-driven tones
// Event categories: Public Alert (إشعار عام), Private Message (رسالة خاصة), Mention (إشارة @ بالاسم), Room Message, Member Entry

export type MessageSoundId = 'classic' | 'bubble' | 'crystal' | 'soft' | 'retro' | 'bell' | 'none';
export type JoinSoundId = 'welcome' | 'marimba' | 'doorbell' | 'fanfare' | 'subtle' | 'none';
export type PrivateSoundId = 'whisper' | 'pop' | 'twinkle' | 'duet' | 'bubble' | 'none';
export type MentionSoundId = 'radar' | 'vibro' | 'harp' | 'bell_ring' | 'urgent' | 'none';
export type AlertSoundId = 'broadcast' | 'echo_ping' | 'pulse' | 'gong' | 'royal' | 'none';

export interface SoundOption<T extends string> {
  id: T;
  label: string;
  icon: string;
  desc: string;
}

export const MESSAGE_SOUND_OPTIONS: SoundOption<MessageSoundId>[] = [
  { id: 'classic', label: 'رنين كلاسيكي', icon: '🔔', desc: 'نغمة حسان برو الكلاسيكية النقية' },
  { id: 'bubble', label: 'فقاعة ماء', icon: '💧', desc: 'صوت فقاعة مائية لطيفة وخفيفة' },
  { id: 'crystal', label: 'كريستال لامع', icon: '✨', desc: 'رنين بلوري متلألئ ومميز' },
  { id: 'soft', label: 'نقرة ناعمة', icon: '🎵', desc: 'نقرة هادئة غير مزعجة' },
  { id: 'retro', label: 'نغمة إلكترونية', icon: '👾', desc: 'صوت ألعاب كلاسيكي 8-bit' },
  { id: 'bell', label: 'جرس هاتف', icon: '📯', desc: 'رنة تنبيه ثنائية التردد' },
  { id: 'none', label: 'بدون صوت (صامت)', icon: '🔇', desc: 'إيقاف نغمة الرسائل' },
];

export const JOIN_SOUND_OPTIONS: SoundOption<JoinSoundId>[] = [
  { id: 'welcome', label: 'ترحيب صاعد', icon: '🎶', desc: 'نغمة ترحيبية ثلاثية دافئة' },
  { id: 'marimba', label: 'ماريمبا خشبية', icon: '🪵', desc: 'طرقات ماريمبا إفريقية مرحبة' },
  { id: 'doorbell', label: 'جرس الباب', icon: '🚪', desc: 'جرس كلاسيكي نغمي (Ding-Dong)' },
  { id: 'fanfare', label: 'بوق ترحيبي', icon: '🎺', desc: 'إشعار شرفي ملكي خفيف' },
  { id: 'subtle', label: 'رنة خفيفة', icon: '🎐', desc: 'نغمة دخول رقيقة وسريعة' },
  { id: 'none', label: 'بدون صوت (صامت)', icon: '🔇', desc: 'إيقاف نغمة دخول الأعضاء' },
];

export const PRIVATE_SOUND_OPTIONS: SoundOption<PrivateSoundId>[] = [
  { id: 'whisper', label: 'همسة خاصة', icon: '💬', desc: 'نقرة مزدوجة ناعمة وخاصة' },
  { id: 'pop', label: 'فقاعة سرية', icon: '🫧', desc: 'صوت فقاعة عصري هادئ' },
  { id: 'twinkle', label: 'رنين بلوري سري', icon: '🔮', desc: 'رنين رقيق مميز للمحادثات الخاصة' },
  { id: 'duet', label: 'نغمة ثنائية', icon: '🎼', desc: 'نغمتان متوافقتان للرسائل الخاصة' },
  { id: 'bubble', label: 'قطرة ماء', icon: '💧', desc: 'صوت قطرة ماء نقية' },
  { id: 'none', label: 'بدون صوت (صامت)', icon: '🔇', desc: 'إيقاف نغمة الخاص' },
];

export const MENTION_SOUND_OPTIONS: SoundOption<MentionSoundId>[] = [
  { id: 'radar', label: 'رادار التنبيه (@)', icon: '📡', desc: 'تنبيه مزدوج ملفت للانتباه عند ذكر اسمك' },
  { id: 'vibro', label: 'طرقات منبهة', icon: '⚡', desc: 'طرقات متتالية سريعة تلفت الانتباه فوراً' },
  { id: 'harp', label: 'هارب تصاعدي', icon: '🪕', desc: 'نغمات قيثارة متصاعدة مميزة للمنشن' },
  { id: 'bell_ring', label: 'جرس الحضور', icon: '🛎️', desc: 'رنة جرس فندقي سريع لمناداتك' },
  { id: 'urgent', label: 'تنبيه سريع', icon: '🚨', desc: 'نغمتان حادتان تؤكدان مناداتك بالاسم' },
  { id: 'none', label: 'بدون صوت (صامت)', icon: '🔇', desc: 'إيقاف نغمة الإشارة @' },
];

export const ALERT_SOUND_OPTIONS: SoundOption<AlertSoundId>[] = [
  { id: 'broadcast', label: 'بوق إعلان رسمي', icon: '📢', desc: 'بوق ثلاثي مهيب للإعلانات والتعميمات' },
  { id: 'echo_ping', label: 'صدى تنبيهي واسع', icon: '🔊', desc: 'رنين يتردد كإشعار عام للغرفة' },
  { id: 'pulse', label: 'نبضة إلكترونية', icon: '⚡', desc: 'نبضة صوتية حديثة للإشعارات الإدارية' },
  { id: 'gong', label: 'جرس تنبيه عميق', icon: '🔔', desc: 'رنين عميق يلفت انتباه الجميع' },
  { id: 'royal', label: 'إشعار شرفي ملكي', icon: '👑', desc: 'نغمة رسمية تليق بالتنبيهات الإدارية' },
  { id: 'none', label: 'بدون صوت (صامت)', icon: '🔇', desc: 'إيقاف نغمة الإشعارات العامة' },
];

class SoundEngine {
  private ctx: AudioContext | null = null;
  private messageSound: MessageSoundId = 'classic';
  private joinSound: JoinSoundId = 'welcome';
  private privateSound: PrivateSoundId = 'whisper';
  private mentionSound: MentionSoundId = 'radar';
  private alertSound: AlertSoundId = 'broadcast';
  private soundsMuted: boolean = false;
  private masterVolume: number = 0.8;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const savedVol = localStorage.getItem('soqoor_master_volume');
        if (savedVol) this.masterVolume = parseFloat(savedVol) || 0.8;
        const savedMsg = localStorage.getItem('soqoor_msg_sound') as MessageSoundId;
        if (savedMsg && MESSAGE_SOUND_OPTIONS.some((o) => o.id === savedMsg)) {
          this.messageSound = savedMsg;
        }
        const savedJoin = localStorage.getItem('soqoor_join_sound') as JoinSoundId;
        if (savedJoin && JOIN_SOUND_OPTIONS.some((o) => o.id === savedJoin)) {
          this.joinSound = savedJoin;
        }
        const savedPrivate = localStorage.getItem('soqoor_private_sound') as PrivateSoundId;
        if (savedPrivate && PRIVATE_SOUND_OPTIONS.some((o) => o.id === savedPrivate)) {
          this.privateSound = savedPrivate;
        }
        const savedMention = localStorage.getItem('soqoor_mention_sound') as MentionSoundId;
        if (savedMention && MENTION_SOUND_OPTIONS.some((o) => o.id === savedMention)) {
          this.mentionSound = savedMention;
        }
        const savedAlert = localStorage.getItem('soqoor_alert_sound') as AlertSoundId;
        if (savedAlert && ALERT_SOUND_OPTIONS.some((o) => o.id === savedAlert)) {
          this.alertSound = savedAlert;
        }
        const savedMute = localStorage.getItem('soqoor_sounds_muted');
        if (savedMute !== null) {
          this.soundsMuted = savedMute === 'true';
        }
      } catch {
        // localStorage not available
      }
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // --- Getters & Setters ---
  public getMessageSound(): MessageSoundId { return this.messageSound; }
  public setMessageSound(soundId: MessageSoundId) {
    this.messageSound = soundId;
    try { localStorage.setItem('soqoor_msg_sound', soundId); } catch {}
  }

  public getJoinSound(): JoinSoundId { return this.joinSound; }
  public setJoinSound(soundId: JoinSoundId) {
    this.joinSound = soundId;
    try { localStorage.setItem('soqoor_join_sound', soundId); } catch {}
  }

  public getPrivateSound(): PrivateSoundId { return this.privateSound; }
  public setPrivateSound(soundId: PrivateSoundId) {
    this.privateSound = soundId;
    try { localStorage.setItem('soqoor_private_sound', soundId); } catch {}
  }

  public getMentionSound(): MentionSoundId { return this.mentionSound; }
  public setMentionSound(soundId: MentionSoundId) {
    this.mentionSound = soundId;
    try { localStorage.setItem('soqoor_mention_sound', soundId); } catch {}
  }

  public getAlertSound(): AlertSoundId { return this.alertSound; }
  public setAlertSound(soundId: AlertSoundId) {
    this.alertSound = soundId;
    try { localStorage.setItem('soqoor_alert_sound', soundId); } catch {}
  }

  public isMuted(): boolean { return this.soundsMuted; }
  public setMuted(muted: boolean) {
    this.soundsMuted = muted;
    try { localStorage.setItem('soqoor_sounds_muted', String(muted)); } catch {}
  }

  public getMasterVolume(): number { return this.masterVolume; }
  public setMasterVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    try { localStorage.setItem('soqoor_master_volume', String(this.masterVolume)); } catch {}
  }

  // =========================================================================
  // 1. General Message Sound
  // =========================================================================
  public playMessagePing() {
    if (this.soundsMuted || this.messageSound === 'none') return;
    this.executeMessageSound(this.messageSound);
  }

  public previewMessageSound(id: MessageSoundId) {
    if (id === 'none') return;
    this.executeMessageSound(id);
  }

  private executeMessageSound(type: MessageSoundId) {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const ctx = this.ctx;
      const now = ctx.currentTime;

      switch (type) {
        case 'classic': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, now); // D5
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.1); // A5
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.25);
          break;
        }
        case 'bubble': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(400, now);
          osc.frequency.exponentialRampToValueAtTime(1100, now + 0.09);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.15);
          break;
        }
        case 'crystal': {
          [1046.5, 1318.5, 1567.98].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.04);
            gain.gain.setValueAtTime(0.06, now + idx * 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.25);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.04);
            osc.stop(now + idx * 0.04 + 0.25);
          });
          break;
        }
        case 'soft': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(493.88, now); // B4
          osc.frequency.setValueAtTime(659.25, now + 0.05); // E5
          gain.gain.setValueAtTime(0.07, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.18);
          break;
        }
        case 'retro': {
          [523.25, 659.25, 783.99].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, now + idx * 0.04);
            gain.gain.setValueAtTime(0.04, now + idx * 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.09);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.04);
            osc.stop(now + idx * 0.04 + 0.09);
          });
          break;
        }
        case 'bell': {
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();
          osc1.type = 'sine';
          osc2.type = 'sine';
          osc1.frequency.setValueAtTime(800, now);
          osc2.frequency.setValueAtTime(1200, now);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);
          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 0.22);
          osc2.stop(now + 0.22);
          break;
        }
        default:
          break;
      }
    } catch {}
  }

  // =========================================================================
  // 2. Private Message Sound (رسالة خاصة - نغمة حميمة مميزة)
  // =========================================================================
  public playPrivateMessagePing() {
    if (this.soundsMuted || this.privateSound === 'none') return;
    this.executePrivateSound(this.privateSound);
  }

  public previewPrivateSound(id: PrivateSoundId) {
    if (id === 'none') return;
    this.executePrivateSound(id);
  }

  private executePrivateSound(type: PrivateSoundId) {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const ctx = this.ctx;
      const now = ctx.currentTime;

      switch (type) {
        case 'whisper': {
          // Soft intimate double-tap
          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(784, now); // G5
          gain1.gain.setValueAtTime(0.09, now);
          gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          osc1.connect(gain1);
          gain1.connect(ctx.destination);
          osc1.start(now);
          osc1.stop(now + 0.12);

          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(1174.66, now + 0.08); // D6
          gain2.gain.setValueAtTime(0.1, now + 0.08);
          gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start(now + 0.08);
          osc2.stop(now + 0.26);
          break;
        }
        case 'pop': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(620, now);
          osc.frequency.exponentialRampToValueAtTime(1250, now + 0.06);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.14);
          break;
        }
        case 'twinkle': {
          // Soft secret chord
          [1318.5, 1760].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.05);
            gain.gain.setValueAtTime(0.07, now + idx * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.22);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.05);
            osc.stop(now + idx * 0.05 + 0.22);
          });
          break;
        }
        case 'duet': {
          // Two-tone harmonic ding (F#5 -> C#6)
          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(739.99, now); // F#5
          gain1.gain.setValueAtTime(0.08, now);
          gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
          osc1.connect(gain1);
          gain1.connect(ctx.destination);
          osc1.start(now);
          osc1.stop(now + 0.18);

          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(1108.73, now + 0.09); // C#6
          gain2.gain.setValueAtTime(0.1, now + 0.09);
          gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start(now + 0.09);
          osc2.stop(now + 0.32);
          break;
        }
        case 'bubble': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(450, now);
          osc.frequency.exponentialRampToValueAtTime(950, now + 0.08);
          gain.gain.setValueAtTime(0.11, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.16);
          break;
        }
        default:
          break;
      }
    } catch {}
  }

  // =========================================================================
  // 3. Mention Sound (إشارة @ بالاسم - نغمة واضحة ومنبهة ملفتة للنظر)
  // =========================================================================
  public playMentionPing() {
    if (this.soundsMuted || this.mentionSound === 'none') return;
    this.executeMentionSound(this.mentionSound);
  }

  public previewMentionSound(id: MentionSoundId) {
    if (id === 'none') return;
    this.executeMentionSound(id);
  }

  private executeMentionSound(type: MentionSoundId) {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const ctx = this.ctx;
      const now = ctx.currentTime;

      switch (type) {
        case 'radar': {
          // Double sonar ping (B5 -> E6)
          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.type = 'triangle';
          osc1.frequency.setValueAtTime(987.77, now); // B5
          gain1.gain.setValueAtTime(0.12, now);
          gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          osc1.connect(gain1);
          gain1.connect(ctx.destination);
          osc1.start(now);
          osc1.stop(now + 0.12);

          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(1318.51, now + 0.08); // E6
          gain2.gain.setValueAtTime(0.14, now + 0.08);
          gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start(now + 0.08);
          osc2.stop(now + 0.35);
          break;
        }
        case 'vibro': {
          // Staccato triple attention pings
          [880, 880, 1174.66].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, now + idx * 0.07);
            gain.gain.setValueAtTime(0.06, now + idx * 0.07);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.1);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.07);
            osc.stop(now + idx * 0.07 + 0.1);
          });
          break;
        }
        case 'harp': {
          // Ascending 4-note harp flourish (C5 -> E5 -> G5 -> C6)
          [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.05);
            gain.gain.setValueAtTime(0.09, now + idx * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.28);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.05);
            osc.stop(now + idx * 0.05 + 0.28);
          });
          break;
        }
        case 'bell_ring': {
          // Sharp desk service bell ding
          const osc = ctx.createOscillator();
          const oscHarmonic = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          oscHarmonic.type = 'sine';
          osc.frequency.setValueAtTime(1400, now);
          oscHarmonic.frequency.setValueAtTime(2800, now);

          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

          osc.connect(gain);
          oscHarmonic.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          oscHarmonic.start(now);
          osc.stop(now + 0.45);
          oscHarmonic.stop(now + 0.45);
          break;
        }
        case 'urgent': {
          // High alert urgent ping
          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.type = 'triangle';
          osc1.frequency.setValueAtTime(1046.5, now);
          gain1.gain.setValueAtTime(0.12, now);
          gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          osc1.connect(gain1);
          gain1.connect(ctx.destination);
          osc1.start(now);
          osc1.stop(now + 0.1);

          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'triangle';
          osc2.frequency.setValueAtTime(1396.91, now + 0.09);
          gain2.gain.setValueAtTime(0.14, now + 0.09);
          gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start(now + 0.09);
          osc2.stop(now + 0.32);
          break;
        }
        default:
          break;
      }
    } catch {}
  }

  // =========================================================================
  // 4. Public Alert Sound (إشعار وتنبيه عام - نغمة رسمية بارزة للجميع)
  // =========================================================================
  public playGeneralAlertPing() {
    if (this.soundsMuted || this.alertSound === 'none') return;
    this.executeAlertSound(this.alertSound);
  }

  public previewAlertSound(id: AlertSoundId) {
    if (id === 'none') return;
    this.executeAlertSound(id);
  }

  private executeAlertSound(type: AlertSoundId) {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const ctx = this.ctx;
      const now = ctx.currentTime;

      switch (type) {
        case 'broadcast': {
          // Grand fanfare brass alert (440 -> 659 -> 880)
          [440, 659.25, 880].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);
            gain.gain.setValueAtTime(0.08, now + idx * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.35);
          });
          break;
        }
        case 'echo_ping': {
          // Reverb-like echo ping
          [800, 800, 800].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.12);
            const volume = 0.12 * Math.pow(0.5, idx);
            gain.gain.setValueAtTime(volume, now + idx * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.25);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.12);
            osc.stop(now + idx * 0.12 + 0.25);
          });
          break;
        }
        case 'pulse': {
          // Cyber electronic announcement sweep
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(350, now);
          osc.frequency.exponentialRampToValueAtTime(1400, now + 0.15);
          gain.gain.setValueAtTime(0.14, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.35);
          break;
        }
        case 'gong': {
          // Deep attention gong
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.type = 'triangle';
          osc2.type = 'sine';
          osc1.frequency.setValueAtTime(330, now);
          osc2.frequency.setValueAtTime(660, now);

          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 0.6);
          osc2.stop(now + 0.6);
          break;
        }
        case 'royal': {
          // 4-note ceremonial fanfare (523, 659, 784, 1046)
          [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.07);
            gain.gain.setValueAtTime(0.1, now + idx * 0.07);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.35);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.07);
            osc.stop(now + idx * 0.07 + 0.35);
          });
          break;
        }
        default:
          break;
      }
    } catch {}
  }

  // =========================================================================
  // 5. Member Entry Sound
  // =========================================================================
  public playMemberJoin() {
    if (this.soundsMuted || this.joinSound === 'none') return;
    this.executeJoinSound(this.joinSound);
  }

  public previewJoinSound(id: JoinSoundId) {
    if (id === 'none') return;
    this.executeJoinSound(id);
  }

  private executeJoinSound(type: JoinSoundId) {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const ctx = this.ctx;
      const now = ctx.currentTime;

      switch (type) {
        case 'welcome': {
          [440, 554.37, 659.25].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);
            gain.gain.setValueAtTime(0.09, now + idx * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.28);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.28);
          });
          break;
        }
        case 'marimba': {
          [330, 440, 587.33, 880].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.06);
            gain.gain.setValueAtTime(0.1, now + idx * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.2);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.06);
            osc.stop(now + idx * 0.06 + 0.2);
          });
          break;
        }
        case 'doorbell': {
          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(659.25, now);
          gain1.gain.setValueAtTime(0.12, now);
          gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          osc1.connect(gain1);
          gain1.connect(ctx.destination);
          osc1.start(now);
          osc1.stop(now + 0.25);

          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(523.25, now + 0.2);
          gain2.gain.setValueAtTime(0.12, now + 0.2);
          gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start(now + 0.2);
          osc2.stop(now + 0.55);
          break;
        }
        case 'fanfare': {
          [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now + idx * 0.06);
            gain.gain.setValueAtTime(0.05, now + idx * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.3);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.06);
            osc.stop(now + idx * 0.06 + 0.3);
          });
          break;
        }
        case 'subtle': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(392, now);
          osc.frequency.exponentialRampToValueAtTime(587.33, now + 0.07);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.2);
          break;
        }
        default:
          break;
      }
    } catch {}
  }

  // Voice slot join chime
  playVoiceJoin() {
    this.playMemberJoin();
  }

  // Voice slot leave chime
  playVoiceLeave() {
    if (this.soundsMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(659.25, now);
      osc.frequency.setValueAtTime(554.37, now + 0.08);
      osc.frequency.setValueAtTime(440, now + 0.16);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {}
  }

  // Play mute/unmute toggle sound
  playToggleMute(muted: boolean) {
    if (this.soundsMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      if (muted) {
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.setValueAtTime(320, now + 0.06);
      } else {
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.setValueAtTime(500, now + 0.06);
      }

      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {}
  }

  // Success chime
  playSuccess() {
    if (this.soundsMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      osc.frequency.setValueAtTime(783.99, now + 0.16);
      osc.frequency.setValueAtTime(1046.5, now + 0.24);

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch {}
  }

  // Error buzz
  playError() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(180, now + 0.1);

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {}
  }

  // Royal Crown / Gift Fanfare
  playCrownFanfare() {
    if (this.soundsMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const chord = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      chord.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.08, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.5);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.5);
      });
    } catch {}
  }
}

export const sounds = new SoundEngine();
