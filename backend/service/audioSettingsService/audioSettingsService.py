"""工程级设置 / 预设 / AI 历史读写服务。

镜像 fat-pen 的 settingService.py 的分节 partial update 模式，
但使用 initAudioService 的原子写以保证一致性。
"""

import json
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from plugin_runtime import handler
from service.init.initAudioService import (
    _atomic_write,
    get_audio_dir_by_id,
)


SETTINGS_FILE_NAME = "settings.json"
PRESETS_FILE_NAME = "presets.json"
AI_HISTORY_FILE_NAME = "aiHistory.json"

VALID_SECTIONS = ("instrumentConfig", "toneParams", "displayPrefs")


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ── settings.json ───────────────────────────────────────────────


def _get_settings_file(audio_id: str) -> Path:
    audio_dir = get_audio_dir_by_id(audio_id)
    audio_dir.mkdir(parents=True, exist_ok=True)
    return audio_dir / SETTINGS_FILE_NAME


def _read_settings(audio_id: str) -> dict:
    settings_file = _get_settings_file(audio_id)
    if not settings_file.exists():
        return {}
    content = settings_file.read_text(encoding="utf-8").strip()
    if not content:
        return {}
    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        return {}
    return data if isinstance(data, dict) else {}


def _write_settings(audio_id: str, settings: dict) -> None:
    content = json.dumps(settings, ensure_ascii=False, indent=2)
    _atomic_write(_get_settings_file(audio_id), content)


@handler("getAudioSettings")
def get_audio_settings(params):
    if not isinstance(params, dict):
        raise ValueError("params must be a dict")
    audio_id = str(params.get("audioId") or "").strip()
    if not audio_id:
        raise ValueError("audioId is required")
    return _read_settings(audio_id)


@handler("saveAudioSettings")
def save_audio_settings(params):
    if not isinstance(params, dict):
        raise ValueError("params must be a dict")
    audio_id = str(params.get("audioId") or "").strip()
    if not audio_id:
        raise ValueError("audioId is required")
    settings = params.get("settings")
    if not isinstance(settings, dict):
        raise ValueError("settings must be a dict")
    _write_settings(audio_id, settings)
    return settings


@handler("updateAudioSettings")
def update_audio_settings(params):
    """部分更新某个 section（instrumentConfig / toneParams / displayPrefs）。"""
    if not isinstance(params, dict):
        raise ValueError("params must be a dict")
    audio_id = str(params.get("audioId") or "").strip()
    if not audio_id:
        raise ValueError("audioId is required")
    section = str(params.get("section") or "").strip()
    if section not in VALID_SECTIONS:
        raise ValueError(f"section must be one of {VALID_SECTIONS}")
    patch = params.get("patch")
    if not isinstance(patch, dict):
        raise ValueError("patch must be a dict")

    settings = _read_settings(audio_id)
    current = settings.get(section, {})
    if not isinstance(current, dict):
        current = {}
    current.update(patch)
    settings[section] = current
    _write_settings(audio_id, settings)
    return settings


# ── presets.json ────────────────────────────────────────────────


def _get_presets_file(audio_id: str) -> Path:
    audio_dir = get_audio_dir_by_id(audio_id)
    audio_dir.mkdir(parents=True, exist_ok=True)
    return audio_dir / PRESETS_FILE_NAME


def _read_presets(audio_id: str) -> list[dict]:
    presets_file = _get_presets_file(audio_id)
    if not presets_file.exists():
        return []
    content = presets_file.read_text(encoding="utf-8").strip()
    if not content:
        return []
    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        return []
    if not isinstance(data, list):
        return []
    return [p for p in data if isinstance(p, dict)]


def _write_presets(audio_id: str, presets: list[dict]) -> None:
    content = json.dumps(presets, ensure_ascii=False, indent=2)
    _atomic_write(_get_presets_file(audio_id), content)


@handler("listPresets")
def list_presets(params):
    if not isinstance(params, dict):
        raise ValueError("params must be a dict")
    audio_id = str(params.get("audioId") or "").strip()
    if not audio_id:
        raise ValueError("audioId is required")
    return {
        "items": _read_presets(audio_id),
        "filePath": str(_get_presets_file(audio_id)),
    }


@handler("savePreset")
def save_preset(params):
    if not isinstance(params, dict):
        raise ValueError("params must be a dict")
    audio_id = str(params.get("audioId") or "").strip()
    if not audio_id:
        raise ValueError("audioId is required")
    preset = params.get("preset")
    if not isinstance(preset, dict):
        raise ValueError("preset must be a dict")

    presets = _read_presets(audio_id)
    preset_id = str(preset.get("id") or "").strip()
    if not preset_id:
        preset_id = uuid4().hex[:8]
        preset["id"] = preset_id
    if "createdAt" not in preset:
        preset["createdAt"] = _now_iso()

    # upsert by id
    target_idx = next(
        (i for i, p in enumerate(presets) if p.get("id") == preset_id), -1
    )
    if target_idx == -1:
        presets.append(preset)
    else:
        presets[target_idx] = preset
    _write_presets(audio_id, presets)
    return preset


@handler("deletePreset")
def delete_preset(params):
    if not isinstance(params, dict):
        raise ValueError("params must be a dict")
    audio_id = str(params.get("audioId") or "").strip()
    if not audio_id:
        raise ValueError("audioId is required")
    preset_id = str(params.get("presetId") or "").strip()
    if not preset_id:
        raise ValueError("presetId is required")

    presets = _read_presets(audio_id)
    target_idx = next(
        (i for i, p in enumerate(presets) if p.get("id") == preset_id), -1
    )
    if target_idx == -1:
        return {"deleted": False, "id": preset_id}
    presets.pop(target_idx)
    _write_presets(audio_id, presets)
    return {"deleted": True, "id": preset_id}


# ── aiHistory.json ──────────────────────────────────────────────


def _get_ai_history_file(audio_id: str) -> Path:
    audio_dir = get_audio_dir_by_id(audio_id)
    audio_dir.mkdir(parents=True, exist_ok=True)
    return audio_dir / AI_HISTORY_FILE_NAME


def _read_ai_history(audio_id: str) -> list[dict]:
    history_file = _get_ai_history_file(audio_id)
    if not history_file.exists():
        return []
    content = history_file.read_text(encoding="utf-8").strip()
    if not content:
        return []
    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        return []
    if not isinstance(data, list):
        return []
    return [e for e in data if isinstance(e, dict)]


def _write_ai_history(audio_id: str, items: list[dict]) -> None:
    content = json.dumps(items, ensure_ascii=False, indent=2)
    _atomic_write(_get_ai_history_file(audio_id), content)


def append_ai_history_entry(audio_id: str, entry: dict) -> list[dict]:
    """供 aiService 调用以追加历史记录。"""
    items = _read_ai_history(audio_id)
    items.append(entry)
    _write_ai_history(audio_id, items)
    return items


@handler("listAiHistory")
def list_ai_history(params):
    if not isinstance(params, dict):
        raise ValueError("params must be a dict")
    audio_id = str(params.get("audioId") or "").strip()
    if not audio_id:
        raise ValueError("audioId is required")
    return {
        "items": _read_ai_history(audio_id),
        "filePath": str(_get_ai_history_file(audio_id)),
    }


@handler("appendAiHistory")
def append_ai_history(params):
    if not isinstance(params, dict):
        raise ValueError("params must be a dict")
    audio_id = str(params.get("audioId") or "").strip()
    if not audio_id:
        raise ValueError("audioId is required")
    entry = params.get("entry")
    if not isinstance(entry, dict):
        raise ValueError("entry must be a dict")
    return append_ai_history_entry(audio_id, entry)


@handler("clearAiHistory")
def clear_ai_history(params):
    if not isinstance(params, dict):
        raise ValueError("params must be a dict")
    audio_id = str(params.get("audioId") or "").strip()
    if not audio_id:
        raise ValueError("audioId is required")
    _write_ai_history(audio_id, [])
    return {"cleared": True}
