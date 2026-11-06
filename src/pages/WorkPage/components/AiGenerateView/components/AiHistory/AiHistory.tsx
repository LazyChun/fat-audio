import React, { useState } from "react";
import { Modal } from "antd";
import { aiStore, useAiStore, useAudioStore } from "reducers";
import { useI18n, useSdk } from "hooks";
import styles from "./AiHistory.less";

const AiHistory: React.FC = () => {
  const { text } = useI18n();
  const sdk = useSdk();
  const { currentProject } = useAudioStore();
  const { history } = useAiStore();
  const [collapsed, setCollapsed] = useState(true);

  const handleClear = () => {
    if (!currentProject) return;
    Modal.confirm({
      title: text("audio.ai.confirmClearHistory"),
      onOk: () => aiStore.clearHistory(sdk, currentProject.id),
    });
  };

  const truncate = (s: string, n: number) => (s.length > n ? `${s.slice(0, n)}…` : s);

  return (
    <div className={styles.container}>
      <div
        className={styles.header}
        onClick={() => setCollapsed((v) => !v)}
        role="button"
        tabIndex={0}
      >
        <div className={styles.headerLeft}>
          <span className={styles.arrow}>{collapsed ? "▸" : "▾"}</span>
          <span className={styles.title}>{text("audio.ai.history")}</span>
          <span className={styles.count}>{history.length}</span>
        </div>
        {history.length > 0 && (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
          >
            {text("audio.ai.clearHistory")}
          </button>
        )}
      </div>

      {!collapsed && (
        <div className={styles.list}>
          {history.length === 0 && (
            <div className={styles.emptyItem}>{text("audio.ai.noResults")}</div>
          )}
          {history.map((entry) => (
            <div key={entry.id} className={styles.item}>
              <div className={styles.itemHeader}>
                <span className={styles.itemTime}>
                  {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : ""}
                </span>
                <span className={styles.itemClips}>
                  {entry.clipIds.length} clips
                </span>
              </div>
              <div className={styles.itemPrompt}>
                {truncate(entry.request.prompt || "", 40)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AiHistory;
