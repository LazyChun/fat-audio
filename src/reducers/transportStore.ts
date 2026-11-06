import { useSyncExternalStore } from "react";

interface TransportState {
  isPlaying: boolean;
  positionMs: number;
  bpm: number;
  key: string;
  timeSignature: string;
  zoom: number;
  snapEnabled: boolean;
  metronomeEnabled: boolean;
  durationMs: number;
}

const initialState: TransportState = {
  isPlaying: false,
  positionMs: 0,
  bpm: 120,
  key: "C Maj",
  timeSignature: "4/4",
  zoom: 100,
  snapEnabled: true,
  metronomeEnabled: false,
  durationMs: 60000,
};

let state = initialState;
let intervalId: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

const emitChange = () => {
  listeners.forEach((listener) => listener());
};

const setState = (updater: (prev: TransportState) => TransportState) => {
  const next = updater(state);
  if (next === state) return;
  state = next;
  emitChange();
};

const clearPlaybackInterval = () => {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

const stop = () => {
  clearPlaybackInterval();
  setState((prev) =>
    prev.isPlaying || prev.positionMs !== 0
      ? { ...prev, isPlaying: false, positionMs: 0 }
      : prev,
  );
};

const startPlayback = () => {
  clearPlaybackInterval();
  intervalId = setInterval(() => {
    setState((prev) => {
      if (!prev.isPlaying) return prev;
      const next = prev.positionMs + 33;
      if (next >= prev.durationMs) {
        clearPlaybackInterval();
        return { ...prev, isPlaying: false, positionMs: prev.durationMs };
      }
      return { ...prev, positionMs: next };
    });
  }, 33);
};

const togglePlay = () => {
  setState((prev) => {
    if (prev.isPlaying) {
      clearPlaybackInterval();
      return { ...prev, isPlaying: false };
    }
    if (prev.positionMs >= prev.durationMs) {
      return { ...prev, isPlaying: true, positionMs: 0 };
    }
    return { ...prev, isPlaying: true };
  });
  if (state.isPlaying) {
    startPlayback();
  }
};

const rewind = () => {
  setState((prev) => ({ ...prev, positionMs: 0 }));
};

const fastForward = () => {
  setState((prev) => ({ ...prev, positionMs: prev.durationMs }));
};

const seek = (ms: number) => {
  setState((prev) => ({
    ...prev,
    positionMs: Math.max(0, Math.min(ms, prev.durationMs)),
  }));
};

const setBpm = (bpm: number) => {
  setState((prev) => ({ ...prev, bpm }));
};

const setKey = (key: string) => {
  setState((prev) => ({ ...prev, key }));
};

const setTimeSig = (timeSignature: string) => {
  setState((prev) => ({ ...prev, timeSignature }));
};

const setZoom = (zoom: number) => {
  setState((prev) => ({ ...prev, zoom }));
};

const toggleSnap = () => {
  setState((prev) => ({ ...prev, snapEnabled: !prev.snapEnabled }));
};

const toggleMetronome = () => {
  setState((prev) => ({ ...prev, metronomeEnabled: !prev.metronomeEnabled }));
};

const syncFromProject = (project: Audio.Project | undefined) => {
  if (!project) return;
  setState((prev) => ({
    ...prev,
    bpm: project.bpm,
    key: project.key,
    timeSignature: project.timeSignature,
  }));
};

const SCORE_DUR_BEATS: Record<string, number> = {
  whole: 4,
  half: 2,
  quarter: 1,
  eighth: 0.5,
  sixteenth: 0.25,
  dotted: 1.5,
};

const setDurationFromProject = (project: Audio.Project | undefined) => {
  if (!project) return;
  const beatsPerMeasure =
    parseInt(project.timeSignature.split("/")[0], 10) || 4;
  let maxBeat = 0;
  for (const track of project.tracks) {
    for (const note of track.notes) {
      const endBeat = note.startBeat + note.durationBeats;
      if (endBeat > maxBeat) maxBeat = endBeat;
    }
  }
  for (const note of project.score.notes) {
    if (note.isRest) continue;
    const startBeat = note.measure * beatsPerMeasure + note.beat;
    const dur = SCORE_DUR_BEATS[note.duration] ?? 1;
    const endBeat = startBeat + dur;
    if (endBeat > maxBeat) maxBeat = endBeat;
  }
  const scoreTotalBeats = project.score.measures * beatsPerMeasure;
  if (scoreTotalBeats > maxBeat) maxBeat = scoreTotalBeats;
  const beatsPerSecond = project.bpm / 60;
  const durationMs =
    beatsPerSecond > 0 ? (maxBeat / beatsPerSecond) * 1000 : 60000;
  setState((prev) => ({
    ...prev,
    durationMs: Math.max(10000, Math.ceil(durationMs)),
  }));
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => state;

const transportStore = {
  getState: getSnapshot,
  togglePlay,
  stop,
  rewind,
  fastForward,
  seek,
  setBpm,
  setKey,
  setTimeSig,
  setZoom,
  toggleSnap,
  toggleMetronome,
  syncFromProject,
  setDurationFromProject,
  subscribe,
};

const useTransportStore = () => useSyncExternalStore(subscribe, getSnapshot);

export type { TransportState };
export { transportStore, useTransportStore };
