// ---------------------------------------------------------------------------
// THE SYSTEM'S VOICE
//
// High-value cues use original compressed OGG assets through reusable HTML5
// Audio instances. The entire set is under 30 KB and files are constructed
// lazily, so ordinary navigation downloads nothing. Web Audio synthesis stays
// as the fallback for unsupported playback and secondary cues.
// ---------------------------------------------------------------------------

const SETTINGS_KEY = 'fitomi:sound';

let ctx = null;
let master = null;
let reverb = null;
let unlocked = false;

let enabled = true;
let volume = 0.6;

const FILE_CUES = {
  tap: '/audio/tap.ogg',
  select: '/audio/success.ogg',
  confirm: '/audio/success.ogg',
  success: '/audio/success.ogg',
  questComplete: '/audio/success.ogg',
  record: '/audio/success.ogg',
  reveal: '/audio/success.ogg',
  levelUp: '/audio/level-up.ogg',
  damage: '/audio/damage.ogg',
  error: '/audio/error.ogg',
  restDone: '/audio/rest-done.ogg',
  setComplete: '/audio/tap.ogg',
};

const audioPools = new Map();

try {
  const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  if (typeof saved.enabled === 'boolean') enabled = saved.enabled;
  if (typeof saved.volume === 'number') volume = saved.volume;
} catch {
  /* defaults are fine */
}

export function getSoundSettings() {
  return { enabled, volume };
}

export function setSoundSettings(patch) {
  if (typeof patch.enabled === 'boolean') enabled = patch.enabled;
  if (typeof patch.volume === 'number') volume = Math.max(0, Math.min(1, patch.volume));
  if (master) master.gain.value = enabled ? volume : 0;
  audioPools.forEach((pool) => pool.forEach((audio) => { audio.volume = enabled ? volume : 0; }));
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ enabled, volume }));
  } catch {
    /* ignore */
  }
}

function audioPool(source) {
  if (typeof Audio === 'undefined') return null;
  if (!audioPools.has(source)) {
    const pool = Array.from({ length: 2 }, () => {
      const audio = new Audio(source);
      audio.preload = 'auto';
      audio.volume = enabled ? volume : 0;
      return audio;
    });
    audioPools.set(source, pool);
  }
  return audioPools.get(source);
}

/** Plays a cached file cue. Returns false when HTML5 Audio is unavailable. */
function playFile(cue) {
  const source = FILE_CUES[cue];
  if (!source) return false;
  const pool = audioPool(source);
  if (!pool) return false;
  const audio = pool.find((item) => item.paused || item.ended) || pool[0];
  audio.volume = volume;
  audio.currentTime = 0;
  const attempt = audio.play();
  if (attempt?.catch) {
    attempt.catch(() => {
      try { CUES[cue]?.(); } catch { /* audio is non-critical */ }
    });
  }
  return true;
}

/**
 * A short synthetic reverb tail.
 *
 * Built from decaying noise rather than a recorded impulse response — it is
 * two lines of maths instead of a file download, and at this length the
 * difference is inaudible.
 */
function buildReverb(context, seconds = 1.6, decay = 3.2) {
  const rate = context.sampleRate;
  const length = Math.floor(rate * seconds);
  const buffer = context.createBuffer(2, length, rate);
  for (let channel = 0; channel < 2; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** decay;
    }
  }
  const convolver = context.createConvolver();
  convolver.buffer = buffer;
  return convolver;
}

function ensureContext() {
  if (ctx) return ctx;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;

  ctx = new AudioCtx();
  master = ctx.createGain();
  master.gain.value = enabled ? volume : 0;
  master.connect(ctx.destination);

  reverb = buildReverb(ctx);
  const wet = ctx.createGain();
  wet.gain.value = 0.22;
  reverb.connect(wet).connect(master);

  return ctx;
}

/**
 * iOS will not start an AudioContext outside a user gesture, and a context
 * created before one stays suspended forever. This arms on the first touch or
 * key press and then removes itself.
 */
export function unlockAudio() {
  if (unlocked) return;
  const resume = () => {
    const context = ensureContext();
    if (context?.state === 'suspended') context.resume();
    unlocked = true;
    for (const evt of ['pointerdown', 'touchstart', 'keydown']) {
      window.removeEventListener(evt, resume);
    }
  };
  for (const evt of ['pointerdown', 'touchstart', 'keydown']) {
    window.addEventListener(evt, resume, { once: false, passive: true });
  }
}

// --- primitives ------------------------------------------------------------

/** One voice: an oscillator with an envelope, optionally swept and reverbed. */
function tone({
  freq, type = 'sine', at = 0, duration = 0.3, gain = 0.3,
  sweepTo = null, attack = 0.005, wet = 0.5, detune = 0,
}) {
  const context = ensureContext();
  if (!context || !enabled) return;

  const t = context.currentTime + at;
  const osc = context.createOscillator();
  const env = context.createGain();

  osc.type = type;
  osc.detune.value = detune;
  osc.frequency.setValueAtTime(freq, t);
  if (sweepTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, sweepTo), t + duration);

  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(gain, t + attack);
  env.gain.exponentialRampToValueAtTime(0.0001, t + duration);

  osc.connect(env);
  env.connect(master);
  if (reverb && wet > 0) {
    const send = context.createGain();
    send.gain.value = wet;
    env.connect(send).connect(reverb);
  }

  osc.start(t);
  osc.stop(t + duration + 0.05);
}

/** Filtered noise — used for impacts and the shadow's texture. */
function noise({ at = 0, duration = 0.25, gain = 0.2, freq = 900, q = 1, type = 'bandpass' }) {
  const context = ensureContext();
  if (!context || !enabled) return;

  const t = context.currentTime + at;
  const length = Math.floor(context.sampleRate * duration);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;

  const src = context.createBufferSource();
  src.buffer = buffer;

  const filter = context.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = freq;
  filter.Q.value = q;

  const env = context.createGain();
  env.gain.setValueAtTime(gain, t);
  env.gain.exponentialRampToValueAtTime(0.0001, t + duration);

  src.connect(filter).connect(env).connect(master);
  if (reverb) {
    const send = context.createGain();
    send.gain.value = 0.3;
    env.connect(send).connect(reverb);
  }
  src.start(t);
}

// Note helper: equal temperament from A4 = 440.
const N = (semitonesFromA4) => 440 * 2 ** (semitonesFromA4 / 12);

// --- the cues --------------------------------------------------------------

export const CUES = {
  /** Soft click for any ordinary control. */
  tap() {
    tone({ freq: N(16), type: 'triangle', duration: 0.06, gain: 0.1, wet: 0.15 });
  },

  /** Selecting an option — brighter than a tap, still small. */
  select() {
    tone({ freq: N(19), type: 'sine', duration: 0.1, gain: 0.16, wet: 0.3 });
    tone({ freq: N(26), type: 'sine', at: 0.03, duration: 0.12, gain: 0.09, wet: 0.4 });
  },

  /** A System window unfolding. */
  open() {
    tone({ freq: N(4), sweepTo: N(19), type: 'sine', duration: 0.24, gain: 0.13, wet: 0.5 });
    tone({ freq: N(28), type: 'sine', at: 0.08, duration: 0.3, gain: 0.06, wet: 0.6 });
  },

  close() {
    tone({ freq: N(19), sweepTo: N(4), type: 'sine', duration: 0.18, gain: 0.1, wet: 0.35 });
  },

  /** The [!] alert — the System has something to say. */
  notify() {
    tone({ freq: N(16), type: 'sine', duration: 0.5, gain: 0.24, wet: 0.7 });
    tone({ freq: N(23), type: 'sine', at: 0.09, duration: 0.6, gain: 0.19, wet: 0.8 });
    tone({ freq: N(28), type: 'sine', at: 0.18, duration: 0.7, gain: 0.11, wet: 0.9 });
  },

  /** Accepting — a decisive rising pair. */
  confirm() {
    tone({ freq: N(11), type: 'triangle', duration: 0.16, gain: 0.2, wet: 0.4 });
    tone({ freq: N(18), type: 'triangle', at: 0.1, duration: 0.32, gain: 0.2, wet: 0.6 });
  },

  success() {
    CUES.confirm();
  },

  /** Quest cleared — brief and satisfying, heard many times a day. */
  questComplete() {
    tone({ freq: N(16), type: 'sine', duration: 0.14, gain: 0.18, wet: 0.4 });
    tone({ freq: N(20), type: 'sine', at: 0.07, duration: 0.22, gain: 0.16, wet: 0.5 });
    tone({ freq: N(23), type: 'sine', at: 0.14, duration: 0.4, gain: 0.13, wet: 0.7 });
  },

  /** LEVEL UP — an ascending arpeggio with a shimmer over the top. */
  levelUp() {
    const steps = [4, 8, 11, 16, 20, 23];
    steps.forEach((s, i) => {
      tone({ freq: N(s), type: 'triangle', at: i * 0.075, duration: 0.5, gain: 0.19, wet: 0.6 });
      tone({ freq: N(s + 12), type: 'sine', at: i * 0.075 + 0.01, duration: 0.4, gain: 0.07, wet: 0.8 });
    });
    tone({ freq: N(28), type: 'sine', at: 0.5, duration: 1.4, gain: 0.13, wet: 1 });
    tone({ freq: N(35), type: 'sine', at: 0.56, duration: 1.2, gain: 0.07, wet: 1 });
  },

  /** A personal record — bright, major, triumphant. */
  record() {
    [16, 20, 23, 28].forEach((s, i) => {
      tone({ freq: N(s), type: 'sine', at: i * 0.05, duration: 0.7, gain: 0.17, wet: 0.7 });
    });
    tone({ freq: N(32), type: 'sine', at: 0.22, duration: 0.9, gain: 0.09, wet: 0.9 });
  },

  /** Shadow extraction — low, wide and ominous, with a cold shimmer. */
  shadow() {
    tone({ freq: N(-20), type: 'sine', duration: 1.6, gain: 0.24, wet: 0.8 });
    tone({ freq: N(-13), type: 'sine', at: 0.05, duration: 1.5, gain: 0.16, wet: 0.9 });
    tone({ freq: N(-8), type: 'triangle', at: 0.2, duration: 1.3, gain: 0.1, wet: 1 });
    noise({ at: 0.1, duration: 1.2, gain: 0.05, freq: 3200, q: 0.7, type: 'highpass' });
    tone({ freq: N(23), sweepTo: N(11), type: 'sine', at: 0.4, duration: 1.1, gain: 0.07, wet: 1 });
  },

  /** A hit landing on the raid boss. */
  damage() {
    noise({ duration: 0.22, gain: 0.24, freq: 260, q: 0.9, type: 'lowpass' });
    tone({ freq: N(-17), sweepTo: N(-29), type: 'square', duration: 0.2, gain: 0.13, wet: 0.3 });
  },

  /** Gate cleared — the boss falls. */
  defeat() {
    noise({ duration: 0.5, gain: 0.22, freq: 200, q: 0.7, type: 'lowpass' });
    tone({ freq: N(-17), sweepTo: N(-29), type: 'sawtooth', duration: 0.7, gain: 0.14, wet: 0.5 });
    [11, 16, 23].forEach((s, i) =>
      tone({ freq: N(s), type: 'triangle', at: 0.35 + i * 0.09, duration: 0.9, gain: 0.16, wet: 0.8 }),
    );
  },

  /** A penalty or a refusal. */
  error() {
    tone({ freq: N(-11), type: 'square', duration: 0.16, gain: 0.13, wet: 0.2 });
    tone({ freq: N(-14), type: 'square', at: 0.13, duration: 0.26, gain: 0.13, wet: 0.3 });
  },

  /** A set logged. Deliberately tiny — this fires dozens of times a session. */
  setComplete() {
    tone({ freq: N(23), type: 'sine', duration: 0.09, gain: 0.14, wet: 0.25 });
  },

  /** Rest is over. Must cut through a gym. */
  restDone() {
    [0, 0.16, 0.32].forEach((at) => {
      tone({ freq: N(16), type: 'sine', at, duration: 0.2, gain: 0.28, wet: 0.4 });
      tone({ freq: N(23), type: 'sine', at: at + 0.05, duration: 0.24, gain: 0.22, wet: 0.5 });
    });
  },

  /** The assessment resolving into a result. */
  reveal() {
    tone({ freq: N(-1), sweepTo: N(16), type: 'sine', duration: 0.7, gain: 0.16, wet: 0.8 });
    [16, 23, 28].forEach((s, i) =>
      tone({ freq: N(s), type: 'sine', at: 0.5 + i * 0.1, duration: 1, gain: 0.13, wet: 0.9 }),
    );
  },
};

/** Play a cue by name. Never throws — audio is a nicety, not a dependency. */
export function play(cue) {
  if (!enabled) return;
  try {
    if (playFile(cue)) return;
    CUES[cue]?.();
  } catch {
    /* a device that will not make noise should not break the app */
  }
}

export default play;
