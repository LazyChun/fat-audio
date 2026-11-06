import { NOTE_PITCH_CLASSES } from "enums";

/** 音名 → MIDI（A4 = 440Hz = MIDI 69） */
export const noteToMidi = (note: string): number => {
  const match = note.match(/^([A-G])(#|b?)(-?\d+)$/);
  if (!match) return 60;
  const [, letter, accidental, octaveStr] = match;
  const octave = parseInt(octaveStr, 10);
  const semitoneOffsets: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  let midi = (octave + 1) * 12 + semitoneOffsets[letter];
  if (accidental === "#") midi += 1;
  if (accidental === "b") midi -= 1;
  return midi;
};

/** MIDI → 音名（如 60 → "C4"） */
export const midiToNote = (midi: number): string => {
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const octave = Math.floor(midi / 12) - 1;
  const name = names[midi % 12];
  return `${name}${octave}`;
};

/** MIDI → 频率（A4 = 440Hz） */
export const midiToFrequency = (midi: number): number => {
  return 440 * Math.pow(2, (midi - 69) / 12);
};

/** 取音级字母（C/D/E/F/G/A/B） */
export const pitchClassOf = (midi: number): string => {
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const name = names[midi % 12];
  return name[0];
};

/** 取音级颜色（用于谱面音符着色） */
export const pitchColor = (midi: number): string => {
  const pc = pitchClassOf(midi);
  return NOTE_PITCH_CLASSES[pc]?.color || "#6366f1";
};

/** 毫秒 → HH:MM:SS.mmm 格式（匹配设计稿 transport 时间显示） */
export const formatTime = (ms: number): string => {
  const totalMs = Math.max(0, Math.floor(ms));
  const hours = Math.floor(totalMs / 3600000);
  const minutes = Math.floor((totalMs % 3600000) / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  const millis = totalMs % 1000;
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(millis, 3)}`;
};

/** 秒 → m:ss 格式（用于 AI 片段时长） */
export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
};

/** volume (0-100) → dB 读数 */
export const volumeToDb = (volume: number): string => {
  if (volume <= 0) return "-∞";
  const db = 20 * Math.log10(volume / 100);
  return db.toFixed(1);
};

/** pan (-100..100) → 显示标签 */
export const panLabel = (pan: number): string => {
  if (pan === 0) return "C";
  if (pan < 0) return `L${Math.abs(pan)}`;
  return `R${pan}`;
};

/** 简易唯一 id（前端临时用，落库时后端会重新生成） */
export const genId = (): string => {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
};
