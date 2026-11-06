import React from "react";
import { useAudioStore, useEditorStore } from "reducers";
import { useI18n } from "hooks";
import TrackRow from "../TrackRow/TrackRow";
import styles from "./TrackList.less";

const TrackList: React.FC = () => {
  const { currentProject } = useAudioStore();
  const { selectedTrackId } = useEditorStore();
  const { text } = useI18n();
  const tracks = currentProject?.tracks || [];
  return (
    <div className={styles.panel}>
      <div className={styles.header}>{text("audio.tracks.header")}</div>
      <div className={styles.body}>
        {tracks.map((t) => (
          <TrackRow key={t.id} track={t} selected={t.id === selectedTrackId} />
        ))}
      </div>
    </div>
  );
};

export default TrackList;
