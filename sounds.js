/**
 * Sound – Web Audio API (prozedural)
 */
export class Sounds {
  constructor() {
    this.ctx = null;
    this.master = 0.8;
    this.music = 0.6;
    this.sfx = 0.8;
    this.musicNode = null;
  }

  async init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('[Sounds] Web Audio nicht verfügbar');
    }
  }

  _tone(freq, duration, type = 'square', vol = 0.1) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = vol * this.sfx * this.master;
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  _noise(duration, vol = 0.05) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.value = vol * this.sfx * this.master;
    source.connect(gain);
    gain.connect(this.ctx.destination);
    source.start();
  }

  playBreak(block) {
    const name = block?.name ?? '';
    if (name.includes('stone')) this._noise(0.1, 0.08);
    else if (name.includes('wood') || name.includes('log')) this._tone(200, 0.08, 'sawtooth', 0.06);
    else if (name.includes('sand')) this._noise(0.15, 0.04);
    else this._noise(0.08, 0.06);
  }

  playPlace() { this._tone(400, 0.05, 'sine', 0.08); }
  playJump() { this._tone(300, 0.1, 'sine', 0.06); }
  playHit() { this._tone(150, 0.1, 'square', 0.1); }
  playExplosion() { this._noise(0.5, 0.2); this._tone(60, 0.4, 'sawtooth', 0.15); }

  playStep(surface) {
    if (Math.random() > 0.5) return;
    if (surface?.includes('grass')) this._noise(0.05, 0.03);
    else if (surface?.includes('stone')) this._tone(800, 0.03, 'square', 0.04);
    else this._noise(0.04, 0.03);
  }

  playMusic(mood) {
    if (!this.ctx || this.musicNode) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = mood === 'night' ? 110 : 220;
    gain.gain.value = 0.02 * this.music * this.master;
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    this.musicNode = osc;
  }

  mobSound(type) {
    const sounds = {
      zombie: () => this._tone(80, 0.3, 'sawtooth', 0.08),
      skeleton: () => { this._tone(600, 0.05); this._tone(400, 0.05); },
      creeper: () => this._noise(0.5, 0.1),
      pig: () => this._tone(150, 0.2, 'sawtooth', 0.06),
      cow: () => this._tone(90, 0.4, 'sawtooth', 0.07),
    };
    sounds[type]?.();
  }
}
