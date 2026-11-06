import type { ClefType, AccidentalType } from "enums";

/** 五线谱几何常量（与设计稿一致） */
export const STAFF_LINE_GAP = 10;
export const STAFF_TOP_OFFSET = 4;
export const STAFF_HEIGHT = 48;
export const ROW_GAP = 24;
export const LINE_LEFT_PAD = 150;
export const MEASURE_WIDTH = 80;
export const HALF_STEP_PX = STAFF_LINE_GAP / 2;

/** 字母索引：C=0, D=1, E=2, F=3, G=4, A=5, B=6 */
const LETTER_SEMITONES = [0, 2, 4, 5, 7, 9, 11];

/** midi%12 → 字母索引（升号归到下方字母：C#→C, D#→D, F#→F, G#→G, A#→A） */
const PC_TO_LETTER = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];

export interface DiatonicInfo {
  letter: number;
  octave: number;
  /** 唱名阶序号 = octave * 7 + letter，每个谱位差 1 */
  diatonicNumber: number;
}

/** MIDI → 唱名阶信息 */
export const midiToDiatonic = (midi: number): DiatonicInfo => {
  const octave = Math.floor(midi / 12) - 1;
  const letter = PC_TO_LETTER[((midi % 12) + 12) % 12];
  return { letter, octave, diatonicNumber: octave * 7 + letter };
};

/** 各谱号最上一根谱线（第 5 线）对应的唱名阶序号 */
export const CLEF_TOP_DIATONIC: Record<ClefType, number> = {
  treble: 5 * 7 + 3, // F5
  bass: 3 * 7 + 5, // A3
  alto: 4 * 7 + 4, // G4
};

/** 唱名阶序号 → 自然音 MIDI（忽略升降号） */
export const diatonicToNaturalMidi = (diatonicNumber: number): number => {
  const octave = Math.floor(diatonicNumber / 7);
  const letter = ((diatonicNumber % 7) + 7) % 7;
  return (octave + 1) * 12 + LETTER_SEMITONES[letter];
};

/** 音符在 staff 内的 Y 偏移（相对 staff 顶部） */
export const pitchToY = (pitch: number, clef: ClefType): number => {
  const { diatonicNumber } = midiToDiatonic(pitch);
  const top = CLEF_TOP_DIATONIC[clef];
  return STAFF_TOP_OFFSET + (top - diatonicNumber) * HALF_STEP_PX;
};

/** Y 偏移 → 相对 staff 顶线的唱名阶差（正数=下方，负数=上方） */
export const yToDiatonicDelta = (y: number): number => {
  return Math.round((y - STAFF_TOP_OFFSET) / HALF_STEP_PX);
};

/** Y + 谱号 + 升降号 → 最终 MIDI 音高 */
export const yToPitch = (
  y: number,
  clef: ClefType,
  accidental: AccidentalType,
): number => {
  const delta = yToDiatonicDelta(y);
  const targetDiatonic = CLEF_TOP_DIATONIC[clef] - delta;
  let midi = diatonicToNaturalMidi(targetDiatonic);
  if (accidental === "sharp") midi += 1;
  else if (accidental === "flat") midi -= 1;
  return midi;
};

/** 相对顶线的唱名阶差 → 是否落在加线上 */
export const isOnLedgerLine = (delta: number): boolean => {
  // staff 谱线在 delta = 0,2,4,6,8
  // 上方加线 delta = -2,-4,...；下方加线 delta = 10,12,...
  if (delta < 0) return delta % 2 === 0;
  if (delta > 8) return delta % 2 === 0;
  return false;
};

/** 给定 delta，返回需要绘制的加线 delta 数组 */
export const diatonicDeltaToLedgerLines = (delta: number): number[] => {
  const lines: number[] = [];
  if (delta < 0) {
    for (let d = -2; d >= delta; d -= 2) lines.push(d);
  } else if (delta > 8) {
    for (let d = 10; d <= delta; d += 2) lines.push(d);
  }
  return lines;
};

/** delta → Y（用于加线绘制） */
export const diatonicDeltaToY = (delta: number): number => {
  return STAFF_TOP_OFFSET + delta * HALF_STEP_PX;
};

/** 是否应符干朝下（中线 B4 及以上，即 delta <= 4） */
export const stemGoesDown = (delta: number): boolean => delta <= 4;
