import React, { useEffect } from "react";
import { useSdk } from "hooks";
import { useI18n } from "hooks";
import {
  audioStore,
  useAudioStore,
  editorStore,
  useEditorStore,
  transportStore,
} from "reducers";
import { getLastAudioId } from "utils";
import TransportBar from "../TransportBar/TransportBar";
import ProjectList from "../ProjectList/ProjectList";
import ProjectModal from "../ProjectModal/ProjectModal";
import MainView from "../MainView/MainView";
import InstrumentsView from "../InstrumentsView/InstrumentsView";
import ScoreEditorView from "../ScoreEditorView/ScoreEditorView";
import AiGenerateView from "../AiGenerateView/AiGenerateView";
import { NAV_KEYS } from "enums";
import styles from "./AppShell.less";

const AppShell: React.FC = () => {
  const sdk = useSdk();
  const { text } = useI18n();
  const { selectedAudioId, loadingStatus } = useAudioStore();
  const { currentView } = useEditorStore();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const items = await audioStore.loadAudios(sdk);
        if (cancelled) return;
        const lastId = await getLastAudioId(sdk);
        const target =
          (lastId && items.find((i) => i.id === lastId)) || items[0];
        if (target) {
          const proj = await audioStore.loadProject(sdk, target.id);
          if (cancelled) return;
          editorStore.syncFromProject(proj);
          transportStore.syncFromProject(proj);
          transportStore.setDurationFromProject(proj);
        }
      } catch (e) {
        if (!cancelled) {
          sdk.ui.toast.error(
            text("audio.project.loadFailed") + ": " + (e as Error)?.message,
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.shell}>
      <TransportBar />
      <main className={styles.main}>
        {loadingStatus === "loading" && (
          <div className={styles.loading}>
            {text("audio.common.comingSoon")}
          </div>
        )}
        {loadingStatus !== "loading" && !selectedAudioId && <ProjectList />}
        {selectedAudioId && currentView === NAV_KEYS.WORKSPACE && <MainView />}
        {selectedAudioId && currentView === NAV_KEYS.AI_GENERATE && (
          <AiGenerateView />
        )}
        {selectedAudioId && currentView === NAV_KEYS.SCORE_EDITOR && (
          <ScoreEditorView />
        )}
        {selectedAudioId && currentView === NAV_KEYS.INSTRUMENTS && (
          <InstrumentsView />
        )}
      </main>
      <ProjectModal />
    </div>
  );
};

export default AppShell;
