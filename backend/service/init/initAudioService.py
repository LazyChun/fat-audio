"""
fat-audio 工作区根解析 + 工程列表 CRUD + 默认工程初始化。

镜像 fat-cut 的 initCutService.py：
- workspace root 解析优先级：进程缓存 → 插件配置 workspaceRoot →
  host_get_system_paths().lastClosedFolder → configAbsolutePath.parent → Path.cwd()
- 原子写：tempfile.mkstemp + os.replace
- JSON 解析失败不覆盖原文件，返回 []
"""

import json
import os
import shutil
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from plugin_runtime import (
    host_get_plugin_config,
    host_get_system_paths,
    host_set_plugin_config,
)


FAT_AUDIO_DIR_NAME = "fatAudio"
AUDIOS_FILE_NAME = "audios.json"
AUDIO_FILE_NAME = "audio.json"

WORKSPACE_ROOT_CONFIG_KEY = "workspaceRoot"

# 默认 8 条轨道（匹配设计稿主工作区）
DEFAULT_TRACKS = [
    {"key": "piano", "nameKey": "audio.track.piano", "color": "#6366f1", "colorVar": "var(--ams-track-piano)"},
    {"key": "drums", "nameKey": "audio.track.drums", "color": "#d97706", "colorVar": "var(--ams-track-drums)"},
    {"key": "guitar", "nameKey": "audio.track.guitar", "color": "#059669", "colorVar": "var(--ams-track-guitar)"},
    {"key": "bass", "nameKey": "audio.track.bass", "color": "#0891b2", "colorVar": "var(--ams-track-bass)"},
    {"key": "violin", "nameKey": "audio.track.violin", "color": "#e11d48", "colorVar": "var(--ams-track-violin)"},
    {"key": "synth", "nameKey": "audio.track.synth", "color": "#7c3aed", "colorVar": "var(--ams-track-synth)"},
    {"key": "vocals", "nameKey": "audio.track.vocals", "color": "#db2777", "colorVar": "var(--ams-track-vocals)"},
    {"key": "strings", "nameKey": "audio.track.strings", "color": "#ea580c", "colorVar": "var(--ams-track-strings)"},
]

DEFAULT_TONE_PARAMS = {
    "octave": 0,
    "fineTuning": 0,
    "pitchBend": 3,
    "attack": 10,
    "decay": 500,
    "sustain": 70,
    "release": 300,
    "cutoff": 8000,
    "resonance": 20,
    "reverb": 25,
    "chorus": 10,
    "delay": 0,
    "pan": 0,
}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


_cached_workspace_root: Path | None = None


def _resolve_workspace_root_from_host() -> Path | None:
    """根据宿主系统路径推导工作区根（不稳定，仅用于首次解析）。

    优先级：lastClosedFolder 在前，configAbsolutePath.parent 兜底。
    """
    try:
        system_paths = host_get_system_paths() or {}
    except Exception:
        system_paths = {}

    last_closed_folder = str(system_paths.get("lastClosedFolder") or "").strip()
    if last_closed_folder:
        return Path(last_closed_folder)

    config_absolute_path = str(system_paths.get("configAbsolutePath") or "").strip()
    if config_absolute_path:
        return Path(config_absolute_path).parent

    return None


def get_workspace_root() -> Path:
    """获取 fatAudio 工作区根目录。

    优先级：
    1. 进程缓存
    2. 插件配置中持久化的 workspaceRoot（保证跨重启稳定）
    3. 宿主系统路径（lastClosedFolder 优先，configAbsolutePath.parent 兜底）
    4. Path.cwd()

    首次解析后会写入插件配置，后续重启直接复用持久化值。
    """
    global _cached_workspace_root
    if _cached_workspace_root is not None:
        return _cached_workspace_root

    # 1. 读插件配置中的持久化值
    try:
        plugin_config = host_get_plugin_config() or {}
    except Exception:
        plugin_config = {}

    persisted = str(plugin_config.get(WORKSPACE_ROOT_CONFIG_KEY) or "").strip()
    if persisted:
        candidate = Path(persisted)
        try:
            candidate = candidate.resolve()
        except (OSError, RuntimeError):
            pass
        # 信任已持久化的值：只要目录存在即可，fatAudio 子目录可能尚未创建
        if candidate.exists() and candidate.is_dir():
            _cached_workspace_root = candidate
            return _cached_workspace_root

    # 2. 走宿主路径推导
    resolved = _resolve_workspace_root_from_host()
    if resolved is None:
        resolved = Path.cwd()

    try:
        resolved = resolved.resolve()
    except (OSError, RuntimeError):
        pass

    # 3. 持久化，保证下次重启仍指向同一目录
    try:
        host_set_plugin_config(
            {WORKSPACE_ROOT_CONFIG_KEY: str(resolved)}, merge=True
        )
    except Exception:
        pass

    _cached_workspace_root = resolved
    return _cached_workspace_root


def get_audio_dir() -> Path:
    return get_workspace_root() / FAT_AUDIO_DIR_NAME


def get_audios_file() -> Path:
    return get_audio_dir() / AUDIOS_FILE_NAME


def get_audios_data_dir() -> Path:
    return get_audio_dir() / "audios"


def get_audio_dir_by_id(audio_id: str) -> Path:
    return get_audios_data_dir() / audio_id


def _atomic_write(file_path: Path, content: str) -> None:
    dir_path = file_path.parent
    dir_path.mkdir(parents=True, exist_ok=True)
    fd, tmp_path = tempfile.mkstemp(suffix=".tmp", dir=str(dir_path))
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            f.write(content)
        os.replace(tmp_path, str(file_path))
    except Exception:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass
        raise


def _write_json(file_path: Path, data) -> None:
    content = json.dumps(data, ensure_ascii=False, indent=2)
    _atomic_write(file_path, content)


def write_audios(items: list[dict]) -> None:
    _write_json(get_audios_file(), items)


def ensure_audios_storage() -> Path:
    audio_dir = get_audio_dir()
    audio_dir.mkdir(parents=True, exist_ok=True)

    audios_file = get_audios_file()
    if not audios_file.exists():
        write_audios([])
        return audios_file

    content = audios_file.read_text(encoding="utf-8").strip()
    if not content:
        write_audios([])

    return audios_file


def read_audios() -> list[dict]:
    audios_file = ensure_audios_storage()
    content = audios_file.read_text(encoding="utf-8").strip()
    if not content:
        return []

    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        # 解析失败时不覆盖原文件，保留数据以便恢复
        return []

    if not isinstance(data, list):
        return []

    return [item for item in data if isinstance(item, dict)]


def require_audio_record(audio_id: str) -> dict:
    audio_id = str(audio_id or "").strip()
    if not audio_id:
        raise ValueError("audioId is required")

    audio = next(
        (item for item in read_audios() if item.get("id") == audio_id),
        None,
    )
    if not audio:
        raise ValueError(f"Audio with id {audio_id} not found")
    return audio


def _build_default_mixer_channel(track: dict, now: str) -> dict:
    return {
        "id": track["key"],
        "name": track["nameKey"],
        "color": track["color"],
        "pan": 0,
        "volume": 75,
        "levelL": 0.0,
        "levelR": 0.0,
    }


def _build_default_tracks(now: str) -> list[dict]:
    tracks: list[dict] = []
    for i, t in enumerate(DEFAULT_TRACKS):
        track_id = uuid4().hex[:8]
        tracks.append(
            {
                "id": track_id,
                "key": t["key"],
                "name": t["nameKey"],
                "color": t["color"],
                "colorVar": t["colorVar"],
                "volume": 75,
                "muted": False,
                "solo": False,
                "sortOrder": i,
                "notes": [],
                "mixerChannel": _build_default_mixer_channel(t, now),
                "createdAt": now,
                "updatedAt": now,
            }
        )
    return tracks


def _build_default_mixer(now: str) -> dict:
    channels = []
    for t in DEFAULT_TRACKS:
        channels.append(_build_default_mixer_channel(t, now))
    master = {
        "id": "master",
        "name": "MST",
        "color": "#6366f1",
        "pan": 0,
        "volume": 85,
        "levelL": 0.0,
        "levelR": 0.0,
    }
    return {"channels": channels, "master": master}


def _build_default_score() -> dict:
    return {
        "instrument": "piano",
        "keySignature": "C Maj",
        "timeSignature": "4/4",
        "clef": "treble",
        "measures": 16,
        "measuresPerLine": 4,
        "displayPrefs": {
            "showNoteNames": True,
            "showFingering": False,
            "showDynamics": True,
        },
        "notes": [],
    }


def _build_default_settings() -> dict:
    return {
        "instrumentConfig": {},
        "toneParams": dict(DEFAULT_TONE_PARAMS),
        "displayPrefs": {},
    }


def create_audio_record(params: dict | None) -> dict:
    audio_name = str(params.get("name") or "").strip() if isinstance(params, dict) else ""
    if not audio_name:
        raise ValueError("name is required")

    description = str(params.get("description") or "").strip() if isinstance(params, dict) else ""

    now = _now_iso()
    audio_id = uuid4().hex[:6]
    audio_item = {
        "id": audio_id,
        "name": audio_name,
        "description": description,
        "createdAt": now,
        "updatedAt": now,
    }

    # 创建 audios/<id> 目录并初始化 audio.json
    audio_folder = get_audio_dir_by_id(audio_id)
    audio_folder.mkdir(parents=True, exist_ok=True)

    full_audio = {
        "id": audio_id,
        "name": audio_name,
        "description": description,
        "bpm": 120,
        "key": "C Maj",
        "timeSignature": "4/4",
        "duration": 0,
        "tracks": _build_default_tracks(now),
        "score": _build_default_score(),
        "mixer": _build_default_mixer(now),
        "settings": _build_default_settings(),
        "createdAt": now,
        "updatedAt": now,
    }
    _write_json(audio_folder / AUDIO_FILE_NAME, full_audio)

    audios = read_audios()
    audios.append(audio_item)
    write_audios(audios)
    return audio_item


def update_audio_record(params: dict | None) -> dict:
    if not isinstance(params, dict):
        raise ValueError("params must be a dict")

    audio_id = str(params.get("id") or "").strip()
    if not audio_id:
        raise ValueError("id is required")

    audios = read_audios()
    target_idx = next(
        (i for i, a in enumerate(audios) if a.get("id") == audio_id), -1
    )
    if target_idx == -1:
        raise ValueError(f"Audio with id {audio_id} not found")

    audio = audios[target_idx]

    if "name" in params:
        name = str(params.get("name") or "").strip()
        if not name:
            raise ValueError("name is required")
        audio["name"] = name

    if "description" in params:
        audio["description"] = str(params.get("description") or "").strip()

    audio["updatedAt"] = _now_iso()
    write_audios(audios)
    return audio


def delete_audio_record(params: dict | None) -> dict:
    if not isinstance(params, dict):
        raise ValueError("params must be a dict")

    audio_id = str(params.get("id") or "").strip()
    if not audio_id:
        raise ValueError("id is required")

    audios = read_audios()
    target_idx = next(
        (i for i, a in enumerate(audios) if a.get("id") == audio_id), -1
    )
    if target_idx == -1:
        raise ValueError(f"Audio with id {audio_id} not found")

    deleted = audios.pop(target_idx)
    write_audios(audios)

    audio_folder = get_audio_dir_by_id(audio_id)
    if audio_folder.exists() and audio_folder.is_dir():
        shutil.rmtree(audio_folder)

    return deleted


def reorder_audios(params: dict | None) -> list[dict]:
    if not isinstance(params, dict):
        raise ValueError("params must be a dict")

    audio_ids = params.get("ids")
    if not isinstance(audio_ids, list):
        raise ValueError("ids must be a list")

    audios = read_audios()
    audios_dict = {a.get("id"): a for a in audios}

    new_audios = []
    for aid in audio_ids:
        if aid in audios_dict:
            new_audios.append(audios_dict[aid])

    existing_ids = set(audio_ids)
    for a in audios:
        if a.get("id") not in existing_ids:
            new_audios.append(a)

    write_audios(new_audios)
    return new_audios


def touch_audio_record(audio_id: str, name: str | None = None) -> None:
    """更新列表中工程的 updatedAt（与可选 name），不改动 audio.json。"""
    audio_id = str(audio_id or "").strip()
    if not audio_id:
        return
    audios = read_audios()
    target_idx = next(
        (i for i, a in enumerate(audios) if a.get("id") == audio_id), -1
    )
    if target_idx == -1:
        return
    if name is not None:
        audios[target_idx]["name"] = name
    audios[target_idx]["updatedAt"] = _now_iso()
    write_audios(audios)
