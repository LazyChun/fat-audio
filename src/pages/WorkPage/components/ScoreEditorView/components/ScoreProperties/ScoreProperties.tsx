import React from "react";
import { Select } from "antd";
import { audioStore, useAudioStore, useEditorStore } from "reducers";
import { useI18n } from "hooks";
import { midiToNote } from "utils";
import {
  DURATION_TYPES,
  ACCIDENTAL_TYPES,
  VELOCITY_LABELS,
  type DurationType,
  type AccidentalType,
} from "enums";
import styles from "./ScoreProperties.less";

const DURATION_LABEL_KEYS: Record<DurationType, string> = {
  whole: "audio.score.properties.durationWhole",
  half: "audio.score.properties.durationHalf",
  quarter: "audio.score.properties.durationQuarter",
  eighth: "audio.score.properties.durationEighth",
  sixteenth: "audio.score.properties.durationSixteenth",
  dotted: "audio.score.properties.durationDotted",
};

const ACCIDENTAL_LABEL_KEYS: Record<AccidentalType, string> = {
  none: "audio.score.properties.accidentalNone",
  sharp: "audio.score.toolbar.sharp",
  flat: "audio.score.toolbar.flat",
  natural: "audio.score.toolbar.natural",
};

const ACCIDENTAL_SYMBOL: Record<AccidentalType, string> = {
  none: "",
  sharp: "\u266F",
  flat: "\u266D",
  natural: "\u266E",
};

const velocityToIndex = (velocity: number): number => {
  // 0-127 → 0-6
  return Math.max(0, Math.min(6, Math.round((velocity / 127) * 6)));
};

const ScoreProperties: React.FC = () => {
  const { text } = useI18n();
  const { currentProject } = useAudioStore();
  const { selectedScoreNoteId } = useEditorStore();

  const score = currentProject?.score;
  const note = score?.notes.find((n) => n.id === selectedScoreNoteId);

  if (!score || !note) {
    return (
      <div className={styles.panel}>
        <div className={styles.empty}>
          {text("audio.score.properties.noSelection")}
        </div>
      </div>
    );
  }

  const isRest = !!note.isRest;
  const velocityIdx = velocityToIndex(note.velocity);

  return (
    <div className={styles.panel}>
      {/* 音高 / 休止符标签 */}
      {isRest ? (
        <div className={styles.group}>
          <div className={styles.groupLabel}>
            {text("audio.score.properties.rest")}
          </div>
          <div className={styles.pitchRow}>
            <span className={styles.pitchPill}>
              {text("audio.score.properties.rest")}
            </span>
          </div>
        </div>
      ) : (
        <div className={styles.group}>
          <div className={styles.groupLabel}>
            {text("audio.score.properties.pitch")}
          </div>
          <div className={styles.pitchRow}>
            <button
              type="button"
              className={styles.arrowBtn}
              onClick={() =>
                audioStore.updateScoreNote(note.id, { pitch: note.pitch - 1 })
              }
            >
              -
            </button>
            <span className={styles.pitchPill}>{midiToNote(note.pitch)}</span>
            <button
              type="button"
              className={styles.arrowBtn}
              onClick={() =>
                audioStore.updateScoreNote(note.id, { pitch: note.pitch + 1 })
              }
            >
              +
            </button>
          </div>
        </div>
      )}

      <div className={styles.sep} />

      {/* 时值 */}
      <div className={styles.group}>
        <div className={styles.groupLabel}>
          {text("audio.score.properties.duration")}
        </div>
        <Select
          size="small"
          value={note.duration}
          onChange={(v: DurationType) =>
            audioStore.updateScoreNote(note.id, { duration: v })
          }
          style={{ width: 110 }}
          options={DURATION_TYPES.map((d) => ({
            value: d,
            label: text(DURATION_LABEL_KEYS[d]),
          }))}
        />
      </div>

      {!isRest && (
        <>
          <div className={styles.sep} />

          {/* 力度 */}
          <div className={styles.group}>
            <div className={styles.groupLabel}>
              {text("audio.score.properties.velocity")}
            </div>
            <div className={styles.velocityRow}>
              <span className={styles.velocityEnd}>pp</span>
              <input
                type="range"
                min={0}
                max={6}
                step={1}
                value={velocityIdx}
                className={styles.velocitySlider}
                onChange={(e) => {
                  const idx = Number(e.target.value);
                  const velocity = Math.round((idx / 6) * 127);
                  audioStore.updateScoreNote(note.id, { velocity });
                }}
              />
              <span className={styles.velocityEnd}>ff</span>
              <span className={styles.velocityValue}>
                {VELOCITY_LABELS[velocityIdx]}
              </span>
            </div>
          </div>

          <div className={styles.sep} />

          {/* 连音 */}
          <div className={styles.group}>
            <div className={styles.groupLabel}>
              {text("audio.score.properties.tie")}
            </div>
            <div className={styles.tieGroup}>
              <button
                type="button"
                className={`${styles.tieBtn}${!note.tie ? ` ${styles.tieActive}` : ""}`}
                onClick={() =>
                  audioStore.updateScoreNote(note.id, { tie: false })
                }
              >
                {text("audio.score.properties.tieOff")}
              </button>
              <button
                type="button"
                className={`${styles.tieBtn}${note.tie ? ` ${styles.tieActive}` : ""}`}
                onClick={() =>
                  audioStore.updateScoreNote(note.id, { tie: true })
                }
              >
                {text("audio.score.properties.tieOn")}
              </button>
            </div>
          </div>

          <div className={styles.sep} />

          {/* 变音记号 */}
          <div className={styles.group}>
            <div className={styles.groupLabel}>
              {text("audio.score.properties.accidental")}
            </div>
            <div className={styles.accGroup}>
              {ACCIDENTAL_TYPES.map((a) => {
                const isActive = note.accidental === a;
                return (
                  <button
                    key={a}
                    type="button"
                    className={`${styles.accBtn}${isActive ? ` ${styles.accActive}` : ""}`}
                    onClick={() =>
                      audioStore.updateScoreNote(note.id, { accidental: a })
                    }
                    title={text(ACCIDENTAL_LABEL_KEYS[a])}
                  >
                    {a === "none"
                      ? text(ACCIDENTAL_LABEL_KEYS[a])
                      : ACCIDENTAL_SYMBOL[a]}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ScoreProperties;
