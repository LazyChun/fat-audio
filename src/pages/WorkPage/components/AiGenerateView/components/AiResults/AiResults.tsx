import React from "react";
import { Spin } from "antd";
import { useAiStore } from "reducers";
import { useI18n } from "hooks";
import ClipCard from "../ClipCard/ClipCard";
import styles from "./AiResults.less";

const AiResults: React.FC = () => {
  const { text } = useI18n();
  const { generatedClips, isGenerating, error, previewClipId } = useAiStore();

  return (
    <div className={styles.results}>
      <div className={styles.header}>
        <h2 className={styles.title}>{text("audio.ai.results")}</h2>
        <span className={styles.aiPill}>
          <span className={styles.aiDot} />
          {text("audio.ai.aiReady")}
        </span>
      </div>

      {isGenerating && (
        <div className={styles.loading}>
          <Spin size="large" />
          <span className={styles.loadingText}>{text("audio.ai.generating")}</span>
        </div>
      )}

      {!isGenerating && error && (
        <div className={styles.errorBox}>
          <div className={styles.errorTitle}>{text("audio.ai.generateFailed")}</div>
          <div className={styles.errorDetail}>{error}</div>
        </div>
      )}

      {!isGenerating && !error && generatedClips.length === 0 && (
        <div className={styles.empty}>{text("audio.ai.noResults")}</div>
      )}

      {!isGenerating && !error && generatedClips.length > 0 && (
        <div className={styles.clipList}>
          {generatedClips.map((clip) => (
            <ClipCard
              key={clip.id}
              clip={clip}
              isPreview={previewClipId === clip.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AiResults;
