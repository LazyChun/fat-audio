import React from "react";
import { useAudioStore } from "reducers";
import styles from "./MainView.less";
import TrackList from "./components/TrackList/TrackList";
import PianoRoll from "./components/PianoRoll/PianoRoll";
import MixerPanel from "./components/MixerPanel/MixerPanel";

const MainView: React.FC = () => {
  const { currentProject } = useAudioStore();
  if (!currentProject) return null;
  return (
    <div className={styles.container}>
      <TrackList />
      <PianoRoll />
      <MixerPanel />
    </div>
  );
};

export default MainView;
