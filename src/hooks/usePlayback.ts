import { useCallback, useEffect } from "react";
import {
  audioStore,
  editorStore,
  transportStore,
  useTransportStore,
} from "reducers";
import { audioEngine } from "utils";
import { NAV_KEYS } from "enums";

const scheduleFromCurrent = (positionMs: number) => {
  const proj = audioStore.getState().currentProject;
  if (!proj) return;
  const { toneParams, selectedInstrumentId, currentView } =
    editorStore.getState();
  const {
    bpm: transportBpm,
    timeSignature: transportTimeSig,
  } = transportStore.getState();
  const effectiveBpm = proj.bpm || transportBpm;
  const effectiveTimeSig = proj.timeSignature || transportTimeSig;
  const tone = proj.settings?.toneParams ?? toneParams;
  if (currentView === NAV_KEYS.SCORE_EDITOR) {
    audioEngine.scheduleScoreNotes(
      proj.score.notes,
      effectiveBpm,
      effectiveTimeSig,
      tone,
      proj.score.instrument || selectedInstrumentId,
      0,
      positionMs,
    );
  } else {
    audioEngine.scheduleTrackNotes(
      proj.tracks,
      effectiveBpm,
      tone,
      selectedInstrumentId,
      0,
      positionMs,
    );
  }
};

export const usePlayback = () => {
  const { isPlaying } = useTransportStore();

  useEffect(() => {
    if (!isPlaying) {
      audioEngine.stopAll();
    }
  }, [isPlaying]);

  const togglePlay = useCallback(() => {
    const wasPlaying = transportStore.getState().isPlaying;
    transportStore.togglePlay();
    if (wasPlaying) {
      audioEngine.stopAll();
      return;
    }
    const positionMs = transportStore.getState().positionMs;
    void audioEngine.resume().then(() => {
      scheduleFromCurrent(positionMs);
    });
  }, []);

  const seek = useCallback((ms: number) => {
    const wasPlaying = transportStore.getState().isPlaying;
    transportStore.seek(ms);
    const nextPositionMs = transportStore.getState().positionMs;
    if (wasPlaying) {
      audioEngine.stopAll();
      void audioEngine.resume().then(() => {
        scheduleFromCurrent(nextPositionMs);
      });
    }
  }, []);

  return { togglePlay, seek, isPlaying };
};
