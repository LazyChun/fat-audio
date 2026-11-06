import { midiToFrequency } from "./audio";

/** Score note duration → beats (assuming 4/4 quarter = 1 beat). */
const SCORE_DURATION_BEATS: Record<string, number> = {
  whole: 4,
  half: 2,
  quarter: 1,
  eighth: 0.5,
  sixteenth: 0.25,
  dotted: 1.5,
};

interface OscVoice {
  type: OscillatorType;
  detune: number; // cents
  gain: number; // 0-1 mix weight
}

interface InstrumentConfig {
  voices: OscVoice[];
  filterType: BiquadFilterType;
  filterQ: number;
}

const INSTRUMENT_CONFIGS: Record<string, InstrumentConfig> = {
  piano: {
    voices: [
      { type: "triangle", detune: 0, gain: 0.6 },
      { type: "sine", detune: 0, gain: 0.3 },
      { type: "sine", detune: 1200, gain: 0.08 },
    ],
    filterType: "lowpass",
    filterQ: 1,
  },
  epiano: {
    voices: [
      { type: "sine", detune: 0, gain: 0.5 },
      { type: "triangle", detune: 0, gain: 0.3 },
      { type: "sine", detune: 1200, gain: 0.15 },
    ],
    filterType: "lowpass",
    filterQ: 2,
  },
  organ: {
    voices: [
      { type: "sawtooth", detune: 0, gain: 0.35 },
      { type: "sine", detune: 1200, gain: 0.25 },
      { type: "sine", detune: 1900, gain: 0.2 },
    ],
    filterType: "lowpass",
    filterQ: 1,
  },
  synth: {
    voices: [
      { type: "sawtooth", detune: -7, gain: 0.4 },
      { type: "sawtooth", detune: 7, gain: 0.4 },
    ],
    filterType: "lowpass",
    filterQ: 4,
  },
  guitar: {
    voices: [
      { type: "triangle", detune: 0, gain: 0.55 },
      { type: "sawtooth", detune: 0, gain: 0.2 },
    ],
    filterType: "lowpass",
    filterQ: 1.5,
  },
  eguitar: {
    voices: [
      { type: "sawtooth", detune: 0, gain: 0.45 },
      { type: "square", detune: 0, gain: 0.2 },
    ],
    filterType: "lowpass",
    filterQ: 3,
  },
  bass: {
    voices: [
      { type: "sine", detune: 0, gain: 0.6 },
      { type: "triangle", detune: 0, gain: 0.3 },
    ],
    filterType: "lowpass",
    filterQ: 1,
  },
  violin: {
    voices: [
      { type: "sawtooth", detune: -4, gain: 0.4 },
      { type: "sawtooth", detune: 4, gain: 0.4 },
    ],
    filterType: "lowpass",
    filterQ: 2,
  },
  cello: {
    voices: [
      { type: "sawtooth", detune: 0, gain: 0.5 },
      { type: "triangle", detune: 0, gain: 0.3 },
    ],
    filterType: "lowpass",
    filterQ: 1.5,
  },
  flute: {
    voices: [
      { type: "sine", detune: 0, gain: 0.7 },
      { type: "triangle", detune: 0, gain: 0.15 },
    ],
    filterType: "lowpass",
    filterQ: 1,
  },
  saxophone: {
    voices: [
      { type: "sawtooth", detune: 0, gain: 0.45 },
      { type: "square", detune: 0, gain: 0.2 },
    ],
    filterType: "lowpass",
    filterQ: 2.5,
  },
  trumpet: {
    voices: [
      { type: "sawtooth", detune: 0, gain: 0.5 },
      { type: "square", detune: 0, gain: 0.25 },
    ],
    filterType: "lowpass",
    filterQ: 3,
  },
  drums: {
    voices: [{ type: "square", detune: 0, gain: 0.6 }],
    filterType: "lowpass",
    filterQ: 1,
  },
  stringEnsemble: {
    voices: [
      { type: "sawtooth", detune: -8, gain: 0.3 },
      { type: "sawtooth", detune: 0, gain: 0.3 },
      { type: "sawtooth", detune: 8, gain: 0.3 },
    ],
    filterType: "lowpass",
    filterQ: 1.5,
  },
  vocals: {
    voices: [
      { type: "sawtooth", detune: 0, gain: 0.4 },
      { type: "triangle", detune: 0, gain: 0.3 },
    ],
    filterType: "bandpass",
    filterQ: 2,
  },
  brassEnsemble: {
    voices: [
      { type: "sawtooth", detune: -5, gain: 0.4 },
      { type: "sawtooth", detune: 5, gain: 0.4 },
    ],
    filterType: "lowpass",
    filterQ: 2.5,
  },
};

const getInstrumentConfig = (instrument: string): InstrumentConfig => {
  return INSTRUMENT_CONFIGS[instrument] || INSTRUMENT_CONFIGS.piano;
};

interface ActiveNote {
  stop: (when?: number) => void;
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private reverb: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedback: GainNode | null = null;
  private delayWet: GainNode | null = null;
  private activeNotes: ActiveNote[] = [];
  private scheduledOscillators: OscillatorNode[] = [];

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.6;
      this.master.connect(this.ctx.destination);

      this.reverb = this.ctx.createConvolver();
      this.reverb.buffer = this.createImpulse(2.2, 2.5);
      this.reverbGain = this.ctx.createGain();
      this.reverbGain.gain.value = 0;
      this.reverb.connect(this.reverbGain);
      this.reverbGain.connect(this.master);

      this.delayNode = this.ctx.createDelay(1.0);
      this.delayNode.delayTime.value = 0.28;
      this.delayFeedback = this.ctx.createGain();
      this.delayFeedback.gain.value = 0.35;
      this.delayWet = this.ctx.createGain();
      this.delayWet.gain.value = 0;
      this.delayNode.connect(this.delayFeedback);
      this.delayFeedback.connect(this.delayNode);
      this.delayNode.connect(this.delayWet);
      this.delayWet.connect(this.master);
    }
    return this.ctx;
  }

  private createImpulse(duration: number, decay: number): AudioBuffer {
    const ctx = this.ctx!;
    const rate = ctx.sampleRate;
    const length = Math.floor(rate * duration);
    const impulse = ctx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    return impulse;
  }

  async resume(): Promise<void> {
    const ctx = this.ensureContext();
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
  }

  private connectEffects(
    source: AudioNode,
    tone: Audio.ToneParams,
    ctx: AudioContext,
  ): void {
    if (this.reverbGain && this.reverb) {
      const reverbAmount = Math.max(0, Math.min(1, tone.reverb / 100));
      if (reverbAmount > 0) {
        const send = ctx.createGain();
        send.gain.value = reverbAmount;
        source.connect(send);
        send.connect(this.reverb);
      }
    }
    if (this.delayNode && this.delayWet) {
      const delayAmount = Math.max(0, Math.min(1, tone.delay / 100));
      if (delayAmount > 0) {
        const send = ctx.createGain();
        send.gain.value = delayAmount;
        source.connect(send);
        send.connect(this.delayNode);
      }
    }
  }

  /**
   * Synthesize and play a single note immediately.
   * Returns the ActiveNote so the caller can stop it early.
   */
  playNote(
    midi: number,
    durationSec: number,
    velocity: number,
    tone: Audio.ToneParams,
    instrument = "piano",
  ): ActiveNote {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;
    return this.scheduleNote(
      midi,
      durationSec,
      velocity,
      tone,
      instrument,
      now,
    );
  }

  private scheduleNote(
    midi: number,
    durationSec: number,
    velocity: number,
    tone: Audio.ToneParams,
    instrument: string,
    startTime: number,
  ): ActiveNote {
    const ctx = this.ensureContext();
    const cfg = getInstrumentConfig(instrument);
    const freq = midiToFrequency(midi + tone.octave * 12);
    const vel = Math.max(0, Math.min(1, velocity / 127));

    // per-note chain: voices → envGain → filter → panner → master
    const envGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = cfg.filterType;
    filter.frequency.value = Math.max(20, tone.cutoff);
    filter.Q.value = cfg.filterQ + tone.resonance / 10;

    const panner = ctx.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, tone.pan / 100));

    envGain.connect(filter);
    filter.connect(panner);
    panner.connect(this.master!);
    this.connectEffects(panner, tone, ctx);

    // ADSR (ms → s)
    const attack = Math.max(0.001, tone.attack / 1000);
    const decay = Math.max(0.001, tone.decay / 1000);
    const sustainLevel = Math.max(0, Math.min(1, tone.sustain / 100));
    const release = Math.max(0.05, tone.release / 1000);
    const peak = vel * 0.8;
    const sustainVal = vel * 0.8 * sustainLevel;

    const oscs: OscillatorNode[] = [];
    const voiceGains: GainNode[] = [];

    // chorus: extra detune depth from chorus param
    const chorusDetune = (tone.chorus / 100) * 12;

    for (const voice of cfg.voices) {
      const osc = ctx.createOscillator();
      osc.type = voice.type;
      osc.frequency.value = freq;
      osc.detune.value = voice.detune + tone.fineTuning + (chorusDetune ? chorusDetune * (Math.random() - 0.5) * 2 : 0);

      const vg = ctx.createGain();
      vg.gain.value = voice.gain;
      osc.connect(vg);
      vg.connect(envGain);

      oscs.push(osc);
      voiceGains.push(vg);
    }

    // envelope
    envGain.gain.setValueAtTime(0, startTime);
    envGain.gain.linearRampToValueAtTime(peak, startTime + attack);
    envGain.gain.linearRampToValueAtTime(sustainVal, startTime + attack + decay);
    const noteEnd = startTime + durationSec;
    envGain.gain.setValueAtTime(sustainVal, Math.max(startTime + attack + decay, noteEnd));
    envGain.gain.linearRampToValueAtTime(0.0001, noteEnd + release);

    for (const osc of oscs) {
      osc.start(startTime);
      osc.stop(noteEnd + release + 0.05);
    }

    this.scheduledOscillators.push(...oscs);

    const active: ActiveNote = {
      stop: (when?: number) => {
        const t = when ?? ctx.currentTime;
        try {
          envGain.gain.cancelScheduledValues(t);
          envGain.gain.setValueAtTime(envGain.gain.value, t);
          envGain.gain.linearRampToValueAtTime(0.0001, t + release);
          for (const osc of oscs) {
            osc.stop(t + release + 0.05);
          }
        } catch {
          // already stopped
        }
      },
    };
    this.activeNotes.push(active);
    return active;
  }

  /** Schedule all score notes for playback, starting at `startOffsetSec` from now. */
  scheduleScoreNotes(
    notes: Audio.ScoreNote[],
    bpm: number,
    timeSignature: string,
    tone: Audio.ToneParams,
    instrument: string,
    startOffsetSec = 0,
    fromMs = 0,
  ): void {
    const ctx = this.ensureContext();
    const now = ctx.currentTime + startOffsetSec;
    const beatsPerMeasure = parseInt(timeSignature.split("/")[0], 10) || 4;
    const secPerBeat = 60 / Math.max(1, bpm);
    const fromSec = Math.max(0, fromMs / 1000);

    for (const note of notes) {
      if (note.isRest) continue;
      const startBeat = note.measure * beatsPerMeasure + note.beat;
      const noteStartSec = startBeat * secPerBeat;
      if (noteStartSec < fromSec) continue;
      const startTime = now + (noteStartSec - fromSec);
      const beats = SCORE_DURATION_BEATS[note.duration] ?? 1;
      const durSec = beats * secPerBeat;
      this.scheduleNote(
        note.pitch,
        durSec,
        note.velocity,
        tone,
        instrument,
        startTime,
      );
    }
  }

  /** Schedule all piano-roll track notes. */
  scheduleTrackNotes(
    tracks: Audio.Track[],
    bpm: number,
    tone: Audio.ToneParams,
    defaultInstrument: string,
    startOffsetSec = 0,
    fromMs = 0,
  ): void {
    const ctx = this.ensureContext();
    const now = ctx.currentTime + startOffsetSec;
    const secPerBeat = 60 / Math.max(1, bpm);
    const fromSec = Math.max(0, fromMs / 1000);

    const anySolo = tracks.some((t) => t.solo);

    for (const track of tracks) {
      if (track.muted) continue;
      if (anySolo && !track.solo) continue;
      const inst = track.key || defaultInstrument;
      for (const note of track.notes) {
        const noteStartSec = note.startBeat * secPerBeat;
        if (noteStartSec < fromSec) continue;
        const startTime = now + (noteStartSec - fromSec);
        const durSec = note.durationBeats * secPerBeat;
        const trackVol = Math.max(0, Math.min(1, track.volume / 100));
        const effectiveVel = Math.round(note.velocity * (0.4 + trackVol * 0.6));
        this.scheduleNote(
          note.pitch,
          durSec,
          effectiveVel,
          tone,
          inst,
          startTime,
        );
      }
    }
  }

  /** Stop all active and scheduled notes immediately. */
  stopAll(): void {
    const ctx = this.ctx;
    if (ctx) {
      for (const note of this.activeNotes) {
        note.stop(ctx.currentTime);
      }
    }
    this.activeNotes = [];
    this.scheduledOscillators = [];
  }

  setMasterVolume(volume: number): void {
    if (this.master) {
      this.master.gain.value = Math.max(0, Math.min(1, volume));
    }
  }
}

export const audioEngine = new AudioEngine();
