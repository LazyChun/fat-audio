import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  audioStore,
  editorStore,
  useAudioStore,
  useEditorStore,
  useTransportStore,
} from "reducers";
import { useI18n } from "hooks";
import { audioEngine, pitchColor, midiToNote } from "utils";
import {
  STAFF_LINE_GAP,
  STAFF_TOP_OFFSET,
  STAFF_HEIGHT,
  ROW_GAP,
  LINE_LEFT_PAD,
  MEASURE_WIDTH,
  HALF_STEP_PX,
  CLEF_TOP_DIATONIC,
  midiToDiatonic,
  pitchToY,
  yToPitch,
  yToDiatonicDelta,
  diatonicDeltaToLedgerLines,
  diatonicDeltaToY,
  stemGoesDown,
} from "utils";
import type { ClefType, DurationType, ScoreToolType } from "enums";
import { DURATION_TYPES, VELOCITY_LABELS } from "enums";
import styles from "./ScoreCanvas.less";

const CLEF_SYMBOL: Record<ClefType, string> = {
  treble: "\uD834\uDD1E", // 𝄞
  bass: "\uD834\uDD22", // 𝄢
  alto: "\uD834\uDD21", // 𝄡
};

const REST_SYMBOL: Record<DurationType, string> = {
  whole: "\uD834\uDD3B",
  half: "\uD834\uDD3C",
  quarter: "\uD834\uDD3D",
  eighth: "\uD834\uDD3E",
  sixteenth: "\uD834\uDD3F",
  dotted: "\uD834\uDD3D",
};

const accidentalSymbol = (acc: string): string => {
  if (acc === "sharp") return "\u266F";
  if (acc === "flat") return "\u266D";
  if (acc === "natural") return "\u266E";
  return "";
};

const DURATION_BEATS: Record<DurationType, number> = {
  whole: 4,
  half: 2,
  quarter: 1,
  eighth: 0.5,
  sixteenth: 0.25,
  dotted: 1.5,
};

const LETTER_TO_INDEX: Record<string, number> = {
  c: 0,
  d: 1,
  e: 2,
  f: 3,
  g: 4,
  a: 5,
  b: 6,
};
const LETTER_SEMITONES = [0, 2, 4, 5, 7, 9, 11];

const velocityToIndex = (velocity: number): number =>
  Math.max(0, Math.min(6, Math.round((velocity / 127) * 6)));

interface StaffRow {
  rowIndex: number;
  startMeasure: number;
  endMeasure: number;
  measureCount: number;
}

interface DragState {
  noteId: string;
  origPitch: number;
  origMeasure: number;
  origBeat: number;
  deltaY: number;
  deltaX: number;
  origRowIndex: number;
  origYInRow: number;
  origXInRow: number;
  origMouseClientX: number;
  origMouseClientY: number;
  moved: boolean;
}

interface DragPreview {
  noteId: string;
  deltaX: number;
  deltaY: number;
}

const ScoreCanvas: React.FC = () => {
  const { text } = useI18n();
  const { currentProject, scorePast, scoreFuture } = useAudioStore();
  const {
    selectedScoreNoteId,
    scoreTool,
    toneParams,
    selectedInstrumentId,
    inputOctave,
  } = useEditorStore();
  const { positionMs, bpm, snapEnabled } = useTransportStore();
  const canvasRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const justDraggedRef = useRef(false);
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);

  const score = currentProject?.score;

  const rows: StaffRow[] = useMemo(() => {
    if (!score) return [];
    const total = Math.max(1, score.measures);
    const perLine = Math.max(1, score.measuresPerLine);
    const result: StaffRow[] = [];
    for (let i = 0; i < total; i += perLine) {
      const end = Math.min(i + perLine, total);
      result.push({
        rowIndex: result.length,
        startMeasure: i,
        endMeasure: end,
        measureCount: end - i,
      });
    }
    return result;
  }, [score]);

  const beatsPerMeasure = score
    ? parseInt(score.timeSignature.split("/")[0], 10) || 4
    : 4;

  const previewNote = (pitch: number) => {
    void audioEngine.resume().then(() => {
      audioEngine.playNote(
        pitch,
        0.6,
        80,
        toneParams,
        score?.instrument || selectedInstrumentId,
      );
    });
  };

  // ── 拖拽：window 监听（挂载一次，通过 ref 读取最新值） ────────
  const ctxRef = useRef({ rows, beatsPerMeasure, snapEnabled, score });
  ctxRef.current = { rows, beatsPerMeasure, snapEnabled, score };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dx = e.clientX - drag.origMouseClientX;
      const dy = e.clientY - drag.origMouseClientY;
      if (!drag.moved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
        drag.moved = true;
      }
      drag.deltaX = dx;
      drag.deltaY = dy;
      if (drag.moved) {
        setDragPreview({ noteId: drag.noteId, deltaX: dx, deltaY: dy });
      }
    };
    const onUp = () => {
      const drag = dragRef.current;
      dragRef.current = null;
      if (drag?.moved) justDraggedRef.current = true;
      setDragPreview(null);
      if (!drag || !drag.moved) return;

      const {
        rows: curRows,
        beatsPerMeasure: curBpm,
        snapEnabled: curSnap,
        score: curScore,
      } = ctxRef.current;
      if (!curScore) return;

      const rowHeight = STAFF_HEIGHT + ROW_GAP;
      // Compute the note's new position in inner-content coordinates purely
      // from the original CSS position + mouse delta (screen px == CSS px,
      // no zoom). origXInRow already includes LINE_LEFT_PAD (from noteXInRow),
      // so it IS the note's X relative to the staffRow's left edge, which
      // equals the X in inner-content coordinates (staffRow left = 0).
      const newXContent = drag.origXInRow + drag.deltaX;
      const newYContent =
        drag.origRowIndex * rowHeight + drag.origYInRow + drag.deltaY;

      // Determine target row from new Y (allows cross-row drag)
      const rowIndex = Math.floor(newYContent / rowHeight);
      const row = curRows[rowIndex];
      const yInRow = newYContent - rowIndex * rowHeight;

      const clef = curScore.clef;
      const newPitch = yToPitch(yInRow, clef, "none");

      // xInRow within the measure area (exclude LINE_LEFT_PAD)
      const xInRow = newXContent - LINE_LEFT_PAD;
      let newMeasure = drag.origMeasure;
      let newBeat = drag.origBeat;
      if (xInRow >= 0 && row) {
        const measureInRow = Math.floor(xInRow / MEASURE_WIDTH);
        if (measureInRow >= 0 && measureInRow < row.measureCount) {
          newMeasure = row.startMeasure + measureInRow;
          const beatFrac = ((xInRow % MEASURE_WIDTH) / MEASURE_WIDTH) * curBpm;
          newBeat = curSnap
            ? Math.round(beatFrac * 4) / 4
            : Math.round(beatFrac * 8) / 8;
          newBeat = Math.max(0, Math.min(curBpm - 0.25, newBeat));
        }
      }
      audioStore.updateScoreNote(drag.noteId, {
        pitch: newPitch,
        measure: newMeasure,
        beat: newBeat,
      });
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  if (!score) return null;

  const clef = score.clef;
  const topDiatonic = CLEF_TOP_DIATONIC[clef];

  const noteYOnStaff = (pitch: number): number => pitchToY(pitch, clef);

  const noteXInRow = (measure: number, beat: number, row: StaffRow): number => {
    const measureInRow = measure - row.startMeasure;
    if (measureInRow < 0 || measureInRow >= row.measureCount) return -1;
    const beatOffset = (beat / beatsPerMeasure) * MEASURE_WIDTH;
    return LINE_LEFT_PAD + measureInRow * MEASURE_WIDTH + beatOffset;
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!canvasRef.current || !innerRef.current) return;
    if (justDraggedRef.current) {
      justDraggedRef.current = false;
      return;
    }
    if (
      scoreTool.tool === "eraser" ||
      scoreTool.tool === "slur" ||
      scoreTool.tool === "dynamics"
    )
      return;
    const rect = canvasRef.current.getBoundingClientRect();
    // .inner has padding (32px top, 24px left); staffRows start after it.
    // Subtract padding so coordinates are relative to the first staffRow's origin.
    const innerStyle = getComputedStyle(innerRef.current);
    const innerPadLeft = parseFloat(innerStyle.paddingLeft) || 0;
    const innerPadTop = parseFloat(innerStyle.paddingTop) || 0;
    const x =
      e.clientX - rect.left + canvasRef.current.scrollLeft - innerPadLeft;
    const y = e.clientY - rect.top + canvasRef.current.scrollTop - innerPadTop;

    const rowHeight = STAFF_HEIGHT + ROW_GAP;
    const rowIndex = Math.floor(y / rowHeight);
    const row = rows[rowIndex];
    if (!row) return;

    const yInRow = y - rowIndex * rowHeight;

    if (scoreTool.tool === "rest") {
      const xInRow = x - LINE_LEFT_PAD;
      if (xInRow < 0) return;
      const measureInRow = Math.floor(xInRow / MEASURE_WIDTH);
      if (measureInRow < 0 || measureInRow >= row.measureCount) return;
      const measure = row.startMeasure + measureInRow;
      let beat = ((xInRow % MEASURE_WIDTH) / MEASURE_WIDTH) * beatsPerMeasure;
      beat = snapEnabled ? Math.round(beat * 4) / 4 : Math.round(beat * 8) / 8;
      beat = Math.max(0, Math.min(beatsPerMeasure - 0.25, beat));
      audioStore.addScoreNote({
        pitch: 0,
        measure,
        beat,
        duration: scoreTool.duration,
        accidental: "none",
        velocity: 80,
        tie: false,
        isRest: true,
      });
      return;
    }

    // select / 默认 → 添加音符
    const pitch = yToPitch(yInRow, clef, scoreTool.accidental);
    const xInRow = x - LINE_LEFT_PAD;
    if (xInRow < 0) return;
    const measureInRow = Math.floor(xInRow / MEASURE_WIDTH);
    if (measureInRow < 0 || measureInRow >= row.measureCount) return;
    const measure = row.startMeasure + measureInRow;
    let beat = ((xInRow % MEASURE_WIDTH) / MEASURE_WIDTH) * beatsPerMeasure;
    beat = snapEnabled ? Math.round(beat * 4) / 4 : Math.round(beat * 8) / 8;
    beat = Math.max(0, Math.min(beatsPerMeasure - 0.25, beat));

    audioStore.addScoreNote({
      pitch,
      measure,
      beat,
      duration: scoreTool.duration,
      accidental: scoreTool.accidental,
      velocity: 80,
      tie: false,
    });
    previewNote(pitch);
  };

  const handleNoteMouseDown = (
    e: React.MouseEvent,
    noteId: string,
    rowIndex: number,
    yInRow: number,
    xInRow: number,
  ) => {
    if (scoreTool.tool !== "select") return;
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    const note = score.notes.find((n) => n.id === noteId);
    if (!note || note.isRest) return;
    editorStore.selectScoreNote(noteId);
    dragRef.current = {
      noteId,
      origPitch: note.pitch,
      origMeasure: note.measure,
      origBeat: note.beat,
      deltaY: 0,
      deltaX: 0,
      origRowIndex: rowIndex,
      origYInRow: yInRow,
      origXInRow: xInRow,
      origMouseClientX: e.clientX,
      origMouseClientY: e.clientY,
      moved: false,
    };
  };

  const handleNoteClick = (
    e: React.MouseEvent,
    noteId: string,
    pitch: number,
    isRest: boolean,
  ) => {
    e.stopPropagation();
    if (justDraggedRef.current) {
      justDraggedRef.current = false;
      return;
    }
    if (scoreTool.tool === "eraser") {
      audioStore.deleteScoreNote(noteId);
      return;
    }
    if (scoreTool.tool === "slur") {
      const note = score.notes.find((n) => n.id === noteId);
      if (note) audioStore.updateScoreNote(noteId, { tie: !note.tie });
      return;
    }
    if (scoreTool.tool === "dynamics") {
      const note = score.notes.find((n) => n.id === noteId);
      if (!note || note.isRest) return;
      const idx = velocityToIndex(note.velocity);
      const next = (idx + 1) % VELOCITY_LABELS.length;
      const velocity = Math.round((next / 6) * 127);
      audioStore.updateScoreNote(noteId, { velocity });
      return;
    }
    editorStore.selectScoreNote(noteId);
    if (!isRest) previewNote(pitch);
  };

  // ── 键盘输入 ────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (document.activeElement !== e.currentTarget) return;
    const key = e.key.toLowerCase();

    // undo / redo
    if ((e.ctrlKey || e.metaKey) && key === "z") {
      e.preventDefault();
      if (e.shiftKey) audioStore.redoScore();
      else audioStore.undoScore();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && key === "y") {
      e.preventDefault();
      audioStore.redoScore();
      return;
    }

    // 1-6 → 时值
    if (["1", "2", "3", "4", "5", "6"].includes(key)) {
      e.preventDefault();
      const idx = parseInt(key, 10) - 1;
      if (idx >= 0 && idx < DURATION_TYPES.length) {
        const d = DURATION_TYPES[idx];
        editorStore.setScoreDuration(d);
        if (selectedScoreNoteId) {
          audioStore.updateScoreNote(selectedScoreNoteId, { duration: d });
        }
      }
      return;
    }

    // Delete / Backspace → 删除选中
    if (key === "delete" || key === "backspace") {
      if (selectedScoreNoteId) {
        e.preventDefault();
        audioStore.deleteScoreNote(selectedScoreNoteId);
      }
      return;
    }

    // 方向键 → 移动选中音符
    if (selectedScoreNoteId) {
      const note = score.notes.find((n) => n.id === selectedScoreNoteId);
      if (note) {
        if (key === "arrowup") {
          e.preventDefault();
          const { diatonicNumber } = midiToDiatonic(note.pitch);
          const next = diatonicNumber + 1;
          const newPitch = Math.round(
            (Math.floor(next / 7) + 1) * 12 +
              LETTER_SEMITONES[((next % 7) + 7) % 7],
          );
          audioStore.updateScoreNote(note.id, { pitch: newPitch });
          if (!note.isRest) previewNote(newPitch);
          return;
        }
        if (key === "arrowdown") {
          e.preventDefault();
          const { diatonicNumber } = midiToDiatonic(note.pitch);
          const next = diatonicNumber - 1;
          const newPitch = Math.round(
            (Math.floor(next / 7) + 1) * 12 +
              LETTER_SEMITONES[((next % 7) + 7) % 7],
          );
          audioStore.updateScoreNote(note.id, { pitch: newPitch });
          if (!note.isRest) previewNote(newPitch);
          return;
        }
        if (key === "arrowleft") {
          e.preventDefault();
          let nb = note.beat - 0.25;
          let nm = note.measure;
          if (nb < 0) {
            nm = Math.max(0, nm - 1);
            nb = beatsPerMeasure - 0.25;
          }
          audioStore.updateScoreNote(note.id, { beat: nb, measure: nm });
          return;
        }
        if (key === "arrowright") {
          e.preventDefault();
          let nb = note.beat + 0.25;
          let nm = note.measure;
          if (nb >= beatsPerMeasure) {
            nm = nm + 1;
            nb = 0;
          }
          if (nm >= score.measures) nm = score.measures - 1;
          audioStore.updateScoreNote(note.id, { beat: nb, measure: nm });
          return;
        }
      }
    }

    // A-G → 输入音符
    if (LETTER_TO_INDEX[key] !== undefined) {
      e.preventDefault();
      const letterIdx = LETTER_TO_INDEX[key];
      let pitch = (inputOctave + 1) * 12 + LETTER_SEMITONES[letterIdx];
      if (scoreTool.accidental === "sharp") pitch += 1;
      else if (scoreTool.accidental === "flat") pitch -= 1;

      // 决定放置位置：选中音符之后，否则第 1 小节第 1 拍
      let measure = 0;
      let beat = 0;
      const sel = score.notes.find((n) => n.id === selectedScoreNoteId);
      if (sel) {
        const dur = DURATION_BEATS[sel.duration] ?? 1;
        let totalBeat = sel.measure * beatsPerMeasure + sel.beat + dur;
        measure = Math.floor(totalBeat / beatsPerMeasure);
        beat = totalBeat % beatsPerMeasure;
        if (measure >= score.measures) {
          measure = score.measures - 1;
          beat = Math.max(0, beatsPerMeasure - 0.5);
        }
      }
      audioStore.addScoreNote({
        pitch,
        measure,
        beat,
        duration: scoreTool.duration,
        accidental: scoreTool.accidental,
        velocity: 80,
        tie: false,
      });
      previewNote(pitch);
      return;
    }
  };

  // ── 播放游标：positionMs → 当前 row + x ────────────────────
  // 注意：positionMs 由 setInterval 推进，与 AudioContext.currentTime 可能漂移
  const cursorInfo = useMemo(() => {
    if (!score || bpm <= 0) return null;
    const beat = (positionMs / 1000) * (bpm / 60);
    const measure = Math.floor(beat / beatsPerMeasure);
    const beatInMeasure = beat % beatsPerMeasure;
    const row = rows.find(
      (r) => measure >= r.startMeasure && measure < r.endMeasure,
    );
    if (!row) return null;
    const measureInRow = measure - row.startMeasure;
    const x =
      LINE_LEFT_PAD +
      measureInRow * MEASURE_WIDTH +
      (beatInMeasure / beatsPerMeasure) * MEASURE_WIDTH;
    return { rowIndex: row.rowIndex, x };
  }, [positionMs, bpm, beatsPerMeasure, rows, score]);

  return (
    <div
      className={styles.canvas}
      ref={canvasRef}
      tabIndex={0}
      onClick={handleCanvasClick}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.inner} ref={innerRef}>
        {rows.map((row) => (
          <div key={row.rowIndex} className={styles.staffRow}>
            {/* 五线谱 5 条横线 */}
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                className={styles.staffLine}
                style={{ top: STAFF_TOP_OFFSET + i * STAFF_LINE_GAP }}
              />
            ))}

            {/* 谱号 */}
            <div className={styles.clef}>{CLEF_SYMBOL[clef]}</div>

            {/* 拍号 */}
            <div className={styles.timeSig}>
              <div>{score.timeSignature.split("/")[0]}</div>
              <div>{score.timeSignature.split("/")[1]}</div>
            </div>

            {/* 小节线 */}
            {Array.from({ length: row.measureCount + 1 }, (_, i) => (
              <div
                key={i}
                className={styles.barLine}
                style={{
                  left: LINE_LEFT_PAD + i * MEASURE_WIDTH - 0.5,
                  height: STAFF_HEIGHT - STAFF_TOP_OFFSET,
                }}
              />
            ))}

            {/* 小节号 */}
            {Array.from({ length: row.measureCount }, (_, i) => (
              <div
                key={`m-${i}`}
                className={styles.measureLabel}
                style={{ left: LINE_LEFT_PAD + i * MEASURE_WIDTH }}
              >
                {row.startMeasure + i + 1}
              </div>
            ))}

            {/* 音符 + 加线 + 连音弧线 */}
            {score.notes
              .filter(
                (n) =>
                  n.measure >= row.startMeasure && n.measure < row.endMeasure,
              )
              .map((n) => {
                const xInRow = noteXInRow(n.measure, n.beat, row);
                if (xInRow < 0) return null;
                const isDragging = dragPreview?.noteId === n.id;
                const previewDx = isDragging ? dragPreview!.deltaX : 0;
                const previewDy = isDragging ? dragPreview!.deltaY : 0;
                const yOnStaff =
                  (n.isRest
                    ? STAFF_TOP_OFFSET + 4 * HALF_STEP_PX
                    : noteYOnStaff(n.pitch)) + previewDy;
                const x = xInRow + previewDx;
                const color = n.isRest
                  ? "var(--ams-text-secondary)"
                  : pitchColor(n.pitch);
                const isWholeOrHalf =
                  n.duration === "whole" || n.duration === "half";
                const isSelected = selectedScoreNoteId === n.id;
                const acc = n.isRest ? "" : accidentalSymbol(n.accidental);

                // 加线
                let ledgerDeltas: number[] = [];
                if (!n.isRest) {
                  const delta =
                    topDiatonic - midiToDiatonic(n.pitch).diatonicNumber;
                  ledgerDeltas = diatonicDeltaToLedgerLines(delta);
                }

                // 符干方向
                const delta = n.isRest
                  ? 4
                  : topDiatonic - midiToDiatonic(n.pitch).diatonicNumber;
                const stemDown = stemGoesDown(delta);

                return (
                  <div
                    key={n.id}
                    className={`${styles.noteWrap}${isSelected ? ` ${styles.noteSelected}` : ""}${isDragging ? ` ${styles.dragging}` : ""}${scoreTool.tool === "eraser" ? ` ${styles.eraserHover}` : ""}`}
                    style={{ left: x, top: yOnStaff }}
                    onMouseDown={(e) =>
                      handleNoteMouseDown(
                        e,
                        n.id,
                        row.rowIndex,
                        yOnStaff,
                        xInRow,
                      )
                    }
                    onClick={(e) =>
                      handleNoteClick(e, n.id, n.pitch, !!n.isRest)
                    }
                  >
                    {ledgerDeltas.map((d) => (
                      <div
                        key={d}
                        className={styles.ledgerLine}
                        style={{
                          top: diatonicDeltaToY(d) - yOnStaff,
                        }}
                      />
                    ))}
                    {acc && (
                      <span className={styles.accidental} style={{ color }}>
                        {acc}
                      </span>
                    )}
                    {n.isRest ? (
                      <span className={styles.rest} style={{ color }}>
                        {REST_SYMBOL[n.duration]}
                      </span>
                    ) : (
                      <>
                        <div
                          className={styles.noteHead}
                          style={
                            isWholeOrHalf
                              ? {
                                  borderColor: color,
                                  background: "transparent",
                                }
                              : { background: color, borderColor: color }
                          }
                        />
                        <div
                          className={styles.stem}
                          style={
                            stemDown
                              ? {
                                  background: color,
                                  top: 4,
                                  height: 22,
                                }
                              : {
                                  background: color,
                                  top: -22,
                                  height: 22,
                                }
                          }
                        />
                        {(n.duration === "eighth" ||
                          n.duration === "sixteenth") && (
                          <svg
                            className={styles.flagLayer}
                            width="10"
                            height="14"
                            style={{
                              left: 9,
                              top: stemDown ? 26 : -22,
                            }}
                          >
                            <path
                              d={
                                stemDown
                                  ? "M 1 0 Q 7 -3 4 -9"
                                  : "M 1 0 Q 7 3 4 9"
                              }
                              stroke={color}
                              strokeWidth={2.5}
                              fill="none"
                              strokeLinecap="round"
                            />
                            {n.duration === "sixteenth" && (
                              <path
                                d={
                                  stemDown
                                    ? "M 1 -5 Q 6 -7 4 -12"
                                    : "M 1 5 Q 6 7 4 12"
                                }
                                stroke={color}
                                strokeWidth={2.5}
                                fill="none"
                                strokeLinecap="round"
                              />
                            )}
                          </svg>
                        )}
                        {n.duration === "dotted" && (
                          <div
                            className={styles.augDot}
                            style={{ background: color }}
                          />
                        )}
                      </>
                    )}
                    {score.displayPrefs.showNoteNames && !n.isRest && (
                      <span className={styles.noteName}>
                        {midiToNote(n.pitch)}
                      </span>
                    )}
                    {score.displayPrefs.showDynamics && !n.isRest && (
                      <span className={styles.dynamics}>
                        {VELOCITY_LABELS[velocityToIndex(n.velocity)]}
                      </span>
                    )}
                  </div>
                );
              })}

            {/* 连音弧线（tie） */}
            <svg
              className={styles.slurLayer}
              width={LINE_LEFT_PAD + row.measureCount * MEASURE_WIDTH + 40}
              height={STAFF_HEIGHT + ROW_GAP}
            >
              {score.notes
                .filter(
                  (n) =>
                    n.tie &&
                    n.measure >= row.startMeasure &&
                    n.measure < row.endMeasure,
                )
                .map((n) => {
                  const x1 = noteXInRow(n.measure, n.beat, row);
                  const y1 = n.isRest
                    ? STAFF_TOP_OFFSET + 4 * HALF_STEP_PX
                    : noteYOnStaff(n.pitch);
                  const next = score.notes
                    .filter((m) => !m.isRest)
                    .sort(
                      (a, b) =>
                        a.measure * beatsPerMeasure +
                        a.beat -
                        b.measure * beatsPerMeasure -
                        b.beat,
                    )
                    .find(
                      (m) =>
                        m.measure * beatsPerMeasure + m.beat >
                        n.measure * beatsPerMeasure + n.beat,
                    );
                  if (!next) return null;
                  if (
                    next.measure < row.startMeasure ||
                    next.measure >= row.endMeasure
                  )
                    return null;
                  const x2 = noteXInRow(next.measure, next.beat, row);
                  const y2 = noteYOnStaff(next.pitch);
                  const midX = (x1 + x2) / 2;
                  const midY = Math.min(y1, y2) - 14;
                  return (
                    <path
                      key={`slur-${n.id}`}
                      d={`M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`}
                      stroke="var(--ams-text-secondary)"
                      strokeWidth={1.2}
                      fill="none"
                    />
                  );
                })}
            </svg>

            {/* 播放游标（仅当前行） */}
            {cursorInfo && cursorInfo.rowIndex === row.rowIndex && (
              <div className={styles.cursor} style={{ left: cursorInfo.x }}>
                <div className={styles.cursorDot} />
                <div className={styles.cursorLine} />
              </div>
            )}
          </div>
        ))}

        <div className={styles.hint}>{text("audio.score.canvasHint")}</div>
        <div className={styles.keyboardHint}>
          {text("audio.score.keyboard.hint")}
        </div>
      </div>
    </div>
  );
};

export default ScoreCanvas;
