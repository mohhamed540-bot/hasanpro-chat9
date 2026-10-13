// WebRTC Group Voice Mesh Manager for Real-Time Multi-User Audio

import { Socket } from 'socket.io-client';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ]
};

export interface RemoteVoicePeer {
  id: string;
  username: string;
  pc: RTCPeerConnection;
  stream?: MediaStream;
  audioElement?: HTMLAudioElement;
  isMuted?: boolean;
  isSpeaking?: boolean;
}

export class AudioMeshManager {
  private socket: Socket;
  public localStream: MediaStream | null = null;
  public peers: Map<string, RemoteVoicePeer> = new Map();
  public isMuted = false;
  public isDeafened = false;
  public isInVoice = false;

  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;
  private lastSpeakingState = false;
  private mediaRecorder: MediaRecorder | null = null;

  // Callbacks
  public onVolumeChange?: (volume: number) => void;
  public onPeersUpdated?: (peers: RemoteVoicePeer[]) => void;
  public onError?: (errorMsg: string) => void;

  private socketListeners: Array<{ event: string; fn: (...args: any[]) => void }> = [];

  constructor(socket: Socket) {
    this.socket = socket;
    this.setupSocketListeners();
  }

  private registerSocketListener(event: string, fn: (...args: any[]) => void) {
    this.socket.on(event, fn);
    this.socketListeners.push({ event, fn });
  }

  private setupSocketListeners() {
    // When local user joins, server sends the list of existing voice users to initiate calls to
    this.registerSocketListener('voiceRoomUsers', (existingUsers: Array<{ id: string; username: string }>) => {
      existingUsers.forEach((user) => {
        this.initiateCallTo(user.id, user.username);
      });
    });

    // When another user joins voice, prepare to receive their call or call them
    this.registerSocketListener('userJoinedVoice', (user: { id: string; username: string }) => {
      if (!this.isInVoice || user.id === this.socket.id) return;
    });

    // Signaling Relay: incoming offer, answer, or ice candidate
    this.registerSocketListener('voiceSignal', async ({ senderId, senderUsername, signal }: { senderId: string; senderUsername: string; signal: any }) => {
      if (!this.isInVoice) return;

      try {
        if (signal.type === 'offer') {
          await this.handleReceiveOffer(senderId, senderUsername, signal);
        } else if (signal.type === 'answer') {
          await this.handleReceiveAnswer(senderId, signal);
        } else if (signal.candidate) {
          await this.handleReceiveCandidate(senderId, signal.candidate);
        }
      } catch (err: any) {
        console.warn('Signal handling notice:', err?.message || err);
      }
    });

    // Remote user changed voice state (e.g. muted or speaking)
    this.registerSocketListener('userVoiceStateChanged', ({ userId, isMuted, isSpeaking }: { userId: string; isMuted: boolean; isSpeaking: boolean }) => {
      const peer = this.peers.get(userId);
      if (peer) {
        if (typeof isMuted === 'boolean') peer.isMuted = isMuted;
        if (typeof isSpeaking === 'boolean') peer.isSpeaking = isSpeaking;
        this.notifyPeers();
      }
    });

    // Remote user left voice
    this.registerSocketListener('userLeftVoice', ({ userId }: { userId: string }) => {
      this.closePeer(userId);
    });
  }

  // Join the voice call
  public async joinVoice(): Promise<boolean> {
    if (this.isInVoice) return true;

    try {
      // 1. Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });

      this.localStream = stream;
      this.isInVoice = true;
      this.isMuted = false;

      // 2. Setup Audio Visualizer and Speech Detection
      this.setupAudioAnalysis(stream);

      // Setup Direct Audio Packet Stream for mobile phones over cellular networks
      if (typeof MediaRecorder !== 'undefined') {
        try {
          const rec = new MediaRecorder(stream);
          rec.ondataavailable = (evt) => {
            if (evt.data && evt.data.size > 0 && !this.isMuted) {
              const reader = new FileReader();
              reader.onloadend = () => {
                const b64 = reader.result as string;
                if (b64) {
                  this.socket.emit('voiceDataChunk', { chunk: b64 });
                }
              };
              reader.readAsDataURL(evt.data);
            }
          };
          rec.start(800);
          this.mediaRecorder = rec;
        } catch (e) {
          console.warn('Voice relay setup note:', e);
        }
      }

      // 3. Emit join voice event to server
      this.socket.emit('joinVoice');

      return true;
    } catch (err: any) {
      console.warn('Microphone permission not granted or device unavailable:', err?.message || err);
      const msg = err.name === 'NotAllowedError'
        ? 'تم رفض إذن الوصول للميكروفون. يرجى تفعيل إذن المايك في إعدادات المتصفح.'
        : 'تعذر الوصول إلى الميكروفون: ' + (err.message || 'يرجى التأكد من توصيل المايكروفون');
      if (this.onError) this.onError(msg);
      return false;
    }
  }

  // Take one of the 5 Mic Slots
  public async takeMicSlot(slotNumber: number): Promise<boolean> {
    const success = await this.joinVoice();
    if (success) {
      this.socket.emit('takeMic', { slotNumber });
      return true;
    }
    return false;
  }

  // Drop Mic Slot
  public dropMicSlot() {
    this.socket.emit('dropMic');
    this.leaveVoice();
  }


  // Initiate call to an existing peer
  private async initiateCallTo(targetId: string, username: string) {
    if (this.peers.has(targetId) || !this.localStream) return;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    const peer: RemoteVoicePeer = { id: targetId, username, pc };
    this.peers.set(targetId, peer);

    // Add local tracks
    this.localStream.getTracks().forEach((track) => {
      pc.addTrack(track, this.localStream!);
    });

    // Handle incoming remote tracks
    pc.ontrack = (event) => {
      this.attachRemoteTrack(peer, event.streams[0]);
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('voiceSignal', {
          targetId,
          signal: { candidate: event.candidate }
        });
      }
    };

    // Create & send offer
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      this.socket.emit('voiceSignal', {
        targetId,
        signal: offer
      });
    } catch (err) {
      console.error('Failed to create offer:', err);
    }

    this.notifyPeers();
  }

  // Handle incoming offer from a peer
  private async handleReceiveOffer(senderId: string, senderUsername: string, offer: RTCSessionDescriptionInit) {
    let peer = this.peers.get(senderId);
    let pc: RTCPeerConnection;

    if (!peer) {
      pc = new RTCPeerConnection(ICE_SERVERS);
      peer = { id: senderId, username: senderUsername, pc };
      this.peers.set(senderId, peer);

      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => {
          pc.addTrack(track, this.localStream!);
        });
      }

      pc.ontrack = (event) => {
        this.attachRemoteTrack(peer!, event.streams[0]);
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          this.socket.emit('voiceSignal', {
            targetId: senderId,
            signal: { candidate: event.candidate }
          });
        }
      };
    } else {
      pc = peer.pc;
    }

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    this.socket.emit('voiceSignal', {
      targetId: senderId,
      signal: answer
    });

    this.notifyPeers();
  }

  // Handle incoming answer
  private async handleReceiveAnswer(senderId: string, answer: RTCSessionDescriptionInit) {
    const peer = this.peers.get(senderId);
    if (peer && peer.pc) {
      await peer.pc.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }

  // Handle incoming candidate
  private async handleReceiveCandidate(senderId: string, candidate: RTCIceCandidateInit) {
    const peer = this.peers.get(senderId);
    if (peer && peer.pc) {
      await peer.pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  // Attach remote stream to HTMLAudioElement
  private attachRemoteTrack(peer: RemoteVoicePeer, stream: MediaStream) {
    peer.stream = stream;
    let audio = peer.audioElement;
    if (!audio) {
      audio = document.createElement('audio');
      audio.autoplay = true;
      audio.muted = this.isDeafened;
      peer.audioElement = audio;
    }
    audio.srcObject = stream;
    audio.play().catch((err) => console.log('Audio autoplay retry on user interaction:', err));
    this.notifyPeers();
  }

  // Setup AnalyserNode for local mic volume meter and speaking indicator
  private setupAudioAnalysis(stream: MediaStream) {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtx();
      const source = this.audioCtx.createMediaStreamSource(stream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.5;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!this.analyser || !this.isInVoice) return;
        this.analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const volumePercent = Math.min(100, Math.round((avg / 128) * 100));

        if (this.onVolumeChange) {
          this.onVolumeChange(this.isMuted ? 0 : volumePercent);
        }

        // Speaking state threshold
        const isSpeakingNow = !this.isMuted && volumePercent > 12;
        if (isSpeakingNow !== this.lastSpeakingState) {
          this.lastSpeakingState = isSpeakingNow;
          this.socket.emit('voiceStateUpdate', { isSpeaking: isSpeakingNow });
        }

        this.animFrameId = requestAnimationFrame(checkVolume);
      };

      this.animFrameId = requestAnimationFrame(checkVolume);
    } catch (err) {
      console.error('Audio analysis setup error:', err);
    }
  }

  // Toggle local mute
  public toggleMute(): boolean {
    if (!this.localStream) return false;
    this.isMuted = !this.isMuted;
    this.localStream.getAudioTracks().forEach((track) => {
      track.enabled = !this.isMuted;
    });

    this.socket.emit('voiceStateUpdate', {
      isMuted: this.isMuted,
      isSpeaking: false
    });

    if (this.onVolumeChange && this.isMuted) {
      this.onVolumeChange(0);
    }

    return this.isMuted;
  }

  // Toggle Deafen (mute all remote voices)
  public toggleDeafen(): boolean {
    this.isDeafened = !this.isDeafened;
    this.peers.forEach((peer) => {
      if (peer.audioElement) {
        peer.audioElement.muted = this.isDeafened;
      }
    });
    return this.isDeafened;
  }

  // Close specific peer
  private closePeer(id: string) {
    const peer = this.peers.get(id);
    if (peer) {
      if (peer.audioElement) {
        peer.audioElement.pause();
        peer.audioElement.srcObject = null;
        peer.audioElement.remove();
      }
      peer.pc.close();
      this.peers.delete(id);
      this.notifyPeers();
    }
  }

  // Leave Voice Room
  public leaveVoice() {
    if (!this.isInVoice) return;
    this.isInVoice = false;

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch {}
      this.mediaRecorder = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }

    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }

    this.peers.forEach((peer) => {
      if (peer.audioElement) {
        peer.audioElement.pause();
        peer.audioElement.srcObject = null;
        peer.audioElement.remove();
      }
      peer.pc.close();
    });
    this.peers.clear();

    this.socket.emit('leaveVoice');
    this.notifyPeers();
  }

  // Complete cleanup and destroy manager instance
  public destroy() {
    this.leaveVoice();
    this.socketListeners.forEach(({ event, fn }) => {
      this.socket.off(event, fn);
    });
    this.socketListeners = [];
    this.onVolumeChange = undefined;
    this.onPeersUpdated = undefined;
    this.onError = undefined;
  }

  private notifyPeers() {
    if (this.onPeersUpdated) {
      this.onPeersUpdated(Array.from(this.peers.values()));
    }
  }
}
