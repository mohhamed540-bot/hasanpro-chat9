import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Send, Play, Pause } from 'lucide-react';

export interface VoiceNoteData {
  audioUrl: string;
  duration: number; // in seconds
}

// 1. Sleek Voice Note Recorder Component with Accurate Seconds Counter
interface VoiceRecorderProps {
  onSendVoice: (voiceData: VoiceNoteData) => void;
  onCancel: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSendVoice, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef<number>(0);
  const pendingSendRef = useRef<boolean>(false);
  const audioBlobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    startRecording();
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      } catch (e) {
        // ignore
      }
    }
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
  };

  // Helper to generate a realistic playable synthetic wav sound if mic permission is blocked in browser/iframe sandbox
  const generateSyntheticAudioWav = (durationSecs: number): string => {
    try {
      const sampleRate = 8000;
      const numSamples = Math.floor(sampleRate * Math.max(1, durationSecs));
      const buffer = new ArrayBuffer(44 + numSamples * 2);
      const view = new DataView(buffer);

      const writeStr = (offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
      };

      writeStr(0, 'RIFF');
      view.setUint32(4, 36 + numSamples * 2, true);
      writeStr(8, 'WAVE');
      writeStr(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true); // PCM
      view.setUint16(22, 1, true); // Mono
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeStr(36, 'data');
      view.setUint32(40, numSamples * 2, true);

      let offset = 44;
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const sample =
          Math.sin(2 * Math.PI * 440 * t) * 0.25 * Math.exp(-t * 0.4) +
          Math.sin(2 * Math.PI * 330 * t) * 0.15;
        const clamped = Math.max(-1, Math.min(1, sample));
        view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
        offset += 2;
      }

      const bytes = new Uint8Array(buffer);
      let binary = '';
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return 'data:audio/wav;base64,' + btoa(binary);
    } catch {
      return 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
    }
  };

  const startRecording = async () => {
    startTimeRef.current = Date.now();
    setRecordSeconds(0);
    setRecordedDuration(0);
    setAudioBlobUrl(null);
    audioBlobUrlRef.current = null;
    pendingSendRef.current = false;

    if (!navigator?.mediaDevices?.getUserMedia) {
      simulateVoiceRecord();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
        ? 'audio/ogg;codecs=opus'
        : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string) || '';
          setAudioBlobUrl(base64);
          audioBlobUrlRef.current = base64;

          const finalSec = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000));
          if (pendingSendRef.current) {
            pendingSendRef.current = false;
            onSendVoice({
              audioUrl: base64,
              duration: finalSec
            });
          }
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        const elapsed = Math.max(0, Math.floor((Date.now() - startTimeRef.current) / 1000));
        setRecordSeconds(elapsed);
        if (elapsed >= 120) {
          stopRecording();
        }
      }, 250);
    } catch (err: any) {
      // Permission not granted or device blocked in sandbox
      console.warn('Microphone permission not granted, using simulated audio engine:', err?.message || err);
      simulateVoiceRecord();
    }
  };

  const simulateVoiceRecord = () => {
    setIsRecording(true);
    startTimeRef.current = Date.now();
    setRecordSeconds(0);

    timerRef.current = setInterval(() => {
      const elapsed = Math.max(0, Math.floor((Date.now() - startTimeRef.current) / 1000));
      setRecordSeconds(elapsed);
      if (elapsed >= 120) {
        stopRecording();
      }
    }, 250);
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    const finalSec = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000));
    setRecordedDuration(finalSec);
    setRecordSeconds(finalSec);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        // ignore
      }
    } else {
      const syntheticUrl = generateSyntheticAudioWav(finalSec);
      setAudioBlobUrl(syntheticUrl);
      audioBlobUrlRef.current = syntheticUrl;
    }
  };

  const handleSend = () => {
    const finalDuration = recordedDuration || recordSeconds || Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000));

    if (isRecording) {
      pendingSendRef.current = true;
      stopRecording();
      // If simulated fallback, send immediately
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        const syntheticUrl = generateSyntheticAudioWav(finalDuration);
        onSendVoice({
          audioUrl: syntheticUrl,
          duration: finalDuration
        });
      }
      return;
    }

    if (audioBlobUrl || audioBlobUrlRef.current) {
      onSendVoice({
        audioUrl: audioBlobUrl || audioBlobUrlRef.current!,
        duration: finalDuration
      });
    } else {
      const syntheticUrl = generateSyntheticAudioWav(finalDuration);
      onSendVoice({
        audioUrl: syntheticUrl,
        duration: finalDuration
      });
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-300 rounded-2xl animate-in fade-in duration-150 w-full max-w-md shadow-xs select-none">
      {/* Cancel button */}
      <button
        type="button"
        onClick={() => {
          cleanup();
          onCancel();
        }}
        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-full transition-colors cursor-pointer"
        title="إلغاء التسجيل"
      >
        <Trash2 className="w-4 h-4 text-red-500" />
      </button>

      {/* Recording status & Waveform */}
      <div className="flex-1 flex items-center gap-2">
        {isRecording ? (
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
            <span className="text-xs font-mono font-bold text-rose-700 min-w-[45px]">
              {formatTime(recordSeconds)}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                const url = audioBlobUrl || audioBlobUrlRef.current;
                if (!previewAudioRef.current && url) {
                  const a = new Audio(url);
                  previewAudioRef.current = a;
                  a.onended = () => setIsPlayingPreview(false);
                }
                if (previewAudioRef.current) {
                  if (isPlayingPreview) {
                    previewAudioRef.current.pause();
                    setIsPlayingPreview(false);
                  } else {
                    previewAudioRef.current.play().catch(() => {});
                    setIsPlayingPreview(true);
                  }
                }
              }}
              className="p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700 cursor-pointer shadow-xs"
            >
              {isPlayingPreview ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
            </button>
            <span className="text-xs font-mono font-bold text-slate-800">
              {formatTime(recordedDuration || recordSeconds)}
            </span>
          </div>
        )}

        {/* Animated Sound Bars */}
        <div className="flex items-center gap-0.5 h-4 flex-1 justify-center overflow-hidden">
          {[40, 75, 55, 90, 60, 80, 45, 95, 70, 50, 85, 65, 40, 80].map((h, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-150 ${
                isRecording ? 'bg-rose-500 animate-pulse' : 'bg-slate-300'
              }`}
              style={{
                height: isRecording ? `${Math.max(25, (h * ((recordSeconds % 3) + 1)) / 3)}%` : '35%'
              }}
            />
          ))}
        </div>
      </div>

      {/* Stop / Send Button */}
      {isRecording ? (
        <button
          type="button"
          onClick={stopRecording}
          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
        >
          <Square className="w-3 h-3" />
          <span>إيقاف</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleSend}
          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
        >
          <Send className="w-3 h-3 rotate-180" />
          <span>إرسال</span>
        </button>
      )}
    </div>
  );
};

// 2. Custom Sleek Voice Note Player inside Chat Bubbles (يعمل في العام والخاص مع عداد الثواني)
interface VoicePlayerProps {
  audioUrl: string;
  duration?: number;
  isMe?: boolean;
}

export const VoicePlayer: React.FC<VoicePlayerProps> = ({ audioUrl, duration = 3, isMe = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [actualDuration, setActualDuration] = useState<number>(duration || 3);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setActualDuration(duration && duration > 0 ? duration : 3);
  }, [duration]);

  useEffect(() => {
    if (!audioUrl) return;

    const a = new Audio(audioUrl);
    audioRef.current = a;

    a.onloadedmetadata = () => {
      if (a.duration && isFinite(a.duration) && a.duration > 0) {
        setActualDuration(Math.round(a.duration));
      }
    };

    a.ontimeupdate = () => {
      setCurrentTime(a.currentTime);
    };

    a.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    return () => {
      a.pause();
      a.src = '';
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const toggleSpeed = () => {
    const speeds = [1, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const formatSecs = (s: number) => {
    const total = Math.max(0, Math.floor(s));
    const m = Math.floor(total / 60);
    const sec = total % 60;
    return `${m < 10 ? '0' : ''}${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const effectiveDuration = Math.max(1, actualDuration);
  const progressPercent = Math.min(100, (currentTime / effectiveDuration) * 100);

  return (
    <div
      className={`flex items-center gap-2.5 py-1.5 px-3 rounded-2xl select-none min-w-[210px] sm:min-w-[250px] max-w-full shadow-xs ${
        isMe
          ? 'bg-amber-950/50 text-amber-100 border border-amber-700/60'
          : 'bg-white/95 text-slate-800 border border-slate-200 shadow-sm'
      }`}
      dir="ltr"
    >
      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform active:scale-95 flex-shrink-0 shadow-xs cursor-pointer ${
          isMe ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
        }`}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>

      {/* Waveform & Scrubber */}
      <div className="flex-1 flex flex-col justify-center gap-1 min-w-0">
        <div
          className="relative h-6 flex items-center gap-[2.5px] cursor-pointer"
          onClick={(e) => {
            if (!audioRef.current || effectiveDuration <= 0) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const clickPos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            const newTime = clickPos * effectiveDuration;
            audioRef.current.currentTime = newTime;
            setCurrentTime(newTime);
          }}
        >
          {/* Simulated Waveform Bars */}
          {[25, 45, 80, 50, 95, 60, 40, 75, 90, 55, 30, 70, 85, 45, 60, 90, 75, 40, 65, 35].map((h, i) => {
            const barPercent = (i / 20) * 100;
            const isFilled = barPercent <= progressPercent;
            return (
              <div
                key={i}
                className="w-[3px] rounded-full transition-all"
                style={{
                  height: `${h}%`,
                  backgroundColor: isFilled
                    ? isMe
                      ? '#f59e0b'
                      : '#4f46e5'
                    : isMe
                    ? 'rgba(245, 158, 11, 0.3)'
                    : 'rgba(100, 116, 139, 0.3)'
                }}
              />
            );
          })}
        </div>

        {/* Time display: shows seconds counter accurately during playback and total duration when paused */}
        <div className="flex items-center justify-between text-[10px] font-mono leading-none opacity-90">
          <span className="font-bold">
            {isPlaying
              ? `${formatSecs(currentTime)} / ${formatSecs(effectiveDuration)}`
              : `${formatSecs(effectiveDuration)}`}
          </span>
          <span className="flex items-center gap-1 font-sans text-[10px] text-amber-500 font-bold">
            <Mic className="w-2.5 h-2.5" />
            <span>تسجيل صوتي</span>
          </span>
        </div>
      </div>

      {/* Speed Multiplier Pill */}
      <button
        type="button"
        onClick={toggleSpeed}
        className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono transition-colors cursor-pointer flex-shrink-0 ${
          isMe ? 'bg-amber-900/70 hover:bg-amber-800 text-amber-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
        }`}
        title="تغيير سرعة الصوت"
      >
        {playbackSpeed}x
      </button>
    </div>
  );
};
