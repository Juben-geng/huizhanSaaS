const SoundEffects = {
  audioContext: null,
  enabled: true,

  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  },

  playTone(frequency, duration, type = 'sine', volume = 0.1) {
    if (!this.enabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  },

  playHover() {
    this.init();
    this.playTone(800, 0.1, 'sine', 0.05);
  },

  playFocus() {
    this.init();
    this.playTone(900, 0.05, 'sine', 0.03);
  },

  playClick() {
    this.init();
    this.playTone(600, 0.1, 'sine', 0.1);
    setTimeout(() => {
      this.playTone(900, 0.15, 'sine', 0.08);
    }, 50);
  },

  playSuccess() {
    this.init();
    const frequencies = [523.25, 659.25, 783.99, 1046.50];
    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        this.playTone(freq, 0.2, 'sine', 0.08);
      }, index * 100);
    });
  },

  playError() {
    this.init();
    this.playTone(200, 0.3, 'sawtooth', 0.1);
    setTimeout(() => {
      this.playTone(150, 0.3, 'sawtooth', 0.08);
    }, 100);
  },

  playDelete() {
    this.init();
    this.playTone(400, 0.15, 'sine', 0.1);
    setTimeout(() => {
      this.playTone(300, 0.2, 'sine', 0.08);
    }, 80);
  },

  playNotification() {
    this.init();
    this.playTone(587.33, 0.1, 'sine', 0.08);
    setTimeout(() => {
      this.playTone(880, 0.2, 'sine', 0.06);
    }, 100);
  },

  playEdit() {
    this.init();
    this.playTone(700, 0.1, 'sine', 0.08);
  },

  playOpen() {
    this.init();
    this.playTone(440, 0.1, 'sine', 0.06);
    setTimeout(() => {
      this.playTone(550, 0.1, 'sine', 0.06);
    }, 80);
    setTimeout(() => {
      this.playTone(660, 0.15, 'sine', 0.06);
    }, 160);
  },

  playClose() {
    this.init();
    this.playTone(660, 0.1, 'sine', 0.06);
    setTimeout(() => {
      this.playTone(550, 0.1, 'sine', 0.06);
    }, 80);
    setTimeout(() => {
      this.playTone(440, 0.15, 'sine', 0.06);
    }, 160);
  },

  playLoad() {
    this.init();
    const frequencies = [300, 400, 500, 600, 700];
    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        this.playTone(freq, 0.08, 'sine', 0.05);
      }, index * 80);
    });
  },

  playSave() {
    this.init();
    this.playTone(523.25, 0.1, 'sine', 0.08);
    setTimeout(() => {
      this.playTone(659.25, 0.15, 'sine', 0.1);
    }, 100);
  },

  toggle(enabled) {
    this.enabled = enabled;
  }
};

export default SoundEffects;
