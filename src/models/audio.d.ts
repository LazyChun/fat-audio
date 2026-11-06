declare namespace Audio {
  /** 工程列表元数据（audios.json 条目） */
  interface Item {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
  }

  /** 工程完整详情（audios/<id>/audio.json） */
  interface Project {
    id: string;
    name: string;
    description?: string;
    bpm: number;
    key: string;
    timeSignature: string;
    duration: number;
    tracks: Track[];
    score: Score;
    mixer: MixerState;
    settings: ProjectSettings;
    createdAt: string;
    updatedAt: string;
  }

  /** 混音器顶层 */
  interface MixerState {
    channels: MixerChannel[];
    master: MixerChannel;
  }

  /** 主工作区的一条轨道 */
  interface Track {
    id: string;
    key: string;
    name: string;
    color: string;
    colorVar: string;
    volume: number;
    muted: boolean;
    solo: boolean;
    sortOrder: number;
    notes: Note[];
    mixerChannel: MixerChannel;
    createdAt: string;
    updatedAt: string;
  }

  /** 钢琴卷帘中的 MIDI 音符块 */
  interface Note {
    id: string;
    trackId: string;
    pitch: number;
    startBeat: number;
    durationBeats: number;
    velocity: number;
    createdAt: string;
    updatedAt: string;
  }

  /** 乐谱配置 */
  interface Score {
    instrument: string;
    keySignature: string;
    timeSignature: string;
    clef: "treble" | "bass" | "alto";
    measures: number;
    measuresPerLine: number;
    displayPrefs: {
      showNoteNames: boolean;
      showFingering: boolean;
      showDynamics: boolean;
    };
    notes: ScoreNote[];
  }

  /** 谱面上的一个音符 */
  interface ScoreNote {
    id: string;
    pitch: number;
    measure: number;
    beat: number;
    duration: "whole" | "half" | "quarter" | "eighth" | "sixteenth" | "dotted";
    accidental: "none" | "sharp" | "flat" | "natural";
    velocity: number;
    tie: boolean;
    /** 休止符：true 时 pitch 被忽略 */
    isRest?: boolean;
  }

  /** 调音台通道条 */
  interface MixerChannel {
    id: string;
    name: string;
    color: string;
    pan: number;
    volume: number;
    levelL: number;
    levelR: number;
  }

  /** ADSR + 滤波 + 效果 */
  interface ToneParams {
    octave: number;
    fineTuning: number;
    pitchBend: number;
    attack: number;
    decay: number;
    sustain: number;
    release: number;
    cutoff: number;
    resonance: number;
    reverb: number;
    chorus: number;
    delay: number;
    pan: number;
  }

  /** 保存的乐器预设 */
  interface InstrumentPreset {
    id: string;
    name: string;
    params: ToneParams;
    createdAt: string;
  }

  /** 工程级设置（audios/<id>/settings.json） */
  interface ProjectSettings {
    instrumentConfig: Record<string, unknown>;
    toneParams: ToneParams;
    displayPrefs?: Record<string, unknown>;
  }

  /** AI 生成请求 */
  interface GenerationRequest {
    prompt: string;
    genres: string[];
    bpm: number;
    key: string;
    timeSignature: string;
    duration: number;
    instruments: string[];
    mood: string;
  }

  /** 生成的音频片段（mock） */
  interface GeneratedClip {
    id: string;
    title: string;
    durationSeconds: number;
    waveform: number[];
    genres: string[];
    createdAt: string;
  }

  /** AI 历史记录条目（audios/<id>/aiHistory.json） */
  interface GenerationHistoryEntry {
    id: string;
    request: GenerationRequest;
    clipIds: string[];
    createdAt: string;
  }

  /** 插件级配置（sdk.config） */
  interface PluginConfig {
    workspaceRoot?: string;
    lastAudioId?: string;
    defaultParams?: {
      bpm: number;
      key: string;
      timeSignature: string;
      instruments: string[];
      mood: string;
    };
    realAi?: boolean;
  }

  /** 后端响应类型 */
  interface AudioListResponse {
    items: Item[];
    filePath: string;
  }
  interface AudioDetailResponse {
    audio: Project;
    filePath: string;
  }
  interface GenerateAudioResponse {
    clips: GeneratedClip[];
    historyEntry: GenerationHistoryEntry;
  }
  interface AiHistoryResponse {
    items: GenerationHistoryEntry[];
    filePath: string;
  }
  interface PresetsListResponse {
    items: InstrumentPreset[];
    filePath: string;
  }
}
