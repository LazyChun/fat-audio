import React, { useCallback, useRef } from "react";
import { audioStore, editorStore } from "reducers";
import { useSdk, useI18n } from "hooks";
import { Icon } from "components";
import styles from "./TrackRow.less";

interface TrackRowProps {
  track: Audio.Track;
  selected: boolean;
}

const TrackRow: React.FC<TrackRowProps> = ({ track, selected }) => {
  const sdk = useSdk();
  const { text } = useI18n();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      audioStore.saveProject(sdk).catch(() => {});
    }, 300);
  }, [sdk]);

  const handleRowClick = () => {
    editorStore.selectTrack(track.id);
  };

  const handleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    audioStore.toggleTrackMute(track.id);
  };

  const handleSolo = (e: React.MouseEvent) => {
    e.stopPropagation();
    audioStore.toggleTrackSolo(track.id);
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    audioStore.setTrackVolume(track.id, v);
    debouncedSave();
  };

  return (
    <div
      className={`${styles.row}${selected ? ` ${styles.selected}` : ""}${track.muted ? ` ${styles.muted}` : ""}`}
      onClick={handleRowClick}
    >
      <div className={styles.colorBar} style={{ background: track.colorVar }} />
      <span className={styles.name} title={text(track.name)}>
        {text(track.name)}
      </span>
      <button
        className={`${styles.msBtn}${track.muted ? ` ${styles.activeWarm}` : ""}`}
        onClick={handleMute}
        title={text("audio.track.mute")}
      >
        M
      </button>
      <button
        className={`${styles.msBtn}${track.solo ? ` ${styles.activeBrand}` : ""}`}
        onClick={handleSolo}
        title={text("audio.track.solo")}
      >
        S
      </button>
      <input
        className={styles.volume}
        type="range"
        min={0}
        max={100}
        value={track.volume}
        onChange={handleVolume}
        onClick={(e) => e.stopPropagation()}
        style={{ accentColor: track.color }}
      />
      <span className={styles.waveform} style={{ color: track.colorVar }}>
        <Icon name="waveform" size={14} />
      </span>
    </div>
  );
};

export default TrackRow;
