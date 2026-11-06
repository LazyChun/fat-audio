import React, { useEffect } from "react";
import { aiStore, useAudioStore } from "reducers";
import { useSdk } from "hooks";
import AiForm from "./components/AiForm/AiForm";
import AiResults from "./components/AiResults/AiResults";
import AiHistory from "./components/AiHistory/AiHistory";
import styles from "./AiGenerateView.less";

const AiGenerateView: React.FC = () => {
  const { currentProject } = useAudioStore();
  const sdk = useSdk();

  useEffect(() => {
    if (currentProject) {
      aiStore.loadHistory(sdk, currentProject.id).catch(() => {});
    }
  }, [currentProject?.id, sdk]);

  if (!currentProject) return null;

  return (
    <div className={styles.container}>
      <AiForm />
      <div className={styles.right}>
        <AiResults />
        <AiHistory />
      </div>
    </div>
  );
};

export default AiGenerateView;
