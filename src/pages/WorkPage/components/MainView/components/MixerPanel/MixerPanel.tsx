import React, { useCallback, useEffect, useRef, useState } from "react";
import { audioStore, useAudioStore } from "reducers";
import { useSdk, useI18n } from "hooks";
import { volumeToDb, panLabel } from "utils";
import styles from "./MixerPanel.less";

const MIN_WIDTH = 260;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 320;
const STORAGE_KEY = "ams.mixer.width";
const DEFAULT_VOLUME = 100;

const clampWidth = (w: number) => Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, w));

const loadWidth = (): number => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return clampWidth(parseInt(raw, 10));
  } catch {}
  return DEFAULT_WIDTH;
};

const MixerPanel: React.FC = () => {
  const { currentProject } = useAudioStore();
  const sdk = useSdk();
  const { text } = useI18n();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [width, setWidth] = useState<number>(loadWidth);

  const mixer = currentProject?.mixer;
  const channels = mixer?.channels || [];
  const master = mixer?.master;

  const debouncedSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      audioStore.saveProject(sdk).catch(() => {});
    }, 300);
  }, [sdk]);

  // === Panel resize (drag left edge) ===
  const resizingRef = useRef(false);
  const startWidthRef = useRef(0);
  const startXRef = useRef(0);
  const widthRef = useRef(width);
  widthRef.current = width;

  const onResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    resizingRef.current = true;
    startWidthRef.current = width;
    startXRef.current = e.clientX;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!resizingRef.current) return;
      // Dragging left grows the panel (edge is on the left side)
      const delta = startXRef.current - e.clientX;
      setWidth(clampWidth(startWidthRef.current + delta));
    };
    const onUp = () => {
      if (!resizingRef.current) return;
      resizingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      try {
        localStorage.setItem(STORAGE_KEY, String(widthRef.current));
      } catch {}
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  // === Fader drag interaction ===
  const dragStateRef = useRef<{
    channelId: string;
    isMaster: boolean;
    faderEl: HTMLDivElement;
  } | null>(null);

  const updateVolumeFromY = (clientY: number) => {
    const st = dragStateRef.current;
    if (!st) return;
    const rect = st.faderEl.getBoundingClientRect();
    const y = clientY - rect.top;
    const volume = Math.round(
      Math.max(0, Math.min(100, ((rect.height - y) / rect.height) * 100)),
    );
    if (st.isMaster) {
      audioStore.updateMixerMaster({ volume });
    } else {
      audioStore.updateMixerChannel(st.channelId, { volume });
    }
    debouncedSave();
  };

  const onFaderMouseDown = (
    channelId: string,
    isMaster: boolean,
    e: React.MouseEvent,
  ) => {
    e.preventDefault();
    dragStateRef.current = {
      channelId,
      isMaster,
      faderEl: e.currentTarget as HTMLDivElement,
    };
    updateVolumeFromY(e.clientY);
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (dragStateRef.current) updateVolumeFromY(e.clientY);
    };
    const onUp = () => {
      dragStateRef.current = null;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onFaderDoubleClick = (channelId: string, isMaster: boolean) => {
    if (isMaster) {
      audioStore.updateMixerMaster({ volume: DEFAULT_VOLUME });
    } else {
      audioStore.updateMixerChannel(channelId, { volume: DEFAULT_VOLUME });
    }
    debouncedSave();
  };

  const renderChannel = (ch: Audio.MixerChannel, isMaster = false) => (
    <div
      key={ch.id}
      className={`${styles.strip}${isMaster ? ` ${styles.master}` : ""}`}
    >
      <div className={styles.stripHead}>
        <div className={styles.dot} style={{ background: ch.color }} />
        <div className={styles.name}>
          {isMaster ? text("audio.mixer.master") : text(ch.name)}
        </div>
      </div>
      <div className={styles.faderRow}>
        <div
          className={styles.fader}
          onMouseDown={(e) => onFaderMouseDown(ch.id, isMaster, e)}
          onDoubleClick={() => onFaderDoubleClick(ch.id, isMaster)}
        >
          <div
            className={styles.faderFill}
            style={{ height: `${ch.volume}%` }}
          />
          <div
            className={styles.faderThumb}
            style={{ bottom: `${ch.volume}%` }}
          />
        </div>
        <div className={styles.meter}>
          <div
            className={styles.meterBar}
            style={{ height: `${ch.levelL}%` }}
          />
          <div
            className={styles.meterBar}
            style={{ height: `${ch.levelR}%` }}
          />
        </div>
      </div>
      <div className={styles.stripFoot}>
        <div className={styles.pan}>{panLabel(ch.pan)}</div>
        <div className={styles.db}>{volumeToDb(ch.volume)}</div>
      </div>
    </div>
  );

  return (
    <div className={styles.panel} style={{ width, minWidth: width }}>
      <div
        className={styles.resizeHandle}
        onMouseDown={onResizeStart}
        title={text("audio.mixer.resizeHint")}
      />
      <div className={styles.header}>
        <span>{text("audio.mixer.header")}</span>
        <span className={styles.headerHint}>
          {text("audio.mixer.dragHint")}
        </span>
      </div>
      <div className={styles.strips}>
        {channels.map((ch) => renderChannel(ch))}
        {master && renderChannel(master, true)}
      </div>
    </div>
  );
};

export default MixerPanel;
