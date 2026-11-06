"""
FatNotes Bespoke Plugin — fat-audio Backend Entry Point

AI Music Studio 后端：工程配置 CRUD + 工程详情读写 + 设置/预设/AI 历史 + mock 生成。
前端通过 sdk.backend.invoke("handlerName", params) 调用。
"""

from plugin_runtime import (
    handler,
    run,
    host_get_login_info,
    host_get_plugin_config,
    host_set_plugin_config,
    host_get_system_paths,
)

# 导入即注册 @handler（getAudio / saveAudio / getAudioSettings / ... / generateAudio）
from service.audioProjectService import audioProjectService as _audio_project_service  # noqa: F401
from service.audioSettingsService import audioSettingsService as _audio_settings_service  # noqa: F401
from service.aiService import aiService as _ai_service  # noqa: F401

from service.init.initAudioService import (
    create_audio_record,
    delete_audio_record,
    get_audios_file,
    read_audios,
    reorder_audios,
    update_audio_record,
)


@handler("getSystemPaths")
def get_system_paths(_params):
    return host_get_system_paths()


@handler("getLoginInfo")
def get_login_info(_params):
    return host_get_login_info()


@handler("getPluginConfig")
def get_plugin_config(_params):
    return host_get_plugin_config()


@handler("setPluginConfig")
def set_plugin_config(params):
    config_data = params.get("config", {}) if isinstance(params, dict) else {}
    merge = True
    if isinstance(params, dict):
        merge = bool(params.get("merge", True))
    return host_set_plugin_config(config_data, merge=merge)


# ── 工程列表 CRUD ──────────────────────────────────────────────


@handler("listAudios")
def list_audios(_params):
    """读取工程列表。"""
    items = read_audios()
    return {
        "items": items,
        "filePath": str(get_audios_file()),
    }


@handler("createAudio")
def create_audio(params):
    """新建工程（初始化 audio.json + 默认 8 条轨道 + 默认 score/mixer/settings）。"""
    return create_audio_record(params if isinstance(params, dict) else None)


@handler("updateAudio")
def update_audio(params):
    """更新工程列表元数据（name/description）。"""
    return update_audio_record(params if isinstance(params, dict) else None)


@handler("deleteAudio")
def delete_audio(params):
    """删除工程（列表记录 + audios/<id>/ 目录）。"""
    return delete_audio_record(params if isinstance(params, dict) else None)


@handler("reorderAudios")
def reorder_audios_handler(params):
    """按给定 id 顺序重排工程列表。"""
    return reorder_audios(params if isinstance(params, dict) else None)


if __name__ == "__main__":
    run()
