import React from "react";
import { useAudioStore } from "reducers";
import styles from "./InstrumentsView.less";
import InstrumentLibrary from "./components/InstrumentLibrary/InstrumentLibrary";
import TonePanel from "./components/TonePanel/TonePanel";
import VirtualPiano from "./components/VirtualPiano/VirtualPiano";

const InstrumentsView: React.FC = () => {
  const { currentProject } = useAudioStore();
  if (!currentProject) return null;
  return (
    <div className={styles.container}>
      <InstrumentLibrary />
      <div className={styles.right}>
        <TonePanel />
        <VirtualPiano />
      </div>
    </div>
  );
};

export default InstrumentsView;
