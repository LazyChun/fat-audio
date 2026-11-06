import React from "react";
import { message } from "antd";
import { aiStore, useAiStore } from "reducers";
import { useI18n } from "hooks";
import { Icon } from "components";
import { formatDuration } from "utils";
import styles from "./ClipCard.less";

interface ClipCardProps {
  clip: Audio.GeneratedClip;
  isPreview: boolean;
}

const MINI_BARS = 24;
const BIG_BARS = 54;

const sampleWaveform = (waveform: number[], count: number): number[] => {
  if (!waveform || waveform.length === 0) {
    return Array.from({ length: count }, () => Math.random() * 0.7 + 0.2);
  }
  if (waveform.length === count) return waveform;
  if (waveform.length > count) {
    // 抽样
    const step = waveform.length / count;
    return Array.from(
      { length: count },
      (_, i) => waveform[Math.floor(i * step)],
    );
  }
  // 插值
  return Array.from({ length: count }, (_, i) => {
    const idx = (i / count) * waveform.length;
    const lo = Math.floor(idx);
    const hi = Math.min(waveform.length - 1, lo + 1);
    const t = idx - lo;
    return waveform[lo] * (1 - t) + waveform[hi] * t;
  });
};

const ClipCard: React.FC<ClipCardProps> = ({ clip, isPreview }) => {
  const { text } = useI18n();
  const { previewPositionMs } = useAiStore();

  const miniBars = sampleWaveform(clip.waveform, MINI_BARS);
  const bigBars = sampleWaveform(clip.waveform, BIG_BARS);
  const durationMs = clip.durationSeconds * 1000;
  const progress =
    durationMs > 0 ? Math.min(1, previewPositionMs / durationMs) : 0;

  if (!isPreview) {
    // 常规态
    return (
      <div className={styles.card}>
        <button
          type="button"
          className={styles.playBtn}
          onClick={() => aiStore.previewClip(clip.id)}
          title={text("audio.ai.waveformPreview")}
        >
          <Icon name="playSmall" size={14} />
        </button>
        <div className={styles.info}>
          <div className={styles.titleRow}>
            <span className={styles.clipTitle}>{clip.title}</span>
            <span className={styles.clipDuration}>
              {formatDuration(clip.durationSeconds)}
            </span>
          </div>
          <div className={styles.miniWave}>
            {miniBars.map((v, i) => (
              <div
                key={i}
                className={styles.miniBar}
                style={{
                  height: `${Math.max(2, v * 100)}%`,
                  background: `linear-gradient(to top, var(--ams-brand-primary), var(--ams-accent-warm))`,
                }}
              />
            ))}
          </div>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.actionBtn}
            title={text("audio.ai.addToWorkspace")}
            onClick={() => message.success(text("audio.ai.addedToWorkspace"))}
          >
            <Icon name="plus" size={14} />
          </button>
          <button
            type="button"
            className={styles.actionBtn}
            title={text("audio.ai.download")}
            onClick={() => message.info(text("audio.ai.downloadStub"))}
          >
            <Icon name="download" size={14} />
          </button>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.deleteBtn}`}
            title={text("audio.ai.delete")}
            onClick={() => aiStore.removeClip(clip.id)}
          >
            <Icon name="trash" size={14} />
          </button>
        </div>
      </div>
    );
  }

  // 预览态
  const playingPos = Math.floor(progress * BIG_BARS);

  return (
    <div className={`${styles.card} ${styles.cardPreview}`}>
      <div className={styles.previewHeader}>
        <span className={styles.clipTitle}>{clip.title}</span>
        <span className={styles.previewLabel}>
          {text("audio.ai.waveformPreview")}
        </span>
        <span className={styles.previewTime}>
          {formatDuration(previewPositionMs / 1000)} /{" "}
          {formatDuration(clip.durationSeconds)}
        </span>
      </div>

      <div className={styles.progressTrack}>
        <div
          className={styles.progressFill}
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className={styles.bigWave}>
        {bigBars.map((v, i) => (
          <div
            key={i}
            className={styles.bigBar}
            style={{
              height: `${Math.max(2, v * 100)}%`,
              background:
                i < playingPos
                  ? "var(--ams-brand-primary)"
                  : "var(--ams-accent-warm)",
            }}
          />
        ))}
        <div
          className={styles.progressLine}
          style={{ left: `${progress * 100}%` }}
        />
      </div>

      <div className={styles.previewControls}>
        <button
          type="button"
          className={styles.previewNavBtn}
          title={text("audio.ai.previewBack")}
          onClick={() =>
            aiStore.seekPreview(Math.max(0, previewPositionMs - 1000))
          }
        >
          <Icon name="back" size={14} />
        </button>
        <button
          type="button"
          className={styles.previewPlayBtn}
          onClick={() => aiStore.previewClip(undefined)}
        >
          <Icon name="playSmall" size={16} />
        </button>
        <button
          type="button"
          className={styles.previewNavBtn}
          title={text("audio.ai.previewForward")}
          onClick={() =>
            aiStore.seekPreview(Math.min(durationMs, previewPositionMs + 1000))
          }
        >
          <Icon name="fastForward" size={14} />
        </button>
      </div>
    </div>
  );
};

export default ClipCard;
