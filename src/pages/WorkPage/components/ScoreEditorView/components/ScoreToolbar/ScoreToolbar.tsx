import React from "react";
import { InputNumber } from "antd";
import { audioStore, editorStore, useEditorStore } from "reducers";
import { useI18n } from "hooks";
import { Icon } from "components";
import {
  DURATION_TYPES,
  ACCIDENTAL_TYPES,
  SCORE_TOOLS,
  type DurationType,
  type AccidentalType,
  type ScoreToolType,
} from "enums";
import styles from "./ScoreToolbar.less";

const DURATION_ICONS: Record<DurationType, string> = {
  whole: "whole",
  half: "half",
  quarter: "quarter",
  eighth: "eighth",
  sixteenth: "sixteenth",
  dotted: "dotted",
};

const DURATION_LABELS: Record<DurationType, string> = {
  whole: "audio.score.toolbar.whole",
  half: "audio.score.toolbar.half",
  quarter: "audio.score.toolbar.quarter",
  eighth: "audio.score.toolbar.eighth",
  sixteenth: "audio.score.toolbar.sixteenth",
  dotted: "audio.score.toolbar.dotted",
};

const ACCIDENTAL_ICONS: Record<Exclude<AccidentalType, "none">, string> = {
  sharp: "sharp",
  flat: "flat",
  natural: "natural",
};

const ACCIDENTAL_LABELS: Record<AccidentalType, string> = {
  none: "audio.score.properties.accidentalNone",
  sharp: "audio.score.toolbar.sharp",
  flat: "audio.score.toolbar.flat",
  natural: "audio.score.toolbar.natural",
};

const TOOL_ICONS: Record<ScoreToolType, string> = {
  select: "select",
  eraser: "eraser",
  slur: "slur",
  dynamics: "dynamics",
  rest: "rest",
};

const TOOL_LABELS: Record<ScoreToolType, string> = {
  select: "audio.score.toolbar.select",
  eraser: "audio.score.toolbar.eraser",
  slur: "audio.score.toolbar.slur",
  dynamics: "audio.score.toolbar.dynamics",
  rest: "audio.score.toolbar.rest",
};

const ScoreToolbar: React.FC = () => {
  const { text } = useI18n();
  const { scoreTool, inputOctave, selectedScoreNoteId } = useEditorStore();

  return (
    <div className={styles.toolbar}>
      {/* 左：时值组 */}
      <div className={styles.group}>
        {DURATION_TYPES.map((d) => {
          const isActive = scoreTool.duration === d;
          return (
            <button
              key={d}
              type="button"
              className={`${styles.btn}${isActive ? ` ${styles.active}` : ""}`}
              onClick={() => {
                editorStore.setScoreDuration(d);
                if (selectedScoreNoteId) {
                  audioStore.updateScoreNote(selectedScoreNoteId, {
                    duration: d,
                  });
                }
              }}
              title={text(DURATION_LABELS[d])}
            >
              <Icon name={DURATION_ICONS[d]} size={14} />
              <span className={styles.label}>{text(DURATION_LABELS[d])}</span>
            </button>
          );
        })}
      </div>

      {/* 中：变音组 */}
      <div className={styles.group}>
        {ACCIDENTAL_TYPES.map((a) => {
          const isActive = scoreTool.accidental === a;
          return (
            <button
              key={a}
              type="button"
              className={`${styles.btn}${isActive ? ` ${styles.active}` : ""}`}
              onClick={() => editorStore.setScoreAccidental(a)}
              title={text(ACCIDENTAL_LABELS[a])}
            >
              {a === "none" ? (
                <span className={styles.label}>
                  {text(ACCIDENTAL_LABELS[a])}
                </span>
              ) : (
                <Icon name={ACCIDENTAL_ICONS[a]} size={14} />
              )}
            </button>
          );
        })}
      </div>

      {/* 右：工具组 */}
      <div className={styles.group}>
        {SCORE_TOOLS.map((t) => {
          const isActive = scoreTool.tool === t;
          return (
            <button
              key={t}
              type="button"
              className={`${styles.btn}${isActive ? ` ${styles.active}` : ""}`}
              onClick={() => editorStore.setScoreTool(t)}
              title={text(TOOL_LABELS[t])}
            >
              <Icon name={TOOL_ICONS[t]} size={14} />
              <span className={styles.label}>{text(TOOL_LABELS[t])}</span>
            </button>
          );
        })}
        <div
          className={styles.octaveGroup}
          title={text("audio.score.toolbar.octave")}
        >
          <span className={styles.octaveLabel}>
            {text("audio.score.toolbar.octave")}
          </span>
          <InputNumber
            size="small"
            min={0}
            max={7}
            value={inputOctave}
            onChange={(v) => v != null && editorStore.setInputOctave(v)}
            style={{ width: 56 }}
          />
        </div>
      </div>
    </div>
  );
};

export default ScoreToolbar;
