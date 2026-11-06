"""工程详情（audio.json）读写服务。镜像 fat-cut 的 projectService.py。"""

import json
from pathlib import Path

from plugin_runtime import handler
from service.init.initAudioService import (
    AUDIO_FILE_NAME,
    _write_json,
    get_audio_dir_by_id,
    require_audio_record,
    touch_audio_record,
)


def get_audio_file(audio_id: str) -> Path:
    return get_audio_dir_by_id(audio_id) / AUDIO_FILE_NAME


def ensure_audio_storage(audio_id: str) -> Path:
    audio_folder = get_audio_dir_by_id(audio_id)
    audio_folder.mkdir(parents=True, exist_ok=True)
    return audio_folder


def read_audio(audio_id: str) -> dict | None:
    audio_file = get_audio_file(audio_id)
    if not audio_file.exists():
        return None
    content = audio_file.read_text(encoding="utf-8").strip()
    if not content:
        return None
    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        # 解析失败时不覆盖原文件，保留数据以便恢复
        return None
    if not isinstance(data, dict):
        return None
    return data


def write_audio(audio_id: str, audio: dict) -> None:
    ensure_audio_storage(audio_id)
    _write_json(get_audio_file(audio_id), audio)


@handler("getAudio")
def get_audio(params):
    """读取工程完整配置。"""
    audio_id = str((params or {}).get("id") or "").strip()
    if not audio_id:
        raise ValueError("id is required")
    require_audio_record(audio_id)
    audio = read_audio(audio_id)
    if audio is None:
        raise ValueError(f"Audio file not found or corrupted for id {audio_id}")
    return {
        "audio": audio,
        "filePath": str(get_audio_file(audio_id)),
    }


@handler("saveAudio")
def save_audio(params):
    """保存工程完整配置（原子写）。"""
    if not isinstance(params, dict):
        raise ValueError("params must be a dict")
    audio = params.get("audio")
    if not isinstance(audio, dict):
        raise ValueError("audio is required")
    audio_id = str(audio.get("id") or "").strip()
    if not audio_id:
        raise ValueError("audio.id is required")
    require_audio_record(audio_id)

    # 更新 updatedAt
    from service.init.initAudioService import _now_iso
    audio["updatedAt"] = _now_iso()
    write_audio(audio_id, audio)

    # 同步列表元数据
    touch_audio_record(audio_id, audio.get("name"))

    return {
        "audio": audio,
        "filePath": str(get_audio_file(audio_id)),
    }
