import React from "react";
import { Select, InputNumber, Switch } from "antd";
import { audioStore, useAudioStore } from "reducers";
import { useI18n } from "hooks";
import {
  INSTRUMENT_LIBRARY,
  KEY_OPTIONS,
  TIME_SIG_OPTIONS,
  CLEF_TYPES,
  type ClefType,
} from "enums";
import styles from "./ScoreControls.less";

const ScoreControls: React.FC = () => {
  const { text } = useI18n();
  const { currentProject } = useAudioStore();
  const score = currentProject?.score;

  if (!score) return null;

  const updateClef = (clef: ClefType) => audioStore.updateScore({ clef });
  const updateDisplayPref = (field: "showNoteNames" | "showFingering" | "showDynamics", value: boolean) => {
    audioStore.updateScore({
      displayPrefs: { ...score.displayPrefs, [field]: value },
    });
  };

  return (
    <div className={styles.panel}>
      <div className={styles.field}>
        <div className={styles.fieldLabel}>{text("audio.score.controls.instrument")}</div>
        <Select
          size="small"
          value={score.instrument}
          onChange={(v) => audioStore.updateScore({ instrument: v })}
          style={{ width: "100%" }}
          options={INSTRUMENT_LIBRARY.map((inst) => ({
            value: inst.id,
            label: text(inst.nameKey),
          }))}
        />
      </div>

      <div className={styles.sep} />

      <div className={styles.field}>
        <div className={styles.fieldLabel}>{text("audio.score.controls.keySignature")}</div>
        <Select
          size="small"
          value={score.keySignature}
          onChange={(v) => audioStore.updateScore({ keySignature: v })}
          style={{ width: "100%" }}
          options={KEY_OPTIONS.map((k) => ({ value: k, label: k }))}
        />
      </div>

      <div className={styles.field}>
        <div className={styles.fieldLabel}>{text("audio.score.controls.timeSignature")}</div>
        <Select
          size="small"
          value={score.timeSignature}
          onChange={(v) => audioStore.updateScore({ timeSignature: v })}
          style={{ width: "100%" }}
          options={TIME_SIG_OPTIONS.map((t) => ({ value: t, label: t }))}
        />
      </div>

      <div className={styles.sep} />

      <div className={styles.field}>
        <div className={styles.fieldLabel}>{text("audio.score.controls.clef")}</div>
        <div className={styles.clefGroup}>
          {CLEF_TYPES.map((c) => {
            const isActive = score.clef === c;
            const labelKey = `audio.score.controls.clef${c.charAt(0).toUpperCase()}${c.slice(1)}`;
            return (
              <button
                key={c}
                type="button"
                className={`${styles.clefBtn}${isActive ? ` ${styles.clefActive}` : ""}`}
                onClick={() => updateClef(c)}
              >
                {text(labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.sep} />

      <div className={styles.field}>
        <div className={styles.fieldLabel}>{text("audio.score.controls.measures")}</div>
        <InputNumber
          size="small"
          min={4}
          max={64}
          value={score.measures}
          onChange={(v) => v != null && audioStore.updateScore({ measures: v })}
          style={{ width: "100%" }}
        />
      </div>

      <div className={styles.field}>
        <div className={styles.fieldLabel}>{text("audio.score.controls.measuresPerLine")}</div>
        <InputNumber
          size="small"
          min={2}
          max={8}
          value={score.measuresPerLine}
          onChange={(v) => v != null && audioStore.updateScore({ measuresPerLine: v })}
          style={{ width: "100%" }}
        />
      </div>

      <div className={styles.sep} />

      <div className={styles.field}>
        <div className={styles.fieldLabel}>{text("audio.score.controls.displayOptions")}</div>
        <div className={styles.switchRow}>
          <span className={styles.switchLabel}>{text("audio.score.controls.showNoteNames")}</span>
          <Switch
            size="small"
            checked={score.displayPrefs.showNoteNames}
            onChange={(v) => updateDisplayPref("showNoteNames", v)}
          />
        </div>
        <div className={styles.switchRow}>
          <span className={styles.switchLabel}>{text("audio.score.controls.showFingering")}</span>
          <Switch
            size="small"
            checked={score.displayPrefs.showFingering}
            onChange={(v) => updateDisplayPref("showFingering", v)}
          />
        </div>
        <div className={styles.switchRow}>
          <span className={styles.switchLabel}>{text("audio.score.controls.showDynamics")}</span>
          <Switch
            size="small"
            checked={score.displayPrefs.showDynamics}
            onChange={(v) => updateDisplayPref("showDynamics", v)}
          />
        </div>
      </div>
    </div>
  );
};

export default ScoreControls;
