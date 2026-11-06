import { useSyncExternalStore } from "react";
import type { FatNotesPluginSDK } from "fat-notes-sdk";

interface AiState {
  request: Audio.GenerationRequest;
  generatedClips: Audio.GeneratedClip[];
  history: Audio.GenerationHistoryEntry[];
  isGenerating: boolean;
  previewClipId?: string;
  previewPositionMs: number;
  error?: string;
}

const defaultRequest: Audio.GenerationRequest = {
  prompt: "",
  genres: ["pop"],
  bpm: 120,
  key: "C Maj",
  timeSignature: "4/4",
  duration: 60,
  instruments: ["piano"],
  mood: "cheerful",
};

const initialState: AiState = {
  request: { ...defaultRequest },
  generatedClips: [],
  history: [],
  isGenerating: false,
  previewClipId: undefined,
  previewPositionMs: 0,
  error: undefined,
};

let state = initialState;
let previewIntervalId: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

const emitChange = () => {
  listeners.forEach((listener) => listener());
};

const setState = (updater: (prev: AiState) => AiState) => {
  const next = updater(state);
  if (next === state) return;
  state = next;
  emitChange();
};

const setRequest = (patch: Partial<Audio.GenerationRequest>) => {
  setState((prev) => ({
    ...prev,
    request: { ...prev.request, ...patch },
  }));
};

const toggleGenre = (genre: string) => {
  setState((prev) => {
    const exists = prev.request.genres.includes(genre);
    const genres = exists
      ? prev.request.genres.filter((g) => g !== genre)
      : [...prev.request.genres, genre];
    return {
      ...prev,
      request: { ...prev.request, genres: genres.length ? genres : ["pop"] },
    };
  });
};

const toggleInstrument = (instrument: string) => {
  setState((prev) => {
    const exists = prev.request.instruments.includes(instrument);
    const instruments = exists
      ? prev.request.instruments.filter((i) => i !== instrument)
      : [...prev.request.instruments, instrument];
    return {
      ...prev,
      request: {
        ...prev.request,
        instruments: instruments.length ? instruments : ["piano"],
      },
    };
  });
};

const generate = async (
  sdk: FatNotesPluginSDK,
  audioId: string,
): Promise<void> => {
  setState((prev) => ({
    ...prev,
    isGenerating: true,
    error: undefined,
    generatedClips: [],
  }));
  try {
    const result = await sdk.backend.invoke<Audio.GenerateAudioResponse>(
      "generateAudio",
      { audioId, request: state.request },
    );
    setState((prev) => ({
      ...prev,
      isGenerating: false,
      generatedClips: result?.clips || [],
      history: result?.historyEntry
        ? [...prev.history, result.historyEntry]
        : prev.history,
    }));
  } catch (err) {
    setState((prev) => ({
      ...prev,
      isGenerating: false,
      error: (err as Error)?.message || "Generate failed",
    }));
    throw err;
  }
};

const loadHistory = async (
  sdk: FatNotesPluginSDK,
  audioId: string,
): Promise<void> => {
  try {
    const result = await sdk.backend.invoke<Audio.AiHistoryResponse>(
      "listAiHistory",
      { audioId },
    );
    setState((prev) => ({
      ...prev,
      history: result?.items || [],
    }));
  } catch {
    // 静默失败：历史加载失败不阻塞 UI
  }
};

const clearHistory = async (
  sdk: FatNotesPluginSDK,
  audioId: string,
): Promise<void> => {
  await sdk.backend.invoke("clearAiHistory", { audioId });
  setState((prev) => ({ ...prev, history: [] }));
};

const clearPreviewInterval = () => {
  if (previewIntervalId !== null) {
    clearInterval(previewIntervalId);
    previewIntervalId = null;
  }
};

const previewClip = (id?: string) => {
  clearPreviewInterval();
  setState((prev) => ({
    ...prev,
    previewClipId: id,
    previewPositionMs: 0,
  }));
  if (id) {
    const target = state.generatedClips.find((c) => c.id === id);
    const total = (target?.durationSeconds || 0) * 1000;
    previewIntervalId = setInterval(() => {
      setState((prev) => {
        if (prev.previewClipId !== id) return prev;
        const next = prev.previewPositionMs + 100;
        if (next >= total) {
          clearPreviewInterval();
          return { ...prev, previewPositionMs: 0 };
        }
        return { ...prev, previewPositionMs: next };
      });
    }, 100);
  }
};

const seekPreview = (ms: number) => {
  setState((prev) => ({ ...prev, previewPositionMs: ms }));
};

const removeClip = (id: string) => {
  setState((prev) => {
    const generatedClips = prev.generatedClips.filter((c) => c.id !== id);
    return {
      ...prev,
      generatedClips,
      previewClipId:
        prev.previewClipId === id ? undefined : prev.previewClipId,
    };
  });
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => state;

const aiStore = {
  getState: getSnapshot,
  setRequest,
  toggleGenre,
  toggleInstrument,
  generate,
  loadHistory,
  clearHistory,
  previewClip,
  seekPreview,
  removeClip,
  subscribe,
};

const useAiStore = () => useSyncExternalStore(subscribe, getSnapshot);

export type { AiState };
export { aiStore, useAiStore };
