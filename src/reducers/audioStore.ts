import { useSyncExternalStore } from "react";
import type { FatNotesPluginSDK } from "fat-notes-sdk";
import { genId } from "utils";

type LoadingStatus = "idle" | "loading" | "succeeded" | "failed";

interface AudioState {
  audios: Audio.Item[];
  selectedAudioId?: string;
  currentProject?: Audio.Project;
  loadingStatus: LoadingStatus;
  isDirty: boolean;
  isEditModalOpen: boolean;
  editingAudio?: Audio.Item;
  scorePast: Audio.Score[];
  scoreFuture: Audio.Score[];
}

const initialState: AudioState = {
  audios: [],
  selectedAudioId: undefined,
  currentProject: undefined,
  loadingStatus: "idle",
  isDirty: false,
  isEditModalOpen: false,
  editingAudio: undefined,
  scorePast: [],
  scoreFuture: [],
};

const SCORE_HISTORY_CAP = 50;
const SCORE_HISTORY_DEBOUNCE_MS = 300;
let lastPushAt = 0;

let state = initialState;
let loadingPromise: Promise<Audio.Item[]> | null = null;
const listeners = new Set<() => void>();

const emitChange = () => {
  listeners.forEach((listener) => listener());
};

const setState = (updater: (prev: AudioState) => AudioState) => {
  const next = updater(state);
  if (next === state) return;
  state = next;
  emitChange();
};

const setLoadingStatus = (loadingStatus: LoadingStatus) => {
  setState((prev) =>
    prev.loadingStatus === loadingStatus ? prev : { ...prev, loadingStatus },
  );
};

const setAudios = (audios: Audio.Item[]) => {
  setState((prev) => {
    const hasSelected = prev.selectedAudioId
      ? audios.some((a) => a.id === prev.selectedAudioId)
      : false;
    return {
      ...prev,
      audios,
      selectedAudioId: hasSelected ? prev.selectedAudioId : undefined,
    };
  });
};

const selectAudio = (selectedAudioId?: string) => {
  setState((prev) =>
    prev.selectedAudioId === selectedAudioId
      ? prev
      : { ...prev, selectedAudioId },
  );
};

const setCurrentProject = (currentProject?: Audio.Project) => {
  setState((prev) => ({
    ...prev,
    currentProject,
    isDirty: false,
    scorePast: [],
    scoreFuture: [],
  }));
};

/** 快照当前 score 入历史栈（带防抖，合并拖拽/连续按键） */
const pushScoreHistory = () => {
  if (!state.currentProject) return;
  const now = Date.now();
  if (now - lastPushAt < SCORE_HISTORY_DEBOUNCE_MS) return;
  lastPushAt = now;
  const snapshot = state.currentProject.score;
  setState((prev) => {
    const past = [...prev.scorePast, snapshot];
    if (past.length > SCORE_HISTORY_CAP) past.shift();
    return { ...prev, scorePast: past, scoreFuture: [] };
  });
};

const undoScore = () => {
  setState((prev) => {
    if (!prev.currentProject || prev.scorePast.length === 0) return prev;
    const past = [...prev.scorePast];
    const prevScore = past.pop()!;
    const future = [prev.currentProject.score, ...prev.scoreFuture];
    lastPushAt = 0;
    return {
      ...prev,
      currentProject: {
        ...prev.currentProject,
        score: prevScore,
      },
      scorePast: past,
      scoreFuture: future,
      isDirty: true,
    };
  });
};

const redoScore = () => {
  setState((prev) => {
    if (!prev.currentProject || prev.scoreFuture.length === 0) return prev;
    const future = [...prev.scoreFuture];
    const nextScore = future.shift()!;
    const past = [...prev.scorePast, prev.currentProject.score];
    lastPushAt = 0;
    return {
      ...prev,
      currentProject: {
        ...prev.currentProject,
        score: nextScore,
      },
      scorePast: past,
      scoreFuture: future,
      isDirty: true,
    };
  });
};

const markDirty = () => {
  setState((prev) => (prev.isDirty ? prev : { ...prev, isDirty: true }));
};

const clearDirty = () => {
  setState((prev) => (prev.isDirty ? { ...prev, isDirty: false } : prev));
};

const setEditModalOpen = (isOpen: boolean) => {
  setState((prev) =>
    prev.isEditModalOpen === isOpen
      ? prev
      : {
          ...prev,
          isEditModalOpen: isOpen,
          editingAudio: isOpen ? prev.editingAudio : undefined,
        },
  );
};

const setEditingAudio = (audio?: Audio.Item) => {
  setState((prev) => ({ ...prev, editingAudio: audio }));
};

const loadAudios = async (sdk: FatNotesPluginSDK): Promise<Audio.Item[]> => {
  if (loadingPromise) return loadingPromise;
  setLoadingStatus("loading");
  loadingPromise = sdk.backend
    .invoke<Audio.AudioListResponse>("listAudios")
    .then((result) => {
      const items = result?.items || [];
      setAudios(items);
      setLoadingStatus("succeeded");
      return items;
    })
    .catch((error) => {
      setAudios([]);
      setLoadingStatus("failed");
      throw error;
    })
    .finally(() => {
      loadingPromise = null;
    });
  return loadingPromise;
};

const loadProject = async (
  sdk: FatNotesPluginSDK,
  audioId: string,
): Promise<Audio.Project> => {
  const result = await sdk.backend.invoke<Audio.AudioDetailResponse>(
    "getAudio",
    { id: audioId },
  );
  const project = result?.audio;
  if (!project) {
    throw new Error("Project not found");
  }
  setCurrentProject(project);
  selectAudio(audioId);
  await sdk.config.set({ lastAudioId: audioId }, { merge: true });
  return project;
};

const saveProject = async (
  sdk: FatNotesPluginSDK,
): Promise<Audio.Project | undefined> => {
  if (!state.currentProject) return undefined;
  const result = await sdk.backend.invoke<Audio.AudioDetailResponse>(
    "saveAudio",
    { audio: state.currentProject },
  );
  const saved = result?.audio;
  if (saved) {
    setCurrentProject(saved);
  }
  clearDirty();
  return saved;
};

const createAudio = async (
  sdk: FatNotesPluginSDK,
  params: { name: string; description?: string },
): Promise<Audio.Item> => {
  const item = await sdk.backend.invoke<Audio.Item>("createAudio", params);
  await loadAudios(sdk);
  await loadProject(sdk, item.id);
  return item;
};

const updateAudioMeta = async (
  sdk: FatNotesPluginSDK,
  params: { id: string; name?: string; description?: string },
): Promise<Audio.Item> => {
  const updated = await sdk.backend.invoke<Audio.Item>("updateAudio", params);
  await loadAudios(sdk);
  return updated;
};

const deleteAudio = async (
  sdk: FatNotesPluginSDK,
  audioId: string,
): Promise<void> => {
  await sdk.backend.invoke("deleteAudio", { id: audioId });
  if (state.selectedAudioId === audioId) {
    setCurrentProject(undefined);
    selectAudio(undefined);
    await sdk.config.set({ lastAudioId: undefined }, { merge: true });
  }
  await loadAudios(sdk);
};

const reorderAudios = async (
  sdk: FatNotesPluginSDK,
  ids: string[],
): Promise<void> => {
  const result = await sdk.backend.invoke<Audio.AudioListResponse>(
    "reorderAudios",
    { ids },
  );
  setAudios(result?.items || []);
};

const closeProject = async (sdk: FatNotesPluginSDK): Promise<void> => {
  setCurrentProject(undefined);
  selectAudio(undefined);
  await sdk.config.set({ lastAudioId: undefined }, { merge: true });
};

// ── currentProject mutations ────────────────────────────────────────

const updateTrack = (trackId: string, patch: Partial<Audio.Track>) => {
  setState((prev) => {
    if (!prev.currentProject) return prev;
    const tracks = prev.currentProject.tracks.map((t) =>
      t.id === trackId
        ? { ...t, ...patch, updatedAt: new Date().toISOString() }
        : t,
    );
    return {
      ...prev,
      currentProject: { ...prev.currentProject, tracks },
      isDirty: true,
    };
  });
};

const toggleTrackMute = (trackId: string) => {
  setState((prev) => {
    if (!prev.currentProject) return prev;
    const tracks = prev.currentProject.tracks.map((t) =>
      t.id === trackId ? { ...t, muted: !t.muted } : t,
    );
    return {
      ...prev,
      currentProject: { ...prev.currentProject, tracks },
      isDirty: true,
    };
  });
};

const toggleTrackSolo = (trackId: string) => {
  setState((prev) => {
    if (!prev.currentProject) return prev;
    const tracks = prev.currentProject.tracks.map((t) =>
      t.id === trackId ? { ...t, solo: !t.solo } : t,
    );
    return {
      ...prev,
      currentProject: { ...prev.currentProject, tracks },
      isDirty: true,
    };
  });
};

const setTrackVolume = (trackId: string, volume: number) => {
  setState((prev) => {
    if (!prev.currentProject) return prev;
    const tracks = prev.currentProject.tracks.map((t) =>
      t.id === trackId
        ? { ...t, volume, mixerChannel: { ...t.mixerChannel, volume } }
        : t,
    );
    return {
      ...prev,
      currentProject: { ...prev.currentProject, tracks },
      isDirty: true,
    };
  });
};

const addPianoRollNote = (
  trackId: string,
  note: Omit<Audio.Note, "id" | "trackId" | "createdAt" | "updatedAt">,
) => {
  setState((prev) => {
    if (!prev.currentProject) return prev;
    const now = new Date().toISOString();
    const newNote: Audio.Note = {
      ...note,
      id: genId(),
      trackId,
      createdAt: now,
      updatedAt: now,
    };
    const tracks = prev.currentProject.tracks.map((t) =>
      t.id === trackId ? { ...t, notes: [...t.notes, newNote] } : t,
    );
    return {
      ...prev,
      currentProject: { ...prev.currentProject, tracks },
      isDirty: true,
    };
  });
};

const updatePianoRollNote = (noteId: string, patch: Partial<Audio.Note>) => {
  setState((prev) => {
    if (!prev.currentProject) return prev;
    const tracks = prev.currentProject.tracks.map((t) => ({
      ...t,
      notes: t.notes.map((n) =>
        n.id === noteId
          ? { ...n, ...patch, updatedAt: new Date().toISOString() }
          : n,
      ),
    }));
    return {
      ...prev,
      currentProject: { ...prev.currentProject, tracks },
      isDirty: true,
    };
  });
};

const deletePianoRollNote = (noteId: string) => {
  setState((prev) => {
    if (!prev.currentProject) return prev;
    const tracks = prev.currentProject.tracks.map((t) => ({
      ...t,
      notes: t.notes.filter((n) => n.id !== noteId),
    }));
    return {
      ...prev,
      currentProject: { ...prev.currentProject, tracks },
      isDirty: true,
    };
  });
};

const addScoreNote = (note: Omit<Audio.ScoreNote, "id">) => {
  pushScoreHistory();
  setState((prev) => {
    if (!prev.currentProject) return prev;
    const newNote: Audio.ScoreNote = { ...note, id: genId() };
    return {
      ...prev,
      currentProject: {
        ...prev.currentProject,
        score: {
          ...prev.currentProject.score,
          notes: [...prev.currentProject.score.notes, newNote],
        },
      },
      isDirty: true,
    };
  });
};

const updateScoreNote = (id: string, patch: Partial<Audio.ScoreNote>) => {
  pushScoreHistory();
  setState((prev) => {
    if (!prev.currentProject) return prev;
    const notes = prev.currentProject.score.notes.map((n) =>
      n.id === id ? { ...n, ...patch } : n,
    );
    return {
      ...prev,
      currentProject: {
        ...prev.currentProject,
        score: { ...prev.currentProject.score, notes },
      },
      isDirty: true,
    };
  });
};

const deleteScoreNote = (id: string) => {
  pushScoreHistory();
  setState((prev) => {
    if (!prev.currentProject) return prev;
    const notes = prev.currentProject.score.notes.filter((n) => n.id !== id);
    return {
      ...prev,
      currentProject: {
        ...prev.currentProject,
        score: { ...prev.currentProject.score, notes },
      },
      isDirty: true,
    };
  });
};

const updateMixerChannel = (id: string, patch: Partial<Audio.MixerChannel>) => {
  setState((prev) => {
    if (!prev.currentProject) return prev;
    const channels = prev.currentProject.mixer.channels.map((c) =>
      c.id === id ? { ...c, ...patch } : c,
    );
    return {
      ...prev,
      currentProject: {
        ...prev.currentProject,
        mixer: { ...prev.currentProject.mixer, channels },
      },
      isDirty: true,
    };
  });
};

const updateMixerMaster = (patch: Partial<Audio.MixerChannel>) => {
  setState((prev) => {
    if (!prev.currentProject) return prev;
    return {
      ...prev,
      currentProject: {
        ...prev.currentProject,
        mixer: {
          ...prev.currentProject.mixer,
          master: { ...prev.currentProject.mixer.master, ...patch },
        },
      },
      isDirty: true,
    };
  });
};

const updateScore = (patch: Partial<Audio.Score>) => {
  pushScoreHistory();
  setState((prev) => {
    if (!prev.currentProject) return prev;
    return {
      ...prev,
      currentProject: {
        ...prev.currentProject,
        score: { ...prev.currentProject.score, ...patch },
      },
      isDirty: true,
    };
  });
};

const updateProjectMeta = (
  patch: Partial<
    Pick<
      Audio.Project,
      "bpm" | "key" | "timeSignature" | "name" | "description"
    >
  >,
) => {
  setState((prev) => {
    if (!prev.currentProject) return prev;
    return {
      ...prev,
      currentProject: { ...prev.currentProject, ...patch },
      isDirty: true,
    };
  });
};

const updateToneParams = (patch: Partial<Audio.ToneParams>) => {
  setState((prev) => {
    if (!prev.currentProject) return prev;
    return {
      ...prev,
      currentProject: {
        ...prev.currentProject,
        settings: {
          ...prev.currentProject.settings,
          toneParams: { ...prev.currentProject.settings.toneParams, ...patch },
        },
      },
      isDirty: true,
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

const audioStore = {
  getState: getSnapshot,
  loadAudios,
  selectAudio,
  loadProject,
  saveProject,
  createAudio,
  updateAudioMeta,
  deleteAudio,
  reorderAudios,
  closeProject,
  markDirty,
  setEditModalOpen,
  setEditingAudio,
  updateTrack,
  toggleTrackMute,
  toggleTrackSolo,
  setTrackVolume,
  addPianoRollNote,
  updatePianoRollNote,
  deletePianoRollNote,
  addScoreNote,
  updateScoreNote,
  deleteScoreNote,
  updateMixerChannel,
  updateMixerMaster,
  updateScore,
  updateProjectMeta,
  updateToneParams,
  undoScore,
  redoScore,
  subscribe,
};

const useAudioStore = () => useSyncExternalStore(subscribe, getSnapshot);

export type { LoadingStatus, AudioState };
export { audioStore, useAudioStore };
