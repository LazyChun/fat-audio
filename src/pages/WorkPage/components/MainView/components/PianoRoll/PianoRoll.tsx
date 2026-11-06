import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  audioStore,
  editorStore,
  useAudioStore,
  useEditorStore,
  useTransportStore,
} from "reducers";
import { audioEngine, pitchColor, midiToNote } from "utils";
import { useI18n, usePlayback } from "hooks";
import styles from "./PianoRoll.less";

const KEYBOARD_WIDTH = 48;
const ROW_HEIGHT = 16;
const SEMITONES = 49;
const TOP_PITCH = 84;
const BASE_BEAT_WIDTH = 80;
const DRAG_THRESHOLD = 3;

const BLACK_KEYS = new Set([1, 3, 6, 8, 10]);

const isBlackKey = (midi: number) => BLACK_KEYS.has(midi % 12);
const isCNote = (midi: number) => midi % 12 === 0;

interface NoteDragState {
  noteId: string;
  origPitch: number;
  origStartBeat: number;
  origMouseClientX: number;
  origMouseClientY: number;
  moved: boolean;
}

const PianoRoll: React.FC = () => {
  const { currentProject } = useAudioStore();
  const { selectedTrackId, selectedNoteId, toneParams, selectedInstrumentId } =
    useEditorStore();
  const { positionMs, durationMs, zoom, snapEnabled } = useTransportStore();
  const { seek } = usePlayback();
  const { text } = useI18n();
  const gridRef = useRef<HTMLDivElement>(null);
  const rulerInnerRef = useRef<HTMLDivElement>(null);
  const rulerDraggingRef = useRef(false);
  const noteDragRef = useRef<NoteDragState | null>(null);

  const previewNote = (pitch: number) => {
    void audioEngine.resume().then(() => {
      audioEngine.playNote(pitch, 0.5, 80, toneParams, selectedInstrumentId);
    });
  };

  const beatWidth = BASE_BEAT_WIDTH * (zoom / 100);
  const beatsPerMeasure = 4;

  const tracks = currentProject?.tracks || [];
  const selectedTrack = tracks.find((t) => t.id === selectedTrackId);
  const notes = selectedTrack?.notes || [];
  const trackColor = selectedTrack?.colorVar || "var(--ams-brand-primary)";

  const keyRows = useMemo(() => {
    const rows: {
      midi: number;
      label: string;
      black: boolean;
      isC: boolean;
    }[] = [];
    for (let i = 0; i < SEMITONES; i++) {
      const midi = TOP_PITCH - i;
      rows.push({
        midi,
        label: isCNote(midi) ? midiToNote(midi) : "",
        black: isBlackKey(midi),
        isC: isCNote(midi),
      });
    }
    return rows;
  }, []);

  const measureCount = Math.max(
    4,
    Math.ceil(
      ((durationMs / 1000) * (currentProject?.bpm || 120)) /
        60 /
        beatsPerMeasure,
    ),
  );
  const gridWidth = measureCount * beatsPerMeasure * beatWidth;

  const snapBeat = useCallback(
    (beat: number) => {
      const snapped = snapEnabled
        ? Math.round(beat * 4) / 4
        : Math.round(beat * 8) / 8;
      return Math.max(0, snapped);
    },
    [snapEnabled],
  );

  const handleGridClick = (e: React.MouseEvent) => {
    if (noteDragRef.current?.moved) {
      noteDragRef.current = null;
      return;
    }
    noteDragRef.current = null;
    if (!selectedTrackId || !gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + gridRef.current.scrollLeft;
    const y = e.clientY - rect.top + gridRef.current.scrollTop;
    const rowIndex = Math.floor(y / ROW_HEIGHT);
    if (rowIndex < 0 || rowIndex >= SEMITONES) return;
    const pitch = TOP_PITCH - rowIndex;
    const startBeat = snapBeat(x / beatWidth);
    audioStore.addPianoRollNote(selectedTrackId, {
      pitch,
      startBeat,
      durationBeats: 1,
      velocity: 80,
    });
    previewNote(pitch);
  };

  const handleNoteMouseDown = (e: React.MouseEvent, note: Audio.Note) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    editorStore.selectNote(note.id);
    noteDragRef.current = {
      noteId: note.id,
      origPitch: note.pitch,
      origStartBeat: note.startBeat,
      origMouseClientX: e.clientX,
      origMouseClientY: e.clientY,
      moved: false,
    };
  };

  const handleNoteClick = (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    if (noteDragRef.current?.moved) {
      noteDragRef.current = null;
      return;
    }
    noteDragRef.current = null;
    editorStore.selectNote(noteId);
    const note = notes.find((n) => n.id === noteId);
    if (note) previewNote(note.pitch);
  };

  const playheadX = durationMs > 0 ? (positionMs / durationMs) * gridWidth : 0;

  const xToMs = useCallback(
    (clientX: number) => {
      const inner = rulerInnerRef.current;
      if (!inner || gridWidth <= 0) return 0;
      const rect = inner.getBoundingClientRect();
      const x = clientX - rect.left;
      return Math.max(0, Math.min((x / gridWidth) * durationMs, durationMs));
    },
    [gridWidth, durationMs],
  );

  const handleRulerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    rulerDraggingRef.current = true;
    seek(xToMs(e.clientX));
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (rulerDraggingRef.current) {
        seek(xToMs(e.clientX));
        return;
      }
      const drag = noteDragRef.current;
      if (!drag) return;
      const dx = e.clientX - drag.origMouseClientX;
      const dy = e.clientY - drag.origMouseClientY;
      if (!drag.moved) {
        if (Math.abs(dx) <= DRAG_THRESHOLD && Math.abs(dy) <= DRAG_THRESHOLD)
          return;
        drag.moved = true;
      }
      const pitchDelta = -Math.round(dy / ROW_HEIGHT);
      const newPitch = Math.max(0, Math.min(127, drag.origPitch + pitchDelta));
      let newStartBeat = drag.origStartBeat + dx / beatWidth;
      newStartBeat = snapBeat(newStartBeat);
      audioStore.updatePianoRollNote(drag.noteId, {
        pitch: newPitch,
        startBeat: newStartBeat,
      });
    };
    const onUp = () => {
      rulerDraggingRef.current = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [seek, xToMs, beatWidth, snapBeat]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (document.activeElement !== e.currentTarget) return;
    const key = e.key.toLowerCase();
    if (key === "delete" || key === "backspace") {
      if (selectedNoteId) {
        e.preventDefault();
        audioStore.deletePianoRollNote(selectedNoteId);
      }
      return;
    }
    if (selectedNoteId) {
      const note = notes.find((n) => n.id === selectedNoteId);
      if (!note) return;
      if (key === "arrowup") {
        e.preventDefault();
        const np = Math.min(127, note.pitch + 1);
        audioStore.updatePianoRollNote(note.id, { pitch: np });
        previewNote(np);
        return;
      }
      if (key === "arrowdown") {
        e.preventDefault();
        const np = Math.max(0, note.pitch - 1);
        audioStore.updatePianoRollNote(note.id, { pitch: np });
        previewNote(np);
        return;
      }
      if (key === "arrowleft") {
        e.preventDefault();
        audioStore.updatePianoRollNote(note.id, {
          startBeat: snapBeat(note.startBeat - 0.25),
        });
        return;
      }
      if (key === "arrowright") {
        e.preventDefault();
        audioStore.updatePianoRollNote(note.id, {
          startBeat: snapBeat(note.startBeat + 0.25),
        });
        return;
      }
    }
  };

  return (
    <div className={styles.roll}>
      <div className={styles.keyboard} style={{ width: KEYBOARD_WIDTH }}>
        {keyRows.map((r) => (
          <div
            key={r.midi}
            className={`${styles.key}${r.black ? ` ${styles.blackKey}` : ""}${r.isC ? ` ${styles.cKey}` : ""}`}
            style={{ height: ROW_HEIGHT }}
          >
            {r.label && <span className={styles.keyLabel}>{r.label}</span>}
          </div>
        ))}
      </div>
      <div className={styles.contentWrap}>
        <div className={styles.rulerRow}>
          <div
            ref={rulerInnerRef}
            className={styles.rulerInner}
            style={{ width: gridWidth }}
            onMouseDown={handleRulerMouseDown}
            title={text("audio.transport.rulerHint")}
          >
            {Array.from({ length: measureCount }, (_, i) => (
              <div
                key={i}
                className={styles.measureMark}
                style={{
                  left: i * beatsPerMeasure * beatWidth,
                  width: beatsPerMeasure * beatWidth,
                }}
              >
                <span className={styles.measureLabel}>{i + 1}</span>
              </div>
            ))}
            {durationMs > 0 && (
              <div className={styles.rulerPlayhead} style={{ left: playheadX }}>
                <div className={styles.rulerPlayheadHead} />
                <div className={styles.rulerPlayheadLine} />
              </div>
            )}
          </div>
        </div>
        <div
          ref={gridRef}
          className={styles.grid}
          style={{
            width: gridWidth,
            backgroundSize: `${beatWidth}px ${ROW_HEIGHT}px, ${beatWidth * beatsPerMeasure}px ${ROW_HEIGHT}px, ${beatWidth * beatsPerMeasure}px ${ROW_HEIGHT}px`,
          }}
          onClick={handleGridClick}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {notes.map((n) => {
            const rowIndex = TOP_PITCH - n.pitch;
            const left = n.startBeat * beatWidth;
            const width = n.durationBeats * beatWidth;
            const top = rowIndex * ROW_HEIGHT;
            const isSelected = n.id === selectedNoteId;
            return (
              <div
                key={n.id}
                className={`${styles.note}${isSelected ? ` ${styles.noteSelected}` : ""}`}
                style={{
                  left,
                  top,
                  width: Math.max(width - 1, 4),
                  height: ROW_HEIGHT - 2,
                  background: pitchColor(n.pitch),
                  borderColor: trackColor,
                }}
                onMouseDown={(e) => handleNoteMouseDown(e, n)}
                onClick={(e) => handleNoteClick(e, n.id)}
              />
            );
          })}
          {!selectedTrackId && (
            <div className={styles.hint}>
              {text("audio.pianoRoll.addNoteHint")}
            </div>
          )}
          {durationMs > 0 && (
            <div className={styles.playhead} style={{ left: playheadX }}>
              <div className={styles.playheadLine} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PianoRoll;
