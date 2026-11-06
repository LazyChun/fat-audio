import React from "react";
import { useAudioStore } from "reducers";
import ScoreToolbar from "./components/ScoreToolbar/ScoreToolbar";
import ScoreControls from "./components/ScoreControls/ScoreControls";
import ScoreCanvas from "./components/ScoreCanvas/ScoreCanvas";
import ScoreProperties from "./components/ScoreProperties/ScoreProperties";
import styles from "./ScoreEditorView.less";

const ScoreEditorView: React.FC = () => {
  const { currentProject } = useAudioStore();
  if (!currentProject) return null;
  return (
    <div className={styles.container}>
      <ScoreToolbar />
      <div className={styles.middle}>
        <ScoreControls />
        <ScoreCanvas />
      </div>
      <ScoreProperties />
    </div>
  );
};

export default ScoreEditorView;
