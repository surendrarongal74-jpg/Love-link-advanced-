// Synthesized acoustic sound effects using the Web Audio API
// 100% offline, zero network requests, organic & tactile

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Aliases for intuitive caller ergonomics
  heartbeat() { this.playHeartbeat(); }
  tap() { this.playPop(); }
  pop() { this.playPop(); }
  chime() { this.playChime(); }
  success() { this.playSuccess(); }

  // Double warm heartbeat thud
  playHeartbeat() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // First lub
      this.playThump(ctx, now, 60, 0.18, 0.4);
      // Second dub
      this.playThump(ctx, now + 0.16, 75, 0.14, 0.35);
    } catch {
      // Audio not permitted or inactive
    }
  }

  private playThump(ctx: AudioContext, startTime: number, freq: number, duration: number, gainVal: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);
    osc.frequency.exponentialRampToValueAtTime(30, startTime + duration);

    gain.gain.setValueAtTime(gainVal, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  // Soft tactile pop when removing items or selecting
  playPop() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch {}
  }

  // Gentle romantic chime (when sending notes or locking answers)
  playChime() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const notes = [587.33, 739.99, 880, 1174.66]; // D5, F#5, A5, D6

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.12, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.4);
      });
    } catch {}
  }

  // Celebratory chords when both partners answer daily question
  playSuccess() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const chord = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

      chord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);

        gain.gain.setValueAtTime(0.18, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.6);
      });
    } catch {}
  }

  // Sparkly romantic live notification chime (e.g. for incoming messages, questions, surprises)
  playNotificationChime() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      // Ascending romantic chime chord: F#5 (739.99Hz), A5 (880Hz), C#6 (1108.73Hz), E6 (1318.51Hz)
      const notes = [739.99, 880, 1108.73, 1318.51];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.18, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 0.55);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.55);
      });
    } catch {}
  }

  // Romantic love alert for partner heartbeat pulse, kiss, or intimate nudge
  playLoveAlert() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      // Lub-dub heartbeat pulse
      this.playThump(ctx, now, 65, 0.16, 0.45);
      this.playThump(ctx, now + 0.14, 80, 0.12, 0.4);
      // Soft lingering harp chime
      [880, 1174.66].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + 0.28 + idx * 0.08);
        gain.gain.setValueAtTime(0.12, now + 0.28 + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28 + idx * 0.08 + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + 0.28 + idx * 0.08);
        osc.stop(now + 0.28 + idx * 0.08 + 0.6);
      });
    } catch {}
  }

  // Crisp playful message ding
  playMessageDing() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.08); // E6
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch {}
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  getMuted(): boolean {
    return this.isMuted;
  }

  // Ringtone for incoming call
  playRingtone(): () => void {
    if (this.isMuted) return () => {};
    let isRunning = true;
    const playRingCycle = () => {
      if (!isRunning) return;
      try {
        const ctx = this.getContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        // Dual-tone chime chord: 853Hz & 960Hz / 440Hz & 480Hz
        [480, 520].forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 1.2);
        });
      } catch {}
    };

    playRingCycle();
    const interval = setInterval(playRingCycle, 2400);

    return () => {
      isRunning = false;
      clearInterval(interval);
    };
  }

  // Dialing tone for outgoing call
  playDialTone(): () => void {
    if (this.isMuted) return () => {};
    let isRunning = true;
    const playTone = () => {
      if (!isRunning) return;
      try {
        const ctx = this.getContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        [440, 480].forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0.05, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.0);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 1.0);
        });
      } catch {}
    };

    playTone();
    const interval = setInterval(playTone, 2800);

    return () => {
      isRunning = false;
      clearInterval(interval);
    };
  }
}

export const sound = new SoundManager();

export function playSound(type: 'heartbeat' | 'pop' | 'chime' | 'success' | 'tap') {
  if (type === 'heartbeat') sound.playHeartbeat();
  else if (type === 'chime') sound.playChime();
  else if (type === 'success') sound.playSuccess();
  else sound.playPop();
}
