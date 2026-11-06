import React from "react";
import { Input, InputNumber, Select, Checkbox, message } from "antd";
import { aiStore, useAiStore, useAudioStore } from "reducers";
import { useI18n, useSdk } from "hooks";
import { Icon } from "components";
import {
  GENRE_OPTIONS,
  KEY_OPTIONS,
  TIME_SIG_OPTIONS,
  DURATION_OPTIONS,
  AI_INSTRUMENT_OPTIONS,
  MOOD_OPTIONS,
} from "enums";
import styles from "./AiForm.less";

const AiForm: React.FC = () => {
  const { text } = useI18n();
  const sdk = useSdk();
  const { currentProject } = useAudioStore();
  const { request, isGenerating } = useAiStore();

  const handleGenerate = async () => {
    if (!currentProject) return;
    try {
      await aiStore.generate(sdk, currentProject.id);
    } catch {
      message.error(text("audio.ai.generateFailed"));
    }
  };

  return (
    <div className={styles.form}>
      <div className={styles.titleRow}>
        <Icon name="sparkles" size={20} className={styles.titleIcon} />
        <h1 className={styles.title}>{text("audio.ai.title")}</h1>
      </div>

      <div className={styles.field}>
        <label className={styles.fieldLabel}>
          {text("audio.ai.promptLabel")}
        </label>
        <Input.TextArea
          rows={5}
          value={request.prompt}
          placeholder={text("audio.ai.promptPlaceholder")}
          onChange={(e) => aiStore.setRequest({ prompt: e.target.value })}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.fieldLabel}>
          {text("audio.ai.genreLabel")}
        </label>
        <div className={styles.chipRow}>
          {GENRE_OPTIONS.map((g) => {
            const active = request.genres.includes(g.value);
            return (
              <button
                key={g.value}
                type="button"
                className={`${styles.chip}${active ? ` ${styles.chipActive}` : ""}`}
                onClick={() => aiStore.toggleGenre(g.value)}
              >
                {text(g.labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.fieldLabel}>
          {text("audio.ai.paramsLabel")}
        </label>
        <div className={styles.paramGrid}>
          <div className={styles.paramCell}>
            <span className={styles.paramTitle}>{text("audio.ai.bpm")}</span>
            <InputNumber
              size="small"
              min={40}
              max={240}
              value={request.bpm}
              onChange={(v) => v != null && aiStore.setRequest({ bpm: v })}
              style={{ width: "100%" }}
            />
          </div>
          <div className={styles.paramCell}>
            <span className={styles.paramTitle}>{text("audio.ai.key")}</span>
            <Select
              size="small"
              value={request.key}
              onChange={(v) => aiStore.setRequest({ key: v })}
              style={{ width: "100%" }}
              options={KEY_OPTIONS.map((k) => ({ value: k, label: k }))}
            />
          </div>
          <div className={styles.paramCell}>
            <span className={styles.paramTitle}>
              {text("audio.ai.timeSig")}
            </span>
            <Select
              size="small"
              value={request.timeSignature}
              onChange={(v) => aiStore.setRequest({ timeSignature: v })}
              style={{ width: "100%" }}
              options={TIME_SIG_OPTIONS.map((t) => ({ value: t, label: t }))}
            />
          </div>
          <div className={styles.paramCell}>
            <span className={styles.paramTitle}>
              {text("audio.ai.duration")}
            </span>
            <Select
              size="small"
              value={request.duration}
              onChange={(v) => aiStore.setRequest({ duration: v })}
              style={{ width: "100%" }}
              options={DURATION_OPTIONS.map((o) => ({
                value: o.value,
                label: text(o.labelKey),
              }))}
            />
          </div>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.fieldLabel}>
          {text("audio.ai.instruments")}
        </label>
        <div className={styles.instRow}>
          {AI_INSTRUMENT_OPTIONS.map((o) => (
            <Checkbox
              key={o.value}
              checked={request.instruments.includes(o.value)}
              onChange={() => aiStore.toggleInstrument(o.value)}
              className={styles.instCheckbox}
            >
              {text(o.labelKey)}
            </Checkbox>
          ))}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.fieldLabel}>{text("audio.ai.mood")}</label>
        <Select
          size="small"
          value={request.mood}
          onChange={(v) => aiStore.setRequest({ mood: v })}
          style={{ width: "100%" }}
          options={MOOD_OPTIONS.map((o) => ({
            value: o.value,
            label: text(o.labelKey),
          }))}
        />
      </div>

      <button
        type="button"
        className={styles.generateBtn}
        disabled={isGenerating}
        onClick={handleGenerate}
      >
        <Icon name="sparkles" size={16} />
        <span>
          {isGenerating
            ? text("audio.ai.generating")
            : text("audio.ai.generate")}
        </span>
      </button>
    </div>
  );
};

export default AiForm;
