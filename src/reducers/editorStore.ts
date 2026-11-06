import { useSyncExternalStore } from "react";
import {
  DEFAULT_TONE_PARAMS,
  NAV_KEYS,
  type NavKey,
  type ScoreToolType,
  type DurationType,
  type AccidentalType,
} from "enums";

interface EditorState {
  currentView: NavKey;
  selectedTrackId?: string;
  selectedNoteId?: string;
  selectedScoreNoteId?: string;
  scoreTool: {
    tool: ScoreToolType;
    duration: DurationType;
    accidental: AccidentalType;
  };
  selectedInstrumentId: string;
  toneParams: Audio.ToneParams;
  inputOctave: number;
}

const initialState: EditorState = {
  currentView: NAV_KEYS.WORKSPACE,
  selectedTrackId: undefined,
  selectedNoteId: undefined,
  selectedScoreNoteId: undefined,
  scoreTool: {
    tool: "select",
    duration: "quarter",
    accidental: "none",
  },
  selectedInstrumentId: "piano",
  toneParams: { ...DEFAULT_TONE_PARAMS },
  inputOctave: 4,
};

let state = initialState;
const listeners = new Set<() => void>();

const emitChange = () => {
  listeners.forEach((listener) => listener());
};

const setState = (updater: (prev: EditorState) => EditorState) => {
  const next = updater(state);
  if (next === state) return;
  state = next;
  emitChange();
};

const setView = (currentView: NavKey) => {
  setState((prev) =>
    prev.currentView === currentView ? prev : { ...prev, currentView },
  );
};

const selectTrack = (id?: string) => {
  setState((prev) =>
    prev.selectedTrackId === id ? prev : { ...prev, selectedTrackId: id },
  );
};

const selectNote = (id?: string) => {
  setState((prev) =>
    prev.selectedNoteId === id ? prev : { ...prev, selectedNoteId: id },
  );
};

const selectScoreNote = (id?: string) => {
  setState((prev) =>
    prev.selectedScoreNoteId === id
      ? prev
      : { ...prev, selectedScoreNoteId: id },
  );
};

const setScoreTool = (tool: ScoreToolType) => {
  setState((prev) => ({
    ...prev,
    scoreTool: { ...prev.scoreTool, tool },
  }));
};

const setScoreDuration = (duration: DurationType) => {
  setState((prev) => ({
    ...prev,
    scoreTool: { ...prev.scoreTool, duration },
  }));
};

const setScoreAccidental = (accidental: AccidentalType) => {
  setState((prev) => ({
    ...prev,
    scoreTool: { ...prev.scoreTool, accidental },
  }));
};

const selectInstrument = (id: string) => {
  setState((prev) => ({
    ...prev,
    selectedInstrumentId: id,
  }));
};

const setToneParams = (patch: Partial<Audio.ToneParams>) => {
  setState((prev) => ({
    ...prev,
    toneParams: { ...prev.toneParams, ...patch },
  }));
};

const setToneParamsAll = (params: Audio.ToneParams) => {
  setState((prev) => ({
    ...prev,
    toneParams: { ...params },
  }));
};

const resetToneParams = () => {
  setState((prev) => ({
    ...prev,
    toneParams: { ...DEFAULT_TONE_PARAMS },
  }));
};

const setInputOctave = (inputOctave: number) => {
  setState((prev) =>
    prev.inputOctave === inputOctave ? prev : { ...prev, inputOctave },
  );
};

const syncFromProject = (project: Audio.Project | undefined) => {
  setState((prev) => ({
    ...prev,
    selectedTrackId: project?.tracks?.[0]?.id,
    selectedNoteId: undefined,
    selectedScoreNoteId: undefined,
    selectedInstrumentId: project?.score?.instrument || "piano",
    toneParams: project?.settings?.toneParams
      ? { ...project.settings.toneParams }
      : { ...DEFAULT_TONE_PARAMS },
  }));
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => state;

const editorStore = {
  getState: getSnapshot,
  setView,
  selectTrack,
  selectNote,
  selectScoreNote,
  setScoreTool,
  setScoreDuration,
  setScoreAccidental,
  selectInstrument,
  setToneParams,
  setToneParamsAll,
  resetToneParams,
  setInputOctave,
  syncFromProject,
  subscribe,
};

const useEditorStore = () => useSyncExternalStore(subscribe, getSnapshot);

export type { EditorState };
export { editorStore, useEditorStore };
