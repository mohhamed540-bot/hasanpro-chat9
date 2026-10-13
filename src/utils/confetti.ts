import canvasConfetti from 'canvas-confetti';

export type ConfettiOptions = canvasConfetti.Options;

// Polyfill OffscreenCanvas.prototype.getBoundingClientRect if it exists
if (typeof OffscreenCanvas !== 'undefined' && !(OffscreenCanvas.prototype as any).getBoundingClientRect) {
  (OffscreenCanvas.prototype as any).getBoundingClientRect = function () {
    return {
      top: 0,
      left: 0,
      right: this.width || 300,
      bottom: this.height || 150,
      width: this.width || 300,
      height: this.height || 150,
      x: 0,
      y: 0,
      toJSON: () => ({})
    };
  };
}

// Create dedicated safe instance with useWorker: false to completely avoid Web Worker + OffscreenCanvas crash
let safeConfettiInstance: ReturnType<typeof canvasConfetti.create> | null = null;
try {
  if (typeof window !== 'undefined' && canvasConfetti && typeof canvasConfetti.create === 'function') {
    safeConfettiInstance = canvasConfetti.create(undefined as any, {
      resize: true,
      useWorker: false
    });
  }
} catch {
  safeConfettiInstance = null;
}

export const confetti = (options?: ConfettiOptions): Promise<void> => {
  return new Promise((resolve) => {
    try {
      if (safeConfettiInstance) {
        const res = safeConfettiInstance(options);
        if (res && typeof res.then === 'function') {
          res.then(() => resolve()).catch(() => resolve());
          return;
        }
      } else if (typeof canvasConfetti === 'function') {
        const res = canvasConfetti(options);
        if (res && typeof res.then === 'function') {
          res.then(() => resolve()).catch(() => resolve());
          return;
        }
      }
    } catch (err) {
      console.warn('Confetti animation suppressed safely:', err);
    }
    resolve();
  });
};

export default confetti;
