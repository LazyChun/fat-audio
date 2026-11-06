import React, { useCallback, useMemo } from "react";
import { Dropdown, Tooltip } from "antd";
import type { MenuProps } from "antd";
import { useI18n, usePlayback, useSdk } from "hooks";
import {
  audioStore,
  editorStore,
  transportStore,
  useAudioStore,
  useEditorStore,
  useTransportStore,
} from "reducers";
import { audioEngine } from "utils";
import { formatTime } from "utils";
import { Icon } from "components";
import { NAV_KEYS } from "enums";
import PageNav from "../PageNav/PageNav";
import styles from "./TransportBar.less";

const TransportBar: React.FC = () => {
  const sdk = useSdk();
  const { text } = useI18n();
  const {
    positionMs,
    durationMs,
    bpm,
    key: musicKey,
    timeSignature,
    zoom,
    snapEnabled,
    metronomeEnabled,
  } = useTransportStore();
  const { togglePlay, seek, isPlaying } = usePlayback();
  const {
    audios,
    selectedAudioId,
    currentProject,
    isDirty,
    scorePast,
    scoreFuture,
  } = useAudioStore();
  const { currentView } = useEditorStore();

  const displayBpm = currentProject?.bpm ?? bpm;
  const displayKey = currentProject?.key ?? musicKey;
  const displayTimeSig = currentProject?.timeSignature ?? timeSignature;

  const handleBackToPreview = useCallback(() => {
    transportStore.stop();
    audioEngine.stopAll();
    void audioStore.closeProject(sdk);
    editorStore.syncFromProject(undefined);
  }, [sdk]);

  const handleSelectProject = useCallback(
    async (id: string) => {
      if (id === selectedAudioId) return;
      transportStore.stop();
      audioEngine.stopAll();
      try {
        const proj = await audioStore.loadProject(sdk, id);
        editorStore.syncFromProject(proj);
        transportStore.syncFromProject(proj);
        transportStore.setDurationFromProject(proj);
      } catch (e) {
        sdk.ui.toast.error(
          text("audio.project.loadFailed") + ": " + (e as Error)?.message,
        );
      }
    },
    [sdk, selectedAudioId, text],
  );

  const handleNewProject = useCallback(() => {
    audioStore.setEditingAudio(undefined);
    audioStore.setEditModalOpen(true);
  }, []);

  const handleSave = useCallback(async () => {
    try {
      await audioStore.saveProject(sdk);
      sdk.ui.toast.success(text("audio.project.saved"));
    } catch (e) {
      sdk.ui.toast.error(
        text("audio.project.saveFailed") + ": " + (e as Error)?.message,
      );
    }
  }, [sdk, text]);

  const menuItems: MenuProps["items"] = useMemo(() => {
    const projectItems: MenuProps["items"] = audios.map((p) => ({
      key: p.id,
      label: (
        <div className={styles.projectItem}>
          <span className={styles.projectItemName}>{p.name}</span>
          {p.id === selectedAudioId && <Icon name="playSmall" size={10} />}
        </div>
      ),
      onClick: () => {
        void handleSelectProject(p.id);
      },
    }));
    return [
      ...projectItems,
      { type: "divider" as const },
      {
        key: "__new__",
        label: (
          <div className={styles.newItem}>
            <Icon name="plus" size={12} />
            <span>{text("audio.project.new")}</span>
          </div>
        ),
        onClick: handleNewProject,
      },
    ];
  }, [audios, selectedAudioId, text, handleSelectProject, handleNewProject]);

  return (
    <div className={styles.bar}>
      <div className={styles.left}>
        {selectedAudioId && (
          <Tooltip title={text("audio.project.back")}>
            <button className={styles.btn} onClick={handleBackToPreview}>
              <Icon name="back" size={14} />
            </button>
          </Tooltip>
        )}
        {selectedAudioId ? (
          <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
            <button
              className={styles.projectDropdown}
              title={text("audio.project.switch")}
            >
              <Icon name="folder" size={14} />
              <span className={styles.projectName}>
                {currentProject?.name ?? text("audio.title")}
              </span>
              {isDirty && (
                <span
                  className={styles.dirtyDot}
                  title={text("audio.toolbar.unsaved")}
                />
              )}
            </button>
          </Dropdown>
        ) : (
          <div className={styles.logo}>
            <Icon name="logo" size={16} />
            <span className={styles.logoText}>AMS</span>
          </div>
        )}
        <PageNav />
      </div>

      <div className={styles.center}>
        <div className={styles.transportGroup}>
          <button
            className={styles.btn}
            title={text("audio.transport.rewind")}
            onClick={() => seek(0)}
          >
            <Icon name="rewind" size={14} />
          </button>
          <button
            className={styles.btn}
            title={text("audio.transport.prevMarker")}
            onClick={() => seek(Math.max(0, positionMs - 5000))}
          >
            <Icon name="prevMarker" size={14} />
          </button>
          <button
            className={`${styles.btn} ${styles.playBtn}`}
            title={text("audio.transport.playStop")}
            onClick={togglePlay}
          >
            <Icon name={isPlaying ? "stop" : "play"} size={14} />
          </button>
          <button
            className={styles.btn}
            title={text("audio.transport.nextMarker")}
            onClick={() => seek(positionMs + 5000)}
          >
            <Icon name="nextMarker" size={14} />
          </button>
          <button
            className={styles.btn}
            title={text("audio.transport.fastForward")}
            onClick={() => seek(durationMs)}
          >
            <Icon name="fastForward" size={14} />
          </button>
        </div>

        <div className={styles.divider} />

        <div className={styles.infoGroup}>
          <span className={styles.timeDisplay}>{formatTime(positionMs)}</span>
          <span className={styles.infoItem}>
            <span className={styles.infoLabel}>{displayBpm}</span>
            <span className={styles.infoUnit}>BPM</span>
          </span>
          <span className={styles.infoItem}>
            <span className={styles.infoLabel}>{displayKey}</span>
          </span>
          <span className={styles.infoItem}>
            <span className={styles.infoLabel}>{displayTimeSig}</span>
          </span>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.statusGroup} title={text("audio.status.driver")}>
          <span className={styles.statusMetric}>
            <span className={styles.statusLabel}>
              {text("audio.status.cpu")}
            </span>
            <span className={styles.statusValue}>12%</span>
          </span>
          <span className={styles.statusMetric}>
            <span className={styles.statusLabel}>
              {text("audio.status.mem")}
            </span>
            <span className={styles.statusValue}>256MB</span>
          </span>
          <span className={styles.statusMetric}>
            <span className={styles.statusValue}>
              {text("audio.status.driver")}
            </span>
          </span>
        </div>

        <div className={styles.divider} />

        {selectedAudioId && (
          <>
            <Tooltip title={text("audio.toolbar.save")}>
              <button
                className={`${styles.btn} ${isDirty ? styles.dirtySave : ""}`}
                onClick={() => {
                  void handleSave();
                }}
              >
                <Icon name="save" size={14} />
              </button>
            </Tooltip>
            <div className={styles.divider} />
          </>
        )}

        <div className={styles.zoomGroup} title={text("audio.transport.zoom")}>
          <Icon name="zoom" size={12} />
          <input
            type="range"
            min={25}
            max={400}
            step={5}
            value={zoom}
            className={styles.zoomSlider}
            onChange={(e) => transportStore.setZoom(Number(e.target.value))}
          />
          <span className={styles.zoomValue}>{zoom}%</span>
        </div>

        <div className={styles.divider} />

        <div className={styles.toggleGroup}>
          <button
            className={`${styles.btn} ${snapEnabled ? styles.active : ""}`}
            title={text("audio.transport.snap")}
            onClick={() => transportStore.toggleSnap()}
          >
            <Icon name="snap" size={14} />
          </button>
          <button
            className={styles.btn}
            disabled={
              currentView !== NAV_KEYS.SCORE_EDITOR || scorePast.length === 0
            }
            title={text("audio.transport.undo")}
            onClick={() => audioStore.undoScore()}
          >
            <Icon name="undo" size={14} />
          </button>
          <button
            className={styles.btn}
            disabled={
              currentView !== NAV_KEYS.SCORE_EDITOR || scoreFuture.length === 0
            }
            title={text("audio.transport.redo")}
            onClick={() => audioStore.redoScore()}
          >
            <Icon name="redo" size={14} />
          </button>
        </div>

        <div className={styles.divider} />

        <button
          className={`${styles.btn} ${metronomeEnabled ? styles.active : ""}`}
          title={text("audio.transport.metronome")}
          onClick={() => transportStore.toggleMetronome()}
        >
          <Icon name="metronome" size={14} />
        </button>
      </div>
    </div>
  );
};

export default TransportBar;
