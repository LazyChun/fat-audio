import type { FatNotesPluginSDK } from "fat-notes-sdk";
import { DEFAULT_PLUGIN_PARAMS } from "enums";

const DEFAULT_PLUGIN_CONFIG: Audio.PluginConfig = {
  workspaceRoot: undefined,
  lastAudioId: undefined,
  defaultParams: { ...DEFAULT_PLUGIN_PARAMS },
  realAi: false,
};

/** 读取插件配置（合并默认值） */
export const getPluginConfig = async (
  sdk: FatNotesPluginSDK,
): Promise<Audio.PluginConfig> => {
  const config = await sdk.config.get<Audio.PluginConfig>();
  return {
    ...DEFAULT_PLUGIN_CONFIG,
    ...(config || {}),
    defaultParams: { ...DEFAULT_PLUGIN_PARAMS, ...(config?.defaultParams || {}) },
  };
};

/** 更新插件配置（默认 merge） */
export const setPluginConfig = async (
  sdk: FatNotesPluginSDK,
  patch: Partial<Audio.PluginConfig>,
  merge = true,
): Promise<void> => {
  await sdk.config.set(patch as Record<string, unknown>, { merge });
};

export const getLastAudioId = async (
  sdk: FatNotesPluginSDK,
): Promise<string | undefined> => {
  const config = await getPluginConfig(sdk);
  return config.lastAudioId;
};

export const setLastAudioId = async (
  sdk: FatNotesPluginSDK,
  audioId: string,
): Promise<void> => {
  await setPluginConfig(sdk, { lastAudioId: audioId });
};

export const clearLastAudioId = async (
  sdk: FatNotesPluginSDK,
): Promise<void> => {
  await setPluginConfig(sdk, { lastAudioId: undefined });
};

export const getDefaultParams = async (sdk: FatNotesPluginSDK) => {
  const config = await getPluginConfig(sdk);
  return config.defaultParams || { ...DEFAULT_PLUGIN_PARAMS };
};

export const setDefaultParams = async (
  sdk: FatNotesPluginSDK,
  params: NonNullable<Audio.PluginConfig["defaultParams"]>,
): Promise<void> => {
  await setPluginConfig(sdk, { defaultParams: params });
};

export const getRealAiFlag = async (sdk: FatNotesPluginSDK): Promise<boolean> => {
  const config = await getPluginConfig(sdk);
  return config.realAi === true;
};

export const setRealAiFlag = async (
  sdk: FatNotesPluginSDK,
  on: boolean,
): Promise<void> => {
  await setPluginConfig(sdk, { realAi: on });
};
