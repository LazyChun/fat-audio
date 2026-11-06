/** 导航 key */
export const NAV_KEYS = {
  WORKSPACE: "workspace",
  AI_GENERATE: "ai-generate",
  SCORE_EDITOR: "score-editor",
  INSTRUMENTS: "instruments",
} as const;
export type NavKey = (typeof NAV_KEYS)[keyof typeof NAV_KEYS];

/** 默认 8 条轨道（匹配设计稿主工作区） */
export interface DefaultTrackDef {
  key: string;
  nameKey: string;
  colorVar: string;
  color: string;
}
export const DEFAULT_TRACKS: DefaultTrackDef[] = [
  {
    key: "piano",
    nameKey: "audio.track.piano",
    colorVar: "var(--ams-track-piano)",
    color: "#6366f1",
  },
  {
    key: "drums",
    nameKey: "audio.track.drums",
    colorVar: "var(--ams-track-drums)",
    color: "#d97706",
  },
  {
    key: "guitar",
    nameKey: "audio.track.guitar",
    colorVar: "var(--ams-track-guitar)",
    color: "#059669",
  },
  {
    key: "bass",
    nameKey: "audio.track.bass",
    colorVar: "var(--ams-track-bass)",
    color: "#0891b2",
  },
  {
    key: "violin",
    nameKey: "audio.track.violin",
    colorVar: "var(--ams-track-violin)",
    color: "#e11d48",
  },
  {
    key: "synth",
    nameKey: "audio.track.synth",
    colorVar: "var(--ams-track-synth)",
    color: "#7c3aed",
  },
  {
    key: "vocals",
    nameKey: "audio.track.vocals",
    colorVar: "var(--ams-track-vocals)",
    color: "#db2777",
  },
  {
    key: "strings",
    nameKey: "audio.track.strings",
    colorVar: "var(--ams-track-strings)",
    color: "#ea580c",
  },
];

/** 乐器分类 */
export const INSTRUMENT_CATEGORIES = [
  "all",
  "keyboard",
  "strings",
  "winds",
  "percussion",
  "vocals",
  "synth",
] as const;
export type InstrumentCategory = (typeof INSTRUMENT_CATEGORIES)[number];

/** 16 件乐器（匹配设计稿乐器与音调页） */
export interface InstrumentDef {
  id: string;
  nameKey: string;
  category: Exclude<InstrumentCategory, "all">;
  colorVar: string;
  color: string;
}
export const INSTRUMENT_LIBRARY: InstrumentDef[] = [
  {
    id: "piano",
    nameKey: "audio.inst.piano",
    category: "keyboard",
    colorVar: "var(--ams-track-piano)",
    color: "#6366f1",
  },
  {
    id: "epiano",
    nameKey: "audio.inst.epiano",
    category: "keyboard",
    colorVar: "var(--ams-track-piano)",
    color: "#6366f1",
  },
  {
    id: "organ",
    nameKey: "audio.inst.organ",
    category: "keyboard",
    colorVar: "var(--ams-track-organ)",
    color: "#6d28d9",
  },
  {
    id: "synth",
    nameKey: "audio.inst.synth",
    category: "synth",
    colorVar: "var(--ams-track-synth)",
    color: "#7c3aed",
  },
  {
    id: "guitar",
    nameKey: "audio.inst.guitar",
    category: "strings",
    colorVar: "var(--ams-track-guitar)",
    color: "#059669",
  },
  {
    id: "eguitar",
    nameKey: "audio.inst.eguitar",
    category: "strings",
    colorVar: "var(--ams-track-guitar)",
    color: "#059669",
  },
  {
    id: "bass",
    nameKey: "audio.inst.bass",
    category: "strings",
    colorVar: "var(--ams-track-bass)",
    color: "#0891b2",
  },
  {
    id: "violin",
    nameKey: "audio.inst.violin",
    category: "strings",
    colorVar: "var(--ams-track-violin)",
    color: "#e11d48",
  },
  {
    id: "cello",
    nameKey: "audio.inst.cello",
    category: "strings",
    colorVar: "var(--ams-track-violin)",
    color: "#e11d48",
  },
  {
    id: "flute",
    nameKey: "audio.inst.flute",
    category: "winds",
    colorVar: "var(--ams-track-winds)",
    color: "#0d9488",
  },
  {
    id: "saxophone",
    nameKey: "audio.inst.saxophone",
    category: "winds",
    colorVar: "var(--ams-track-winds)",
    color: "#0d9488",
  },
  {
    id: "trumpet",
    nameKey: "audio.inst.trumpet",
    category: "winds",
    colorVar: "var(--ams-track-strings)",
    color: "#ea580c",
  },
  {
    id: "drums",
    nameKey: "audio.inst.drums",
    category: "percussion",
    colorVar: "var(--ams-track-drums)",
    color: "#d97706",
  },
  {
    id: "stringEnsemble",
    nameKey: "audio.inst.stringEnsemble",
    category: "strings",
    colorVar: "var(--ams-track-strings)",
    color: "#ea580c",
  },
  {
    id: "vocals",
    nameKey: "audio.inst.vocals",
    category: "vocals",
    colorVar: "var(--ams-track-vocals)",
    color: "#db2777",
  },
  {
    id: "brassEnsemble",
    nameKey: "audio.inst.brassEnsemble",
    category: "winds",
    colorVar: "var(--ams-track-strings)",
    color: "#ea580c",
  },
];

/** 音级 → 颜色（用于谱面音符着色） */
export const NOTE_PITCH_CLASSES: Record<
  string,
  { colorVar: string; color: string }
> = {
  C: { colorVar: "var(--ams-note-c)", color: "#6366f1" },
  D: { colorVar: "var(--ams-note-d)", color: "#818cf8" },
  E: { colorVar: "var(--ams-note-e)", color: "#0891b2" },
  F: { colorVar: "var(--ams-note-f)", color: "#059669" },
  G: { colorVar: "var(--ams-note-g)", color: "#d97706" },
  A: { colorVar: "var(--ams-note-a)", color: "#e11d48" },
  B: { colorVar: "var(--ams-note-b)", color: "#7c3aed" },
};

/** 音符时值 */
export const DURATION_TYPES = [
  "whole",
  "half",
  "quarter",
  "eighth",
  "sixteenth",
  "dotted",
] as const;
export type DurationType = (typeof DURATION_TYPES)[number];

/** 变音记号 */
export const ACCIDENTAL_TYPES = ["none", "sharp", "flat", "natural"] as const;
export type AccidentalType = (typeof ACCIDENTAL_TYPES)[number];

/** 谱号 */
export const CLEF_TYPES = ["treble", "bass", "alto"] as const;
export type ClefType = (typeof CLEF_TYPES)[number];

/** 谱面工具 */
export const SCORE_TOOLS = [
  "select",
  "eraser",
  "slur",
  "dynamics",
  "rest",
] as const;
export type ScoreToolType = (typeof SCORE_TOOLS)[number];

/** 力度档位（0-6 → pp..fff） */
export const VELOCITY_LABELS = ["pp", "p", "mp", "mf", "f", "ff", "fff"];

/** 流派选项（AI 生成表单） */
export const GENRE_OPTIONS = [
  { value: "pop", labelKey: "audio.genre.pop" },
  { value: "rock", labelKey: "audio.genre.rock" },
  { value: "jazz", labelKey: "audio.genre.jazz" },
  { value: "classical", labelKey: "audio.genre.classical" },
  { value: "electronic", labelKey: "audio.genre.electronic" },
  { value: "hiphop", labelKey: "audio.genre.hiphop" },
  { value: "rnb", labelKey: "audio.genre.rnb" },
  { value: "folk", labelKey: "audio.genre.folk" },
  { value: "country", labelKey: "audio.genre.country" },
  { value: "blues", labelKey: "audio.genre.blues" },
] as const;

/** 情绪选项 */
export const MOOD_OPTIONS = [
  { value: "cheerful", labelKey: "audio.mood.cheerful" },
  { value: "melancholy", labelKey: "audio.mood.melancholy" },
  { value: "passionate", labelKey: "audio.mood.passionate" },
  { value: "calm", labelKey: "audio.mood.calm" },
  { value: "romantic", labelKey: "audio.mood.romantic" },
  { value: "mysterious", labelKey: "audio.mood.mysterious" },
] as const;

/** 调式选项 */
export const KEY_OPTIONS = [
  "C Maj",
  "D Maj",
  "E Maj",
  "F Maj",
  "G Maj",
  "A Maj",
  "B Maj",
  "A Min",
  "D Min",
  "E Min",
] as const;

/** 拍号选项 */
export const TIME_SIG_OPTIONS = ["4/4", "3/4", "6/8"] as const;

/** AI 生成时长选项（秒） */
export const DURATION_OPTIONS = [
  { value: 30, labelKey: "audio.duration.30s" },
  { value: 60, labelKey: "audio.duration.60s" },
  { value: 120, labelKey: "audio.duration.120s" },
  { value: 300, labelKey: "audio.duration.300s" },
] as const;

/** AI 表单乐器选项 */
export const AI_INSTRUMENT_OPTIONS = [
  { value: "piano", labelKey: "audio.inst.piano" },
  { value: "drums", labelKey: "audio.inst.drums" },
  { value: "guitar", labelKey: "audio.inst.guitar" },
  { value: "bass", labelKey: "audio.inst.bass" },
  { value: "strings", labelKey: "audio.track.strings" },
  { value: "synth", labelKey: "audio.inst.synth" },
  { value: "vocals", labelKey: "audio.inst.vocals" },
] as const;

/** 默认音色参数（ADSR + 滤波 + 效果） */
export const DEFAULT_TONE_PARAMS: Audio.ToneParams = {
  octave: 0,
  fineTuning: 0,
  pitchBend: 3,
  attack: 10,
  decay: 500,
  sustain: 70,
  release: 300,
  cutoff: 8000,
  resonance: 20,
  reverb: 25,
  chorus: 10,
  delay: 0,
  pan: 0,
};

/** 默认插件参数（sdk.config.defaultParams） */
export const DEFAULT_PLUGIN_PARAMS = {
  bpm: 120,
  key: "C Maj",
  timeSignature: "4/4",
  instruments: ["piano", "drums"],
  mood: "cheerful",
};

/** 八度选项 */
export const OCTAVE_OPTIONS = [-2, -1, 0, 1, 2] as const;

/** 弯音范围选项（半音） */
export const PITCH_BEND_OPTIONS = [1, 2, 3, 6, 12] as const;

/** 内置预设（匹配设计稿 8 个预设按钮） */
export interface BuiltinPresetDef {
  id: string;
  nameKey: string;
  params: Audio.ToneParams;
}
export const BUILTIN_PRESETS: BuiltinPresetDef[] = [
  {
    id: "warmPiano",
    nameKey: "audio.preset.warmPiano",
    params: {
      ...DEFAULT_TONE_PARAMS,
      attack: 20,
      decay: 600,
      sustain: 80,
      release: 400,
      reverb: 35,
    },
  },
  {
    id: "brightEpiano",
    nameKey: "audio.preset.brightEpiano",
    params: {
      ...DEFAULT_TONE_PARAMS,
      attack: 5,
      decay: 300,
      sustain: 60,
      release: 200,
      cutoff: 12000,
    },
  },
  {
    id: "deepOrgan",
    nameKey: "audio.preset.deepOrgan",
    params: {
      ...DEFAULT_TONE_PARAMS,
      attack: 30,
      decay: 200,
      sustain: 90,
      release: 500,
      reverb: 40,
    },
  },
  {
    id: "softStrings",
    nameKey: "audio.preset.softStrings",
    params: {
      ...DEFAULT_TONE_PARAMS,
      attack: 80,
      decay: 800,
      sustain: 85,
      release: 600,
      reverb: 45,
      chorus: 20,
    },
  },
  {
    id: "crispGuitar",
    nameKey: "audio.preset.crispGuitar",
    params: {
      ...DEFAULT_TONE_PARAMS,
      attack: 8,
      decay: 400,
      sustain: 50,
      release: 250,
      cutoff: 10000,
    },
  },
  {
    id: "jazzBass",
    nameKey: "audio.preset.jazzBass",
    params: {
      ...DEFAULT_TONE_PARAMS,
      attack: 15,
      decay: 500,
      sustain: 65,
      release: 300,
      cutoff: 6000,
    },
  },
  {
    id: "cinematicBrass",
    nameKey: "audio.preset.cinematicBrass",
    params: {
      ...DEFAULT_TONE_PARAMS,
      attack: 60,
      decay: 700,
      sustain: 80,
      release: 500,
      reverb: 50,
      chorus: 15,
    },
  },
  {
    id: "electronicPulse",
    nameKey: "audio.preset.electronicPulse",
    params: {
      ...DEFAULT_TONE_PARAMS,
      attack: 2,
      decay: 150,
      sustain: 40,
      release: 100,
      cutoff: 15000,
      resonance: 40,
    },
  },
];
