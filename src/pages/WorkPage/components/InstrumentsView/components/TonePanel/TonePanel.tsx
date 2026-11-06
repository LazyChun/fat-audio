import React, { useEffect, useState } from "react";
import { Modal, Input, message } from "antd";
import {
  audioStore,
  editorStore,
  useEditorStore,
} from "reducers";
import { useSdk, useI18n } from "hooks";
import {
  OCTAVE_OPTIONS,
  PITCH_BEND_OPTIONS,
  BUILTIN_PRESETS,
  DEFAULT_TONE_PARAMS,
} from "enums";
import styles from "./TonePanel.less";

interface ParamDef {
  key: keyof Audio.ToneParams;
  labelKey: string;
  min: number;
  max: number;
  step: number;
  unit: string;
}

const TONE_PARAM_DEFS: ParamDef[] = [
  { key: "attack", labelKey: "audio.tone.attack", min: 0, max: 2000, step: 1, unit: "ms" },
  { key: "decay", labelKey: "audio.tone.decay", min: 0, max: 2000, step: 1, unit: "ms" },
  { key: "sustain", labelKey: "audio.tone.sustain", min: 0, max: 100, step: 1, unit: "%" },
  { key: "release", labelKey: "audio.tone.release", min: 0, max: 2000, step: 1, unit: "ms" },
  { key: "cutoff", labelKey: "audio.tone.cutoff", min: 20, max: 20000, step: 1, unit: "Hz" },
  { key: "resonance", labelKey: "audio.tone.resonance", min: 0, max: 100, step: 1, unit: "" },
  { key: "reverb", labelKey: "audio.tone.reverb", min: 0, max: 100, step: 1, unit: "%" },
  { key: "chorus", labelKey: "audio.tone.chorus", min: 0, max: 100, step: 1, unit: "%" },
  { key: "delay", labelKey: "audio.tone.delay", min: 0, max: 100, step: 1, unit: "%" },
  { key: "pan", labelKey: "audio.tone.pan", min: -100, max: 100, step: 1, unit: "" },
];

const TonePanel: React.FC = () => {
  const sdk = useSdk();
  const { text } = useI18n();
  const { toneParams } = useEditorStore();
  const [savedPresets, setSavedPresets] = useState<Audio.InstrumentPreset[]>([]);
  const [presetModalOpen, setPresetModalOpen] = useState(false);
  const [presetName, setPresetName] = useState("");

  useEffect(() => {
    sdk.backend
      .invoke<Audio.PresetsListResponse>("listPresets")
      .then((res) => setSavedPresets(res?.items || []))
      .catch(() => {});
  }, [sdk]);

  const updateParam = (key: keyof Audio.ToneParams, value: number) => {
    const patch = { [key]: value } as Partial<Audio.ToneParams>;
    editorStore.setToneParams(patch);
    audioStore.updateToneParams(patch);
  };

  const applyPreset = (params: Audio.ToneParams) => {
    editorStore.setToneParamsAll(params);
    audioStore.updateToneParams(params);
  };

  const handleSavePreset = async () => {
    if (!presetName.trim()) return;
    try {
      await sdk.backend.invoke("savePreset", {
        name: presetName.trim(),
        params: editorStore.getState().toneParams,
      });
      const res = await sdk.backend.invoke<Audio.PresetsListResponse>("listPresets");
      setSavedPresets(res?.items || []);
      message.success(text("audio.tone.presetSaved"));
      setPresetName("");
      setPresetModalOpen(false);
    } catch {
      message.error(text("audio.tone.presetSaveFailed"));
    }
  };

  const handleReset = () => {
    editorStore.resetToneParams();
    audioStore.updateToneParams({ ...DEFAULT_TONE_PARAMS });
  };

  const handleSaveToProject = async () => {
    try {
      await audioStore.saveProject(sdk);
      message.success(text("audio.project.saved"));
    } catch {
      message.error(text("audio.project.saveFailed"));
    }
  };

  return (
    <div className={styles.panel}>
      {/* Section 1: Pitch Control */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>{text("audio.tone.pitchControl")}</div>
        <div className={styles.paramRow}>
          <span className={styles.paramLabel}>{text("audio.tone.octave")}</span>
          <div className={styles.btnGroup}>
            {OCTAVE_OPTIONS.map((v) => (
              <button
                key={v}
                className={`${styles.optBtn}${toneParams.octave === v ? ` ${styles.optActive}` : ""}`}
                onClick={() => updateParam("octave", v)}
              >
                {v > 0 ? `+${v}` : v}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.paramRow}>
          <span className={styles.paramLabel}>{text("audio.tone.fineTuning")}</span>
          <div className={styles.sliderRow}>
            <input
              className={styles.slider}
              type="range"
              min={-50}
              max={50}
              step={1}
              value={toneParams.fineTuning}
              onChange={(e) => updateParam("fineTuning", Number(e.target.value))}
            />
            <span className={styles.paramValue}>{toneParams.fineTuning} ct</span>
          </div>
        </div>
        <div className={styles.paramRow}>
          <span className={styles.paramLabel}>{text("audio.tone.masterPitch")}</span>
          <span className={styles.pill}>A4 = 440 Hz</span>
        </div>
        <div className={styles.paramRow}>
          <span className={styles.paramLabel}>{text("audio.tone.pitchBend")}</span>
          <div className={styles.btnGroup}>
            {PITCH_BEND_OPTIONS.map((v) => (
              <button
                key={v}
                className={`${styles.optBtnSm}${toneParams.pitchBend === v ? ` ${styles.optActive}` : ""}`}
                onClick={() => updateParam("pitchBend", v)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.divider} />

      {/* Section 2: Tone Parameters */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>{text("audio.tone.params")}</div>
        <div className={styles.paramGrid}>
          {TONE_PARAM_DEFS.map((def) => (
            <div key={def.key} className={styles.toneParam}>
              <span className={styles.toneLabel}>{text(def.labelKey)}</span>
              <input
                className={styles.toneSlider}
                type="range"
                min={def.min}
                max={def.max}
                step={def.step}
                value={toneParams[def.key] as number}
                onChange={(e) => updateParam(def.key, Number(e.target.value))}
              />
              <span className={styles.toneValue}>
                {toneParams[def.key] as number}{def.unit}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.divider} />

      {/* Section 3: Presets */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>{text("audio.tone.presets")}</div>
        <div className={styles.presetGrid}>
          {BUILTIN_PRESETS.map((preset) => (
            <button
              key={preset.id}
              className={styles.presetBtn}
              onClick={() => applyPreset(preset.params)}
            >
              {text(preset.nameKey)}
            </button>
          ))}
        </div>
        {savedPresets.length > 0 && (
          <div className={styles.savedPresets}>
            {savedPresets.map((p) => (
              <button
                key={p.id}
                className={styles.presetBtn}
                onClick={() => applyPreset(p.params)}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}
        <button className={styles.savePresetBtn} onClick={() => setPresetModalOpen(true)}>
          {text("audio.tone.savePreset")}
        </button>
      </div>

      <div className={styles.actions}>
        <button className={styles.actionBtn} onClick={handleReset}>
          {text("audio.common.reset")}
        </button>
        <button className={`${styles.actionBtn} ${styles.primaryBtn}`} onClick={handleSaveToProject}>
          {text("audio.common.saveToProject")}
        </button>
      </div>

      <Modal
        title={text("audio.tone.savePreset")}
        open={presetModalOpen}
        onOk={handleSavePreset}
        onCancel={() => setPresetModalOpen(false)}
        okText={text("common.ok")}
        cancelText={text("common.cancel")}
      >
        <Input
          placeholder={text("audio.tone.presetNamePlaceholder")}
          value={presetName}
          onChange={(e) => setPresetName(e.target.value)}
          onPressEnter={handleSavePreset}
        />
      </Modal>
    </div>
  );
};

export default TonePanel;
